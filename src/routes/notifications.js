import { Router } from "express";
import { v4 as uuid } from "uuid";
import { query } from "../db.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router=Router();
router.use(authenticate);

router.get("/",async(req,res,next)=>{
  try{
    const rows=await query(
      "SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 200",
      [req.user.sub]
    );
    res.json({success:true,data:rows});
  }catch(e){next(e);}
});

router.post("/",authorize("ADMIN"),async(req,res,next)=>{
  try{
    const id=uuid();
    await query(
      "INSERT INTO notifications(id,user_id,type,title,message,channel,metadata) VALUES(?,?,?,?,?,?,?)",
      [id,req.body.userId,req.body.type||"GENERAL",req.body.title,req.body.message,req.body.channel||"IN_APP",JSON.stringify(req.body.metadata||{})]
    );
    const rows=await query("SELECT * FROM notifications WHERE id=?",[id]);
    res.status(201).json({success:true,data:rows[0]});
  }catch(e){next(e);}
});

router.patch("/:id/read",async(req,res,next)=>{
  try{
    await query("UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?",[req.params.id,req.user.sub]);
    const rows=await query("SELECT * FROM notifications WHERE id=?",[req.params.id]);
    res.json({success:true,data:rows[0]});
  }catch(e){next(e);}
});

export default router;
