"use client";
import React, { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import {
	Tooltip,
	Breadcrumbs,
	Divider,
	Chip,
	InputAdornment,
	MenuItem,
	Card,
	CardContent,
	CircularProgress,
	CardActionArea,
	Stack,
	DialogContentText,
} from "@mui/material";
import TextField from "@mui/material/TextField";
import Switch from "@mui/material/Switch";
import { styled, alpha } from "@mui/material/styles";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import Menu from "@mui/material/Menu";
import IconButton from "@mui/material/IconButton";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PersonIcon from "@mui/icons-material/Person";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import HomeIcon from "@mui/icons-material/Home";
import TableChart from "@mui/icons-material/TableChart";
import Facebook from "@mui/icons-material/Facebook";
import SmartToy from "@mui/icons-material/SmartToy";
import Webhook from "@mui/icons-material/Webhook";
import CallSplit from "@mui/icons-material/CallSplit";
import Email from "@mui/icons-material/Email";
import Phone from "@mui/icons-material/Phone";
import Settings from "@mui/icons-material/Settings";
import ErrorOutline from "@mui/icons-material/ErrorOutline";
import Layers from "@mui/icons-material/Layers";
import UpdateIcon from "@mui/icons-material/Update";
import Link from "next/link";
import { getNodeIcon, getNodeColor } from "@/utils/nodeUtils";
import {
	fetchAllFlow,
	enableFlow,
	disableFlow,
	deleteFlow,
	getFlowById,
} from "@/services/flowServices";
import BarChartIcon from "@mui/icons-material/BarChart";
import InsightsIcon from "@mui/icons-material/Insights";
import LinearProgress from "@mui/material/LinearProgress";
import LeadAnalyticsChart from "@/components/flow/LeadAnalyticsChart";
import { fetchLeadsByNodes } from "@/services/leadServices";
import { Lead, LeadStatus, Node } from "@/type";
import Avatar from "@mui/material/Avatar";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import List from "@mui/material/List";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Badge from "@mui/material/Badge";
import CheckCircle from "@mui/icons-material/CheckCircle";
import { AccessTime } from "@mui/icons-material";

const StyledCard = styled(Card)(({ theme }) => ({
	transition: "all 0.3s ease",
	borderRadius: "12px",
	overflow: "hidden",
	height: "100%",
	"&:hover": {
		transform: "translateY(-4px)",
		boxShadow: "0 12px 24px rgba(0, 0, 0, 0.08)",
	},
}));

const ComponentIcon = styled(Box)(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	color: "white",
	borderRadius: "10px",
	width: "42px",
	height: "42px",
	marginRight: "8px",
	boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
}));

const SearchTextField = styled(TextField)(({ theme }) => ({
	"& .MuiOutlinedInput-root": {
		borderRadius: "10px",
		backgroundColor: alpha(theme.palette.common.white, 0.9),
		"&:hover": {
			backgroundColor: theme.palette.common.white,
		},
		"&.Mui-focused": {
			backgroundColor: theme.palette.common.white,
		},
	},
}));

const UploadBox = styled(Paper)(({ theme }) => ({
	padding: theme.spacing(3),
	textAlign: "center",
	color: theme.palette.text.secondary,
	border: "2px dashed #ccc",
	cursor: "pointer",
	height: "100%",
	display: "flex",
	flexDirection: "column",
	justifyContent: "center",
	alignItems: "center",
	backgroundColor: theme.palette.background.default,
	transition: "background-color 0.3s",
	"&:hover": {
		backgroundColor: theme.palette.action.hover,
	},
}));

const EmptyState = styled(Box)(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	justifyContent: "center",
	padding: theme.spacing(6),
	textAlign: "center",
	backgroundColor: "#f9fafb",
	borderRadius: "12px",
	border: "1px dashed #d1d5db",
	margin: theme.spacing(4, 0),
}));

interface Component {
	name: string;
	logo: string;
	backgroundColor: string;
}

interface Flow {
	id: string;
	name: string;
	date: string;
	creator: string;
	status: number;
	components: Component[];
	updatedAt?: string;
}

interface FlowListProps {
	flows: Flow[];
	activeFlowId: string | null;
	onToggleActive: (id: string) => void;
	onDeleteFlow: (id: string) => void;
	searchTerm: string;
}

