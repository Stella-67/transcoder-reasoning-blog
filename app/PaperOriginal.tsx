import InteractiveAttributionGraph from "./InteractiveAttributionGraph";
import InteractiveCltArchitecture from "./InteractiveCltArchitecture";
import InteractiveFeatureEvidence from "./InteractiveFeatureEvidence";
import InteractiveOriginalModel from "./InteractiveOriginalModel";
import InteractiveReconstructionFigure from "./InteractiveReconstructionFigure";
import InteractiveSparsityFigure from "./InteractiveSparsityFigure";
import TrajectoryCaseStudies from "./TrajectoryCaseStudies";
import { renderMathToString } from "./Math";
import {
  InteractiveAccuracyFigure,
  InteractiveActivationFigure,
  InteractiveContinuationFigure,
  InteractiveProbabilityShift,
  InteractiveSlopeAudit,
} from "./InteractiveResultFigures";
import paperHtml from "./paper-main.html?raw";
import paperTablesHtml from "./paper-tables.html?raw";

const PAPER_EQUATIONS: Record<string, string> = {
  main0: String.raw`\mathbf{h}_{1,t}=\operatorname{Embed}(u_t).`,
  main1: String.raw`\mathbf{o}^{\mathrm{attn}}_{\ell,t}=\operatorname{Attn}_{\ell}(\mathbf{h}_{\ell,1},\ldots,\mathbf{h}_{\ell,t}),`,
  main2: String.raw`\mathbf{m}_{\ell,t}=\operatorname{MLP}_{\ell}(\mathbf{x}_{\ell,t}),`,
  main3: String.raw`\mathbf{x}_{\ell,t}=\mathbf{h}_{\ell,t}+\mathbf{o}^{\mathrm{attn}}_{\ell,t},`,
  main6: String.raw`\begin{aligned}\mathbf{z}_{\ell,t}&=\operatorname{TopK}\!\left(\operatorname{JumpReLU}\!\left(\mathbf{W}^{\mathrm{enc}}_{\ell}\left(\mathbf{x}_{\ell,t}+\mathbf{b}^{\mathrm{pre}}_{\ell}\right)+\mathbf{b}^{\mathrm{enc}}_{\ell}\right)\right)\in\mathbb{R}^{M},\\[0.55em]\widehat{\mathbf{m}}_{\ell,t}&=\mathbf{W}^{\mathrm{dec}}_{\ell}\mathbf{z}_{\ell,t}+\mathbf{b}^{\mathrm{dec}}_{\ell}.\end{aligned}`,
  main8: String.raw`\widehat{\mathbf{m}}_{\ell,t}=\sum_{s\leq\ell}\sum_{a=1}^{M}z_{s,t,a}\,\mathbf{w}^{s\to\ell}_{a}+\mathbf{b}^{\mathrm{dec}}_{\ell}.`,
  main9: String.raw`\sum_{s=1}^{L}(L-s+1)Md=\frac{L(L+1)}{2}Md.`,
  main13: String.raw`\widetilde{\mathbf{z}}_{\ell,t}=\sum_{s\leq\ell}\boldsymbol{\gamma}^{s\to\ell}\odot\mathbf{z}_{s,t},\qquad\boldsymbol{\gamma}^{s\to\ell}\in\mathbb{R}^{M}.`,
  main14: String.raw`\widehat{\mathbf{m}}_{\ell,t}=\left(\mathbf{W}^{\mathrm{dec}}_{\ell}\right)^{\!\top}\widetilde{\mathbf{z}}_{\ell,t}+\mathbf{b}^{\mathrm{dec}}_{\ell},\qquad\mathbf{W}^{\mathrm{dec}}_{\ell}\in\mathbb{R}^{M\times d}.`,
  main15: String.raw`\mathbf{w}^{s\to\ell}_{a}=\gamma^{s\to\ell}_{a}\mathbf{w}^{\mathrm{dec}}_{\ell,a}.`,
  main18: String.raw`\mathcal{L}=\frac{1}{BLd}\sum_{t=1}^{B}\sum_{\ell=1}^{L}\left\lVert\widehat{\mathbf{m}}_{\ell,t}-\mathbf{m}_{\ell,t}\right\rVert_2^2.`,
  main19: String.raw`g_{i\to j}=\mathbf{w}^{\mathrm{enc}}_{j}\,\mathbf{J}_{i\to j}\!\left(z_i\mathbf{w}^{\mathrm{dec}}_{i}\right).`,
  main20: String.raw`\mathbf{G}=\begin{pmatrix}\mathbf{G}_{F\leftarrow T}&\mathbf{G}_{F\leftarrow F}\\[2pt]\mathbf{G}_{L\leftarrow T}&\mathbf{G}_{L\leftarrow F}\end{pmatrix}\begin{array}{l}\leftarrow\text{feature rows}\\\leftarrow\text{logit rows.}\end{array}`,
  main21: String.raw`A=\left(\mathbf{G}_{L\leftarrow T}\ \ \mathbf{G}_{L\leftarrow F}\right)\in\mathbb{R}^{n_L\times n_{\mathrm{tf}}},\qquad B=\begin{pmatrix}\mathbf{0}_{n_T\times n_T}&\mathbf{0}_{n_T\times n_F}\\[2pt]\mathbf{G}_{F\leftarrow T}&\mathbf{G}_{F\leftarrow F}\end{pmatrix}\in\mathbb{R}^{n_{\mathrm{tf}}\times n_{\mathrm{tf}}}.`,
  main22: String.raw`S_n=\sum_{i=0}^{n}T_i=A+AB+AB^2+\cdots+AB^n.`,
  main26: String.raw`\mathbf{z}'_{\ell,t,a}=\mathrm{sf}\cdot\mathbf{z}_{\ell,t,a},\qquad\Delta_{\ell,t,a}=(\mathrm{sf}-1)\mathbf{z}_{\ell,t,a}.`,
  main27: String.raw`g^{\mathrm{Neu}}_f=\frac{S^{\mathrm{Neu}}_{f\to\mathrm{However}}}{\mathbf{z}^{0}_f},\qquad g^{\mathrm{obs}}_f=\frac{\operatorname{logit}_{\mathrm{However}}(\mathrm{sf})-\operatorname{logit}_{\mathrm{However}}(1)}{(\mathrm{sf}-1)\mathbf{z}^{0}_f}.`,
};

