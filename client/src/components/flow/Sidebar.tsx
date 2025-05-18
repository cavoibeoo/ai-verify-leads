import React, { useEffect, useState } from "react";
import {
	Box,
	Typography,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Divider,
	Paper,
	styled,
	Button,
	CircularProgress,
	Tooltip,
	Collapse,
	alpha,
	IconButton,
} from "@mui/material";
import {
	ArrowBack,
	ExpandMore,
	ExpandLess,
	ChevronLeft,
	ChevronRight,
} from "@mui/icons-material";
import { fetchAllNodeTypes, NodeType } from "@/services/nodetypeServices";
import { getNodeIcon, getNodeColor } from "@/utils/nodeUtils";
import Link from "next/link";

type NodeCategory = {
	title: string;
	items: NodeItem[];
};

type NodeItem = {
	type: string;
	label: string;
	icon: React.ReactNode;
	color: string;
	description?: string;
};

const SidebarContainer = styled(Paper)(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	height: "100%",
	width: "300px",
	transition: "width 0.3s ease",
	padding: theme.spacing(2),
	borderRight: `1px solid ${theme.palette.divider}`,
	zIndex: 10,
	boxShadow: "0 0 20px rgba(0,0,0,0.05)",
	position: "relative",
	overflow: "hidden",
}));

const CollapsedSidebar = styled(Paper)(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	height: "100%",
	width: "80px",
	padding: theme.spacing(1),
	alignItems: "center",
	borderRight: `1px solid ${theme.palette.divider}`,
	zIndex: 10,
	boxShadow: "0 0 20px rgba(0,0,0,0.05)",
	position: "relative",
}));

const NodeItem = styled(ListItem, {
	shouldForwardProp: (prop) => prop !== "bgcolor",
})<{ bgcolor: string }>(({ theme, bgcolor }) => ({
	padding: theme.spacing(1.5),
	marginBottom: theme.spacing(1.2),
	paddingLeft: theme.spacing(2),
	marginLeft: theme.spacing(0.5),
	borderRadius: "12px",
	cursor: "grab",
	transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
	background: alpha(bgcolor, 0.08),
	border: `1px solid ${alpha(bgcolor, 0.12)}`,
	position: "relative",
	"&::after": {
		content: '""',
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		borderRadius: "12px",
		pointerEvents: "none",
		transition: "all 0.3s ease",
		opacity: 0,
		boxShadow: `0 0 0 3px ${alpha(bgcolor, 0.3)}`,
	},
	"&:hover": {
		transform: "translateY(-3px)",
		boxShadow: `0 4px 10px ${alpha(bgcolor, 0.3)}`,
		border: `1px solid ${alpha(bgcolor, 0.35)}`,
		"&::after": {
			opacity: 1,
		},
	},
	"&:active": {
		cursor: "grabbing",
		transform: "translateY(1px) scale(0.98)",
		boxShadow: `0 2px 8px ${alpha(bgcolor, 0.25)}`,
		transition: "all 0.1s ease",
	},
}));

const CollapsedNodeItem = styled(ListItem, {
	shouldForwardProp: (prop) => prop !== "bgcolor",
})<{ bgcolor: string }>(({ theme, bgcolor }) => ({
	padding: theme.spacing(1),
	marginBottom: theme.spacing(1.2),
	borderRadius: "10px",
	width: "48px",
	height: "48px",
	cursor: "grab",
	transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
	display: "flex",
	justifyContent: "center",
	background: alpha(bgcolor, 0.08),
	border: `1px solid ${alpha(bgcolor, 0.12)}`,
	position: "relative",
	"&::after": {
		content: '""',
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		borderRadius: "10px",
		pointerEvents: "none",
		transition: "all 0.3s ease",
		opacity: 0,
		boxShadow: `0 0 0 3px ${alpha(bgcolor, 0.3)}`,
	},
	"&:hover": {
		transform: "translateY(-3px)",
		boxShadow: `0 8px 20px ${alpha(bgcolor, 0.3)}`,
		background: alpha(bgcolor, 0.15),
		border: `1px solid ${alpha(bgcolor, 0.35)}`,
		"&::after": {
			opacity: 1,
		},
	},
	"&:active": {
		cursor: "grabbing",
		transform: "translateY(1px) scale(0.98)",
		transition: "all 0.1s ease",
	},
}));

const NodeIconContainer = styled(Box, {
	shouldForwardProp: (prop) => prop !== "bgcolor",
})<{ bgcolor: string }>(({ theme, bgcolor }) => ({
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	backgroundColor: bgcolor,
	color: "white",
	borderRadius: "8px",
	padding: theme.spacing(0.8),
	width: "32px",
	height: "32px",
	boxShadow: `0 3px 6px ${alpha(bgcolor, 0.4)}`,
	"& .MuiSvgIcon-root": {
		fontSize: "18px",
		filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.2))",
	},
}));

