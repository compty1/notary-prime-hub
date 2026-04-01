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
        manualChunks(id: string) {
          if (id.includes("src/pages/admin/AdminDashboard") ||
              id.includes("src/pages/admin/AdminOverview") ||
              id.includes("src/pages/admin/AdminAppointments") ||
              id.includes("src/pages/admin/AdminClients") ||
              id.includes("src/pages/admin/AdminDocuments") ||
              id.includes("src/pages/admin/AdminJournal") ||
              id.includes("src/pages/admin/AdminRevenue") ||
              id.includes("src/pages/admin/AdminSettings")) {
            return "admin";
          }
          if (id.includes("src/pages/admin/AdminBuildTracker") ||
              id.includes("src/pages/admin/AdminCRM") ||
              id.includes("src/pages/admin/AdminLeadPortal") ||
              id.includes("src/pages/admin/AdminEmailManagement") ||
              id.includes("src/pages/admin/AdminContentWorkspace")) {
            return "admin-tools";
          }
        },
      },
    },
  },
}));