const TABLE_EQUATIONS: Record<string, string> = {
  main16: String.raw`\frac{1}{2}`,
  main17: String.raw`\frac{1}{2}`,
  main24: String.raw`\sqrt{2}`,
  main25: String.raw`\sqrt{3}`,
  main28: String.raw`\frac{1}{34}`,
  main29: String.raw`\frac{-1\pm\sqrt{1-4(34)(-2)}}{2(34)}`,
  main30: String.raw`\frac{-1\pm\sqrt{1+272}}{68}`,
  main31: String.raw`\frac{-1\pm\sqrt{273}}{68}`,
  main32: String.raw`\frac{-1+\sqrt{273}}{68}`,
  main33: String.raw`\frac{1}{34}`,
  main34: String.raw`\frac{1}{34}`,
  main35: String.raw`\frac{1}{34}`,
  main36: String.raw`\sqrt{\frac{1}{34}}`,
  main37: String.raw`\frac{1}{\sqrt{34}}`,
  main38: String.raw`\frac{1}{34}`,
  main39: String.raw`\frac{1}{\sqrt{34}}`,
  main40: String.raw`\frac{1}{5.83}`,
  main41: String.raw`\frac{1}{34}`,
  main42: String.raw`\frac{1}{34}`,
  main43: String.raw`\frac{3}{34}`,
  main44: String.raw`\frac{1}{\sqrt{34}}`,
  main45: String.raw`\sqrt{\frac{3}{34}}`,
  main46: String.raw`\sqrt{0.0882}`,
  main47: String.raw`\frac{1}{\sqrt{34}}`,
  main48: String.raw`\frac{-1\pm\sqrt{1-4(34)(-2)}}{2(34)}`,
  main49: String.raw`\frac{-1\pm\sqrt{273}}{68}`,
  main50: String.raw`\frac{-1+\sqrt{273}}{68}`,
  main51: String.raw`\frac{1}{2}`,
  main52: String.raw`\frac{9}{3}`,
  main53: String.raw`\frac{9}{3}`,
  main54: String.raw`\longleftarrow`,
  main55: String.raw`\frac{1}{2}`,
  main56: String.raw`\frac{9}{3}`,
};

