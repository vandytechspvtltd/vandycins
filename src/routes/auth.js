import { Router } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { query } from "../db.js";
import { signToken, authenticate } from "../middleware/auth.js";

const router = Router();

const ALLOWED_ROLES = [
  "PATIENT",
  "DOCTOR",
  "PHARMACY",
  "DELIVERY"
];

// ============================================================
// OTP STORE
// ============================================================

// Development ke liye in-memory OTP storage.
// Production me Redis / Database use karna better hai.
const otpStore = new Map();


// ============================================================
// SEND OTP
// ============================================================

router.post("/send-otp", async (req, res, next) => {
  try {
    const {
      phone,
      role = "PATIENT"
    } = req.body;

    console.log("========================================");
    console.log("SEND OTP");
    console.log("Phone:", phone);
    console.log("Role:", role);

    // --------------------------------------------------------
    // Validation
    // --------------------------------------------------------

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: "Phone number is required"
      });
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        error: "Invalid phone number"
      });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        error: "Invalid role"
      });
    }

    // --------------------------------------------------------
    // DEVELOPMENT OTP
    // --------------------------------------------------------

    const otp = "123456";

    console.log("OTP generated:", otp);

    // --------------------------------------------------------
    // Check existing user
    // --------------------------------------------------------

    const existing = await query(
      `SELECT
        id,
        role,
        name,
        email,
        phone,
        is_active
       FROM users
       WHERE phone=?`,
      [phone]
    );

    console.log(
      "Existing user:",
      existing.length > 0
    );

    // --------------------------------------------------------
    // Store OTP
    // --------------------------------------------------------

    otpStore.set(phone, {
      otp,
      role,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    console.log("OTP stored for:", phone);

    // --------------------------------------------------------
    // Response
    // --------------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      data: {
        message: "OTP sent successfully"
      }
    });

  } catch (e) {
    console.error("SEND OTP ERROR:", e);
    next(e);
  }
});


// ============================================================
// LOGIN WITH PHONE + OTP
// ============================================================

