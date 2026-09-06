#!/usr/bin/env python3
"""Rasterize Yumia PDF (and optionally PPTX via PowerPoint COM) for visual QA."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "tests" / "visual-regression" / "artifacts"


def compile_formats(source: Path, out_dir: Path) -> dict[str, Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    stem = source.stem.replace(".yumia", "")
    pdf_out = out_dir / f"{stem}.pdf"
    pptx_out = out_dir / f"{stem}.pptx"
    cli = ["pnpm", "yumia", "build", str(source), "--format", "pdf", "--out", str(pdf_out)]
    subprocess.check_call(cli, cwd=ROOT, shell=True)
    cli = ["pnpm", "yumia", "build", str(source), "--format", "pptx", "--out", str(pptx_out)]
    subprocess.check_call(cli, cwd=ROOT, shell=True)
    return {"pdf": pdf_out, "pptx": pptx_out}


def rasterize_pdf(pdf_path: Path, pages_dir: Path, zoom: float = 2.0) -> list[Path]:
    import pymupdf

    pages_dir.mkdir(parents=True, exist_ok=True)
    doc = pymupdf.open(pdf_path)
    paths: list[Path] = []
    for i, page in enumerate(doc):
        pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), alpha=False)
        out = pages_dir / f"pdf-page-{i + 1:02d}.png"
        pix.save(out)
        paths.append(out)
    doc.close()
    return paths


def validate_pptx(pptx_path: Path) -> dict:
    required = [
        "[Content_Types].xml",
        "ppt/presentation.xml",
        "ppt/_rels/presentation.xml.rels",
    ]
    with zipfile.ZipFile(pptx_path) as zf:
        names = set(zf.namelist())
        slides = sorted(n for n in names if n.startswith("ppt/slides/slide") and n.endswith(".xml"))
        missing = [r for r in required if r not in names]
        return {
            "valid_zip": True,
            "slide_count": len(slides),
            "missing": missing,
            "has_media": any(n.startswith("ppt/media/") for n in names),
        }


def rasterize_pptx_powerpoint(pptx_path: Path, pages_dir: Path) -> list[Path] | None:
    """Export PPTX slides to PNG via PowerPoint COM (Windows)."""
    try:
        import win32com.client  # type: ignore
    except ImportError:
        return None

    pages_dir.mkdir(parents=True, exist_ok=True)
    powerpoint = None
    presentation = None
    try:
        powerpoint = win32com.client.Dispatch("PowerPoint.Application")
        powerpoint.Visible = 1
        presentation = powerpoint.Presentations.Open(str(pptx_path.resolve()), WithWindow=False)
        # 18 = ppSaveAsPNG
        export_dir = pages_dir / "_pptx_export"
        if export_dir.exists():
            shutil.rmtree(export_dir)
        export_dir.mkdir(parents=True, exist_ok=True)
        presentation.Export(str(export_dir), "PNG")
        presentation.Close()
        presentation = None
        powerpoint.Quit()
        powerpoint = None

        exported = sorted(
            export_dir.glob("*.PNG"),
            key=lambda p: [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", p.stem)],
        ) + sorted(
            export_dir.glob("*.png"),
            key=lambda p: [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", p.stem)],
        )
        # Prefer SlideN.PNG naming if present (natural order already applied).
        # PowerPoint sometimes writes each slide twice — dedupe by content hash.
        seen: set[bytes] = set()
        unique: list[Path] = []
        for src in exported:
            digest = src.read_bytes()
            if digest in seen:
                continue
            seen.add(digest)
            unique.append(src)
        paths: list[Path] = []
        for i, src in enumerate(unique):
            dest = pages_dir / f"pptx-slide-{i + 1:02d}.png"
            shutil.copy2(src, dest)
            paths.append(dest)
        shutil.rmtree(export_dir, ignore_errors=True)
        return paths
    except Exception as exc:  # noqa: BLE001
        print(f"PPTX rasterization unavailable: {exc}", file=sys.stderr)
        try:
            if presentation is not None:
                presentation.Close()
            if powerpoint is not None:
                powerpoint.Quit()
        except Exception:  # noqa: BLE001
            pass
        return None


def inspect_png(path: Path) -> dict:
    from PIL import Image

    img = Image.open(path).convert("RGB")
    # Sample corners + center for "blank page" heuristic
    w, h = img.size
    samples = [
        img.getpixel((2, 2)),
        img.getpixel((w - 3, 2)),
        img.getpixel((2, h - 3)),
        img.getpixel((w - 3, h - 3)),
        img.getpixel((w // 2, h // 2)),
    ]
    return {"file": path.name, "width": w, "height": h, "samples": [list(s)[:3] for s in samples]}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--source",
        type=Path,
        default=ROOT / "presentation.yumia.md",
        help="Yumia source file",
    )
    parser.add_argument("--skip-pptx-raster", action="store_true")
    args = parser.parse_args()

    run_dir = OUT / args.source.stem.replace(".yumia", "")
    if run_dir.exists():
        shutil.rmtree(run_dir)
    run_dir.mkdir(parents=True)

    print(f"Compiling {args.source} ...")
    outputs = compile_formats(args.source, run_dir)

    pptx_info = validate_pptx(outputs["pptx"])
    print("PPTX package:", json.dumps(pptx_info))

    pdf_pages = rasterize_pdf(outputs["pdf"], run_dir / "pdf-pages")
    print(f"PDF pages rasterized: {len(pdf_pages)}")

    pptx_pages: list[Path] | None = []
    if args.skip_pptx_raster:
        pptx_pages = None
        print("PPTX raster: SKIPPED")
    else:
        pptx_pages = rasterize_pptx_powerpoint(outputs["pptx"], run_dir / "pptx-pages")
        if pptx_pages is None:
            print("PPTX raster: NOT VERIFIED — PowerPoint COM unavailable or failed")
        else:
            print(f"PPTX slides rasterized: {len(pptx_pages)}")

    report = {
        "source": str(args.source),
        "pdf": str(outputs["pdf"]),
        "pptx": str(outputs["pptx"]),
        "pptx_package": pptx_info,
        "pdf_pages": [inspect_png(p) for p in pdf_pages],
        "pptx_pages": None
        if pptx_pages is None
        else [inspect_png(p) for p in pptx_pages],
    }
    report_path = run_dir / "qa-report.json"
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"Wrote {report_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
