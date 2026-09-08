import { Router } from "express";
import { v4 as uuid } from "uuid";
import { query } from "../db.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.get("/", async(req,res,next)=>{
  try{
    const {q=""}=req.query;
    const rows=await query(
      `SELECT u.id,u.name,u.email,u.phone,d.specialization,d.qualification,d.experience_years,
              d.registration_number,d.consultation_fee,d.bio,d.available
       FROM users u JOIN doctor_profiles d ON d.user_id=u.id
       WHERE u.role='DOCTOR' AND u.is_active=1 AND
       (u.name LIKE ? OR d.specialization LIKE ?) ORDER BY u.name`,
      [`%${q}%`,`%${q}%`]
    );
    res.json({success:true,data:rows});
  }catch(e){next(e);}
});

router.get("/:id", async(req,res,next)=>{
  try{
    const rows=await query(
      `SELECT u.id,u.name,u.email,u.phone,d.* FROM users u
       JOIN doctor_profiles d ON d.user_id=u.id WHERE u.id=?`,
      [req.params.id]
    );
    if(!rows.length)return res.status(404).json({success:false,error:"Doctor not found"});
    res.json({success:true,data:rows[0]});
  }catch(e){next(e);}
});

router.post("/",authenticate,authorize("DOCTOR","ADMIN"),async(req,res,next)=>{
  try{
    const userId=req.user.role==="DOCTOR"?req.user.sub:req.body.userId;
    if(!userId)return res.status(400).json({success:false,error:"userId is required for admin"});
    const id=uuid();
    await query(
      `INSERT INTO doctor_profiles
       (id,user_id,specialization,qualification,experience_years,registration_number,consultation_fee,bio,available)
       VALUES(?,?,?,?,?,?,?,?,?)`,
      [id,userId,req.body.specialization||null,req.body.qualification||null,
       Number(req.body.experienceYears||0),req.body.registrationNumber||null,
       Number(req.body.consultationFee||0),req.body.bio||null,req.body.available!==false]
    );
    const rows=await query("SELECT * FROM doctor_profiles WHERE id=?",[id]);
    res.status(201).json({success:true,data:rows[0]});
  }catch(e){next(e);}
});

router.patch("/:id",authenticate,authorize("DOCTOR","ADMIN"),async(req,res,next)=>{
  try{
    const doctorId=req.params.id;
    const fields=[],values=[];
    const map={
      specialization:"specialization",qualification:"qualification",
      experienceYears:"experience_years",registrationNumber:"registration_number",
      consultationFee:"consultation_fee",bio:"bio",available:"available"
    };
    for(const [bodyKey,col] of Object.entries(map)){
      if(req.body[bodyKey]!==undefined){fields.push(`${col}=?`);values.push(req.body[bodyKey]);}
    }
    if(!fields.length)return res.status(400).json({success:false,error:"No fields to update"});
    values.push(doctorId);
    await query(`UPDATE doctor_profiles SET ${fields.join(",")} WHERE id=?`,values);
    const rows=await query("SELECT * FROM doctor_profiles WHERE id=?",[doctorId]);
    res.json({success:true,data:rows[0]});
  }catch(e){next(e);}
});

router.delete("/:id",authenticate,authorize("ADMIN"),async(req,res,next)=>{
  try{await query("DELETE FROM doctor_profiles WHERE id=?",[req.params.id]);res.json({success:true});}
  catch(e){next(e);}
});

export default router;
