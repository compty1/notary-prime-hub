import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
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
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "admin": [
            "./src/pages/admin/AdminDashboard",
            "./src/pages/admin/AdminOverview",
            "./src/pages/admin/AdminAppointments",
            "./src/pages/admin/AdminClients",
            "./src/pages/admin/AdminDocuments",
            "./src/pages/admin/AdminJournal",
            "./src/pages/admin/AdminRevenue",
            "./src/pages/admin/AdminSettings",
          ],
          "admin-tools": [
            "./src/pages/admin/AdminBuildTracker",
            "./src/pages/admin/AdminCRM",
            "./src/pages/admin/AdminLeadPortal",
            "./src/pages/admin/AdminEmailManagement",
            "./src/pages/admin/AdminContentWorkspace",
          ],
        },
      },
    },
  },
}));
