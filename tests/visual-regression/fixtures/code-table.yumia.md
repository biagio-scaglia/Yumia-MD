document "Golden Fixture — Code & Table"
  theme "terminal"
  aspectRatio "16:9"

slide "Code Heavy"
  heading "Code block density"
  code language="typescript"
    export function compile(source: string): Uint8Array {
      const ast = parse(source);
      return render(ast);
    }

slide "Table Heavy"
  heading "Structured data"
  table
    | Metric | Target | Actual |
    | Latency | < 50ms | 12ms |
    | Memory | < 100MB | 45MB |
    | Pages | 20 | 20 |
