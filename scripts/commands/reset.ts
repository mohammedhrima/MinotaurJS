import { writeFileSync } from "node:fs";
import { configPath } from "../core/paths.ts";
import { ura } from "../core/logger.ts";

writeFileSync(configPath, "{}\n");
ura.log("config reset — next `npm start` will ask for setup");
