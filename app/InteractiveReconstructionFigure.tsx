"use client";

import { useState } from "react";

type Dataset = {
  id: string;
  label: string;
  pairs: number;
  mse: number;
  pooledRelative: number;
  color: string;
  relativeByLayer: number[];
  targetNormByLayer: number[];
};

const datasets: Dataset[] = [
  {
    id: 'stackexchange', label: 'StackExchange (held-out)', pairs: 200, mse: 0.0059, pooledRelative: 0.30, color: '#2a78d6',
    relativeByLayer: [0.153966,0.293634,0.252163,0.321922,0.362977,0.455761,0.455671,0.490117,0.570088,0.608026,0.640517,0.660321,0.661866,0.669861,0.669653,0.607945,0.577209,0.550806,0.519547,0.515141,0.533048,0.529634,0.4875,0.490063,0.459076,0.453413,0.417565,0.375043,0.392752,0.290893,0.31735,0.298226,0.315457,0.275453],
    targetNormByLayer: [43.533339,13.059216,21.2451,30.136739,12.640621,7.924141,13.060534,9.020655,7.883084,4.805658,2.999784,2.746232,2.634011,2.472765,1.6496,2.780271,4.226431,3.666119,4.069208,3.506773,3.931362,4.905585,6.663798,7.836607,6.199402,6.948843,5.681992,10.414646,6.089676,4.911677,7.508152,18.370204,10.411444,26.45822],
  },
  {
    id: 'aime', label: 'AIME 2024+2025', pairs: 60, mse: 0.0060, pooledRelative: 0.29, color: '#eb6834',
    relativeByLayer: [0.144596,0.272811,0.242464,0.328238,0.33437,0.423466,0.462347,0.509978,0.598503,0.65061,0.671344,0.706184,0.698375,0.712443,0.705893,0.652163,0.610161,0.594767,0.562883,0.571261,0.583243,0.594574,0.499252,0.523934,0.483295,0.471847,0.451092,0.390946,0.430948,0.320963,0.318195,0.288846,0.315452,0.24726],
    targetNormByLayer: [47.93168,14.66728,22.212437,30.417563,13.150862,7.983711,13.243556,9.096315,7.704923,4.55151,2.890036,2.59565,2.4153,2.249154,1.519759,2.630012,3.920113,3.26625,3.605841,3.145251,3.531542,4.531663,6.30466,7.525839,5.959607,6.821272,5.538275,10.229128,5.636933,4.426514,7.24397,18.208503,10.115386,27.152026],
  },
  {
    id: 'natural', label: 'NaturalReasoning', pairs: 50, mse: 0.0063, pooledRelative: 0.31, color: '#1baf7a',
    relativeByLayer: [0.170735,0.293784,0.257657,0.335595,0.369111,0.469047,0.486652,0.52902,0.598947,0.6339,0.650914,0.682577,0.686239,0.693212,0.691279,0.635275,0.611138,0.587474,0.556116,0.559705,0.579061,0.578215,0.514137,0.527878,0.4987,0.488224,0.464839,0.423906,0.454147,0.349113,0.373371,0.322802,0.332808,0.273982],
    targetNormByLayer: [43.620204,13.157041,21.018079,30.048817,12.216954,7.603052,12.498112,8.635344,7.579021,4.64344,2.912018,2.699366,2.485857,2.334756,1.584238,2.711702,4.019745,3.407481,3.73156,3.229939,3.646293,4.625064,6.358744,7.555528,5.87925,6.588762,5.296773,9.560546,5.408418,4.208856,6.876634,17.309778,10.1128,26.396607],
  },
  {
    id: 'medical', label: 'Medical-o1', pairs: 50, mse: 0.0082, pooledRelative: 0.36, color: '#eda100',
    relativeByLayer: [0.208033,0.346713,0.279637,0.355774,0.42622,0.528761,0.515165,0.547689,0.617025,0.643536,0.66939,0.674159,0.682189,0.680604,0.684107,0.634607,0.625645,0.587363,0.546833,0.547476,0.568392,0.574127,0.553014,0.55852,0.530268,0.529747,0.510705,0.483209,0.511205,0.416926,0.463825,0.390801,0.393519,0.350824],
    targetNormByLayer: [41.692089,12.620558,20.975982,30.195042,11.772376,7.747818,12.501113,8.504932,7.640247,4.721547,2.955086,2.838634,2.506294,2.367919,1.581046,2.792079,4.125664,3.578872,3.990082,3.444899,3.882144,4.904029,6.614701,7.895087,6.267785,6.943313,5.521682,9.816181,5.612009,4.110589,6.898666,17.585776,10.381922,29.737393],
  },
  {
    id: 'wikiqa', label: 'WikiQA', pairs: 50, mse: 0.0083, pooledRelative: 0.35, color: '#e87ba4',
    relativeByLayer: [0.200841,0.319571,0.275199,0.353661,0.418976,0.528108,0.505244,0.526696,0.600681,0.623005,0.649993,0.648752,0.664399,0.658923,0.662211,0.632899,0.630836,0.582078,0.556372,0.555268,0.582305,0.588329,0.566718,0.564252,0.529267,0.526253,0.503212,0.484362,0.50662,0.430121,0.472484,0.394718,0.391595,0.34936],
    targetNormByLayer: [42.654089,13.191663,21.875514,31.130839,12.137508,7.856739,12.753464,8.944064,8.03204,5.017767,3.126222,3.005728,2.77601,2.585328,1.717501,2.943371,4.375154,3.817346,4.197175,3.60151,4.040399,5.092292,6.783455,7.946807,6.272164,6.946837,5.500445,9.725441,5.573804,3.989857,6.760447,17.332242,10.305151,29.785895],
  },
];

