"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const activationRows = [
  { id: "24-5", label: "2024 P5", target: "However", tokens: 162, periods: 6, active: 132, periodMean: 3.2070, otherMean: 0.6062, ratio: 5.2903, periodMax: 5.75, otherMax: 4.25 },
  { id: "24-12", label: "2024 P12", target: "However", tokens: 272, periods: 6, active: 137, periodMean: 3.8451, otherMean: 0.4460, ratio: 8.6211, periodMax: 5.25, otherMax: 3.1719 },
  { id: "24-29", label: "2024 P29", target: "Since", tokens: 88, periods: 3, active: 44, periodMean: 2.3255, otherMean: 0.4031, ratio: 5.7696, periodMax: 6.125, otherMax: 3.1406 },
  { id: "25-5", label: "2025 P5", target: "Since", tokens: 116, periods: 6, active: 85, periodMean: 1.8900, otherMean: 0.6048, ratio: 3.1248, periodMax: 5.25, otherMax: 3.2656 },
  { id: "25-12", label: "2025 P12", target: "However", tokens: 133, periods: 5, active: 82, periodMean: 2.1477, otherMean: 0.3813, ratio: 5.6329, periodMax: 5.6875, otherMax: 3.3906 },
  { id: "25-23", label: "2025 P23", target: "So", tokens: 146, periods: 5, active: 83, periodMean: 2.1055, otherMean: 0.5510, ratio: 3.8213, periodMax: 4.9063, otherMax: 5.6563 },
];

