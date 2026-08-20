"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ProbeNode = {
  id: string;
  kind: "token" | "feature" | "logit";
  label: string;
  position: number;
  layer?: number;
  feature?: number;
  activation?: number;
  directEffect?: number;
  role?: "direct" | "upstream";
  probability?: number;
  rank?: number;
  topActivations?: {
    activation: number;
    datasetIndex: number;
    peakPosition: number;
    peakToken: string;
    text: string;
    peakStart?: number;
    peakEnd?: number;
    prefixOmitted?: boolean;
    suffixOmitted?: boolean;
  }[];
};

type ProbeEdge = {
  id: string;
  source: string;
  target: string;
  weight: number;
  kind: "token" | "feature" | "logit" | "token-logit";
};

type ProbeGraph = {
  id: string;
  label: string;
  group: string;
  summary: string;
  prompt: string;
  source: string;
  filename: string;
  target: { token: string; vocabId: number; probability: number };
  nTokens: number;
  nLayers: number;
  fullFeatureCount: number;
  featureBudget: number;
  fullMatrixEntries: number;
  defaultNodeId: string;
  nodes: ProbeNode[];
  edges: ProbeEdge[];
};

type ProbePayload = {
  source: string;
  method: string;
  graphs: ProbeGraph[];
};

type TokenActivationTrack = {
  startPosition: number;
  endPosition: number;
  prefixOmitted: boolean;
  suffixOmitted: boolean;
  tokens: string[];
  activations: number[];
};

type TokenActivationPayload = {
  tracks: Record<string, TokenActivationTrack>;
};

type ScreenNode = { id: string; x: number; y: number };

const POSITIVE = "#90c78c";
const NEGATIVE = "#c9b8d4";
const SELECTED = "#ef00c8";
const INK = "#313431";
const QUIET = "#aeb3ae";

function signed(value: number) {
  const sign = value >= 0 ? "+" : "−";
  const magnitude = Math.abs(value);
  return `${sign}${magnitude >= 10 ? magnitude.toFixed(1) : magnitude.toFixed(3)}`;
}

function percent(value: number) {
  if (value >= 0.995) return `${(value * 100).toFixed(0)}%`;
  return `${(value * 100).toFixed(1)}%`;
}

function nodeDetail(node: ProbeNode) {
  if (node.kind === "feature") {
    return `Layer ${node.layer} · token ${node.position}`;
  }
  if (node.kind === "logit") {
    return `Output logit · rank ${node.rank}`;
  }
  return `Embedding · token ${node.position}`;
}

function neighborLabel(node: ProbeNode | undefined) {
  if (!node) return "Unknown node";
  if (node.kind === "token") return `“${node.label}”`;
  if (node.kind === "logit") return `“${node.label}” logit`;
  return node.label;
}

function activationValue(value: number) {
  return Math.abs(value) >= 100 ? value.toFixed(1) : value.toFixed(3);
}

function activationTrackKey(node: ProbeNode, datasetIndex: number) {
  return `${node.layer}:${node.feature}:${datasetIndex}`;
}

function tokenTint(activation: number, maximum: number) {
  if (!(activation > 0) || !(maximum > 0)) return "transparent";
  const ratio = Math.min(1, activation / maximum);
  const alpha = 0.1 + 0.8 * Math.pow(ratio, 0.72);
  return `rgba(241, 137, 18, ${alpha.toFixed(3)})`;
}

