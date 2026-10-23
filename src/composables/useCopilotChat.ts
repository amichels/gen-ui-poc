import { onScopeDispose, ref, shallowRef } from "vue";
import type { AbstractAgent, Message } from "@ag-ui/client";
import { AGENT_ID, copilot } from "@/lib/copilot";

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
  let agent: AbstractAgent | undefined;
  let unsubscribe: (() => void) | undefined;

  const ready = getAgent().then((resolved) => {
    agent = resolved;
    messages.value = [...resolved.messages];
    unsubscribe = copilot.subscribeToAgentWithOptions(resolved, {
      onMessagesChanged: ({ messages: next }) => {
        messages.value = [...next];
      },
      onRunInitialized: () => {
        isRunning.value = true;
      },
      onRunFinalized: () => {
        isRunning.value = false;
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
    }
  };

  const stop = () => {
    if (agent) copilot.stopAgent({ agent });
  };

  onScopeDispose(() => unsubscribe?.());

  return { messages, isRunning, error, send, stop };
}
