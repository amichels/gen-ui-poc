<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <form :class="cn('flex flex-col gap-4', props.class)" @submit.prevent>
    <slot />
  </form>
</template>