const getNodeTypeFromId = (nodeId: string): string => {
	if (!nodeId) return "default";

	const basePart = nodeId.split("_")[0]?.toLowerCase() || nodeId.toLowerCase();

	if (basePart.includes("email")) return "email";
	if (basePart.includes("sms")) return "sms";
	if (basePart.includes("facebook")) return "facebookLeadAds";
	if (basePart.includes("getsheetlead")) return "googleSheets";
	if (basePart.includes("exportsheetlead")) return "googleSheets";
	if (basePart.includes("google") && basePart.includes("calendar"))
		return "googleCalendar";
	if (basePart.includes("webhook")) return "sendWebhook";
	if (basePart.includes("deadlead")) return "deadLead";
	if (basePart.includes("preverify") || basePart.includes("verify"))
		return "preVerify";
	if (basePart.includes("aicall") || basePart.includes("call")) return "aiCall";
	if (basePart.includes("delay") || basePart.includes("config"))
		return "config";
	if (basePart.includes("condition")) return "condition";

	return basePart;
};

const formatNodeType = (nodeType: string): string => {
	if (!nodeType) return "Unknown";

	const parts = nodeType
		.split(/(?=[A-Z])|_/)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());

	return parts.join(" ");
};

const FlowList: React.FC<FlowListProps> = ({
	flows,
	activeFlowId,
	onToggleActive,
	onDeleteFlow,
	searchTerm,
}) => {
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
	const [dialogOpen, setDialogOpen] = useState<boolean>(false);
	const [dialogAction, setDialogAction] = useState<string>("");
	const [analyticsDialogOpen, setAnalyticsDialogOpen] =
		useState<boolean>(false);
	const [nodeData, setNodeData] = useState<Node[]>([]);
	const [selectedNodeTab, setSelectedNodeTab] = useState<number>(0);
	const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(false);
	const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
	const [nodeTypeData, setNodeTypeData] = useState<
		{
			label: string;
			type: string;
			leads: Lead[];
			count: number;
		}[]
	>([]);

	const filteredFlows = flows.filter((flow) =>
		flow.name.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, flow: Flow) => {
		event.stopPropagation();
		setAnchorEl(event.currentTarget);
		setSelectedFlow(flow);
	};

	const handleMenuClose = () => {
		setAnchorEl(null);
		setSelectedFlow(null);
	};

	const handleDialogOpen = (action: string) => {
		setDialogAction(action);
		setDialogOpen(true);
	};

	const handleDialogClose = () => {
		setDialogOpen(false);
	};

	const handleAnalyticsOpen = async (
		event: React.MouseEvent<HTMLElement>,
		flow: Flow
	) => {
		event.stopPropagation();
		setSelectedFlow(flow);
		setAnalyticsDialogOpen(true);
		setSelectedNodeTab(0);

		setLoadingAnalytics(true);
		try {
			const nodesData = await fetchLeadsByNodes(flow.id);
			if (nodesData && Array.isArray(nodesData)) {
				setNodeData(nodesData);

				const leadsByNodeType: Record<
					string,
					{ leads: Lead[]; label: string }
				> = {};

				const leadsByCurrentNode: Record<
					string,
					{ leads: Lead[]; label: string; type: string }
				> = {};

				nodesData.forEach((node) => {
					const nodeType = node.type.split("_")[0];

					if (!leadsByNodeType[nodeType]) {
						leadsByNodeType[nodeType] = {
							leads: [],
							label: node.label || formatNodeType(nodeType),
						};
					}

					if (node.leads && Array.isArray(node.leads)) {
						leadsByNodeType[nodeType].leads.push(...node.leads);
						node.leads.forEach((lead: Lead) => {
							const currentNodeType = getNodeTypeFromId(lead.nodeId);

							if (!leadsByCurrentNode[currentNodeType]) {
								leadsByCurrentNode[currentNodeType] = {
									leads: [],
									label: formatNodeType(currentNodeType),
									type: currentNodeType,
								};
							}

							leadsByCurrentNode[currentNodeType].leads.push(lead);
						});
					}
				});

				const groupedByNodeType = Object.keys(leadsByNodeType).map((type) => ({
					type,
					label: leadsByNodeType[type].label,
					leads: leadsByNodeType[type].leads,
					count: leadsByNodeType[type].leads.length,
				}));

				const groupedByCurrentNode = Object.keys(leadsByCurrentNode).map(
					(type) => ({
						type,
						label: leadsByCurrentNode[type].label,
						leads: leadsByCurrentNode[type].leads,
						count: leadsByCurrentNode[type].leads.length,
					})
				);

				groupedByNodeType.sort((a, b) => b.count - a.count);
				groupedByCurrentNode.sort((a, b) => b.count - a.count);

				setNodeTypeData(groupedByCurrentNode);

				const allLeads: Lead[] = [];
				groupedByCurrentNode.forEach((group) => {
					allLeads.push(...group.leads);
				});

				const sortedLeads = allLeads.sort(
					(a, b) =>
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				);

				setFilteredLeads(sortedLeads.slice(0, 10));
			}
		} catch (error) {
			console.error("Error fetching lead data for analytics:", error);
		} finally {
			setLoadingAnalytics(false);
		}
	};

	const handleAnalyticsClose = () => {
		setAnalyticsDialogOpen(false);
	};

	const handleNodeTabChange = (
		event: React.SyntheticEvent,
		newValue: number
	) => {
		if (newValue === 0 || (newValue > 0 && newValue <= nodeTypeData.length)) {
			setSelectedNodeTab(newValue);

			if (newValue === 0) {
				const allLeads: Lead[] = [];
				nodeTypeData.forEach((nodeType) => {
					allLeads.push(...nodeType.leads);
				});
				const sortedLeads = allLeads.sort(
					(a, b) =>
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				);
				setFilteredLeads(sortedLeads.slice(0, 10));
			} else if (nodeTypeData[newValue - 1]) {
				const nodeTypeLeads = nodeTypeData[newValue - 1].leads || [];
				setFilteredLeads(
					nodeTypeLeads
						.sort(
							(a, b) =>
								new Date(b.createdAt).getTime() -
								new Date(a.createdAt).getTime()
						)
						.slice(0, 10)
				);
			}
		}
	};

	const getStatusInfo = (status: number) => {
		switch (status) {
			case LeadStatus.Success:
				return {
					icon: <CheckCircle sx={{ color: "#10b981" }} />,
					color: "#10b981",
					label: "Successful",
				};
			case LeadStatus.Error:
				return {
					icon: <ErrorOutline sx={{ color: "#ef4444" }} />,
					color: "#ef4444",
					label: "Error",
				};
			case LeadStatus.InProgress:
			case LeadStatus.Processing:
				return {
					icon: <AccessTime sx={{ color: "#f59e0b" }} />,
					color: "#f59e0b",
					label: "Processing",
				};
			default:
				return {
					icon: <AddIcon sx={{ color: "#64748b" }} />,
					color: "#64748b",
					label: "Unknown",
				};
		}
	};

	const formatTime = (dateString: string) => {
		try {
			const date = new Date(dateString);
			return (
				date.toLocaleDateString() +
				", " +
				date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
			);
		} catch (e) {
			return "Invalid date";
		}
	};

	const handleConfirmAction = async () => {
		if (!selectedFlow) return;

		try {
			if (dialogAction === "clone") {
				console.log(`Cloning flow: ${selectedFlow.name}`);
			} else if (dialogAction === "delete") {
				await onDeleteFlow(selectedFlow.id);
			}
		} catch (error) {
			console.error(`Error during ${dialogAction} action:`, error);
		}

		handleDialogClose();
		handleMenuClose();
	};

	const handleEditFlow = (flow: Flow) => {
		console.log(`Editing flow: ${flow.name}`);
		window.location.href = `/pages/customflow?id=${flow.id}`;
	};

	if (filteredFlows.length === 0) {
		return (
			<EmptyState className="lighter-bg">
				<Layers sx={{ fontSize: 48, color: "#9ca3af", mb: 2 }} />
				<Typography variant="h6" color="textSecondary" gutterBottom>
					{searchTerm
						? "No scenarios matching your search"
						: "No scenarios yet"}
				</Typography>
				<Typography
					variant="body2"
					color="textSecondary"
					sx={{ mb: 3, maxWidth: 450 }}
				>
					{searchTerm
						? "Try using different keywords or clear your search"
						: "Create your first automation scenario to streamline your workflow"}
				</Typography>
			</EmptyState>
		);
	}

	return (
		<>
			<Grid container spacing={3}>
				{filteredFlows.map((flow) => (
					<Grid item xs={12} sm={6} lg={4} xl={3} key={flow.id}>
						<StyledCard>
							<CardContent
								sx={{
									p: 0,
									height: "100%",
									display: "flex",
									flexDirection: "column",
								}}
								className="flow-card-footer"
							>
								{/* Header with status and menu */}
								<Box
									sx={{
										p: 2,
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										bgcolor: "#FAFBFC",
									}}
									className="flow-card-header"
								>
									<Chip
										label={flow.status === 2 ? "Active" : "Inactive"}
										size="small"
										color={flow.status === 2 ? "success" : "default"}
										sx={{
											height: 24,
											fontSize: "0.75rem",
											borderRadius: "6px",
										}}
									/>
									<Box sx={{ display: "flex", alignItems: "center" }}>
										<Tooltip title="View Flow Analytics">
											<IconButton
												size="small"
												onClick={(event) => handleAnalyticsOpen(event, flow)}
												sx={{ mr: 1 }}
											>
												<InsightsIcon fontSize="small" />
											</IconButton>
										</Tooltip>
										<Box sx={{ display: "inline-flex", mr: 0.5 }}>
											<Tooltip
												title={
													flow.status === 2 ? "Disable flow" : "Activate flow"
												}
											>
												<Switch
													checked={flow.status === 2}
													color="primary"
													size="small"
													onChange={(e) => {
														e.stopPropagation();
														onToggleActive(flow.id);
													}}
												/>
											</Tooltip>
										</Box>
										<IconButton
											size="small"
											onClick={(event) => handleMenuOpen(event, flow)}
											sx={{ ml: 0.5 }}
										>
											<MoreVertIcon fontSize="small" />
										</IconButton>
									</Box>
								</Box>

								{/* Content - Now using CardActionArea outside the content area */}
								<CardActionArea
									component={Link}
									href={`/pages/customflow?id=${flow.id}`}
									sx={{
										flexGrow: 1,
										display: "flex",
										flexDirection: "column",
										alignItems: "flex-start",
										justifyContent: "flex-start",
									}}
									className="flow-card-content"
								>
									<Box sx={{ p: 2.5, width: "100%" }}>
										{/* Flow name */}
										<Typography
											variant="h6"
											sx={{
												fontWeight: 600,
												mb: 1.5,
												color: "#111827",
												overflow: "hidden",
												textOverflow: "ellipsis",
												display: "-webkit-box",
												WebkitLineClamp: 1,
												WebkitBoxOrient: "vertical",
											}}
										>
											{flow.name}
										</Typography>

										{/* Flow info */}
										<Box
											sx={{
												display: "flex",
												flexDirection: "column",
												alignItems: "flex-start",
											}}
										>
											<Typography
												variant="body2"
												sx={{
													display: "flex",
													alignItems: "center",
													color: "#6B7280",
													fontSize: "0.8125rem",
													mr: 2,
													mb: 0.5,
												}}
											>
												<CalendarMonthIcon
													sx={{ fontSize: 16, mr: 0.5, color: "#9CA3AF" }}
												/>
												{flow.date}
											</Typography>
										</Box>

										<Box
											sx={{
												display: "flex",
												flexDirection: "column",
												alignItems: "flex-start",
												mb: 2.5,
											}}
										>
											<Typography
												variant="body2"
												sx={{
													display: "flex",
													alignItems: "center",
													color: "#6B7280",
													fontSize: "0.75rem",
													mr: 2,
												}}
											>
												<UpdateIcon
													sx={{ fontSize: 14, mr: 0.5, color: "#9CA3AF" }}
												/>
												Updated: {flow.updatedAt}
											</Typography>
										</Box>

										{/* Components */}
										<Box
											sx={{
												display: "flex",
												alignItems: "center",
												flexWrap: "wrap",
											}}
										>
											{flow.components && flow.components.length > 0 ? (
												<>
													{flow.components.slice(0, 3).map((component, idx) => (
														<ComponentIcon
															key={idx}
															sx={{
																backgroundColor:
																	component.backgroundColor ||
																	getNodeColor(component.name),
															}}
														>
															{getNodeIcon(component.name)}
														</ComponentIcon>
													))}
													{flow.components.length > 3 && (
														<ComponentIcon
															sx={{
																backgroundColor: "#9E9E9E",
															}}
														>
															+{flow.components.length - 3}
														</ComponentIcon>
													)}
												</>
											) : (
												<ComponentIcon
													sx={{
														backgroundColor: "#9E9E9E",
													}}
												>
													<Layers fontSize="small" />
												</ComponentIcon>
											)}
										</Box>
									</Box>
								</CardActionArea>
							</CardContent>
						</StyledCard>
					</Grid>
				))}
			</Grid>

			{/* Analytics Dialog */}
			<Dialog
				open={analyticsDialogOpen}
				onClose={handleAnalyticsClose}
				aria-labelledby="analytics-dialog-title"
				maxWidth="md"
				fullWidth
				PaperProps={{
					sx: {
						borderRadius: "12px",
						boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
						overflow: "hidden",
					},
				}}
			>
				<DialogTitle
					id="analytics-dialog-title"
					sx={{
						fontSize: "1.25rem",
						fontWeight: 600,
						display: "flex",
						alignItems: "center",
						gap: 1,
					}}
				>
					<InsightsIcon color="primary" />
					{selectedFlow?.name} Analytics
				</DialogTitle>
				<DialogContent>
					<Box sx={{ py: 2 }}>
						<DialogContentText sx={{ mb: 3 }}>
							Overview of flow performance and lead metrics
						</DialogContentText>

						{/* Analytics Dashboard */}
						<Grid container spacing={3}>
							{/* Lead Analytics Chart - Left side */}
							<Grid item xs={12} md={6}>
								<Box sx={{ height: "100%" }} className="lead-analytics-chart">
									<LeadAnalyticsChart flowId={selectedFlow?.id || null} />
								</Box>
							</Grid>

							{/* Node Type Lead Counts - Right side */}
							<Grid item xs={12} md={6}>
								<Paper
									elevation={0}
									sx={{
										p: 2,
										borderRadius: 2,
										border: "1px solid",
										borderColor: "divider",
										height: "100%",
									}}
								>
									<Typography variant="h6" sx={{ mb: 2, fontSize: "1rem" }}>
										Leads by Current Node
									</Typography>

									{loadingAnalytics ? (
										<Box
											sx={{ display: "flex", justifyContent: "center", my: 4 }}
										>
											<CircularProgress size={28} />
										</Box>
									) : nodeTypeData.length === 0 ? (
										<Box
											sx={{
												textAlign: "center",
												my: 4,
												color: "text.secondary",
											}}
										>
											<Typography component="div" variant="body2">
												No lead data available
											</Typography>
										</Box>
									) : (
										<Grid container spacing={2}>
											{nodeTypeData.map((group, index) => {
												const nodeColor = getNodeColor(group.type);
												const leadCount = group.count;

												return (
													<Grid item xs={6} key={group.type}>
														<Box
															sx={{
																display: "flex",
																alignItems: "center",
																p: 1.5,
																borderRadius: 2,
																border: "1px solid",
																borderColor: "divider",
																"&:hover": {
																	bgcolor: alpha(nodeColor, 0.08),
																	cursor: "pointer",
																},
																...(selectedNodeTab === index + 1 && {
																	bgcolor: alpha(nodeColor, 0.12),
																	borderColor: alpha(nodeColor, 0.3),
																}),
															}}
															onClick={() =>
																handleNodeTabChange(
																	{} as React.SyntheticEvent,
																	index + 1
																)
															}
														>
															<Box
																sx={{
																	width: 36,
																	height: 36,
																	borderRadius: "50%",
																	bgcolor: alpha(nodeColor, 0.2),
																	display: "flex",
																	alignItems: "center",
																	justifyContent: "center",
																	mr: 1.5,
																	color: nodeColor,
																}}
															>
																{getNodeIcon(group.type)}
															</Box>
															<Box>
																<Typography variant="body2" fontWeight={500}>
																	{group.label}
																</Typography>
																<Typography
																	variant="caption"
																	color="text.secondary"
																>
																	{leadCount}{" "}
																	{leadCount === 1 ? "lead" : "leads"}
																</Typography>
															</Box>
														</Box>
													</Grid>
												);
											})}
										</Grid>
									)}
								</Paper>
							</Grid>

							{/* Node Lead List - Bottom section */}
							<Grid item xs={12}>
								<Paper
									elevation={0}
									sx={{
										p: 2,
										borderRadius: 2,
										border: "1px solid",
										borderColor: "divider",
									}}
								>
									{/* Filter tabs */}
									<Box sx={{ borderBottom: 1, borderColor: "divider", mb: 1 }}>
										<Tabs
											value={
												nodeTypeData.length === 0
													? 0
													: selectedNodeTab > nodeTypeData.length
													? 0
													: selectedNodeTab
											}
											onChange={handleNodeTabChange}
											variant="scrollable"
											scrollButtons="auto"
											sx={{
												minHeight: 36,
												"& .MuiTab-root": {
													minHeight: 36,
													py: 0.5,
													px: 1.5,
													fontSize: "0.75rem",
												},
											}}
										>
											<Tab
												label={
													<Box sx={{ display: "flex", alignItems: "center" }}>
														<Badge
															badgeContent={nodeTypeData.reduce(
																(sum, group) => sum + group.count,
																0
															)}
															color="primary"
															max={99}
															sx={{
																"& .MuiBadge-badge": {
																	fontSize: "0.65rem",
																	height: 16,
																	minWidth: 16,
																},
															}}
														>
															<Box
																component="span"
																sx={{ fontSize: "0.75rem" }}
															>
																All Nodes
															</Box>
														</Badge>
													</Box>
												}
												sx={{ textTransform: "none" }}
											/>

											{nodeTypeData.map((group, index) => {
												const count = group.count;
												const nodeColor = getNodeColor(group.type);

												return (
													<Tab
														key={group.type}
														label={
															<Box
																sx={{ display: "flex", alignItems: "center" }}
															>
																<Badge
																	badgeContent={count}
																	color="primary"
																	max={99}
																	sx={{
																		"& .MuiBadge-badge": {
																			fontSize: "0.65rem",
																			height: 16,
																			minWidth: 16,
																		},
																	}}
																>
																	<Box
																		sx={{
																			display: "flex",
																			alignItems: "center",
																		}}
																	>
																		<Box
																			sx={{
																				width: 8,
																				height: 8,
																				borderRadius: "50%",
																				bgcolor: nodeColor,
																				mr: 0.75,
																			}}
																		/>
																		<Box
																			component="span"
																			sx={{ fontSize: "0.75rem" }}
																		>
																			{group.label}
																		</Box>
																	</Box>
																</Badge>
															</Box>
														}
														sx={{ textTransform: "none" }}
													/>
												);
											})}
										</Tabs>
									</Box>

									{/* Lead List */}
									{loadingAnalytics ? (
										<Box
											sx={{ display: "flex", justifyContent: "center", my: 4 }}
										>
											<CircularProgress size={28} />
										</Box>
									) : filteredLeads.length === 0 ? (
										<Box
											sx={{
												textAlign: "center",
												my: 4,
												color: "text.secondary",
											}}
										>
											<Typography component="div" variant="body2">
												No lead data available
											</Typography>
										</Box>
									) : (
										<List sx={{ p: 0, maxHeight: 300, overflow: "auto" }}>
											{filteredLeads.map((lead, index) => {
												const statusInfo = getStatusInfo(lead.status);
												return (
													<React.Fragment key={lead._id.toString()}>
														<ListItem
															alignItems="flex-start"
															sx={{
																px: 1,
																py: 1,
																"&:hover": {
																	bgcolor: (theme) =>
																		alpha(theme.palette.primary.main, 0.04),
																	borderRadius: 1,
																},
															}}
														>
															<ListItemAvatar sx={{ minWidth: 42 }}>
																<Avatar
																	sx={{
																		width: 32,
																		height: 32,
																		bgcolor: alpha(statusInfo.color, 0.12),
																		color: statusInfo.color,
																	}}
																>
																	{statusInfo.icon}
																</Avatar>
															</ListItemAvatar>
															<ListItemText
																primaryTypographyProps={{ component: "div" }}
																secondaryTypographyProps={{ component: "div" }}
																primary={
																	<Box
																		sx={{
																			display: "flex",
																			alignItems: "center",
																			mb: 0.5,
																		}}
																	>
																		<Typography
																			variant="body2"
																			fontWeight={500}
																			component="span"
																			sx={{ mr: 1 }}
																		>
																			{lead.leadData.full_name ||
																				lead.leadData.name ||
																				"Unknown"}
																		</Typography>
																		<Chip
																			label={statusInfo.label}
																			size="small"
																			sx={{
																				height: 20,
																				fontSize: "0.7rem",
																				bgcolor: alpha(statusInfo.color, 0.12),
																				color: statusInfo.color,
																				ml: "auto",
																			}}
																		/>
																	</Box>
																}
																secondary={
																	<Box component="div">
																		<Typography
																			component="div"
																			variant="body2"
																			color="text.secondary"
																			sx={{ fontSize: "0.75rem", mb: 0.5 }}
																		>
																			{lead.leadData.email ||
																				lead.leadData.phone ||
																				lead.source ||
																				"No contact info"}
																		</Typography>

																		<Box
																			sx={{
																				display: "flex",
																				justifyContent: "space-between",
																			}}
																		>
																			<Typography
																				component="span"
																				variant="caption"
																				color="text.secondary"
																				sx={{ fontSize: "0.7rem" }}
																			>
																				{formatTime(lead.createdAt)}
																			</Typography>

																			{lead.source && (
																				<Typography
																					component="span"
																					variant="caption"
																					sx={{
																						fontSize: "0.7rem",
																						color: "text.secondary",
																					}}
																				>
																					Source: {lead.source}
																				</Typography>
																			)}
																		</Box>
																	</Box>
																}
															/>
														</ListItem>
														{index < filteredLeads.length - 1 && (
															<Divider
																variant="inset"
																component="li"
																sx={{ opacity: 0.5 }}
															/>
														)}
													</React.Fragment>
												);
											})}
										</List>
									)}
								</Paper>
							</Grid>
						</Grid>
					</Box>
				</DialogContent>
				<DialogActions sx={{ padding: "16px 24px" }}>
					<Button
						onClick={handleAnalyticsClose}
						variant="outlined"
						sx={{
							textTransform: "none",
							borderRadius: "8px",
							px: 2,
						}}
					>
						Close
					</Button>
				</DialogActions>
			</Dialog>

			<Menu
				id="simple-menu"
				anchorEl={anchorEl}
				keepMounted
				open={Boolean(anchorEl)}
				onClose={handleMenuClose}
				PaperProps={{
					elevation: 0,
					sx: {
						borderRadius: "8px",
						boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
						overflow: "visible",
						mt: 1.5,
						"& .MuiMenuItem-root": {
							fontSize: "0.875rem",
							py: 1,
						},
						"&:before": {
							content: '""',
							display: "block",
							position: "absolute",
							top: 0,
							right: 14,
							width: 10,
							height: 10,
							bgcolor: "background.paper",
							transform: "translateY(-50%) rotate(45deg)",
							zIndex: 0,
						},
					},
				}}
				transformOrigin={{ horizontal: "right", vertical: "top" }}
				anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
			>
				<MenuItem
					onClick={() => handleDialogOpen("clone")}
					sx={{ color: "#111827" }}
				>
					<ContentCopyIcon fontSize="small" sx={{ mr: 1, color: "#6B7280" }} />
					Clone
				</MenuItem>
				<MenuItem
					onClick={() => handleDialogOpen("delete")}
					sx={{ color: "#F44336" }}
				>
					<DeleteOutlineIcon fontSize="small" sx={{ mr: 1 }} />
					Delete
				</MenuItem>
			</Menu>

			<Dialog
				open={dialogOpen}
				onClose={handleDialogClose}
				aria-labelledby="alert-dialog-title"
				aria-describedby="alert-dialog-description"
				PaperProps={{
					sx: {
						borderRadius: "12px",
						boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
						overflow: "hidden",
					},
				}}
			>
				<DialogTitle
					id="alert-dialog-title"
					sx={{ fontSize: "1.25rem", fontWeight: 600 }}
				>
					{dialogAction === "clone" ? "Clone Scenario" : "Delete Scenario"}
				</DialogTitle>
				<DialogContent>
					<Typography variant="body1" sx={{ mt: 1 }}>
						{dialogAction === "clone"
							? `Are you sure you want to create a copy of "${selectedFlow?.name}"?`
							: `Are you sure you want to delete "${selectedFlow?.name}"?`}
					</Typography>
					{dialogAction === "delete" && (
						<Typography variant="body2" color="error" sx={{ mt: 2 }}>
							This action cannot be undone. The scenario will be moved to trash.
						</Typography>
					)}
				</DialogContent>
				<DialogActions sx={{ padding: "16px 24px" }}>
					<Button
						onClick={handleDialogClose}
						variant="outlined"
						sx={{
							textTransform: "none",
							borderRadius: "8px",
							px: 2,
						}}
					>
						Cancel
					</Button>
					<Button
						onClick={handleConfirmAction}
						color={dialogAction === "delete" ? "error" : "primary"}
						variant="contained"
						autoFocus
						sx={{
							textTransform: "none",
							borderRadius: "8px",
							px: 2,
						}}
					>
						{dialogAction === "clone" ? "Clone" : "Delete"}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

const ScenarioPage: React.FC = () => {
	const [flows, setFlows] = useState<Flow[]>([]);
	const [activeFlowId, setActiveFlowId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [searchTerm, setSearchTerm] = useState<string>("");

	const loadFlows = async () => {
		try {
			setIsLoading(true);
			const data = await fetchAllFlow();
			if (data) {
				const formattedFlows = data
					.filter((flow: any) => flow.status !== 0)
					.map((flow: any) => {
						// Trích xuất các loại node từ nodeData để tạo thành phần
						const nodeTypes =
							flow.nodeData?.nodes?.map((node: any) => ({
								name: node.type,
								backgroundColor: getNodeColor(node.type),
							})) || [];

						// Loại bỏ trùng lặp nếu có
						const uniqueTypes = Array.from(
							new Set(nodeTypes.map((t: any) => t.name))
						).map((name) => nodeTypes.find((t: any) => t.name === name));

						return {
							id: flow._id || flow.id,
							name: flow.name,
							date: new Date(flow.createdAt).toLocaleDateString(),
							updatedAt: formatTimeAgo(flow.updatedAt || flow.createdAt),
							creator: flow.userId || "Unknown",
							status: flow.status,
							components:
								uniqueTypes.length > 0 ? uniqueTypes : flow.components || [],
						};
					});
				setFlows(formattedFlows);
			}
		} catch (error) {
			console.error("Error loading flows:", error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		loadFlows();
	}, []);

	const handleToggleActive = async (flowId: string) => {
		try {
			const targetFlow = flows.find((flow) => flow.id === flowId);
			if (!targetFlow) {
				console.error("Flow not found");
				return;
			}

			let response;
			// Toggle between status 1 (inactive) and 2 (active)
			if (targetFlow.status === 1 || targetFlow.status === 0) {
				response = await enableFlow(flowId);
			} else if (targetFlow.status === 2) {
				response = await disableFlow(flowId);
			}

			if (response?.error) {
				console.error("Error toggling flow status:", response.error);
				return;
			}

			// Reload flows to get updated status
			await loadFlows();
		} catch (error) {
			console.error("Error toggling flow status:", error);
		}
	};

	const handleDeleteFlow = async (flowId: string) => {
		try {
			const response = await deleteFlow(flowId);
			if (!response?.error) {
				await loadFlows();
			}
		} catch (error) {
			console.error("Error deleting flow:", error);
		}
	};

	const formatTimeAgo = (dateString: string): string => {
		const date = new Date(dateString);
		const now = new Date();
		const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

		let interval = Math.floor(seconds / 31536000);
		if (interval >= 1) {
			return interval === 1 ? `${interval} year ago` : `${interval} years ago`;
		}

		interval = Math.floor(seconds / 2592000);
		if (interval >= 1) {
			return interval === 1
				? `${interval} month ago`
				: `${interval} months ago`;
		}

		interval = Math.floor(seconds / 86400);
		if (interval >= 1) {
			return interval === 1 ? `${interval} day ago` : `${interval} days ago`;
		}

		interval = Math.floor(seconds / 3600);
		if (interval >= 1) {
			return interval === 1 ? `${interval} hour ago` : `${interval} hours ago`;
		}

		interval = Math.floor(seconds / 60);
		if (interval >= 1) {
			return interval === 1
				? `${interval} minute ago`
				: `${interval} minutes ago`;
		}

		return seconds <= 5 ? "just now" : `${Math.floor(seconds)} seconds ago`;
	};

	return (
		<Box sx={{ minHeight: "85vh", mb: 10 }}>
			<Box
				sx={{
					minHeight: "80vh",
					display: "flex",
					flexDirection: "column",
					px: 1,
				}}
			>
				{/* Breadcrumbs */}
				<Breadcrumbs
					separator={<NavigateNextIcon fontSize="small" />}
					aria-label="breadcrumb"
					sx={{ mb: 2 }}
				>
					<Link
						href="/app/dashboard"
						passHref
						style={{ textDecoration: "none" }}
					>
						<Typography
							color="text.secondary"
							sx={{
								display: "flex",
								alignItems: "center",
								fontSize: "0.875rem",
							}}
						>
							<HomeIcon sx={{ mr: 0.5, fontSize: "0.875rem" }} />
							Dashboard
						</Typography>
					</Link>
					<Typography color="text.primary" sx={{ fontSize: "0.875rem" }}>
						Scenarios
					</Typography>
				</Breadcrumbs>

				{/* Header */}
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						mb: 3,
					}}
				>
					<Typography variant="h5" sx={{ fontWeight: 700 }}>
						All Scenarios
					</Typography>

					<Button
						variant="outlined"
						component={Link}
						startIcon={<DeleteOutlineIcon />}
						href="/pages/trash/"
						sx={{
							borderRadius: "10px",
							textTransform: "none",
							boxShadow: "0 4px 8px rgba(0, 0, 0, 0.05)",
						}}
					>
						Trash
					</Button>
				</Box>

				{/* Search and Add */}
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						mb: 3,
						flexWrap: "wrap",
						gap: 2,
					}}
				>
					<Box
						sx={{
							display: "flex",
							gap: 1,
							alignItems: "center",
							ml: "auto",
						}}
					>
						<IconButton size="small" title="Search leads">
							<SearchIcon />
						</IconButton>
					</Box>
					<SearchTextField
						placeholder="Search scenarios..."
						variant="outlined"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						size="small"
						className="white-text"
						sx={{ flexGrow: 1, maxWidth: { xs: "100%", sm: 320 } }}
					/>

					<Button
						variant="contained"
						component={Link}
						href="/pages/customflow"
						startIcon={<AddIcon />}
						sx={{
							borderRadius: "10px",
							textTransform: "none",
							boxShadow: "0 8px 16px rgba(85, 105, 255, 0.2)",
							py: 1,
							px: 2.5,
						}}
					>
						Create New Scenario
					</Button>
				</Box>

				<Divider sx={{ mb: 3 }} />

				{/* Content */}
				{isLoading ? (
					<Box
						display="flex"
						justifyContent="center"
						alignItems="center"
						my={8}
					>
						<CircularProgress size={40} color="primary" />
					</Box>
				) : (
					<FlowList
						flows={flows}
						activeFlowId={activeFlowId}
						onToggleActive={handleToggleActive}
						onDeleteFlow={handleDeleteFlow}
						searchTerm={searchTerm}
					/>
				)}
			</Box>
		</Box>
	);
};

export default ScenarioPage;
