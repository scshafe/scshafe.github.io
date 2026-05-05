# scshafe.github.io

A static-but-alive personal site for Cole Shafe.

## Stack

- **Vite + React + TypeScript** for a modern component workflow.
- **Tailwind CSS v4** for a compact, expressive design system.
- **Framer Motion** for tasteful page and section transitions.
- **OGL/WebGL shader background** for a dynamic hero without requiring a backend.
- **Lucide React** for clean iconography.

## Why this works on GitHub Pages

GitHub Pages serves the repository root. The checked-in `index.html`, `404.html`, `assets/`, `uploads/`, and `favicon.ico` are generated static files from `npm run build`.

All interactivity runs in the browser. No server runtime, database, or API is required.

## Local development

```bash
npm install
npm run dev
npm run build
npm run lint
```

After changing source files, run `npm run build` and copy the generated `dist` output to the repo root before committing:

```bash
npm run build
cp -R dist/assets ./assets
cp -R dist/uploads ./uploads
cp dist/index.html ./index.html
cp dist/404.html ./404.html
cp dist/favicon.ico ./favicon.ico
```

A GitHub Actions deploy workflow would be cleaner long-term, but adding workflow files requires a token with GitHub's `workflow` scope.
