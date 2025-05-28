"use strict";

import ApiError from "../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import getObjectId from "../utils/getObjectId.js";
import Producer from "../config/rabbitMQ.js";
import Flow from "../models/flow.js";
import config from "../config/environment.js";

export const checkFlowExists = async (flowId, userId) => {
    try {
        let flowExists = await Flow.findOne({
            _id: getObjectId(flowId),
            userId: getObjectId(userId),
            status: { $ne: 0 },
        });
        return flowExists ? flowExists : false;
    } catch (error) {
        throw error;
    }
};

export const getFlows = async (user) => {
    try {
        let flows = await Flow.find({ userId: user.userId });
        return flows ? flows : null;
    } catch (error) {
        throw error;
    }
};

export const getFlow = async (flowId, user) => {
    try {
        let flow = await Flow.findOne({
            _id: getObjectId(flowId),
            userId: user.userId,
        });
        return flow ? flow : null;
    } catch (error) {
        throw error;
    }
};

export const createFlow = async (data, user) => {
    try {
        let { flowName, nodeData } = data;

        //Check if flow name already exists
        let flowExists = await Flow.findOne({
            name: flowName,
            userId: user.userId,
            status: { $ne: 0 },
        });
        if (flowExists) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Flow name already exists");
        }

        let routeData = [];
        nodeData?.edges?.forEach((edge) => {
            const { source, target, data } = edge;

            if (data?.label) {
                let existing = routeData.find((r) => r.source === source);

                if (!existing) {
                    existing = { isSeparate: true, source, successTarget: null, failTarget: null };
                    routeData.push(existing);
                }

                if (data.label === "success") {
                    existing.successTarget = target;
                } else {
                    existing.failTarget = target;
                }
            } else {
                // No label, push normally
                routeData.push({ isSeparate: false, source, target });
            }
        });

        let flow = new Flow({
            name: flowName,
            routeData,
            nodeData,
            userId: getObjectId(user.userId),
        });

        let result = await flow.save();

        //Create queue for each nodes in RabbitMQ
        // await nodeData?.nodes?.forEach((node) => {
        //     Producer.createExchange(node?.type);
        //     Producer.createQueue(
        //         `${user.userId}.${flow._id}.${node.id}`,
        //         node?.type,
        //         `${user.userId}.${flow._id}.${node.id}`
        //     );
        // });

        return result ? result : null;
    } catch (error) {
        throw error;
    }
};

export const updateFlow = async (flowId, data, user) => {
    try {
        let { flowName, nodeData } = data;

        let flow = await Flow.findOne({
            _id: getObjectId(flowId),
            userId: user.userId,
        });
        if (!flow) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Flow not found");
        }

        let oldNodeData = flow.nodeData != nodeData ? flow.nodeData : null;

        flow.name = flowName || flow.name;
        flow.nodeData = nodeData || flow.nodeData;
        let routeData = [];
        nodeData?.edges?.forEach((edge) => {
            const { source, target, data } = edge;

            if (data?.label) {
                let existing = routeData.find((r) => r.source === source);

                if (!existing) {
                    existing = { isSeparate: true, source, successTarget: null, failTarget: null };
                    routeData.push(existing);
                }

                if (data.label === "success") {
                    existing.successTarget = target;
                } else {
                    existing.failTarget = target;
                }
            } else {
                // No label, push normally
                routeData.push({ isSeparate: false, source, target });
            }
        });
        flow.routeData = routeData || flow.routeData;
        let result = await flow.save();

        if (oldNodeData && flow.status == 2) {
            //Delete old queue
            oldNodeData?.nodes?.forEach(async (node) => {
                await Producer.deleteQueue(`${user.userId}.${flow._id}.${node.id}`, node?.type);
            });

            //Create new queue for each nodes in RabbitMQ
            flow.nodeData?.nodes?.forEach(async (node) => {
                await Producer.createExchange(node?.type);
                await Producer.createQueue(
                    `${user.userId}.${flow._id}.${node.id}`,
                    node?.type,
                    `${user.userId}.${flow._id}.${node.id}`
                );
            });
        }

        return result ? result : null;
    } catch (error) {
        throw error;
    }
};

