"use client";

import { useState } from "react";

type Segment = {
  text: string;
  strength?: 1 | 2 | 3 | 4;
};

type FeatureEvidence = {
  id: string;
  label: string;
  layer: number;
  feature: number;
  excerpts: Segment[][];
};

const features: FeatureEvidence[] = [
  {
    id: "L0:F30117",
    label: "Enterprise-software names",
    layer: 0,
    feature: 30117,
    excerpts: [
      [{ text: "### Moving from MediaWiki to " }, { text: "SharePoint", strength: 3 }, { text: " O365 - part 4 …" }],
      [{ text: "… · This is an example of " }, { text: "SharePoint", strength: 3 }, { text: " list lookup column in PowerApps. Power …" }],
      [{ text: "… " }, { text: "intranet", strength: 3 }, { text: " local site, and sites in the " }, { text: "intranet", strength: 2 }, { text: " are configured (this is necessary in order …" }],
    ],
  },
  {
    id: "L0:F28233",
    label: "Troubleshooting & diagnosis",
    layer: 0,
    feature: 28233,
    excerpts: [
      [{ text: "… errors out ...anyone willing to PM to " }, { text: "troubleshoot", strength: 3 }, { text: "? · rooted, took me a …" }],
      [{ text: "… the Design and Analysis of Experiments for process " }, { text: "troubleshooting", strength: 3 }, { text: " and discovering ways to improve process output. …" }],
      [{ text: "… prompt. I do this because a) " }, { text: "troubleshooting", strength: 3 }, { text: " database issues is far outside of my skillset …" }],
    ],
  },
  {
    id: "L20:F14399",
    label: "Section headings",
    layer: 20,
    feature: 14399,
    excerpts: [
      [{ text: "… ## " }, { text: "Stochastic Oscillator 101", strength: 3 }, { text: " The fundamental " }, { text: "premise", strength: 1 }, { text: " …" }],
      [{ text: "… ## " }, { text: "Defining Definite Integrals", strength: 3 }, { text: " What is a definite …" }],
      [{ text: "… ## " }, { text: "Countable and Uncountable Sets Definition", strength: 3 }, { text: ". …" }],
    ],
  },
  {
    id: "L22:F31850",
    label: "Mathematical logic/proof",
    layer: 22,
    feature: 31850,
    excerpts: [
      [{ text: "… a Seifert manifold is the mapping torus of a mapping with trace at most 2 in absolute value, under the usual identification " }, { text: "$\\text{MCG}(T^2) \\cong \\text{SL}(2,\\mathbb{Z})$", strength: 4 }, { text: ". For trace $+2$, the Seifert invariants are then written explicitly. …" }],
      [{ text: "… $R/P$ is a simple Artinian ring with a simple module $V$, also viewed as a simple right $R$-module. I want to " }, { text: "show that $M$ is isomorphic to the injective hull of $V$", strength: 4 }, { text: ". Any suggestion would be appreciated. …" }],
      [{ text: "… for every open set $U \\subset A$, where $U$ is open in $\\mathbb{R}^n$, I want to show that " }, { text: "$f(U)$ is open", strength: 4 }, { text: ". I saw related questions mentioning the invariance-of-domain theorem, whose proof is substantially harder. …" }],
    ],
  },
  {
    id: "L30:F38145",
    label: "Academic citation",
    layer: 30,
    feature: 38145,
    excerpts: [
      [{ text: "… " }, { text: "theorem in the theory of binary relations}, journal = {Compositio Mathematica}", strength: 3 }, { text: ", …" }],
      [{ text: "… " }, { text: "illi}, journal ={Celestial mechanics}, year ={1985}", strength: 3 }, { text: ", …" }],
      [{ text: "… " }, { text: "}, journal ={J. Complex.}, year ={2004}", strength: 3 }, { text: ", …" }],
    ],
  },
  {
    id: "L31:F31060",
    label: "Problem-solving write-ups",
    layer: 31,
    feature: 31060,
    excerpts: [
      [{ text: "… " }, { text: "Relevant", strength: 1 }, { text: " equations " }, { text: "3. The attempt at a solution", strength: 3 }, { text: " I don’t know where …" }],
      [{ text: "… })$$ 3" }, { text: ". The attempt at a solution", strength: 3 }, { text: " " }, { text: "Going", strength: 1 }, { text: " back " }, { text: "to basics with this", strength: 2 }, { text: " …" }],
      [{ text: "… 7:53 There " }, { text: "is a tricky subst i", strength: 3 }],
    ],
  },
];

