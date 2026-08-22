"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import periodTokenActivations from "./period-token-activations.json";

type ActivationSentence = {
  id: string;
  slug: string;
  label: string;
  target: string;
  tokens: string[];
  activations: number[];
  periods: number[];
  nTokens: number;
  nPeriod: number;
  active: number;
  periodMean: number;
  otherMean: number;
  ratio: number;
  periodMax: number;
  otherMax: number;
};

const activationSentences: ActivationSentence[] = periodTokenActivations.sentences;
const pooledPeriodRatio = periodTokenActivations.pooledRatio;

const PROFILE_WIDTH = 1000;
const PROFILE_HEIGHT = 300;
const PROFILE_MARGIN = { top: 24, right: 104, bottom: 50, left: 46 };
const PROFILE_PLOT_WIDTH = PROFILE_WIDTH - PROFILE_MARGIN.left - PROFILE_MARGIN.right;
const PROFILE_PLOT_HEIGHT = PROFILE_HEIGHT - PROFILE_MARGIN.top - PROFILE_MARGIN.bottom;
// One y-scale for all six prompts so switching tabs compares like with like.
const PROFILE_Y_MAX = Math.ceil(
  Math.max(...activationSentences.flatMap((sentence) => sentence.activations)) * 2,
) / 2;
const PROFILE_Y_TICKS = Array.from({ length: Math.floor(PROFILE_Y_MAX / 2) + 1 }, (_, i) => i * 2);
const TOOLTIP_HEIGHT = 46;
const TOOLTIP_PAD = 20;
// The tooltip is monospaced, so character count is a reliable width.
const TOOLTIP_CHAR_WIDTH = 7.5;

function profileY(value: number) {
  const y = PROFILE_MARGIN.top + (1 - value / PROFILE_Y_MAX) * PROFILE_PLOT_HEIGHT;
  return Number(y.toFixed(2));
}

function profileSlot(count: number) {
  return PROFILE_PLOT_WIDTH / count;
}

function profileX(index: number, slot: number, width: number) {
  return Number((PROFILE_MARGIN.left + index * slot + (slot - width) / 2).toFixed(2));
}

function xTickStep(count: number) {
  return Math.max(10, Math.ceil(count / 80) * 10);
}

// "▁has" -> " has"; keeps leading spaces and newlines visible inside the quotes.
function tokenLabel(token: string) {
  const text = token.replace(/▁/g, " ").replace(/\n/g, "\\n");
  return text.length > 24 ? `${text.slice(0, 23)}…` : text;
}

