import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the research article and interactive figures", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /A Feature That Makes Gemma Keep Reasoning/i);
  assert.match(html, /L22:F31850/);
  assert.match(html, /Probe graph/);
  assert.match(html, /Loading attribution graph/);
  assert.match(html, /Figure 1/);
  assert.match(html, /Figure 4/);
  assert.match(html, /class="katex"/);
  assert.match(html, /math-katex-block/);
  assert.doesNotMatch(html, /katex-error/);
  assert.doesNotMatch(html, /\/paper-math\/main\d+x\.svg/);
  assert.doesNotMatch(html, /class=["'][^"']*(?:lmmi|lmsy|lmex|msbm|rm-lmbx|rm-lmr)/);
  assert.match(html, /Ten ways that “keep going” changes an answer/);
  assert.equal((html.match(/data-trajectory-case=/g) ?? []).length, 10);
  assert.match(html, /Convert hours before adding minutes/);
  assert.match(html, /Do not discard the smallest feasible divisor/);
  assert.match(html, /aria-pressed=/);
  assert.doesNotMatch(html, /Your site is taking shape/);
});

test("keeps every numbered result figure interactive and backed by graph artifacts", async () => {
  const [graph, results, reconstruction, sparsity, featureEvidence, clt, originalModel, page, paperOriginal, paperTables, probeData] = await Promise.all([
    readFile(new URL("../app/InteractiveAttributionGraph.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/InteractiveResultFigures.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/InteractiveReconstructionFigure.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/InteractiveSparsityFigure.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/InteractiveFeatureEvidence.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/InteractiveCltArchitecture.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/InteractiveOriginalModel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/PaperOriginal.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/paper-tables.html", import.meta.url), "utf8"),
    readFile(new URL("../public/probe-graphs.json", import.meta.url), "utf8"),
  ]);

  assert.match(graph, /^"use client";/);
  assert.match(graph, /<canvas/);
  assert.match(graph, /fetch\("\/probe-graphs\.json"/);
  assert.match(graph, /onClick=\{\(\) => hoveredId && setSelectedId\(hoveredId\)\}/);
  assert.match(graph, /incomingLimit/);
  assert.match(graph, /NeighborList/);
  assert.match(graph, /TopActivationSentences/);
  assert.match(graph, /Top-activating OpenWebMath excerpts/);
  assert.match(graph, /fetch\("\/probe-token-activations\.json"/);
  assert.match(graph, /tokenTint/);
  assert.match(graph, /track\.activations/);

  const probes = JSON.parse(probeData);
  assert.equal(probes.graphs.length, 6);
  assert.deepEqual(
    probes.graphs.map((item) => item.id),
    [
      "aime-24-12",
      "france-capital",
      "planet-implicit",
      "planet-explicit",
      "calc-first-digit",
      "calc-second-digit",
    ],
  );

  const aime = probes.graphs[0];
  assert.equal(aime.defaultNodeId, "f22.271.31850");
  assert.equal(aime.nodes.length, 375);
  assert.equal(aime.edges.length, 10_183);
  assert.equal(probes.graphs[1].target.token, " Paris");
  for (const item of probes.graphs) {
    assert.equal(item.featureBudget, 100);
    const features = item.nodes.filter((node) => node.kind === "feature");
    assert.equal(features.length, 100);
    assert.equal(features.filter((node) => node.topActivations?.length === 3).length, 100);
    for (const feature of features) {
      for (const example of feature.topActivations) {
        assert.ok(example.peakEnd > example.peakStart);
        assert.ok(example.text.slice(example.peakStart, example.peakEnd).length > 0);
      }
    }
  }

  assert.match(results, /^"use client";/);
  assert.match(results, /InteractiveActivationFigure/);
  assert.match(results, /InteractiveContinuationFigure/);
  assert.match(results, /InteractiveAccuracyFigure/);
  assert.match(results, /aria-live="polite"/);
  assert.match(results, /<select/);
  assert.match(results, /candidate-firing-token/);
  assert.match(results, /peak token/i);
  assert.match(results, /visiblePeakToken/);

  assert.match(reconstruction, /^"use client";/);
  assert.match(reconstruction, /All datasets/);
  assert.match(reconstruction, /StackExchange \(held-out\)/);
  assert.match(reconstruction, /AIME 2024\+2025/);
  assert.match(reconstruction, /aria-pressed=\{isActive\}/);
  assert.match(reconstruction, /relativeByLayer/);
  assert.match(reconstruction, /targetNormByLayer/);

  assert.match(sparsity, /^"use client";/);
  assert.match(sparsity, /hardL0ByLayer/);
  assert.match(sparsity, /onPointerEnter/);
  assert.match(sparsity, /active features\/token/);
  assert.match(sparsity, /top-k cap \(k=500\)/);

  assert.match(featureEvidence, /^"use client";/);
  assert.match(featureEvidence, /L22:F31850/);
  assert.match(featureEvidence, /Enterprise-software names/);
  assert.match(featureEvidence, /Problem-solving write-ups/);
  assert.match(featureEvidence, /aria-pressed=\{isSelected\}/);
  assert.match(featureEvidence, /aria-live="polite"/);
  assert.match(featureEvidence, /data-strength=\{strength\}/);
  assert.match(featureEvidence, /strength-4/);

  assert.match(clt, /independent decoder blocks · each M × d/i);
  assert.match(clt, /<span>Decoder form<\/span>/);
  assert.match(clt, /clt2-parameter-count/);
  assert.match(clt, /Independent direction for each/);
  assert.match(clt, /Shared output-layer direction with source-specific strength/);
  assert.match(clt, /152\.32B/);
  assert.match(clt, /8\.764B/);
  assert.doesNotMatch(clt, /clt2-parameter-table/);
  assert.doesNotMatch(paperOriginal, /<PaperTable index=\{0\}/);

  assert.match(originalModel, /import MathFormula from "\.\/Math";/);
  assert.match(originalModel, /Math\.abs/);
  assert.doesNotMatch(originalModel, /import Math from "\.\/Math";/);

  const articleSource = `${page}\n${paperOriginal}`;
  assert.match(articleSource, /<InteractiveAttributionGraph \/>/);
  assert.match(articleSource, /<InteractiveActivationFigure \/>/);
  assert.match(articleSource, /<InteractiveContinuationFigure \/>/);
  assert.match(articleSource, /<InteractiveAccuracyFigure \/>/);
  assert.match(articleSource, /<InteractiveReconstructionFigure \/>/);
  assert.match(articleSource, /<InteractiveSparsityFigure \/>/);
  assert.match(articleSource, /<InteractiveFeatureEvidence \/>/);
  assert.doesNotMatch(articleSource, /<PaperTable index=\{2\} \/>/);
  assert.doesNotMatch(articleSource, /reconstruction-by-layer\.png/);
  assert.doesNotMatch(articleSource, /sparsity-by-layer\.png/);
  assert.match(articleSource, /neumann-decay\.png/);
  assert.match(articleSource, /france-feature-screen\.png/);
  assert.match(articleSource, /capital-feature-screen\.png/);
  assert.match(articleSource, /shared-mediator-trace\.svg/);
  assert.match(articleSource, /edge-percentiles\.png/);
  assert.equal((paperTables.match(/data-paper-table=/g) ?? []).length, 11);
  assert.doesNotMatch(articleSource, /src="\/24_12\.png"/);
});
