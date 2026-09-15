import express from "express";

import openRouterSumm from "./openRouterSumm.js";

const router = express.Router();

router.get("/default-yo", (req, res) => {
  res.send({ message: "default is running" });
});

router.use("/summarize/website", openRouterSumm);

export default router;
//all routes here , so clear and simple