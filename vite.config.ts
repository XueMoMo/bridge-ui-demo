import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = { ...process.env, ...loadEnv(mode, process.cwd()) }
  console.info('BaseUrl:', env.VITE_BASE_URL)
  return {
    plugins: [react(), tailwindcss()],
    appType: 'mpa',
    base: env.VITE_BASE_URL,
  };
});
