"use strict";

import { StatusCodes } from "http-status-codes";
import ApiError from "../utils/ApiError.js";
import getObjectId from "../utils/getObjectId.js";
import Producer from "../config/rabbitMQ.js";
import Lead from "../models/lead.js";
import * as flowService from "./flowService.js";

export const getAllLeads = async (userId) => {
    try {
        const leads = await Lead.find({ userId: getObjectId(userId) }).sort({ updatedAt: -1 });
        return leads;
    } catch (error) {
        throw error;
    }
};

export const getLeadById = async (leadId, userId) => {
    try {
        const lead = await Lead.findOne({ _id: getObjectId(leadId), userId: getObjectId(userId) });
        if (!lead) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Lead not found.");
        }
        return lead;
    } catch (error) {
        throw error;
    }
};

export const getLeadByNodes = async (userId, flowId) => {
    try {
        const flow = await flowService.getFlow(flowId, { userId });
        const leads = await Lead.find({
            userId: getObjectId(userId),
            flowId: getObjectId(flowId),
        }).sort({ updatedAt: -1 });

        let mergeNodes = [];

        const labeledLeads = leads.map((lead) => {
            const node = flow.nodeData.nodes.find((node) => node.id === lead.nodeId);
            return { ...lead.toObject(), label: node?.data?.label };
        });

        const inProgressLeads = [];
        const qualifiedLeads = [];
        const unqualifiedLeads = [];
        const deadLeads = [];
        for (const lead of labeledLeads) {
            if (lead.status === 0) {
                deadLeads.push(lead);
                continue;
            }

            if (lead.isVerified.status == 2) qualifiedLeads.push(lead);
            else if (lead.isVerified.status == 1) unqualifiedLeads.push(lead);
            else if (lead.status == 9) unqualifiedLeads.push(lead);
            else inProgressLeads.push(lead);
        }

        mergeNodes.push(
            {
                id: "inProgressLeads",
                type: "inProgressLeads",
                label: "In Progress",
                leads: inProgressLeads,
            },
            {
                id: "qualifiedLeads",
                type: "qualifiedLeads",
                label: "Qualified Leads",
                leads: qualifiedLeads,
            },
            {
                id: "unqualifiedLeads",
                type: "unqualifiedLeads",
                label: "Unqualified Leads",
                leads: unqualifiedLeads,
            },
            {
                id: "deadLead",
                type: "deadLead",
                label: "Dead Leads",
                leads: deadLeads,
            }
        );

        return mergeNodes;
    } catch (error) {
        throw error;
    }
};

export const retryLead = async (leadId, userId) => {
    try {
        const lead = await Lead.findOne({ _id: getObjectId(leadId), userId: getObjectId(userId) });
        if (!lead) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Lead not found.");
        }

        let flow = await flowService.getFlow(lead.flowId, { userId });
        if (flow.status != 2) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Flow is not active.");
        }

        lead.status = 1; // Reset status to 1 for retry
        lead.error = {
            status: false,
            message: null,
            stackTrace: null,
            retryCount: lead?.error?.retryCount ? lead.error.retryCount++ : 0,
        };
        await lead.save();

        await publishLead(
            lead.userId,
            lead.flowId,
            lead.nodeId,
            [lead],
            lead?.previousResult,
            true
        );

        return lead;
    } catch (error) {
        throw error;
    }
};

export const publishLead = async (
    userId,
    flowId,
    nodeId,
    leads,
    result = null,
    isRetry = false
) => {
    try {
        const flow = await flowService.checkFlowExists(flowId, userId);
        if (!flow) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Flow does not exist.");
        }

        let routing = isRetry
            ? { source: nodeId, target: nodeId }
            : flow.routeData.find((route) => route.source === nodeId);

        if (routing?.isSeparate) {
            if (result === null) {
                throw new ApiError(
                    StatusCodes.BAD_REQUEST,
                    "Result is required for separate routing."
                );
            }

            routing.target = result ? routing.successTarget : routing.failTarget;

            if (!routing.target) {
                console.log(`No config target found for ${result} in node ${nodeId}`);
                routing = null;
            }
        }

        if (!routing) {
            await Promise.all(
                leads.map(async (lead) => {
                    await Lead.findOneAndUpdate(
                        { _id: lead._id, userId: getObjectId(userId) },
                        { $set: { status: 9 } },
                        { new: true }
                    );
                })
            );

            console.log("✅ Flow has been completed. Lead stop published.");
            return { message: "Flow has been completed. Lead stop published." };
        }

        const targetNode = routing.target.split("_")[0];
        const task = `tasks.${targetNode}`;
        const targetExchange = targetNode;
        const routingKey = `${userId}.${flowId}.${routing.target}`;

        await Promise.all(
            leads.map(async (lead) => {
                await Producer.publishToCelery(
                    targetExchange,
                    routingKey,
                    {
                        leadId: lead._id,
                        flowId,
                        userId,
                        nodeId,
                        targetNode: routing.target,
                    },
                    task
                );
            })
        );

        return { message: "Lead published successfully." };
    } catch (error) {
        throw error;
    }
};

export const publishByApi = async (userId, leadIds, result, isRetry) => {
    try {
        // Check if all leadIds are provided
        if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Lead IDs are required.");
        }

        // Check if all leads exist and belong to the user
        const leads = await Lead.find({
            _id: { $in: leadIds.map((id) => getObjectId(id)) },
            userId: getObjectId(userId),
        });

        // Verify all provided leadIds exist
        if (leads.length !== leadIds.length) {
            throw new ApiError(StatusCodes.NOT_FOUND, "One or more leads not found.");
        }

        // console.log("Leads found:", leads);
        return (result = await publishLead(
            userId,
            leads[0].flowId,
            leads[0].nodeId,
            leads,
            result,
            isRetry
        ));
    } catch (error) {
        throw error;
    }
};
