import InteractiveAttributionGraph from "./InteractiveAttributionGraph";
import InteractiveCltArchitecture from "./InteractiveCltArchitecture";
import TrajectoryCaseStudies from "./TrajectoryCaseStudies";
import {
  InteractiveAccuracyFigure,
  InteractiveActivationFigure,
  InteractiveContinuationFigure,
  InteractiveProbabilityShift,
  InteractiveSlopeAudit,
} from "./InteractiveResultFigures";

function Metric({ value, label, note }: { value: string; label: string; note: string }) {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <span>{label}</span>
      <small>{note}</small>
    </div>
  );
}

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
        <nav aria-label="Article navigation">
          <a href="#discovery">Discovery</a>
          <a href="#intervention">Intervention</a>
          <a href="#results">Results</a>
          <a href="#case-atlas">Cases</a>
          <a className="nav-paper" href="/paper.pdf">
            Paper <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>

      <main id="article">
        <article>
          <section className="hero" id="top">
            <div className="hero-grid" aria-hidden="true" />
            <div className="hero-orbit orbit-one" aria-hidden="true" />
            <div className="hero-orbit orbit-two" aria-hidden="true" />

            <div className="hero-copy">
              <p className="eyebrow">
                <span>Mechanistic interpretability</span>
                <span>Research article · August 2026</span>
              </p>
              <h1>
                A feature that makes Gemma <em>keep reasoning</em>
              </h1>
              <p className="dek">
                Attribution graphs led us to a feature that appeared to promote logical connectives.
                At naturally active period positions in AIME solutions, interventions revealed a
                broader role: scaling it shifts whether Gemma breaks the line or carries its
                mathematical argument forward.
              </p>
              <div className="hero-meta">
                <span>Transcoder Explore Project</span>
                <span>Gemma-3-4B-IT</span>
                <span>L22:F31850</span>
                <span>AIME 2024–2025</span>
              </div>
            </div>

            <div className="hero-experiment" aria-label="Clean and amplified next-token comparison">
              <div className="experiment-kicker">
                <span>Same prefix</span>
                <span>one feature edit</span>
              </div>
              <p className="prompt-line">
                “The time taken is <span>3 hours.</span>”
              </p>
              <div className="branch clean-branch">
                <div className="branch-label">
                  <span className="branch-dot" />
                  Clean forward
                </div>
                <div className="token-choice">
                  <code>↵ newline</code>
                  <strong>0.93</strong>
                </div>
                <div className="token-choice muted-choice">
                  <code>Since</code>
                  <strong>0.03</strong>
                </div>
              </div>
              <div className="feature-edit">
                <span>amplify</span>
                <strong>L22:F31850 × 3</strong>
                <span aria-hidden="true">↓</span>
              </div>
              <div className="branch edited-branch">
                <div className="branch-label">
                  <span className="branch-dot" />
                  Edited forward
                </div>
                <div className="token-choice winning-choice">
                  <code>Since</code>
                  <strong>0.41</strong>
                </div>
                <div className="token-choice muted-choice">
                  <code>↵ newline</code>
                  <strong>0.37</strong>
                </div>
              </div>
              <p className="experiment-caption">
                At an identical prefix, the edit flips the model&apos;s top next-token prediction.
              </p>
            </div>
          </section>

          <section className="opening content-section">
            <div className="section-number">00</div>
            <div className="prose lead-prose">
              <p className="lead">
                One sampled edited continuation goes on to convert three hours into 180 minutes and
                reaches the correct answer, 204. The intervention does not insert that conversion,
                encode the answer, or force the word <code>Since</code>. It changes one internal
                feature activation at a sentence boundary. The model supplies the continuation.
              </p>
              <p>
                We found the feature by tracing connective logits, including <code>However</code>.
                But after editing it across thousands of complete AIME solutions, “However feature”
                was clearly the wrong description. At the naturally active period positions we
                tested, the feature shifts a broader decision between line breaking and continued
                mathematical prose.
              </p>
              <p>
                That distinction matters because a striking next token is easy to over-interpret.
                Seeing <code>Since</code> after an edit does not by itself tell us that the edited
                feature represents the word <code>Since</code>. The feature might instead change
                grammatical expectations, mathematical register, formatting, or a higher-level
                decision about whether the current argument is finished. Those hypotheses can look
                identical in a single forward pass and diverge only when the edit is repeated across
                many contexts.
              </p>
              <p>
                We therefore treat interpretation as an empirical process rather than a naming
                exercise. First, sparse features give us units small enough to enumerate. Next,
                attribution graphs reduce a large search space to a few plausible candidates.
                Finally, controlled interventions ask what changes when one candidate is turned up
                or reversed. Each stage answers a different question, and none can substitute for
                the others.
              </p>
              <p>
                The result is less like discovering a hidden word detector and more like isolating a
                control knob in a writing policy. The knob is narrow enough to perturb at one token
                position, yet its consequences accumulate across a whole autoregressive trajectory.
                That combination makes it useful both as a case study in mathematical reasoning and
                as a stress test for circuit-tracing methodology.
              </p>
              <div className="thesis-callout">
                <span>Our central lesson</span>
                <p>
                  Attribution can tell us where to look. Intervention tells us what survives contact
                  with the model.
                </p>
              </div>
            </div>
            <aside className="toc-card" aria-label="On this page">
              <span>On this page</span>
              <ol>
                <li><a href="#sparse-lens">A sparse lens</a></li>
                <li><a href="#discovery">Finding the feature</a></li>
                <li><a href="#causal-audit">Auditing attribution</a></li>
                <li><a href="#intervention">Turning the feature</a></li>
                <li><a href="#results">What changed</a></li>
                <li><a href="#accuracy">Accuracy is conditional</a></li>
                <li><a href="#case-atlas">Ten trajectory cases</a></li>
              </ol>
            </aside>
          </section>

          <section className="content-section ruled-section" id="sparse-lens">
            <div className="section-number">01</div>
            <div className="prose">
              <p className="eyebrow">A sparse lens on computation</p>
              <h2>Making Gemma&apos;s MLPs legible</h2>
              <p className="lead">
                Transformer MLPs are difficult to inspect directly. A neuron is not guaranteed to
                represent one human-readable concept, while an entire MLP block is too coarse to be
                a useful circuit component.
              </p>
              <p>
                This creates a practical mismatch. The model computes with dense vectors containing
                thousands of coordinates, while the questions we want to ask are usually discrete:
                which part of the computation supported this continuation, where did that influence
                enter, and what happens if we change it? Reading individual neurons assumes a clean
                basis that training never promised us. Treating a whole layer as one unit avoids that
                assumption, but leaves too many mechanisms bundled together.
              </p>
              <p>
                We trained a <strong>cross-layer transcoder</strong>, or CLT, to approximate Gemma&apos;s
                MLP outputs with a sparse set of learned features. Each feature reads from the
                residual stream at one layer and, when active, writes into reconstructed MLP outputs
                at that layer and later layers. For a fixed prompt, those features become nodes in a
                computational graph.
              </p>
              <p>
                A CLT supplies an intermediate vocabulary. On a particular token, only a small
                subset of its learned coordinates is active. Each active coordinate has an encoder
                direction that determines when it fires and decoder directions that describe what it
                writes back into the model. Because the same coordinate can affect several later
                layers, it can represent a computation whose consequences unfold over depth rather
                than a feature attached to one isolated MLP output.
              </p>
              <p>
                This builds on earlier work on{
                " "
                }<a href="https://arxiv.org/abs/2406.11944">transcoder feature circuits</a> and
                Anthropic&apos;s{
                " "
                }<a href="https://transformer-circuits.pub/2025/attribution-graphs/methods.html">
                  circuit-tracing method
                </a>
                . Our two main departures are a parameter-efficient latent-mixing architecture and
                an explicit audit of how one signed multi-hop attribution score relates to
                intervention effects.
              </p>
            </div>

            <InteractiveCltArchitecture />

            <figure className="architecture-reference full-bleed">
              <div className="architecture-reference-frame">
                <img
                  src="/original-gemma-direct-effect.png"
                  alt="Diagram of the original Gemma-3-4B-IT transformer showing a source feature writing across layers and the gradient paths into a target residual-stream position."
                  width="1362"
                  height="758"
                  loading="lazy"
                />
              </div>
              <figcaption>
                <span>Original-model reference</span>
                <p>
                  A source feature at position <i>t</i><sub>s</sub> writes to multiple downstream
                  layers; gradients at target position <i>t</i><sub>r</sub> measure how those writes
                  influence the target residual stream.
                </p>
              </figcaption>
            </figure>

            <div className="prose">
              <h3>Why factor the decoder?</h3>
              <p>
                A direct CLT gives every feature an independent decoder vector for every downstream
                layer. At Gemma-3-4B-IT scale, that would require about 152.32 billion decoder
                parameters. Our latent-mixing CLT shares a target-layer decoder direction and learns
                a source-specific scalar strength, reducing the count to about 8.76 billion.
              </p>
              <p>
                In plain language, the factorization says that a feature arriving at a given output
                layer uses one shared direction, while its source layer controls how strongly that
                direction is expressed. The model no longer needs a separate full vector for every
                source–destination pair. That is what makes the cross-layer dictionary trainable at
                this scale, while preserving an explicit path from an earlier feature activation to
                each reconstructed downstream MLP output.
              </p>
            </div>

            <div className="metrics-grid full-bleed" aria-label="CLT summary metrics">
              <Metric value="17.4×" label="smaller decoder" note="than the direct parameterization" />
              <Metric value="58.6" label="active features" note="mean per token and layer" />
              <Metric value="0.06%" label="activation density" note="out of 100,800 coordinates" />
              <Metric value="0.29–0.36" label="relative L₂ error" note="across five held-out domains" />
            </div>

            <div className="prose">
              <p>
                The compression comes with a constraint: contributions from different source layers
                to the same target-layer coordinate must share a direction and differ only in
                strength. Reconstruction is also imperfect. The CLT is useful here because it gives
                us a sparse, enumerable set of candidate computational units whose effects can be
                traced and tested, not because it is a lossless rewrite of Gemma.
              </p>
              <p>
                The sparsity numbers are important for the same reason. A mean of 58.6 active
                coordinates is not evidence that the model literally contains 58.6 concepts at each
                token. It is evidence that the replacement model presents a tractable local support
                set. Instead of asking which of hundreds of thousands of coordinates might matter,
                we can follow the small set that is active on the prompt in front of us.
              </p>
              <p>
                We also evaluated reconstruction outside the training-style distribution. Similar
                relative error across StackExchange, AIME, NaturalReasoning, Medical-o1, and WikiQA
                suggests that the learned dictionary is not useful only on one narrow source of
                text. It does not guarantee causal fidelity, however. That stronger standard has to
                be checked downstream, which is why the later attribution and intervention audits are
                part of the method rather than optional illustrations.
              </p>
              <details className="technical-details">
                <summary>Training and feature-interpretability details</summary>
                <div>
                  <p>
                    The training corpus contains roughly 6.4 million chat-formatted question-answer
                    pairs and 5.5 billion available content tokens. The analyzed checkpoint trained
                    for 50,000 steps on eight A100 80 GB GPUs. JumpReLU and a Top-K gate impose
                    sparsity.
                  </p>
                  <p>
                    We then ran the CLT over 20,000 OpenWebMath passages, recorded maximally
                    activating examples, and produced automated feature descriptions. These labels
                    are activation-based hypotheses, not causal definitions.
                  </p>
                </div>
              </details>
            </div>
          </section>

          <section className="content-section ruled-section" id="discovery">
            <div className="section-number">02</div>
            <div className="prose">
              <p className="eyebrow">Attribution as search</p>
              <h2>Six prompts, five candidates, one feature</h2>
              <p className="lead">
                We began with six AIME reasoning prefixes where Gemma assigned substantial
                probability to a continuation such as <code>However</code>, <code>Since</code>, or{
                " "
                }<code>So</code>.
              </p>
              <p>
                The prompts instantiate a similar decision with different words and mathematical
                contexts. Searching only one <code>However</code> example would make it easy to select
                a feature specific to that problem, that token position, or that wording. Recurrence
                across several prefixes acts as a simple consistency filter: a promising coordinate
                should reappear when the surface connective changes but the model is still deciding
                how to continue mathematical prose.
              </p>
              <p>
                For each prefix and target token, we froze the prompt-local nonlinear state and built
                a graph of signed direct effects among input tokens, active CLT features, and output
                logits. A truncated Neumann series aggregated paths through intermediate features.
              </p>
              <p>
                The graph is local to one prompt. Input-token nodes form its sources, active CLT
                features form the intermediate computation, and output logits terminate the paths.
                A direct edge measures how an activation-weighted source write changes a downstream
                feature preactivation or target logit in one step. While computing it, we hold
                attention probabilities, RMSNorm scale factors, and sparse firing masks fixed. This
                produces a signed effect around the observed forward pass, not a universal wiring
                diagram of the model.
              </p>
              <p>
                Direct edges miss mediated influence. One feature can affect a second, which changes
                a third, which finally moves the output. The terms in the series below collect paths
                with progressively more intermediate feature hops. In our graph, the contribution
                from additional hops decays rapidly, so ten orders are enough for the ranking to
                stabilize at the scale relevant here.
              </p>
              <div className="equation-block">
                <span>Multi-hop influence</span>
                <strong>S₁₀ = A + AB + AB² + ··· + AB¹⁰</strong>
                <small>In the displayed However graph, the tenth-order term is more than four orders below the direct term.</small>
              </div>
            </div>

            <div className="discovery-funnel full-bleed" aria-label="Feature discovery funnel">
              <div className="funnel-step">
                <span>01</span><strong>6 prompts</strong><small>However · Since · So</small>
              </div>
              <i aria-hidden="true">→</i>
              <div className="funnel-step">
                <span>02</span><strong>Top 100 each</strong><small>signed path-sum rank</small>
              </div>
              <i aria-hidden="true">→</i>
              <div className="funnel-step">
                <span>03</span><strong>5 recurrent</strong><small>present in ≥ 5 graphs</small>
              </div>
              <i aria-hidden="true">→</i>
              <div className="funnel-step selected-step">
                <span>04</span><strong>L22:F31850</strong><small>semantics + intervention</small>
              </div>
            </div>

            <div className="prose">
              <p>
                For each target, we kept the 100 features with the largest positive path-sum scores.
                We then discarded token position from the identifier and compared layer–feature
                coordinates across prompts. Five coordinates appeared in at least five of the six
                lists. This is a search heuristic rather than a statistical guarantee. A recurrent
                feature might track mathematical register, formatting, or some other property shared
                by the prompts without controlling the continuation itself.
              </p>
              <p>
                The interactive view below shows one selected slice of a much larger graph. Tokens
                run along the bottom, features appear where they activate in token position and
                layer, and candidate continuations sit at the output. Clicking a node reveals its
                immediate neighborhood. A node omitted from the view should be read as filtered from
                this explanation, not absent from the underlying computation.
              </p>
              <p>
                The default view is the AIME graph used in this article. The prompt selector also
                includes five shorter probe graphs extracted from the original dense files: a France
                capital completion, matched implicit and explicit planet-colour prompts, and two
                successive arithmetic digits. Their shorter token axes make the graph&apos;s geometry and
                the inspector easier to read without changing the visual language.
              </p>
            </div>

            <InteractiveAttributionGraph />

            <div className="prose">
              <p>
                One candidate stood out semantically. <code>L22:F31850</code> appeared in five of the
                six discovery lists, and its maximally activating OpenWebMath passages frequently
                involved algebraic proofs, modules, fields, ideals, and theorem-style exposition.
              </p>
              <p>
                More importantly, it was strongly active at sentence-ending periods from which the
                model could continue with a connective.
              </p>
              <p>
                The semantic label and the graph offered complementary clues. Maximally activating
                passages suggested mathematical logic and proof, while the selected graph connected
                the feature directly to <code>Since</code>, <code>We</code>, and
                <code>However</code>. Neither clue was yet a causal definition. Activation examples
                tell us where a feature appears; graph edges tell us what it could influence in one
                local linearization. We still needed to learn what changing it would do.
              </p>
            </div>

            <InteractiveActivationFigure />

            <div className="prose">
              <p>
                We now had a plausible story: perhaps this was a feature for <code>However</code>, or
                for contrast in mathematical proofs. But an attribution graph nominates a mechanism.
                It does not establish one.
              </p>
              <p>
                The localization pattern sharpened the experiment. Across the six discovery
                sentences, mean activation on period-ending tokens was 3.1 to 8.6 times higher than
                on other tokens; pooling the sentences gives a 5.3-fold ratio. The concentration is
                not perfect, and it does not prove the feature represents punctuation. It identifies
                a repeatable boundary at which the coordinate is naturally active and the competing
                interpretations can be separated by intervention.
              </p>
              <p>
                At this stage, “logical continuation feature” remained a hypothesis assembled from
                recurrence, activating examples, and token position. A good hypothesis should predict
                what happens when the coordinate is increased and decreased. The next experiment asks
                that narrower question before we let the edit alter an entire generated solution.
              </p>
            </div>
          </section>

          <section className="content-section dark-section" id="causal-audit">
            <div className="section-number">03</div>
            <div className="prose">
              <p className="eyebrow">The causal audit</p>
              <h2>Attribution found it. It did not predict the intervention.</h2>
              <p className="lead">
                Our signed Neumann score assigns a source feature the sum of all graph paths from
                that source to the target logit. It is tempting to interpret that number as the
                change caused by perturbing the feature. We tested that interpretation directly.
              </p>
              <p>
                The comparison uses one deliberately controlled setting: the AIME 2024 Problem 5
                prefix, the target logit <code>However</code>, and each candidate at the token
                position selected by its graph. We scale the candidate&apos;s natural activation and
                compare the resulting logit slope with the slope implied by the path sum. A scale of
                one leaves the active contribution unchanged, zero removes it, and negative values
                reverse its direction.
              </p>
              <p>
                For each recurrent candidate, we scaled its activation at its selected graph
                position and measured the <code>However</code> logit on a fixed prefix. We froze the
                prompt-local nonlinear state. The response was linear in edit size, but its slope did
                not match the Neumann prediction.
              </p>
              <p>
                Freezing the nonlinear state removes an easy source of ambiguity. The prompt stays
                fixed, and the edit reuses the clean attention probabilities, normalization factors,
                and sparse feature masks. The measured response is therefore linear rather than a
                mixture of the intended perturbation and features switching on, attention moving, or
                normalization changing. If the two slopes disagree here, that disagreement cannot be
                explained by those state changes alone.
              </p>
            </div>

            <InteractiveSlopeAudit />

            <div className="prose">
              <p>
                None of the observed-to-predicted ratios approached one. Two features with positive
                attribution had negative measured slopes. <code>L22:F31850</code> had the largest
                positive observed effect, yet realized only 30 percent of its path-sum prediction.
              </p>
              <p>
                This is not a single missing calibration constant. For
                <code>L29:F60066</code>, the predicted slope is 1.800 while the observed slope is
                0.192. For <code>L22:F31850</code>, the corresponding values are 0.707 and 0.210.
                Two other candidates cross zero altogether: their graph scores are positive, but
                their measured slopes are negative. Rescaling every score by one factor could not
                repair that pattern.
              </p>
              <p>
                The mismatch is easier to understand once the quantities are kept separate. The path
                sum credits a source with all retained routes that originate from it inside the
                prompt-local graph. The intervention measures the marginal effect of changing one
                feature at one site under a particular replacement-forward protocol. The two
                quantities are related, but they are not definitions of the same causal object.
              </p>
              <p>
                We selected <code>L22:F31850</code> for the generation experiment because several
                kinds of evidence converged. It had the largest positive observed slope among the
                recurrent candidates, the best observed-to-predicted ratio, a mathematical-proof
                activation profile, and a strong concentration at period endings. Its attribution
                score was quantitatively inaccurate, but the graph had still led us to a useful
                causal handle.
              </p>
              <blockquote>
                <span>Candidate discovery ≠ causal quantification</span>
                <p>
                  A feature can be an excellent place to look while its attribution score remains a
                  poor estimate of what a single-feature intervention will do.
                </p>
              </blockquote>
              <p>
                This is a negative result about measurement, not about search. The graph compressed a
                vast feature space into five candidates worth testing. What failed was the stronger
                interpretation that the signed score itself should equal the effect of a
                single-feature edit. Keeping those claims separate lets attribution remain valuable
                without granting it more causal precision than the audit supports.
              </p>
              <p className="fine-print">
                This audit concerns our raw signed path-sum construction. It should not be conflated
                with every use of a Neumann series in circuit tracing, including normalized unsigned
                influence scores used for graph pruning.
              </p>
            </div>
          </section>

          <section className="content-section ruled-section" id="intervention">
            <div className="section-number">04</div>
            <div className="prose">
              <p className="eyebrow">Generation-time intervention</p>
              <h2>Turning the feature while the model writes</h2>
              <p className="lead">
                The fixed-prefix test confirmed a real effect on <code>However</code>. It still did
                not reveal the feature&apos;s role over a complete solution.
              </p>
              <p>
                A fixed-prefix intervention asks a deliberately narrow question: if we alter one
                activation while holding the text constant, how does one selected logit respond? It
                cannot tell us whether the effect survives sampling, recurs at later boundaries, or
                redirects the rest of an answer. To test those possibilities, the edit has to become
                part of generation itself.
              </p>
              <p>
                We intervened while Gemma generated AIME solutions autoregressively. Every time a
                generated token ended in a period, we checked whether <code>L22:F31850</code> was
                naturally active and applied one of three settings.
              </p>
              <p>
                The trigger is conditional by design. We do not force the feature to activate at
                every period, and we do not edit positions where its baseline activation is zero.
                The experiment asks what happens when an existing contribution is strengthened or
                reversed at one of the positions where the feature naturally appears. It does not
                establish what arbitrary activation would do elsewhere.
              </p>
            </div>

            <div className="setting-grid full-bleed">
              <div className="setting-card">
                <span>Vanilla</span>
                <strong>× 1</strong>
                <p>Leave the naturally active feature unchanged.</p>
              </div>
              <div className="setting-card amplified-card">
                <span>Amplified</span>
                <strong>× 3</strong>
                <p>Triple the feature&apos;s active contribution.</p>
              </div>
              <div className="setting-card reversed-card">
                <span>Reversed</span>
                <strong>× −1</strong>
                <p>Reflect the active contribution through zero.</p>
              </div>
            </div>

            <div className="prose">
              <p>
                The three settings reveal direction as well as magnitude. Amplification asks what
                happens when Gemma receives more of the feature&apos;s ordinary contribution. Reversal
                asks whether moving through zero produces the opposite behavior. If the coordinate
                acts as a usable control axis, the two edits should move at least some common outcome
                in opposite directions, with Vanilla between them.
              </p>
            </div>

            <div className="protocol-strip full-bleed" aria-label="Autoregressive intervention protocol">
              <div><span>1</span><strong>Period fires</strong><small>feature naturally active</small></div>
              <i>→</i>
              <div><span>2</span><strong>Snapshot</strong><small>clean prompt-local state</small></div>
              <i>→</i>
              <div><span>3</span><strong>Edit feature</strong><small>reuse frozen nonlinear state</small></div>
              <i>→</i>
              <div><span>4</span><strong>Rewrite K / V</strong><small>continue autoregressively</small></div>
            </div>

            <div className="prose">
              <p>
                At each trigger, the runner performs a clean full-prefix forward, a zero-edit CLT
                replacement forward, and an edited replacement forward. The first records the model
                state, the second establishes the local replacement baseline, and the third changes
                only the selected feature while reusing the cached prompt-local nonlinear state.
                This makes the edit comparable to the fixed-prefix audit at the moment it is applied.
              </p>
              <p>
                The edited key and value vectors for the period position are written into the live
                autoregressive cache. Later tokens can therefore respond through subsequent
                attention and generation, rather than being evaluated only at one fixed prefix.
              </p>
              <p>
                That cache update is the bridge from a local perturbation to a trajectory-level
                experiment. The intervention does not rewrite Gemma&apos;s weights, and it does not keep
                forcing a particular next token. It changes the representation stored for one period
                position; normal sampling resumes, and future tokens may attend to the edited state.
                If a different continuation is sampled, its text becomes part of the next prefix and
                can compound the original change.
              </p>
              <p>
                We ran the protocol on all 30 problems from AIME 2024 and all 30 from AIME 2025,
                sampling 128 solutions per problem and setting at temperature 1.0 with a 2,048-token
                generation budget. The paired analysis contains 7,141 matched problem–sample
                indices for which all three settings produced a solution.
              </p>
              <p>
                Pairing makes the comparison cleaner because Vanilla, amplification, and reversal
                contribute at the same problem and sample index. It also defines the scope of the
                reported results: they describe this matched subset, not every attempted rollout.
                The first question is whether the edit creates a consistent behavioral shift across
                those trajectories. Accuracy is a later and more demanding outcome.
              </p>
            </div>
          </section>

          <section className="content-section results-section" id="results">
            <div className="section-number">05</div>
            <div className="prose">
              <p className="eyebrow">What changed</p>
              <h2>The model trades line breaks for continued prose</h2>
              <p className="lead">
                The intervention shifts the immediate next-token distribution, survives sampling,
                and compounds into the layout of entire solutions.
              </p>
              <p>
                We examine that claim at three scales. Paired next-token distributions isolate the
                immediate change at an edited period. Generated-token frequencies test whether the
                probability shift survives sampling throughout complete solutions. Line statistics
                then show whether many local decisions accumulate into a visible change in the form
                of the answer.
              </p>
              <p>
                These measurements rule out progressively narrower explanations. A logit movement
                could be too small to alter sampling. A sampled-token effect could be confined to one
                lexical item. A punctuation preference could disappear over a long trajectory. The
                agreement across scales is what supports a continuation-policy interpretation.
              </p>
            </div>

            <div className="result-stat-grid full-bleed">
              <div className="result-stat dominant-stat">
                <span>Newline after a period</span>
                <div><s>65.8%</s><strong>24.4%</strong></div>
                <small>Vanilla → amplified</small>
              </div>
              <div className="result-stat">
                <span><code>Since</code></span>
                <div><s>2.8%</s><strong>18.3%</strong></div>
                <small>6.5× more frequent</small>
              </div>
              <div className="result-stat">
                <span><code>We</code></span>
                <div><s>4.6%</s><strong>17.1%</strong></div>
                <small>3.7× more frequent</small>
              </div>
            </div>

            <InteractiveContinuationFigure />

            <div className="prose">
              <p>
                The figure counts what Gemma actually generated after period-ending tokens, rather
                than probabilities evaluated at a single frozen prefix. Under amplification,
                newlines fall from 65.8 to 24.4 percent, while <code>Since</code> rises from 2.8 to
                18.3 percent and <code>We</code> rises from 4.6 to 17.1 percent. The pooled share of
                <code>So</code>, <code>Let</code>, <code>In</code>, and <code>However</code> also rises
                from 4.0 to 14.8 percent.
              </p>
              <p>
                Reversal supplies the opposite endpoint. Newlines account for 83.1 percent of
                generated continuations, while <code>Since</code> and <code>We</code> nearly disappear.
                This directional symmetry is stronger evidence for a control axis than amplification
                alone: moving the same feature in opposite directions changes the same behavioral
                choice in opposite ways.
              </p>
              <p>
                In the paired fixed-prefix probability comparison, amplification does not increase
                every plausible connective. <code>Then</code>,{
                " "
                }<code>Thus</code>, and <code>Also</code> decrease. This is why “However feature” is
                too narrow, but “generic sentence-initial feature” is too broad.
              </p>
              <p>
                Nor do the sampled frequencies imply that the promoted continuation is logically
                warranted. The edit can make two sentences flow together while the underlying
                derivation is wrong. Here we have established a reliable change in how the model
                continues; whether that change improves the mathematical outcome is a separate
                question.
              </p>
              <div className="definition-card">
                <span>Best supported description</span>
                <strong>Sentence-boundary logical-continuation axis</strong>
                <p>
                  Increasing the feature suppresses line breaking and promotes a restricted family
                  of continuations led by <code>Since</code> and <code>We</code>.
                </p>
              </div>

              <details className="technical-details visual-details">
                <summary>See the paired next-token probability shifts</summary>
                <div>
                  <InteractiveProbabilityShift />
                  <p>
                    At identical prefixes, amplification lowers the combined probability of one or
                    two newline tokens from 54.9 to 25.0 percent. <code>Since</code> gains 14.4
                    percentage points and <code>We</code> gains 10.6 points.
                  </p>
                  <p>
                    This paired view is the cleanest measurement of the current edit because the
                    clean and amplified distributions are evaluated on the same prefix. The generated
                    continuation chart above asks the complementary question of what survives after
                    sampling and repeated intervention.
                  </p>
                </div>
              </details>
            </div>

            <div className="layout-comparison full-bleed">
              <div className="comparison-header">
                <span>A token-level edit reorganizes whole solutions</span>
                <div><strong>37.6 → 20.0</strong><small>lines per solution</small></div>
                <div><strong>40.5 → 81.8</strong><small>tokens per line</small></div>
              </div>
              <div className="solution-columns">
                <div className="solution vanilla-solution">
                  <span>Vanilla · one fact per line</span>
                  <p>Let 2025 = 3⁴ · 5².</p>
                  <p>The set A contains all positive divisors.</p>
                  <p>The number of divisors is (4 + 1)(2 + 1) = 15.</p>
                  <p>Thus |A| = 15.</p>
                </div>
                <div className="solution amplified-solution">
                  <span>Amplified · connected prose</span>
                  <p>
                    Let A be the set of positive integer divisors of 2025. <b>We</b> first find the
                    prime factorization. <b>We</b> have 2025 = 5² · 3⁴. <b>Therefore</b>, the set A
                    consists of all divisors of the form 5ᵃ · 3ᵇ...
                  </p>
                </div>
              </div>
            </div>

            <div className="prose">
              <p>
                Repeated across a trajectory, the local decision changes the organization of the
                whole answer. On the matched solutions, amplification reduces the mean number of
                lines from 37.6 to 20.0 and raises mean tokens per line from 40.5 to 81.8. Reversal
                moves in the other direction, producing 44.2 lines with 33.7 tokens per line.
              </p>
              <p>
                Total length moves much less than layout: the mean is 1,526 tokens in Vanilla, 1,634
                under amplification, and 1,490 under reversal. The clearest effect is therefore not
                simply “write more.” It is to package a similar amount of generated reasoning into
                longer connected spans, or to split it into shorter line-separated steps.
              </p>
              <p>
                Layout is useful because it makes the intervention visible at a glance, but it is a
                consequence rather than a complete mechanistic explanation. Longer lines do not tell
                us whether Gemma formed a better intermediate representation or selected a better
                strategy. The gap between a dramatic formatting effect and a modest task-level effect
                is exactly what the accuracy analysis has to resolve.
              </p>
            </div>
          </section>

          <section className="content-section ruled-section" id="accuracy">
            <div className="section-number">06</div>
            <div className="prose">
              <p className="eyebrow">Behavior is not ability</p>
              <h2>Making a model continue is not the same as making it correct</h2>
              <p className="lead">
                The feature has a large effect on how Gemma writes, consistent across paired samples.
                Its effect on mathematical accuracy is modest in aggregate and sharply
                problem-dependent.
              </p>
              <p>
                Accuracy is a stricter outcome because the same continuation tendency can be useful
                in one state and harmful in another. A missing connective may precede a necessary
                conversion or implication. Elsewhere, carrying the current trajectory forward may
                simply extend an error. The uniform edit has no controller that can distinguish those
                situations.
              </p>
              <p>
                Aggregate accuracy also hides a severe floor effect. Exactly 33 of the 60 AIME
                problems remain at zero accuracy in all three settings. Among the problems the model
                sometimes solves, amplification and reversal move performance in both directions.
                Averaging across them combines improvements, regressions, and many cases where this
                experiment has little room to reveal a difference.
              </p>
            </div>

            <div className="case-grid full-bleed">
              <div className="case-card positive-case">
                <span>AIME 2024 · Problem 12</span>
                <strong>17.3% → 41.3%</strong>
                <p>
                  Continuing the argument helps the model complete an omitted hours-to-minutes
                  conversion.
                </p>
              </div>
              <div className="case-divider">
                <span>same edit</span>
                <i />
                <span>different outcome</span>
              </div>
              <div className="case-card negative-case">
                <span>AIME 2024 · Problem 23</span>
                <strong>amplification −4.7 pp</strong>
                <p>
                  Reversal is beneficial instead, raising accuracy from 18.8 to 27.3 percent.
                </p>
              </div>
            </div>

            <InteractiveAccuracyFigure />

            <div className="prose">
              <p>
                The per-problem view makes the heterogeneity concrete. Amplification raises AIME 2024
                Problem 12 from 17.3 to 41.3 percent and Problem 2 from 70.3 to 82.8 percent. On
                Problem 23, the same edit lowers accuracy from 18.8 to 14.1 percent, while reversal
                raises it to 27.3 percent. No single setting dominates across problems.
              </p>
              <p>
                Problem 12 provides an intuitive positive case, but it should be read carefully. The
                clean and edited next-token probabilities in the opening are paired at an identical
                prefix within an amplified rollout. The displayed Vanilla failure in the paper is a
                separate sampled trajectory. The example shows the kind of omitted conversion that a
                continuation can repair; the matched accuracy increase across the problem is the
                stronger evidence that the setting helps there.
              </p>
            </div>

            <TrajectoryCaseStudies />

            <div className="prose">
              <p>
                These results separate two claims. First, <code>L22:F31850</code> causally controls
                part of Gemma&apos;s sentence-boundary continuation policy. Second, scaling the feature
                improves mathematical reasoning in general. Our evidence supports the first claim,
                not the second.
              </p>
              <p>
                One plausible interpretation is that continuing helps when the model is about to
                break before a necessary step, and hurts when it should commit to an answer, change
                strategy, or avoid extending an incorrect derivation. The present data establish the
                heterogeneous effect, not a complete taxonomy of why each problem moves.
              </p>
              <p>
                This points toward a different intervention objective. Rather than keeping the
                feature permanently high or low, a future controller could learn when the current
                solution needs another linked step and when it should stop. This experiment may have
                identified an actuator for that policy, but not the policy itself.
              </p>
            </div>
          </section>

          <section className="content-section lessons-section">
            <div className="section-number">07</div>
            <div className="prose">
              <p className="eyebrow">Three lessons</p>
              <h2>What this taught us about circuit tracing</h2>
              <p className="lead">
                Our interpretation changed at every stage. The graph suggested a feature connected
                to <code>However</code>. Activating examples suggested mathematical proof and logical
                exposition. The fixed-prefix intervention confirmed a causal direction but rejected
                the graph score as a calibrated effect size. Generation finally exposed the broader
                line-break-versus-continue behavior.
              </p>
              <p>
                None of those earlier descriptions was wholly wrong. Each reflected the slice of the
                mechanism visible to one method. The mistake would be to stop at the first legible
                label and treat it as the feature&apos;s definition.
              </p>
            </div>
            <div className="lessons-grid full-bleed">
              <div className="lesson">
                <span>01</span>
                <h3>A useful graph need not be a causal estimator</h3>
                <p>
                  Attribution concentrated our attention on a meaningful candidate set, but did not
                  recover single-feature intervention magnitude or always recover its sign.
                </p>
              </div>
              <div className="lesson">
                <span>02</span>
                <h3>Feature labels are hypotheses</h3>
                <p>
                  “Mathematical proof” and “However” both captured part of the activation pattern.
                  Only broad intervention revealed the line-break-versus-continue role.
                </p>
              </div>
              <div className="lesson">
                <span>03</span>
                <h3>Behavioral control is not task ability</h3>
                <p>
                  The feature dramatically changes continuation style, but a uniform push to keep
                  writing helps some problems and hurts others.
                </p>
              </div>
            </div>
            <div className="prose">
              <p>
                The practical lesson is a division of labor. Sparse dictionaries make candidate
                units enumerable. Attribution graphs make the search efficient. Activation examples
                suggest experiments. Fixed-prefix edits test local causal claims, and autoregressive
                interventions test whether those claims survive the model generating new state. A
                convincing interpretation should say which rung of that ladder supports each part of
                the description.
              </p>
              <p>
                This standard is stricter than asking whether a feature has a memorable label or a
                visually compelling graph. It is also more productive. A method can be valuable even
                when one of its outputs fails a stronger test, provided that failure changes the next
                experiment and narrows the claim we keep.
              </p>
            </div>
          </section>

          <section className="content-section limitations-section">
            <div className="section-number">08</div>
            <div className="prose">
              <p className="eyebrow">Boundaries of the claim</p>
              <h2>Limitations and open questions</h2>
              <p className="lead">
                The strongest result is a conditional behavioral claim about one learned coordinate:
                when it is already active at period-ending tokens in AIME generations, scaling it
                shifts a restricted family of continuations against line breaks. That is narrower
                than a complete account of mathematical reasoning or sentence-boundary computation.
              </p>
              <p>
                Each instrument in the analysis introduces its own boundary. The CLT approximates
                the base model. The attribution graph linearizes one prompt-local computation. The
                intervention edits one coordinate under a specific trigger and replacement protocol.
                The accuracy analysis then conditions on matched completed rollouts. These choices
                make the evidence interpretable, but they also define what it cannot establish.
              </p>
              <ul className="limitations-list">
                <li>
                  The CLT is approximate. Reconstruction error and latent mixing may alter the
                  causal structure represented by the graph.
                </li>
                <li>
                  The graph freezes attention patterns and normalization factors. It tracks
                  information through fixed attention outputs, but not why those patterns formed.
                </li>
                <li>
                  Related or redundant features may implement overlapping continuation behavior.
                </li>
                <li>
                  The intervention triggers only when the feature is naturally active at a
                  sentence-ending period. It does not establish its role at every position or domain.
                </li>
                <li>
                  Thirty-three of the 60 evaluated problems remain at a zero-accuracy floor in every
                  condition. The behavioral evidence is much stronger than any claim of a general
                  capability improvement.
                </li>
              </ul>
              <p>
                The single-coordinate interpretation may also be incomplete. Related features could
                divide the same behavior into finer contexts, compensate for one another, or form a
                more stable low-dimensional subspace. Showing that <code>L22:F31850</code> is causally
                usable does not show that it is the unique representation of continuation.
              </p>
              <p>
                The next question is not merely whether this feature should be amplified. It is
                whether a controller can learn <em>when</em> continuing is useful, whether the relevant
                object is a feature or a low-dimensional subspace, and whether attribution can be
                redesigned to predict interventions rather than only rank candidates.
              </p>
              <p>
                We would also like to test beyond periods and beyond mathematical prose. Other
                punctuation may expose related decisions, and non-mathematical domains may recruit a
                different feature family entirely. Those experiments would distinguish a local AIME
                writing policy from a more general mechanism for discourse continuation.
              </p>
            </div>
          </section>

          <section className="closing-section">
            <div className="closing-feature" aria-hidden="true">
              <span>L22</span>
              <strong>F31850</strong>
              <i />
            </div>
            <div>
              <p className="eyebrow">Conclusion</p>
              <h2>We traced a connective and found a continuation policy.</h2>
              <p>
                We began with a local question: which features support Gemma&apos;s preference for a
                logical connective after a mathematical sentence? Attribution graphs gave us a
                tractable answer to where to look. They repeatedly surfaced
                <code>L22:F31850</code>, whose activating examples were rich in mathematical proof and
                whose graph paths supported connectives including <code>However</code>.
              </p>
              <p>
                Intervention changed both the strength and the content of that interpretation. The
                fixed-prefix audit confirmed that the feature had a positive local effect, but also
                showed that our signed Neumann score was not a causal magnitude. The generation-time
                experiment then showed that <code>However</code> was only one visible consequence of a
                broader behavior.
              </p>
              <p>
                At naturally active period positions in the AIME generations we tested, increasing
                the feature suppresses newlines and promotes a restricted family of continuations led
                by <code>Since</code> and <code>We</code>. Reversing it produces the opposite pattern.
                This control is strong enough to reorganize complete solutions, but it is not
                uniformly aligned with correctness.
              </p>
              <p>
                For us, that is the methodological result. Sparse features and attribution graphs can
                turn an opaque computation into a short list of testable hypotheses. Their value does
                not require treating every edge or path sum as a literal causal effect. The stronger
                standard is a sequence of tests: semantic inspection, fixed-prefix perturbation,
                autoregressive intervention, and downstream evaluation.
              </p>
              <blockquote>
                Attribution can tell us where to look. Intervention tells us what survives contact
                with the model.
              </blockquote>
              <div className="resource-links">
                <a href="/paper.pdf">Read the current paper draft <span>↗</span></a>
                <span>Code and interactive graphs · forthcoming</span>
              </div>
            </div>
          </section>
        </article>
      </main>

      <footer>
        <span>Transcoder Explore Project</span>
        <span>Cross-layer features for causal circuit analysis</span>
        <a href="#top">Back to top ↑</a>
      </footer>
    </>
  );
}
