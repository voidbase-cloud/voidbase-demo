// The demo instance's configuration. Everything here is public on purpose: the credentials are printed on the page,
// and the database is restored every hour. Declared with defaults so a fresh clone deploys the demo without a
// secrets.json of its own; only the deploy token has to come from the environment.
import { boolean, defineSecrets, flag, local, secret, server, string } from "@voidbase-cloud/voidbase/secrets";

export default defineSecrets({
  VOIDBASE_DEPLOY_NAME: local(string().default("voidbase-demo"), "the demo's own Worker, isolated from voidbase.cloud's"),
  VOIDBASE_DEPLOY_DOMAIN: local(string().default("demo.voidbase.cloud"), "where the demo answers"),
  // the hourly reset is a hook cron, so this Worker gets Cloudflare's cron trigger
  VOIDBASE_DEPLOY_CRON: local(boolean().default(true), "the cron trigger the hourly reset runs on"),
  VOIDBASE_DEPLOY_CF_API_KEY: local(string().optional(), "the deploy token (`voidbase token` prints the link that creates it)"),

  // the demo is a project: its installer commits plugin changes to this repository, and the push deploys them
  VOIDBASE_PROJECT_REPO: server(string().default("voidbase-cloud/voidbase-demo"), "the repository the demo deploys from"),
  VOIDBASE_PROJECT_BRANCH: server(string().default("master"), "its branch"),
  VOIDBASE_GH_TOKEN: secret(string().optional(), "a GitHub token with contents write on that repository, for the installer"),

  // the published demo login, stored as this Worker's secrets like any superuser
  VOIDBASE_SUPERUSER_EMAIL: local(string().default("test@example.com"), "the demo superuser, printed on the page"),
  VOIDBASE_SUPERUSER_PASSWORD: local(string().default("demo123456"), "its password, printed on the page"),

  // the plugins the demo shows off: Workers AI behind /api/ai/chat (the deploy adds the binding), and the posts
  // collection answering in the reader's language
  VOIDBASE_AI: local(string().default("1"), "Workers AI for the ai plugin; 1 means the default model"),
  VOIDBASE_TRANSLATABLE: server(string().default("posts:title,description"), "the fields the translations plugin swaps per locale"),
  VOIDBASE_LOCALES: server(string().default("en,ar,fr"), "the locales, source first, in fallback order"),
  // the seo plugin: a sitemap over the posts, and page metadata plus a share card per post
  VOIDBASE_SITEMAP: server(string().default("posts:/posts/{id}"), "the public records the sitemap lists, and the path each one has"),
  VOIDBASE_SEO_PNG: local(string().default("1"), "render the share cards as PNG; carries resvg's wasm into the Worker"),
  VOIDBASE_SEO: server(string().default("posts:Article{title=title,description=description,datePublished=created,dateModified=updated}"), "what each post's page metadata and JSON-LD say"),

  // the hardening plugin's response policy, so the demo answers the headers a real instance should
  VOIDBASE_HSTS: server(string().default("600"), "Strict-Transport-Security, kept short on the demo on purpose"),
  VOIDBASE_REFERRER_POLICY: server(string().default("strict-origin-when-cross-origin"), "Referrer-Policy"),
  VOIDBASE_PERMISSIONS_POLICY: server(string().default("camera=(), geolocation=(), microphone=()"), "Permissions-Policy"),
  VOIDBASE_CROSS_ORIGIN: server(string().default("1"), "the embedder and resource policies beside the opener one"),
  VOIDBASE_CSP: server(string().default("default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'"), "the policy on every response"),
  VOIDBASE_CSP_ROUTES: server(string().default("/api/seo/og/*:default-src 'none'"), "a stricter policy on the share cards"),
  // one session across a browser navigation and the API: the token also travels as a cookie, which the double-submit
  // token below is what makes safe
  VOIDBASE_AUTH_COOKIE: server(string().default("1"), "the auth token as a cookie as well as a header"),
  VOIDBASE_CSRF: server(string().default("double-submit"), "the token a cookie-carrying write must send; a bearer token is exempt"),

  // a feature flag, held by Cloudflare Flagship: the bucket is public, so uploads stay off unless someone turns
  // them on in the dashboard for a while, without a deploy
  DEMO_UPLOADS: flag(boolean().default(false), "whether file uploads are accepted; the bucket is open to the internet, so off unless somebody is watching"),
});
