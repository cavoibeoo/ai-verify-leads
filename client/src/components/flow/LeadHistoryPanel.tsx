import React, { useEffect, useState } from "react";
import {
	Box,
	Paper,
	Typography,
	Divider,
	List,
	ListItem,
	ListItemAvatar,
	ListItemText,
	Avatar,
	Chip,
	CircularProgress,
	alpha,
	Tabs,
	Tab,
	Badge,
	Tooltip,
} from "@mui/material";
import {
	CheckCircle as SuccessIcon,
	Error as ErrorIcon,
	AccessTime as PendingIcon,
	Add as AddIcon,
	FilterAlt as FilterIcon,
	SettingsOutlined as SettingsIcon,
	Email as EmailIcon,
	Sms as SmsIcon,
	DateRange as CalendarIcon,
	Language as WebIcon,
	TableChart as SheetIcon,
	Facebook as FacebookIcon,
	SmartToy as AIIcon,
	Help as UnknownIcon,
} from "@mui/icons-material";
import { fetchLeadsByNodes } from "@/services/leadServices";
import { Lead, LeadStatus, Node } from "@/type";
import { format } from "date-fns";

interface LeadHistoryPanelProps {
	flowId: string | null | undefined;
	className?: string;
}

const LeadHistoryPanel: React.FC<LeadHistoryPanelProps> = ({
	flowId,
	className,
}) => {
	const [nodes, setNodes] = useState<Node[]>([]);
	const [allLeads, setAllLeads] = useState<Lead[]>([]);
	const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [selectedTab, setSelectedTab] = useState<number>(0);

	useEffect(() => {
		const fetchLeadHistory = async () => {
			if (!flowId) return;

			setLoading(true);
			try {
				const nodesData = await fetchLeadsByNodes(flowId);

				if (nodesData && Array.isArray(nodesData)) {
					setNodes(nodesData);

					const leads: Lead[] = [];
					nodesData.forEach((node) => {
						if (node.leads && Array.isArray(node.leads)) {
							leads.push(...node.leads);
						}
					});

					const sortedLeads = leads.sort(
						(a, b) =>
							new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
					);

					setAllLeads(sortedLeads);
					setFilteredLeads(sortedLeads.slice(0, 10)); // Show 10 most recent leads
				}
			} catch (error) {
				console.error("Error fetching lead history:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchLeadHistory();
	}, [flowId]);

	useEffect(() => {
		if (selectedTab === 0) {
			setFilteredLeads(allLeads.slice(0, 10));
		} else if (nodes[selectedTab - 1]) {
			const nodeLeads = nodes[selectedTab - 1].leads || [];
			setFilteredLeads(
				nodeLeads
					.sort(
						(a, b) =>
							new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
					)
					.slice(0, 10)
			);
		}
	}, [selectedTab, allLeads, nodes]);

	const getStatusInfo = (status: number) => {
		switch (status) {
			case LeadStatus.Success:
				return {
					icon: <SuccessIcon sx={{ color: "#10b981" }} />,
					color: "#10b981",
					label: "Successful",
				};
			case LeadStatus.Error:
				return {
					icon: <ErrorIcon sx={{ color: "#ef4444" }} />,
					color: "#ef4444",
					label: "Error",
				};
			case LeadStatus.InProgress:
			case LeadStatus.Processing:
				return {
					icon: <PendingIcon sx={{ color: "#f59e0b" }} />,
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
			return format(new Date(dateString), "MMM dd, HH:mm");
		} catch (e) {
			return "Invalid date";
		}
	};

	const getNodeColorByType = (type: string): string => {
		switch (type.toLowerCase()) {
			case "aicall":
				return "#10b981";
			case "facebookleadads":
				return "#1877F2";
			case "getsheetlead":
			case "exportsheetlead":
				return "#0F9D58";
			case "googlecalendar":
				return "#4285F4";
			case "email":
				return "#EA4335";
			case "sms":
				return "#FBBC05";
			default:
				return "#64748B";
		}
	};

	// Helper function to get node icon
	const getNodeIcon = (type: string) => {
		switch (type.toLowerCase()) {
			case "aicall":
				return <AIIcon fontSize="small" sx={{ fontSize: "14px" }} />;
			case "facebookleadads":
				return <FacebookIcon fontSize="small" sx={{ fontSize: "14px" }} />;
			case "getsheetlead":
			case "exportsheetlead":
				return <SheetIcon fontSize="small" sx={{ fontSize: "14px" }} />;
			case "googlecalendar":
				return <CalendarIcon fontSize="small" sx={{ fontSize: "14px" }} />;
			case "email":
				return <EmailIcon fontSize="small" sx={{ fontSize: "14px" }} />;
			case "sms":
				return <SmsIcon fontSize="small" sx={{ fontSize: "14px" }} />;
			case "sendwebhook":
				return <WebIcon fontSize="small" sx={{ fontSize: "14px" }} />;
			case "config":
				return <SettingsIcon fontSize="small" sx={{ fontSize: "14px" }} />;
			default:
				return <UnknownIcon fontSize="small" sx={{ fontSize: "14px" }} />;
		}
	};

	// Format node type name for display
	const formatNodeType = (nodeType: string): string => {
		if (!nodeType) return "Unknown";

		// Split by uppercase or underscore
		const parts = nodeType
			.split(/(?=[A-Z])|_/)
			.map(
				(part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
			);

		return parts.join(" ");
	};

	return (
		<Paper
			elevation={0}
			sx={{
				p: 2,
				borderRadius: 3,
				backdropFilter: "blur(16px)",
				background: (theme) =>
					`linear-gradient(145deg, ${alpha(
						theme.palette.background.paper,
						0.9
					)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
				overflow: "hidden",
				height: "100%",
				width: "100%",
				boxShadow: (theme) =>
					`0 10px 15px -3px ${alpha(
						theme.palette.mode === "dark" ? "#000" : "#64748b",
						0.08
					)}, 
          0 4px 6px -2px ${alpha(
						theme.palette.mode === "dark" ? "#000" : "#64748b",
						0.05
					)}`,
				border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.05)}`,
			}}
			className={className}
		>
			<Typography
				variant="h6"
				fontWeight="600"
				mb={1.5}
				sx={{
					fontSize: "1rem",
					color: (theme) => theme.palette.text.primary,
					letterSpacing: "-0.01em",
					textAlign: "center",
				}}
			>
				Lead Activity
			</Typography>

			{/* Filter tabs */}
			{nodes.length > 0 && (
				<Box sx={{ borderBottom: 1, borderColor: "divider", mb: 1 }}>
					<Tabs
						value={selectedTab}
						onChange={(_, newValue) => setSelectedTab(newValue)}
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
								<Badge
									badgeContent={allLeads.length}
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
									<Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
										All
									</Typography>
								</Badge>
							}
							sx={{ textTransform: "none" }}
						/>

						{nodes.map((node, index) => {
							const count = node.leads?.length || 0;
							const nodeColor = getNodeColorByType(node.type);

							return (
								<Tab
									key={node.id}
									label={
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
											<Box sx={{ display: "flex", alignItems: "center" }}>
												<Box
													sx={{
														width: 8,
														height: 8,
														borderRadius: "50%",
														bgcolor: nodeColor,
														mr: 0.75,
													}}
												/>
												<Typography
													variant="body2"
													sx={{ fontSize: "0.75rem" }}
												>
													{node.label || node.type}
												</Typography>
											</Box>
										</Badge>
									}
									sx={{ textTransform: "none" }}
								/>
							);
						})}
					</Tabs>
				</Box>
			)}

			{loading ? (
				<Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
					<CircularProgress size={28} />
				</Box>
			) : filteredLeads.length === 0 ? (
				<Box sx={{ textAlign: "center", my: 4, color: "text.secondary" }}>
					<Typography variant="body2">No lead activity yet</Typography>
				</Box>
			) : (
				<List sx={{ p: 0, maxHeight: 400, overflow: "auto" }}>
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
										primary={
											<Box
												sx={{ display: "flex", alignItems: "center", mb: 0.5 }}
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
											<>
												{/* Node type indicator */}
												<Tooltip
													title={`Node: ${lead.nodeId || "Unknown"}`}
													arrow
													placement="top"
												>
													<Chip
														icon={getNodeIcon(
															lead.nodeBase ||
																(lead.nodeId ? lead.nodeId.split("_")[0] : "")
														)}
														label={formatNodeType(
															lead.nodeBase ||
																(lead.nodeId ? lead.nodeId.split("_")[0] : "")
														)}
														size="small"
														sx={{
															height: 20,
															fontSize: "0.65rem",
															mb: 0.75,
															bgcolor: (theme) =>
																alpha(
																	getNodeColorByType(
																		lead.nodeBase ||
																			(lead.nodeId
																				? lead.nodeId.split("_")[0]
																				: "")
																	),
																	0.1
																),
															color: getNodeColorByType(
																lead.nodeBase ||
																	(lead.nodeId ? lead.nodeId.split("_")[0] : "")
															),
															borderColor: (theme) =>
																alpha(
																	getNodeColorByType(
																		lead.nodeBase ||
																			(lead.nodeId
																				? lead.nodeId.split("_")[0]
																				: "")
																	),
																	0.3
																),
															borderWidth: "1px",
															borderStyle: "solid",
															"& .MuiChip-icon": {
																color: getNodeColorByType(
																	lead.nodeBase ||
																		(lead.nodeId
																			? lead.nodeId.split("_")[0]
																			: "")
																),
																marginLeft: "3px",
																marginRight: "-4px",
															},
														}}
														variant="outlined"
													/>
												</Tooltip>

												<Typography
													component="span"
													variant="body2"
													color="text.secondary"
													sx={{ display: "block", fontSize: "0.75rem" }}
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
											</>
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
	);
};

export default LeadHistoryPanel;
