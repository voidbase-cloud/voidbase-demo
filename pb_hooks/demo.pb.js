/// <reference path="../pb_data/types.d.ts" />
// demo.voidbase.cloud: a public voidbase instance anyone may sign into and change, restored every hour.
//
//   - the schema and the sample records come from demo-data.js, and are re-imported on the hour, so a visitor can
//     delete a collection, edit records or change the superuser password and the next reset undoes all of it;
//   - file upload is refused, because this instance's bucket is open to the internet;
//   - everything else is a normal voidbase app: the unmodified PocketBase admin panel at /_/, the same REST API,
//     realtime included.
//
// The reset runs on Cloudflare's cron trigger (`cronAdd` below) and, for a database that has just been created, on
// the first request.
const demo = require(`${__hooks}/demo-data.js`);

const RESET_CRON = "0 * * * *"; // on the hour

function seedRecords() {
  for (const u of demo.USERS) {
    const rec = new Record($app.findCollectionByNameOrId("users"), { id: u.id, email: u.email, name: u.name, verified: u.verified, emailVisibility: u.emailVisibility });
    rec.setPassword(u.password);
    $app.saveNoValidate(rec);
  }
  for (const p of demo.POSTS) $app.saveNoValidate(new Record($app.findCollectionByNameOrId("posts"), p));
  for (const m of demo.MESSAGES) $app.saveNoValidate(new Record($app.findCollectionByNameOrId("messages"), m));
}

/** The superuser the demo publishes: recreated if it was deleted, its password reset if it was changed. */
function resetSuperuser() {
  const superusers = $app.findCollectionByNameOrId("_superusers");
  let rec = null;
  try { rec = $app.findAuthRecordByEmail(superusers, demo.SUPERUSER.email); } catch (err) { rec = null; }
  if (!rec) rec = new Record(superusers, { email: demo.SUPERUSER.email });
  rec.setPassword(demo.SUPERUSER.password);
  $app.saveNoValidate(rec);
}

/** The whole demo, back to how it ships: the schema (visitor-made collections dropped), the records, the superuser. */
function reset() {
  $app.importCollections(demo.COLLECTIONS, true); // deleteMissing: a collection a visitor added is gone
  for (const name of demo.DEMO_NAMES) {
    const collection = $app.findCollectionByNameOrId(name);
    if (collection.type !== "view") $app.truncateCollection(collection);
  }
  seedRecords();
  resetSuperuser();
  console.log("demo: reset");
}

let checked = false;
/** A database that has just been created has none of this yet; the check costs one lookup per isolate. */
function ensureSeeded() {
  if (checked) return;
  checked = true;
  try { $app.findCollectionByNameOrId("posts"); } catch (err) { reset(); }
}

cronAdd("demo-reset", RESET_CRON, () => { reset(); });

routerUse((e) => {
  ensureSeeded();
  // this bucket is public: nobody uploads to it, unless the DEMO_UPLOADS flag says so (a Flagship flag, evaluated per request)
  const type = e.c.req.header("content-type") || "";
  if (type.indexOf("multipart/form-data") === 0 && e.c.req.method !== "GET" && $os.getenv("DEMO_UPLOADS") !== "true") {
    throw new BadRequestError("File upload is disabled in this demo. Everything else works: try it on your own instance with `bunx voidbase sync`.");
  }
  return e.next();
});