type TokenPiece = {
  text: string;
  wordIndex?: number;
  peak?: boolean;
};

function tokenPieces(segments: Segment[]): TokenPiece[] {
  let wordIndex = 0;
  const pieces: TokenPiece[] = [];

  for (const segment of segments) {
    for (const text of segment.text.split(/(\s+)/)) {
      if (!text) continue;
      if (/^\s+$/.test(text)) {
        pieces.push({ text });
      } else {
        pieces.push({ text, wordIndex, peak: Boolean(segment.strength) });
        wordIndex += 1;
      }
    }
  }

  return pieces;
}

function Excerpt({ segments, index }: { segments: Segment[]; index: number }) {
  const pieces = tokenPieces(segments);
  const peakIndices = pieces.flatMap((piece) => piece.peak && piece.wordIndex !== undefined ? [piece.wordIndex] : []);

  return (
    <li>
      <span className="feature-evidence-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
      <p>
        {pieces.map((piece, pieceIndex) => {
          if (piece.wordIndex === undefined) return <span key={`space-${pieceIndex}`}>{piece.text}</span>;
          const distance = Math.min(...peakIndices.map((peakIndex) => Math.abs(peakIndex - piece.wordIndex!)));
          const strength = distance === 0 ? 4 : distance === 1 ? 3 : distance === 2 ? 2 : distance === 3 ? 1 : 0;

          return strength > 0 ? (
            <mark
              className={`feature-evidence-token strength-${strength}`}
              data-strength={strength}
              data-peak={piece.peak ? "true" : undefined}
              key={`${piece.text}-${pieceIndex}`}
            >
              {piece.text}
            </mark>
          ) : <span key={`${piece.text}-${pieceIndex}`}>{piece.text}</span>;
        })}
      </p>
    </li>
  );
}

export default function InteractiveFeatureEvidence() {
  const [selectedId, setSelectedId] = useState(features[0].id);
  const selected = features.find((feature) => feature.id === selectedId) ?? features[0];

  return (
    <figure className="feature-evidence full-bleed">
      <header className="feature-evidence-heading">
        <div>
          <span>Table 3 · Interactive evidence</span>
          <strong>What does a feature respond to?</strong>
          <p>Select a feature to inspect its three strongest OpenWebMath excerpts.</p>
        </div>
        <div className="feature-evidence-legend" aria-label="Activation strength legend">
          <span>activation</span>
          <i className="strength-1" aria-hidden="true" />
          <i className="strength-2" aria-hidden="true" />
          <i className="strength-3" aria-hidden="true" />
          <i className="strength-4" aria-hidden="true" />
          <span>stronger</span>
        </div>
      </header>

      <div className="feature-evidence-layout">
        <nav className="feature-evidence-nav" aria-label="Monosemantic features">
          {features.map((feature) => {
            const isSelected = feature.id === selected.id;
            return (
              <button
                type="button"
                key={feature.id}
                aria-pressed={isSelected}
                className={isSelected ? "is-selected" : ""}
                onClick={() => setSelectedId(feature.id)}
              >
                <span>{feature.id}</span>
                <strong>{feature.label}</strong>
              </button>
            );
          })}
        </nav>

        <section className="feature-evidence-detail" aria-live="polite">
          <div className="feature-evidence-title">
            <div>
              <span>Layer {selected.layer} · Feature {selected.feature}</span>
              <h4>{selected.label}</h4>
            </div>
            <code>{selected.id}</code>
          </div>
          <ol>
            {selected.excerpts.map((excerpt, index) => (
              <Excerpt key={`${selected.id}-${index}`} segments={excerpt} index={index} />
            ))}
          </ol>
        </section>
      </div>

      <figcaption>
        <span>Table 3.</span>
        <p>
          Automated-interpretability evidence that CLT features are monosemantic.
          Token tint is proportional to activation strength.
        </p>
      </figcaption>
    </figure>
  );
}
