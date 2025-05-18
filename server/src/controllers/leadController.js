"use strict";

import { StatusCodes } from "http-status-codes";
import ApiError from "../utils/ApiError.js";
import { uploadBytesResumable } from "firebase/storage";
import * as services from "../services/leadService.js";

export const getAllLeads = async (req, res, next) => {
    try {
        let result = await services.getAllLeads(req.user.userId);
        res.status(StatusCodes.OK).json(result);
    } catch (err) {
        next(err);
    }
};

export const getLeadById = async (req, res, next) => {
    try {
        let result = await services.getLeadById(req.params.leadId, req.user.userId);
        res.status(StatusCodes.OK).json(result);
    } catch (err) {
        next(err);
    }
};

export const getLeadByNodes = async (req, res, next) => {
    try {
        let result = await services.getLeadByNodes(req.user.userId, req.params.flowId);
        res.status(StatusCodes.OK).json(result);
    } catch (err) {
        next(err);
    }
};

export const retryLead = async (req, res, next) => {
    try {
        const { leadId } = req.params;
        if (!leadId) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Lead ID is required.");
        }

        const result = await services.retryLead(leadId, req.user.userId);
        res.status(StatusCodes.OK).json(result);
    } catch (err) {
        next(err);
    }
};

export const publishLead = async (req, res, next) => {
    try {
        const { userId, leadIds, result, isRetry } = req.body;

        const finalResult = await services.publishByApi(userId, leadIds, result, isRetry);
        res.status(StatusCodes.OK).json(finalResult);
    } catch (err) {
        next(err);
    }
};
