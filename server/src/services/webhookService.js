"use strict";

import { StatusCodes } from "http-status-codes";
import ApiError from "../utils/ApiError.js";
import Producer from "../config/rabbitMQ.js";
import * as flowService from "./flowService.js";
import * as facebookService from "./facebookService.js";

import { publishLead } from "./leadService.js";
import getObjectId from "../utils/objectId.js";
import Lead from "./../models/lead.js";
import convertLeadData from "../utils/convertLeadData.js";

export const appScript = async (userId, leads, flowId, currentNode) => {
    try {
        let importedLeads = [];

        if (!(await flowService.checkFlowExists(flowId, userId))) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Flow does not exist.");
        }

        if (leads?.data?.length > 0) {
            for (const lead of leads.data) {
                const newLead = new Lead({
                    userId: getObjectId(userId),
                    flowId: getObjectId(flowId),
                    leadData: lead,
                    nodeId: currentNode || null,
                });

                await newLead.save();
                importedLeads.push(newLead);
            }
        }

        if (importedLeads.length > 0) {
            await publishLead(userId, flowId, currentNode, importedLeads);
        }

        return importedLeads.length > 0 ? "Lead imported successfully." : null;
    } catch (error) {
        throw error;
    }
};

// ----------------------------- Retrieve Facebook Lead -----------------------------

export const retrieveFaceBookLead = async (data) => {
    try {
        if (data.object !== "page") {
            return res.status(400).json({ message: "Unsupported event type" });
        }

        let result = await Promise.all((data.entry || []).map(handleEntry));

        return result;
    } catch (err) {
        throw err;
    }
};

const handleEntry = async (entry) => {
    const changes = entry.changes || [];

    for (const change of changes) {
        if (change.field === "leadgen") {
            const lead = change.value;
            console.log("✅ Received lead event:", lead);
            await processLeadEvent(lead);
        }
    }
};

const processLeadEvent = async (lead) => {
    const { leadgen_id: leadgenId } = lead;

    if (!leadgenId) {
        console.warn("⚠️ Missing leadgen_id");
        return;
    }

    try {
        let flows = await flowService.getFacebookLeadFlow(lead.page_id, lead.form_id);
        if (!flows || flows.length === 0) {
            console.warn("No flow found for the lead.");
            return;
        }

        for (const flow of flows) {
            let page = await facebookService.getPageByUserAndPageId(flow.userId, lead.page_id);

            const currentNode = flow.nodeData.nodes.find((node) => node.type === "facebookLeadAds");

            const leadData = await fetchLeadData(leadgenId, page.access_token);
            const convertedData = await convertLeadData(
                leadData?.field_data,
                lead.form_id,
                page.access_token
            );

            const email = convertedData.email?.trim().toLowerCase();
            const phone = convertedData.phone?.replace(/\D/g, "");

            const existing = await Lead.findOne({
                $or: [{ "leadData.email": email }, { "leadData.phone": phone }],
                userId: flow.userId,
            });

            let leadDoc;

            const now = new Date();

            const shouldUpdate = (existing) => {
                const status = existing?.isVerified?.status == 1 ? 1 : 0;
                const dataChanged = Object.keys(convertedData).some(
                    (key) => existing.leadData?.[key] !== convertedData[key]
                );
                return dataChanged || status === 1;
            };

            if (existing) {
                if (shouldUpdate(existing)) {
                    console.log("Updating existing lead...");
                    existing.leadData = convertedData;
                    existing.updatedAt = now;
                    existing.source = "facebook";
                    existing.nodeId = currentNode.id;
                    existing.status = 1;
                    existing.isVerified = {
                        status: 0,
                        message: "Lead updated",
                    };
                    existing.error = {
                        status: false,
                        message: "",
                        retryCount: 0,
                    };
                    await existing.save();
                    leadDoc = existing;
                } else {
                    console.warn("No new leads. Skipping...");
                    continue;
                }
            } else {
                leadDoc = new Lead({
                    userId: getObjectId(flow.userId),
                    flowId: getObjectId(flow._id),
                    leadData: convertedData,
                    nodeId: currentNode.id,
                    source: "facebook",
                });
                await leadDoc.save();
            }
            if (leadDoc) await publishLead(flow.userId, flow._id, currentNode.id, [leadDoc]);
        }
    } catch (err) {
        console.error("Error processing lead event:", err);
        return;
        // throw err;
    }
};

const fetchLeadData = async (leadgenId, pageAccessToken) => {
    const url = `https://graph.facebook.com/v18.0/${leadgenId}?access_token=${pageAccessToken}`;
    // console.log("Fetching lead data from URL:", url);
    const response = await fetch(url);

    if (!response.ok) {
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Facebook API error: ${response.statusText}`
        );
    }

    return await response.json();
};

// --------------------------------------------------------------------

export const getTranscript = async (data) => {
    let { leadId, transcript, error, message } = data;
    leadId = getObjectId(leadId);
    try {
        if (error == true || error == "true") {
            console.warn("Call lead error:", message);
            let lead = await Lead.findById(leadId);

            lead.error = {
                retryCount: lead?.error?.retryCount ? lead.error.retryCount : 0,
            };
            if (lead?.error?.retryCount < 2) {
                lead.error.retryCount += 1;
                await publishLead(lead.userId, lead.flowId, lead.nodeId, [lead], true, true);
                console.warn("Retrying lead...");
            } else {
                lead.isVerified = {
                    status: 1,
                    message: message,
                };
                await publishLead(lead.userId, lead.flowId, lead.nodeId, [lead], false);
            }
            await lead.save();
            return;
        }
        if (!leadId || !transcript) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Missing required parameters.");
        }

        let lead = await Lead.findById(getObjectId(leadId));
        if (!lead) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Lead not found.");
        }

        if (transcript) {
            lead.leadData.transcript = transcript;
            let analysisResult = await qualifyLead(lead);

            console.log("Analysis result: ", analysisResult);
            lead.isVerified.status = analysisResult.pass ? 2 : 1;
            lead.isVerified.message = analysisResult.message;
            lead.error = {
                status: analysisResult?.pass ? false : lead.error.status,
            };
            lead.markModified("leadData");
            let test = await lead.save();
        }

        await publishLead(
            lead.userId,
            lead.flowId,
            lead.nodeId,
            [lead],
            lead.isVerified.status == 2 ? 1 : 0
        );

        return lead;
    } catch (error) {
        let lead = await Lead.findOneAndUpdate(
            { _id: leadId },
            {
                $set: {
                    status: 0,
                    "error.status": true,
                    "error.message": error?.message,
                    "error.stackTrace": error?.stack,
                },
            },
            { new: true }
        );
        // if (lead) await publishLead(lead.userId, lead.flowId, lead.nodeId, [lead], true);
        throw error;
    }
};

export const qualifyLead = async (lead) => {
    try {
        console.log("Qualifying lead:...");
        if (!lead) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Missing required parameters.");
        }

        let flows = await flowService.getFacebookLeadFlow(lead.page_id, lead.form_id);
        let node = flows[0].nodeData.nodes.find((node) => node.id === lead.nodeId);
        if (!node) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Node not found.");
        }
        let response = await fetch("http://127.0.0.1:5000/analyze", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                transcript: lead.leadData.transcript,
                customerPrompt: node.data.settings.prompt,
            }),
        });
        let result = await response.json();
        // console.log("result: ", result);
        return result;
    } catch (error) {
        throw error;
    }
};
