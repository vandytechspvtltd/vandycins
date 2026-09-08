import { Router } from "express";
import { v4 as uuid } from "uuid";
import { query } from "../db.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router=Router();
router.use(authenticate);

router.get("/",async(req,res,next)=>{
  try{
    const where=[];const vals=[];
    if(req.user.role==="DELIVERY"){where.push("d.delivery_partner_id=?");vals.push(req.user.sub);}
    if(req.query.orderId){where.push("d.order_id=?");vals.push(req.query.orderId);}
    const rows=await query(`SELECT d.*,o.patient_id,o.delivery_address FROM deliveries d
      JOIN orders o ON o.id=d.order_id ${where.length?"WHERE "+where.join(" AND "):""}
      ORDER BY d.created_at DESC LIMIT 500`,vals);
    res.json({success:true,data:rows});
  }catch(e){next(e);}
});

router.post("/",authorize("PHARMACY","ADMIN"),async(req,res,next)=>{
  try{
    const id=uuid();
    await query(
      "INSERT INTO deliveries(id,order_id,delivery_partner_id,status,estimated_at,notes) VALUES(?,?,?,'ASSIGNED',?,?)",
      [id,req.body.orderId,req.body.deliveryPartnerId||null,req.body.estimatedAt||null,req.body.notes||null]
    );
    const rows=await query("SELECT * FROM deliveries WHERE id=?",[id]);
    res.status(201).json({success:true,data:rows[0]});
  }catch(e){next(e);}
});

router.get("/:id",async(req,res,next)=>{
  try{
    const rows=await query("SELECT * FROM deliveries WHERE id=?",[req.params.id]);
    if(!rows.length)return res.status(404).json({success:false,error:"Delivery not found"});
    if(req.user.role==="DELIVERY"&&rows[0].delivery_partner_id!==req.user.sub)return res.status(403).json({success:false,error:"Forbidden"});
    res.json({success:true,data:rows[0]});
  }catch(e){next(e);}
});

router.patch("/:id/status",authorize("DELIVERY","PHARMACY","ADMIN"),async(req,res,next)=>{
  try{
    const allowed=["ASSIGNED","PICKED_UP","OUT_FOR_DELIVERY","DELIVERED","FAILED"];
    if(!allowed.includes(req.body.status))return res.status(400).json({success:false,error:"Invalid status"});
    const fields=["status=?"];const vals=[req.body.status];
    if(req.body.status==="PICKED_UP")fields.push("picked_at=NOW()");
    if(req.body.status==="DELIVERED")fields.push("delivered_at=NOW()");
    if(req.body.latitude!==undefined){fields.push("current_latitude=?");vals.push(req.body.latitude);}
    if(req.body.longitude!==undefined){fields.push("current_longitude=?");vals.push(req.body.longitude);}
    if(req.body.notes!==undefined){fields.push("notes=?");vals.push(req.body.notes);}
    vals.push(req.params.id);
    await query(`UPDATE deliveries SET ${fields.join(",")} WHERE id=?`,vals);
    const rows=await query("SELECT * FROM deliveries WHERE id=?",[req.params.id]);
    res.json({success:true,data:rows[0]});
  }catch(e){next(e);}
});

export default router;