router.post("/login", async (req, res, next) => {
  try {
    const {
      phone,
      otp,
      role = "PATIENT"
    } = req.body;

    console.log("========================================");
    console.log("OTP LOGIN");
    console.log("Phone:", phone);
    console.log("OTP:", otp);
    console.log("Role:", role);

    // --------------------------------------------------------
    // Validation
    // --------------------------------------------------------

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        error: "Phone and OTP are required"
      });
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        error: "Invalid phone number"
      });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        error: "Invalid role"
      });
    }

    // --------------------------------------------------------
    // Find OTP
    // --------------------------------------------------------

    const storedOtp = otpStore.get(phone);

    if (!storedOtp) {
      console.log("OTP not found for:", phone);

      return res.status(401).json({
        success: false,
        error: "OTP not found or expired"
      });
    }

    // --------------------------------------------------------
    // Check expiry
    // --------------------------------------------------------

    if (Date.now() > storedOtp.expiresAt) {
      console.log("OTP expired for:", phone);

      otpStore.delete(phone);

      return res.status(401).json({
        success: false,
        error: "OTP expired"
      });
    }

    // --------------------------------------------------------
    // Check OTP
    // --------------------------------------------------------

    if (storedOtp.otp !== String(otp)) {
      console.log("Invalid OTP for:", phone);

      return res.status(401).json({
        success: false,
        error: "Invalid OTP"
      });
    }

    console.log("OTP verified successfully");

    // OTP successfully used
    otpStore.delete(phone);

    // --------------------------------------------------------
    // Find existing user
    // --------------------------------------------------------

    const rows = await query(
      `SELECT
        id,
        role,
        name,
        email,
        phone,
        is_active
       FROM users
       WHERE phone=?`,
      [phone]
    );

    let user;

    // ========================================================
    // EXISTING USER
    // ========================================================

    if (rows.length > 0) {

      user = rows[0];

      console.log(
        "Existing user found:",
        user.id
      );

      // ------------------------------------------------------
      // Check account status
      // ------------------------------------------------------

      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          error: "Account is inactive"
        });
      }

      // ------------------------------------------------------
      // Check role
      // ------------------------------------------------------

      if (user.role !== role) {
        return res.status(403).json({
          success: false,
          error: "Role does not match this account"
        });
      }

    }

    // ========================================================
    // NEW USER
    // ========================================================

    else {

      console.log("New user - creating account");

      const id = uuid();

      // ------------------------------------------------------
      // Temporary user details
      // ------------------------------------------------------
      // Abhi signup nahi hua hai.
      //
      // DB me name, email aur password_hash required hain.
      // Isliye temporary values create kar rahe hain.
      //
      // Baad me signup/profile completion ke time actual
      // name/email/password se update kiya ja sakta hai.
      // ------------------------------------------------------

      const defaultName =
        `User ${phone.slice(-4)}`;

      const defaultEmail =
        `${phone}@vandycins.local`;

      // Password OTP login me use nahi hota.
      // Lekin DB me password_hash NOT NULL hai,
      // isliye ek random valid bcrypt hash create kar rahe hain.
      const temporaryPasswordHash =
        await bcrypt.hash(uuid(), 10);

      console.log(
        "Default name:",
        defaultName
      );

      console.log(
        "Temporary email:",
        defaultEmail
      );

      console.log(
        "Temporary password hash generated"
      );

      // ------------------------------------------------------
      // Create user
      // ------------------------------------------------------

      await query(
        `INSERT INTO users
        (
          id,
          role,
          name,
          email,
          phone,
          password_hash
        )
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id,
          role,
          defaultName,
          defaultEmail,
          phone,
          temporaryPasswordHash
        ]
      );

      console.log(
        "New user created:",
        id
      );

      // ------------------------------------------------------
      // Fetch created user
      // ------------------------------------------------------

      const newRows = await query(
        `SELECT
          id,
          role,
          name,
          email,
          phone,
          is_active
         FROM users
         WHERE id=?`,
        [id]
      );

      if (!newRows.length) {
        return res.status(500).json({
          success: false,
          error: "User creation failed"
        });
      }

      user = newRows[0];

      console.log(
        "Created user:",
        user
      );
    }

    // ========================================================
    // SAFE USER OBJECT
    // ========================================================

    const safeUser = {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone
    };

    // ========================================================
    // JWT
    // ========================================================

    const token = signToken(safeUser);

    console.log("========================================");
    console.log("LOGIN SUCCESS");
    console.log("User:", safeUser);
    console.log("========================================");

    // --------------------------------------------------------
    // Response
    // --------------------------------------------------------

    return res.status(200).json({
      success: true,
      data: {
        user: safeUser,
        token
      }
    });

  } catch (e) {

    console.error("========================================");
    console.error("OTP LOGIN ERROR");
    console.error(e);
    console.error("========================================");

    next(e);
  }
});


// ============================================================
// REGISTER / SIGNUP
// ============================================================

router.post("/register", async (req, res, next) => {
  try {

    const {
      name,
      email,
      phone,
      password,
      role = "PATIENT"
    } = req.body;

    // --------------------------------------------------------
    // Validation
    // --------------------------------------------------------

    if (
      !name ||
      !email ||
      !password ||
      !ALLOWED_ROLES.includes(role)
    ) {
      return res.status(400).json({
        success: false,
        error:
          "name, email, password and valid role are required"
      });
    }

    // --------------------------------------------------------
    // Check existing email
    // --------------------------------------------------------

    const existing = await query(
      "SELECT id FROM users WHERE email=?",
      [email]
    );

    if (existing.length) {
      return res.status(409).json({
        success: false,
        error: "Email already registered"
      });
    }

    // --------------------------------------------------------
    // Create user
    // --------------------------------------------------------

    const id = uuid();

    const hash = await bcrypt.hash(
      password,
      12
    );

    await query(
      `INSERT INTO users
      (
        id,
        role,
        name,
        email,
        phone,
        password_hash
      )
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        role,
        name,
        email,
        phone || null,
        hash
      ]
    );

    // --------------------------------------------------------
    // User object
    // --------------------------------------------------------

    const user = {
      id,
      role,
      name,
      email,
      phone: phone || null
    };

    // --------------------------------------------------------
    // Response
    // --------------------------------------------------------

    return res.status(201).json({
      success: true,
      data: {
        user,
        token: signToken(user)
      }
    });

  } catch (e) {

    console.error(
      "REGISTER ERROR:",
      e
    );

    next(e);
  }
});


// ============================================================
// CURRENT USER
// ============================================================

router.get("/me", authenticate, async (req, res, next) => {
  try {

    const rows = await query(
      `SELECT
        id,
        role,
        name,
        email,
        phone,
        avatar_url,
        is_active,
        created_at
       FROM users
       WHERE id=?`,
      [req.user.sub]
    );

    // --------------------------------------------------------
    // User not found
    // --------------------------------------------------------

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // --------------------------------------------------------
    // Response
    // --------------------------------------------------------

    return res.status(200).json({
      success: true,
      data: rows[0]
    });

  } catch (e) {

    console.error(
      "GET CURRENT USER ERROR:",
      e
    );

    next(e);
  }
});


export default router;