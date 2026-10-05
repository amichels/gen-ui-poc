<script setup lang="ts">
import { computed, ref, shallowRef } from "vue";
import { compileSpecStream, createStateStore, type Spec } from "@json-render/core";
import { defineRegistry, JSONUIProvider, Renderer } from "@json-render/vue";
import { catalog, functions } from "./lib/catalog";
import { createActions, createComponents } from "./lib/registry";
import { specJsonl } from "./lib/spec";

const compileSpec = (source: string) => {
  source.split("\n").forEach((line, index) => {
    if (!line.trim()) return;

    try {
      JSON.parse(line);
    } catch {
      throw new Error(`Line ${index + 1} is not valid JSON`);
    }
  });

  return compileSpecStream(source) as unknown as Spec;
};

const specSource = ref(specJsonl);
const activeSpec = shallowRef<Spec>(compileSpec(specSource.value));
const store = createStateStore(activeSpec.value.state ?? {});
const specError = ref("");
const specLineCount = computed(
  () => (specSource.value.match(/\n/g)?.length ?? 0) + 1,
);

const applySpec = (source = specSource.value) => {
  specSource.value = source;
  try {
    const spec = compileSpec(source);
    store.update(
      Object.fromEntries(
        Object.entries(spec.state ?? {}).map(([key, value]) => [`/${key}`, value]),
      ),
    );
    activeSpec.value = spec;
    specError.value = "";
  } catch (error) {
    specError.value =
      error instanceof Error ? error.message : "Unable to parse JSONL";
  }
};

const applyTextareaSpec = (event: FocusEvent) => {
  applySpec((event.target as HTMLTextAreaElement).value);
};

const loadSpecFile = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  applySpec(await file.text());
  input.value = "";
};

const actions = createActions(store);
const components = createComponents(store);
const { registry } = defineRegistry(catalog, { components, actions });
</script>

<template>
  <main class="dark" style="background-color: black">
    <JSONUIProvider :registry="registry" :store="store" :handlers="actions" :functions="functions">
      <Renderer :spec="activeSpec" :registry="registry" />
    </JSONUIProvider>

    <!-- <section class="source-panel" aria-labelledby="source-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">SPEC SOURCE</p>
          <h2 id="source-title">One JSON patch per line</h2>
        </div>
        <div class="source-actions">
          <label class="load-spec-button">
            Load JSONL
            <input
              class="file-input"
              type="file"
              accept=".jsonl,.json,.txt,application/json,text/plain"
              @change="loadSpecFile"
            />
          </label>
          <span
            class="status-pill"
            :class="{ 'status-pill--error': specError }"
            role="status"
          >
            {{ specError ? "Invalid JSONL" : "Updates on blur" }}
          </span>
        </div>
      </div>
      <p class="source-hint">
        Paste a spec or load a .jsonl file. The editor has no character limit;
        changes apply when you leave the field.
        <span>{{ specSource.length.toLocaleString() }} characters · {{ specLineCount.toLocaleString() }} lines</span>
      </p>
      <textarea
        :value="specSource"
        class="source-input"
        aria-labelledby="source-title"
        :aria-invalid="Boolean(specError)"
        :aria-describedby="specError ? 'spec-error' : undefined"
        @blur="applyTextareaSpec"
        spellcheck="false"
      />
      <p v-if="specError" id="spec-error" class="source-error">
        {{ specError }}
      </p>
    </section> -->
  </main>
</template>