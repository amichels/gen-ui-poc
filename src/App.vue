<script setup lang="ts">
import { useLocalStorage } from "@vueuse/core";
import { Sparkles, Trash2 } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import ChatSidebar from "@/components/ChatSidebar.vue";
import GeneratedPage from "@/components/GeneratedPage.vue";
import { clearCurrentSpec, currentSpec, specRevision } from "@/lib/copilot";

const sidebarOpen = useLocalStorage("gen-ui-poc:sidebar-open", true);
</script>

<template>
  <main class="dark bg-background text-foreground min-h-screen" style="background-color: black">
    <div class="transition-[padding] duration-200" :class="{ 'sm:pr-96': sidebarOpen }">
      <template v-if="currentSpec">
        <div class="flex justify-end px-4 pt-4">
          <Button variant="ghost" size="sm" @click="clearCurrentSpec">
            <Trash2 />
            Clear UI
          </Button>
        </div>
        <GeneratedPage :key="specRevision" :spec="currentSpec" />
      </template>

      <section v-else class="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <Sparkles class="text-muted-foreground size-10" />
        <h1 class="text-2xl font-semibold">Nothing here yet</h1>
        <p class="text-muted-foreground max-w-md">
          Ask the assistant to build a UI and it will appear on this page.
        </p>
        <Button v-if="!sidebarOpen" @click="sidebarOpen = true">Open assistant</Button>
      </section>
    </div>

    <ChatSidebar v-model:open="sidebarOpen" />
  </main>
</template>