export function InteractiveActivationFigure() {
  const [selectedId, setSelectedId] = useState("24-12");
  const selected = activationRows.find((row) => row.id === selectedId) ?? activationRows[1];
  const axisMax = 4.25;

  return (
    <figure className="research-figure full-bleed interactive-figure activation-interactive">
      <div className="interactive-figure-heading">
        <div>
          <span>Prompt comparison</span>
          <strong>Where does L22:F31850 activate?</strong>
        </div>
        <div className="prompt-tabs" role="group" aria-label="Choose a discovery prompt">
          {activationRows.map((row) => (
            <button
              type="button"
              key={row.id}
              aria-pressed={selected.id === row.id}
              onClick={() => setSelectedId(row.id)}
            >
              {row.label}
            </button>
          ))}
        </div>
      </div>

      <div className="activation-comparison" aria-live="polite">
        <div className="activation-context">
          <span>{selected.label} · target <code>{selected.target}</code></span>
          <strong>{selected.ratio.toFixed(1)}×</strong>
          <p>higher mean activation on sentence-ending periods</p>
          <dl>
            <div><dt>Tokens</dt><dd>{selected.tokens}</dd></div>
            <div><dt>Periods</dt><dd>{selected.periods}</dd></div>
            <div><dt>Active positions</dt><dd>{selected.active}</dd></div>
          </dl>
        </div>

        <div className="activation-bars" role="img" aria-label={`Mean activation for ${selected.label}: ${selected.periodMean.toFixed(2)} on period tokens and ${selected.otherMean.toFixed(2)} on other tokens.`}>
          <div className="activation-axis" aria-hidden="true"><span>0</span><span>1</span><span>2</span><span>3</span><span>4</span></div>
          <div className="activation-bar-row period-bar-row">
            <div><strong>Period tokens</strong><small>sentence boundary</small></div>
            <div className="activation-track">
              <i style={{ width: `${Math.min(100, (selected.periodMean / axisMax) * 100)}%` }} />
              <span style={{ left: `${Math.min(96, (selected.periodMean / axisMax) * 100)}%` }}>{selected.periodMean.toFixed(2)}</span>
            </div>
          </div>
          <div className="activation-bar-row other-bar-row">
            <div><strong>Other tokens</strong><small>all remaining positions</small></div>
            <div className="activation-track">
              <i style={{ width: `${Math.min(100, (selected.otherMean / axisMax) * 100)}%` }} />
              <span style={{ left: `${Math.min(96, (selected.otherMean / axisMax) * 100)}%` }}>{selected.otherMean.toFixed(2)}</span>
            </div>
          </div>
          <p className="activation-maxima">Maximum activation: period {selected.periodMax.toFixed(2)} · other {selected.otherMax.toFixed(2)}</p>
        </div>
      </div>

      <details className="paper-snapshot">
        <summary>See every token in the selected paper example</summary>
        {/* The source is a dense paper plot whose exact token labels should remain intact. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/per_token_31850_24_12.png" alt="Original per-token activation plot for AIME 2024 Problem 12" loading="lazy" />
      </details>

      <figcaption>
        <span>Figure 2</span>
        <span>
          Select any discovery prompt to compare period and non-period activations. The pooled period-to-other ratio across the six prompts is 5.3×.
        </span>
      </figcaption>
    </figure>
  );
}

const slopeRows = [
  { feature: "L22:F31850", predicted: 0.707, observed: 0.210, description: "Mathematical logic and proof" },
  { feature: "L29:F60066", predicted: 1.800, observed: 0.192, description: "Mathematical exercises" },
  { feature: "L32:F53761", predicted: 1.636, observed: 0.089, description: "General academic text" },
  { feature: "L25:F20384", predicted: 0.351, observed: -0.064, description: "STEM question answering" },
  { feature: "L7:F20827", predicted: 0.504, observed: -0.027, description: "Conversational openings" },
];

export function InteractiveSlopeAudit() {
  const [selectedFeature, setSelectedFeature] = useState("L22:F31850");
  const selected = slopeRows.find((row) => row.feature === selectedFeature) ?? slopeRows[0];
  const maxSlope = 1.8;
  const ratio = selected.observed / selected.predicted;

  return (
    <div className="slope-chart full-bleed interactive-slope" aria-label="Clickable comparison of Neumann-predicted and observed intervention slopes">
      <div className="slope-legend">
        <span><i className="predicted-key" /> Neumann predicted</span>
        <span><i className="observed-key" /> observed intervention</span>
        <span className="zero-key">Click a feature for exact values</span>
      </div>
      {slopeRows.map((row) => (
        <button
          type="button"
          className={`slope-row ${selectedFeature === row.feature ? "selected-slope" : ""}`}
          key={row.feature}
          aria-pressed={selectedFeature === row.feature}
          onClick={() => setSelectedFeature(row.feature)}
        >
          <code>{row.feature}</code>
          <span className="slope-track">
            <i className="predicted-bar" style={{ width: `${(row.predicted / maxSlope) * 100}%` }} />
            <i className={`observed-bar ${row.observed < 0 ? "negative-bar" : ""}`} style={{ width: `${Math.max(0.3, (Math.abs(row.observed) / maxSlope) * 100)}%` }} />
          </span>
          <span className="slope-values">
            <span>{row.predicted.toFixed(3)}</span>
            <strong>{row.observed.toFixed(3)}</strong>
          </span>
          <span className="ratio-badge">× {(row.observed / row.predicted).toFixed(2)}</span>
        </button>
      ))}
      <div className="slope-selection" aria-live="polite">
        <div><strong>{selected.feature}</strong><span>{selected.description}</span></div>
        <span>Predicted <b>{selected.predicted.toFixed(3)}</b></span>
        <span>Observed <b>{selected.observed.toFixed(3)}</b></span>
        <span>Observed / predicted <b>{ratio.toFixed(2)}</b></span>
      </div>
    </div>
  );
}

type ProbabilityRow = {
  token: string;
  amplified: [number, number, number];
  reversed: [number, number, number];
};

const probabilityRows: ProbabilityRow[] = [
  { token: "Since", amplified: [4.38, 18.75, 14.37], reversed: [1.89, 0.14, -1.75] },
  { token: "We", amplified: [7.06, 17.63, 10.57], reversed: [3.45, 0.50, -2.95] },
  { token: "So", amplified: [2.45, 5.16, 2.71], reversed: [0.93, 0.20, -0.73] },
  { token: "Let", amplified: [2.10, 4.49, 2.39], reversed: [1.01, 0.20, -0.81] },
  { token: "In", amplified: [0.79, 2.88, 2.09], reversed: [0.28, 0.03, -0.25] },
  { token: "However", amplified: [1.43, 2.59, 1.16], reversed: [0.45, 0.10, -0.35] },
  { token: "The", amplified: [5.68, 5.99, 0.31], reversed: [2.86, 1.59, -1.27] },
  { token: "Therefore", amplified: [0.75, 0.98, 0.23], reversed: [0.18, 0.06, -0.12] },
  { token: "But", amplified: [0.49, 0.71, 0.22], reversed: [0.22, 0.08, -0.14] },
  { token: "For", amplified: [0.28, 0.48, 0.20], reversed: [0.06, 0.01, -0.05] },
  { token: "\\n", amplified: [36.25, 15.43, -20.82], reversed: [63.47, 72.54, 9.07] },
  { token: "\\n\\n", amplified: [18.60, 9.59, -9.01], reversed: [11.55, 12.75, 1.20] },
  { token: "Then", amplified: [6.67, 5.27, -1.40], reversed: [5.20, 4.15, -1.05] },
  { token: "Also", amplified: [1.27, 0.28, -0.99], reversed: [0.40, 0.60, 0.20] },
  { token: "Thus", amplified: [2.88, 2.17, -0.71], reversed: [1.08, 0.67, -0.41] },
  { token: "$", amplified: [0.85, 0.33, -0.52], reversed: [1.51, 2.08, 0.57] },
  { token: "If", amplified: [0.60, 0.36, -0.24], reversed: [0.25, 0.24, -0.01] },
  { token: "This", amplified: [3.31, 3.09, -0.22], reversed: [2.12, 0.94, -1.18] },
  { token: "There", amplified: [0.28, 0.10, -0.18], reversed: [0.20, 0.22, 0.02] },
  { token: "Each", amplified: [0.24, 0.11, -0.13], reversed: [0.19, 0.22, 0.03] },
];

export function InteractiveProbabilityShift() {
  const [setting, setSetting] = useState<"amplified" | "reversed">("amplified");
  const [selectedToken, setSelectedToken] = useState("Since");
  const selected = probabilityRows.find((row) => row.token === selectedToken) ?? probabilityRows[0];
  const selectedValues = selected[setting];
  const maxMagnitude = 21;

  return (
    <div className="probability-interactive">
      <div className="probability-controls" role="group" aria-label="Intervention direction">
        <button type="button" aria-pressed={setting === "amplified"} onClick={() => setSetting("amplified")}>Amplified · ×3</button>
        <button type="button" aria-pressed={setting === "reversed"} onClick={() => setSetting("reversed")}>Reversed · ×−1</button>
      </div>
      <div className="probability-axis" aria-hidden="true"><span>−20 pp</span><span>0</span><span>+20 pp</span></div>
      <div className="probability-rows">
        {probabilityRows.map((row) => {
          const delta = row[setting][2];
          return (
            <button
              type="button"
              key={row.token}
              className={selectedToken === row.token ? "is-selected" : ""}
              aria-pressed={selectedToken === row.token}
              onClick={() => setSelectedToken(row.token)}
            >
              <code>{row.token}</code>
              <span className="probability-track">
                <i
                  className={delta < 0 ? "negative-shift" : "positive-shift"}
                  style={{ width: `${(Math.abs(delta) / maxMagnitude) * 50}%` }}
                />
              </span>
              <strong>{delta > 0 ? "+" : ""}{delta.toFixed(2)}</strong>
            </button>
          );
        })}
      </div>
      <div className="probability-selection" aria-live="polite">
        <strong><code>{selected.token}</code></strong>
        <span>Clean <b>{selectedValues[0].toFixed(2)}%</b></span>
        <span>Edited <b>{selectedValues[1].toFixed(2)}%</b></span>
        <span>Change <b>{selectedValues[2] > 0 ? "+" : ""}{selectedValues[2].toFixed(2)} pp</b></span>
      </div>
    </div>
  );
}

type ContinuationGroup = {
  label: string;
  className: string;
  counts: [number, number, number];
};

const continuationSettings = ["Vanilla", "Amplified · ×3", "Reversed · ×−1"] as const;
const continuationTotals = [322560, 347934, 312950];
const continuationGroups: ContinuationGroup[] = [
  { label: "Newline", className: "continuation-newline", counts: [212248, 84942, 259906] },
  { label: "Since", className: "continuation-since", counts: [8913, 63644, 444] },
  { label: "We", className: "continuation-we", counts: [14935, 59592, 1502] },
  { label: "So + Let + In + However", className: "continuation-connectives", counts: [12786, 51332, 1404] },
  { label: "Other listed tokens", className: "continuation-listed", counts: [50958, 58191, 30335] },
  { label: "Other", className: "continuation-other", counts: [22720, 30233, 19359] },
];

function continuationShare(group: ContinuationGroup, settingIndex: number) {
  return (100 * group.counts[settingIndex]) / continuationTotals[settingIndex];
}

export function InteractiveContinuationFigure() {
  const [selectedGroup, setSelectedGroup] = useState(0);
  const selected = continuationGroups[selectedGroup];

  return (
    <figure className="research-figure full-bleed interactive-figure continuation-interactive">
      <div className="interactive-figure-heading">
        <div>
          <span>Generated continuations</span>
          <strong>What appears after a sentence-ending period?</strong>
        </div>
        <small>Click a segment or legend item</small>
      </div>

      <div className="continuation-legend" aria-label="Continuation categories">
        {continuationGroups.map((group, index) => (
          <button
            type="button"
            key={group.label}
            aria-pressed={selectedGroup === index}
            onClick={() => setSelectedGroup(index)}
          >
            <i className={group.className} aria-hidden="true" />
            {group.label}
          </button>
        ))}
      </div>

      <div className="continuation-chart">
        {continuationSettings.map((setting, settingIndex) => (
          <div className="continuation-row" key={setting}>
            <strong>{setting}</strong>
            <div className="continuation-stack" aria-label={`${setting} continuation composition`}>
              {continuationGroups.map((group, groupIndex) => {
                const share = continuationShare(group, settingIndex);
                return (
                  <button
                    type="button"
                    key={group.label}
                    className={`${group.className} ${selectedGroup === groupIndex ? "is-selected" : ""}`}
                    style={{ width: `${share}%` }}
                    aria-label={`${setting}, ${group.label}: ${share.toFixed(1)} percent, ${group.counts[settingIndex].toLocaleString()} tokens`}
                    aria-pressed={selectedGroup === groupIndex}
                    onClick={() => setSelectedGroup(groupIndex)}
                  >
                    {share >= 8 ? <span>{share.toFixed(1)}%</span> : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div className="continuation-axis" aria-hidden="true"><span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span></div>
      </div>

      <div className="continuation-selection" aria-live="polite">
        <strong>{selected.label}</strong>
        {continuationSettings.map((setting, index) => (
          <span key={setting}>{setting}: <b>{continuationShare(selected, index).toFixed(1)}%</b></span>
        ))}
      </div>

      <figcaption>
        <span>Figure 3</span>
        <span>
          Tokens actually generated after sentence-ending periods in 7,141 matched solutions. Amplification trades line breaks for a restricted family of continuations; reversal exposes the opposite direction of the same axis.
        </span>
      </figcaption>
    </figure>
  );
}

type AccuracyRow = {
  year: 2024 | 2025;
  problem: number;
  n: number;
  vanilla: number;
  amplified: number;
  reversed: number;
};

const accuracyRows: AccuracyRow[] = [
  { year: 2024, problem: 0, n: 91, vanilla: 11.0, amplified: 5.5, reversed: 12.1 },
  { year: 2024, problem: 1, n: 121, vanilla: 0.8, amplified: 1.7, reversed: 2.5 },
  { year: 2024, problem: 2, n: 128, vanilla: 70.3, amplified: 82.8, reversed: 77.3 },
  { year: 2024, problem: 3, n: 128, vanilla: 3.9, amplified: 2.3, reversed: 3.1 },
  { year: 2024, problem: 4, n: 128, vanilla: 0.0, amplified: 0.0, reversed: 0.0 },
  { year: 2024, problem: 5, n: 127, vanilla: 0.0, amplified: 0.0, reversed: 0.0 },
  { year: 2024, problem: 6, n: 128, vanilla: 0.0, amplified: 0.0, reversed: 0.0 },
  { year: 2024, problem: 7, n: 126, vanilla: 0.0, amplified: 0.0, reversed: 0.0 },
  { year: 2024, problem: 8, n: 128, vanilla: 45.3, amplified: 49.2, reversed: 46.1 },
  { year: 2024, problem: 9, n: 128, vanilla: 0.0, amplified: 0.0, reversed: 2.3 },
  { year: 2024, problem: 10, n: 125, vanilla: 32.8, amplified: 32.0, reversed: 32.0 },
  { year: 2024, problem: 11, n: 120, vanilla: 0.0, amplified: 0.0, reversed: 0.0 },
  { year: 2024, problem: 12, n: 104, vanilla: 17.3, amplified: 41.3, reversed: 17.3 },
  { year: 2024, problem: 13, n: 125, vanilla: 0.0, amplified: 0.0, reversed: 0.0 },
  { year: 2024, problem: 14, n: 128, vanilla: 0.0, amplified: 0.0, reversed: 0.0 },
  { year: 2024, problem: 15, n: 122, vanilla: 0.0, amplified: 0.0, reversed: 0.0 },
  { year: 2024, problem: 16, n: 124, vanilla: 10.5, amplified: 9.7, reversed: 9.7 },
  { year: 2024, problem: 17, n: 128, vanilla: 0.0, amplified: 0.0, reversed: 0.0 },
  { year: 2024, problem: 18, n: 126, vanilla: 0.0, amplified: 0.0, reversed: 0.0 },
  { year: 2024, problem: 19, n: 124, vanilla: 0.0, amplified: 0.0, reversed: 0.0 },
  { year: 2024, problem: 20, n: 115, vanilla: 0.0, amplified: 0.0, reversed: 0.0 },
  { year: 2024, problem: 21, n: 128, vanilla: 1.6, amplified: 2.3, reversed: 0.8 },
  { year: 2024, problem: 22, n: 125, vanilla: 0.8, amplified: 0.8, reversed: 0.0 },
  { year: 2024, problem: 23, n: 128, vanilla: 18.8, amplified: 14.1, reversed: 27.3 },
  { year: 2024, problem: 24, n: 113, vanilla: 0.0, amplified: 0.0, reversed: 0.0 },
  { year: 2024, problem: 25, n: 41, vanilla: 0.0, amplified: 0.0, reversed: 0.0 },
  { year: 2024, problem: 26, n: 66, vanilla: 0.0, amplified: 0.0, reversed: 0.0 },
  { year: 2024, problem: 27, n: 123, vanilla: 0.0, amplified: 0.0, reversed: 0.0 },
  { year: 2024, problem: 28, n: 128, vanilla: 0.0, amplified: 0.0, reversed: 0.8 },
  { year: 2024, problem: 29, n: 126, vanilla: 0.0, amplified: 0.0, reversed: 0.0 },
  { year: 2025, problem: 0, n: 128, vanilla: 93.8, amplified: 98.4, reversed: 99.2 },
  { year: 2025, problem: 1, n: 117, vanilla: 0.0, amplified: 0.0, reversed: 0.0 },
  { year: 2025, problem: 2, n: 128, vanilla: 29.7, amplified: 28.9, reversed: 25.0 },
  { year: 2025, problem: 3, n: 128, vanilla: 0.0, amplified: 0.8, reversed: 0.0 },
  { year: 2025, problem: 4, n: 128, vanilla: 0.0, amplified: 2.3, reversed: 1.6 },
  { year: 2025, problem: 5, n: 128, vanilla: 83.6, amplified: 82.0, reversed: 71.9 },
  { year: 2025, problem: 6, n: 128, vanilla: 0.0, amplified: 0.0, reversed: 0.0 },
  { year: 2025, problem: 7, n: 128, vanilla: 6.2, amplified: 3.1, reversed: 3.9 },
  { year: 2025, problem: 8, n: 128, vanilla: 20.3, amplified: 24.2, reversed: 21.1 },
  { year: 2025, problem: 9, n: 128, vanilla: 0.0, amplified: 0.0, reversed: 0.8 },
  { year: 2025, problem: 10, n: 18, vanilla: 0.0, amplified: 0.0, reversed: 0.0 },
  { year: 2025, problem: 11, n: 128, vanilla: 0.0, amplified: 0.0, reversed: 0.0 },
  { year: 2025, problem: 12, n: 128, vanilla: 0.0, amplified: 0.0, reversed: 0.0 },
  { year: 2025, problem: 13, n: 128, vanilla: 0.8, amplified: 0.0, reversed: 0.8 },
  { year: 2025, problem: 14, n: 128, vanilla: 0.0, amplified: 0.0, reversed: 0.0 },
  { year: 2025, problem: 15, n: 128, vanilla: 7.0, amplified: 8.6, reversed: 14.1 },
  { year: 2025, problem: 16, n: 128, vanilla: 89.1, amplified: 83.6, reversed: 82.8 },
  { year: 2025, problem: 17, n: 128, vanilla: 0.0, amplified: 0.0, reversed: 0.0 },
  { year: 2025, problem: 18, n: 128, vanilla: 0.0, amplified: 0.8, reversed: 0.0 },
  { year: 2025, problem: 19, n: 82, vanilla: 1.2, amplified: 2.4, reversed: 1.2 },
  { year: 2025, problem: 20, n: 44, vanilla: 0.0, amplified: 0.0, reversed: 0.0 },
  { year: 2025, problem: 21, n: 128, vanilla: 0.0, amplified: 0.0, reversed: 0.0 },
  { year: 2025, problem: 22, n: 128, vanilla: 0.0, amplified: 0.0, reversed: 0.0 },
  { year: 2025, problem: 23, n: 128, vanilla: 0.0, amplified: 0.0, reversed: 0.0 },
  { year: 2025, problem: 24, n: 128, vanilla: 0.0, amplified: 0.0, reversed: 0.0 },
  { year: 2025, problem: 25, n: 128, vanilla: 0.0, amplified: 0.0, reversed: 0.0 },
  { year: 2025, problem: 26, n: 128, vanilla: 0.0, amplified: 0.0, reversed: 0.0 },
  { year: 2025, problem: 27, n: 128, vanilla: 0.0, amplified: 0.0, reversed: 0.0 },
  { year: 2025, problem: 28, n: 128, vanilla: 0.0, amplified: 0.0, reversed: 0.0 },
  { year: 2025, problem: 29, n: 128, vanilla: 0.0, amplified: 0.8, reversed: 0.8 },
];

type AccuracyMode = "absolute" | "change";

function chartGeometry(width: number, height: number) {
  const left = width < 520 ? 43 : 54;
  return { left, right: 16, top: 22, bottom: 44, plotWidth: width - left - 16, plotHeight: height - 66 };
}

export function InteractiveAccuracyFigure() {
  const [year, setYear] = useState<2024 | 2025>(2024);
  const [mode, setMode] = useState<AccuracyMode>("change");
  const [selectedProblem, setSelectedProblem] = useState(12);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(() => accuracyRows.filter((row) => row.year === year), [year]);
  const selected = rows.find((row) => row.problem === selectedProblem) ?? rows[0];

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const holder = chartRef.current;
    if (!canvas || !holder) return;
    const width = holder.clientWidth;
    const height = width < 520 ? 300 : 350;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);

    const styles = getComputedStyle(holder);
    const ink = styles.getPropertyValue("--ink").trim();
    const muted = styles.getPropertyValue("--ink-soft").trim();
    const rule = styles.getPropertyValue("--rule-solid").trim();
    const forest = styles.getPropertyValue("--forest").trim();
    const signal = styles.getPropertyValue("--signal").trim();
    const gold = styles.getPropertyValue("--gold").trim();
    const font = styles.getPropertyValue("--sans").trim();
    const geometry = chartGeometry(width, height);
    const x = (problem: number) => geometry.left + (problem / 29) * geometry.plotWidth;
    const yMin = mode === "absolute" ? 0 : -18;
    const yMax = mode === "absolute" ? 100 : 30;
    const y = (value: number) => geometry.top + ((yMax - value) / (yMax - yMin)) * geometry.plotHeight;
    const yTicks = mode === "absolute" ? [0, 25, 50, 75, 100] : [-10, 0, 10, 20, 30];

    context.font = `11px ${font}`;
    context.textBaseline = "middle";
    yTicks.forEach((tick) => {
      context.strokeStyle = rule;
      context.lineWidth = tick === 0 ? 1.3 : 1;
      context.setLineDash(tick === 0 && mode === "change" ? [5, 4] : []);
      context.beginPath();
      context.moveTo(geometry.left, y(tick));
      context.lineTo(width - geometry.right, y(tick));
      context.stroke();
      context.setLineDash([]);
      context.fillStyle = muted;
      context.textAlign = "right";
      context.fillText(`${tick}${mode === "absolute" ? "%" : ""}`, geometry.left - 8, y(tick));
    });

    [0, 5, 10, 15, 20, 25, 29].forEach((tick) => {
      context.fillStyle = muted;
      context.textAlign = "center";
      context.fillText(String(tick), x(tick), height - 25);
    });
    context.fillStyle = ink;
    context.fillText("Problem", geometry.left + geometry.plotWidth / 2, height - 7);

    const series = mode === "absolute"
      ? [
          { key: "vanilla" as const, color: forest },
          { key: "amplified" as const, color: signal },
          { key: "reversed" as const, color: gold },
        ]
      : [
          { key: "amplified" as const, color: signal },
          { key: "reversed" as const, color: gold },
        ];

    series.forEach((seriesItem) => {
      context.strokeStyle = seriesItem.color;
      context.lineWidth = 1.65;
      context.beginPath();
      rows.forEach((row, index) => {
        const value = mode === "absolute" ? row[seriesItem.key] : row[seriesItem.key] - row.vanilla;
        if (index === 0) context.moveTo(x(row.problem), y(value));
        else context.lineTo(x(row.problem), y(value));
      });
      context.stroke();

      rows.forEach((row) => {
        const value = mode === "absolute" ? row[seriesItem.key] : row[seriesItem.key] - row.vanilla;
        context.beginPath();
        context.fillStyle = seriesItem.color;
        context.arc(x(row.problem), y(value), row.problem === selectedProblem ? 4.6 : 2.7, 0, Math.PI * 2);
        context.fill();
        if (row.problem === selectedProblem) {
          context.strokeStyle = ink;
          context.lineWidth = 1.3;
          context.stroke();
        }
      });
    });

    context.strokeStyle = ink;
    context.globalAlpha = 0.35;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(x(selectedProblem), geometry.top);
    context.lineTo(x(selectedProblem), geometry.top + geometry.plotHeight);
    context.stroke();
    context.globalAlpha = 1;
  }, [mode, rows, selectedProblem]);

  useEffect(() => {
    draw();
    const holder = chartRef.current;
    if (!holder) return;
    const observer = new ResizeObserver(draw);
    observer.observe(holder);
    return () => observer.disconnect();
  }, [draw]);

  const selectNearest = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const geometry = chartGeometry(rect.width, rect.height);
    const localX = clientX - rect.left;
    const problem = Math.max(0, Math.min(29, Math.round(((localX - geometry.left) / geometry.plotWidth) * 29)));
    setSelectedProblem(problem);
  };

  return (
    <figure className="research-figure full-bleed interactive-figure accuracy-interactive">
      <div className="interactive-figure-heading">
        <div>
          <span>Problem-level outcomes</span>
          <strong>Accuracy effects are heterogeneous</strong>
        </div>
        <div className="accuracy-controls">
          <div role="group" aria-label="AIME year">
            <button type="button" aria-pressed={year === 2024} onClick={() => { setYear(2024); setSelectedProblem(12); }}>2024</button>
            <button type="button" aria-pressed={year === 2025} onClick={() => { setYear(2025); setSelectedProblem(0); }}>2025</button>
          </div>
          <div role="group" aria-label="Accuracy chart mode">
            <button type="button" aria-pressed={mode === "absolute"} onClick={() => setMode("absolute")}>Accuracy</button>
            <button type="button" aria-pressed={mode === "change"} onClick={() => setMode("change")}>Δ vs vanilla</button>
          </div>
        </div>
      </div>

      <div className="accuracy-legend" aria-label="Chart series">
        {mode === "absolute" ? <span><i className="series-vanilla" />Vanilla</span> : null}
        <span><i className="series-amplified" />Amplified</span>
        <span><i className="series-reversed" />Reversed</span>
      </div>

      <div className="accuracy-canvas" ref={chartRef}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`AIME ${year} per-problem ${mode === "absolute" ? "accuracy" : "accuracy change versus vanilla"}. Use the problem selector below for exact values.`}
          onPointerMove={(event) => selectNearest(event.clientX)}
          onClick={(event) => selectNearest(event.clientX)}
        >
          Per-problem AIME accuracy under vanilla, amplification, and reversal.
        </canvas>
      </div>

      <div className="accuracy-selection" aria-live="polite">
        <label>
          Problem
          <select value={selectedProblem} onChange={(event) => setSelectedProblem(Number(event.target.value))}>
            {rows.map((row) => <option key={row.problem} value={row.problem}>{row.problem}</option>)}
          </select>
        </label>
        <strong>AIME {year} · P{selected.problem}</strong>
        <span>Vanilla <b>{selected.vanilla.toFixed(1)}%</b></span>
        <span>Amplified <b>{selected.amplified.toFixed(1)}%</b> <small>({selected.amplified - selected.vanilla >= 0 ? "+" : ""}{(selected.amplified - selected.vanilla).toFixed(1)} pp)</small></span>
        <span>Reversed <b>{selected.reversed.toFixed(1)}%</b> <small>({selected.reversed - selected.vanilla >= 0 ? "+" : ""}{(selected.reversed - selected.vanilla).toFixed(1)} pp)</small></span>
        <span className="sample-count">n = {selected.n}</span>
      </div>

      <figcaption>
        <span>Figure 4</span>
        <span>
          Switch year and view, then hover or click a problem for exact paired values. More than half of the 60 problems remain at a zero floor under every setting; nonzero problems move in both directions.
        </span>
      </figcaption>
    </figure>
  );
}
