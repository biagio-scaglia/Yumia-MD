import { DiagramElement, DiagramNode } from '@yumiamd/ast';

export interface DiagramLayoutResult {
  isLR: boolean;
  ranks: Record<string, number>;
  rankGroups: Record<number, string[]>;
  sortedRanks: number[];
  numRanks: number;
  maxLane: number;
  nodeWidth: number;
  nodeHeight: number;
  gapX: number;
  gapY: number;
  /** Required content height in the same unit system as `availableWidth`. */
  height: number;
  titleOffset: number;
  positions: Record<string, { x: number; y: number }>;
}

/**
 * Cycle-safe layered diagram layout shared by layout estimation and PDF/PPTX painters.
 * Uses longest-path ranking with a per-node visit budget so cyclic edges cannot hang.
 */
export function computeDiagramLayout(
  diagram: DiagramElement,
  availableWidth: number,
  isLR: boolean = (diagram.direction || 'LR').toUpperCase() === 'LR',
  options: { originX?: number; originY?: number; titleHeight?: number } = {}
): DiagramLayoutResult {
  const nodeIds = diagram.nodes.map((n) => n.id);
  const empty: DiagramLayoutResult = {
    isLR,
    ranks: {},
    rankGroups: {},
    sortedRanks: [],
    numRanks: 0,
    maxLane: 0,
    nodeWidth: 100,
    nodeHeight: 40,
    gapX: 35,
    gapY: 25,
    height: diagram.title ? 60 : 40,
    titleOffset: diagram.title ? (options.titleHeight ?? 28) : 0,
    positions: {},
  };

  if (nodeIds.length === 0) return empty;

  // Ignore orphan alias nodes (no incident edges) so variant directives can't spawn ghosts.
  const connected = new Set<string>();
  diagram.edges.forEach((e) => {
    connected.add(e.from);
    connected.add(e.to);
  });
  const activeIds = connected.size > 0 ? nodeIds.filter((id) => connected.has(id)) : nodeIds;
  if (activeIds.length === 0) return empty;

  const inDegree: Record<string, number> = {};
  const adj: Record<string, string[]> = {};
  activeIds.forEach((id) => {
    inDegree[id] = 0;
    adj[id] = [];
  });

  diagram.edges.forEach((e) => {
    if (!adj[e.from] || inDegree[e.to] === undefined) return;
    // Skip self-loops
    if (e.from === e.to) return;
    adj[e.from]!.push(e.to);
    inDegree[e.to]!++;
  });

  const ranks: Record<string, number> = {};
  const queue: string[] = [];
  const visitBudget = Math.max(4, activeIds.length * 2);
  const visits: Record<string, number> = {};

  activeIds.forEach((id) => {
    if (inDegree[id] === 0) {
      ranks[id] = 0;
      queue.push(id);
    }
  });

  // Fully cyclic graph: seed the first node
  if (queue.length === 0) {
    ranks[activeIds[0]!] = 0;
    queue.push(activeIds[0]!);
  }

  let steps = 0;
  const maxSteps = activeIds.length * activeIds.length + 8;
  while (queue.length > 0 && steps < maxSteps) {
    steps++;
    const u = queue.shift()!;
    visits[u] = (visits[u] || 0) + 1;
    if (visits[u]! > visitBudget) continue;

    const r = ranks[u] ?? 0;
    for (const v of adj[u] || []) {
      const nextR = Math.min(activeIds.length - 1, r + 1);
      if (ranks[v] === undefined || ranks[v]! < nextR) {
        ranks[v] = nextR;
        if ((visits[v] || 0) <= visitBudget) {
          queue.push(v);
        }
      }
    }
  }

  // Assign remaining nodes (unreachable / broken cycles) to stable ranks
  activeIds.forEach((id, idx) => {
    if (ranks[id] === undefined) {
      ranks[id] = Math.min(idx, activeIds.length - 1);
    }
  });

  const rankGroups: Record<number, string[]> = {};
  activeIds.forEach((id) => {
    const r = ranks[id] ?? 0;
    if (!rankGroups[r]) rankGroups[r] = [];
    rankGroups[r]!.push(id);
  });

  const sortedRanks = Object.keys(rankGroups)
    .map(Number)
    .sort((a, b) => a - b);
  const numRanks = Math.max(1, sortedRanks.length);
  let maxLane = 1;
  sortedRanks.forEach((r) => {
    maxLane = Math.max(maxLane, rankGroups[r]!.length);
  });

  const titleOffset = diagram.title ? (options.titleHeight ?? 28) : 0;
  const gapX = isLR ? 36 : 24;
  const gapY = isLR ? 22 : 32;

  // Prefer readable labels: use most of the available width across ranks.
  const nodeWidth = isLR
    ? Math.max(100, Math.min(260, (availableWidth - 48 - gapX * (numRanks - 1)) / numRanks))
    : Math.max(
        100,
        Math.min(220, (availableWidth - 48 - gapX * (maxLane - 1)) / Math.max(1, maxLane))
      );

  const activeNodes = diagram.nodes.filter((n) => activeIds.includes(n.id));
  const longestLabel = Math.max(1, ...activeNodes.map((n) => (n.label || n.id).length));
  const charsPerLine = Math.max(8, Math.floor((nodeWidth - 16) / 6.5));
  const labelLines = Math.max(1, Math.ceil(longestLabel / charsPerLine));
  const nodeHeight = Math.max(40, Math.min(84, 20 + labelLines * 16));

  const contentH = isLR
    ? maxLane * (nodeHeight + gapY) - gapY
    : numRanks * (nodeHeight + gapY) - gapY;
  const height = titleOffset + 24 + contentH + 16;

  const originX = options.originX ?? 0;
  const originY = options.originY ?? 0;
  const startY = originY + titleOffset;
  const maxLaneHeight = isLR
    ? maxLane * (nodeHeight + gapY) - gapY
    : numRanks * (nodeHeight + gapY) - gapY;
  const maxRankWidth = isLR
    ? numRanks * (nodeWidth + gapX) - gapX
    : maxLane * (nodeWidth + gapX) - gapX;

  const positions: Record<string, { x: number; y: number }> = {};
  sortedRanks.forEach((r, rIdx) => {
    const ids = rankGroups[r]!;
    if (isLR) {
      const colHeight = ids.length * (nodeHeight + gapY) - gapY;
      const offsetY = (maxLaneHeight - colHeight) / 2;
      ids.forEach((id, lIdx) => {
        positions[id] = {
          x: originX + 20 + rIdx * (nodeWidth + gapX),
          y: startY + 10 + offsetY + lIdx * (nodeHeight + gapY),
        };
      });
    } else {
      const rowWidth = ids.length * (nodeWidth + gapX) - gapX;
      const offsetX = (maxRankWidth - rowWidth) / 2;
      ids.forEach((id, lIdx) => {
        positions[id] = {
          x: originX + 20 + offsetX + lIdx * (nodeWidth + gapX),
          y: startY + 10 + rIdx * (nodeHeight + gapY),
        };
      });
    }
  });

  return {
    isLR,
    ranks,
    rankGroups,
    sortedRanks,
    numRanks,
    maxLane,
    nodeWidth,
    nodeHeight,
    gapX,
    gapY,
    height,
    titleOffset,
    positions,
  };
}

