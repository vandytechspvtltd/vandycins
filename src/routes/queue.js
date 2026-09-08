import { Router } from "express";
import { v4 as uuid } from "uuid";
import { query } from "../db.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router=Router();
router.use(authenticate);

router.get("/:appointmentId",async(req,res,next)=>{
  try{
    const rows=await query(
      "SELECT q.*,a.patient_id,a.doctor_id FROM queue_entries q JOIN appointments a ON a.id=q.appointment_id WHERE q.appointment_id=?",
      [req.params.appointmentId]
    );
    if(!rows.length)return res.status(404).json({success:false,error:"Queue entry not found"});
    res.json({success:true,data:rows[0]});
  }catch(e){next(e);}
});

router.post("/:appointmentId/join",authorize("PATIENT","ADMIN"),async(req,res,next)=>{
  try{
    const existing=await query("SELECT * FROM queue_entries WHERE appointment_id=?",[req.params.appointmentId]);
    if(existing.length)return res.json({success:true,data:existing[0]});
    const max=await query("SELECT COALESCE(MAX(token_number),0)+1 token FROM queue_entries q JOIN appointments a ON a.id=q.appointment_id WHERE a.doctor_id=(SELECT doctor_id FROM appointments WHERE id=?) AND DATE(a.scheduled_at)=DATE((SELECT scheduled_at FROM appointments WHERE id=?))",[req.params.appointmentId,req.params.appointmentId]);
    const token=Number(max[0]?.token||1);
    const id=uuid();
    await query("INSERT INTO queue_entries(id,appointment_id,token_number,status) VALUES(?,?,?,'WAITING')",[id,req.params.appointmentId,token]);
    await query("UPDATE appointments SET status='WAITING',token_number=? WHERE id=?",[token,req.params.appointmentId]);
    const rows=await query("SELECT * FROM queue_entries WHERE id=?",[id]);
    res.status(201).json({success:true,data:rows[0]});
  }catch(e){next(e);}
});

router.post("/:appointmentId/call-next",authorize("DOCTOR","ADMIN"),async(req,res,next)=>{
  try{
    const rows=await query(
      `SELECT q.* FROM queue_entries q JOIN appointments a ON a.id=q.appointment_id
       WHERE a.doctor_id=? AND q.status='WAITING' ORDER BY q.token_number LIMIT 1`,
      [req.user.role==="DOCTOR"?req.user.sub:req.body.doctorId]
    );
    if(!rows.length)return res.status(404).json({success:false,error:"No waiting patient"});
    await query("UPDATE queue_entries SET status='CALLED',called_at=NOW() WHERE id=?",[rows[0].id]);
    await query("UPDATE appointments SET status='CONSULTING' WHERE id=?",[rows[0].appointment_id]);
    const updated=await query("SELECT * FROM queue_entries WHERE id=?",[rows[0].id]);
    res.json({success:true,data:updated[0]});
  }catch(e){next(e);}
});

router.post("/:appointmentId/status",authorize("DOCTOR","ADMIN"),async(req,res,next)=>{
  try{
    const allowed=["WAITING","CALLED","CONSULTING","COMPLETED","SKIPPED"];
    if(!allowed.includes(req.body.status))return res.status(400).json({success:false,error:"Invalid status"});
    await query("UPDATE queue_entries SET status=?,completed_at=IF(?='COMPLETED',NOW(),completed_at) WHERE appointment_id=?",[req.body.status,req.body.status,req.params.appointmentId]);
    const rows=await query("SELECT * FROM queue_entries WHERE appointment_id=?",[req.params.appointmentId]);
    res.json({success:true,data:rows[0]});
  }catch(e){next(e);}
});

export default router;
