import { schema } from "@json-render/vue/schema";
import { z } from "zod";
import { primeVueComponentNames } from "./primevue-components";

const primeVueSlots = [
  "default",
  "header",
  "footer",
  "title",
  "subtitle",
  "content",
  "start",
  "end",
  "icon",
  "item",
  "option",
  "empty",
  "loading",
  "body",
  "caption",
  "groupheader",
  "groupfooter",
  "expansion",
  "clearicon",
  "dropdownicon",
  "filtericon",
  "indicator",
  "closeicon",
  "handle",
  "container",
  "rowexpansion",
];

const primeVueCatalogComponents = Object.fromEntries(
  primeVueComponentNames.map((name) => [
    name,
    {
      props: z.object({}).passthrough(),
      slots: primeVueSlots,
      description: `PrimeVue ${name} component.`,
    },
  ]),
);

export const catalog = schema.createCatalog({
  components: primeVueCatalogComponents,
  actions: {
    fetchData: {
      params: z.object({
        url: z.string(),
        method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).optional(),
        headers: z.record(z.string(), z.string()).optional(),
        body: z.unknown().optional(),
        statePath: z.string().optional(),
        loadingPath: z.string().optional(),
        errorPath: z.string().optional(),
      }),
      description:
        "Call an HTTP endpoint. Stores the parsed response at statePath, toggles loadingPath while pending, and writes the error message to errorPath on failure.",
    },
    showProductDetails: {
      params: z.object({ product: z.unknown() }),
      description:
        "Select a product, format its complete record as JSON, and open its details dialog.",
    },
  },
});

export type AppCatalog = typeof catalog;