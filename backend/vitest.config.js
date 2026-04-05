import { loadEnvFile } from "node:process";
import { defineConfig } from "vitest/config";

loadEnvFile();

export default defineConfig({
  test: {},
});
