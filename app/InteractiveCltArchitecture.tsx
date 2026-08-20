"use client";

import { useState } from "react";

type Mode = "direct" | "latent";
type LayerKey = "L" | "ell" | "s";
type PartKey =
  | "residual"
  | "encoder"
  | "gate"
  | "feature"
  | "crossLayer"
  | "sum"
  | "mixed"
  | "decoder"
  | "output";

const layers: Array<{ key: LayerKey; label: string; math: string; rank: number }> = [
  { key: "L", label: "Layer L", math: "L", rank: 2 },
  { key: "ell", label: "Layer ℓ", math: "ℓ", rank: 1 },
  { key: "s", label: "Layer s", math: "s", rank: 0 },
];

const partCopy: Record<PartKey, { title: string; body: string; formula: string }> = {
  residual: {
    title: "Residual-stream input",
    body: "The frozen transformer state read at one token and one source layer.",
    formula: "xₛ,ₜ ∈ ℝᵈ",
  },
  encoder: {
    title: "Layer-specific encoder",
    body: "Each source layer has its own encoder that projects the residual state into the shared feature coordinates.",
    formula: "Wˢᵉⁿᶜ xₛ,ₜ + bˢᵉⁿᶜ",
  },
  gate: {
    title: "Sparse activation rule",
    body: "JumpReLU thresholds the coordinates, then Top-K keeps only the strongest active features for this token and layer.",
    formula: "zₛ,ₜ = Top-K(JumpReLU(·))",
  },
  feature: {
    title: "Sparse feature activations",
    body: "All source layers use the same M latent coordinates, so coordinate a can be compared and mixed across depth.",
    formula: "zₛ,ₜ ∈ ℝᴹ",
  },
  crossLayer: {
    title: "Cross-layer contribution",
    body: "Direct CLT learns a full direction for every source–target pair. Latent mixing keeps one target-layer direction and lets γ control source-specific strength.",
    formula: "wₐˢ→ℓ = γₐˢ→ℓ · wₗ,ₐᵈᵉᶜ",
  },
  sum: {
    title: "Aggregate all eligible sources",
    body: "Only source layers at or before the selected output layer contribute to that reconstruction.",
    formula: "Σₛ≤ℓ",
  },
  mixed: {
    title: "Output-specific mixed latent",
    body: "In the factorized model, source activations are mixed feature by feature before a single output-layer decoder is applied.",
    formula: "z̃ₗ,ₜ = Σₛ≤ℓ γˢ→ℓ ⊙ zₛ,ₜ",
  },
  decoder: {
    title: "Output-layer base decoder",
    body: "Latent mixing needs one M × d decoder per output layer, shared by every source feeding that layer.",
    formula: "Wₗᵈᵉᶜ ∈ ℝᴹˣᵈ",
  },
  output: {
    title: "Reconstructed MLP output",
    body: "The CLT is trained to reproduce the frozen transformer’s MLP output at the selected target layer.",
    formula: "m̂ₗ,ₜ ∈ ℝᵈ",
  },
};

function VectorDots({ tone }: { tone: "blue" | "orange" }) {
  return (
    <span className={`clt-vector-dots ${tone}`} aria-hidden="true">
      <i /><i /><i /><b>···</b><i />
    </span>
  );
}

