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
    formula: <MathTerm base="x" sub="s,t" bold />,
  },
  encoder: {
    title: "Layer-specific encoder",
    body: "Each layer has its own encoder. It maps the residual stream into the same M feature coordinates.",
    formula: <MathTerm base="W" sup="enc" sub="s" bold supRoman />,
  },
  gate: {
    title: "Sparse activation",
    body: "JumpReLU thresholds the coordinates; Top-K keeps only the strongest active features for this token and layer.",
    formula: <span>Top-K(JumpReLU(·))</span>,
  },
  latent: {
    title: "Shared latent coordinate system",
    body: "Every layer writes into the same M-dimensional coordinate system. Coordinate a denotes the same learned feature across depth.",
    formula: <MathTerm base="z" sub="s,t" tail=" ∈ ℝᴹ" bold />,
  },
  path: {
    title: "Cross-layer path",
    body: "A source feature may contribute to its own layer and every later output layer. The triangular map makes all admissible s → ℓ paths explicit.",
    formula: <MathTerm base="γ" sup="s→ℓ" bold />,
  },
  sum: {
    title: "Gather upstream source layers",
    body: "Each target layer aggregates contributions from every source layer at or before it.",
    formula: <span>Σ<sub>s≤ℓ</sub></span>,
  },
  mixed: {
    title: "Output-specific latent state",
    body: "Latent mixing first combines source activations feature by feature, while staying inside the shared M-dimensional space.",
    formula: <MathTerm base="z̃" sub="ℓ,t" tail=" ∈ ℝᴹ" bold />,
  },
  decoder: {
    title: "One base decoder per output layer",
    body: "After latent mixing, all source layers share the same target-layer decoder direction for feature a.",
    formula: <MathTerm base="W" sup="dec" sub="ℓ" bold supRoman />,
  },
  output: {
    title: "Reconstructed MLP output",
    body: "The final d-dimensional vector approximates the frozen transformer’s MLP output at the target layer.",
    formula: <MathTerm base="m̂" sub="ℓ,t" tail=" ∈ ℝᵈ" bold />,
  },
};

