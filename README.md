# The Feature That Makes a Language Model Keep Reasoning

**Read the blog: https://stella-67.github.io/transcoder-reasoning-blog/**

Long-form research blog for the Transcoder Explore project. The site presents the discovery and causal validation of Gemma-3-4B-IT feature `L22:F31850`, including the latent-mixing CLT, attribution audit, autoregressive intervention, and AIME results.

The current paper draft is bundled as `public/paper.pdf` ([download](https://stella-67.github.io/transcoder-reasoning-blog/paper.pdf)); article figures are in `public/`.

## Development

```bash
npm ci
npm run dev
```

## Deployment

Every push to `main` deploys to GitHub Pages via `.github/workflows/pages.yml`: `npm run build` builds the worker, then `scripts/export-static.mjs` renders it to a static site in `out/`, prefixing root-absolute URLs with the repo sub-path.
