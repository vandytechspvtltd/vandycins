import { Router } from "express";
import { query } from "../db.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();
router.use(authenticate, authorize("ADMIN"));

router.get("/", async (req,res,next)=>{
  try {
    const rows = await query(
      "SELECT id,role,name,email,phone,avatar_url,is_active,created_at FROM users ORDER BY created_at DESC LIMIT 500"
    );
    res.json({success:true,data:rows});
  } catch(e){next(e);}
});

router.get("/:id", async (req,res,next)=>{
  try {
    const rows = await query(
      "SELECT id,role,name,email,phone,avatar_url,is_active,created_at FROM users WHERE id=?",
      [req.params.id]
    );
    if(!rows.length) return res.status(404).json({success:false,error:"User not found"});
    res.json({success:true,data:rows[0]});
  }catch(e){next(e);}
});

router.patch("/:id", async(req,res,next)=>{
  try {
    const allowed=["name","phone","avatar_url","is_active"];
    const fields=[], values=[];
    for(const k of allowed) if(req.body[k] !== undefined){fields.push(`${k}=?`);values.push(req.body[k]);}
    if(!fields.length) return res.status(400).json({success:false,error:"No fields to update"});
    values.push(req.params.id);
    await query(`UPDATE users SET ${fields.join(",")} WHERE id=?`,values);
    const rows=await query("SELECT id,role,name,email,phone,avatar_url,is_active FROM users WHERE id=?",[req.params.id]);
    res.json({success:true,data:rows[0]});
  }catch(e){next(e);}
});

router.delete("/:id", async(req,res,next)=>{
  try{await query("DELETE FROM users WHERE id=?",[req.params.id]);res.json({success:true});}
  catch(e){next(e);}
});

export default router;
