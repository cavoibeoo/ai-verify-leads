"use strict";

import ApiError from "../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import getObjectId from "../utils/getObjectId.js";
import Flow from "../models/flow.js";
import Lead from "../models/lead.js";

export const getBasicMetrics = async (flowId, userId) => {
    try {
        let leads = await Lead.find({ flowId: getObjectId(flowId), userId: getObjectId(userId) });

        let totalLead = leads.length;
        let verifiedLead = leads.filter((lead) => lead.isVerified.status === 2).length;
        let unverifiedLead = leads.filter(
            (lead) =>
                lead.isVerified.status === 1 || (lead.status == 9 && lead.isVerified.status != 2)
        ).length;
        let conversionRate = Math.round((verifiedLead / totalLead) * 10000) / 100;

        return {
            totalLead: totalLead,
            verifiedLead: verifiedLead,
            unverifiedLead: unverifiedLead,
            conversionRate: conversionRate,
        };
    } catch (error) {
        throw error;
    }
};

export const getLeadBySource = async (flowId, userId) => {
    try {
        let leads = await Lead.find({ flowId: getObjectId(flowId), userId: getObjectId(userId) });

        let leadSource = {};

        leads.forEach((lead) => {
            if (leadSource[lead.source]) {
                leadSource[lead.source] += 1;
            } else {
                leadSource[lead.source] = 1;
            }
        });

        let array = Object.entries(leadSource).map(([key, value]) => {
            return { source: key, count: value };
        });

        return array;
    } catch (error) {
        throw error;
    }
};

export const getCallAnalytics = async (flowId, userId) => {
    try {
        let flow = await Flow.findOne({ _id: getObjectId(flowId), userId: getObjectId(userId) });

        let callAnalytics = flow.callAnalytics;

        return callAnalytics;
    } catch (error) {
        throw error;
    }
};
