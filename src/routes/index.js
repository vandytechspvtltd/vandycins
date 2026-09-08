import { Router } from "express";
import auth from "./auth.js";
import users from "./users.js";
import doctors from "./doctors.js";
import appointments from "./appointments.js";
import queue from "./queue.js";
import prescriptions from "./prescriptions.js";
import medicines from "./medicines.js";
import orders from "./orders.js";
import inventory from "./inventory.js";
import deliveries from "./deliveries.js";
import payments from "./payments.js";
import notifications from "./notifications.js";
import analytics from "./analytics.js";

const router=Router();

router.use("/auth",auth);
router.use("/users",users);
router.use("/doctors",doctors);
router.use("/appointments",appointments);
router.use("/queues",queue);
router.use("/prescriptions",prescriptions);
router.use("/medicines",medicines);
router.use("/orders",orders);
router.use("/inventory",inventory);
router.use("/deliveries",deliveries);
router.use("/payments",payments);
router.use("/notifications",notifications);
router.use("/analytics",analytics);

export default router;
