"use strict";

import express from "express";
import * as controller from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/basicMetric/:flowId", controller.getBasicMetrics);
router.get("/leadSource/:flowId", controller.getLeadBySource);
router.get("/callAnalytics/:flowId", controller.getCallAnalytics);
// router.get("/overallStatus/:flowId", controller.getLeadByStatus);
export default router;