function ActivationExcerpt({
  text,
  peakToken,
  peakStart,
  peakEnd,
  prefixOmitted,
  suffixOmitted,
  track,
  scaleMaximum,
}: {
  text: string;
  peakToken: string;
  peakStart?: number;
  peakEnd?: number;
  prefixOmitted?: boolean;
  suffixOmitted?: boolean;
  track?: TokenActivationTrack;
  scaleMaximum: number;
}) {
  if (
    track &&
    track.tokens.length > 0 &&
    track.tokens.length === track.activations.length
  ) {
    return (
      <span className="probe-activation-token-run" aria-label={track.tokens.join("")}>
        {track.prefixOmitted ? <span aria-hidden="true">…</span> : null}
        {track.tokens.map((token, index) => {
          const activation = Number.isFinite(track.activations[index])
            ? Math.max(0, track.activations[index])
            : 0;
          const position = track.startPosition + index;
          return (
            <span
              aria-hidden="true"
              className={activation > 0 ? "probe-activation-token is-active" : "probe-activation-token"}
              key={`${position}-${index}`}
              style={{ backgroundColor: tokenTint(activation, scaleMaximum) }}
              title={`${token || "(empty token)"} · position ${position} · activation ${activationValue(activation)}`}
            >
              {token}
            </span>
          );
        })}
        {track.suffixOmitted ? <span aria-hidden="true">…</span> : null}
      </span>
    );
  }

  const hasExactSpan = peakStart !== undefined && peakEnd !== undefined && peakEnd > peakStart;
  const matchStart = hasExactSpan ? peakStart : peakToken ? text.indexOf(peakToken) : -1;
  if (matchStart < 0) return <>{text}</>;

  if (hasExactSpan) {
    return (
      <>
        {prefixOmitted ? "…" : null}
        {text.slice(0, peakStart)}
        <mark>{text.slice(peakStart, peakEnd)}</mark>
        {text.slice(peakEnd)}
        {suffixOmitted ? "…" : null}
      </>
    );
  }

  const contextBefore = 115;
  const contextAfter = 150;
  const excerptStart = Math.max(0, matchStart - contextBefore);
  const excerptEnd = Math.min(text.length, matchStart + peakToken.length + contextAfter);
  const before = text.slice(excerptStart, matchStart);
  const after = text.slice(matchStart + peakToken.length, excerptEnd);

  return (
    <>
      {excerptStart > 0 ? "…" : null}
      {before}
      <mark>{peakToken}</mark>
      {after}
      {excerptEnd < text.length ? "…" : null}
    </>
  );
}

