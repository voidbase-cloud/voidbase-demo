// The demo instance's configuration. Everything here is public on purpose: the credentials are printed on the page,
// and the database is restored every hour. Declared with defaults so a fresh clone deploys the demo without a
// secrets.json of its own; only the deploy token has to come from the environment.
import { boolean, browser, defineSecrets, flag, local, secret, server, string } from "@voidbase-cloud/voidbase/secrets";

export default defineSecrets({
  VOIDBASE_DEPLOY_NAME: local(string().default("voidbase-demo"), "the demo's own Worker, isolated from voidbase.cloud's"),
  VOIDBASE_DEPLOY_DOMAIN: local(string().default("demo.voidbase.cloud"), "where the demo answers"),
  // the hourly reset is a hook cron, so this Worker gets Cloudflare's cron trigger
  VOIDBASE_DEPLOY_CRON: local(boolean().default(true), "the cron trigger the hourly reset runs on"),
  VOIDBASE_DEPLOY_CF_API_KEY: local(string().optional(), "the deploy token (`voidbase token` prints the link that creates it)"),

  // the demo is a project: its installer commits plugin changes to this repository, and the push deploys them
  VOIDBASE_PROJECT_REPO: server(string().default("voidbase-cloud/voidbase-demo"), "the repository the demo deploys from"),
  VOIDBASE_PROJECT_BRANCH: server(string().default("master"), "its branch"),
  // No GitHub token here, on purpose. With one, the panel's installer commits a plugin to the repository, the
  // build deploys it, and the plugin runs with the Worker's env. This demo publishes its superuser login, so any
  // visitor could run code of their choosing beside the Stripe keys. Without it the installer answers that this
  // instance's plugins are fixed, and plugins change through a commit to the repository.

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

  // taking money, in Stripe's test mode: the secret key turns the stripe plugin on, the signing secret is the one
  // Stripe gave the endpoint registered for https://demo.voidbase.cloud/api/payments/stripe/webhook, and the
  // publishable key is the one a page using Stripe.js would read (the checkout redirect does not need it)
  STRIPE_SECRET_KEY: secret(string(), "Stripe's test-mode secret key, which turns the stripe plugin on"),
  STRIPE_WEBHOOK_SECRET: secret(string(), "the signing secret of the demo's Stripe webhook endpoint"),
  STRIPE_PUBLISHABLE_KEY: browser(string().optional(), "Stripe's test-mode publishable key, for a page using Stripe.js"),

  // an Analytics Engine data point per request, which the observability plugin summarises. Off until Analytics
  // Engine is enabled on the account (a dashboard step; a version upload with the binding fails with 10089 before
  // then). The dataset needs no token to write, and the token to read it is deliberately not put here: a superuser
  // on this public demo can install plugins, and a plugin runs with the Worker's env.
  VOIDBASE_DEPLOY_ANALYTICS: local(boolean().default(false), "the Analytics Engine dataset the observability plugin writes to"),

  // the shop, so the demo carries a working one: a flat tax and a flat rate, free over a threshold
  VOIDBASE_COMMERCE: server(string().default("1"), "the shop's ten collections and its routes"),
  VOIDBASE_COMMERCE_CURRENCY: server(string().default("usd"), "what the shop prices in"),
  VOIDBASE_TAX_RATE: server(string().default("20"), "the one percentage tax-flat charges"),
  VOIDBASE_SHIPPING_FLAT: server(string().default("500"), "the one rate shipping-flat offers, in minor units"),
  VOIDBASE_SHIPPING_FREE_OVER: server(string().default("5000"), "the subtotal above which shipping is free"),

  // a feature flag, held by Cloudflare Flagship: the bucket is public, so uploads stay off unless someone turns
  // them on in the dashboard for a while, without a deploy
  DEMO_UPLOADS: flag(boolean().default(false), "whether file uploads are accepted; the bucket is open to the internet, so off unless somebody is watching"),
});
