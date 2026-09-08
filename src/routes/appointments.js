import { Router } from "express";
import { v4 as uuid } from "uuid";
import { query } from "../db.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router=Router();
router.use(authenticate);

router.get("/",async(req,res,next)=>{
  try{
    const where=[];const vals=[];
    if(req.user.role==="PATIENT"){where.push("a.patient_id=?");vals.push(req.user.sub);}
    if(req.user.role==="DOCTOR"){where.push("a.doctor_id=?");vals.push(req.user.sub);}
    if(req.query.status){where.push("a.status=?");vals.push(req.query.status);}
    const rows=await query(
      `SELECT a.*,p.name patient_name,d.name doctor_name
       FROM appointments a JOIN users p ON p.id=a.patient_id JOIN users d ON d.id=a.doctor_id
       ${where.length?"WHERE "+where.join(" AND "):""} ORDER BY a.scheduled_at DESC LIMIT 500`,vals
    );
    res.json({success:true,data:rows});
  }catch(e){next(e);}
});

router.post("/",authorize("PATIENT","ADMIN"),async(req,res,next)=>{
  try{
    const {doctorId,scheduledAt,type="ONLINE",reason}=req.body;
    if(!doctorId||!scheduledAt)return res.status(400).json({success:false,error:"doctorId and scheduledAt are required"});
    const id=uuid();
    await query(
      "INSERT INTO appointments(id,patient_id,doctor_id,scheduled_at,type,status,reason) VALUES(?,?,?,?,?,'BOOKED',?)",
      [id,req.user.sub,doctorId,scheduledAt,type,reason||null]
    );
    const rows=await query("SELECT * FROM appointments WHERE id=?",[id]);
    res.status(201).json({success:true,data:rows[0]});
  }catch(e){next(e);}
});

router.get("/:id",async(req,res,next)=>{
  try{
    const rows=await query("SELECT * FROM appointments WHERE id=?",[req.params.id]);
    if(!rows.length)return res.status(404).json({success:false,error:"Appointment not found"});
    const a=rows[0];
    if(req.user.role!=="ADMIN" && a.patient_id!==req.user.sub && a.doctor_id!==req.user.sub)
      return res.status(403).json({success:false,error:"Forbidden"});
    res.json({success:true,data:a});
  }catch(e){next(e);}
});

router.patch("/:id/status",authorize("PATIENT","DOCTOR","ADMIN"),async(req,res,next)=>{
  try{
    const allowed=["BOOKED","WAITING","CONSULTING","COMPLETED","CANCELLED","NO_SHOW"];
    if(!allowed.includes(req.body.status))return res.status(400).json({success:false,error:"Invalid status"});
    const rows=await query("SELECT * FROM appointments WHERE id=?",[req.params.id]);
    if(!rows.length)return res.status(404).json({success:false,error:"Appointment not found"});
    const a=rows[0];
    if(req.user.role==="PATIENT" && a.patient_id!==req.user.sub)return res.status(403).json({success:false,error:"Forbidden"});
    if(req.user.role==="DOCTOR" && a.doctor_id!==req.user.sub)return res.status(403).json({success:false,error:"Forbidden"});
    await query("UPDATE appointments SET status=? WHERE id=?",[req.body.status,req.params.id]);
    const updated=await query("SELECT * FROM appointments WHERE id=?",[req.params.id]);
    res.json({success:true,data:updated[0]});
  }catch(e){next(e);}
});

router.delete("/:id",authorize("ADMIN","PATIENT"),async(req,res,next)=>{
  try{
    if(req.user.role==="PATIENT"){
      const r=await query("SELECT patient_id FROM appointments WHERE id=?",[req.params.id]);
      if(!r.length)return res.status(404).json({success:false,error:"Appointment not found"});
      if(r[0].patient_id!==req.user.sub)return res.status(403).json({success:false,error:"Forbidden"});
    }
    await query("DELETE FROM appointments WHERE id=?",[req.params.id]);
    res.json({success:true});
  }catch(e){next(e);}
});

export default router;
