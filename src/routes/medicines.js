import { Router } from "express";
import {
  abdmSearch, abdmBrand, abdmGeneric, abdmSupplier, abdmSubstance
} from "../services/abdm.js";

const router=Router();

router.get("/search",async(req,res,next)=>{
  try{
    const q=String(req.query.q||"").trim();
    const page=Number(req.query.page??0);
    const limit=Number(req.query.limit??10);
    if(!q)return res.status(400).json({success:false,error:"q is required"});
    if(!Number.isInteger(page)||page<0)return res.status(400).json({success:false,error:"page must be non-negative integer"});
    if(!Number.isInteger(limit)||limit<1||limit>100)return res.status(400).json({success:false,error:"limit must be 1-100"});
    const r=await abdmSearch(q,page,limit);res.status(r.status).json(r.body);
  }catch(e){next(e);}
});

router.get("/brand/:id",async(req,res,next)=>{try{const r=await abdmBrand(req.params.id);res.status(r.status).json(r.body);}catch(e){next(e);}});
router.get("/generic/:id",async(req,res,next)=>{try{const r=await abdmGeneric(req.params.id);res.status(r.status).json(r.body);}catch(e){next(e);}});
router.get("/supplier/:id",async(req,res,next)=>{
  try{
    const page=Number(req.query.page??0),limit=Number(req.query.limit??10);
    if(!Number.isInteger(page)||page<0||!Number.isInteger(limit)||limit<1||limit>100)
      return res.status(400).json({success:false,error:"Invalid pagination"});
    const r=await abdmSupplier(req.params.id,page,limit);res.status(r.status).json(r.body);
  }catch(e){next(e);}
});
router.get("/substance/:id",async(req,res,next)=>{try{const r=await abdmSubstance(req.params.id);res.status(r.status).json(r.body);}catch(e){next(e);}});

export default router;
