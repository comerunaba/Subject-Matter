const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const Database = require("better-sqlite3");

const PORT = Number(process.env.PORT || 4173);
const CRYPTO_CONFIG = {
  enabled: process.env.CRYPTO_REWARDS_ENABLED === "true",
  asset: "USDC",
  network: "solana",
  mode: "contributor_rewards",
  ledger: "internal_non_transferable_credits",
  custody: "non_custodial",
  customToken: false,
  requiresSolana: false
};
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new Database(path.join(DATA_DIR, "subject-matter.db"));
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'contributor',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL REFERENCES users(id),
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price_cents INTEGER NOT NULL DEFAULT 0,
    plan TEXT NOT NULL DEFAULT 'free',
    status TEXT NOT NULL DEFAULT 'draft',
    location TEXT NOT NULL DEFAULT 'Online',
    language TEXT NOT NULL DEFAULT 'English',
    ai_status TEXT NOT NULL DEFAULT 'not_processed',
    ai_summary TEXT,
    moderation_status TEXT NOT NULL DEFAULT 'not_submitted',
    moderation_note TEXT,
    expires_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS listings_public_idx ON listings(status, category, type, created_at);
  CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL REFERENCES listings(id),
    reporter_email TEXT,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TEXT
  );
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_id INTEGER,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER,
    details TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS review_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    model TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'reviewed',
    suggestions_json TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    listing_id INTEGER REFERENCES listings(id),
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'CAD',
    provider TEXT NOT NULL DEFAULT 'demo',
    provider_reference TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    receipt_number TEXT UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT
  );
  CREATE TABLE IF NOT EXISTS advertisements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    subject_target TEXT NOT NULL,
    category TEXT,
    language TEXT,
    broad_region TEXT,
    budget_cents INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft',
    starts_at TEXT,
    ends_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS content_references (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL UNIQUE REFERENCES listings(id) ON DELETE CASCADE,
    content_hash TEXT NOT NULL,
    reference TEXT NOT NULL,
    available_until TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS contributor_nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    capabilities TEXT NOT NULL DEFAULT '[]',
    token_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    last_seen_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TEXT
  );
  CREATE TABLE IF NOT EXISTS password_reset_tokens (token_hash TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires_at TEXT NOT NULL,used_at TEXT);
  CREATE TABLE IF NOT EXISTS email_verification_tokens (token_hash TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires_at TEXT NOT NULL,used_at TEXT);
  CREATE TABLE IF NOT EXISTS privacy_requests (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,request_type TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'open',details TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,completed_at TEXT);
  CREATE TABLE IF NOT EXISTS consent_records (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,consent_type TEXT NOT NULL,policy_version TEXT NOT NULL,granted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,withdrawn_at TEXT);
  CREATE TABLE IF NOT EXISTS breach_incidents (id INTEGER PRIMARY KEY AUTOINCREMENT,summary TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'open',detected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,assessed_at TEXT,notified_at TEXT);
