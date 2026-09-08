import { Router } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { query } from "../db.js";
import { signToken, authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, phone, password, role = "PATIENT" } = req.body;
    const allowed = ["PATIENT", "DOCTOR", "PHARMACY", "DELIVERY"];
    if (!name || !email || !password || !allowed.includes(role)) {
      return res.status(400).json({ success: false, error: "name, email, password and valid role are required" });
    }
    const existing = await query("SELECT id FROM users WHERE email=?", [email]);
    if (existing.length) return res.status(409).json({ success: false, error: "Email already registered" });

    const id = uuid();
    const hash = await bcrypt.hash(password, 12);
    await query(
      "INSERT INTO users(id,role,name,email,phone,password_hash) VALUES(?,?,?,?,?,?)",
      [id, role, name, email, phone || null, hash]
    );

    const user = { id, role, name, email };
    res.status(201).json({ success: true, data: { user, token: signToken(user) } });
  } catch (e) { next(e); }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const rows = await query(
      "SELECT id,role,name,email,phone,password_hash,is_active FROM users WHERE email=?",
      [email]
    );
    if (!rows.length || !rows[0].is_active) return res.status(401).json({ success: false, error: "Invalid credentials" });

    const user = rows[0];
    if (!(await bcrypt.compare(password || "", user.password_hash))) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const safe = { id: user.id, role: user.role, name: user.name, email: user.email };
    res.json({ success: true, data: { user: safe, token: signToken(safe) } });
  } catch (e) { next(e); }
});

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const rows = await query(
      "SELECT id,role,name,email,phone,avatar_url,is_active,created_at FROM users WHERE id=?",
      [req.user.sub]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: "User not found" });
    res.json({ success: true, data: rows[0] });
  } catch (e) { next(e); }
});

export default router;