export const updateStatus = async (flowId, status, user) => {
    try {
        let flow = await Flow.findOne({
            _id: getObjectId(flowId),
            userId: user.userId,
        });
        if (!flow) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Flow not found");
        }

        let errMsg = "";
        if (status == flow.status) {
            switch (status) {
                case 0:
                    errMsg = "Flow is already deleted";
                    break;
                case 1:
                    errMsg = "Flow is already disabled";
                    break;
                case 2:
                    errMsg = "Flow is already active";
                    break;
                default:
                    break;
            }
            throw new ApiError(StatusCodes.BAD_REQUEST, errMsg);
        }

        flow.status = status;
        flow.lastModified = new Date();

        let result = await flow.save();

        if (flow.status == 0 || flow.status == 1) {
            console.log("Deleting queue...");
            flow?.nodeData?.nodes?.forEach(async (node) => {
                await Producer.deleteQueue(`${user.userId}.${flow._id}.${node.id}`, node?.type);
            });
        } else if (flow.status == 2) {
            flow?.nodeData?.nodes?.forEach(async (node) => {
                await Producer.createExchange(node?.type);
                await Producer.createQueue(
                    `${user.userId}.${flow._id}.${node.id}`,
                    node?.type,
                    `${user.userId}.${flow._id}.${node.id}`
                );
            });
        }

        return result ? result : null;
    } catch (error) {
        throw error;
    }
};

export const permanentDeleteFlow = async (flowId, user) => {
    try {
        const flow = await Flow.findOne({
            _id: getObjectId(flowId),
            userId: user.userId,
        });

        if (!flow) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Flow not found");
        }

        flow?.nodeData?.nodes?.forEach(async (node) => {
            await Producer.deleteQueue(`${user.userId}.${flow._id}.${node.id}`, node?.type);
        });

        // Permanently remove the flow from the database
        const result = await Flow.deleteOne({ _id: getObjectId(flowId) });

        if (result.deletedCount === 0) {
            throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to delete flow");
        }

        return {
            success: true,
            message: "Flow permanently deleted",
        };
    } catch (error) {
        throw error;
    }
};

export const resetQueue = async () => {
    try {
        let flows = await Flow.find({ status: 2 });
        flows.forEach((flow) => {
            flow?.nodeData?.nodes?.forEach(async (node) => {
                await Producer.createExchange(node?.type);
                await Producer.createQueue(
                    `${flow.userId}.${flow._id}.${node.id}`,
                    node?.type,
                    `${flow.userId}.${flow._id}.${node.id}`
                );
            });
        });
        return { status: true, message: "Queue reset successfully" };
    } catch (error) {
        throw error;
    }
};

export const getFacebookLeadFlow = async (pageId, formId) => {
    try {
        const flow = await Flow.find({
            status: 2,
            "nodeData.nodes.type": "facebookLeadAds",
            "nodeData.nodes.data.settings.pageId": pageId,
            "nodeData.nodes.data.settings.formId": formId,
        });
        if (!flow) {
            console.log("Flow not found for the given pageId and formId.");
            return null;
        }
        return flow ? flow : null;
    } catch (error) {
        throw error;
    }
};

export const optimizePrompt = async (prompt) => {
    try {
        // Create the API request to OpenAI for prompt optimization
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${config.openaiApiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: `You are a business copywriting expert specializing in creating clear, 
                            comprehensive business descriptions that contain all necessary 
                            information for lead qualification. Focus on making business prompts detailed, 
                            specific, and informative without explicitly listing qualification criteria.`,
                    },
                    {
                        role: "user",
                        content: `Optimize this business prompt with more detail and clarity. 
        Include:
        - Core services/products offered
        - Target customer profile and ideal clients
        - Problems you solve and value proposition
        - Budget ranges and decision-maker types
        - What makes prospects a good fit

        CURRENT BUSINESS PROMPT:
        ${JSON.stringify(prompt)}

        Provide an enhanced business description that contains rich detail for automated qualification analysis, 
        without explicitly listing criteria. Make it comprehensive, briefly and informative. From 100 to 200 words`,
                    },
                ],
                temperature: 0.3,
                max_tokens: 600,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
            }),
        });

        const result = await response.json();
        if (result.error) {
            throw new ApiError(StatusCodes.BAD_REQUEST, result.error.message);
        }

        // Extract the optimized prompt from the response
        const optimizedPrompt = result.choices[0].message.content;
        return { optimizedPrompt: optimizedPrompt };
    } catch (error) {
        throw error;
    }
};