/** Orthogonal connector waypoints between two node boxes (avoids diagonal crossings). */
export function orthogonalEdgePoints(
  isLR: boolean,
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  nodeW: number,
  nodeH: number
): Array<{ x: number; y: number }> {
  const x1 = isLR ? p1.x + nodeW : p1.x + nodeW / 2;
  const y1 = isLR ? p1.y + nodeH / 2 : p1.y + nodeH;
  const x2 = isLR ? p2.x : p2.x + nodeW / 2;
  const y2 = isLR ? p2.y + nodeH / 2 : p2.y;

  // Same-rank / back edges: keep a short elbow so lines don't slice through nodes.
  if (isLR) {
    const midX = (x1 + x2) / 2;
    return [
      { x: x1, y: y1 },
      { x: midX, y: y1 },
      { x: midX, y: y2 },
      { x: x2, y: y2 },
    ];
  }
  const midY = (y1 + y2) / 2;
  return [
    { x: x1, y: y1 },
    { x: x1, y: midY },
    { x: x2, y: midY },
    { x: x2, y: y2 },
  ];
}

/** Fit a label into a node box with ellipsis when needed. */
export function fitDiagramLabel(label: string, maxChars: number): string {
  const clean = label.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxChars) return clean;
  if (maxChars <= 1) return '…';
  return `${clean.slice(0, Math.max(1, maxChars - 1))}…`;
}

export function estimateDiagramHeight(diagram: DiagramElement, width: number): number {
  const isLR = (diagram.direction || 'LR').toUpperCase() === 'LR';
  return computeDiagramLayout(diagram, width, isLR).height;
}

export function longestDiagramLabel(nodes: DiagramNode[]): number {
  return Math.max(1, ...nodes.map((n) => (n.label || n.id).length));
}
