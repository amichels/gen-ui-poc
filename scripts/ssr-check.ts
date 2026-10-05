import { createSSRApp, h } from "vue";
import { renderToString } from "@vue/server-renderer";
import { compileSpecStream, createStateStore, type Spec } from "@json-render/core";
import { defineRegistry, JSONUIProvider, Renderer } from "@json-render/vue";
import { catalog } from "@/lib/catalog";
import { createActions, createComponents } from "@/lib/registry";
import { specJsonl } from "@/lib/spec";

const spec = compileSpecStream(specJsonl) as unknown as Spec;

const store = createStateStore(spec.state ?? {});
// Seed rows so `repeat` renders actual data during SSR (no live fetch in SSR).
store.set("/productsResponse", {
  products: [
    { id: 1, title: "Test Product", category: "beauty", brand: "Acme", price: 9.99, rating: 4.5 },
    { id: 2, title: "Second Item", category: "fragrances", brand: "Globex", price: 19.5, rating: 3.9 },
  ],
});
store.set("/productsLoading", false);
// Open the bound dialog to prove $bindState on `open` + DialogContent slot rendering.
store.set("/selectedProductJson", '{ "id": 1 }');
store.set("/detailsOpen", true);

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

const ctx: { teleports?: Record<string, string> } = {};
const html = await renderToString(app, ctx);
// Portal content (Dialog/Sheet) is teleported out of the main tree.
const haystack = html + Object.values(ctx.teleports ?? {}).join("");

const checks: Array<[string, boolean]> = [
  ["card root", haystack.includes('data-slot="card"')],
  ["card title text", haystack.includes("Product Catalog")],
  ["table element", haystack.includes('data-slot="table"')],
  ["repeated row 1", haystack.includes("Test Product")],
  ["repeated row 2", haystack.includes("Second Item")],
  ["$item brand", haystack.includes("Acme")],
  ["badge rendered", haystack.includes('data-slot="badge"')],
  ["reload button", haystack.includes("Reload")],
  ["dialog content (open)", haystack.includes('data-slot="dialog-content"')],
  ["dialog title text", haystack.includes("Product details")],
  ["textarea bound value", haystack.includes('data-slot="textarea"')],
];

let failed = 0;
for (const [label, ok] of checks) {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
}
console.log(`\n${checks.length - failed}/${checks.length} checks passed`);
console.log("--- HTML LENGTH:", haystack.length, "---");
