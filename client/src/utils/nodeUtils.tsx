import React from "react";
import {
	TableChart,
	Facebook,
	SmartToy,
	CalendarMonth,
	Webhook,
	CallSplit,
	Email,
	Phone,
	Settings,
	ErrorOutline,
	Layers,
	VerifiedUser,
	ReportProblem,
	GridOn,
	LibraryBooks,
} from "@mui/icons-material";

// Function to determine the icon for a node type
export const getNodeIcon = (key: string) => {
	switch (key) {
		case "googleSheets":
			return <TableChart fontSize="small" />;
		case "getSheetLead":
			return <GridOn fontSize="small" />;
		case "exportSheetLead":
			return <GridOn fontSize="small" />;
		case "facebookLeadAds":
			return <Facebook fontSize="small" />;
		case "aiCall":
			return <SmartToy fontSize="small" />;
		case "googleCalendar":
			return <CalendarMonth fontSize="small" />;
		case "sendWebhook":
			return <Webhook fontSize="small" />;
		case "deadLead":
			return <ReportProblem fontSize="small" />;
		case "condition":
		case "preVerify":
			return <CallSplit fontSize="small" />;
		case "email":
			return <Email fontSize="small" />;
		case "sms":
			return <Phone fontSize="small" />;
		case "config":
			return <Settings fontSize="small" />;
		case "error":
			return <ErrorOutline fontSize="small" />;
		case "verified":
			return <VerifiedUser fontSize="small" />;
		default:
			return <Layers fontSize="small" />;
	}
};

// Function to determine the color for a node type
export const getNodeColor = (key: string) => {
	switch (key) {
		case "googleSheets":
			return "#0F9D58";
		case "getSheetLead":
			return "#16a34a"; // Green
		case "exportSheetLead":
			return "#16a34a"; // Green
		case "facebookLeadAds":
			return "#1877f2";
		case "aiCall":
			return "#10b981";
		case "googleCalendar":
			return "#4285f4";
		case "sendWebhook":
			return "#8b5cf6";
		case "deadLead":
			return "#ef4444";
		case "preVerify":
			return "#f59e0b";
		default:
			return "#9E9E9E";
	}
};
