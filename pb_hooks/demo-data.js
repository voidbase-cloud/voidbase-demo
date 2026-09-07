/// <reference path="../pb_data/types.d.ts" />
// The public demo's schema and its sample records, in one place: `demo.pb.js` seeds from here when the database is
// empty and restores from here every hour, so whatever a visitor does is undone. A plain module (no `.pb.js`), so
// the hook file requires it as a sibling.
//
// The collections mirror PocketBase's own demo (users, posts, messages and a messagesReport view) because the point
// of this instance is that the unmodified PocketBase admin panel cannot tell the difference.

// the password satisfies _superusers' own rule (at least 8 characters), so the hourly reset can restore it
const SUPERUSER = { email: "test@example.com", password: "demo123456" };
const USER = { email: "user@example.com", password: "1234567890" };

// ---- the schema, as `voidbase import` / PocketBase's collection export writes it ---------------------------------

const idField = {
  autogeneratePattern: "[a-z0-9]{15}", hidden: false, id: "text3208210256", max: 15, min: 15, name: "id",
  pattern: "^[a-z0-9]+$", presentable: false, primaryKey: true, required: true, system: true, type: "text",
};
const created = { hidden: false, id: "autodate2990389176", name: "created", onCreate: true, onUpdate: false, presentable: false, system: false, type: "autodate" };
const updated = { hidden: false, id: "autodate3332085495", name: "updated", onCreate: true, onUpdate: true, presentable: false, system: false, type: "autodate" };

const COLLECTIONS = [
  {
    id: "pbc_demo_users", name: "users", type: "auth", system: false,
    // a visitor may read and edit their own record, and sign up; the panel sees everything
    listRule: "id = @request.auth.id", viewRule: "id = @request.auth.id", createRule: "",
    updateRule: "id = @request.auth.id", deleteRule: "id = @request.auth.id",
    fields: [
      idField,
      { cost: 0, hidden: true, id: "password901924565", max: 0, min: 8, name: "password", pattern: "", presentable: false, required: true, system: true, type: "password" },
      { autogeneratePattern: "[a-zA-Z0-9]{50}", hidden: true, id: "text2504183744", max: 60, min: 30, name: "tokenKey", pattern: "", presentable: false, primaryKey: false, required: true, system: true, type: "text" },
      { exceptDomains: null, hidden: false, id: "email3885137012", name: "email", onlyDomains: null, presentable: false, required: true, system: true, type: "email" },
      { hidden: false, id: "bool1547992806", name: "emailVisibility", presentable: false, required: false, system: true, type: "bool" },
      { hidden: false, id: "bool256245529", name: "verified", presentable: false, required: false, system: true, type: "bool" },
      { autogeneratePattern: "", hidden: false, id: "text_users_name", max: 0, min: 0, name: "name", pattern: "", presentable: true, primaryKey: false, required: false, system: false, type: "text" },
      { hidden: false, id: "file_users_avatar", maxSelect: 1, maxSize: 0, mimeTypes: ["image/jpeg", "image/png", "image/svg+xml", "image/gif", "image/webp"], name: "avatar", presentable: false, protected: false, required: false, system: false, thumbs: null, type: "file" },
      created, updated,
    ],
    indexes: [
      "CREATE UNIQUE INDEX `idx_tokenKey_pbc_demo_users` ON `users` (`tokenKey`)",
      "CREATE UNIQUE INDEX `idx_email_pbc_demo_users` ON `users` (`email`) WHERE `email` != ''",
    ],
  },
  {
    id: "pbc_demo_posts", name: "posts", type: "base", system: false,
    // public to read, superuser to write: the API preview in the panel then works for an anonymous visitor
    listRule: "", viewRule: "", createRule: null, updateRule: null, deleteRule: null,
    fields: [
      idField,
      { autogeneratePattern: "", hidden: false, id: "text_posts_title", max: 0, min: 0, name: "title", pattern: "", presentable: true, primaryKey: false, required: true, system: false, type: "text" },
      { convertURLs: false, hidden: false, id: "editor_posts_description", maxSize: 0, name: "description", presentable: false, required: false, system: false, type: "editor" },
      { hidden: false, id: "bool_posts_active", name: "active", presentable: false, required: false, system: false, type: "bool" },
      { hidden: false, id: "select_posts_options", maxSelect: 3, name: "options", presentable: false, required: false, system: false, type: "select", values: ["optionA", "optionB", "optionC"] },
      { hidden: false, id: "file_posts_images", maxSelect: 5, maxSize: 0, mimeTypes: ["image/jpeg", "image/png", "image/svg+xml", "image/gif", "image/webp"], name: "featuredImages", presentable: false, protected: false, required: false, system: false, thumbs: ["100x100"], type: "file" },
      created, updated,
    ],
    indexes: [],
  },
  {
    id: "pbc_demo_messages", name: "messages", type: "base", system: false,
    listRule: "", viewRule: "", createRule: "@request.auth.id != ''", updateRule: "user = @request.auth.id", deleteRule: "user = @request.auth.id",
    fields: [
      idField,
      { autogeneratePattern: "", hidden: false, id: "text_messages_message", max: 0, min: 0, name: "message", pattern: "", presentable: true, primaryKey: false, required: true, system: false, type: "text" },
      { cascadeDelete: true, collectionId: "pbc_demo_users", hidden: false, id: "relation_messages_user", maxSelect: 1, minSelect: 0, name: "user", presentable: false, required: false, system: false, type: "relation" },
      created, updated,
    ],
    indexes: [],
  },
  {
    id: "pbc_demo_report", name: "messagesReport", type: "view", system: false,
    listRule: "", viewRule: "", createRule: null, updateRule: null, deleteRule: null,
    fields: [], indexes: [],
    viewQuery: "SELECT users.id as id, users.name as name, count(messages.id) as totalMessages FROM users LEFT JOIN messages ON messages.user = users.id GROUP BY users.id",
  },
];

// ---- the records ------------------------------------------------------------------------------------------------

const USERS = [
  { id: "demo000000user1", email: USER.email, name: "Test user", verified: true, emailVisibility: true, password: USER.password },
  { id: "demo000000user2", email: "another@example.com", name: "Another user", verified: true, emailVisibility: false, password: "1234567890" },
];

const POSTS = [
  { id: "demo000000post1", title: "Another example", description: "", active: false, options: [] },
  { id: "demo000000post2", title: "Example title", description: "<p>An editor field keeps HTML.</p>", active: false, options: ["optionA", "optionC"] },
  { id: "demo000000post3", title: "Lorem ipsum dolor sit amet", description: "<p>Everything here is restored every hour.</p>", active: true, options: ["optionB"] },
];

const MESSAGES = [
  { id: "demo0000000msg1", message: "Hello from the demo", user: "demo000000user1" },
  { id: "demo0000000msg2", message: "The database resets every hour", user: "demo000000user1" },
  { id: "demo0000000msg3", message: "Try the API preview above", user: "demo000000user2" },
];

/** The collections a visitor may not remove: the demo's own, plus voidbase's system ones. */
const DEMO_NAMES = COLLECTIONS.map((c) => c.name);

module.exports = { SUPERUSER, USER, COLLECTIONS, USERS, POSTS, MESSAGES, DEMO_NAMES };
