<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    text?: string | number | null;
    as?: string;
    variant?: "default" | "muted" | "small" | "lead" | "strong";
    class?: HTMLAttributes["class"];
  }>(),
  { as: "span", variant: "default" },
);

const variants: Record<string, string> = {
  default: "text-sm text-foreground",
  muted: "text-sm text-muted-foreground",
  small: "text-xs text-muted-foreground",
  lead: "text-base text-muted-foreground",
  strong: "text-sm font-semibold text-foreground",
};
</script>

<template>
  <component :is="as" :class="cn(variants[variant], props.class)">
    <template v-if="text !== undefined && text !== null">{{ text }}</template>
    <slot v-else />
  </component>
</template>