function TopActivationSentences({
  node,
  tokenTracks,
}: {
  node: ProbeNode;
  tokenTracks: Record<string, TokenActivationTrack>;
}) {
  const examples = node.topActivations?.slice(0, 3) ?? [];
  const exampleTracks = examples.map(
    (example) => tokenTracks[activationTrackKey(node, example.datasetIndex)],
  );
  const scaleMaximum = Math.max(
    0,
    ...examples.map((example) => example.activation),
    ...exampleTracks.flatMap((track) => track?.activations ?? []),
  );
  const hasTokenTracks = exampleTracks.some(Boolean);

  return (
    <section className="probe-top-activations" aria-label="Top activation sentences">
      <div className="probe-activation-title">
        <h4>Top-activating OpenWebMath excerpts</h4>
        {examples.length > 0 ? <span>Top {examples.length}</span> : null}
      </div>
      {hasTokenTracks ? (
        <div className="probe-activation-scale" aria-label={`Token tint ranges from zero to ${activationValue(scaleMaximum)} activation`}>
          <span>token activation</span>
          <small>0</small>
          <i aria-hidden="true" />
          <small>{activationValue(scaleMaximum)}</small>
        </div>
      ) : null}
      {examples.length === 0 ? (
        <div className="probe-activation-empty">
          <strong>Examples unavailable</strong>
          <p>This graph export does not include dataset excerpts for this feature.</p>
        </div>
      ) : (
        <ol className="probe-activation-examples">
          {examples.map((example, index) => (
            <li key={`${example.datasetIndex}-${example.peakPosition}-${index}`}>
              <div className="probe-activation-meta">
                <span>Dataset #{example.datasetIndex.toLocaleString()}</span>
                <strong>activation {activationValue(example.activation)}</strong>
              </div>
              <p>
                <ActivationExcerpt
                  text={example.text}
                  peakToken={example.peakToken}
                  peakStart={example.peakStart}
                  peakEnd={example.peakEnd}
                  prefixOmitted={example.prefixOmitted}
                  suffixOmitted={example.suffixOmitted}
                  track={exampleTracks[index]}
                  scaleMaximum={scaleMaximum}
                />
              </p>
              <div className="probe-activation-peak">
                <span>Peak token</span>
                <code>{example.peakToken || "(unknown)"}</code>
                <small>position {example.peakPosition}</small>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function NeighborList({
  title,
  edges,
  direction,
  nodeById,
  onSelect,
}: {
  title: string;
  edges: ProbeEdge[];
  direction: "incoming" | "outgoing";
  nodeById: Map<string, ProbeNode>;
  onSelect: (id: string) => void;
}) {
  const visible = edges.slice(0, 11);
  const maximum = Math.max(...visible.map((edge) => Math.abs(edge.weight)), 1e-6);

  return (
    <div className="probe-neighbor-list">
      <h4>{title}</h4>
      {visible.length === 0 ? <p>No retained edges in this view.</p> : null}
      {visible.map((edge) => {
        const neighborId = direction === "incoming" ? edge.source : edge.target;
        const neighbor = nodeById.get(neighborId);
        const width = `${Math.max(4, (Math.abs(edge.weight) / maximum) * 100)}%`;
        return (
          <button key={edge.id} type="button" onClick={() => onSelect(neighborId)}>
            <i
              className={edge.weight < 0 ? "is-negative" : ""}
              style={{ width }}
              aria-hidden="true"
            />
            <span className={`probe-shape ${neighbor?.kind ?? "feature"}`} aria-hidden="true" />
            <span>{neighborLabel(neighbor)}</span>
            <small>{neighbor?.kind === "feature" ? `L${neighbor.layer}` : neighbor?.kind}</small>
            <strong>{signed(edge.weight)}</strong>
          </button>
        );
      })}
    </div>
  );
}

export default function InteractiveAttributionGraph() {
  const [payload, setPayload] = useState<ProbePayload | null>(null);
  const [tokenTracks, setTokenTracks] = useState<Record<string, TokenActivationTrack>>({});
  const [loadError, setLoadError] = useState(false);
  const [graphId, setGraphId] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0, stageWidth: 0 });
  const [incomingLimit, setIncomingLimit] = useState(3);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const screenNodesRef = useRef<ScreenNode[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/probe-graphs.json", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Probe graphs failed to load");
        return response.json() as Promise<ProbePayload>;
      })
      .then((result) => {
        setPayload(result);
        const initialGraph = result.graphs[0];
        setGraphId(initialGraph?.id ?? "");
        setSelectedId(initialGraph?.defaultNodeId ?? "");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadError(true);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/probe-token-activations.json", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Token activations failed to load");
        return response.json() as Promise<TokenActivationPayload>;
      })
      .then((result) => setTokenTracks(result.tracks ?? {}))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setTokenTracks({});
      });
    return () => controller.abort();
  }, []);

  const graph = useMemo(
    () => payload?.graphs.find((candidate) => candidate.id === graphId) ?? payload?.graphs[0] ?? null,
    [graphId, payload],
  );

  const nodeById = useMemo(
    () => new Map((graph?.nodes ?? []).map((node) => [node.id, node])),
    [graph],
  );

  const incoming = useMemo(() => {
    const result = new Map<string, ProbeEdge[]>();
    graph?.edges.forEach((edge) => {
      const list = result.get(edge.target) ?? [];
      list.push(edge);
      result.set(edge.target, list);
    });
    result.forEach((edges) => edges.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)));
    return result;
  }, [graph]);

  const outgoing = useMemo(() => {
    const result = new Map<string, ProbeEdge[]>();
    graph?.edges.forEach((edge) => {
      const list = result.get(edge.source) ?? [];
      list.push(edge);
      result.set(edge.source, list);
    });
    result.forEach((edges) => edges.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)));
    return result;
  }, [graph]);

  const visibleEdges = useMemo(() => {
    if (!graph) return [];
    const retained = new Set<string>();
    incoming.forEach((edges) => {
      edges.slice(0, incomingLimit).forEach((edge) => retained.add(edge.id));
    });
    graph.edges.forEach((edge) => {
      if (edge.source === selectedId || edge.target === selectedId) retained.add(edge.id);
    });
    return graph.edges.filter((edge) => retained.has(edge.id));
  }, [graph, incoming, incomingLimit, selectedId]);

  const selectedNode = nodeById.get(selectedId) ?? null;
  const hoveredNode = hoveredId ? nodeById.get(hoveredId) ?? null : null;
  const featureNodeCount = graph?.nodes.filter((node) => node.kind === "feature").length ?? 0;
  const tokenNodeCount = graph?.nodes.filter((node) => node.kind === "token").length ?? 0;
  const logitNodeCount = graph?.nodes.filter((node) => node.kind === "logit").length ?? 0;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage || !graph) return;

    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);

    const plotLeft = 48;
    const plotRight = width - 22;
    const logitFont = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
    const logitAngle = -Math.PI / 3.8;
    const logitNodes = graph.nodes.filter((node) => node.kind === "logit");
    const logitCount = Math.max(1, logitNodes.length);
    const logitPositionById = new Map(
      [...logitNodes]
        .sort(
          (left, right) =>
            (left.probability ?? 0) - (right.probability ?? 0) ||
            (right.rank ?? 0) - (left.rank ?? 0),
        )
        .map((node, index) => [node.id, index]),
    );
    context.font = logitFont;
    const maximumLogitLabelWidth = Math.max(
      0,
      ...logitNodes.map((node) =>
        context.measureText(`${node.label} ${percent(node.probability ?? 0)}`).width
      ),
    );
    const logitLabelHeight = Math.sin(Math.abs(logitAngle)) * maximumLogitLabelWidth;
    const logitLabelWidth = Math.cos(Math.abs(logitAngle)) * maximumLogitLabelWidth;
    const plotTop = Math.max(76, Math.ceil(logitLabelHeight) + 24);
    const featureTop = plotTop + 32;
    const tokenY = height - 78;
    const featureBottom = tokenY - 18;
    const tokenSpan = Math.max(1, graph.nTokens - 1);
    const logitRailRight = Math.max(plotLeft + 28, plotRight - logitLabelWidth - 8);
    const availableLogitWidth = Math.max(0, logitRailRight - plotLeft - 18);
    const logitSpread = Math.min(availableLogitWidth, Math.max(0, logitCount - 1) * 76);
    const logitRailLeft = logitRailRight - logitSpread;
    const tokenSpacingPixels = (plotRight - plotLeft) / tokenSpan;
    const featureGroups = new Map<string, ProbeNode[]>();
    graph.nodes.forEach((node) => {
      if (node.kind !== "feature") return;
      const key = `${node.position}:${node.layer}`;
      const group = featureGroups.get(key) ?? [];
      group.push(node);
      featureGroups.set(key, group);
    });
    const featureLayout = new Map<
      string,
      { x: number; yOffset: number; radius: number }
    >();
    featureGroups.forEach((group) => {
      group.sort(
        (left, right) =>
          (left.feature ?? 0) - (right.feature ?? 0) || left.id.localeCompare(right.id),
      );
      const baseX = plotLeft + (group[0].position / tokenSpan) * (plotRight - plotLeft);
      const desiredClusterWidth =
        graph.nTokens > 40
          ? Math.min(30, Math.max(18, tokenSpacingPixels * 3))
          : Math.min(140, Math.max(42, tokenSpacingPixels * 0.82));
      const clusterWidth = Math.min(desiredClusterWidth, Math.max(0, plotRight - plotLeft - 8));
      const clusterLeft = Math.max(
        plotLeft + 4,
        Math.min(baseX - clusterWidth / 2, plotRight - clusterWidth - 4),
      );
      const columnGap = 8;
      const rowGap = 7;
      const columns = Math.min(group.length, Math.max(1, Math.floor(clusterWidth / columnGap) + 1));
      const rows = Math.ceil(group.length / columns);
      const radius = rows > 1 ? 3 : 4;
      group.forEach((node, index) => {
        const row = Math.floor(index / columns);
        const column = index % columns;
        const rowCount = Math.min(columns, group.length - row * columns);
        const rowWidth = Math.max(0, rowCount - 1) * columnGap;
        const rowLeft = clusterLeft + (clusterWidth - rowWidth) / 2;
        featureLayout.set(node.id, {
          x: rowLeft + column * columnGap,
          yOffset: (row - (rows - 1) / 2) * rowGap,
          radius,
        });
      });
    });

    const position = (node: ProbeNode) => {
      if (node.kind === "logit") {
        const index = logitPositionById.get(node.id) ?? 0;
        const x = logitRailLeft + (index / Math.max(1, logitCount - 1)) * logitSpread;
        return { x, y: plotTop };
      }
      const x = plotLeft + (node.position / tokenSpan) * (plotRight - plotLeft);
      if (node.kind === "token") return { x, y: tokenY };
      const layer = node.layer ?? 0;
      const y = featureTop + ((33 - layer) / 33) * (featureBottom - featureTop);
      const layout = featureLayout.get(node.id);
      return { x: layout?.x ?? x, y: y + (layout?.yOffset ?? 0) };
    };

    context.font = "10px Inter, ui-sans-serif, sans-serif";
    context.textAlign = "right";
    context.textBaseline = "middle";
    for (let layer = 1; layer <= 33; layer += 2) {
      const y = featureTop + ((33 - layer) / 33) * (featureBottom - featureTop);
      context.strokeStyle = "rgba(31, 35, 31, 0.065)";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(plotLeft, y);
      context.lineTo(plotRight, y);
      context.stroke();
      context.fillStyle = "#858985";
      context.fillText(`L${layer}`, plotLeft - 8, y);
    }
    context.fillStyle = "#858985";
    context.fillText("Lgt", plotLeft - 8, plotTop);
    context.fillText("Emb", plotLeft - 8, tokenY);
    context.strokeStyle = "rgba(31, 35, 31, 0.18)";
    context.beginPath();
    context.moveTo(plotLeft, tokenY);
    context.lineTo(plotRight, tokenY);
    context.stroke();

    const positions = new Map(graph.nodes.map((node) => [node.id, position(node)]));
    const edgeMaximum = new Map<string, number>();
    visibleEdges.forEach((edge) => {
      edgeMaximum.set(edge.kind, Math.max(edgeMaximum.get(edge.kind) ?? 0, Math.abs(edge.weight)));
    });

    visibleEdges.forEach((edge) => {
      const source = positions.get(edge.source);
      const target = positions.get(edge.target);
      if (!source || !target) return;
      const selected = edge.source === selectedId || edge.target === selectedId;
      const maximum = edgeMaximum.get(edge.kind) ?? 1;
      context.strokeStyle = selected
        ? edge.weight < 0
          ? "rgba(148, 113, 165, 0.82)"
          : "rgba(75, 135, 77, 0.78)"
        : "rgba(65, 70, 65, 0.20)";
      context.lineWidth = selected ? 1.55 : 0.45 + 0.75 * Math.sqrt(Math.abs(edge.weight) / maximum);
      context.beginPath();
      context.moveTo(source.x, source.y);
      context.lineTo(target.x, target.y);
      context.stroke();
    });

    const signedNeighbors = new Map<string, number>();
    graph.edges.forEach((edge) => {
      if (edge.source === selectedId) signedNeighbors.set(edge.target, edge.weight);
      if (edge.target === selectedId) signedNeighbors.set(edge.source, edge.weight);
    });

    const screenNodes: ScreenNode[] = [];
    graph.nodes.forEach((node) => {
      const point = positions.get(node.id);
      if (!point) return;
      screenNodes.push({ id: node.id, ...point });
      const isSelected = node.id === selectedId;
      const relation = signedNeighbors.get(node.id);
      const fill = relation === undefined ? "#fbfcfb" : relation < 0 ? NEGATIVE : POSITIVE;
      context.fillStyle = fill;
      context.strokeStyle = isSelected ? SELECTED : node.kind === "logit" ? "#777b77" : QUIET;
      context.lineWidth = isSelected ? 2.2 : 1;
      context.beginPath();
      if (node.kind === "logit") {
        context.rect(point.x - 4.5, point.y - 4.5, 9, 9);
      } else {
        const featureRadius = featureLayout.get(node.id)?.radius ?? 4;
        const radius = isSelected
          ? Math.max(5.5, featureRadius + 2)
          : node.kind === "token"
            ? 3.2
            : featureRadius;
        context.arc(point.x, point.y, radius, 0, Math.PI * 2);
      }
      context.fill();
      context.stroke();

      if (node.kind === "token") {
        context.save();
        context.translate(point.x - 2, point.y + 11);
        context.rotate(-Math.PI / 3.2);
        context.fillStyle = INK;
        context.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
        context.textAlign = "right";
        context.textBaseline = "middle";
        context.fillText(node.label, 0, 0);
        context.restore();
      } else if (node.kind === "logit") {
        context.save();
        context.translate(point.x + 2, point.y - 9);
        context.rotate(logitAngle);
        context.fillStyle = INK;
        context.font = logitFont;
        context.textAlign = "left";
        context.fillText(`${node.label} ${percent(node.probability ?? 0)}`, 0, 0);
        context.restore();
      }
    });
    screenNodesRef.current = screenNodes;
  }, [graph, selectedId, visibleEdges]);

  useEffect(() => {
    draw();
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(draw);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [draw]);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    let nearest: ScreenNode | null = null;
    let distance = 11;
    screenNodesRef.current.forEach((node) => {
      const candidate = Math.hypot(node.x - x, node.y - y);
      if (candidate < distance) {
        nearest = node;
        distance = candidate;
      }
    });
    setHoveredId(nearest ? (nearest as ScreenNode).id : null);
    setPointer({ x, y, stageWidth: bounds.width });
  };

  const handleGraphChange = (nextGraphId: string) => {
    const nextGraph = payload?.graphs.find((candidate) => candidate.id === nextGraphId);
    setGraphId(nextGraphId);
    setSelectedId(nextGraph?.defaultNodeId ?? "");
    setHoveredId(null);
  };

  const handleStageKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!graph || !["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = Math.max(0, graph.nodes.findIndex((node) => node.id === selectedId));
    const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    const nextIndex = (currentIndex + direction + graph.nodes.length) % graph.nodes.length;
    setSelectedId(graph.nodes[nextIndex].id);
  };

  const groups = useMemo(() => {
    const result = new Map<string, ProbeGraph[]>();
    payload?.graphs.forEach((candidate) => {
      const list = result.get(candidate.group) ?? [];
      list.push(candidate);
      result.set(candidate.group, list);
    });
    return result;
  }, [payload]);

  if (loadError) {
    return (
      <figure className="research-figure full-bleed probe-figure">
        <p className="probe-load-state">The original-file graph data could not be loaded.</p>
      </figure>
    );
  }

  return (
    <figure className="research-figure full-bleed probe-figure">
      <div className="probe-toolbar">
        <label className="probe-picker">
          <span>Probe graph</span>
          <select value={graph?.id ?? ""} onChange={(event) => handleGraphChange(event.target.value)}>
            {Array.from(groups.entries()).map(([group, candidates]) => (
              <optgroup key={group} label={group}>
                {candidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>{candidate.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="probe-pruning">
          <span>Pruning:</span>
          <input
            type="range"
            min="1"
            max="8"
            value={incomingLimit}
            onChange={(event) => setIncomingLimit(Number(event.target.value))}
          />
          <strong>{incomingLimit}</strong>
          <small>incoming edges per node</small>
        </label>
        <div className="probe-legend" aria-label="Graph legend">
          <span><i className="positive" /> positive</span>
          <span><i className="negative" /> negative</span>
          <span><i className="selected" /> selected</span>
        </div>
      </div>

      <div className="probe-prompt-row">
        <div>
          <span>{graph?.group ?? "Loading original graph"}</span>
          <strong>{graph?.prompt ?? "Loading…"}</strong>
        </div>
        {graph ? (
          <div>
            <span>Top continuation</span>
            <strong><code>{graph.target.token}</code> · {percent(graph.target.probability)}</strong>
          </div>
        ) : null}
      </div>

      <div className="probe-workspace">
        <div
          className={`probe-stage ${hoveredId ? "has-hover" : ""}`}
          ref={stageRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoveredId(null)}
          onClick={() => hoveredId && setSelectedId(hoveredId)}
          onKeyDown={handleStageKeyDown}
          role="button"
          tabIndex={0}
          aria-label={graph ? `Interactive attribution graph for: ${graph.prompt}. Use arrow keys to inspect nodes.` : "Loading attribution graph"}
        >
          <canvas ref={canvasRef} />
          {hoveredNode ? (
            <div
              className="probe-tooltip"
              style={{ left: Math.max(8, Math.min(pointer.x + 12, pointer.stageWidth - 190)), top: Math.max(8, pointer.y - 52) }}
            >
              <strong>{neighborLabel(hoveredNode)}</strong>
              <span>{nodeDetail(hoveredNode)}</span>
              {hoveredNode.kind === "feature" ? <small>activation {hoveredNode.activation?.toFixed(3)}</small> : null}
            </div>
          ) : null}
        </div>

        <aside className="probe-inspector" aria-live="polite">
          <div className="probe-inspector-heading">
            <span>Selected node</span>
            <strong>{selectedNode ? neighborLabel(selectedNode) : "Loading…"}</strong>
            <p>{selectedNode ? nodeDetail(selectedNode) : "Reading the extracted graph data."}</p>
            {selectedNode?.kind === "feature" ? (
              <dl>
                <div><dt>Activation</dt><dd>{selectedNode.activation?.toFixed(3)}</dd></div>
                <div><dt>Target effect</dt><dd>{signed(selectedNode.directEffect ?? 0)}</dd></div>
              </dl>
            ) : null}
          </div>
          {selectedNode ? (
            <div className="probe-neighbor-columns">
              <NeighborList
                title="Input Features"
                edges={incoming.get(selectedNode.id) ?? []}
                direction="incoming"
                nodeById={nodeById}
                onSelect={setSelectedId}
              />
              <NeighborList
                title="Output Features"
                edges={outgoing.get(selectedNode.id) ?? []}
                direction="outgoing"
                nodeById={nodeById}
                onSelect={setSelectedId}
              />
            </div>
          ) : null}
          {selectedNode?.kind === "feature" ? (
            <TopActivationSentences node={selectedNode} tokenTracks={tokenTracks} />
          ) : null}
        </aside>
      </div>

      {graph ? (
        <div className="probe-source-note">
          <p>{graph.summary}</p>
          <span>
            Displaying {featureNodeCount} feature neurons, {tokenNodeCount} token embeddings, and {logitNodeCount} output logits;
            {" "}{visibleEdges.length} of {graph.edges.length} retained edges are currently visible.
            The original file contains {graph.fullFeatureCount.toLocaleString()} active feature instances.
          </span>
          <a href={graph.source}>Open original <code>.pt</code> file ↗</a>
        </div>
      ) : <p className="probe-load-state">Extracting a browser-sized view from the original graph…</p>}

      <figcaption>
        <span>Figure 1</span>
        <span>
          The article&apos;s AIME graph plus five interactive signed direct-effect subgraphs extracted from
          the original Hugging Face <code>.pt</code> files. Every graph keeps exactly 100 feature neurons:
          13 signed direct-effect anchors and the 87 strongest one-hop feature sources available from
          those rows. Token embeddings and output logits are shown in addition. These are faithful
          browser-sized projections, not complete dense graphs or recomputed Neumann rankings.
        </span>
      </figcaption>
    </figure>
  );
}
