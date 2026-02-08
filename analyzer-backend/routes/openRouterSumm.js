import express from "express";
import {openController} from "../controllers/openRouterController.js";

const router = express.Router();

// Open router endpoint
router.post("/", openController);

export default router;