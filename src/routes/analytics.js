import { Router } from "express";
import { query } from "../db.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router=Router();
router.use(authenticate,authorize("ADMIN"));

router.get("/dashboard",async(req,res,next)=>{
  try{
    const [users,doctors,appointments,orders,revenue]=await Promise.all([
      query("SELECT COUNT(*) count FROM users"),
      query("SELECT COUNT(*) count FROM users WHERE role='DOCTOR'"),
      query("SELECT COUNT(*) count FROM appointments"),
      query("SELECT COUNT(*) count FROM orders"),
      query("SELECT COALESCE(SUM(amount),0) revenue FROM payments WHERE status='SUCCESS'")
    ]);
    res.json({success:true,data:{
      users:Number(users[0].count),doctors:Number(doctors[0].count),
      appointments:Number(appointments[0].count),orders:Number(orders[0].count),
      revenue:Number(revenue[0].revenue)
    }});
  }catch(e){next(e);}
});

router.get("/orders",async(req,res,next)=>{
  try{
    const rows=await query(`SELECT DATE(created_at) date,COUNT(*) orders,COALESCE(SUM(total),0) total
      FROM orders GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 90`);
    res.json({success:true,data:rows});
  }catch(e){next(e);}
});

router.get("/appointments",async(req,res,next)=>{
  try{
    const rows=await query(`SELECT DATE(scheduled_at) date,COUNT(*) appointments,
      SUM(status='COMPLETED') completed,SUM(status='CANCELLED') cancelled
      FROM appointments GROUP BY DATE(scheduled_at) ORDER BY date DESC LIMIT 90`);
    res.json({success:true,data:rows});
  }catch(e){next(e);}
});

export default router;
