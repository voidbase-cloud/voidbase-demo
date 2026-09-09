// The demo, for real: demo.voidbase.cloud runs the latest release with two installed plugins, one from our
// marketplace and one from a throwaway one, and its superuser is public (the demo page prints it).
//   bun test/live.ts [--demo https://demo.voidbase.cloud]
// The deploy runs it on itself (package.json `deploy`, which is what the Cloudflare build calls), so a deploy that
// breaks the demo fails its build. The first requests give the fresh upload a minute to answer.
export {};
const args = process.argv.slice(2);
const DEMO = (args[args.indexOf("--demo") + 1] && args.includes("--demo") ? args[args.indexOf("--demo") + 1]! : "https://demo.voidbase.cloud").replace(/\/+$/, "");
const ua = { "user-agent": "voidbase-demo-live/1" };
let pass = 0, fail = 0;
const check = (label: string, ok: boolean, detail = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : "  " + detail}`); };
const get = async (path: string, token?: string) => { const r = await fetch(DEMO + path, { headers: { ...ua, ...(token ? { authorization: token } : {}) } }); const t = await r.text(); let json: any = null; try { json = JSON.parse(t); } catch { /* text */ } return { status: r.status, text: t, json }; }; // eslint-disable-line @typescript-eslint/no-explicit-any
let health = await get("/api/health");
for (let i = 0; i < 12 && health.status !== 200; i++) { await Bun.sleep(5000); health = await get("/api/health"); }
check("the demo answers", health.status === 200 && health.json?.code === 200, `${health.status} ${health.text.slice(0, 80)}`);
const echo = await get("/api/echo");
check("echo, installed from the throwaway marketplace, answers", echo.status === 200 && echo.text === "echo", `${echo.status} ${echo.text.slice(0, 40)}`);
check("the panel is served", (await get("/_/")).status === 200);
check("/api/plugins needs a superuser", (await get("/api/plugins")).status === 401);
const login = await fetch(`${DEMO}/api/collections/_superusers/auth-with-password`, { method: "POST", headers: { "content-type": "application/json", ...ua }, body: JSON.stringify({ identity: "test@example.com", password: "demo123456" }) });
const token = ((await login.json()) as { token?: string }).token ?? "";
check("the public demo superuser signs in", login.status === 200 && !!token, String(login.status));
const plugins = await get("/api/plugins", token);
const origins = (plugins.json?.origins ?? {}) as Record<string, string>;
check("backups comes from our marketplace and takes the place of the shipped one", plugins.status === 200 && String(origins.backups).startsWith("https://marketplace.voidbase.cloud"), JSON.stringify(plugins.json).slice(0, 300));
check("echo comes from the throwaway marketplace", String(origins.echo).startsWith("https://raw.githubusercontent.com/voidbase-cloud/voidbase-throwaway-marketplace"), JSON.stringify(origins));
check("realtime and hardening still ship", origins.realtime === "shipped" && origins.hardening === "shipped", JSON.stringify(origins));
const backups = await get("/api/backups", token);
check("the installed backups plugin serves its routes", backups.status === 200 && Array.isArray(backups.json), String(backups.status));
const stream = await fetch(`${DEMO}/api/realtime`, { headers: { ...ua, accept: "text/event-stream" }, signal: AbortSignal.timeout(4000) }).then(async (r) => (await r.body!.getReader().read()).value).then((v) => new TextDecoder().decode(v ?? new Uint8Array())).catch((e) => String(e));
check("realtime connects", /PB_CONNECT/.test(stream), stream.slice(0, 80));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
