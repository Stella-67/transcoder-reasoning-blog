"use client";

import { useState } from "react";

type Mode = "direct" | "latent";
type LayerKey = "L" | "ell" | "s";
type PartKey = "input" | "encoder" | "gate" | "latent" | "path" | "sum" | "mixed" | "decoder" | "output";

type Layer = {
  key: LayerKey;
  label: string;
  symbol: string;
  rank: number;
};

const layers: Layer[] = [
  { key: "L", label: "Layer L", symbol: "L", rank: 2 },
  { key: "ell", label: "Layer ℓ", symbol: "ℓ", rank: 1 },
  { key: "s", label: "Layer s", symbol: "s", rank: 0 },
];

const partCopy: Record<PartKey, { title: string; body: string; formula: React.ReactNode }> = {
  input: {
    title: "Residual-stream input",
    body: "The frozen transformer state at token t, read independently at each source layer.",
    formula: <MathTerm base="x" sub="s,t" />,
  },
  encoder: {
    title: "Layer-specific encoder",
    body: "Each layer has its own encoder. It maps the residual stream into the same M feature coordinates.",
    formula: <MathTerm base="W" sup="enc" sub="s" />,
  },
  gate: {
    title: "Sparse activation",
    body: "JumpReLU thresholds the coordinates; Top-K keeps only the strongest active features for this token and layer.",
    formula: <span>Top-K(JumpReLU(·))</span>,
  },
  latent: {
    title: "Shared latent coordinate system",
    body: "Every layer writes into the same M-dimensional coordinate system. Coordinate a denotes the same learned feature across depth.",
    formula: <MathTerm base="z" sub="s,t" tail=" ∈ ℝᴹ" />,
  },
  path: {
    title: "Cross-layer path",
    body: "A source feature may contribute to its own layer and every later output layer. The triangular map makes all admissible s → ℓ paths explicit.",
    formula: <MathTerm base="γ" sup="s→ℓ" sub="a" />,
  },
  sum: {
    title: "Gather upstream source layers",
    body: "Each target layer aggregates contributions from every source layer at or before it.",
    formula: <span>Σ<sub>s≤ℓ</sub></span>,
  },
  mixed: {
    title: "Output-specific latent state",
    body: "Latent mixing first combines source activations feature by feature, while staying inside the shared M-dimensional space.",
    formula: <MathTerm base="z̃" sub="ℓ,t" tail=" ∈ ℝᴹ" />,
  },
  decoder: {
    title: "One base decoder per output layer",
    body: "After latent mixing, all source layers share the same target-layer decoder direction for feature a.",
    formula: <MathTerm base="W" sup="dec" sub="ℓ" />,
  },
  output: {
    title: "Reconstructed MLP output",
    body: "The final d-dimensional vector approximates the frozen transformer’s MLP output at the target layer.",
    formula: <MathTerm base="m̂" sub="ℓ,t" tail=" ∈ ℝᵈ" />,
  },
};

function MathTerm({ base, sub, sup, tail }: { base: string; sub?: string; sup?: string; tail?: string }) {
  return (
    <span className="clt2-math">
      <i>{base}</i>
      {sup && <sup>{sup}</sup>}
      {sub && <sub>{sub}</sub>}
      {tail}
    </span>
  );
}

function VectorGlyph({ tone = "orange" }: { tone?: "orange" | "blue" }) {
  return (
    <span className={`clt2-vector-glyph ${tone}`} aria-hidden="true">
      <i /><i /><i /><b>···</b><i />
    </span>
  );
}

function MatrixGlyph({ direction = "encode" }: { direction?: "encode" | "decode" }) {
  return (
    <span className={`clt2-matrix-glyph ${direction}`} aria-hidden="true">
      {Array.from({ length: 12 }).map((_, index) => <i key={index} />)}
    </span>
  );
}

function SourceCard({
  layer,
  selected,
  onSelect,
  inspect,
}: {
  layer: Layer;
  selected: boolean;
  onSelect: () => void;
  inspect: (part: PartKey) => Record<string, () => void>;
}) {
  return (
    <div className={`clt2-source-card ${selected ? "selected" : ""}`}>
      <button className="clt2-source-title" onClick={onSelect} aria-pressed={selected}>
        <span>{layer.label}</span>
        <small>{selected ? "tracing downstream" : "trace this source"}</small>
      </button>
      <div className="clt2-source-flow">
        <button className="clt2-node clt2-residual" {...inspect("input")}>
          <MathTerm base="x" sub={`${layer.symbol},t`} />
          <VectorGlyph tone="blue" />
        </button>
        <span aria-hidden="true">→</span>
        <button className="clt2-node clt2-encoder" {...inspect("encoder")}>
          <MathTerm base="W" sup="enc" sub={layer.symbol} />
          <MatrixGlyph />
        </button>
        <span aria-hidden="true">→</span>
        <button className="clt2-node clt2-gate" {...inspect("gate")}>
          <span className="clt2-gate-operator"><strong>JumpReLU</strong><i>+</i><strong>Top-K</strong></span>
          <small>activation · sparsity</small>
        </button>
      </div>
      <span className="clt2-down-arrow" aria-hidden="true">↓</span>
      <button className="clt2-latent-vector" {...inspect("latent")} onClick={onSelect}>
        <MathTerm base="z" sub={`${layer.symbol},t`} />
        <VectorGlyph />
      </button>
    </div>
  );
}