export function InteractiveActivationFigure() {
  const [selectedId, setSelectedId] = useState("24-12");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const selected = activationSentences.find((row) => row.id === selectedId) ?? activationSentences[1];

  const periodSet = useMemo(() => new Set(selected.periods), [selected]);
  const slot = profileSlot(selected.nTokens);
  const barWidth = Math.max(1.4, slot * 0.78);
  const periodBarWidth = Math.max(barWidth, 2.2);
  const baseline = profileY(0);
  const tickStep = xTickStep(selected.nTokens);
  const xTicks = Array.from({ length: Math.floor((selected.nTokens - 1) / tickStep) + 1 }, (_, i) => i * tickStep);

  const hovered = hoveredIndex === null ? null : {
    index: hoveredIndex,
    activation: selected.activations[hoveredIndex],
    lines: [
      `#${hoveredIndex} “${tokenLabel(selected.tokens[hoveredIndex])}”`,
      `activation ${selected.activations[hoveredIndex].toFixed(2)}`
        + (periodSet.has(hoveredIndex) ? " · sentence-ending period" : ""),
    ],
  };
  const tooltipWidth = hovered === null
    ? 0
    : TOOLTIP_PAD + TOOLTIP_CHAR_WIDTH * Math.max(...hovered.lines.map((line) => line.length));
  const tooltipX = hovered === null
    ? 0
    : Math.min(
        PROFILE_WIDTH - PROFILE_MARGIN.right - tooltipWidth,
        Math.max(PROFILE_MARGIN.left, profileX(hovered.index, slot, 0) - tooltipWidth / 2),
      );
  const tooltipY = hovered === null
    ? 0
    : Math.max(PROFILE_MARGIN.top, profileY(hovered.activation) - TOOLTIP_HEIGHT - 8);

  return (
    <figure className="research-figure full-bleed interactive-figure activation-interactive">
      <div className="interactive-figure-heading">
        <div>
          <span>Prompt comparison</span>
          <strong>Where does L22:F31850 activate?</strong>
        </div>
        <div className="prompt-tabs" role="group" aria-label="Choose a discovery prompt">
          {activationSentences.map((row) => (
            <button
              type="button"
              key={row.id}
              aria-pressed={selected.id === row.id}
              onClick={() => {
                setSelectedId(row.id);
                setHoveredIndex(null);
              }}
            >
              {row.label}
            </button>
          ))}
        </div>
      </div>

      <div className="activation-comparison" aria-live="polite">
        <div className="activation-context">
          <p className="context-prompt">
            {selected.label}
            <span>target <code>{selected.target}</code></span>
          </p>

          <div className="context-ratio">
            <strong>{selected.ratio.toFixed(1)}<span>×</span></strong>
            <span>period mean ÷ other mean</span>
          </div>

          <dl className="context-split">
            <div className="is-period">
              <dt>period mean</dt>
              <dd>{selected.periodMean.toFixed(2)}</dd>
              <small>{selected.nPeriod} positions</small>
            </div>
            <div className="is-other">
              <dt>other mean</dt>
              <dd>{selected.otherMean.toFixed(2)}</dd>
              <small>{selected.nTokens - selected.nPeriod} positions</small>
            </div>
          </dl>

          <dl className="context-stats">
            <div><dt>Prompt tokens</dt><dd>{selected.nTokens}</dd></div>
            <div><dt>Nonzero positions</dt><dd>{selected.active}</dd></div>
            <div><dt>Peak on a period</dt><dd>{selected.periodMax.toFixed(2)}</dd></div>
            <div><dt>Peak elsewhere</dt><dd>{selected.otherMax.toFixed(2)}</dd></div>
          </dl>
        </div>

        <div className="activation-bars">
          <div className="activation-legend" aria-hidden="true">
            <span className="is-period"><i />sentence-ending period</span>
            <span className="is-other"><i />other token</span>
            <span className="is-mean"><i />class mean</span>
          </div>

          <div className="activation-profile-scroll">
          <svg
            className="activation-profile"
            viewBox={`0 0 ${PROFILE_WIDTH} ${PROFILE_HEIGHT}`}
            role="img"
            aria-label={`Per-token activation of L22:F31850 on ${selected.label}. Mean ${selected.periodMean.toFixed(2)} on the ${selected.nPeriod} sentence-ending period tokens versus ${selected.otherMean.toFixed(2)} on the other ${selected.nTokens - selected.nPeriod} positions, a ratio of ${selected.ratio.toFixed(1)} times.`}
            onPointerLeave={() => setHoveredIndex(null)}
          >
            <g className="profile-grid" aria-hidden="true">
              {PROFILE_Y_TICKS.filter((tick) => tick > 0).map((tick) => (
                <line
                  key={tick}
                  x1={PROFILE_MARGIN.left}
                  x2={PROFILE_WIDTH - PROFILE_MARGIN.right}
                  y1={profileY(tick)}
                  y2={profileY(tick)}
                />
              ))}
            </g>

            <g className="profile-axes" aria-hidden="true">
              <line
                x1={PROFILE_MARGIN.left}
                x2={PROFILE_MARGIN.left}
                y1={PROFILE_MARGIN.top}
                y2={baseline}
              />
              <line
                x1={PROFILE_MARGIN.left}
                x2={PROFILE_WIDTH - PROFILE_MARGIN.right}
                y1={baseline}
                y2={baseline}
              />
              {PROFILE_Y_TICKS.map((tick) => (
                <text key={tick} x={PROFILE_MARGIN.left - 8} y={profileY(tick) + 3.5} textAnchor="end">
                  {tick}
                </text>
              ))}
              {xTicks.map((tick) => (
                <text
                  key={tick}
                  x={profileX(tick, slot, 0)}
                  y={baseline + 26}
                  textAnchor="middle"
                >
                  {tick}
                </text>
              ))}
              <text className="axis-label" x={4} y={PROFILE_MARGIN.top - 10}>
                activation
              </text>
              <text
                className="axis-label"
                x={PROFILE_MARGIN.left + PROFILE_PLOT_WIDTH / 2}
                y={PROFILE_HEIGHT - 6}
                textAnchor="middle"
              >
                token position
              </text>
            </g>

            <g className="profile-means" aria-hidden="true">
              <line
                className="mean-other"
                x1={PROFILE_MARGIN.left}
                x2={PROFILE_WIDTH - PROFILE_MARGIN.right}
                y1={profileY(selected.otherMean)}
                y2={profileY(selected.otherMean)}
              />
              <line
                className="mean-period"
                x1={PROFILE_MARGIN.left}
                x2={PROFILE_WIDTH - PROFILE_MARGIN.right}
                y1={profileY(selected.periodMean)}
                y2={profileY(selected.periodMean)}
              />
              <text
                className="mean-period"
                x={PROFILE_WIDTH - PROFILE_MARGIN.right + 7}
                y={profileY(selected.periodMean) + 3.2}
              >
                period {selected.periodMean.toFixed(2)}
              </text>
              <text
                className="mean-other"
                x={PROFILE_WIDTH - PROFILE_MARGIN.right + 7}
                y={profileY(selected.otherMean) + 3.2}
              >
                other {selected.otherMean.toFixed(2)}
              </text>
            </g>

            <g className="profile-bars">
              {selected.activations.map((value, index) => {
                const isPeriod = periodSet.has(index);
                const width = isPeriod ? periodBarWidth : barWidth;
                const top = profileY(value);
                return (
                  <rect
                    key={index}
                    className={`${isPeriod ? "is-period" : ""} ${hoveredIndex === index ? "is-hovered" : ""}`.trim()}
                    x={profileX(index, slot, width)}
                    y={top}
                    width={width}
                    height={Math.max(0, baseline - top)}
                  />
                );
              })}
            </g>

            {/* Period markers stay visible even where the feature is silent. */}
            <g className="profile-period-marks" aria-hidden="true">
              {selected.periods.map((index) => (
                <line
                  key={index}
                  x1={profileX(index, slot, 0)}
                  x2={profileX(index, slot, 0)}
                  y1={baseline}
                  y2={baseline + 5}
                />
              ))}
            </g>

            <g className="profile-hits">
              {selected.activations.map((value, index) => (
                <rect
                  key={index}
                  className="profile-hit"
                  x={PROFILE_MARGIN.left + index * slot}
                  y={PROFILE_MARGIN.top}
                  width={slot}
                  height={PROFILE_PLOT_HEIGHT}
                  onPointerEnter={() => setHoveredIndex(index)}
                  onPointerDown={() => setHoveredIndex(index)}
                />
              ))}
            </g>

            {hovered ? (
              <g className="profile-tooltip" transform={`translate(${tooltipX} ${tooltipY})`} aria-hidden="true">
                <rect width={tooltipWidth} height={TOOLTIP_HEIGHT} rx={3} />
                <text x={10} y={19}>{hovered.lines[0]}</text>
                <text className="tooltip-value" x={10} y={35}>{hovered.lines[1]}</text>
              </g>
            ) : null}
          </svg>
          </div>
        </div>
      </div>

      <figcaption>
        <span>Figure 2</span>
        <span>
          Per-token activation of L22:F31850 in each of the six discovery prompts. One bar per token
          position; orange bars are tokens whose decoded text ends in a period, and the tick below the
          axis marks every such token even where the feature is silent. Dashed lines are the two class
          means whose ratio is the number on the left; nonzero positions counts the token positions where
          the feature clears its JumpReLU threshold. Pooled over the six prompts the ratio is{" "}
          {pooledPeriodRatio.toFixed(1)}×.
        </span>
      </figcaption>
    </figure>
  );
}

