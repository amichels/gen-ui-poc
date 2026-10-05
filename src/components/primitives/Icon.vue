<script setup lang="ts">
import type { Component, HTMLAttributes } from "vue";
import { Check, Eye, Loader2, Plus, RefreshCw, Search, Trash2, X } from "@lucide/vue";
import { cn } from "@/lib/utils";

const icons: Record<string, Component> = {
  Check,
  Eye,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
};

const props = withDefaults(
  defineProps<{
    name?: string;
    class?: HTMLAttributes["class"];
  }>(),
  { name: "Check" },
);
</script>

<template>
  <component :is="icons[name] ?? icons.Check" :class="cn('size-4', props.class)" />
</template>
