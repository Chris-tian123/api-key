// server.js
import express8 from "express";
import mongoose2 from "mongoose";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

// routes/create.js
import express from "express";
import crypto from "node:crypto";

// models/key.js
import mongoose from "mongoose";
var usageSchema = new mongoose.Schema({
  endpoint: String,
  ip: String,
  timestamp: { type: Date, default: Date.now }
}, { _id: false });
var logSchema = new mongoose.Schema({
  status: String,
  timestamp: { type: Date, default: Date.now }
}, { _id: false });
var keySchema = new mongoose.Schema({
  key: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: Date,
  temporary: { type: Boolean, default: false },
  revoked: { type: Boolean, default: false },
  banned: { type: Boolean, default: false },
  used: { type: Boolean, default: false },
  logs: [logSchema],
  usage: [usageSchema]
});
var key_default = mongoose.model("Key", keySchema);

// utils/checkPassword.js
function checkPassword(req, res) {
  const auth = req.headers.authorization;
  const token = auth?.split(" ")[1];
  if (token !== process.env.ADMIN_PASSWORD) {
    res.status(403).json({ error: "Forbidden: Invalid Auth Password" });
    return false;
  }
  return true;
}

// routes/create.js
var createRoutes = express.Router();
createRoutes.post("/new", async (req, res) => {
  if (!checkPassword(req, res)) return;
  const { temporary = false, expiresIn } = req.body;
  if (temporary && (!expiresIn || isNaN(expiresIn))) {
    return res.status(400).json({ error: "Temporary key must have valid expiresIn (in seconds)." });
  }
  try {
    const newKey = `trenny.${crypto.randomBytes(16).toString("hex")}`;
    const keyDoc = new key_default({
      key: newKey,
      temporary,
      expiresAt: temporary ? new Date(Date.now() + expiresIn * 1e3) : null
    });
    await keyDoc.save();
    console.log(`[Key Created] ${newKey} (temp=${temporary}, expiresIn=${expiresIn || "\u221E"})`);
    res.json({ success: true, key: newKey });
  } catch (err) {
    console.error("[Create Key Error]", err);
    res.status(500).json({ error: "Failed to create API key" });
  }
});
var create_default = createRoutes;

