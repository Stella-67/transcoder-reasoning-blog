"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MathFormula from "./Math";

type Mode = "all" | "forward" | "backward";
type EdgeKind = "write" | "jacobian" | "read" | "causal";
type Point = { x: number; y: number };
type Edge = {
  from: string;
  to: string;
  kind: EdgeKind;
  label: string;
  backwardLabel: string;
  forwardPhase: number;
  backwardPhase: number;
  modes: Array<Exclude<Mode, "all">>;
};

const EDGES: Edge[] = [
  {
    from: "node-i",
    to: "source-low",
    kind: "write",
    label: "Wₐˢ→ˢ writes node i into residual state mₛ,ₜₛ.",
    backwardLabel: "The adjoint at mₛ,ₜₛ is projected back onto source feature node i.",
    forwardPhase: 0,
    backwardPhase: 2,
    modes: ["backward"],
  },
  {
    from: "node-i",
    to: "source-mid",
    kind: "write",
    label: "Wₐˢ→ˢ⁺¹ writes the source feature into the next residual state.",
    backwardLabel: "The adjoint at mₛ₊₁,ₜₛ is projected back onto source feature node i.",
    forwardPhase: 0,
    backwardPhase: 2,
    modes: ["backward"],
  },
  {
    from: "node-i",
    to: "source-top",
    kind: "write",
    label: "Wₐˢ→ʳ carries the source feature to a downstream residual state.",
    backwardLabel: "The adjoint at mᵣ,ₜₛ is projected back onto source feature node i.",
    forwardPhase: 0,
    backwardPhase: 2,
    modes: ["backward"],
  },
  {
    from: "source-low",
    to: "target-x",
    kind: "jacobian",
    label: "Jᵣ←ₛ transports the perturbation from token tₛ to token tᵣ.",
    backwardLabel: "Jᵀᵣ←ₛ carries the target adjoint from token tᵣ back to mₛ,ₜₛ.",
    forwardPhase: 1,
    backwardPhase: 1,
    modes: ["backward"],
  },
  {
    from: "source-mid",
    to: "target-x",
    kind: "jacobian",
    label: "Jᵣ←ₛ₊₁ transports the perturbation from token tₛ to token tᵣ.",
    backwardLabel: "Jᵀᵣ←ₛ₊₁ carries the target adjoint from token tᵣ back to mₛ₊₁,ₜₛ.",
    forwardPhase: 1,
    backwardPhase: 1,
    modes: ["backward"],
  },
  {
    from: "source-top",
    to: "target-x",
    kind: "jacobian",
    label: "Jᵣ←ᵣ transports the perturbation from token tₛ to token tᵣ.",
    backwardLabel: "Jᵀᵣ←ᵣ carries the target adjoint from token tᵣ back to mᵣ,ₜₛ.",
    forwardPhase: 1,
    backwardPhase: 1,
    modes: ["backward"],
  },
  {
    from: "target-x",
    to: "node-j",
    kind: "read",
    label: "The encoder row selects target feature node j from xᵣ,ₜᵣ.",
    backwardLabel: "The attribution signal starts at node j and enters xᵣ,ₜᵣ through the encoder row.",
    forwardPhase: 2,
    backwardPhase: 0,
    modes: ["backward"],
  },
  {
    from: "source-attn-low",
    to: "target-attn-low",
    kind: "causal",
    label: "The lower original-model attention layer carries information causally from token tₛ to token tᵣ.",
    backwardLabel: "The attention-layer adjoint flows from token tᵣ back to token tₛ.",
    forwardPhase: 0,
    backwardPhase: 1,
    modes: ["forward"],
  },
  {
    from: "source-attn-mid",
    to: "target-attn-mid",
    kind: "causal",
    label: "The middle original-model attention layer carries information causally from token tₛ to token tᵣ.",
    backwardLabel: "The attention-layer adjoint flows from token tᵣ back to token tₛ.",
    forwardPhase: 1,
    backwardPhase: 1,
    modes: ["forward"],
  },
  {
    from: "source-attn-high",
    to: "target-attn-high",
    kind: "causal",
    label: "The upper original-model attention layer carries information causally from token tₛ to token tᵣ.",
    backwardLabel: "The attention-layer adjoint flows from token tᵣ back to token tₛ.",
    forwardPhase: 1,
    backwardPhase: 1,
    modes: ["forward"],
  },
];

