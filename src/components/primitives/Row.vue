<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    gap?: number | string;
    wrap?: boolean;
    class?: HTMLAttributes["class"];
  }>(),
  { gap: 3, wrap: false },
);
</script>

<template>
  <div
    :class="cn('flex flex-row items-center', props.wrap && 'flex-wrap', props.class)"
    :style="{ gap: `${Number(props.gap) * 0.25}rem` }"
  >
    <slot />
  </div>
</template>
