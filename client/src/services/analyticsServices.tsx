import axios from "@/utils/axios";
import { toast } from "react-toastify";

// Lấy các chỉ số cơ bản (totalLead, verifiedLead, unverifiedLead, conversionRate)
export const getBasicMetrics = async (flowId: string) => {
	try {
		if (!flowId) return null;

		const response = await axios.get(`/analytics/basicMetric/${flowId}`);
		return response.data;
	} catch (error: any) {
		console.error("Failed to fetch basic metrics:", error);
		toast.error("Failed to fetch dashboard metrics!");
		return null;
	}
};

// Lấy thông tin lead theo nguồn
export const getLeadBySource = async (flowId: string) => {
	try {
		if (!flowId) return null;

		const response = await axios.get(`/analytics/leadSource/${flowId}`);
		return response.data;
	} catch (error: any) {
		console.error("Failed to fetch lead sources:", error);
		toast.error("Failed to fetch lead sources data!");
		return null;
	}
};

// Lấy thông tin call analytics
export const getCallAnalytics = async (flowId: string) => {
	try {
		if (!flowId) return null;

		const response = await axios.get(`/analytics/callAnalytics/${flowId}`);
		return response.data;
	} catch (error: any) {
		console.error("Failed to fetch call analytics:", error);
		toast.error("Failed to fetch call analytics data!");
		return null;
	}
};
