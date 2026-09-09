// A plugin bundle as a marketplace serves it: one ES module whose default export is the plugin, importing only what
// the instance provides. This version owns a collection and creates it at bootstrap, which is the second thing an
// instance is tested against: a plugin that brings its own table.
import { onBootstrap } from "@voidbase-cloud/voidbase/kernel";
import { ensureCollections } from "@voidbase-cloud/voidbase/plugins/collections";
const manifest = { name: "echo", version: "0.2.0", tier: "community", voidbase: ">=0.9.0-beta.15", collections: ["echoes"] };
const plugin = {
  manifest,
  apply(ctx) {
    ctx.app.get("/api/echo", (c) => c.text("echo"));
    onBootstrap(ctx, (env) => ensureCollections(plugin, env.DB, [{ name: "echoes", type: "base", fields: [{ name: "text", type: "text" }] }]));
  },
};
export { plugin };
export default plugin;