// routes/verify.js
import express2 from "express";
var verifyRoutes = express2.Router();
verifyRoutes.get("/verify", async (req, res) => {
  const { key, endpoint } = req.query;
  if (!key) return res.status(400).json({ valid: false, error: "Missing key" });
  const found = await key_default.findOne({ key });
  if (!found || found.revoked || found.banned) {
    return res.json({ valid: false });
  }
  if (found.temporary && found.expiresAt && found.expiresAt.getTime() < Date.now()) {
    found.revoked = true;
    await found.save();
    return res.json({ valid: false });
  }
  found.usageCount = (found.usageCount || 0) + 1;
  if (!Array.isArray(found.logs)) found.logs = [];
  found.logs.push({
    ip: req.ip || req.connection.remoteAddress || "unknown",
    endpoint: endpoint || "unknown",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  await found.save();
  res.json({ valid: true });
});
var verify_default = verifyRoutes;

// routes/revoke.js
import express3 from "express";
var revokeRoutes = express3.Router();
revokeRoutes.post("/revoke", async (req, res) => {
  if (!checkPassword(req, res)) return;
  const { key } = req.body;
  if (!key) {
    return res.status(400).json({ error: "Missing API key in request body" });
  }
  try {
    const found = await key_default.findOne({ key });
    if (!found) {
      return res.status(404).json({ error: "API key not found" });
    }
    if (found.revoked) {
      return res.status(400).json({ error: "API key is already revoked" });
    }
    found.revoked = true;
    await found.save();
    res.json({ success: true, message: "API key revoked" });
  } catch (err) {
    console.error("[Revoke Error]", err);
    res.status(500).json({ error: "Failed to revoke API key" });
  }
});
var revoke_default = revokeRoutes;

// routes/ban.js
import express4 from "express";
var banRoutes = express4.Router();
banRoutes.post("/bankey", async (req, res) => {
  if (!checkPassword(req, res)) return;
  const { key } = req.body;
  if (!key) return res.status(400).json({ error: "Missing API key in request body" });
  try {
    const found = await key_default.findOne({ key });
    if (!found) return res.status(404).json({ error: "Key not found" });
    if (found.banned) return res.status(409).json({ error: "Key is already banned" });
    found.banned = true;
    await found.save();
    console.log(`[Key Banned] ${key}`);
    res.json({ success: true, message: "API key has been banned" });
  } catch (err) {
    console.error("[Ban Key Error]", err);
    res.status(500).json({ error: "Failed to ban API key" });
  }
});
var ban_default = banRoutes;

// routes/list.js
import express5 from "express";
var listRoutes = express5.Router();
listRoutes.get("/listkeys", async (req, res) => {
  if (!checkPassword(req, res)) return;
  try {
    const keys = await key_default.find().select("-__v -logs -_id");
    res.json({ success: true, total: keys.length, keys });
  } catch (err) {
    console.error("[List Keys Error]", err);
    res.status(500).json({ success: false, error: "Failed to retrieve keys" });
  }
});
var list_default = listRoutes;

// routes/stats.js
import express6 from "express";
var statsRoutes = express6.Router();
statsRoutes.get("/stats", async (req, res) => {
  const key = req.query.key || req.headers["x-api-key"];
  if (!key) {
    return res.status(400).json({ error: "Missing API key" });
  }
  try {
    const found = await key_default.findOne({ key });
    if (!found) {
      return res.status(403).json({ error: "API key not found" });
    }
    if (found.banned) {
      return res.status(403).json({ error: "Banned API key" });
    }
    if (found.revoked) {
      return res.status(403).json({ error: "Revoked API key" });
    }
    const [total, used, revoked, banned, temporary, unused] = await Promise.all([
      key_default.countDocuments(),
      key_default.countDocuments({ usageCount: { $gt: 0 } }),
      key_default.countDocuments({ revoked: true }),
      key_default.countDocuments({ banned: true }),
      key_default.countDocuments({ temporary: true }),
      key_default.countDocuments({ usageCount: { $eq: 0 } })
    ]);
    res.json({
      total,
      used,
      unused,
      revoked,
      banned,
      temporary
    });
  } catch (err) {
    console.error("[Stats Error]", err);
    res.status(500).json({ error: "Failed to retrieve stats" });
  }
});
var stats_default = statsRoutes;

// routes/logs.js
import express7 from "express";
var logsRoutes = express7.Router();
logsRoutes.get("/logs", async (req, res) => {
  const { key } = req.query;
  console.log("[GET /logs] key:", key);
  if (!key) {
    return res.status(400).json({ error: "Missing key parameter" });
  }
  try {
    const found = await key_default.findOne({ key });
    if (!found) {
      return res.status(403).json({ error: "API key not found" });
    }
    if (found.banned) {
      return res.status(403).json({ error: "Banned API key" });
    }
    const logs = (found.logs || []).slice(-100).reverse();
    res.json(logs);
  } catch (err) {
    console.error("[Logs GET Error]", err);
    res.status(500).json({ error: "Failed to retrieve logs" });
  }
});
var logs_default = logsRoutes;

// server.js
dotenv.config();
var app = express8();
app.use(express8.json());
app.set("trust proxy", 1);
mongoose2.connect(process.env.MONGODB_URI, {}).then(() => {
  console.log("MongoDB connected");
});
var limiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  max: 100
});
app.use(limiter);
app.use("/api", create_default);
app.use("/api", verify_default);
app.use("/api", revoke_default);
app.use("/api", ban_default);
app.use("/api", list_default);
app.use("/api", stats_default);
app.use("/api", logs_default);
app.get("/", (req, res) => {
  res.send("API Key Server is running.");
});
var server_default = app;

// index.js
var index_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname, search } = url;
    const newRequest = new Request(url, request);
    return new Promise((resolve) => {
      const res = {
        status: (code) => {
          res.statusCode = code;
          return res;
        },
        send: (body) => {
          resolve(new Response(body, { status: res.statusCode }));
        },
        json: (body) => {
          resolve(new Response(JSON.stringify(body), {
            status: res.statusCode,
            headers: { "Content-Type": "application/json" }
          }));
        }
      };
      server_default({
        method: newRequest.method,
        url: pathname + search,
        headers: Object.fromEntries(newRequest.headers.entries()),
        body: newRequest.body
      }, res);
    });
  }
};
export {
  index_default as default
};
