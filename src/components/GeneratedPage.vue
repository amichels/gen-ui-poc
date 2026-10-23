<script setup lang="ts">
import { createStateStore, type Spec } from "@json-render/core";
import { defineRegistry, JSONUIProvider, Renderer } from "@json-render/vue";
import { catalog, functions } from "@/lib/catalog";
import { createActions, createComponents } from "@/lib/registry";

// Store and registry are built once per mount; the parent remounts via :key when the spec changes.
const props = defineProps<{ spec: Spec }>();

const store = createStateStore(props.spec.state ?? {});
const actions = createActions(store);
const { registry } = defineRegistry(catalog, { components: createComponents(store), actions });
</script>

<template>
  <JSONUIProvider :registry="registry" :store="store" :handlers="actions" :functions="functions">
    <Renderer :spec="props.spec" :registry="registry" />
  </JSONUIProvider>
</template>
