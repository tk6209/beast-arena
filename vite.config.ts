import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  build: {
    // Quebra o bundle único em chunks de vendor para cache de longo prazo e
    // um carregamento inicial mais leve.
    rollupOptions: {
      // Multi-page build: o app principal (Beast Arena) e o protótipo standalone
      // CapiRocket Dash são duas entradas HTML independentes, com bundles próprios.
      // `main` (index.html) PRECISA ser listado explicitamente, senão o app
      // principal some do build quando `input` vira um objeto.
      input: {
        main: path.resolve(__dirname, "index.html"),
        capyrocket: path.resolve(__dirname, "capyrocket.html"),
      },
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "data-vendor": ["@tanstack/react-query", "@supabase/supabase-js"],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
