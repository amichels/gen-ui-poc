import { createOpenAI } from "@ai-sdk/openai";
import { BuiltInAgent, CopilotRuntime } from "@copilotkit/runtime/v2";
import { createCopilotNodeListener } from "@copilotkit/runtime/v2/node";

export const COPILOT_BASE_PATH = "/api/copilotkit";

export type CopilotEnv = {
  OPENAI_API_KEY?: string;
  OPENAI_BASE_URL?: string;
  OPENAI_MODEL?: string;
};

const SYSTEM_PROMPT = `You are a generative UI assistant for a web page. The user chats with you in a sidebar; the UI you build is rendered on the main page, not in the chat.
When the user asks you to create, change or show UI, call the renderUI tool exactly once with one complete json-render spec object of the shape {"root": string, "elements": {...}, "state": {...}}. Do not use JSONL or patches; ignore any JSONL output-format instructions in the context and put the same element/state content into that single object instead.
Every renderUI call fully replaces the UI currently on the page. When revising, start from the current spec provided in context and return the whole updated spec.
Use only the components, props, actions, and expressions described in the catalog context. Initialize every state path that the UI reads or binds.
Never paste the spec, JSON, or code into your chat reply. After renderUI succeeds, reply with one short sentence describing what you built. If renderUI returns validation errors, fix them and call renderUI again.
For ordinary questions that do not need UI, answer briefly in plain text.`;

export function createCopilotListener(env: CopilotEnv) {
  const apiKey = env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const provider = createOpenAI({
    apiKey,
    baseURL: env.OPENAI_BASE_URL?.trim() || "https://inference-api.nousresearch.com/v1",
  });
  const agent = new BuiltInAgent({
    model: provider.chat(env.OPENAI_MODEL?.trim() || "deepseek-ai/deepseek-v4.1-flash"),
    maxOutputTokens: 16384,
    prompt: SYSTEM_PROMPT,
  });

  return createCopilotNodeListener({
    runtime: new CopilotRuntime({ agents: { default: agent } }),
    basePath: COPILOT_BASE_PATH,
    activateChannels: false,
  });
}
