# shadcn-vue + json-render example

Standalone Vite app demonstrating [shadcn-vue](https://github.com/unovue/shadcn-vue) components rendered from JSONL using `@json-render/vue`.

The registry exposes shadcn-vue components (plus a few small layout primitives — `Text`, `Heading`, `Stack`, `Row` — that specs need because shadcn-vue components are slot-based). The demo is a paginated product catalog: it fetches data from `dummyjson.com`, renders it in a shadcn `Table` via the spec's `repeat` field, and opens a `Dialog` with the selected product's JSON.

## Requirements

- Node.js 24 or newer (see `.nvmrc`)
- npm

## Run locally

```sh
npm install
npm run dev
```

Vite prints the local URL when the server starts.

## Other commands

```sh
npm run check-types
npm run build
npm run preview
```

## How it works

- `src/lib/shadcn.ts` — maps every catalog component name to its shadcn-vue implementation.
- `src/lib/catalog.ts` — builds the json-render catalog (component names, slots, descriptions) from that map.
- `src/lib/registry.ts` — turns each catalog entry into a json-render render function, wiring prop bindings (`$bindState`) and events to the shadcn-vue component.
- `src/lib/spec.ts` — the JSONL spec rendered by `App.vue`. More examples live in `src/lib/examples/`.

shadcn-vue components are copied into `src/components/ui/` by the CLI. To add more:

```sh
npx shadcn-vue@latest add <component>
```

then add the new exports to `src/lib/shadcn.ts`.
