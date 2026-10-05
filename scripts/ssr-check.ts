import { createSSRApp, h } from "vue";
import { renderToString } from "@vue/server-renderer";
import { compileSpecStream, createStateStore, type Spec } from "@json-render/core";
import { defineRegistry, JSONUIProvider, Renderer } from "@json-render/vue";
import { catalog } from "@/lib/catalog";
import { createActions, createComponents } from "@/lib/registry";
import { specJsonl } from "@/lib/spec";

// Render smoke test: proves the catalog/registry/spec pipeline renders. Portal
// content (Dialog/Sheet) is client-only, so it is not asserted here.
const spec = compileSpecStream(specJsonl) as unknown as Spec;

const store = createStateStore(spec.state ?? {});
store.set("/productsResponse", {
  products: [
    { id: 1, title: "Test Product", category: "beauty", brand: "Acme", price: 9.99, rating: 4.5 },
    { id: 2, title: "Second Item", category: "fragrances", brand: "Globex", price: 19.5, rating: 3.9 },
  ],
});
store.set("/productsLoading", false);

const actions = createActions(store);
const components = createComponents(store);
const { registry } = defineRegistry(catalog, { components, actions });

const app = createSSRApp({
  render: () =>
    h(
      JSONUIProvider,
      { registry, store, handlers: actions },
      { default: () => h(Renderer, { spec, registry }) },
    ),
});

const html = await renderToString(app);

const checks: Array<[string, boolean]> = [
  ["card root", html.includes('data-slot="card"')],
  ["card title text", html.includes("Product Catalog")],
  ["table element", html.includes('data-slot="table"')],
  ["repeated row 1", html.includes("Test Product")],
  ["repeated row 2", html.includes("Second Item")],
  ["$item brand", html.includes("Acme")],
  ["badge rendered", html.includes('data-slot="badge"')],
  ["reload button", html.includes("Reload")],
  ["view button", html.includes("View")],
];

let failed = 0;
for (const [label, ok] of checks) {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
}
console.log(`\n${checks.length - failed}/${checks.length} SSR checks passed`);
