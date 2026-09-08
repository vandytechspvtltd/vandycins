import { Router } from "express";
import { v4 as uuid } from "uuid";
import { query } from "../db.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router=Router();
router.use(authenticate);

router.get("/",authorize("ADMIN"),async(req,res,next)=>{
  try{res.json({success:true,data:await query("SELECT * FROM payments ORDER BY created_at DESC LIMIT 1000")});}
  catch(e){next(e);}
});

router.post("/",async(req,res,next)=>{
  try{
    const id=uuid();
    const amount=Number(req.body.amount);
    if(!amount||amount<0)return res.status(400).json({success:false,error:"Valid amount is required"});
    await query(
      "INSERT INTO payments(id,order_id,appointment_id,user_id,provider,amount,currency,status,metadata) VALUES(?,?,?,?,?,?,?,'CREATED',?)",
      [id,req.body.orderId||null,req.body.appointmentId||null,req.user.sub,req.body.provider||null,amount,req.body.currency||"INR",JSON.stringify(req.body.metadata||{})]
    );
    const rows=await query("SELECT * FROM payments WHERE id=?",[id]);
    res.status(201).json({success:true,data:rows[0],message:"Payment record created. Connect your chosen provider to create/verify the actual transaction."});
  }catch(e){next(e);}
});

router.patch("/:id/status",authorize("ADMIN"),async(req,res,next)=>{
  try{
    const allowed=["CREATED","PENDING","SUCCESS","FAILED","REFUNDED"];
    if(!allowed.includes(req.body.status))return res.status(400).json({success:false,error:"Invalid status"});
    await query("UPDATE payments SET status=? WHERE id=?",[req.body.status,req.params.id]);
    const rows=await query("SELECT * FROM payments WHERE id=?",[req.params.id]);
    res.json({success:true,data:rows[0]});
  }catch(e){next(e);}
});

export default router;
