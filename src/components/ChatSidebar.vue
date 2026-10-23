<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { Loader2, MessageSquare, Send, Square, X } from "@lucide/vue";
import type { Message } from "@ag-ui/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCopilotChat, textOf } from "@/composables/useCopilotChat";
import { RENDER_TOOL, SNAPSHOT_TOOL } from "@/lib/copilot";
import { splitSpecText } from "@/lib/spec-text";

const open = defineModel<boolean>("open", { required: true });

const { messages, isRunning, error, fallbackResults, send, stop } = useCopilotChat();
const draft = ref("");
const transcript = ref<HTMLElement>();

type ChatEntry =
  | { id: string; kind: "text"; role: "user" | "assistant"; text: string }
  | { id: string; kind: "status"; text: string; pending: boolean };

const fallbackStatus = (id: string, pending: boolean): ChatEntry => {
  const result = fallbackResults.value[id];
  return {
    id: `${id}-spec`,
    kind: "status",
    pending: !result && pending,
    text: !result ? (pending ? "Building UI…" : "UI was not rendered") : result.ok ? "Rendered UI on the page" : `Spec was invalid: ${result.error}`,
  };
};

const toEntries = (list: Message[]): ChatEntry[] => {
  const results = new Map(
    list.flatMap((m) => (m.role === "tool" ? [[m.toolCallId, textOf(m.content)] as const] : [])),
  );
  return list.flatMap<ChatEntry>((m) => {
    if (m.role === "user") return [{ id: m.id, kind: "text", role: "user", text: textOf(m.content) }];
    if (m.role !== "assistant") return [];
    const entries: ChatEntry[] = [];
    const { before, after, source, partial } = splitSpecText(textOf(m.content));
    if (before) entries.push({ id: m.id, kind: "text", role: "assistant", text: before });
    if (source || partial) entries.push(fallbackStatus(m.id, isRunning.value));
    if (after) entries.push({ id: `${m.id}-after`, kind: "text", role: "assistant", text: after });
    for (const call of m.toolCalls ?? []) {
      if (call.function.name === SNAPSHOT_TOOL) {
        if (!source && !partial) entries.push(fallbackStatus(m.id, isRunning.value));
        continue;
      }
      if (call.function.name !== RENDER_TOOL) continue;
      const result = results.get(call.id);
      entries.push({
        id: call.id,
        kind: "status",
        pending: result === undefined,
        text:
          result === undefined
            ? "Building UI…"
            : result.startsWith("Rendered")
              ? "Rendered UI on the page"
              : "Spec was invalid, retrying…",
      });
    }
    return entries;
  });
};

const entries = computed(() => toEntries(messages.value));
watch(entries, async () => {
  await nextTick();
  transcript.value?.scrollTo({ top: transcript.value.scrollHeight });
});

const submit = () => {
  const text = draft.value;
  if (!text.trim() || isRunning.value) return;
  draft.value = "";
  void send(text);
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
  event.preventDefault();
  submit();
};
</script>

<template>
  <Button
    v-if="!open"
    class="fixed right-4 bottom-4 z-40 shadow-lg"
    aria-label="Open assistant"
    @click="open = true"
  >
    <MessageSquare />
    Assistant
  </Button>

  <aside
    v-show="open"
    class="bg-card text-card-foreground fixed inset-y-0 right-0 z-40 flex w-full flex-col border-l sm:w-96"
    aria-label="Assistant"
  >
    <header class="flex items-center justify-between border-b px-4 py-3">
      <h2 class="text-sm font-semibold">UI Assistant</h2>
      <Button variant="ghost" size="icon" aria-label="Close assistant" @click="open = false">
        <X />
      </Button>
    </header>

    <div ref="transcript" class="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
      <p v-if="!entries.length" class="text-muted-foreground text-sm">
        Describe the UI you want and it will be rendered on the page. Each new request replaces the current UI.
      </p>
      <template v-for="entry in entries" :key="entry.id">
        <p
          v-if="entry.kind === 'text'"
          class="max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap"
          :class="entry.role === 'user' ? 'bg-primary text-primary-foreground ml-auto' : 'bg-muted text-foreground'"
        >
          {{ entry.text }}
        </p>
        <p v-else class="text-muted-foreground flex items-center gap-2 text-xs" role="status">
          <Loader2 v-if="entry.pending" class="size-3 animate-spin" />
          {{ entry.text }}
        </p>
      </template>
      <p v-if="isRunning && !entries.some((e) => e.kind === 'status' && e.pending)" class="text-muted-foreground flex items-center gap-2 text-xs" role="status">
        <Loader2 class="size-3 animate-spin" />
        Thinking…
      </p>
      <p v-if="error" class="text-destructive text-sm" role="alert">{{ error }}</p>
    </div>

    <form class="flex items-end gap-2 border-t p-3" @submit.prevent="submit">
      <Textarea
        v-model="draft"
        class="max-h-40 min-h-10 flex-1 resize-none"
        placeholder="Ask for a UI…"
        aria-label="Message"
        rows="1"
        @keydown="onKeydown"
      />
      <Button v-if="isRunning" type="button" size="icon" variant="outline" aria-label="Stop" @click="stop">
        <Square />
      </Button>
      <Button v-else type="submit" size="icon" aria-label="Send" :disabled="!draft.trim()">
        <Send />
      </Button>
    </form>
  </aside>
</template>