const MODE_COPY: Record<Mode, { label: string; caption: string; detail: string }> = {
  all: {
    label: "All paths",
    caption: "full computation",
    detail:
      "The source m markers are post-MLP residual states, while x is the pre-MLP target residual state. The backward pass follows the same paths in reverse.",
  },
  forward: {
    label: "Model forward",
    caption: "original transformer",
    detail:
      "The original transformer runs upward through both residual streams. Each source m is measured after its MLP; the target x is measured before its MLP. Attention transfers information from tₛ to tᵣ.",
  },
  backward: {
    label: "Jacobian backward",
    caption: "attribution read",
    detail:
      "Only the selected neuron pair j → i is differentiated. Dashed MLP boxes mark direct residual / bypass terms; attention parameters θ stay frozen while activation gradients propagate.",
  },
};

function curve(from: Point, to: Point) {
  if (Math.abs(to.x - from.x) > Math.abs(to.y - from.y) * 0.45) {
    const bend = Math.max(34, Math.abs(to.x - from.x) * 0.42);
    const sign = to.x >= from.x ? 1 : -1;
    return `M ${from.x} ${from.y} C ${from.x + bend * sign} ${from.y}, ${to.x - bend * sign} ${to.y}, ${to.x} ${to.y}`;
  }

  const bend = Math.max(34, Math.abs(to.y - from.y) * 0.42);
  const sign = to.y >= from.y ? 1 : -1;
  return `M ${from.x} ${from.y} C ${from.x} ${from.y + bend * sign}, ${to.x} ${to.y - bend * sign}, ${to.x} ${to.y}`;
}