function PathCell({
  mode,
  source,
  target,
  valid,
  sourceSelected,
  targetSelected,
  onSelect,
  inspect,
}: {
  mode: Mode;
  source: Layer;
  target: Layer;
  valid: boolean;
  sourceSelected: boolean;
  targetSelected: boolean;
  onSelect: () => void;
  inspect: (part: PartKey) => Record<string, () => void>;
}) {
  if (!valid) {
    return <div className="clt2-path-cell invalid" aria-label={`No path from ${source.label} to ${target.label}`}>—</div>;
  }

  const intersection = sourceSelected && targetSelected;
  return (
    <button
      className={`clt2-path-cell valid ${sourceSelected ? "source-selected" : ""} ${targetSelected ? "target-selected" : ""} ${intersection ? "intersection" : ""}`}
      {...inspect("path")}
      onClick={onSelect}
    >
      {mode === "latent" ? (
        <MathTerm base="γ" sup={`${source.symbol}→${target.symbol}`} sub="a" />
      ) : (
        <MathTerm base="w" sup={`${source.symbol}→${target.symbol}`} sub="a" />
      )}
      <small>{mode === "latent" ? "scalar strength" : "independent d-vector"}</small>
    </button>
  );
}

export default function InteractiveCltArchitecture() {
  const [mode, setMode] = useState<Mode>("latent");
  const [source, setSource] = useState<LayerKey>("s");
  const [target, setTarget] = useState<LayerKey>("L");
  const [part, setPart] = useState<PartKey>("latent");

  const inspect = (next: PartKey) => ({
    onMouseEnter: () => setPart(next),
    onFocus: () => setPart(next),
    onClick: () => setPart(next),
  });

  const selectedSource = layers.find((layer) => layer.key === source) ?? layers[2];
  const selectedTarget = layers.find((layer) => layer.key === target) ?? layers[0];
  const baseDetail = partCopy[part];
  const detail = part === "path"
    ? mode === "latent"
      ? {
          title: "Cross-layer scalar in latent space",
          body: "For every active feature coordinate a, γ changes the strength of a source layer’s contribution without changing its target-layer decoder direction.",
          formula: <span><MathTerm base="w" sup="s→ℓ" sub="a" /> = <MathTerm base="γ" sup="s→ℓ" sub="a" /> · <MathTerm base="w" sup="dec" sub="ℓ,a" /></span>,
        }
      : {
          title: "Independent cross-layer decoder",
          body: "The direct CLT learns a separate d-dimensional direction for every source layer, target layer, and feature coordinate.",
          formula: <MathTerm base="w" sup="s→ℓ" sub="a" tail=" ∈ ℝᵈ" />,
        }
    : baseDetail;

  return (
    <figure className="clt2-explorer full-bleed" aria-labelledby="clt2-title">
      <header className="clt2-header">
        <div>
          <span className="clt2-kicker">Figure 1 · interactive architecture</span>
          <h3 id="clt2-title">One feature space, many layers</h3>
          <p>Trace a source column and a target row to see how cross-layer decoding is factorized.</p>
        </div>
        <div className="clt2-mode" role="group" aria-label="Compare CLT parameterizations">
          <button className={mode === "direct" ? "active" : ""} onClick={() => { setMode("direct"); setPart("path"); }}>
            <span>Direct CLT</span><small>independent directions</small>
          </button>
          <button className={mode === "latent" ? "active" : ""} onClick={() => { setMode("latent"); setPart("path"); }}>
            <span>Latent mixing</span><small>shared direction + γ</small>
          </button>
        </div>
      </header>

      <div className="clt2-summary" aria-live="polite">
        <p>
          {mode === "latent"
            ? <>Mix source activations <em>inside ℝᴹ</em>, then decode once per output layer.</>
            : <>Decode every source–target pair with an <em>independent ℝᵈ direction</em>.</>}
        </p>
        <div>
          <span>{mode === "latent" ? "8.764B" : "152.32B"}<small>decoder parameters</small></span>
          <span>{mode === "latent" ? "17.4× smaller" : "reference"}<small>Gemma, L = 34</small></span>
        </div>
      </div>

      <div className="clt2-canvas" data-mode={mode}>
        <section className="clt2-encoding" aria-label="Layer-specific encoders">
          <div className="clt2-section-label">
            <span>01</span>
            <strong>Layer-specific encoding</strong>
            <small>residual stream → sparse features</small>
          </div>
          <div className="clt2-source-grid">
            {layers.map((layer) => (
              <SourceCard
                key={layer.key}
                layer={layer}
                selected={layer.key === source}
                onSelect={() => { setSource(layer.key); setPart("latent"); }}
                inspect={inspect}
              />
            ))}
          </div>
        </section>

        <section className="clt2-latent-space" aria-label="Shared M-dimensional latent space and cross-layer mixing">
          <div className="clt2-latent-head">
            <div>
              <span>02</span>
              <strong>Shared latent space <MathTerm base="ℝ" sup="M" /></strong>
            </div>
            <p>Coordinate <MathTerm base="a" /> names the same learned feature at every source layer.</p>
            <span className="clt2-path-count">6 admissible source → target paths</span>
          </div>

          <div className="clt2-map-head" aria-hidden="true">
            <span>Target output</span>
            {layers.map((layer) => <span key={layer.key}>source {layer.symbol}</span>)}
            <span>{mode === "latent" ? "mixed latent" : "sum decoded writes"}</span>
            {mode === "latent" && <span>base decoder</span>}
            <span>MLP output</span>
          </div>

          <div className="clt2-map">
            {layers.map((targetLayer) => {
              const targetSelected = targetLayer.key === target;
              return (
                <div className={`clt2-target-row ${targetSelected ? "selected" : ""}`} key={targetLayer.key}>
                  <button
                    className="clt2-target-label"
                    onClick={() => { setTarget(targetLayer.key); setPart("sum"); }}
                    aria-pressed={targetSelected}
                  >
                    <span>reconstruct</span>
                    <strong>{targetLayer.label}</strong>
                  </button>

                  {layers.map((sourceLayer) => (
                    <PathCell
                      key={sourceLayer.key}
                      mode={mode}
                      source={sourceLayer}
                      target={targetLayer}
                      valid={sourceLayer.rank <= targetLayer.rank}
                      sourceSelected={sourceLayer.key === source}
                      targetSelected={targetSelected}
                      onSelect={() => { setSource(sourceLayer.key); setTarget(targetLayer.key); setPart("path"); }}
                      inspect={inspect}
                    />
                  ))}

                  <span className="clt2-flow-arrow" aria-hidden="true">→</span>
                  <button className="clt2-sum-node" {...inspect("sum")}>Σ</button>
                  <span className="clt2-flow-arrow" aria-hidden="true">→</span>

                  {mode === "latent" && (
                    <>
                      <button className="clt2-mixed-node" {...inspect("mixed")}>
                        <MathTerm base="z̃" sub={`${targetLayer.symbol},t`} />
                        <VectorGlyph />
                      </button>
                      <span className="clt2-flow-arrow" aria-hidden="true">→</span>
                      <button className="clt2-decoder-node" {...inspect("decoder")}>
                        <MathTerm base="W" sup="dec" sub={targetLayer.symbol} />
                        <MatrixGlyph direction="decode" />
                        <small>shared across sources</small>
                      </button>
                      <span className="clt2-flow-arrow" aria-hidden="true">→</span>
                    </>
                  )}

                  <button className="clt2-output-node" {...inspect("output")}>
                    <MathTerm base="m̂" sub={`${targetLayer.symbol},t`} />
                    <VectorGlyph tone="blue" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="clt2-factorization">
            {mode === "latent" ? (
              <>
                <span>The factorization</span>
                <strong><MathTerm base="w" sup="s→ℓ" sub="a" /> = <MathTerm base="γ" sup="s→ℓ" sub="a" /> · <MathTerm base="w" sup="dec" sub="ℓ,a" /></strong>
                <p>source-specific strength × one target-layer direction</p>
              </>
            ) : (
              <>
                <span>No factorization</span>
                <strong><MathTerm base="w" sup="s→ℓ" sub="a" /> <small>learned independently</small></strong>
                <p>a full d-vector for every (s, ℓ, a)</p>
              </>
            )}
          </div>
        </section>
      </div>

      <aside className="clt2-inspector" aria-live="polite">
        <span>Inspecting</span>
        <div><strong>{detail.title}</strong><p>{detail.body}</p></div>
        <code>{detail.formula}</code>
      </aside>

      <figcaption>
        <strong>Figure 1.</strong>
        <span>Layer-specific encoders place sparse activations in one shared M-dimensional latent coordinate system. The triangular map shows that a source at layer s may write to every output layer ℓ ≥ s. Latent mixing replaces each independent cross-layer decoder direction with a scalar γ and one output-layer base direction.</span>
      </figcaption>
    </figure>
  );
}
