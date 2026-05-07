import { defineConfig } from "@react-router/dev/config";
import vercel from "@vercel/react-router";

export default defineConfig({
  ssr: true,
  presets: [vercel],
});