function katexMarkup(tex: string, block = false) {
  return `<${block ? "div" : "span"} class="${block ? "math-katex-block" : "math-katex-inline"}">${renderMathToString(tex, block)}</${block ? "div" : "span"}>`;
}

function normalizeTexText(value: string) {
  return value
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/ℓ/g, String.raw`\ell `)
    .replace(/ℝ/g, String.raw`\mathbb{R}`)
    .replace(/ℚ/g, String.raw`\mathbb{Q}`)
    .replace(/γ/g, String.raw`\gamma `)
    .replace(/ρ/g, String.raw`\rho `)
    .replace(/θ/g, String.raw`\theta `)
    .replace(/𝜃/gu, String.raw`\theta `)
    .replace(/λ/g, String.raw`\lambda `)
    .replace(/Δ/g, String.raw`\Delta `)
    .replace(/Σ/g, String.raw`\Sigma `)
    .replace(/∞/g, String.raw`\infty `)
    .replace(/∈/g, String.raw`\in `)
    .replace(/≫/g, String.raw`\gg `)
    .replace(/≤/g, String.raw`\le `)
    .replace(/≥/g, String.raw`\ge `)
    .replace(/≈/g, String.raw`\approx `)
    .replace(/×/g, String.raw`\times `)
    .replace(/→/g, String.raw`\to `)
    .replace(/←/g, String.raw`\leftarrow `)
    .replace(/−/g, "-")
    .replace(/∥/g, String.raw`\lVert `)
    .replace(/⊤/g, String.raw`\top `)
    .replace(/·/g, String.raw`\cdot `)
    .replace(/⋅/g, String.raw`\cdot `)
    .replace(/∕/g, "/")
    .replace(/∣/g, String.raw`\mid `)
    .replace(/%/g, String.raw`\%`)
    .replace(/{/g, String.raw`\{`)
    .replace(/}/g, String.raw`\}`)
    .replace(/ĥ/g, String.raw`\widehat{h}`)
    .replace(/ẑ/g, String.raw`\widehat{z}`)
    .trim();
}

function renderPaperMath(html: string) {
  let output = html
    .replace(/<span class='inline-math-symbol mapsto-symbol'[^>]*>[^<]*<\/span>/g, katexMarkup(String.raw`\mapsto`))
    .replace(/<span class='inline-math-token'><span class='inline-math-symbol widehat-symbol'>[^<]*<\/span><sub><span class='lmmi-8'>ℓ,t<\/span><\/sub><\/span>/g, katexMarkup(String.raw`\widehat{\mathbf{m}}_{\ell,t}`))
    .replace(/<span class='inline-math-token'><span class='inline-math-symbol widetilde-symbol'>[^<]*<\/span><sub><span class='lmmi-8'>ℓ,t<\/span><\/sub><\/span>/g, katexMarkup(String.raw`\widetilde{\mathbf{z}}_{\ell,t}`));

  output = output.replace(/<img\b[^>]*src=["']\/paper-math\/(main\d+)x\.svg["'][^>]*\/?>/g, (match, id: string) => {
    const tex = PAPER_EQUATIONS[id] ?? TABLE_EQUATIONS[id];
    return tex ? katexMarkup(tex, Boolean(PAPER_EQUATIONS[id])) : match;
  });

  output = output.replace(/<span class=['"]([^'"]*(?:lmmi|lmsy|lmex|msbm|rm-lmbx|rm-lmr)[^'"]*)['"]>([\s\S]*?)<\/span>/g, (match, className: string, text: string) => {
    if (text.includes("<span")) return match;
    const leading = text.match(/^\s*/)?.[0] ?? "";
    const trailing = text.match(/\s*$/)?.[0] ?? "";
    const core = normalizeTexText(text);
    if (!core) return text;
    const tex = className.includes("rm-lmbx")
      ? String.raw`\mathbf{${core}}`
      : className.includes("rm-lmr")
        ? String.raw`\mathrm{${core}}`
        : core;
    return `${leading}${katexMarkup(tex)}${trailing}`;
  });

  return output;
}

