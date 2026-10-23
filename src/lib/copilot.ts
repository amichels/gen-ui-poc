import { shallowRef, ref, watch } from "vue";
import { CopilotKitCore } from "@copilotkit/core";
import type { Spec } from "@json-render/core";
import { z } from "zod";
import { catalog } from "./catalog";
import { clearSpec, loadSpec, parseSpec, saveSpec } from "./spec-storage";

export const AGENT_ID = "default";

export const currentSpec = shallowRef<Spec | null>(loadSpec());
export const specRevision = ref(0);

const setSpec = (spec: Spec | null) => {
  if (spec) saveSpec(spec);
  else clearSpec();
  currentSpec.value = spec;
  specRevision.value += 1;
};

export const clearCurrentSpec = () => setSpec(null);

export const copilot = new CopilotKitCore({ runtimeUrl: "/api/copilotkit" });

copilot.addTool({
  name: "renderUI",
  description:
    "Render a json-render UI on the main page, replacing whatever is currently shown. Pass one complete spec object.",
  parameters: z.object({
    spec: z
      .object({
        root: z.string().describe("Key of the root element in `elements`."),
        elements: z.record(z.string(), z.unknown()).describe("Flat map of element key to element."),
        state: z.record(z.string(), z.unknown()).optional().describe("Initial state model."),
      })
      .describe("A complete json-render spec."),
  }),
  followUp: true,
  handler: async ({ spec }) => {
    const result = parseSpec(spec);
    if (!result.ok) return `Validation failed, nothing was rendered. Fix these issues and call renderUI again:\n${result.error}`;
    setSpec(result.spec);
    return "Rendered on the page.";
  },
});

copilot.addContext({
  description: "json-render component catalog: the components, actions and expression syntax available to renderUI",
  value: catalog.prompt({
    system: "Reference for building specs passed to the renderUI tool.",
    customRules: [
      "Pass the spec to renderUI as one JSON object {root, elements, state}; never output JSONL in chat.",
      "Available $computed functions: pageOffset({page, pageSize}) returns the skip offset; pageList({total, pageSize}) returns [{page, skip}] for pagination.",
      "Use the `class` prop with Tailwind classes for layout and spacing.",
    ],
  }),
});

let specContextId: string | undefined;
watch(
  currentSpec,
  (spec) => {
    if (specContextId) copilot.removeContext(specContextId);
    specContextId = copilot.addContext({
      description: "The spec currently rendered on the page (null when the page is empty)",
      value: JSON.stringify(spec),
    });
  },
  { immediate: true },
);