export default function InteractiveOriginalModel() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("forward");
  const [selectedEdge, setSelectedEdge] = useState<number | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<number | null>(null);
  const [paths, setPaths] = useState<string[]>([]);
  const [size, setSize] = useState({ width: 1, height: 1 });

  const draw = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const stageBounds = stage.getBoundingClientRect();
    const point = (name: string): Point | null => {
      const anchor = stage.querySelector<HTMLElement>(`[data-anchor="${name}"]`);
      if (!anchor) return null;
      const bounds = anchor.getBoundingClientRect();
      return {
        x: bounds.left + bounds.width / 2 - stageBounds.left,
        y: bounds.top + bounds.height / 2 - stageBounds.top,
      };
    };

    const nextPaths = EDGES.map((edge) => {
      const from = point(edge.from);
      const to = point(edge.to);
      return from && to ? curve(from, to) : "";
    });

    setSize({ width: stageBounds.width, height: stageBounds.height });
    setPaths(nextPaths);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const observer = new ResizeObserver(draw);
    observer.observe(stage);
    draw();
    return () => observer.disconnect();
  }, [draw]);

  const activeEdge = hoveredEdge ?? selectedEdge;
  const detail = activeEdge === null ? MODE_COPY[mode] : {
    label: "Selected path",
    caption: "",
    detail: mode === "backward" ? EDGES[activeEdge].backwardLabel : EDGES[activeEdge].label,
  };

  const selectedFormulas = [
    <MathFormula key="wss" tex={mode === "backward" ? String.raw`\mathbf{W}_{a}^{s\to s,\top}` : String.raw`\mathbf{W}_{a}^{s\to s}`} />,
    <MathFormula key="wss1" tex={mode === "backward" ? String.raw`\mathbf{W}_{a}^{s\to s+1,\top}` : String.raw`\mathbf{W}_{a}^{s\to s+1}`} />,
    <MathFormula key="wsr" tex={mode === "backward" ? String.raw`\mathbf{W}_{a}^{s\to r,\top}` : String.raw`\mathbf{W}_{a}^{s\to r}`} />,
    <MathFormula key="jrs" tex={mode === "backward" ? String.raw`\mathbf{J}_{r\leftarrow s}^{\top}` : String.raw`\mathbf{J}_{r\leftarrow s}`} />,
    <MathFormula key="jrs1" tex={mode === "backward" ? String.raw`\mathbf{J}_{r\leftarrow s+1}^{\top}` : String.raw`\mathbf{J}_{r\leftarrow s+1}`} />,
    <MathFormula key="jrr" tex={mode === "backward" ? String.raw`\mathbf{J}_{r\leftarrow r}^{\top}` : String.raw`\mathbf{J}_{r\leftarrow r}`} />,
    <MathFormula key="wenc" tex={String.raw`\mathbf{W}_{r}^{\mathrm{enc}}[a',:]`} />,
    <MathFormula key="attn-low" tex={String.raw`\operatorname{Attn}_{\mathrm{low}}(t_s\to t_r)`} />,
    <MathFormula key="attn-mid" tex={String.raw`\operatorname{Attn}_{\mathrm{mid}}(t_s\to t_r)`} />,
    <MathFormula key="attn-high" tex={String.raw`\operatorname{Attn}_{\mathrm{high}}(t_s\to t_r)`} />,
  ];

  const inspectionFormula = activeEdge === null
    ? mode === "backward"
      ? <MathFormula tex={String.raw`\mathbf{J}_{r\leftarrow\ell}^{\top}`} />
      : mode === "forward"
        ? <MathFormula tex={String.raw`\operatorname{OriginalModel}(t_{\leq r})`} />
        : <MathFormula tex={String.raw`\mathbf{W}_{j}^{\mathrm{enc}}\mathbf{J}_{i\to j}(z_i\mathbf{W}_{i}^{\mathrm{dec}})`} />
    : selectedFormulas[activeEdge];

  return (
    <div className="original-model-explorer">
      <div className="original-model-head">
        <div>
          <span className="original-model-kicker">Figure 2 · interactive attribution</span>
          <h3>Trace a feature write into the target residual stream</h3>
          <p>Choose a propagation direction, then hover or click a line to inspect its role.</p>
        </div>
        <div className="original-model-controls" role="group" aria-label="Path focus">
          {(Object.keys(MODE_COPY) as Mode[]).map((option) => (
            <button
              type="button"
              key={option}
              aria-pressed={mode === option}
              onClick={() => {
                setMode(option);
                setSelectedEdge(null);
                setHoveredEdge(null);
              }}
            >
              <span>{MODE_COPY[option].label}</span>
              <small>{MODE_COPY[option].caption}</small>
            </button>
          ))}
        </div>
      </div>

      <div
        className="original-model-stage"
        data-mode={mode}
        ref={stageRef}
        role="img"
        aria-label="Forward propagation carries a feature from source token t s to target token t r. Backward propagation follows the same paths in reverse through transpose Jacobians."
      >
        <svg
          className="original-model-links"
          viewBox={`0 0 ${size.width} ${size.height}`}
          width={size.width}
          height={size.height}
          aria-hidden="true"
        >
          <defs>
            <marker id="original-arrow-blue" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 8 4 L 0 8 z" className="original-model-arrow-blue" />
            </marker>
            <marker id="original-arrow-orange" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 8 4 L 0 8 z" className="original-model-arrow-orange" />
            </marker>
            <marker id="original-arrow-green" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 8 4 L 0 8 z" className="original-model-arrow-green" />
            </marker>
          </defs>
          {EDGES.map((edge, index) => {
            const isActive = activeEdge === index;
            const isVisible = mode === "all" || edge.modes.includes(mode);
            const forwardMarker = edge.kind === "write" || edge.kind === "causal"
              ? "url(#original-arrow-blue)"
              : edge.kind === "read"
                ? "url(#original-arrow-green)"
                : "url(#original-arrow-orange)";
            const phase = mode === "backward" ? edge.backwardPhase : edge.forwardPhase;
            const showForwardArrow = mode !== "backward" && edge.kind !== "jacobian";
            return (
              <g key={`${edge.from}-${edge.to}`}>
                <path
                  className={`original-model-link ${edge.kind}${isVisible ? "" : " is-hidden"}${isActive ? " is-active" : ""}`}
                  d={paths[index] ?? ""}
                  markerEnd={showForwardArrow ? forwardMarker : undefined}
                  markerStart={mode === "backward" && isVisible ? "url(#original-arrow-orange)" : undefined}
                />
                <path
                  className={`original-model-flow-pulse ${edge.kind}${isVisible ? "" : " is-hidden"}`}
                  d={paths[index] ?? ""}
                  pathLength="1"
                  style={{ animationDelay: `${phase * 0.34}s` }}
                />
                {isVisible && (
                  <path
                    className="original-model-link-hit"
                    d={paths[index] ?? ""}
                    onPointerEnter={() => setHoveredEdge(index)}
                    onPointerLeave={() => setHoveredEdge(null)}
                    onClick={() => setSelectedEdge(selectedEdge === index ? null : index)}
                  />
                )}
              </g>
            );
          })}
        </svg>

        <div className="original-model-columns">
          <section className="original-model-column source" aria-label="Source position">
            <div className="original-model-column-title">
              <span>01</span>
              <strong>Source position <MathFormula tex={String.raw`t_s`} /></strong>
              <small>residual stream ↑</small>
            </div>
            <div className="original-model-rail" />
            <span className="original-model-flow-anchor" data-anchor="source-attn-high" style={{ top: "32%" }} />
            <span className="original-model-flow-anchor" data-anchor="source-attn-mid" style={{ top: "70%" }} />
            <span className="original-model-flow-anchor" data-anchor="source-attn-low" style={{ top: "94%" }} />

            <span className="original-model-add" style={{ top: "20%" }}>+</span>
            <span className="original-model-dot" style={{ top: "25%" }} />
            <span className="original-model-add" style={{ top: "32%" }}>+</span>
            <span className="original-model-tap" data-anchor="source-top" style={{ top: "14%" }} />
            <span className="original-model-tap-label" style={{ top: "12%" }}>
              <MathFormula tex={String.raw`\mathbf{m}_{r,t_s}`} />
            </span>

            <span className="original-model-tap" data-anchor="source-mid" style={{ top: "52%" }} />
            <span className="original-model-tap-label" style={{ top: "50%" }}>
              <MathFormula tex={String.raw`\mathbf{m}_{s+1,t_s}`} />
            </span>
            <span className="original-model-add" style={{ top: "58%" }}>+</span>
            <span className="original-model-dot" style={{ top: "65%" }} />
            <span className="original-model-add" style={{ top: "70%" }}>+</span>

            <span className="original-model-tap" data-anchor="source-low" style={{ top: "76%" }} />
            <span className="original-model-tap-label" style={{ top: "74%" }}>
              <MathFormula tex={String.raw`\mathbf{m}_{s,t_s}`} />
            </span>
            <span className="original-model-add" style={{ top: "82%" }}>+</span>
            <span className="original-model-dot" style={{ top: "88%" }} />
            <span className="original-model-add" style={{ top: "94%" }}>+</span>

            <div className="original-model-module mlp" style={{ top: "20%" }}>MLP</div>
            <div className="original-model-module attn" style={{ top: "32%" }}>Attention</div>
            <div className="original-model-module mlp" style={{ top: "58%" }}>MLP</div>
            <div className="original-model-module attn" style={{ top: "70%" }}>Attention</div>
            <div className="original-model-module mlp" style={{ top: "82%" }}>MLP</div>
            <div className="original-model-module attn" style={{ top: "94%" }}>Attention</div>
            <span className="original-model-ellipsis">⋮</span>

            <div className="original-model-neuron-group" aria-label="Source neuron row with neuron i selected">
              <div className="original-model-neuron-heading">
                <strong>Source neurons</strong>
                <MathFormula tex={String.raw`\mathbf{z}_{s,t_s}`} />
              </div>
              <div className="original-model-neuron-strip">
                {Array.from({ length: 8 }, (_, index) => (
                  <span
                    key={index}
                    className={index === 5 ? "is-selected" : ""}
                    data-anchor={index === 5 ? "node-i" : undefined}
                  />
                ))}
              </div>
            </div>
            <span className="original-model-weight-label w1"><MathFormula tex={String.raw`\mathbf{W}_{a}^{s\to s}`} /></span>
            <span className="original-model-weight-label w2"><MathFormula tex={String.raw`\mathbf{W}_{a}^{s\to s+1}`} /></span>
            <span className="original-model-weight-label w3"><MathFormula tex={String.raw`\mathbf{W}_{a}^{s\to r}`} /></span>
          </section>

          <section className="original-model-column target" aria-label="Target position">
            <div className="original-model-column-title">
              <span>02</span>
              <strong>Target position <MathFormula tex={String.raw`t_r`} /></strong>
              <small>residual stream ↑</small>
            </div>
            <div className="original-model-rail" />
            <span className="original-model-flow-anchor" data-anchor="target-attn-high" style={{ top: "32%" }} />
            <span className="original-model-flow-anchor" data-anchor="target-attn-mid" style={{ top: "70%" }} />
            <span className="original-model-flow-anchor" data-anchor="target-attn-low" style={{ top: "94%" }} />

            <span className="original-model-add" style={{ top: "20%" }}>+</span>
            <span className="original-model-tap" data-anchor="target-x" style={{ top: "26%" }} />
            <span className="original-model-add" style={{ top: "32%" }}>+</span>
            <span className="original-model-x-label"><MathFormula tex={String.raw`\mathbf{x}_{r,t_r}`} /></span>
            <span className="original-model-add" style={{ top: "58%" }}>+</span>
            <span className="original-model-dot" style={{ top: "65%" }} />
            <span className="original-model-add" style={{ top: "70%" }}>+</span>
            <span className="original-model-add" style={{ top: "82%" }}>+</span>
            <span className="original-model-dot" style={{ top: "88%" }} />
            <span className="original-model-add" style={{ top: "94%" }}>+</span>

            <div className="original-model-module mlp" style={{ top: "20%" }}>MLP</div>
            <div className="original-model-module attn" style={{ top: "32%" }}>Attention</div>
            <div className="original-model-module mlp" style={{ top: "58%" }}>MLP</div>
            <div className="original-model-module attn" style={{ top: "70%" }}>Attention</div>
            <div className="original-model-module mlp" style={{ top: "82%" }}>MLP</div>
            <div className="original-model-module attn" style={{ top: "94%" }}>Attention</div>
            <span className="original-model-ellipsis">⋮</span>

            <div className="original-model-neuron-group" aria-label="Target neuron row with neuron j selected">
              <div className="original-model-neuron-heading">
                <strong>Target neurons</strong>
                <MathFormula tex={String.raw`\mathbf{z}_{r,t_r}`} />
              </div>
              <div className="original-model-neuron-strip">
                {Array.from({ length: 8 }, (_, index) => (
                  <span
                    key={index}
                    className={index === 2 ? "is-selected" : ""}
                    data-anchor={index === 2 ? "node-j" : undefined}
                  />
                ))}
              </div>
            </div>
            <span className="original-model-weight-label w4"><MathFormula tex={String.raw`\mathbf{W}_{r}^{\mathrm{enc}}[a',:]`} /></span>
          </section>
        </div>

        {mode === "forward" && (
          <aside className="original-model-state-key" aria-label="Residual state convention">
            <span>Residual-state convention</span>
            <div className="original-model-state-row post">
              <MathFormula tex={String.raw`\mathbf{m}_{\ell,t_s}`} />
              <div>
                <strong>After MLP</strong>
                <small>post-MLP residual</small>
              </div>
            </div>
            <div className="original-model-state-row pre">
              <MathFormula tex={String.raw`\mathbf{x}_{r,t_r}`} />
              <div>
                <strong>Before MLP</strong>
                <small>pre-MLP residual</small>
              </div>
            </div>
          </aside>
        )}

        {mode !== "forward" && (
          <>
            <span className="original-model-formula f1">
              <MathFormula tex={mode === "backward" ? String.raw`\mathbf{J}_{r\leftarrow r}^{\top}` : String.raw`\mathbf{J}_{r\leftarrow r}`} />
            </span>
            <span className="original-model-formula f2">
              <MathFormula tex={mode === "backward" ? String.raw`\mathbf{J}_{r\leftarrow s+1}^{\top}` : String.raw`\mathbf{J}_{r\leftarrow s+1}`} />
            </span>
            <span className="original-model-formula f3">
              <MathFormula tex={mode === "backward" ? String.raw`\mathbf{J}_{r\leftarrow s}^{\top}` : String.raw`\mathbf{J}_{r\leftarrow s}`} />
            </span>
          </>
        )}
      </div>

      <aside className="original-model-detail" aria-live="polite">
        <span>Inspecting</span>
        <div>
          <strong>{detail.label}</strong>
          <p>{detail.detail}</p>
        </div>
        <code>{inspectionFormula}</code>
      </aside>
    </div>
  );
}
