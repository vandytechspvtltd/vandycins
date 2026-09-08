import { Router } from "express";
import { v4 as uuid } from "uuid";
import { query } from "../db.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router=Router();
router.use(authenticate);

router.get("/",async(req,res,next)=>{
  try{
    const where=[];const vals=[];
    if(req.user.role==="PATIENT"){where.push("o.patient_id=?");vals.push(req.user.sub);}
    if(req.user.role==="PHARMACY"){
      where.push("o.pharmacy_id IN (SELECT id FROM pharmacy_profiles WHERE user_id=?)");vals.push(req.user.sub);
    }
    if(req.query.status){where.push("o.status=?");vals.push(req.query.status);}
    const rows=await query(`SELECT o.*,u.name patient_name FROM orders o JOIN users u ON u.id=o.patient_id
      ${where.length?"WHERE "+where.join(" AND "):""} ORDER BY o.created_at DESC LIMIT 500`,vals);
    res.json({success:true,data:rows});
  }catch(e){next(e);}
});

router.post("/",authorize("PATIENT","ADMIN"),async(req,res,next)=>{
  const conn=await (await import("../db.js")).pool.getConnection();
  try{
    await conn.beginTransaction();
    const items=req.body.items;
    if(!Array.isArray(items)||!items.length)throw Object.assign(new Error("items are required"),{status:400});
    const id=uuid();
    let subtotal=0;
    for(const item of items) subtotal += Number(item.unitPrice||0)*Number(item.quantity||0);
    const deliveryFee=Number(req.body.deliveryFee||0);
    const total=subtotal+deliveryFee;
    await conn.execute(
      `INSERT INTO orders(id,patient_id,pharmacy_id,prescription_id,delivery_address,latitude,longitude,subtotal,delivery_fee,total)
       VALUES(?,?,?,?,?,?,?,?,?,?)`,
      [id,req.user.sub,req.body.pharmacyId||null,req.body.prescriptionId||null,req.body.deliveryAddress,
       req.body.latitude||null,req.body.longitude||null,subtotal,deliveryFee,total]
    );
    for(const item of items){
      await conn.execute(
        "INSERT INTO order_items(id,order_id,inventory_item_id,medicine_name,quantity,unit_price) VALUES(?,?,?,?,?,?)",
        [uuid(),id,item.inventoryItemId||null,item.medicineName,item.quantity,item.unitPrice]
      );
    }
    await conn.commit();
    const o=await query("SELECT * FROM orders WHERE id=?",[id]);
    const oi=await query("SELECT * FROM order_items WHERE order_id=?",[id]);
    res.status(201).json({success:true,data:{...o[0],items:oi}});
  }catch(e){await conn.rollback();next(e);}finally{conn.release();}
});

router.get("/:id",async(req,res,next)=>{
  try{
    const o=await query("SELECT * FROM orders WHERE id=?",[req.params.id]);
    if(!o.length)return res.status(404).json({success:false,error:"Order not found"});
    const allowed=req.user.role==="ADMIN" || o[0].patient_id===req.user.sub;
    if(!allowed && req.user.role==="PHARMACY"){
      const p=await query("SELECT id FROM pharmacy_profiles WHERE user_id=?",[req.user.sub]);
      if(!p.length||o[0].pharmacy_id!==p[0].id)return res.status(403).json({success:false,error:"Forbidden"});
    } else if(!allowed && req.user.role!=="PHARMACY") return res.status(403).json({success:false,error:"Forbidden"});
    const items=await query("SELECT * FROM order_items WHERE order_id=?",[req.params.id]);
    res.json({success:true,data:{...o[0],items}});
  }catch(e){next(e);}
});

router.patch("/:id/status",authorize("PHARMACY","ADMIN"),async(req,res,next)=>{
  try{
    const allowed=["PLACED","CONFIRMED","PACKED","OUT_FOR_DELIVERY","DELIVERED","CANCELLED"];
    if(!allowed.includes(req.body.status))return res.status(400).json({success:false,error:"Invalid status"});
    await query("UPDATE orders SET status=? WHERE id=?",[req.body.status,req.params.id]);
    const rows=await query("SELECT * FROM orders WHERE id=?",[req.params.id]);
    res.json({success:true,data:rows[0]});
  }catch(e){next(e);}
});

export default router;
