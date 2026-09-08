import app from "./app.js";
import { config } from "./config.js";
import { pool } from "./db.js";

async function start(){
  await pool.query("SELECT 1");
  app.listen(config.port,"0.0.0.0",()=>console.log(`Vandycin backend running on port ${config.port}`));
}
start().catch(err=>{
  console.error("Startup failed:",err);
  process.exit(1);
});