const slopeRows = [
  {
    feature: "L22:F31850",
    predicted: 0.707,
    observed: 0.210,
    recurrence: "5/6",
    description: "Mathematical logic and proof",
    evidence: [
      { activation: 7.75, before: "…the usual identification $\\text{MCG}(T^2) \\cong \\text{SL}(2,\\mathbb{Z})$", token: ").", after: " For the trace +2 ones, the Seifert invariants are simply …" },
      { activation: 7.6562, before: "…I want to show that M is isomorphic to the injective hull of V", token: "$.", after: " Any suggestion would be appreciated! Look at Theorem 3.52 in Lectures on Modules …" },
      { activation: 7.625, before: "…where U is open in ℝⁿ, the set f(U) is open", token: ".", after: " I saw related questions where other users mention the invariance of domain theorem …" },
    ],
  },
  {
    feature: "L29:F60066",
    predicted: 1.800,
    observed: 0.192,
    recurrence: "5/6",
    description: "Mathematical exercises",
    evidence: [
      { activation: 4.7812, before: "…k(x) = 2√(x + 1) + 3, part (d) $\\left(−1, 3", token: "\\", after: "right)$" },
      { activation: 4.75, before: "…a survey of interstellar Na I D1 and D2 absorption features in the spectra of", token: " ", after: "104 early-type stars in the second and third Galactic quadrants reveals …" },
      { activation: 4.625, before: "…International Workshop on Operator Theory and its Applications, July", token: " ", after: "22–26, 2019, Instituto Superior Técnico, Lisbon, Portugal …" },
    ],
  },
  {
    feature: "L32:F53761",
    predicted: 1.636,
    observed: 0.089,
    recurrence: "6/6",
    description: "General academic text",
    evidence: [
      { activation: 4.1562, before: "…What Does Standard Error Mean Tell Us. What Does Standard Error Mean", token: " Tell", after: " Us. Contents. Thanks! Assumptions and usage …" },
      { activation: 4.125, before: "…3 Sep 2013, 21:30, As Far As I Can See, 3 Jul 2013, 17:10, As Far", token: " As", after: " I Can See, 25 Jun 2013 …" },
      { activation: 4.125, before: "…Department of Mechanical and Materials Engineering,", token: "Queen", after: "’s University, 130 Stuart Street, Kingston, Ontario …" },
    ],
  },
  {
    feature: "L25:F20384",
    predicted: 0.351,
    observed: -0.064,
    recurrence: "6/6",
    description: "STEM question answering",
    evidence: [
      { activation: 9.1875, before: "…Lecture 21: Basis and dimension of a vector space. Concepts:", token: " ", after: "1. Define a basis. 2. Recognize that any two bases have the same number of elements …" },
      { activation: 8.875, before: "…https://wakelet.com/wake/vKSwmAqdYW7ptN-q5zMGQ https://wakelet", token: ".", after: "com/wake/xk-llQ1U97wL8m2Aog2qd …" },
      { activation: 8.875, before: "…Stephen Mwinga, Philip Ayieko", token: ",", after: " Charles Opondo, Jalemba Aluvaala, Elesban Kihuba …" },
    ],
  },
  {
    feature: "L7:F20827",
    predicted: 0.504,
    observed: -0.027,
    recurrence: "6/6",
    description: "Conversational openings",
    evidence: [
      { activation: 31.5, before: "…Tehran, ISSN 2345-5853, online at https://cgasa.sbu.ac", token: ".", after: "ir. This journal is available open access …" },
      { activation: 27.75, before: "…http://sage.math.canterbury.ac.nz/hom... http://sage.math.canterbury.ac", token: ".", after: "nz/hom... edit, retag, close, merge, delete …" },
      { activation: 26.5, before: "…Chen L, Institute of Geology and Geophysics, lchen@mail.igcas.ac", token: ".", after: "cn, Chinese Academy of Sciences …" },
    ],
  },
];

