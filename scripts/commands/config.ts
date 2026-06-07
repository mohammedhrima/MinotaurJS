import { ensureConfig } from "../core/config.ts";
import { ensureDirs } from "../core/paths.ts";

(async () => {
  ensureDirs();
  await ensureConfig();
})();
