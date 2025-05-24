import React, { memo } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { Box, Paper, Typography, Stack, IconButton } from "@mui/material";
import { styled } from "@mui/material/styles";
import { lighten } from "@mui/material/styles";
import { Close as CloseIcon } from "@mui/icons-material";

type BaseNodeProps = {
	data: {
		label: string;
		icon?: React.ReactNode;
		description?: string;
		type: string;
		subType?: string;
		inputs?: number;
		outputs?: number;
		color?: string;
		webhookSubscribed?: boolean;
	};
	selected: boolean;
	id: string;
};

const NodeContainer = styled(Paper, {
	shouldForwardProp: (prop) => prop !== "selected" && prop !== "nodeColor",
})<{ selected?: boolean; nodeColor?: string }>(
	({ theme, selected, nodeColor }) => ({
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		width: "80px",
		height: "80px",
		borderRadius: "50%",
		backgroundColor: nodeColor || theme.palette.grey[300],
		position: "relative",
		cursor: "grab",
		boxShadow: selected
			? `0 0 0 3px ${theme.palette.primary.main}, ${theme.shadows[4]}`
			: theme.shadows[2],

		"&:hover": {
			boxShadow: `0 0 0 5px ${lighten(
				nodeColor || theme.palette.grey[300],
				0.3
			)}`,
		},

		"& .MuiSvgIcon-root": {
			fontSize: "38px",
			color: "white",
		},
	})
);

const NodeLabel = styled(Box)(({ theme }) => ({
	position: "absolute",
	top: "100%",
	left: "50%",
	transform: "translateX(-50%)",
	textAlign: "center",
	marginTop: "8px",
	width: "120px",
}));

const ActionLabel = styled(Typography)(({ theme }) => ({
	fontSize: "11px",
	color: theme.palette.text.secondary,
	marginTop: "2px",
}));

const StyledHandle = styled(Handle)(({ theme }) => ({
	width: "8px",
	height: "8px",
	backgroundColor: "#fff",
	border: "2px solid #778899",
	transition: "all 0.2s ease",
	zIndex: 10,

	"&:hover": {
		backgroundColor: theme.palette.primary.main,
		borderColor: theme.palette.primary.dark,
		transform: "scale(1.2)",
	},
}));

const DeleteButton = styled(IconButton)(({ theme }) => ({
	position: "absolute",
	top: "-8px",
	right: "60px",
	width: "22px",
	height: "22px",
	backgroundColor: theme.palette.background.paper,
	color: theme.palette.grey[500],
	padding: 0,
	minWidth: 0,
	border: `1px solid ${theme.palette.grey[300]}`,
	boxShadow: theme.shadows[1],
	opacity: 0,
	transition: "all 0.2s ease",
	zIndex: 20,
	"&:hover": {
		backgroundColor: theme.palette.error.light,
		color: theme.palette.error.contrastText,
	},
}));

const NodeWrapper = styled(Box)({
	position: "relative",
	"&:hover .delete-button": {
		opacity: 1,
	},
});

const getActionName = (type: string): string => {
	switch (type.toLowerCase()) {
		case "facebookleadads":
			return "Get Lead Ads";
		case "googlesheets":
			return "Get Lead";
		case "aicall":
			return "Process AI";
		case "googlecalendar":
			return "Schedule Event";
		case "sendwebhook":
			return "Send to Webhook";
		case "condition":
			return "Branch Logic";
		case "preverify":
			return "Pre-Verify";
		case "email":
			return "Send Email";
		case "sms":
			return "Send Message";
		case "config":
			return "Configure";
		case "error":
			return "Handle Error";
		default:
			return "Action";
	}
};

const BaseNode = ({ data, selected, id }: BaseNodeProps) => {
	const nodeColor = data.color || "#94a3b8";
	const actionName = getActionName(id.split("_")[0]);
	const { setNodes } = useReactFlow();

	const inputCount = data.inputs !== undefined ? data.inputs : 1;
	const outputCount = data.outputs !== undefined ? data.outputs : 1;

	const getHandlePositions = (count: number) => {
		if (count === 1) return [0.5];
		const positions: number[] = [];
		for (let i = 0; i < count; i++) {
			positions.push((i / (count - 1)) * 0.8 + 0.1);
		}
		return positions;
	};

	const inputPositions = getHandlePositions(inputCount);
	const outputPositions = getHandlePositions(outputCount);

	const handleDeleteNode = (event: React.MouseEvent) => {
		event.stopPropagation();
		setNodes((nodes) => nodes.filter((node) => node.id !== id));
	};

	return (
		<NodeWrapper>
			<DeleteButton
				className="delete-button"
				onClick={handleDeleteNode}
				size="small"
				aria-label="delete node"
			>
				<CloseIcon fontSize="small" />
			</DeleteButton>

			<NodeContainer selected={selected} nodeColor={nodeColor}>
				{data.icon}
			</NodeContainer>

			<NodeLabel>
				<Typography
					variant="body2"
					sx={{ fontWeight: 500, color: "text.primary" }}
					className="dark-text"
				>
					{data.label}
				</Typography>
				<ActionLabel className="dark-text">{actionName}</ActionLabel>
			</NodeLabel>

			{inputPositions.map((pos, index) => (
				<StyledHandle
					key={`input-${index}`}
					type="target"
					position={Position.Left}
					id={`input-${index}`}
					style={{ left: -4, top: `${pos * 100}%` }}
				/>
			))}

			{outputPositions.map((pos, index) => (
				<StyledHandle
					key={`output-${index}`}
					type="source"
					position={Position.Right}
					id={`output-${index}`}
					style={{ right: -4, top: `${pos * 100}%` }}
				/>
			))}
		</NodeWrapper>
	);
};

export default memo(BaseNode);