const SVG_WIDTH = 520;
const SVG_HEIGHT = 280;
const MARGIN = { top: 28, right: 14, bottom: 42, left: 56 };
const PLOT_WIDTH = SVG_WIDTH - MARGIN.left - MARGIN.right;
const PLOT_HEIGHT = SVG_HEIGHT - MARGIN.top - MARGIN.bottom;
const LAYER_TICKS = [0, 5, 10, 15, 20, 25, 30, 33];

function xScale(layer: number) {
  return MARGIN.left + (layer / 33) * PLOT_WIDTH;
}

function linearY(value: number) {
  return Number((MARGIN.top + (1 - value / 0.75) * PLOT_HEIGHT).toFixed(2));
}

function logY(value: number) {
  const min = Math.log(1.2);
  const max = Math.log(70);
  const y = MARGIN.top + (1 - (Math.log(value) - min) / (max - min)) * PLOT_HEIGHT;
  // Round: Math.log may differ by one ulp between the SSR engine and the browser.
  return Number(y.toFixed(2));
}

function linePath(values: number[], scaleY: (value: number) => number) {
  return values
    .map((value, layer) => `${layer === 0 ? "M" : "L"} ${xScale(layer).toFixed(2)} ${scaleY(value).toFixed(2)}`)
    .join(" ");
}