const CategoryHeader = styled(Box)(({ theme }) => ({
	display: "flex",
	justifyContent: "space-between",
	alignItems: "center",
	marginBottom: theme.spacing(1),
	padding: theme.spacing(0.5, 1),
	borderRadius: theme.shape.borderRadius,
	cursor: "pointer",
	"&:hover": {
		backgroundColor: alpha(theme.palette.primary.main, 0.05),
	},
}));

const SidebarFooter = styled(Box)(({ theme }) => ({
	marginTop: "auto",
	paddingTop: theme.spacing(2),
	borderTop: `1px solid ${theme.palette.divider}`,
}));

const ToggleButton = styled(IconButton)(({ theme }) => ({
	position: "absolute",
	right: "-16px",
	top: "50%",
	transform: "translateY(-50%)",
	backgroundColor: theme.palette.background.paper,
	boxShadow: "0px 3px 8px rgba(0,0,0,0.15)",
	border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
	width: "32px",
	height: "32px",
	borderRadius: "50%",
	"&:hover": {
		backgroundColor: alpha(theme.palette.primary.main, 0.08),
		boxShadow: "0px 4px 12px rgba(0,0,0,0.2)",
	},
	"&:active": {
		boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
	},
	"& .MuiSvgIcon-root": {
		fontSize: "20px",
		color: theme.palette.primary.main,
	},
	zIndex: 20,
}));

// Phân loại node vào từng danh mục
const categorizeNodes = (nodes: NodeType[]): NodeCategory[] => {
	const dataSourcesCategory: NodeItem[] = [];
	const processingCategory: NodeItem[] = [];
	const actionsCategory: NodeItem[] = [];
	const utilitiesCategory: NodeItem[] = [];

	nodes.forEach((node) => {
		const nodeKey = node.key || "";
		const nodeItem: NodeItem = {
			type: nodeKey,
			label: node.name,
			icon: getNodeIcon(nodeKey),
			color: getNodeColor(nodeKey),
			description: node.description,
		};

		// Phân loại node dựa trên key hoặc đặc điểm
		if (
			nodeKey.includes("facebook") ||
			nodeKey.includes("googleSheets") ||
			nodeKey.includes("Sheets") ||
			nodeKey.includes("getSheetLead")
		) {
			dataSourcesCategory.push(nodeItem);
		} else if (
			nodeKey.includes("Call") ||
			nodeKey.includes("Verify") ||
			nodeKey.includes("exportSheetLead") ||
			nodeKey.includes("Webhook") ||
			nodeKey.includes("sendWebhook") ||
			nodeKey.includes("condition") ||
			nodeKey.includes("googleCalendar") ||
			nodeKey.includes("deadLead")
		) {
			processingCategory.push(nodeItem);
		} else if (
			nodeKey.includes("email") ||
			nodeKey.includes("sms") ||
			nodeKey.includes("notification")
		) {
			actionsCategory.push(nodeItem);
		} else {
			utilitiesCategory.push(nodeItem);
		}
	});

	return [
		{
			title: "Data Sources",
			items: dataSourcesCategory,
		},
		{
			title: "Processing",
			items: processingCategory,
		},
		{
			title: "Actions",
			items: actionsCategory,
		},
		{
			title: "Utilities",
			items: utilitiesCategory,
		},
	].filter((category) => category.items.length > 0); // Lọc các danh mục không có node
};

