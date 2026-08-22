import PaperOriginal from "./PaperOriginal";

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#article">
        Skip to article
      </a>

      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Transcoder Explore home">
          <span className="wordmark-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>Transcoder Explore</span>
        </a>
        <nav aria-label="Paper navigation">
          <a href="#crosslayer-transcoder-formulation">CLT</a>
          <a href="#attribution-as-candidate-discovery">Attribution</a>
          <a href="#selecting-and-validating-the-target-feature">Validation</a>
          <a href="#perturbation-experiments">Experiments</a>
          <a className="nav-paper" href="/paper.pdf">
            PDF <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>

      <main id="article">
        <article>
          <section className="paper-masthead" id="top">
            <p className="eyebrow">Mechanistic interpretability · Research paper</p>
            <h1>Cross-Layer Transcoders as Hypothesis Generators for Causal Circuit Analysis in Mathematical Reasoning</h1>
            <div className="paper-byline">
              <span>Transcoder Explore Project</span>
              <span>August 21, 2026</span>
              <span>Gemma-3-4B-IT</span>
            </div>
            <div className="paper-abstract">
              <span>Abstract</span>
              <p>
                Cross-layer transcoders (CLTs) replace transformer MLP computation with sparse,
                interpretable feature dictionaries that support prompt-specific attribution graphs.
                Their graph scores, however, are derived from a local linearization and need not
                predict the effect of intervening on a feature in the full nonlinear model. We study
                this gap in Gemma-3-4B-IT. We train a 100,800-feature latent-mixing CLT that
                reconstructs all 34 MLP outputs while using 17.4× fewer decoder parameters than a
                direct cross-layer parameterization, then construct direct-effect and Neumann
                multi-hop attribution graphs for factual and mathematical prompts. Across five
                held-out evaluation distributions, reconstruction MSE ranges from 0.0059 to 0.0083.
                The graphs surface semantically coherent recurrent candidates, but their Neumann
                scores do not directly recover measured single-feature effects. Direct perturbations
                identify L22:F31850 as a robust sentence-boundary continuation feature rather than a
                feature specific to <code>However</code>. During AIME generation, amplifying this
                feature reduces the frequency of newline continuations after periods from 65.8% to
                24.4% and increases a restricted family of connective continuations led by
                <code>Since</code> and <code>We</code>. This local shift changes global solution form:
                across 7,141 matched generations, mean lines per solution fall from 37.6 to 20.0 and
                mean line length rises from 40.5 to 81.8 tokens. Accuracy changes are modest in
                aggregate and heterogeneous by problem; amplification raises AIME 2024 Problem 12
                accuracy from 17.3% to 41.3% but is not uniformly beneficial. These results support
                CLT attribution graphs as tools for candidate discovery while showing that causal
                claims require explicit intervention.
              </p>
            </div>
          </section>

          <PaperOriginal />
        </article>
      </main>

      <footer>
        <span>Transcoder Explore Project</span>
        <a href="/paper.pdf">Read the paper PDF</a>
      </footer>
    </>
  );
}
