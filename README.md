# PrimeVue + json-render example

Standalone Vite app demonstrating PrimeVue components rendered from JSONL using `@json-render/vue`.

The registry exposes PrimeVue components directly. The demo is a searchable, paginated Pokédex table of the first 50 Pokémon, with wiki links in each row. Component props and native slots pass through to PrimeVue; no custom layout, spacing, typography, or Garmin-specific components are added.

## Requirements

- Node.js 24 or newer
- npm

## Run locally

```sh
npm install
npm run dev
```

Vite prints the local URL when the server starts. No workspace setup or global Portless installation is required.

## Other commands

```sh
npm run check-types
npm run build
npm run preview
```

The JSONL editor applies a spec when it loses focus. You can also load a `.jsonl` file with the editor's **Load JSONL** control.
