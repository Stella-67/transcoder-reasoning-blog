"use client";

import { useState } from "react";

const hardL0ByLayer = [
  104.0978001622335,
  4.247611898737242,
  13.27682603484388,
  9.28586994685037,
  4.235613884281512,
  3.438462252462761,
  1.5672401338224553,
  7.380982360134145,
  2.6121408767872927,
  1.7813843117788781,
  3.2957250263326756,
  1.0997534212299882,
  3.2632581490046046,
  3.9915331872424744,
  10.991787433764745,
  3.268778930631056,
  8.126158738614397,
  12.208708145170728,
  7.75897833254638,
  9.824586042269493,
  20.610857537198687,
  23.038774612475837,
  34.09941442586696,
  18.032192452510383,
  16.52262995831164,
  11.883571235436316,
  9.48815735841899,
  35.734211492749935,
  13.490897570936797,
  78.10702164323966,
  212.61024411701797,
  364.5116852508767,
  451.0884576114548,
  486.94292367357974,
];

const SVG_WIDTH = 560;
const SVG_HEIGHT = 310;
const MARGIN = { top: 38, right: 16, bottom: 46, left: 62 };
const PLOT_WIDTH = SVG_WIDTH - MARGIN.left - MARGIN.right;
const PLOT_HEIGHT = SVG_HEIGHT - MARGIN.top - MARGIN.bottom;
const Y_MIN = 0.8;
const Y_MAX = 1100;
const TOP_K = 500;
const Y_TICKS = [1, 10, 100, 500];
const X_TICKS = [0, 5, 10, 15, 20, 25, 30, 33];
const SLOT_WIDTH = PLOT_WIDTH / hardL0ByLayer.length;
const BAR_WIDTH = Math.max(5, SLOT_WIDTH - 3.2);

function xScale(layer: number) {
  return MARGIN.left + layer * SLOT_WIDTH + (SLOT_WIDTH - BAR_WIDTH) / 2;
}

function yScale(value: number) {
  const min = Math.log(Y_MIN);
  const max = Math.log(Y_MAX);
  const y = MARGIN.top + (1 - (Math.log(value) - min) / (max - min)) * PLOT_HEIGHT;
  // Round: Math.log may differ by one ulp between the SSR engine and the browser.
  return Number(y.toFixed(2));
}

function formatValue(value: number) {
  return value >= 100 ? value.toFixed(1) : value.toFixed(2);
}

export default function InteractiveSparsityFigure() {
  const [hoveredLayer, setHoveredLayer] = useState<number | null>(null);
  const hoveredValue = hoveredLayer === null ? null : hardL0ByLayer[hoveredLayer];
  const tooltipWidth = 156;
  const tooltipHeight = 45;
  const tooltipX = hoveredLayer === null
    ? 0
    : Math.min(
        SVG_WIDTH - MARGIN.right - tooltipWidth,
        Math.max(MARGIN.left, xScale(hoveredLayer) + BAR_WIDTH / 2 - tooltipWidth / 2),
      );
  const tooltipY = hoveredValue === null
    ? 0
    : Math.max(MARGIN.top + 2, yScale(hoveredValue) - tooltipHeight - 9);

  return (
    <figure className="sparsity-explorer">
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        role="img"
        aria-label="Mean number of active CLT features per token by layer. Hover over a bar for its exact value."
        onPointerLeave={() => setHoveredLayer(null)}
      >
        <g className="sparsity-grid" aria-hidden="true">
          {Y_TICKS.map((tick) => (
            <line key={tick} x1={MARGIN.left} x2={SVG_WIDTH - MARGIN.right} y1={yScale(tick)} y2={yScale(tick)} />
          ))}
        </g>

        <g className="sparsity-axes" aria-hidden="true">
          <line x1={MARGIN.left} x2={MARGIN.left} y1={MARGIN.top} y2={SVG_HEIGHT - MARGIN.bottom} />
          <line x1={MARGIN.left} x2={SVG_WIDTH - MARGIN.right} y1={SVG_HEIGHT - MARGIN.bottom} y2={SVG_HEIGHT - MARGIN.bottom} />
          {Y_TICKS.map((tick) => (
            <g key={tick}>
              <line x1={MARGIN.left - 5} x2={MARGIN.left} y1={yScale(tick)} y2={yScale(tick)} />
              <text x={MARGIN.left - 9} y={yScale(tick) + 4} textAnchor="end">{tick}</text>
            </g>
          ))}
          {X_TICKS.map((tick) => {
            const x = xScale(tick) + BAR_WIDTH / 2;
            return (
              <g key={tick}>
                <line x1={x} x2={x} y1={SVG_HEIGHT - MARGIN.bottom} y2={SVG_HEIGHT - MARGIN.bottom + 5} />
                <text x={x} y={SVG_HEIGHT - MARGIN.bottom + 19} textAnchor="middle">{tick}</text>
              </g>
            );
          })}
          <text className="axis-label" x={MARGIN.left + PLOT_WIDTH / 2} y={SVG_HEIGHT - 7} textAnchor="middle">layer</text>
          <text
            className="axis-label"
            x={15}
            y={MARGIN.top + PLOT_HEIGHT / 2}
            textAnchor="middle"
            transform={`rotate(-90 15 ${MARGIN.top + PLOT_HEIGHT / 2})`}
          >
            active features / token
          </text>
        </g>

        <g className="sparsity-cap" aria-hidden="true">
          <line x1={MARGIN.left} x2={SVG_WIDTH - MARGIN.right} y1={yScale(TOP_K)} y2={yScale(TOP_K)} />
          <text x={MARGIN.left + 7} y={yScale(TOP_K) - 7}>top-k cap (k=500)</text>
        </g>

        <g className="sparsity-bars">
          {hardL0ByLayer.map((value, layer) => {
            const top = yScale(value);
            const bottom = yScale(Y_MIN);
            const isHovered = hoveredLayer === layer;
            const label = `Layer ${layer}: ${formatValue(value)} active features per token`;
            return (
              <rect
                key={layer}
                className={isHovered ? "is-hovered" : ""}
                x={xScale(layer)}
                y={top}
                width={BAR_WIDTH}
                height={Math.max(1, bottom - top)}
                rx={1}
                tabIndex={0}
                aria-label={label}
                onPointerEnter={() => setHoveredLayer(layer)}
                onPointerDown={() => setHoveredLayer(layer)}
                onFocus={() => setHoveredLayer(layer)}
                onBlur={() => setHoveredLayer(null)}
              >
                <title>{label}</title>
              </rect>
            );
          })}
        </g>

        {hoveredLayer !== null && hoveredValue !== null ? (
          <g className="sparsity-tooltip" transform={`translate(${tooltipX} ${tooltipY})`} aria-hidden="true">
            <rect width={tooltipWidth} height={tooltipHeight} rx={4} />
            <text x={10} y={17}>Layer {hoveredLayer}</text>
            <text className="tooltip-value" x={10} y={34}>{formatValue(hoveredValue)} active features/token</text>
          </g>
        ) : null}
      </svg>

      <figcaption>
        <span>Figure 4.</span>
        <p>Active features per token, the mean hard ℓ₀, by layer on the held-out set. Hover over a bar for its exact value.</p>
      </figcaption>
    </figure>
  );
}