function MathTerm({
  base,
  sub,
  sup,
  tail,
  bold = false,
  supRoman = false,
  romanBase = false,
}: {
  base: string;
  sub?: string;
  sup?: string;
  tail?: string;
  bold?: boolean;
  supRoman?: boolean;
  romanBase?: boolean;
}) {
  const scripts = sup && sub ? (
    <span className="clt2-script-stack">
      <sup className={supRoman ? "roman" : ""}>{sup}</sup>
      <sub>{sub}</sub>
    </span>
  ) : sup ? (
    <sup className={supRoman ? "roman" : ""}>{sup}</sup>
  ) : sub ? (
    <sub>{sub}</sub>
  ) : null;

  return (
    <span className="clt2-math">
      <i className={`${bold ? "bold" : ""} ${romanBase ? "roman" : ""}`.trim()}>{base}</i>
      {scripts}
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
          <MathTerm base="x" sub={`${layer.symbol},t`} bold />
          <VectorGlyph tone="blue" />
        </button>
        <span aria-hidden="true">→</span>
        <button className="clt2-node clt2-encoder" {...inspect("encoder")}>
          <MathTerm base="W" sup="enc" sub={layer.symbol} bold supRoman />
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
        <MathTerm base="z" sub={`${layer.symbol},t`} bold />
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
      aria-label={`${mode === "latent" ? "Latent mixing coefficient" : "Direct decoder direction"} from ${source.label} to ${target.label}`}
    >
      <span className="clt2-route-end source" aria-hidden="true">{source.symbol}</span>
      <span className="clt2-route-track" aria-hidden="true">
        <span className="clt2-route-label">
          {mode === "latent" ? (
            <MathTerm base="γ" sup={`${source.symbol}→${target.symbol}`} sub="a" bold />
          ) : (
            <MathTerm base="w" sup={`${source.symbol}→${target.symbol}`} sub="a" bold />
          )}
        </span>
      </span>
      <span className="clt2-route-end target" aria-hidden="true">{target.symbol}</span>
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
          title: "Featurewise cross-layer coefficients",
          body: "Bold γ is an M-vector in the architecture. Its coordinate γₐ is the scalar that changes feature a’s source-specific strength without changing its target-layer decoder direction.",
          formula: <span><MathTerm base="w" sup="s→ℓ" sub="a" bold /> = <MathTerm base="γ" sup="s→ℓ" sub="a" /> · <MathTerm base="w" sup="dec" sub="ℓ,a" bold supRoman /></span>,
        }
      : {
          title: "Independent cross-layer decoder",
          body: "The direct CLT learns a separate d-dimensional direction for every source layer, target layer, and feature coordinate.",
          formula: <MathTerm base="w" sup="s→ℓ" sub="a" tail=" ∈ ℝᵈ" bold />,
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
          <div className="clt2-encoding-row">
            <div className="clt2-layer-picker" role="group" aria-label="Choose source layer">
              <span>source layer</span>
              <div>
                {layers.map((layer) => (
                  <button
                    className={layer.key === source ? "active" : ""}
                    key={layer.key}
                    onClick={() => { setSource(layer.key); setPart("latent"); }}
                    aria-pressed={layer.key === source}
                    aria-label={`Use ${layer.label} as the source layer`}
                  >
                    {layer.symbol}
                  </button>
                ))}
              </div>
            </div>

            <button className="clt2-node clt2-residual" {...inspect("input")}>
              <MathTerm base="x" sub={`${selectedSource.symbol},t`} bold />
              <VectorGlyph tone="blue" />
            </button>
            <span className="clt2-row-arrow" aria-hidden="true">→</span>
            <button className="clt2-node clt2-encoder" {...inspect("encoder")}>
              <MathTerm base="W" sup="enc" sub={selectedSource.symbol} bold supRoman />
              <MatrixGlyph />
            </button>
            <span className="clt2-row-arrow" aria-hidden="true">→</span>
            <button className="clt2-node clt2-gate" {...inspect("gate")}>
              <span className="clt2-gate-operator"><strong>JumpReLU</strong><i>+</i><strong>Top-K</strong></span>
              <small>activation · sparsity</small>
            </button>
            <span className="clt2-row-arrow" aria-hidden="true">→</span>
            <button className="clt2-latent-vector clt2-row-latent" {...inspect("latent")}>
              <MathTerm base="z" sub={`${selectedSource.symbol},t`} bold />
              <VectorGlyph />
            </button>
          </div>
        </section>

        <section className="clt2-latent-space" aria-label="Shared M-dimensional latent space and cross-layer mixing">
          <div className="clt2-latent-head">
            <div>
              <span>02</span>
              <strong>Shared latent space <MathTerm base="ℝ" sup="M" romanBase /></strong>
            </div>
            <p>Coordinate <MathTerm base="a" /> names the same learned feature at every source layer.</p>
            <span className="clt2-path-count">6 admissible source → target paths</span>
          </div>

          <div className="clt2-map-head" aria-hidden="true">
            <span className="target">Target output</span>
            <span className="activation">source activation</span>
            {layers.map((layer) => <span className="source" key={layer.key}>source {layer.symbol}</span>)}
            <span className="result">{mode === "latent" ? "mixed latent" : "sum decoded writes"}</span>
            {mode === "latent" && <span className="decoder">base decoder</span>}
            <span className="output">MLP output</span>
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

                  <button className="clt2-source-activation" {...inspect("latent")}>
                    <MathTerm base="z" sub="s,t" bold />
                    <VectorGlyph />
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
                        <MathTerm base="z̃" sub={`${targetLayer.symbol},t`} bold />
                        <VectorGlyph />
                      </button>
                      <span className="clt2-flow-arrow" aria-hidden="true">→</span>
                      <button className="clt2-decoder-node" {...inspect("decoder")}>
                        <MathTerm base="W" sup="dec" sub={targetLayer.symbol} bold supRoman />
                        <MatrixGlyph direction="decode" />
                        <small>shared across sources</small>
                      </button>
                      <span className="clt2-flow-arrow" aria-hidden="true">→</span>
                    </>
                  )}

                  <button className="clt2-output-node" {...inspect("output")}>
                    <MathTerm base="m̂" sub={`${targetLayer.symbol},t`} bold />
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
                <strong><MathTerm base="w" sup="s→ℓ" sub="a" bold /> = <MathTerm base="γ" sup="s→ℓ" sub="a" /> · <MathTerm base="w" sup="dec" sub="ℓ,a" bold supRoman /></strong>
                <p>source-specific strength × one target-layer direction</p>
              </>
            ) : (
              <>
                <span>No factorization</span>
                <strong><MathTerm base="w" sup="s→ℓ" sub="a" bold /> <small>learned independently</small></strong>
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
