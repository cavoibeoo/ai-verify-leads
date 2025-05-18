import { memo } from "react";
import BaseNode from "./BaseNode";
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
	ReportProblem,
	GridOn,
	LibraryBooks,
} from "@mui/icons-material";

export const SheetImportNode = memo(({ data, selected, id }: any) => {
	return (
		<BaseNode
			data={{
				...data,
				label: "Sheet Import",
				icon: <GridOn fontSize="small" />,
				type: "Input",
				subType: "SheetImport",
				color: "#16a34a",
			}}
			selected={selected}
			id={id}
		/>
	);
});
export const SheetExportNode = memo(({ data, selected, id }: any) => {
	return (
		<BaseNode
			data={{
				...data,
				label: "Sheet Export",
				icon: <GridOn fontSize="small" />,
				type: "Input",
				subType: "SheetExport",
				color: "#16a34a",
			}}
			selected={selected}
			id={id}
		/>
	);
});

export const FacebookLeadAdsNode = memo(({ data, selected, id }: any) => {
	// Xác định loại Facebook node
	const nodeType = id.split("_")[0];
	const isLeadAds = nodeType.toLowerCase() === "facebookleadads";

	return (
		<BaseNode
			data={{
				...data,
				label: isLeadAds ? "Facebook Lead Ads" : "Facebook Ads",
				icon: <Facebook fontSize="small" />,
				type: "Input",
				subType: isLeadAds ? "LeadAds" : "Ads",
				color: "#1877F2",
				inputs: 0,
			}}
			selected={selected}
			id={id}
		/>
	);
});

// Processing Nodes
export const AICallNode = memo(({ data, selected, id }: any) => {
	return (
		<BaseNode
			data={{
				...data,
				label: "AI Call",
				icon: <SmartToy fontSize="small" />,
				type: "Process",
				subType: "AI",
				color: "#10B981",

				outputs: 2,
			}}
			selected={selected}
			id={id}
		/>
	);
});

export const CalendarNode = memo(({ data, selected, id }: any) => {
	return (
		<BaseNode
			data={{
				...data,
				label: "Google Calendar",
				icon: <CalendarMonth fontSize="small" />,
				type: "Process",
				subType: "googleCalendar",
				color: "#4285F4",
			}}
			selected={selected}
			id={id}
		/>
	);
});

export const WebhookNode = memo(({ data, selected, id }: any) => {
	return (
		<BaseNode
			data={{
				...data,
				label: "Webhook",
				icon: <Webhook fontSize="small" />,
				type: "Process",
				subType: "API",
				color: "#8B5CF6",
			}}
			selected={selected}
			id={id}
		/>
	);
});
export const DeadLeadNode = memo(({ data, selected, id }: any) => {
	return (
		<BaseNode
			data={{
				...data,
				label: "Check Dead Lead",
				icon: <ReportProblem fontSize="small" />,
				type: "Process",
				subType: "Flow",
				color: "#ef4444",
				outputs: 2,
			}}
			selected={selected}
			id={id}
		/>
	);
});

export const ConditionNode = memo(({ data, selected, id }: any) => {
	return (
		<BaseNode
			data={{
				...data,
				label: "Condition",
				icon: <CallSplit fontSize="small" />,
				type: "Logic",
				subType: "Condition",
				color: "#F59E0B",
				outputs: 2,
			}}
			selected={selected}
			id={id}
		/>
	);
});

// Action Nodes
export const EmailNode = memo(({ data, selected, id }: any) => {
	return (
		<BaseNode
			data={{
				...data,
				label: "Send Email",
				icon: <Email fontSize="small" />,
				type: "Action",
				subType: "Email",
				color: "#EC4899",
			}}
			selected={selected}
			id={id}
		/>
	);
});

export const SMSNode = memo(({ data, selected, id }: any) => {
	return (
		<BaseNode
			data={{
				...data,
				label: "Send SMS",
				icon: <Phone fontSize="small" />,
				type: "Action",
				subType: "SMS",
				color: "#6366F1",
			}}
			selected={selected}
			id={id}
		/>
	);
});

export const ConfigNode = memo(({ data, selected, id }: any) => {
	return (
		<BaseNode
			data={{
				...data,
				label: "Configuration",
				icon: <Settings fontSize="small" />,
				type: "Settings",
				color: "#6B7280",
			}}
			selected={selected}
			id={id}
		/>
	);
});

export const ErrorNode = memo(({ data, selected, id }: any) => {
	return (
		<BaseNode
			data={{
				...data,
				label: "Error Handler",
				icon: <ErrorOutline fontSize="small" />,
				type: "Error",
				color: "#EF4444",
			}}
			selected={selected}
			id={id}
		/>
	);
});
