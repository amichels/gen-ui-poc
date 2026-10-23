import { onScopeDispose, ref, shallowRef } from "vue";
import type { AbstractAgent, Message } from "@ag-ui/client";
import { AGENT_ID, applySpec, copilot, RENDER_TOOL, SNAPSHOT_TOOL } from "@/lib/copilot";
import { splitSpecText } from "@/lib/spec-text";

export type FallbackResult = { ok: true } | { ok: false; error: string };

export const textOf = (content: unknown) =>
  typeof content === "string"
    ? content
    : Array.isArray(content)
      ? content.map((part) => (part?.type === "text" ? part.text : "")).join("")
      : "";

const snapshotOf = (message: Message) => {
  if (message.role !== "assistant") return undefined;
  const call = message.toolCalls?.find((c) => c.function.name === SNAPSHOT_TOOL);
  if (!call) return undefined;
  try {
    return JSON.parse(call.function.arguments)?.snapshot;
  } catch {
    return undefined;
  }
};

const getAgent = () =>
  new Promise<AbstractAgent>((resolve, reject) => {
    const existing = copilot.getAgent(AGENT_ID);
    if (existing) return resolve(existing);

    const subscription = copilot.subscribe({
      onAgentsChanged: ({ agents }) => {
        const agent = agents[AGENT_ID];
        if (!agent) return;
        subscription.unsubscribe();
        resolve(agent);
      },
      onRuntimeConnectionStatusChanged: ({ status }) => {
        if (status !== "error") return;
        subscription.unsubscribe();
        reject(new Error("Could not connect to the Copilot runtime. Is OPENAI_API_KEY set?"));
      },
    });
  });

export function useCopilotChat() {
  const messages = shallowRef<Message[]>([]);
  const isRunning = ref(false);
  const error = ref("");
  const fallbackResults = ref<Record<string, FallbackResult>>({});
  const handled = new Set<string>();
  let agent: AbstractAgent | undefined;
  let unsubscribe: (() => void) | undefined;

  // Models that ignore renderUI put the spec in their reply text or a state snapshot instead.
  const applyFallbackSpecs = (list: readonly Message[]) => {
    const fresh = list.filter((m) => m.role === "assistant" && !handled.has(m.id));
    fresh.forEach((m) => handled.add(m.id));
    if (fresh.some((m) => m.role === "assistant" && m.toolCalls?.some((c) => c.function.name === RENDER_TOOL))) return;

    for (const message of [...fresh].reverse()) {
      const source = snapshotOf(message) ?? splitSpecText(textOf(message.content)).source;
      if (!source) continue;
      const result = applySpec(source);
      fallbackResults.value = {
        ...fallbackResults.value,
        [message.id]: result.ok ? { ok: true } : { ok: false, error: result.error },
      };
      return;
    }
  };

  const ready = getAgent().then((resolved) => {
    agent = resolved;
    messages.value = [...resolved.messages];
    resolved.messages.forEach((m) => handled.add(m.id));
    unsubscribe = copilot.subscribeToAgentWithOptions(resolved, {
      onMessagesChanged: ({ messages: next }) => {
        messages.value = [...next];
      },
      onRunInitialized: () => {
        isRunning.value = true;
      },
      onRunFinalized: ({ messages: final }) => {
        isRunning.value = false;
        applyFallbackSpecs(final);
      },
      onRunErrorEvent: ({ event }) => {
        error.value = event.message || "The assistant could not complete this request.";
      },
    }).unsubscribe;
    return resolved;
  });
  ready.catch((reason: unknown) => {
    error.value = reason instanceof Error ? reason.message : String(reason);
  });

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || isRunning.value) return;
    error.value = "";
    const target = agent ?? (await ready);
    target.addMessage({ id: crypto.randomUUID(), role: "user", content });
    isRunning.value = true;
    try {
      await copilot.runAgent({ agent: target });
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : "The assistant could not complete this request.";
    } finally {
      isRunning.value = false;
      applyFallbackSpecs(target.messages);
    }
  };

  const stop = () => {
    if (agent) copilot.stopAgent({ agent });
  };

  onScopeDispose(() => unsubscribe?.());

  return { messages, isRunning, error, fallbackResults, send, stop };
}
