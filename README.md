# The Feature That Makes a Language Model Keep Reasoning

**Read the blog: https://transcoder-reasoning.liushiqiiiiii.chatgpt.site/**

Mirror on GitHub Pages: https://stella-67.github.io/transcoder-reasoning-blog/

Long-form research blog for the Transcoder Explore project. The site presents the discovery and causal validation of Gemma-3-4B-IT feature `L22:F31850`, including the latent-mixing CLT, attribution audit, autoregressive intervention, and AIME results.

The current paper draft is bundled as `public/paper.pdf` ([download](https://transcoder-reasoning.liushiqiiiiii.chatgpt.site/paper.pdf)); article figures are in `public/`.

## Development

```bash
npm ci
npm run dev
```

## Deployment

The primary site is hosted on ChatGPT Sites (`.openai/hosting.json`). Every push to `main` also deploys the GitHub Pages mirror via `.github/workflows/pages.yml`: `npm run build` builds the worker, then `scripts/export-static.mjs` renders it to a static site in `out/`, prefixing root-absolute URLs with the repo sub-path.
