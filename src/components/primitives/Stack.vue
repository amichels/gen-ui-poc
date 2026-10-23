<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    gap?: number | string;
    class?: HTMLAttributes["class"];
  }>(),
  { gap: 3 },
);
</script>

<template>
  <div
    :class="cn('flex flex-col', props.class)"
    :style="{ gap: `${Number(props.gap) * 0.25}rem` }"
  >
    <slot />
  </div>
</template>