function visiblePeakToken(token: string) {
  if (token === " ") return "␠ space";
  if (token === "\n") return "↵ newline";
  if (token === "\t") return "⇥ tab";
  return token;
}

export function InteractiveSlopeAudit() {
  const [selectedFeature, setSelectedFeature] = useState("L22:F31850");
  const selected = slopeRows.find((row) => row.feature === selectedFeature) ?? slopeRows[0];
  const maxSlope = 1.8;
  const ratio = selected.observed / selected.predicted;

  return (
    <figure className="candidate-audit full-bleed" aria-label="Interactive candidate feature evidence and intervention audit">
      <header className="candidate-audit-heading">
        <div>
          <span>Candidate feature audit</span>
          <strong>Semantic recurrence meets causal intervention</strong>
        </div>
        <p>Choose a feature to connect its automated label and top activations to the measured intervention.</p>
      </header>

      <div className="candidate-audit-layout">
        <section className="candidate-audit-list" aria-label="Candidate features">
          <div className="candidate-audit-legend" aria-hidden="true">
            <span><i className="candidate-predicted-key" /> Neumann predicted</span>
            <span><i className="candidate-observed-key" /> Observed intervention</span>
          </div>
          {slopeRows.map((row) => (
            <button
              type="button"
              className={`candidate-audit-row ${selectedFeature === row.feature ? "is-selected" : ""}`}
              key={row.feature}
              aria-pressed={selectedFeature === row.feature}
              onClick={() => setSelectedFeature(row.feature)}
            >
              <span className="candidate-audit-identity">
                <code>{row.feature}</code>
                <small>{row.description}</small>
              </span>
              <span className="candidate-recurrence"><b>{row.recurrence}</b> prompts</span>
              <span className="candidate-slope-track" aria-hidden="true">
                <i className="candidate-predicted-bar" style={{ width: `${(row.predicted / maxSlope) * 100}%` }} />
                <i
                  className={`candidate-observed-bar ${row.observed < 0 ? "is-negative" : ""}`}
                  style={{ width: `${Math.max(0.8, (Math.abs(row.observed) / maxSlope) * 100)}%` }}
                />
              </span>
              <span className="candidate-slope-values">
                <span>{row.predicted.toFixed(3)}</span>
                <strong>{row.observed > 0 ? "+" : ""}{row.observed.toFixed(3)}</strong>
                <em>×{(row.observed / row.predicted).toFixed(2)}</em>
              </span>
            </button>
          ))}
        </section>

        <section className="candidate-audit-evidence" aria-live="polite">
          <div className="candidate-evidence-heading">
            <div>
              <span>Selected feature</span>
              <h4>{selected.description}</h4>
            </div>
            <code>{selected.feature}</code>
          </div>
          <dl className="candidate-evidence-metrics">
            <div><dt>Recurrence</dt><dd>{selected.recurrence}</dd></div>
            <div><dt>Predicted</dt><dd>{selected.predicted.toFixed(3)}</dd></div>
            <div><dt>Observed</dt><dd>{selected.observed > 0 ? "+" : ""}{selected.observed.toFixed(3)}</dd></div>
            <div><dt>Observed / predicted</dt><dd>{ratio.toFixed(2)}</dd></div>
          </dl>
          <ol className="candidate-evidence-list">
            {selected.evidence.map((item, index) => (
              <li key={`${selected.feature}-${index}`}>
                <span className="candidate-evidence-index">{String(index + 1).padStart(2, "0")}</span>
                <p>
                  {item.before}
                  <mark className={`candidate-firing-token ${item.token.trim() ? "" : "is-whitespace"}`}>
                    {item.token.trim() ? item.token : "␠"}
                  </mark>
                  {item.after}
                </p>
                <span className="candidate-evidence-meta">
                  <span className="candidate-peak-token">
                    <small>peak token</small>
                    <code>{visiblePeakToken(item.token)}</code>
                  </span>
                  <strong>act {item.activation.toFixed(2)}</strong>
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <figcaption>
        <span>Tables 4–5</span>
        <p>Recurrent candidate features, source-backed top-activating OpenWebMath passages, and measured interventions. Each passage marks the exact peak token in orange; ␠ denotes a space token.</p>
      </figcaption>
    </figure>
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

// One shared scale for both directions so the smaller reversed shifts stay visibly smaller.
const PROBABILITY_SCALE = Math.ceil(
  Math.max(...probabilityRows.flatMap((row) => [Math.abs(row.amplified[2]), Math.abs(row.reversed[2])])),
);
const PROBABILITY_TICKS = [-20, -10, 0, 10, 20];

function probabilityOffset(value: number) {
  return `${50 + (value / PROBABILITY_SCALE) * 50}%`;
}

function ProbabilityAxis() {
  return (
    <div className="probability-axis" aria-hidden="true">
      <span />
      <span className="probability-axis-scale">
        {PROBABILITY_TICKS.map((tick) => (
          <span key={tick} style={{ left: probabilityOffset(tick) }}>
            {tick > 0 ? `+${tick}` : tick}
          </span>
        ))}
      </span>
      <span className="probability-axis-unit">pp</span>
    </div>
  );
}

export function InteractiveProbabilityShift() {
  const [setting, setSetting] = useState<"amplified" | "reversed">("amplified");
  const [selectedToken, setSelectedToken] = useState("Since");
  const selected = probabilityRows.find((row) => row.token === selectedToken) ?? probabilityRows[0];
  const selectedValues = selected[setting];

  // Sorted per direction: the fixed order only ever matched the amplified column.
  const ordered = useMemo(
    () => [...probabilityRows].sort((a, b) => b[setting][2] - a[setting][2]),
    [setting],
  );

  return (
    <div className="probability-interactive">
      <div className="probability-controls" role="group" aria-label="Intervention direction">
        <button type="button" aria-pressed={setting === "amplified"} onClick={() => setSetting("amplified")}>Amplified · ×3</button>
        <button type="button" aria-pressed={setting === "reversed"} onClick={() => setSetting("reversed")}>Reversed · ×−1</button>
      </div>

      <ProbabilityAxis />

      <div className="probability-rows">
        {ordered.map((row) => {
          const delta = row[setting][2];
          const magnitude = `${(Math.abs(delta) / PROBABILITY_SCALE) * 50}%`;
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
                {PROBABILITY_TICKS.map((tick) => (
                  <span
                    key={tick}
                    className={tick === 0 ? "probability-zero" : "probability-gridline"}
                    style={{ left: probabilityOffset(tick) }}
                  />
                ))}
                <i
                  className={delta < 0 ? "negative-shift" : "positive-shift"}
                  style={{ width: magnitude }}
                />
              </span>
              <strong>{delta > 0 ? "+" : ""}{delta.toFixed(2)}</strong>
            </button>
          );
        })}
      </div>

      <ProbabilityAxis />

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
  const left = width < 520 ? 40 : 48;
  return { left, right: 14, top: 16, bottom: 36, plotWidth: width - left - 14, plotHeight: height - 52 };
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
    const height = width < 520 ? 210 : 240;
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
    const yMin = mode === "absolute" ? 0 : -14;
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
      context.fillText(String(tick), x(tick), height - 21);
    });
    context.fillStyle = ink;
    context.fillText("Problem", geometry.left + geometry.plotWidth / 2, height - 6);

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
      context.lineWidth = 1.45;
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
        context.arc(x(row.problem), y(value), row.problem === selectedProblem ? 4 : 2.2, 0, Math.PI * 2);
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
