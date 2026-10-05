<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    text?: string | number | null;
    level?: 1 | 2 | 3 | 4;
    class?: HTMLAttributes["class"];
  }>(),
  { level: 2 },
);

const sizes: Record<number, string> = {
  1: "text-3xl font-bold tracking-tight text-foreground",
  2: "text-2xl font-semibold tracking-tight text-foreground",
  3: "text-xl font-semibold text-foreground",
  4: "text-base font-semibold text-foreground",
};
</script>

<template>
  <component :is="`h${level}`" :class="cn(sizes[level], props.class)">
    <template v-if="text !== undefined && text !== null">{{ text }}</template>
    <slot v-else />
  </component>
</template>