function DatasetChart({
  title,
  yLabel,
  metric,
  activeId,
  onSelect,
}: {
  title: string;
  yLabel: string;
  metric: "relative" | "norm";
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const scaleY = metric === "relative" ? linearY : logY;
  const yTicks = metric === "relative" ? [0, 0.2, 0.4, 0.6] : [2, 5, 10, 20, 50];

  return (
    <div className="reconstruction-chart">
      <h4>{title}</h4>
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        role="img"
        aria-label={`${title}. Select a dataset in the table to emphasize its curve.`}
      >
        <g className="reconstruction-grid" aria-hidden="true">
          {yTicks.map((tick) => (
            <line key={tick} x1={MARGIN.left} x2={SVG_WIDTH - MARGIN.right} y1={scaleY(tick)} y2={scaleY(tick)} />
          ))}
        </g>

        <g className="reconstruction-axes" aria-hidden="true">
          <line x1={MARGIN.left} x2={MARGIN.left} y1={MARGIN.top} y2={SVG_HEIGHT - MARGIN.bottom} />
          <line x1={MARGIN.left} x2={SVG_WIDTH - MARGIN.right} y1={SVG_HEIGHT - MARGIN.bottom} y2={SVG_HEIGHT - MARGIN.bottom} />
          {yTicks.map((tick) => (
            <g key={tick}>
              <line x1={MARGIN.left - 5} x2={MARGIN.left} y1={scaleY(tick)} y2={scaleY(tick)} />
              <text x={MARGIN.left - 9} y={scaleY(tick) + 4} textAnchor="end">
                {metric === "relative" ? tick.toFixed(1) : tick}
              </text>
            </g>
          ))}
          {LAYER_TICKS.map((tick) => (
            <g key={tick}>
              <line x1={xScale(tick)} x2={xScale(tick)} y1={SVG_HEIGHT - MARGIN.bottom} y2={SVG_HEIGHT - MARGIN.bottom + 5} />
              <text x={xScale(tick)} y={SVG_HEIGHT - MARGIN.bottom + 19} textAnchor="middle">{tick}</text>
            </g>
          ))}
          <text className="axis-label" x={MARGIN.left + PLOT_WIDTH / 2} y={SVG_HEIGHT - 7} textAnchor="middle">layer</text>
          <text
            className="axis-label"
            x={15}
            y={MARGIN.top + PLOT_HEIGHT / 2}
            textAnchor="middle"
            transform={`rotate(-90 15 ${MARGIN.top + PLOT_HEIGHT / 2})`}
          >
            {yLabel}
          </text>
        </g>

        <g className="reconstruction-series">
          {datasets.map((dataset) => {
            const values = metric === "relative" ? dataset.relativeByLayer : dataset.targetNormByLayer;
            const isActive = activeId === dataset.id;
            const isMuted = activeId !== null && !isActive;
            return (
              <path
                key={dataset.id}
                d={linePath(values, scaleY)}
                className={isMuted ? "is-muted" : isActive ? "is-active" : ""}
                stroke={dataset.color}
                onClick={() => onSelect(dataset.id)}
              >
                <title>{dataset.label}</title>
              </path>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

export default function InteractiveReconstructionFigure() {
  const [activeId, setActiveId] = useState<string | null>(null);

  function selectDataset(id: string) {
    setActiveId((current) => (current === id ? null : id));
  }

  return (
    <figure className="reconstruction-explorer full-bleed">
      <div className="reconstruction-heading">
        <div>
          <span>Table 2 · Figure 3</span>
          <strong>Reconstruction across evaluation distributions</strong>
          <p>Choose a dataset to trace its pooled result through both layer-wise views.</p>
        </div>
        <button
          type="button"
          className="reconstruction-all"
          aria-pressed={activeId === null}
          onClick={() => setActiveId(null)}
        >
          All datasets
        </button>
      </div>

      <div className="reconstruction-table-wrap">
        <table>
          <caption className="sr-only">CLT reconstruction on evaluation distributions</caption>
          <thead>
            <tr>
              <th scope="col">Evaluation set</th>
              <th scope="col">Pairs</th>
              <th scope="col">MSE</th>
              <th scope="col">rel. L₂</th>
            </tr>
          </thead>
          <tbody>
            {datasets.map((dataset) => {
              const isActive = activeId === dataset.id;
              const isMuted = activeId !== null && !isActive;
              return (
                <tr
                  key={dataset.id}
                  className={isMuted ? "is-muted" : isActive ? "is-active" : ""}
                  style={{ boxShadow: isActive ? `inset 3px 0 0 ${dataset.color}` : undefined }}
                  onClick={() => selectDataset(dataset.id)}
                >
                  <th scope="row">
                    <button
                      type="button"
                      aria-pressed={isActive}
                      onClick={(event) => {
                        event.stopPropagation();
                        selectDataset(dataset.id);
                      }}
                    >
                      <i aria-hidden="true" style={{ backgroundColor: dataset.color }} />
                      {dataset.label}
                    </button>
                  </th>
                  <td>{dataset.pairs}</td>
                  <td>{dataset.mse.toFixed(4)}</td>
                  <td>{dataset.pooledRelative.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="reconstruction-charts" aria-live="polite">
        <DatasetChart
          title="Relative reconstruction error"
          yLabel="relative L₂ error"
          metric="relative"
          activeId={activeId}
          onSelect={selectDataset}
        />
        <DatasetChart
          title="Target activation norm"
          yLabel="‖hℓ‖₂"
          metric="norm"
          activeId={activeId}
          onSelect={selectDataset}
        />
      </div>

      <figcaption>
        <span>Table 2 + Figure 3.</span>
        <p>
          Pooled reconstruction metrics and their layer-wise structure. The activation norm uses a logarithmic scale;
          its trough coincides with the relative-error peak.
        </p>
      </figcaption>
    </figure>
  );
}