function marker(id: string, level: "sectionHead" | "likesectionHead" = "sectionHead") {
  return `<h3 class='${level}' id='${id}'`;
}

function between(start: string, end?: string, endLevel: "sectionHead" | "likesectionHead" = "sectionHead") {
  const startIndex = paperHtml.indexOf(marker(start, start === "references" ? "likesectionHead" : "sectionHead"));
  const endIndex = end ? paperHtml.indexOf(marker(end, endLevel), startIndex + 1) : paperHtml.length;
  return paperHtml.slice(startIndex, endIndex < 0 ? paperHtml.length : endIndex);
}

function PaperCopy({ html, className = "" }: { html: string; className?: string }) {
  return (
    <div
      className={`paper-copy ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: renderPaperMath(html) }}
    />
  );
}

function subsectionMarker(id: string) {
  return `<h4 class='subsectionHead' id='${id}'`;
}

function paragraphMarker(id: string) {
  return `<span class='paragraphHead' id='${id}'`;
}

function splitBefore(html: string, needle: string) {
  const index = html.indexOf(needle);
  return index < 0 ? [html, ""] : [html.slice(0, index), html.slice(index)];
}

function paperTable(index: number) {
  const start = `<section data-paper-table="${index}">`;
  const startIndex = paperTablesHtml.indexOf(start);
  const endIndex = paperTablesHtml.indexOf("</section>", startIndex);
  return startIndex < 0 || endIndex < 0
    ? ""
    : paperTablesHtml.slice(startIndex + start.length, endIndex);
}

function PaperTable({ index, className = "" }: { index: number; className?: string }) {
  return (
    <div
      className={`paper-data-table full-bleed ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: renderPaperMath(paperTable(index)) }}
    />
  );
}

type FigurePanel = {
  src: string;
  alt: string;
  caption?: string;
};

function StaticPaperFigure({
  number,
  caption,
  panels,
  narrow = false,
  compact = false,
}: {
  number: number;
  caption: string;
  panels: FigurePanel[];
  narrow?: boolean;
  compact?: boolean;
}) {
  return (
    <figure className={`paper-static-figure full-bleed ${narrow ? "is-narrow" : ""} ${compact ? "is-compact" : ""}`.trim()}>
      <div
        className={`paper-static-panels ${panels.length > 1 ? "has-multiple" : ""} ${panels.length === 3 ? "has-three" : ""}`.trim()}
      >
        {panels.map((panel, index) => (
          <div className="paper-static-panel" key={panel.src}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={panel.src} alt={panel.alt} loading="lazy" />
            {panel.caption ? (
              <p><span>({String.fromCharCode(97 + index)})</span> {panel.caption}</p>
            ) : null}
          </div>
        ))}
      </div>
      <figcaption>
        <span>Figure {number}.</span>
        <p>{caption}</p>
      </figcaption>
    </figure>
  );
}

