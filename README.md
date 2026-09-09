# demo.voidbase.cloud

The public demo: a voidbase instance of its own, isolated from voidbase.cloud's, serving the unmodified PocketBase
admin panel at `/_/` and a framed copy of it with the credentials at `/`.

It is a **pb layout**, PocketBase's own structure, which is the point: nothing here is special to the site.

```
pb_hooks/demo-data.js   the schema (users, posts, messages, a messagesReport view) and the sample records
pb_hooks/demo.pb.js     seeds an empty database, restores everything on the hour, refuses file uploads
pb_secrets/main.ts      the deploy target and the published login, declared with defaults
pb_public/index.html    the banner and the frame around the panel
```

The database is restored every hour by a hook cron (`$app.importCollections` with `deleteMissing`, then
`truncateCollection` and a reseed), so a visitor may delete a collection, edit records or change the superuser
password and the next reset undoes it. File upload is refused because the bucket is public.

Run it locally:

```bash
bun run dev            # http://127.0.0.1:8095, panel at /_/
```

Deploy it (needs the deploy token in the environment or in `pb_secrets/secrets.json`):

```bash
bunx voidbase sync --name voidbase-demo --domain demo.voidbase.cloud
```

The target is named on the command line because the site's build environment carries its own
`VOIDBASE_DEPLOY_NAME`; without it the deploy refuses rather than putting the demo on the site's Worker.

A push to master deploys this too, from **its own** Cloudflare Workers Builds trigger on the `voidbase-demo` Worker
(a build may only deploy the Worker its trigger belongs to, so the site's build cannot do it). `voidbase sync` from
this directory creates that trigger; the build is `bun run build` (nothing) and the deploy is `bun run deploy`
(the sync), and that is the whole pipeline. `bun test` runs `test/live.ts` against the deployed demo when you want
to check it by hand.

The demo runs the newest voidbase release on purpose: when a version is published, the release build in
[voidbase](https://github.com/voidbase-cloud/voidbase) pins it here (`chore(deps): voidbase <version>`) and that
push deploys it. A regression is meant to show up here first, not in someone else's project.

File uploads are behind the `DEMO_UPLOADS` feature flag (Cloudflare Flagship, off by default; the deploy creates it), so a maintainer can allow them for a while from the dashboard without a deploy.

Sign in with `test@example.com` / `demo123456`. The password is a demo secret in name only: it is printed on the
page, and every hour it goes back to this.
