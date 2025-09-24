import { join as pathJoin } from "node:path";
import { createProductionBundle } from "../../create-bundle.mjs";

await createProductionBundle({
  entryPoints: [pathJoin(import.meta.dirname, "./src/server.ts")],
  outDir: pathJoin(import.meta.dirname, "./dist"),
  packageName: "@binglow/bot-auth-service"
});
