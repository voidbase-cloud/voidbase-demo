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

  // a feature flag, held by Cloudflare Flagship: the bucket is public, so uploads stay off unless someone turns
  // them on in the dashboard for a while, without a deploy
  DEMO_UPLOADS: flag(boolean().default(false), "whether file uploads are accepted; the bucket is open to the internet, so off unless somebody is watching"),
});