// Dữ liệu mẫu dự phòng khi API gặp lỗi
const fallbackNodeCategories: NodeCategory[] = [
	{
		title: "Data Sources",
		items: [
			{
				type: "googleSheets",
				label: "Google Sheets",
				icon: getNodeIcon("googleSheets"),
				color: getNodeColor("googleSheets"),
			},
			{
				type: "getSheetLead",
				label: "Sheet Import",
				icon: getNodeIcon("getSheetLead"),
				color: getNodeColor("getSheetLead"),
			},

			{
				type: "facebookLeadAds",
				label: "Facebook Lead Ads",
				icon: getNodeIcon("facebookLeadAds"),
				color: getNodeColor("facebookLeadAds"),
			},
		],
	},
	{
		title: "Processing",
		items: [
			{
				type: "aiCall",
				label: "AI Call",
				icon: getNodeIcon("aiCall"),
				color: getNodeColor("aiCall"),
			},
			{
				type: "googleCalendar",
				label: "Google Calendar",
				icon: getNodeIcon("googleCalendar"),
				color: getNodeColor("googleCalendar"),
			},
			{
				type: "exportSheetLead",
				label: "Sheet Export",
				icon: getNodeIcon("exportSheetLead"),
				color: getNodeColor("exportSheetLead"),
			},
			{
				type: "sendWebhook",
				label: "Send to webhook",
				icon: getNodeIcon("sendWebhook"),
				color: getNodeColor("sendWebhook"),
			},
			{
				type: "condition",
				label: "Condition",
				icon: getNodeIcon("condition"),
				color: getNodeColor("condition"),
			},
			{
				type: "deadLead",
				label: "Dead Lead Flow",
				icon: getNodeIcon("deadLead"),
				color: getNodeColor("deadLead"),
			},
		],
	},
	{
		title: "Actions",
		items: [
			{
				type: "email",
				label: "Send Email",
				icon: getNodeIcon("email"),
				color: getNodeColor("email"),
			},
			{
				type: "sms",
				label: "Send SMS",
				icon: getNodeIcon("sms"),
				color: getNodeColor("sms"),
			},
		],
	},
	{
		title: "Utilities",
		items: [
			{
				type: "config",
				label: "Configuration",
				icon: getNodeIcon("config"),
				color: getNodeColor("config"),
			},
			{
				type: "error",
				label: "Error Handler",
				icon: getNodeIcon("error"),
				color: getNodeColor("error"),
			},
		],
	},
];

type SidebarProps = {
	onDragStart: (event: React.DragEvent, nodeType: string) => void;
};

