import React from "react";
import {
	ContentPaste,
	Facebook,
	Storage,
	Folder,
	CloudUpload,
	InsertDriveFile,
	Article,
	TableView,
	UploadFile,
} from "@mui/icons-material";

// Function to determine the icon for a lead source
export const getSourceIcon = (source: string) => {
	const sourceLower = source.toLowerCase();

	if (sourceLower.includes("facebook") || sourceLower.includes("fb")) {
		return <Facebook fontSize="small" />;
	}
	if (sourceLower.includes("getSheetLead") || sourceLower.includes("google")) {
		return <TableView fontSize="small" />;
	}
	if (
		sourceLower.includes("exportSheetLead") ||
		sourceLower.includes("sheet")
	) {
		return <InsertDriveFile fontSize="small" />;
	}
	if (sourceLower.includes("csv")) {
		return <Article fontSize="small" />;
	}
	if (sourceLower.includes("upload")) {
		return <UploadFile fontSize="small" />;
	}
	if (sourceLower.includes("database") || sourceLower.includes("db")) {
		return <Storage fontSize="small" />;
	}
	if (sourceLower.includes("form")) {
		return <ContentPaste fontSize="small" />;
	}

	// Default icon
	return <Folder fontSize="small" />;
};

// Function to determine the color for a lead source
export const getSourceColor = (source: string) => {
	const sourceLower = source.toLowerCase();

	if (sourceLower.includes("facebook") || sourceLower.includes("fb")) {
		return "#1877f2";
	}
	if (sourceLower.includes("getSheetLead") || sourceLower.includes("google")) {
		return "#0F9D58";
	}
	if (
		sourceLower.includes("exportSheetLead") ||
		sourceLower.includes("sheet")
	) {
		return "#16a34a";
	}
	if (sourceLower.includes("csv")) {
		return "#ff9800";
	}
	if (sourceLower.includes("upload")) {
		return "#673ab7";
	}
	if (sourceLower.includes("database") || sourceLower.includes("db")) {
		return "#2196f3";
	}
	if (sourceLower.includes("form")) {
		return "#e91e63";
	}

	// Default color
	return "#607d8b";
};
