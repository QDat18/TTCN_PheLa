import { defineConfig } from "@react-router/dev/config";
import { vercelPreset } from "@vercel/react-router";

export default defineConfig({
  ssr: true,
  presets: [vercelPreset()],
});