export default function InteractiveCltArchitecture() {
  const [mode, setMode] = useState<Mode>("latent");
  const [target, setTarget] = useState<LayerKey>("L");
  const [source, setSource] = useState<LayerKey>("s");
  const [part, setPart] = useState<PartKey>("crossLayer");

  const targetLayer = layers.find((layer) => layer.key === target) ?? layers[0];
  const selectedSource = layers.find((layer) => layer.key === source) ?? layers[2];
  const eligibleLayers = layers.filter((layer) => layer.rank <= targetLayer.rank);
  const activeSource = eligibleLayers.some((layer) => layer.key === selectedSource.key)
    ? selectedSource.key
    : eligibleLayers[eligibleLayers.length - 1].key;
  const detail = partCopy[part];

  const inspect = (next: PartKey) => ({
    onMouseEnter: () => setPart(next),
    onFocus: () => setPart(next),
    onClick: () => setPart(next),
  });

  return (
    <figure className="clt-explorer full-bleed" aria-labelledby="clt-explorer-title">
      <div className="clt-explorer-head">
        <div>
          <span className="clt-figure-number">Figure 1 · interactive</span>
          <h3 id="clt-explorer-title">From direct CLT to latent mixing</h3>
          <p>Choose a target layer, trace one source, then switch the decoder parameterization.</p>
        </div>
        <div className="clt-mode-switch" role="group" aria-label="CLT parameterization">
          <button className={mode === "direct" ? "active" : ""} onClick={() => setMode("direct")}>
            Direct CLT
          </button>
          <button className={mode === "latent" ? "active" : ""} onClick={() => setMode("latent")}>
            Latent mixing
          </button>
        </div>
      </div>

      <div className="clt-comparison-strip" aria-live="polite">
        <div>
          <span>Decoder form</span>
          <strong>{mode === "direct" ? "wₐˢ→ℓ" : "γₐˢ→ℓ · wₗ,ₐᵈᵉᶜ"}</strong>
        </div>
        <div>
          <span>Direction sharing</span>
          <strong>{mode === "direct" ? "Independent for every (s, ℓ, a)" : "Shared within output layer ℓ"}</strong>
        </div>
        <div>
          <span>Decoder parameters</span>
          <strong>{mode === "direct" ? "152.32B" : "≈ 8.764B"}</strong>
          {mode === "latent" && <em>17.4× smaller</em>}
        </div>
      </div>

      <div className="clt-controls">
        <span>Reconstruct output at</span>
        <div role="group" aria-label="Select output layer">
          {layers.map((layer) => (
            <button
              key={layer.key}
              className={target === layer.key ? "active" : ""}
              onClick={() => {
                setTarget(layer.key);
                if (selectedSource.rank > layer.rank) setSource(layer.key);
              }}
            >
              {layer.label}
            </button>
          ))}
        </div>
        <span className="clt-control-note">Click a source row to trace its contribution.</span>
      </div>

      <div className="clt-diagram" data-mode={mode}>
        <div className="clt-stage-headings" aria-hidden="true">
          <span>Input residual stream</span>
          <span>Layer encoder</span>
          <span>Sparsity</span>
          <span>Shared coordinates</span>
        </div>

        <div className="clt-source-stack">
          {layers.map((layer) => {
            const eligible = layer.rank <= targetLayer.rank;
            const selected = layer.key === activeSource;
            return (
              <div
                key={layer.key}
                className={`clt-source-row ${eligible ? "eligible" : "ineligible"} ${selected ? "selected" : ""}`}
              >
                <button
                  className="clt-layer-label"
                  disabled={!eligible}
                  onClick={() => {
                    setSource(layer.key);
                    setPart("crossLayer");
                  }}
                  aria-pressed={selected}
                >
                  {layer.label}
                </button>
                <button className="clt-part vector-part" {...inspect("residual")}>
                  <span className="math-label">x<sub>{layer.math},t</sub></span>
                  <VectorDots tone="blue" />
                </button>
                <span className="clt-arrow" aria-hidden="true">→</span>
                <button className="clt-part clt-matrix" {...inspect("encoder")}>
                  W<sup>enc</sup><sub>{layer.math}</sub>
                </button>
                <span className="clt-arrow" aria-hidden="true">→</span>
                <button className="clt-part clt-gate" {...inspect("gate")}>
                  JumpReLU<br />+ Top-K
                </button>
                <span className="clt-arrow" aria-hidden="true">→</span>
                <button className="clt-part vector-part feature-vector" {...inspect("feature")}>
                  <span className="math-label">z<sub>{layer.math},t</sub></span>
                  <VectorDots tone="orange" />
                </button>
                <span className="clt-source-status">
                  {eligible ? (selected ? "tracing" : "contributes") : "after target"}
                </span>
              </div>
            );
          })}
        </div>

        <div className="clt-decode-zone">
          <div className="clt-decode-label">
            <span>{mode === "direct" ? "Independent cross-layer decoders" : "Featurewise cross-layer mixing"}</span>
            <small>Sources s ≤ {targetLayer.math}</small>
          </div>

          <div className="clt-decode-flow">
            <div className="clt-contribution-stack">
              {eligibleLayers.map((layer) => {
                const selected = layer.key === activeSource;
                return (
                  <button
                    key={layer.key}
                    className={`clt-contribution ${selected ? "selected" : ""}`}
                    {...inspect("crossLayer")}
                    onClick={() => {
                      setSource(layer.key);
                      setPart("crossLayer");
                    }}
                  >
                    <span>{layer.label}</span>
                    <strong>
                      {mode === "direct"
                        ? `wₐ${layer.math}→${targetLayer.math}`
                        : `γₐ${layer.math}→${targetLayer.math} ⊙ z${layer.math},t`}
                    </strong>
                  </button>
                );
              })}
            </div>

            <span className="clt-arrow merge-arrow" aria-hidden="true">→</span>
            <button className="clt-part clt-sum" {...inspect("sum")}>Σ</button>
            <span className="clt-arrow" aria-hidden="true">→</span>

            {mode === "latent" && (
              <>
                <button className="clt-part vector-part mixed-vector" {...inspect("mixed")}>
                  <span className="math-label">z̃<sub>{targetLayer.math},t</sub></span>
                  <VectorDots tone="orange" />
                </button>
                <span className="clt-arrow" aria-hidden="true">→</span>
                <button className="clt-part clt-matrix decoder-matrix" {...inspect("decoder")}>
                  W<sup>dec</sup><sub>{targetLayer.math}</sub>
                  <small>one shared direction</small>
                </button>
                <span className="clt-arrow" aria-hidden="true">→</span>
              </>
            )}

            <button className="clt-part vector-part output-vector" {...inspect("output")}>
              <span className="math-label">m̂<sub>{targetLayer.math},t</sub></span>
              <VectorDots tone="blue" />
            </button>
          </div>
        </div>
      </div>

      <div className="clt-inspector" aria-live="polite">
        <span>Inspecting</span>
        <div>
          <strong>{detail.title}</strong>
          <p>{detail.body}</p>
        </div>
        <code>{detail.formula}</code>
      </div>

      <figcaption>
        <strong>Figure 1.</strong> Interactive comparison of the direct and latent-mixing CLT
        parameterizations. Both encode layer-specific residual states into sparse shared feature
        coordinates. The direct CLT assigns every source–output pair an independent decoder
        direction; latent mixing replaces that direction with a source-specific scalar and one
        output-layer base direction.
      </figcaption>
    </figure>
  );
}