const Sidebar: React.FC<SidebarProps> = ({ onDragStart }) => {
	const [nodeCategories, setNodeCategories] = useState<NodeCategory[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<boolean>(false);
	const [collapsed, setCollapsed] = useState<boolean>(false);
	const [expandedCategories, setExpandedCategories] = useState<{
		[key: string]: boolean;
	}>({});

	// Thêm hàm xử lý kéo thả nâng cao hơn
	const handleDragStart = (event: React.DragEvent, nodeType: string) => {
		event.dataTransfer.effectAllowed = "move";
		event.dataTransfer.setData("application/reactflow", nodeType);
		event.dataTransfer.setDragImage(event.currentTarget, 20, 20);

		// Gọi hàm onDragStart từ props
		onDragStart(event, nodeType);
	};

	useEffect(() => {
		const loadNodeTypes = async () => {
			try {
				setLoading(true);
				const data = await fetchAllNodeTypes();

				if (data && !data.error && Array.isArray(data)) {
					const categories = categorizeNodes(data);
					setNodeCategories(categories);

					// Mặc định mở tất cả các danh mục
					const expanded: { [key: string]: boolean } = {};
					categories.forEach((cat) => {
						expanded[cat.title] = true;
					});
					setExpandedCategories(expanded);
				} else {
					console.error("Failed to fetch node types or invalid data format");
					setNodeCategories(fallbackNodeCategories);

					// Mặc định mở tất cả các danh mục fallback
					const expanded: { [key: string]: boolean } = {};
					fallbackNodeCategories.forEach((cat) => {
						expanded[cat.title] = true;
					});
					setExpandedCategories(expanded);

					setError(true);
				}
			} catch (err) {
				console.error("Error loading node types:", err);
				setNodeCategories(fallbackNodeCategories);

				// Mặc định mở tất cả các danh mục fallback
				const expanded: { [key: string]: boolean } = {};
				fallbackNodeCategories.forEach((cat) => {
					expanded[cat.title] = true;
				});
				setExpandedCategories(expanded);

				setError(true);
			} finally {
				setLoading(false);
			}
		};

		loadNodeTypes();
	}, []);

	const toggleCategory = (title: string) => {
		setExpandedCategories((prev) => ({
			...prev,
			[title]: !prev[title],
		}));
	};

	const toggleCollapse = () => {
		setCollapsed(!collapsed);
	};

	if (collapsed) {
		return (
			<Box sx={{ display: "flex", position: "relative" }}>
				<CollapsedSidebar elevation={3} className="lead-board">
					<Tooltip title="Back to Flow List" placement="right">
						<IconButton
							component={Link}
							href="/pages/flow/"
							size="small"
							sx={{ mt: 1, mb: 2 }}
						>
							<ArrowBack fontSize="small" />
						</IconButton>
					</Tooltip>

					<Divider sx={{ width: "80%", mb: 2 }} />

					{loading ? (
						<CircularProgress size={24} sx={{ my: 2 }} />
					) : (
						<Box
							sx={{
								overflowY: "auto",
								width: "100%",
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
							}}
						>
							{nodeCategories.map((category) => (
								<Box
									key={category.title}
									sx={{
										mb: 1,
										width: "100%",
										display: "flex",
										flexDirection: "column",
										alignItems: "center",
									}}
								>
									<Typography
										variant="caption"
										sx={{
											mb: 0.5,
											fontSize: "8px",
											color: "text.secondary",
											textTransform: "uppercase",
											letterSpacing: "0.5px",
											opacity: 0.7,
										}}
									>
										{category.title.slice(0, 1)}
									</Typography>

									{category.items.map((item) => (
										<Tooltip
											key={item.type}
											title={item.label}
											placement="right"
											arrow
											enterDelay={200}
											leaveDelay={100}
										>
											<CollapsedNodeItem
												bgcolor={item.color}
												onDragStart={(event) =>
													handleDragStart(event, item.type)
												}
												draggable
												disablePadding
											>
												<NodeIconContainer bgcolor={item.color}>
													{item.icon}
												</NodeIconContainer>
											</CollapsedNodeItem>
										</Tooltip>
									))}
								</Box>
							))}
						</Box>
					)}
				</CollapsedSidebar>

				<Tooltip title="Expand sidebar" placement="left">
					<ToggleButton
						onClick={toggleCollapse}
						size="small"
						className="lead-button"
					>
						<ChevronRight />
					</ToggleButton>
				</Tooltip>
			</Box>
		);
	}

	return (
		<Box sx={{ display: "flex", position: "relative" }}>
			<SidebarContainer
				elevation={3}
				sx={{ overflowY: "hidden" }}
				className="lead-board"
			>
				<Button
					href="/pages/flow/"
					component={Link}
					startIcon={<ArrowBack />}
					variant="text"
					color="primary"
					sx={{
						mb: 2,
						ml: 0,
						justifyContent: "flex-start",
						textTransform: "none",
						fontWeight: 500,
						borderRadius: "8px",
						"&:hover": {
							backgroundColor: alpha("#3b82f6", 0.08),
						},
					}}
					className="lead-card"
				>
					Back to Flow List
				</Button>

				<Typography
					variant="h6"
					sx={{
						mb: 2,
						fontWeight: 600,
						color: "text.primary",
						display: "flex",
						alignItems: "center",
						gap: 1,
					}}
				>
					Flow Components
				</Typography>

				{loading ? (
					<Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
						<CircularProgress size={28} color="primary" />
					</Box>
				) : (
					<Box sx={{ overflowY: "auto", flex: 1, pr: 1 }}>
						{nodeCategories.map((category) => (
							<Box key={category.title} sx={{ mb: 2 }}>
								<CategoryHeader onClick={() => toggleCategory(category.title)}>
									<Typography
										variant="subtitle2"
										sx={{
											color: "text.primary",
											fontWeight: 600,
											fontSize: "13px",
											letterSpacing: "0.3px",
											textTransform: "uppercase",
										}}
									>
										{category.title}
									</Typography>
									{expandedCategories[category.title] ? (
										<ExpandLess color="action" />
									) : (
										<ExpandMore color="action" />
									)}
								</CategoryHeader>

								<Collapse
									in={expandedCategories[category.title]}
									timeout="auto"
								>
									<List disablePadding>
										{category.items.map((item) => (
											<Tooltip
												key={item.type}
												title={item.description || item.label}
												placement="right"
												arrow
												enterDelay={200}
												leaveDelay={100}
											>
												<NodeItem
													bgcolor={item.color}
													onDragStart={(event) =>
														handleDragStart(event, item.type)
													}
													draggable
													disablePadding
												>
													<ListItemIcon sx={{ minWidth: 36 }}>
														<NodeIconContainer bgcolor={item.color}>
															{item.icon}
														</NodeIconContainer>
													</ListItemIcon>
													<ListItemText
														primary={item.label}
														primaryTypographyProps={{
															variant: "body2",
															sx: { fontWeight: 500 },
														}}
													/>
												</NodeItem>
											</Tooltip>
										))}
									</List>
								</Collapse>
							</Box>
						))}
					</Box>
				)}

				<SidebarFooter>
					<Typography
						variant="caption"
						color="text.secondary"
						paragraph
						sx={{ opacity: 0.7 }}
					>
						Drag components to the canvas to build your workflow
					</Typography>
					<Typography
						variant="caption"
						color="text.secondary"
						sx={{ opacity: 0.7 }}
					>
						Connect nodes by dragging between the handles
					</Typography>
				</SidebarFooter>
			</SidebarContainer>

			<Tooltip title="Collapse sidebar" placement="left">
				<ToggleButton
					onClick={toggleCollapse}
					size="small"
					className="lead-button"
				>
					<ChevronLeft />
				</ToggleButton>
			</Tooltip>
		</Box>
	);
};

export default Sidebar;
