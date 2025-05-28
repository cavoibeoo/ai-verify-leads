import { useEffect, useState } from "react";
import axios from "@/utils/axios";
import { toast } from "react-toastify";

// -----------------------------------flows-----------------------------------

export const fetchAllFlow = async () => {
	try {
		const response = await axios.get("/flow");
		return response.data;
	} catch (error: any) {
		console.log(error);
		toast.error("Failed to fetch flows!");
	}
};

export const getFlowById = async (flowId: string) => {
	try {
		const response = await axios.get(`/flow/getById/${flowId}`);
		return response.data;
	} catch (error: any) {
		console.log(error);
		toast.error("Failed to fetch flow details!");
	}
};

export const createFlow = async (flowData: any) => {
	try {
		// Map flowData to match backend expectations if needed
		const dataToSend = {
			...flowData,
			// Make sure name field is properly set if flowName is passed
			flowName: flowData.name,
		};

		const response = await axios.post("/flow/createFlow", dataToSend);
		toast.success("Successfully created flow!");
		return response.data;
	} catch (error: any) {
		console.log(error);
		toast.error(
			`${error?.response?.data?.message || "Failed to create flow!"}`
		);
		return { error };
	}
};

export const updateFlow = async (flowId: string, flowData: any) => {
	try {
		const response = await axios.put(`/flow/${flowId}`, flowData);
		toast.success("Successfully updated flow!");
		return response.data;
	} catch (error: any) {
		console.log(error);
		toast.error(
			`${error?.response?.data?.message || "Failed to update flow!"}`
		);
		return { error };
	}
};

// Flow Status Management
export const enableFlow = async (flowId: string) => {
	try {
		const response = await axios.patch(`/flow/enableFlow/${flowId}`);
		toast.success("Successfully activated flow!");
		return response.data;
	} catch (error: any) {
		console.log(error);
		toast.error(
			`${error?.response?.data?.message || "Failed to activate flow!"}`
		);
		return { error };
	}
};

export const disableFlow = async (flowId: string) => {
	try {
		const response = await axios.patch(`/flow/disableFlow/${flowId}`);
		toast.success("Successfully disabled flow!");
		return response.data;
	} catch (error: any) {
		console.log(error);
		toast.error(
			`${error?.response?.data?.message || "Failed to disable flow!"}`
		);
		return { error };
	}
};

export const toggleFlowStatus = async (
	flowId: string,
	currentStatus: number
) => {
	try {
		// Flow status: 0 = deleted, 1 = disabled, 2 = active
		if (currentStatus === 2) {
			// If active, disable it
			return await disableFlow(flowId);
		} else {
			// If disabled or any other state, enable it
			return await enableFlow(flowId);
		}
	} catch (error: any) {
		console.log(error);
		toast.error(
			`${error?.response?.data?.message || "Failed to toggle flow status!"}`
		);
		return { error };
	}
};

export const deleteFlow = async (flowId: string) => {
	try {
		const response = await axios.delete(`/flow/${flowId}`);
		toast.success("Successfully deleted flow!");
		return response.data;
	} catch (error: any) {
		console.log(error);
		toast.error(
			`${error?.response?.data?.message || "Failed to delete flow!"}`
		);
		return { error };
	}
};

export const restoreFlow = async (flowId: string) => {
	try {
		const response = await axios.patch(`/flow/restoreFlow/${flowId}`);
		toast.success("Successfully restored flow!");
		return response.data;
	} catch (error: any) {
		console.log(error);
		toast.error(
			`${error?.response?.data?.message || "Failed to restore flow!"}`
		);
		return { error };
	}
};

export const permanentDeleteFlow = async (flowId: string) => {
	try {
		const response = await axios.delete(`/flow/permanent/${flowId}`);
		toast.success("Flow permanently deleted!");
		return response.data;
	} catch (error: any) {
		console.log(error);
		toast.error(
			`${
				error?.response?.data?.message || "Failed to permanently delete flow!"
			}`
		);
		return { error };
	}
};

// Queue Management
export const resetQueue = async () => {
	try {
		const response = await axios.post("/flow/resetQueue");
		toast.success("Successfully reset queue!");
		return response.data;
	} catch (error: any) {
		console.log(error);
		toast.error(
			`${error?.response?.data?.message || "Failed to reset queue!"}`
		);
		return { error };
	}
};

// Lead Management
export const publishLead = async (leadData: any) => {
	try {
		const response = await axios.post("/flow/publishLead", leadData);
		toast.success("Successfully published lead!");
		return response.data;
	} catch (error: any) {
		console.log(error);
		toast.error(
			`${error?.response?.data?.message || "Failed to publish lead!"}`
		);
		return { error };
	}
};

export const callLead = async (leadData: any) => {
	try {
		const response = await axios.post("/flow/callLead", leadData);
		toast.success("Successfully initiated call!");
		return response.data;
	} catch (error: any) {
		console.log(error);
		toast.error(
			`${error?.response?.data?.message || "Failed to initiate call!"}`
		);
		return { error };
	}
};

// Types
export interface FlowData {
	name: string;
	nodeData?: {
		edges?: Array<{
			source: string;
			target: string;
		}>;
		nodes?: Array<{
			id: string;
			type: string;
			data?: {
				settings?: {
					page?: string;
					form?: string;
				};
			};
		}>;
	};
}

export interface LeadData {
	phoneNumber: string;
	callerId?: string;
	callerNumber: string;
	attribute: any;
	outreachType?: string;
	ExtendData?: any;
}

export const optimizePrompt = async (prompt: string) => {
	try {
		const response = await axios.post("/flow/optimizePrompt", { prompt });
		return response.data.optimizedPrompt || response.data;
	} catch (error: any) {
		console.log(error);
		toast.error(
			`${error?.response?.data?.message || "Failed to optimize prompt!"}`
		);
		return { error };
	}
};
