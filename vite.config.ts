import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv, type Plugin } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

const copilotRuntime = (env: Record<string, string>): Plugin => ({
  name: "copilot-runtime",
  apply: "serve",
  async configureServer(server) {
    const { COPILOT_BASE_PATH, createCopilotListener } = await import("./server/copilot-runtime");
    const listener = createCopilotListener(env);

    // Mounted without a route prefix so req.url keeps the full path the runtime expects.
    server.middlewares.use((req, res, next) => {
      if (!req.url?.startsWith(COPILOT_BASE_PATH)) return next();
      if (!listener) {
        res.statusCode = 503;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "OPENAI_API_KEY is not configured" }));
        return;
      }
      Promise.resolve(listener(req, res)).catch(next);
    });
  },
});

export default defineConfig(({ mode }) => ({
  plugins: [vue(), tailwindcss(), copilotRuntime(loadEnv(mode, process.cwd(), ""))],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
}));