`);

const seed = db.prepare("SELECT COUNT(*) AS count FROM listings").get();
if (seed.count === 0) {
  const insert = db.prepare(`INSERT INTO listings
    (owner_id,type,category,title,description,price_cents,plan,status,location,language,expires_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,datetime('now','+7 days'))`);
  const seedUser = db.prepare("INSERT OR IGNORE INTO users (email,password_hash,display_name) VALUES (?,?,?)");
  const demoHash = hashPassword("demo-only-not-for-production");
  seedUser.run("demo@subjectmatter.local", demoHash, "Anonymous contributor");
  const owner = db.prepare("SELECT id FROM users WHERE email=?").get("demo@subjectmatter.local").id;
  const rows = [
    ["Subject","Learning","A practical guide to learning a new language","A structured subject covering daily practice, useful tools, and realistic milestones for independent learners.",0,"featured","Canada","English"],
    ["Resource","Technology","Open-source tools for a small community project","A curated resource subject for teams choosing free hosting, collaboration, and communication tools.",0,"free","Online","English"],
    ["Question","Business","How should a small business compare service providers?","Questions and criteria for making a fair comparison without relying only on brand reputation.",400,"standard","Ontario","English"],
    ["Offer","Community","Local workshop: practical digital safety","An accessible subject and community announcement about safer everyday digital practices.",0,"featured","Toronto","English"]
  ];
  for (const row of rows) insert.run(owner, row[0], row[1], row[2], row[3], row[4], row[5], "published", row[6], row[7]);
}

function ensureColumn(table, column, definition) {
  const columns = db.prepare("PRAGMA table_info(" + table + ")").all();
  if (!columns.some(x => x.name === column)) db.exec("ALTER TABLE " + table + " ADD COLUMN " + column + " " + definition);
}
ensureColumn("listings","ai_status","TEXT NOT NULL DEFAULT 'not_processed'");
ensureColumn("listings","ai_summary","TEXT");
ensureColumn("listings","moderation_status","TEXT NOT NULL DEFAULT 'not_submitted'");
ensureColumn("listings","moderation_note","TEXT");
ensureColumn("users","verified_at","TEXT");
ensureColumn("reports","reviewed_at","TEXT");
ensureColumn("reports","reviewer_id","INTEGER");
ensureColumn("reports","action","TEXT");
ensureColumn("advertisements","approved_by","INTEGER");
ensureColumn("advertisements","approved_at","TEXT");
const defaultCategories = [["Learning","Questions, resources and study"],["Technology","Tools, ideas and solutions"],["Business","Offers, requests and knowledge"],["Community","Local subjects and announcements"]];
const insertCategory = db.prepare("INSERT OR IGNORE INTO categories (name,description) VALUES (?,?)");
for (const category of defaultCategories) insertCategory.run(...category);

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}
function verifyPassword(password, stored) {
  const [salt, expected] = String(stored).split(":");
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}
function newToken() { return crypto.randomBytes(32).toString("hex"); }
function tokenHash(token) { return crypto.createHash("sha256").update(token).digest("hex"); }
function validateNode(input) {
  const label = String(input.label || "").trim().slice(0,80);
  const endpoint = String(input.endpoint || "").trim().slice(0,300);
  const capabilities = Array.isArray(input.capabilities) ? input.capabilities.map(x => String(x).trim().slice(0,40)).filter(Boolean).slice(0,20) : [];
  if (!label || !endpoint) throw new Error("Node label and endpoint are required");
  if (process.env.NODE_ENV === "production" && !endpoint.startsWith("https://")) throw new Error("Production nodes must use HTTPS");
  return {label, endpoint, capabilities};
}
const rateBuckets = new Map();
function rateLimit(req,res,limit=60,windowMs=60000) {
  const key=String(req.socket.remoteAddress||"unknown")+":"+req.url.split("?")[0];const now=Date.now();const b=rateBuckets.get(key);
  if(!b||now-b.startedAt>=windowMs){rateBuckets.set(key,{startedAt:now,count:1});return true}
  b.count++;if(b.count>limit){res.setHeader("retry-after",String(Math.ceil((windowMs-(now-b.startedAt))/1000)));json(res,429,{error:"Too many requests"});return false}return true;
}
function csrfCookie(req){const c=Object.fromEntries((req.headers.cookie||"").split(";").filter(Boolean).map(x=>{const i=x.indexOf("=");return[x.slice(0,i).trim(),decodeURIComponent(x.slice(i+1).trim())]}));return c.sm_csrf||""}
function requireCsrf(req,res){
  if(["GET","HEAD","OPTIONS"].includes(req.method)||req.url.startsWith("/api/auth/")||req.url.startsWith("/api/reports"))return true;
  const c=csrfCookie(req),h=String(req.headers["x-csrf-token"]||"");
  if(!c||!h||c.length!==h.length||!crypto.timingSafeEqual(Buffer.from(c),Buffer.from(h))){json(res,403,{error:"CSRF protection failed"});return false}return true;
}
function securityHeaders() {
  return {
    "x-content-type-options":"nosniff",
    "x-frame-options":"DENY",
    "referrer-policy":"no-referrer",
    "permissions-policy":"camera=(),microphone=(),geolocation=()",
    "content-security-policy":"default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  };
}
function nowPlusDays(days) { return new Date(Date.now() + days * 86400000).toISOString(); }
function json(res, status, body, extraHeaders = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {"content-type":"application/json; charset=utf-8","cache-control":"no-store",...securityHeaders(),...extraHeaders});
  res.end(payload);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => { raw += chunk; if (raw.length > 1_000_000) req.destroy(); });
    req.on("end", () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error("Invalid JSON")); } });
    req.on("error", reject);
  });
}
function authUser(req) {
  const cookies = Object.fromEntries((req.headers.cookie || "").split(";").filter(Boolean).map(x => {
    const i = x.indexOf("="); return [x.slice(0,i).trim(), decodeURIComponent(x.slice(i+1).trim())];
  }));
  const token = cookies.sm_session;
  if (!token) return null;
  const session = db.prepare("SELECT user_id, expires_at FROM sessions WHERE token_hash=? AND expires_at > datetime('now')").get(tokenHash(token));
  if (!session) return null;
  return db.prepare("SELECT id,email,display_name,role,created_at FROM users WHERE id=?").get(session.user_id) || null;
}
function publicListing(row) {
  return {...row, price: row.price_cents ? `$${(row.price_cents/100).toFixed(2)}` : "Free", contributor: undefined};
}
function requireUser(req, res) {
  const user = authUser(req);
  if (!user) { json(res, 401, {error:"Authentication required"}); return null; }
  return user;
}
function validateListing(input) {
  const allowedTypes = ["Subject","Question","Resource","Offer","Request"];
  const allowedCategories = db.prepare("SELECT name FROM categories WHERE active=1 ORDER BY name").all().map(x => x.name);
  const type = String(input.type || "Subject");
  const category = String(input.category || "Learning");
  const title = String(input.title || "").trim();
  const description = String(input.description || "").trim();
  if (!allowedTypes.includes(type)) throw new Error("Unsupported listing type");
  if (!allowedCategories.includes(category)) throw new Error("Unsupported category");
  if (title.length < 5 || title.length > 140) throw new Error("Title must be 5–140 characters");
  if (description.length < 20 || description.length > 4000) throw new Error("Description must be 20–4000 characters");
  const plan = input.plan === "featured" ? "featured" : "free";
  return {type,category,title,description,plan,price_cents:plan==="featured"?400:0,location:String(input.location||"Online").slice(0,80),language:String(input.language||"English").slice(0,40)};
}
async function contributorModelAudit(listing, model) {
  const base = String(process.env.CONTRIBUTOR_AI_BASE_URL || "").replace(/\/$/,"");
  if (!base) return {connected:false,reason:"no_endpoint_configured"};
  const endpoint = base.endsWith("/chat/completions") ? base : base + "/chat/completions";
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(endpoint,{method:"POST",signal:controller.signal,headers:{"content-type":"application/json",...(process.env.CONTRIBUTOR_AI_API_KEY?{"authorization":"Bearer "+process.env.CONTRIBUTOR_AI_API_KEY}:{})},body:JSON.stringify({model:process.env.CONTRIBUTOR_AI_MODEL||model,messages:[{role:"system",content:"Audit subject-only marketplace content for clarity and privacy. Do not identify, profile, or analyze any person. Return brief notes only; never approve or publish."},{role:"user",content:JSON.stringify({title:listing.title,type:listing.type,category:listing.category,description:listing.description})}],temperature:0.1})});
    if(!response.ok)return {connected:false,reason:"endpoint_error"};
    const data=await response.json(); return {connected:true,provider:"contributor",model:model,notes:String(data.choices?.[0]?.message?.content||"").slice(0,2000)};
  } catch { return {connected:false,reason:"endpoint_unavailable"}; } finally { clearTimeout(timer); }
}
async function api(req, res, url) {
  const method = req.method;
  if (!rateLimit(req,res,url.pathname.startsWith("/api/auth/")?12:60) || !requireCsrf(req,res)) return;
  if (method === "GET" && url.pathname === "/api/crypto/config") return json(res,200,{crypto:CRYPTO_CONFIG});
  if (method === "GET" && url.pathname === "/api/health") return json(res,200,{ok:true,service:"subject-matter",database:"sqlite"});
  if (method === "POST" && url.pathname === "/api/auth/register") {
    const input = await readBody(req);
    const email = String(input.email||"").trim().toLowerCase();
    const password = String(input.password||"");
    const displayName = String(input.displayName||"Anonymous contributor").trim().slice(0,80) || "Anonymous contributor";
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8) return json(res,400,{error:"Use a valid email and a password of at least 8 characters"});
    try {
      const result = db.prepare("INSERT INTO users (email,password_hash,display_name) VALUES (?,?,?)").run(email,hashPassword(password),displayName);
      const verificationToken=newToken();
      db.prepare("INSERT INTO email_verification_tokens (token_hash,user_id,expires_at) VALUES (?,?,?)").run(tokenHash(verificationToken),result.lastInsertRowid,nowPlusDays(2));
      return json(res,201,{user:db.prepare("SELECT id,email,display_name,role,created_at FROM users WHERE id=?").get(result.lastInsertRowid),verificationRequired:true,developmentVerificationToken:process.env.NODE_ENV==="production"?undefined:verificationToken});
    } catch (error) {
      if (String(error.message).includes("UNIQUE")) return json(res,409,{error:"An account with that email already exists"});
      throw error;
    }
  }
  if (method === "POST" && url.pathname === "/api/auth/verify-email") {
    const input=await readBody(req);const token=String(input.token||"");const row=db.prepare("SELECT user_id FROM email_verification_tokens WHERE token_hash=? AND used_at IS NULL AND expires_at>datetime('now')").get(tokenHash(token));
    if(!row)return json(res,400,{error:"Invalid or expired verification token"});
    db.prepare("UPDATE email_verification_tokens SET used_at=CURRENT_TIMESTAMP WHERE token_hash=?").run(tokenHash(token));db.prepare("UPDATE users SET verified_at=CURRENT_TIMESTAMP WHERE id=?").run(row.user_id);return json(res,200,{ok:true});
  }
  if (method === "POST" && url.pathname === "/api/auth/request-password-reset") {
    const input=await readBody(req);const user=db.prepare("SELECT id FROM users WHERE email=? COLLATE NOCASE").get(String(input.email||"").trim());
    let developmentToken;if(user){developmentToken=newToken();db.prepare("INSERT INTO password_reset_tokens (token_hash,user_id,expires_at) VALUES (?,?,?)").run(tokenHash(developmentToken),user.id,nowPlusDays(1));}
    return json(res,200,{ok:true,developmentResetToken:process.env.NODE_ENV==="production"?undefined:developmentToken});
  }
  if (method === "POST" && url.pathname === "/api/auth/reset-password") {
    const input=await readBody(req);const token=String(input.token||"");const password=String(input.password||"");if(password.length<8)return json(res,400,{error:"Password must be at least 8 characters"});
    const row=db.prepare("SELECT user_id FROM password_reset_tokens WHERE token_hash=? AND used_at IS NULL AND expires_at>datetime('now')").get(tokenHash(token));if(!row)return json(res,400,{error:"Invalid or expired reset token"});
    db.prepare("UPDATE users SET password_hash=? WHERE id=?").run(hashPassword(password),row.user_id);db.prepare("UPDATE password_reset_tokens SET used_at=CURRENT_TIMESTAMP WHERE token_hash=?").run(tokenHash(token));db.prepare("DELETE FROM sessions WHERE user_id=?").run(row.user_id);return json(res,200,{ok:true});
  }
  if (method === "POST" && url.pathname === "/api/auth/login") {
    const input = await readBody(req);
    const user = db.prepare("SELECT * FROM users WHERE email=? COLLATE NOCASE").get(String(input.email||"").trim());
    if (!user || !verifyPassword(String(input.password||""),user.password_hash)) return json(res,401,{error:"Invalid email or password"});
    return createSession(res,user.id);
  }
  if (method === "POST" && url.pathname === "/api/auth/logout") {
    const cookies = req.headers.cookie || "";
    const token = cookies.match(/(?:^|;\s*)sm_session=([^;]+)/)?.[1];
    if (token) db.prepare("DELETE FROM sessions WHERE token_hash=?").run(tokenHash(decodeURIComponent(token)));
    return json(res,200,{ok:true},{"set-cookie":"sm_session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax"});
  }
  if (method === "GET" && url.pathname === "/api/auth/me") return json(res,200,{user:authUser(req)});
  if (method === "GET" && url.pathname === "/api/listings") {
    const q = String(url.searchParams.get("q")||"").trim();
    const category = String(url.searchParams.get("category")||"");
    const type = String(url.searchParams.get("type")||"");
    let sql = "SELECT id,type,category,title,description,price_cents,plan,status,location,language,created_at,expires_at FROM listings WHERE status='published' AND (expires_at IS NULL OR expires_at > datetime('now'))";
    const params = [];
    if (q) { sql += " AND (title LIKE ? OR description LIKE ? OR category LIKE ? OR type LIKE ?)"; params.push(`%${q}%`,`%${q}%`,`%${q}%`,`%${q}%`); }
    if (category && category !== "all") { sql += " AND category=?"; params.push(category); }
    if (type && type !== "all") { sql += " AND type=?"; params.push(type); }
    sql += " ORDER BY CASE WHEN plan='featured' THEN 0 ELSE 1 END, created_at DESC";
    return json(res,200,{listings:db.prepare(sql).all(...params).map(publicListing)});
  }
  const listingPayMatch = url.pathname.match(/^\/api\/my\/listings\/(\d+)\/pay$/);
  if (method === "POST" && listingPayMatch) {
    const user=requireUser(req,res);if(!user)return;
    const id=Number(listingPayMatch[1]);const listing=db.prepare("SELECT * FROM listings WHERE id=? AND owner_id=?").get(id,user.id);
    if(!listing)return json(res,404,{error:"Listing not found"});
    if(listing.plan!=="featured" || listing.price_cents<=0)return json(res,400,{error:"This listing does not require payment"});
    const existing=db.prepare("SELECT * FROM payments WHERE listing_id=? AND user_id=? AND status='succeeded'").get(id,user.id);
    if(existing)return json(res,200,{payment:existing,receipt:existing.receipt_number});
    const input=await readBody(req);const provider=String(input.provider||"demo").slice(0,40);
    const receipt="SM-"+new Date().toISOString().slice(0,10).replace(/-/g,"")+"-"+crypto.randomBytes(4).toString("hex").toUpperCase();
    const result=db.prepare("INSERT INTO payments (user_id,listing_id,amount_cents,currency,provider,provider_reference,status,receipt_number,completed_at) VALUES (?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)").run(user.id,id,listing.price_cents,"CAD",provider,"demo-"+crypto.randomUUID(),"succeeded",receipt);
    db.prepare("INSERT INTO audit_logs (actor_id,action,entity_type,entity_id,details) VALUES (?,?,?,?,?)").run(user.id,"payment_succeeded","listing",id,receipt);
    return json(res,201,{payment:db.prepare("SELECT * FROM payments WHERE id=?").get(result.lastInsertRowid),receipt});
  }
  if (method === "GET" && url.pathname === "/api/my/payments") {
    const user=requireUser(req,res);if(!user)return;
    return json(res,200,{payments:db.prepare("SELECT * FROM payments WHERE user_id=? ORDER BY created_at DESC").all(user.id)});
  }
  if (method === "GET" && url.pathname === "/api/my/nodes") {
    const user=requireUser(req,res);if(!user)return;
    const nodes=db.prepare("SELECT id,label,endpoint,capabilities,status,last_seen_at,created_at,revoked_at FROM contributor_nodes WHERE owner_id=? ORDER BY created_at DESC").all(user.id);
    return json(res,200,{nodes:nodes.map(node=>({...node,capabilities:JSON.parse(node.capabilities||"[]")}))});
  }
  if (method === "POST" && url.pathname === "/api/my/nodes") {
    const user=requireUser(req,res);if(!user)return;
    const data=validateNode(await readBody(req));const token=newToken();
    const result=db.prepare("INSERT INTO contributor_nodes (owner_id,label,endpoint,capabilities,token_hash,last_seen_at) VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)").run(user.id,data.label,data.endpoint,JSON.stringify(data.capabilities),tokenHash(token));
    const node=db.prepare("SELECT id,label,endpoint,capabilities,status,last_seen_at,created_at FROM contributor_nodes WHERE id=?").get(result.lastInsertRowid);
    return json(res,201,{node:{...node,capabilities:data.capabilities,token}});
  }
  const nodeHeartbeatMatch=url.pathname.match(/^\/api\/my\/nodes\/(\d+)\/heartbeat$/);
  if (method === "POST" && nodeHeartbeatMatch) {
    const user=requireUser(req,res);if(!user)return;
    const id=Number(nodeHeartbeatMatch[1]);const node=db.prepare("SELECT id,status,token_hash FROM contributor_nodes WHERE id=? AND owner_id=?").get(id,user.id);
    const supplied=String(req.headers["x-node-token"]||"");
    if(!node || node.status==="revoked" || !supplied || !crypto.timingSafeEqual(Buffer.from(node.token_hash),Buffer.from(tokenHash(supplied))))return json(res,404,{error:"Node not found"});
    db.prepare("UPDATE contributor_nodes SET status='active',last_seen_at=CURRENT_TIMESTAMP WHERE id=? AND owner_id=?").run(id,user.id);
    return json(res,200,{ok:true,node:db.prepare("SELECT id,status,last_seen_at FROM contributor_nodes WHERE id=?").get(id)});
  }
  const nodeDeleteMatch=url.pathname.match(/^\/api\/my\/nodes\/(\d+)$/);
  if (method === "DELETE" && nodeDeleteMatch) {
    const user=requireUser(req,res);if(!user)return;
    const id=Number(nodeDeleteMatch[1]);const result=db.prepare("UPDATE contributor_nodes SET status='revoked',revoked_at=CURRENT_TIMESTAMP WHERE id=? AND owner_id=? AND status<>'revoked'").run(id,user.id);
    if(!result.changes)return json(res,404,{error:"Node not found"});
    return json(res,200,{ok:true});
  }
  const contentMatch=url.pathname.match(/^\/api\/my\/listings\/(\d+)\/content-reference$/);
  if (contentMatch && (method==="POST" || method==="DELETE")) {
    const user=requireUser(req,res);if(!user)return;
    const id=Number(contentMatch[1]);if(!db.prepare("SELECT id FROM listings WHERE id=? AND owner_id=?").get(id,user.id))return json(res,404,{error:"Listing not found"});
    if(method==="DELETE"){db.prepare("DELETE FROM content_references WHERE listing_id=?").run(id);return json(res,200,{ok:true})}
    const input=await readBody(req);const contentHash=String(input.contentHash||"").toLowerCase();const reference=String(input.reference||"").trim();const availableUntil=input.availableUntil?new Date(input.availableUntil).toISOString():null;
    if(!/^[a-f0-9]{64}$/.test(contentHash)||!reference||reference.length>500)return json(res,400,{error:"Provide a valid SHA-256 hash and temporary content reference"});
    db.prepare("INSERT INTO content_references (listing_id,content_hash,reference,available_until) VALUES (?,?,?,?) ON CONFLICT(listing_id) DO UPDATE SET content_hash=excluded.content_hash,reference=excluded.reference,available_until=excluded.available_until,updated_at=CURRENT_TIMESTAMP").run(id,contentHash,reference,availableUntil);
    return json(res,201,{contentReference:{listing_id:id,content_hash:contentHash,available_until:availableUntil}});
  }
  if (method === "GET" && url.pathname === "/api/advertisements") {
    const now=new Date().toISOString();const category=String(url.searchParams.get("category")||"");
    let sql="SELECT id,name,subject_target,category,language,broad_region,status,starts_at,ends_at FROM advertisements WHERE status='approved' AND (starts_at IS NULL OR starts_at<=?) AND (ends_at IS NULL OR ends_at>=?)";
    const params=[now,now];if(category){sql+=" AND (category=? OR category IS NULL)";params.push(category)}
    return json(res,200,{advertisements:db.prepare(sql+" ORDER BY id DESC").all(...params)});
  }
  const adminAdMatch=url.pathname.match(/^\/api\/admin\/advertisements\/(\d+)$/);
  if (method === "PATCH" && adminAdMatch) {
    const user=adminUser(req,res);if(!user)return;const id=Number(adminAdMatch[1]);const input=await readBody(req);const status=input.action==="approve"?"approved":input.action==="reject"?"rejected":null;if(!status)return json(res,400,{error:"Action must be approve or reject"});db.prepare("UPDATE advertisements SET status=?,approved_by=?,approved_at=CASE WHEN ?='approved' THEN CURRENT_TIMESTAMP ELSE approved_at END,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(status,user.id,status,id);return json(res,200,{advertisement:db.prepare("SELECT * FROM advertisements WHERE id=?").get(id)});
  }
  if (method === "GET" && url.pathname === "/api/admin/advertisements") {
    const user=adminUser(req,res);if(!user)return;
    return json(res,200,{advertisements:db.prepare("SELECT * FROM advertisements ORDER BY updated_at DESC").all()});
  }
  if (method === "POST" && url.pathname === "/api/admin/advertisements") {
    const user=adminUser(req,res);if(!user)return;
    const input=await readBody(req);const name=String(input.name||"").trim().slice(0,120);const subjectTarget=String(input.subjectTarget||"").trim().slice(0,200);const category=String(input.category||"").slice(0,80)||null;const language=String(input.language||"").slice(0,40)||null;const broadRegion=String(input.broadRegion||"").slice(0,80)||null;const budget=Math.max(0,Number(input.budgetCents||0));if(!name||!subjectTarget)return json(res,400,{error:"Campaign name and subject target are required"});
    const result=db.prepare("INSERT INTO advertisements (owner_id,name,subject_target,category,language,broad_region,budget_cents,status,starts_at,ends_at) VALUES (?,?,?,?,?,?,?,'draft',?,?)").run(user.id,name,subjectTarget,category,language,broadRegion,budget,input.startsAt||null,input.endsAt||null);
    db.prepare("INSERT INTO audit_logs (actor_id,action,entity_type,entity_id,details) VALUES (?,?,?,?,?)").run(user.id,"create","advertisement",result.lastInsertRowid,name);
    return json(res,201,{advertisement:db.prepare("SELECT * FROM advertisements WHERE id=?").get(result.lastInsertRowid)});
  }
  const ownMatch = url.pathname.match(/^\/api\/my\/listings\/?(\d+)?$/);
  if (ownMatch) {
    const user = requireUser(req,res); if (!user) return;
    const id = ownMatch[1] ? Number(ownMatch[1]) : null;
    if (method === "GET" && !id) return json(res,200,{listings:db.prepare("SELECT * FROM listings WHERE owner_id=? ORDER BY updated_at DESC").all(user.id)});
    if (method === "POST" && !id) {
      const input = await readBody(req); const data = validateListing(input);
      const result = db.prepare(`INSERT INTO listings (owner_id,type,category,title,description,price_cents,plan,status,location,language,ai_status,ai_summary,moderation_status,moderation_note,expires_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(user.id,data.type,data.category,data.title,data.description,data.price_cents,data.plan,"draft",data.location,data.language,"not_processed",null,"not_submitted",null,nowPlusDays(data.plan==="featured"?14:7));
      return json(res,201,{listing:db.prepare("SELECT * FROM listings WHERE id=?").get(result.lastInsertRowid)});
    }
    const existing = db.prepare("SELECT * FROM listings WHERE id=? AND owner_id=?").get(id,user.id);
    if (!existing) return json(res,404,{error:"Listing not found"});
    if (method === "PATCH") {
      const data = validateListing(await readBody(req));
      db.prepare("UPDATE listings SET type=?,category=?,title=?,description=?,price_cents=?,plan=?,status='draft',location=?,language=?,ai_status='not_processed',ai_summary=NULL,moderation_status='not_submitted',moderation_note=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=? AND owner_id=?").run(data.type,data.category,data.title,data.description,data.price_cents,data.plan,data.location,data.language,id,user.id);
      return json(res,200,{listing:db.prepare("SELECT * FROM listings WHERE id=?").get(id)});
    }
    if (method === "DELETE") { db.prepare("UPDATE listings SET status='removed',updated_at=CURRENT_TIMESTAMP WHERE id=? AND owner_id=?").run(id,user.id); return json(res,200,{ok:true}); }
  }
  const reviewMatch = url.pathname.match(/^\/api\/my\/listings\/(\d+)\/review$/);
  if (method === "POST" && reviewMatch) {
    const user = requireUser(req,res); if (!user) return;
    const id = Number(reviewMatch[1]); const listing = db.prepare("SELECT * FROM listings WHERE id=? AND owner_id=?").get(id,user.id);
    if (!listing) return json(res,404,{error:"Listing not found"});
    const input = await readBody(req); const model = String(input.model||"").trim().slice(0,120);
    const approvedModels = ["Contributor default","OpenAI-compatible endpoint","Local open-source model"];
    if (!approvedModels.includes(model)) return json(res,400,{error:"Choose an approved audit model before review"});
    const source = JSON.stringify({title:listing.title,type:listing.type,category:listing.category,description:listing.description});
    const contentHash = crypto.createHash("sha256").update(source).digest("hex");
    const suggestions = [];
    if (listing.description.length < 80) suggestions.push({role:"Clarity",kind:"clarity",before:listing.description,after:listing.description+" — include scope, audience, and the expected outcome."});
    if (/\\b(he|she|they|person|people|someone)\\b/i.test(listing.description)) suggestions.push({role:"Subject policy",kind:"privacy",before:"Identity reference",after:"Keep the subject and remove personal identity references."});
    if (!suggestions.length) suggestions.push({role:"Safety",kind:"pass",before:"No blocking issue detected",after:"Ready for contributor decision."});
    const modelAudit = await contributorModelAudit(listing,model);
    const result = db.prepare("INSERT INTO review_snapshots (listing_id,owner_id,model,content_hash,status,suggestions_json) VALUES (?,?,?,?,?,?)").run(id,user.id,model,contentHash,"reviewed",JSON.stringify(suggestions));
    db.prepare("UPDATE listings SET ai_status='processed',ai_summary=?,moderation_status='not_submitted',status='draft',updated_at=CURRENT_TIMESTAMP WHERE id=? AND owner_id=?").run("Review snapshot "+result.lastInsertRowid+" completed; contributor decision required.",id,user.id);
    db.prepare("INSERT INTO audit_logs (actor_id,action,entity_type,entity_id,details) VALUES (?,?,?,?,?)").run(user.id,"review","listing",id,JSON.stringify({snapshotId:result.lastInsertRowid,model,contentHash,modelConnected:modelAudit.connected}));
    return json(res,200,{review:{id:result.lastInsertRowid,model,contentHash,modelConnected:modelAudit.connected,modelStatus:modelAudit.reason||"connected",aiApproved:false,suggestions}});
  }
  const processMatch = url.pathname.match(/^\/api\/my\/listings\/(\d+)\/process$/);
  if (method === "POST" && processMatch) {
    const user = requireUser(req,res); if (!user) return;
    const id = Number(processMatch[1]);
    const listing = db.prepare("SELECT * FROM listings WHERE id=? AND owner_id=?").get(id,user.id);
    if (!listing) return json(res,404,{error:"Listing not found"});
    const summary = "SM subject review completed for " + listing.title + ". Public publication will focus on the subject and omit contributor identity.";
    db.prepare("UPDATE listings SET ai_status='processed',ai_summary=?,moderation_status='not_submitted',status='draft',updated_at=CURRENT_TIMESTAMP WHERE id=? AND owner_id=?").run(summary,id,user.id);
    return json(res,200,{listing:db.prepare("SELECT * FROM listings WHERE id=?").get(id)});
  }
  const submitMatch = url.pathname.match(/^\/api\/my\/listings\/(\d+)\/submit$/);
  if (method === "POST" && submitMatch) {
    const user = requireUser(req,res); if (!user) return;
    const id=Number(submitMatch[1]);
    const listing=db.prepare("SELECT * FROM listings WHERE id=? AND owner_id=?").get(id,user.id);
    if (!listing) return json(res,404,{error:"Listing not found"});
    if (listing.ai_status !== "processed") return json(res,400,{error:"Process the listing with SM AI before submission"});
    if (listing.plan === "featured" && !db.prepare("SELECT id FROM payments WHERE listing_id=? AND user_id=? AND status='succeeded'").get(id,user.id)) return json(res,402,{error:"Successful payment is required before submitting a featured listing"});
    db.prepare("UPDATE listings SET moderation_status='pending',status='pending_review',updated_at=CURRENT_TIMESTAMP WHERE id=? AND owner_id=?").run(id,user.id);
    return json(res,200,{listing:db.prepare("SELECT * FROM listings WHERE id=?").get(id)});
  }
  if (method === "POST" && url.pathname === "/api/privacy/requests") {
    const user=requireUser(req,res);if(!user)return;const input=await readBody(req);const type=String(input.type||"access");if(!["access","delete"].includes(type))return json(res,400,{error:"Request type must be access or delete"});
    const result=db.prepare("INSERT INTO privacy_requests (user_id,request_type,details) VALUES (?,?,?)").run(user.id,type,String(input.details||"").slice(0,1000));return json(res,201,{request:db.prepare("SELECT id,request_type,status,details,created_at,completed_at FROM privacy_requests WHERE id=?").get(result.lastInsertRowid)});
  }
  if (method === "GET" && url.pathname === "/api/privacy/requests") {
    const user=requireUser(req,res);if(!user)return;return json(res,200,{requests:db.prepare("SELECT id,request_type,status,details,created_at,completed_at FROM privacy_requests WHERE user_id=? ORDER BY created_at DESC").all(user.id)});
  }
  if (method === "POST" && url.pathname === "/api/privacy/consent") {
    const user=requireUser(req,res);if(!user)return;const input=await readBody(req);const type=String(input.type||"terms").slice(0,80);const version=String(input.version||"1.0").slice(0,40);const result=db.prepare("INSERT INTO consent_records (user_id,consent_type,policy_version,withdrawn_at) VALUES (?,?,?,?)").run(user.id,type,version,input.granted===false?new Date().toISOString():null);return json(res,201,{consentId:result.lastInsertRowid});
  }
  if (method === "POST" && url.pathname === "/api/reports") {
    const input=await readBody(req);
    const listingId=Number(input.listingId);
    if (!db.prepare("SELECT id FROM listings WHERE id=? AND status='published'").get(listingId)) return json(res,404,{error:"Listing not found"});
    const result=db.prepare("INSERT INTO reports (listing_id,reporter_email,reason,details) VALUES (?,?,?,?)").run(listingId,String(input.email||"").slice(0,160),String(input.reason||"other").slice(0,80),String(input.details||"").slice(0,1000));
    return json(res,201,{report:{id:result.lastInsertRowid,status:"open"}});
  }
  if (method === "GET" && url.pathname === "/api/admin/privacy-requests") {
    const user=adminUser(req,res);if(!user)return;return json(res,200,{requests:db.prepare("SELECT id,user_id,request_type,status,details,created_at,completed_at FROM privacy_requests ORDER BY created_at").all()});
  }
  if (method === "PATCH" && url.pathname.match(/^\/api\/admin\/privacy-requests\/(\d+)$/)) {
    const user=adminUser(req,res);if(!user)return;const id=Number(url.pathname.match(/(\d+)$/)[1]);const input=await readBody(req);const status=["open","in_progress","completed","rejected"].includes(input.status)?input.status:"in_progress";db.prepare("UPDATE privacy_requests SET status=?,completed_at=CASE WHEN ?='completed' THEN CURRENT_TIMESTAMP ELSE completed_at END WHERE id=?").run(status,status,id);return json(res,200,{ok:true});
  }
  if (method === "POST" && url.pathname === "/api/admin/breaches") {
    const user=adminUser(req,res);if(!user)return;const input=await readBody(req);const summary=String(input.summary||"").trim().slice(0,1000);if(!summary)return json(res,400,{error:"Incident summary is required"});const result=db.prepare("INSERT INTO breach_incidents (summary,status,assessed_at,notified_at) VALUES (?,?,?,?)").run(summary,String(input.status||"open").slice(0,30),input.assessedAt||null,input.notifiedAt||null);return json(res,201,{incident:db.prepare("SELECT * FROM breach_incidents WHERE id=?").get(result.lastInsertRowid)});
  }
  if (method === "GET" && url.pathname === "/api/admin/breaches") {
    const user=adminUser(req,res);if(!user)return;return json(res,200,{incidents:db.prepare("SELECT * FROM breach_incidents ORDER BY detected_at DESC").all()});
  }
  function adminUser(req,res){
    const user=authUser(req);
    if(!user){json(res,401,{error:"Authentication required"});return null}
    if(!["moderator","marketplace_admin","super_admin"].includes(user.role)){json(res,403,{error:"Administrator permission required"});return null}
    return user;
  }
  if (method === "GET" && url.pathname === "/api/admin/overview") {
    const user=adminUser(req,res);if(!user)return;
    return json(res,200,{stats:{users:db.prepare("SELECT COUNT(*) count FROM users").get().count,listings:db.prepare("SELECT COUNT(*) count FROM listings").get().count,pendingModeration:db.prepare("SELECT COUNT(*) count FROM listings WHERE moderation_status='pending'").get().count,openReports:db.prepare("SELECT COUNT(*) count FROM reports WHERE status='open'").get().count},categories:db.prepare("SELECT * FROM categories ORDER BY name").all()});
  }
  if (method === "GET" && url.pathname === "/api/admin/moderation") {
    const user=adminUser(req,res);if(!user)return;
    return json(res,200,{listings:db.prepare("SELECT id,type,category,title,description,status,ai_status,moderation_status,moderation_note,created_at FROM listings WHERE moderation_status='pending' OR status='pending_review' ORDER BY created_at").all(),reports:db.prepare("SELECT * FROM reports WHERE status='open' ORDER BY created_at").all()});
  }
  const modMatch=url.pathname.match(/^\/api\/admin\/moderation\/(\d+)$/);
  if (method === "PATCH" && modMatch) {
    const user=adminUser(req,res);if(!user)return;
    const input=await readBody(req);
    const action=String(input.action||"reject");
    const id=Number(modMatch[1]);
    const next=action==="approve"?["published","approved","Approved for publication"]:action==="remove"?["removed","rejected","Removed by moderation"]:["draft","rejected","Returned for revision"];
    db.prepare("UPDATE listings SET status=?,moderation_status=?,moderation_note=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(next[0],next[1],next[2],id);
    db.prepare("INSERT INTO audit_logs (actor_id,action,entity_type,entity_id,details) VALUES (?,?,?,?,?)").run(user.id,action,"listing",id,next[2]);
    return json(res,200,{listing:db.prepare("SELECT * FROM listings WHERE id=?").get(id)});
  }
  if (method === "GET" && url.pathname === "/api/admin/categories") {
    const user=adminUser(req,res);if(!user)return;
    return json(res,200,{categories:db.prepare("SELECT * FROM categories ORDER BY name").all()});
  }
  if (method === "POST" && url.pathname === "/api/admin/categories") {
    const user=adminUser(req,res);if(!user)return;
    const input=await readBody(req);
    const name=String(input.name||"").trim().slice(0,80);
    const description=String(input.description||"").trim().slice(0,300);
    if(name.length<2)return json(res,400,{error:"Category name is required"});
    try{
      const result=db.prepare("INSERT INTO categories (name,description) VALUES (?,?)").run(name,description);
      db.prepare("INSERT INTO audit_logs (actor_id,action,entity_type,entity_id,details) VALUES (?,?,?,?,?)").run(user.id,"create","category",result.lastInsertRowid,name);
      return json(res,201,{category:db.prepare("SELECT * FROM categories WHERE id=?").get(result.lastInsertRowid)});
    }catch{return json(res,409,{error:"Category already exists"})}
  }
  const reportAdminMatch=url.pathname.match(/^\/api\/admin\/reports\/(\d+)$/);
  if (method === "PATCH" && reportAdminMatch) {
    const user=adminUser(req,res);if(!user)return;const id=Number(reportAdminMatch[1]);const input=await readBody(req);const action=["resolve","remove","keep","escalate"].includes(input.action)?input.action:"resolve";const report=db.prepare("SELECT * FROM reports WHERE id=?").get(id);if(!report)return json(res,404,{error:"Report not found"});db.prepare("UPDATE reports SET status=?,resolved_at=CURRENT_TIMESTAMP,reviewed_at=CURRENT_TIMESTAMP,reviewer_id=?,action=? WHERE id=?").run(action==="escalate"?"escalated":"resolved",user.id,action,id);if(action==="remove")db.prepare("UPDATE listings SET status='removed',moderation_status='rejected',moderation_note='Removed after safety report',updated_at=CURRENT_TIMESTAMP WHERE id=?").run(report.listing_id);return json(res,200,{ok:true});
  }
  return json(res,404,{error:"Not found"});
}
function createSession(res,userId) {
  const token = newToken();
  const csrf=newToken();
  db.prepare("INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,?)").run(tokenHash(token),userId,nowPlusDays(30));
  const user = db.prepare("SELECT id,email,display_name,role,created_at FROM users WHERE id=?").get(userId);
  const secure = process.env.SM_SECURE_COOKIES === "true" ? "; Secure" : "";
  return json(res,200,{user},{"set-cookie":[`sm_session=${encodeURIComponent(token)}; Max-Age=2592000; Path=/; HttpOnly; SameSite=Lax${secure}`,`sm_csrf=${encodeURIComponent(csrf)}; Max-Age=2592000; Path=/; SameSite=Lax${secure}`]});
}
function serveStatic(req,res) {
  let pathname = decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  if (pathname === "/") pathname = "/index.html";
  const file = path.resolve(ROOT, "." + pathname);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return json(res,404,{error:"Not found"});
  const types = {".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8"};
  res.writeHead(200,{...securityHeaders(),"content-type":types[path.extname(file)]||"application/octet-stream"});
  fs.createReadStream(file).pipe(res);
}
const server = http.createServer(async (req,res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host||"localhost"}`);
    if (url.pathname.startsWith("/api/")) await api(req,res,url); else serveStatic(req,res);
  } catch (error) { console.error(error); if (!res.headersSent) json(res,500,{error:"Server error"}); }
});
setInterval(() => db.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')").run(), 3600000).unref();
server.listen(PORT, "0.0.0.0", () => console.log(`Subject Matter running at http://0.0.0.0:${PORT}`));