export default function PaperOriginal() {
  const introduction = between("introduction", "crosslayer-transcoder-formulation");
  const clt = between("crosslayer-transcoder-formulation", "attribution-as-candidate-discovery");
  const attribution = between("attribution-as-candidate-discovery", "selecting-and-validating-the-target-feature");
  const neumannIndex = attribution.indexOf(subsectionMarker("neumann-multihop-propagation"));
  const directEffect = attribution.slice(0, neumannIndex);
  const attributionRest = attribution.slice(neumannIndex);
  const selection = between("selecting-and-validating-the-target-feature", "perturbation-experiments");
  const perturbation = between("perturbation-experiments", "conclusion");
  const conclusion = between("conclusion", "references", "likesectionHead");
  const references = between("references");

  const [cltFormulation, cltFromTraining] = splitBefore(clt, subsectionMarker("training-pipeline"));
  const [cltTraining, cltQuality] = splitBefore(cltFromTraining, subsectionMarker("why-the-training-is-effective"));
  const [trainingIntro, trainingImplementation] = splitBefore(cltTraining, paragraphMarker("implementation"));
  const [qualityReconstruction, qualityFromSparsity] = splitBefore(cltQuality, paragraphMarker("activations-are-sparse"));
  const [qualitySparsity, qualityInterpretability] = splitBefore(qualityFromSparsity, paragraphMarker("features-are-interpretable"));

  const [neumann, attributionFromGraphs] = splitBefore(attributionRest, subsectionMarker("from-neumann-scores-to-attribution-graphs"));
  const [graphConstruction, workedExample] = splitBefore(attributionFromGraphs, subsectionMarker("a-worked-example-from-an-attribution-graph-to-a-partial-causal-trace"));
  const [workedCandidateScreen, workedMediator] = splitBefore(workedExample, paragraphMarker("partial-shared-mediator"));

  const [featureDiscovery, linearizedInterventions] = splitBefore(selection, paragraphMarker("linearized-fixedprompt-interventions"));

  const [perturbationSetup, perturbationResults] = splitBefore(perturbation, subsectionMarker("results"));
  const [periodTriggeredSetup, remainingSetup] = splitBefore(perturbationSetup, paragraphMarker("cachepropagated-period-interventions"));
  const [probabilityResults, continuationResults] = splitBefore(perturbationResults, paragraphMarker("empirical-continuation-frequencies-reflect-the-probability-shifts"));
  const [continuationCopy, layoutResults] = splitBefore(continuationResults, paragraphMarker("the-tokenlevel-shift-compounds-into-the-layout-of-entire-solutions"));
  const [layoutCopy, accuracyResults] = splitBefore(layoutResults, paragraphMarker("accuracy-effects-are-modest-in-aggregate-and-heterogeneous-across-problems"));
  const [accuracyCopy, trajectoryCopy] = splitBefore(accuracyResults, paragraphMarker("a-representative-trajectorylevel-effect"));

  return (
    <>
      <section className="paper-copy-section" aria-label="Introduction and preliminaries">
        <PaperCopy html={introduction} />
      </section>

      <section className="paper-copy-section paper-copy-section-alt" aria-label="Cross-layer transcoder formulation">
        <PaperCopy html={cltFormulation} />
        <div className="paper-interactive full-bleed">
          <InteractiveCltArchitecture />
        </div>
        <PaperCopy html={trainingIntro} />
        <StaticPaperFigure
          number={2}
          compact
          panels={[{
            src: "/paper-figures/training-loss.png",
            alt: "Training loss trajectory for the analyzed cross-layer transcoder",
          }]}
          caption="Training trajectory of the analyzed CLT."
        />
        <PaperCopy html={trainingImplementation} />
        <PaperCopy html={qualityReconstruction} />
        <InteractiveReconstructionFigure />
        <PaperCopy html={qualitySparsity} />
        <InteractiveSparsityFigure />
        <PaperCopy html={qualityInterpretability} />
        <InteractiveFeatureEvidence />
      </section>

      <section className="paper-copy-section" aria-label="Attribution as candidate discovery">
        <PaperCopy html={directEffect} />
        <figure className="architecture-reference interactive-original-reference full-bleed">
          <div className="architecture-reference-frame">
            <InteractiveOriginalModel />
          </div>
          <figcaption>
            <span>Direct-effect computation</span>
            <p>
              A source feature&apos;s decoder direction is propagated through the transformer Jacobian
              and projected onto the target feature&apos;s encoder direction.
            </p>
          </figcaption>
        </figure>
        <PaperCopy html={neumann} />
        <StaticPaperFigure
          number={6}
          narrow
          panels={[{
            src: "/paper-figures/neumann-decay.png",
            alt: "Geometric decay of Neumann-series contribution magnitudes by hop",
          }]}
          caption="Geometric decay of the Neumann-series terms. Each point is the total magnitude of the hop contribution on the full attribution graph of the However prompt."
        />
        <PaperCopy html={graphConstruction} />
        <div className="paper-interactive full-bleed">
          <InteractiveAttributionGraph />
        </div>
        <PaperCopy html={workedCandidateScreen} />
        <StaticPaperFigure
          number={8}
          panels={[
            {
              src: "/paper-figures/france-feature-screen.png",
              alt: "Controlled activation screen for the literal-France feature L0:F26582",
              caption: "L0:F26582: France references versus other-country and unrelated topics.",
            },
            {
              src: "/paper-figures/capital-feature-screen.png",
              alt: "Controlled activation screen for the literal-capital feature L0:F81670",
              caption: "L0:F81670: capital references versus alternative-relation and unrelated topics.",
            },
          ]}
          caption="Controlled activation evidence for the two input features retained in the final circuit trace. Each bar is the mean sentence maximum; error bars show one standard deviation across sentences."
        />
        <PaperCopy html={workedMediator} />
        <StaticPaperFigure
          number={9}
          panels={[
            {
              src: "/paper-figures/shared-mediator-trace.svg",
              alt: "Candidate trace from the France and capital features through a shared mediator to Paris",
              caption: "The proposed trace fragment from the two literal-input features through a shared mediator.",
            },
            {
              src: "/paper-figures/edge-percentiles.png",
              alt: "Signed attribution weights and percentile ranks for the candidate trace edges",
              caption: "Each link’s signed attribution weight and percentile rank within its matched local edge distributions.",
            },
          ]}
          caption="Graph-supported candidate trace and local edge-strength context for the Paris output."
        />
      </section>

      <section className="paper-copy-section paper-copy-section-alt" aria-label="Selecting and validating the target feature">
        <PaperCopy html={featureDiscovery} />
        <InteractiveSlopeAudit />
        <PaperCopy html={linearizedInterventions} />
      </section>

      <section className="paper-copy-section" aria-label="Perturbation experiments">
        <PaperCopy html={periodTriggeredSetup} />
        <div className="paper-interactive full-bleed">
          <InteractiveActivationFigure />
        </div>
        <PaperCopy html={remainingSetup} />
        <PaperCopy html={probabilityResults} />
        <div className="paper-interactive full-bleed">
          <InteractiveProbabilityShift />
        </div>
        <PaperCopy html={continuationCopy} />
        <div className="paper-interactive full-bleed">
          <InteractiveContinuationFigure />
        </div>
        <PaperCopy html={layoutCopy} />
        <PaperTable index={5} />
        <PaperTable index={6} className="paper-excerpt-table" />
        <PaperCopy html={accuracyCopy} />
        <div className="paper-interactive full-bleed">
          <InteractiveAccuracyFigure />
        </div>
        <PaperCopy html={trajectoryCopy} />
        <TrajectoryCaseStudies />
      </section>

      <section className="paper-copy-section paper-copy-section-alt" aria-label="Conclusion">
        <PaperCopy html={conclusion} />
      </section>

      <section className="paper-copy-section" aria-label="References">
        <PaperCopy html={references} className="paper-references" />
      </section>
    </>
  );
}
