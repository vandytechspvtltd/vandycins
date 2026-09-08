import { Router } from "express";
import { v4 as uuid } from "uuid";
import { query } from "../db.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router=Router();
router.use(authenticate);

router.get("/",async(req,res,next)=>{
  try{
    const where=[];const vals=[];
    if(req.user.role==="PATIENT"){where.push("p.patient_id=?");vals.push(req.user.sub);}
    if(req.user.role==="DOCTOR"){where.push("p.doctor_id=?");vals.push(req.user.sub);}
    const rows=await query(`SELECT p.*,d.name doctor_name,u.name patient_name FROM prescriptions p
      JOIN users d ON d.id=p.doctor_id JOIN users u ON u.id=p.patient_id
      ${where.length?"WHERE "+where.join(" AND "):""} ORDER BY p.created_at DESC LIMIT 500`,vals);
    res.json({success:true,data:rows});
  }catch(e){next(e);}
});

router.post("/",authorize("DOCTOR","ADMIN"),async(req,res,next)=>{
  const conn=await (await import("../db.js")).pool.getConnection();
  try{
    await conn.beginTransaction();
    const id=uuid();
    const {appointmentId,patientId,diagnosis,advice,validUntil,items=[]}=req.body;
    if(!patientId || !Array.isArray(items)) throw Object.assign(new Error("patientId and items are required"),{status:400});
    await conn.execute(
      "INSERT INTO prescriptions(id,appointment_id,patient_id,doctor_id,diagnosis,advice,valid_until) VALUES(?,?,?,?,?,?,?)",
      [id,appointmentId||null,patientId,req.user.role==="DOCTOR"?req.user.sub:req.body.doctorId,diagnosis||null,advice||null,validUntil||null]
    );
    for(const item of items){
      await conn.execute(
        "INSERT INTO prescription_items(id,prescription_id,medicine_name,medicine_identifier,dosage,frequency,duration,route,instructions) VALUES(?,?,?,?,?,?,?,?,?)",
        [uuid(),id,item.medicineName,item.medicineIdentifier||null,item.dosage||null,item.frequency||null,item.duration||null,item.route||null,item.instructions||null]
      );
    }
    await conn.commit();
    const p=await query("SELECT * FROM prescriptions WHERE id=?",[id]);
    const pi=await query("SELECT * FROM prescription_items WHERE prescription_id=?",[id]);
    res.status(201).json({success:true,data:{...p[0],items:pi}});
  }catch(e){await conn.rollback();next(e);}finally{conn.release();}
});

router.get("/:id",async(req,res,next)=>{
  try{
    const p=await query("SELECT * FROM prescriptions WHERE id=?",[req.params.id]);
    if(!p.length)return res.status(404).json({success:false,error:"Prescription not found"});
    if(req.user.role!=="ADMIN" && p[0].patient_id!==req.user.sub && p[0].doctor_id!==req.user.sub)
      return res.status(403).json({success:false,error:"Forbidden"});
    const items=await query("SELECT * FROM prescription_items WHERE prescription_id=?",[req.params.id]);
    res.json({success:true,data:{...p[0],items}});
  }catch(e){next(e);}
});

router.patch("/:id",authorize("DOCTOR","ADMIN"),async(req,res,next)=>{
  try{
    const allowed=["diagnosis","advice","valid_until","status"];
    const fields=[],vals=[];
    for(const k of allowed)if(req.body[k]!==undefined){fields.push(`${k}=?`);vals.push(req.body[k]);}
    if(!fields.length)return res.status(400).json({success:false,error:"No fields to update"});
    vals.push(req.params.id);await query(`UPDATE prescriptions SET ${fields.join(",")} WHERE id=?`,vals);
    const rows=await query("SELECT * FROM prescriptions WHERE id=?",[req.params.id]);
    res.json({success:true,data:rows[0]});
  }catch(e){next(e);}
});

export default router;
