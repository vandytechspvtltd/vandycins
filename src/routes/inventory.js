import { Router } from "express";
import { v4 as uuid } from "uuid";
import { query } from "../db.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router=Router();
router.use(authenticate,authorize("PHARMACY","ADMIN"));

router.get("/",async(req,res,next)=>{
  try{
    const rows=await query("SELECT * FROM inventory_items ORDER BY updated_at DESC LIMIT 1000");
    res.json({success:true,data:rows});
  }catch(e){next(e);}
});

router.post("/",async(req,res,next)=>{
  try{
    const pharmacy=await query("SELECT id FROM pharmacy_profiles WHERE user_id=?",[req.user.role==="PHARMACY"?req.user.sub:req.body.userId]);
    const pharmacyId=req.body.pharmacyId||pharmacy[0]?.id;
    if(!pharmacyId)return res.status(400).json({success:false,error:"pharmacyId required"});
    const id=uuid();
    await query(
      `INSERT INTO inventory_items(id,pharmacy_id,medicine_name,medicine_identifier,sku,price,stock,reorder_level,expiry_date)
       VALUES(?,?,?,?,?,?,?,?,?)`,
      [id,pharmacyId,req.body.medicineName,req.body.medicineIdentifier||null,req.body.sku||null,
       Number(req.body.price||0),Number(req.body.stock||0),Number(req.body.reorderLevel||10),req.body.expiryDate||null]
    );
    const rows=await query("SELECT * FROM inventory_items WHERE id=?",[id]);
    res.status(201).json({success:true,data:rows[0]});
  }catch(e){next(e);}
});

router.patch("/:id",async(req,res,next)=>{
  try{
    const allowed={medicineName:"medicine_name",medicineIdentifier:"medicine_identifier",sku:"sku",price:"price",stock:"stock",reorderLevel:"reorder_level",expiryDate:"expiry_date"};
    const fields=[],vals=[];
    for(const [k,c] of Object.entries(allowed))if(req.body[k]!==undefined){fields.push(`${c}=?`);vals.push(req.body[k]);}
    if(!fields.length)return res.status(400).json({success:false,error:"No fields to update"});
    vals.push(req.params.id);await query(`UPDATE inventory_items SET ${fields.join(",")} WHERE id=?`,vals);
    const rows=await query("SELECT * FROM inventory_items WHERE id=?",[req.params.id]);
    res.json({success:true,data:rows[0]});
  }catch(e){next(e);}
});

router.delete("/:id",async(req,res,next)=>{
  try{await query("DELETE FROM inventory_items WHERE id=?",[req.params.id]);res.json({success:true});}
  catch(e){next(e);}
});

export default router;
