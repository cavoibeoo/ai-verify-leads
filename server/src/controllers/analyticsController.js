import { StatusCodes } from "http-status-codes";
import ApiError from "../utils/ApiError.js";
import * as services from "../services/analyticsService.js";

export const getBasicMetrics = async (req, res, next) => {
    try {
        let userId = req?.user?.userId;
        let flowId = req?.params?.flowId;
        const result = await services.getBasicMetrics(flowId, userId);
        res.status(StatusCodes.OK).send(result);
    } catch (err) {
        next(err);
    }
};

export const getLeadBySource = async (req, res, next) => {
    try {
        let userId = req?.user?.userId;
        let flowId = req?.params?.flowId;
        const result = await services.getLeadBySource(flowId, userId);
        res.status(StatusCodes.OK).send(result);
    } catch (err) {
        next(err);
    }
};

export const getCallAnalytics = async (req, res, next) => {
    try {
        let userId = req?.user?.userId;
        let flowId = req?.params?.flowId;
        const result = await services.getCallAnalytics(flowId, userId);
        res.status(StatusCodes.OK).send(result);
    } catch (err) {
        next(err);
    }
};
