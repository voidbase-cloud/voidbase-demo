// The plugin lifecycle on the demo, for real: the same three commands a project owner runs, each followed by the
// deploy, each checked on demo.voidbase.cloud. The demo is the testbed (Mahmood: no throwaway instances); it ends
// where it started, byte for byte, and a failure puts it back before giving up.
//   bun test/plugins.ts [--demo https://demo.voidbase.cloud]        (bun run plugins)
// Needs VOIDBASE_DEPLOY_CF_API_KEY (the deploy runs from here, not from a push: the repository is the demo's state,
// and this run leaves it unchanged). The steps, with the seconds each took, are the report.
import { $ } from "bun";
const args = process.argv.slice(2);
const DEMO = (args.includes("--demo") ? args[args.indexOf("--demo") + 1]! : "https://demo.voidbase.cloud").replace(/\/+$/, "");
const MARKET = "https://raw.githubusercontent.com/voidbase-cloud/voidbase-throwaway-marketplace/master";
const ua = { "user-agent": "voidbase-demo-plugins/1" };
const ROOT = new URL("..", import.meta.url).pathname;
let pass = 0, fail = 0; const t0 = Date.now();
const since = () => `${Math.round((Date.now() - t0) / 1000)}s`;
const check = (label: string, ok: boolean, detail = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  [${since()}] ${label}${ok ? "" : "  " + detail}`); };
if (!process.env.VOIDBASE_DEPLOY_CF_API_KEY) { console.error("VOIDBASE_DEPLOY_CF_API_KEY is not set: the deploy runs from here"); process.exit(1); }
// the environment the deploy sees: the deploy key, never the builds token (a sync with it would touch the trigger)
const env = { ...process.env, CLOUDFLARE_BUILDS_TOKEN: undefined, VOIDBASE_DEPLOY_NAME: undefined, VOIDBASE_DEPLOY_DOMAIN: undefined } as Record<string, string | undefined>;
const sh = async (label: string, cmd: string[]) => {
  const s = Date.now(); const p = Bun.spawn(cmd, { cwd: ROOT, env: env as Record<string, string>, stdout: "pipe", stderr: "pipe" });
  const [out, err] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text()]); const code = await p.exited;
  const secs = Math.round((Date.now() - s) / 1000);
  console.log(`  $ ${cmd.join(" ")}   (${secs}s${code ? `, exit ${code}` : ""})`);
  if (code) console.log((out + err).split("\n").filter(Boolean).slice(-6).map((l) => "    " + l).join("\n"));
  return { code, out: out + err, secs };
};
const cli = (...a: string[]) => sh(a.join(" "), ["bun", "node_modules/.bin/voidbase", ...a]);
const deploy = () => sh("deploy", ["bun", "run", "deploy"]);
const get = async (path: string, token?: string) => { const r = await fetch(DEMO + path, { headers: { ...ua, ...(token ? { authorization: token } : {}) } }); const text = await r.text(); let json: any = null; try { json = JSON.parse(text); } catch { /* text */ } return { status: r.status, text, json }; }; // eslint-disable-line @typescript-eslint/no-explicit-any
/** the deployed state, polled: a fresh upload answers within seconds, the check waits up to a minute for it */
const until = async (what: () => Promise<boolean>) => { for (let i = 0; i < 20; i++) { if (await what()) return true; await Bun.sleep(3000); } return what(); };
const su = async () => { const r = await fetch(`${DEMO}/api/collections/_superusers/auth-with-password`, { method: "POST", headers: { "content-type": "application/json", ...ua }, body: JSON.stringify({ identity: "test@example.com", password: "demo123456" }) }); return ((await r.json()) as { token?: string }).token ?? ""; };
const origins = async () => ((await get("/api/plugins", await su())).json?.origins ?? {}) as Record<string, string>;
/** what differs from the repository: the plugin files, and the lock apart from installedOn (a fresh install is dated today) */
const drift = async () => {
  const files = (await $`git status --porcelain -- pb_plugins`.cwd(ROOT).text()).trim();
  const lock = (await $`git diff -- voidbase.lock`.cwd(ROOT).text()).split("\n").filter((l) => /^[-+]/.test(l) && !/^[-+]{2}/.test(l) && !/"installedOn"/.test(l));
  return [files, ...lock].filter(Boolean).join("\n");
};
const clean = async () => (await drift()) === "";

const before = await $`git status --porcelain -- pb_plugins voidbase.lock`.cwd(ROOT).text();
if (before.trim()) { console.error(`pb_plugins or voidbase.lock has local changes; commit or drop them first:\n${before}`); process.exit(1); }
const ls = await cli("plugins", "ls");
check("the demo starts with echo 0.2.0 from the throwaway marketplace", ls.code === 0 && /echo 0\.2\.0 \(https:\/\/raw\.githubusercontent\.com\/voidbase-cloud\/voidbase-throwaway-marketplace/.test(ls.out), ls.out.slice(0, 300));
check("the deployed demo agrees: /api/echo answers", (await get("/api/echo")).status === 200);

try {
  console.log("\nuninstall");
  const rm = await cli("plugins", "remove", "echo");
  check("voidbase plugins remove echo: the files and the lock entry go", rm.code === 0 && /removed echo/.test(rm.out) && !(await Bun.file(`${ROOT}/pb_plugins/echo/bundle.js`).exists()), rm.out.slice(0, 200));
  const d1 = await deploy();
  check("deploy: the demo runs without echo", d1.code === 0 && (await until(async () => (await get("/api/echo")).status === 404)), d1.out.slice(-300));
  const o1 = await origins();
  check("/api/plugins no longer lists echo; the other installed plugins are untouched", !o1.echo && String(o1.auth).startsWith("https://marketplace.voidbase.cloud") && String(o1.backups).startsWith("https://marketplace.voidbase.cloud"), JSON.stringify(o1));
  const kept = await get("/api/collections/echoes", await su());
  check("the collection echo owned stays with its data: uninstalling a plugin drops no table", kept.status === 200 && kept.json?.name === "echoes", String(kept.status));

  console.log("\ninstall an older version");
  const add = await cli("plugins", "add", "echo@0.1.0", "--marketplace", MARKET);
  check("voidbase plugins add echo@0.1.0: downloaded, verified, pinned", add.code === 0 && /installed echo 0\.1\.0/.test(add.out) && /"version": "0\.1\.0"/.test(await Bun.file(`${ROOT}/voidbase.lock`).text()), add.out.slice(0, 200));
  const d2 = await deploy();
  check("deploy: /api/echo answers again", d2.code === 0 && (await until(async () => (await get("/api/echo")).status === 200)), d2.out.slice(-300));
  check("/api/plugins says echo comes from the throwaway marketplace", String((await origins()).echo).startsWith(MARKET));

  console.log("\nupdate");
  const up = await cli("plugins", "update", "echo");
  check("voidbase plugins update echo: 0.1.0 -> 0.2.0", up.code === 0 && /echo 0\.1\.0 -> 0\.2\.0/.test(up.out), up.out.slice(0, 200));
  const d3 = await deploy();
  check("deploy: the updated plugin answers and its owned collection is there", d3.code === 0 && (await until(async () => (await get("/api/echo")).status === 200)) && (await get("/api/collections/echoes", await su())).status === 200, d3.out.slice(-300));
  check("the repository is what it was (only installedOn moved to today): the demo's deployed state and its repository agree", await clean(), await drift());
} finally {
  if (await clean()) await $`git checkout -- voidbase.lock`.cwd(ROOT).quiet();  // the date is not worth a diff
  else {
    console.log("\nputting the demo back");
    await $`git checkout -- pb_plugins voidbase.lock`.cwd(ROOT).quiet();
    await $`git clean -fdq -- pb_plugins`.cwd(ROOT).quiet();
    const back = await deploy();
    check("restored: the repository's plugin set is deployed again", back.code === 0 && (await until(async () => (await get("/api/echo")).status === 200)), back.out.slice(-300));
  }
  console.log(`\n${pass} passed, ${fail} failed (${since()})`);
  process.exit(fail ? 1 : 0);
}
