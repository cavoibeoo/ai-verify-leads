"use client";

import React, { useState } from "react";
import {
	Card,
	CardContent,
	Box,
	Typography,
	Avatar,
	IconButton,
	Tooltip,
	Chip,
	Divider,
	Dialog,
	DialogContent,
	DialogTitle,
	DialogActions,
	Button,
	Grid,
	Paper,
} from "@mui/material";
import { Lead } from "../../type";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import BusinessIcon from "@mui/icons-material/Business";
import WorkIcon from "@mui/icons-material/Work";
import LanguageIcon from "@mui/icons-material/Language";
import ReplayIcon from "@mui/icons-material/Replay";
import { getLeadById } from "../../services/leadServices";
import { formatDistance } from "date-fns";
import { getNodeIcon, getNodeColor } from "@/utils/nodeUtils";
import { getSourceIcon, getSourceColor } from "@/utils/sourceUtils";

const getStatusColor = (status: number) => {
	switch (status) {
		case 1:
			return "#FF9800";
		case 2:
			return "#2196F3";
		case 3:
			return "#4CAF50";
		case 9:
			return "#10b981";
		default:
			return "#ff5252";
	}
};

const getStatusText = (status: number) => {
	switch (status) {
		case 1:
			return "Pending";
		case 2:
			return "In Progress";
		case 3:
			return "Success";
		case 9:
			return "Done";
		default:
			return "Error";
	}
};

const getVerificationStatusColor = (status: number) => {
	switch (status) {
		case 0:
			return "#9E9E9E"; // None - Gray
		case 1:
			return "#FF5722"; // Unqualified - Orange/Red
		case 2:
			return "#4CAF50"; // Qualified - Green
		default:
			return "#9E9E9E"; // Default - Gray
	}
};

const getVerificationStatusText = (status: number) => {
	switch (status) {
		case 0:
			return "Not Verified";
		case 1:
			return "Unqualified";
		case 2:
			return "Qualified";
		default:
			return "Unknown";
	}
};

const getInitials = (name: string) => {
	return name
		? name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.toUpperCase()
				.substring(0, 2)
		: "?";
};

const getRandomColor = (name: string) => {
	const colors = [
		"#F44336",
		"#E91E63",
		"#9C27B0",
		"#673AB7",
		"#3F51B5",
		"#2196F3",
		"#03A9F4",
		"#00BCD4",
		"#009688",
		"#4CAF50",
		"#8BC34A",
		"#CDDC39",
		"#FFC107",
		"#FF9800",
		"#FF5722",
	];
	const hash = name
		.split("")
		.reduce((acc, char) => acc + char.charCodeAt(0), 0);
	return colors[hash % colors.length];
};

// Kiểm tra nodeId để xác định loại node
const getNodeTypeFromId = (nodeId: string): string => {
	if (!nodeId) return "default";

	// Extract base node type from nodeId (email_123456 -> email)
	const basePart = nodeId.split("_")[0]?.toLowerCase() || nodeId.toLowerCase();

	// For debugging
	console.log("NodeID:", nodeId, "BasePart:", basePart);

	if (basePart.includes("email")) return "email";
	if (basePart.includes("sms")) return "sms";
	if (basePart.includes("facebook")) return "facebookLeadAds";
	if (basePart.includes("google") && basePart.includes("getSheetLead"))
		return "googleSheets";
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

	// If we get here, log the unknown type
	console.log("Unknown node type for nodeId:", nodeId);
	return "default";
};

// Lấy màu cho node
const getNodeColorFromType = (nodeType: string): string => {
	switch (nodeType) {
		case "email":
			return "#00BCD4";
		case "sms":
			return "#8BC34A";
		case "facebookLeadAds":
			return "#1877f2";
		case "googleSheets":
			return "#0F9D58";
		case "googleCalendar":
			return "#4285f4";
		case "sendWebhook":
			return "#8b5cf6";
		case "preVerify":
			return "#f59e0b";
		case "aiCall":
			return "#10b981";
		case "config":
			return "#795548";
		default:
			return "#9E9E9E";
	}
};

interface LeadCardProps {
	lead: Lead;
	onDelete?: (id: string) => void;
	onRetry?: (id: string) => void;
}

const LeadCard = ({ lead, onDelete, onRetry }: LeadCardProps) => {
	const [openDetails, setOpenDetails] = useState(false);
	const [detailedLead, setDetailedLead] = useState<Lead | null>(null);
	const [loading, setLoading] = useState(false);
	const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);

	const handleOpenDetails = async () => {
		setLoading(true);
		try {
			const leadDetails = await getLeadById(lead._id.toString());
			if (leadDetails) {
				setDetailedLead(leadDetails);
			} else {
				setDetailedLead(lead);
			}
		} catch (error) {
			console.error("Lỗi khi lấy chi tiết lead:", error);
			setDetailedLead(lead);
		} finally {
			setLoading(false);
			setOpenDetails(true);
		}
	};

	const handleCloseDetails = () => {
		setOpenDetails(false);
	};

	const handleOpenDeleteConfirm = (e: React.MouseEvent) => {
		e.stopPropagation();
		setOpenDeleteConfirm(true);
	};

	const handleCloseDeleteConfirm = () => {
		setOpenDeleteConfirm(false);
	};

	const handleConfirmDelete = () => {
		if (onDelete) {
			onDelete(lead._id.toString());
		}
		setOpenDeleteConfirm(false);
		if (openDetails) {
			setOpenDetails(false);
		}
	};
	const leadName = lead.leadData.full_name || "Unknown";
	const leadEmail = lead.leadData.email || "";
	const leadPhone = lead.leadData.phone || "";
	const leadCompany = lead.leadData.company_name || lead.leadData.company || "";
	const leadPosition = lead.leadData.job_title || lead.leadData.position || "";
	const leadWebsite = lead.leadData.website_link || lead.leadData.website || "";
	const timeAgo = formatDistance(new Date(lead.updatedAt), new Date(), {
		addSuffix: true,
	});

	// Xác định loại node dựa trên dữ liệu
	const nodeType = getNodeTypeFromId(lead.nodeId);
	const nodeColor = getNodeColorFromType(nodeType);

	const shouldShowRetryButton = () => {
		return (lead.error && lead.error.status) || lead.status === 2;
	};

	return (
		<>
			<Card
				sx={{
					mb: 1,
					borderRadius: 2,
					boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
					transition: "transform 0.2s, box-shadow 0.2s",
					"&:hover": {
						transform: "translateY(-3px)",
						boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
					},
					cursor: "pointer",
				}}
				onClick={handleOpenDetails}
				className={"card-lead"}
			>
				<CardContent>
					<Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
						<Box sx={{ display: "flex", alignItems: "center" }}>
							<Avatar
								sx={{
									bgcolor: getRandomColor(leadName),
									width: 40,
									height: 40,
								}}
							>
								{getInitials(leadName)}
							</Avatar>
							<Box sx={{ ml: 1.5 }}>
								<Typography
									variant="subtitle1"
									fontWeight="bold"
									noWrap
									sx={{
										maxWidth: 130,
										textOverflow: "ellipsis",
										overflow: "hidden",
									}}
								>
									{leadName}
								</Typography>

								{leadPosition && (
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 0.5,
											maxWidth: 130,
										}}
										className="position-label"
									>
										<WorkIcon fontSize="small" sx={{ flexShrink: 0 }} />
										<Typography
											variant="body2"
											component="span"
											sx={{
												overflow: "hidden",
												textOverflow: "ellipsis",
												whiteSpace: "nowrap",
											}}
										>
											{leadPosition}
										</Typography>
									</Box>
								)}
							</Box>
						</Box>
						<Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
							{/* Source Icon */}
							<Tooltip title={`Source: ${lead.source || "Unknown"}`}>
								<Box
									sx={{
										bgcolor: `${getSourceColor(lead.source || "")}20`,
										color: getSourceColor(lead.source || ""),
										width: 28,
										height: 28,
										borderRadius: "50%",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									{getSourceIcon(lead.source || "")}
								</Box>
							</Tooltip>

							{/* Node Type Icon */}
							<Tooltip title={`Current Node: ${nodeType}`}>
								<Box
									sx={{
										bgcolor: `${nodeColor}20`,
										color: nodeColor,
										width: 28,
										height: 28,
										borderRadius: "50%",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									{getNodeIcon(nodeType)}
								</Box>
							</Tooltip>
						</Box>
					</Box>

					<Divider sx={{ my: 1 }} />

					{leadCompany && (
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 0.5,
								my: 0.5,
							}}
						>
							<BusinessIcon fontSize="small" sx={{ color: "text.secondary" }} />
							<Typography variant="body2" noWrap>
								{leadCompany}
							</Typography>
						</Box>
					)}

					{leadEmail && (
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 0.5,
								my: 0.5,
							}}
						>
							<EmailIcon fontSize="small" sx={{ color: "text.secondary" }} />
							<Typography variant="body2" noWrap>
								{leadEmail}
							</Typography>
						</Box>
					)}

					{/* Modern verification status indicator */}
					{lead.isVerified && (
						<Box
							sx={{
								my: 1,
								py: 0.5,
								px: 1,
								borderRadius: "6px",
								backgroundColor: `${getVerificationStatusColor(
									lead.isVerified.status
								)}10`,
								border: `1px solid ${getVerificationStatusColor(
									lead.isVerified.status
								)}30`,
								display: "flex",
								alignItems: "center",
								gap: 1,
							}}
						>
							<Box
								sx={{
									width: 6,
									height: 6,
									borderRadius: "50%",
									bgcolor: getVerificationStatusColor(lead.isVerified.status),
									boxShadow: `0 0 0 2px ${getVerificationStatusColor(
										lead.isVerified.status
									)}20`,
								}}
							/>
							<Typography
								variant="caption"
								sx={{
									color: getVerificationStatusColor(lead.isVerified.status),
									fontWeight: 600,
									fontSize: "0.7rem",
									letterSpacing: "0.2px",
									whiteSpace: "nowrap",
									overflow: "hidden",
									textOverflow: "ellipsis",
								}}
							>
								{getVerificationStatusText(lead.isVerified.status)}
							</Typography>
						</Box>
					)}

					{/* Verification message if available */}
					{lead.isVerified && lead.isVerified.message && (
						<Box
							sx={{
								mt: -0.5,
								mb: 1,
								ml: 0.5,
							}}
						>
							<Typography
								variant="caption"
								sx={{
									color: `${getVerificationStatusColor(
										lead.isVerified.status
									)}99`, // 60% opacity of the status color
									fontSize: "0.7rem",
									display: "-webkit-box",
									WebkitLineClamp: 2,
									WebkitBoxOrient: "vertical",
									overflow: "hidden",
									lineHeight: 1.4,
								}}
							>
								{lead.isVerified.message}
							</Typography>
						</Box>
					)}

					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							mt: 1,
						}}
					>
						<Typography variant="caption" color="text.secondary">
							{timeAgo}
						</Typography>
						<Box sx={{ display: "flex", gap: 0.5 }}>
							{onRetry && shouldShowRetryButton() && (
								<Tooltip title="Retry processing">
									<IconButton
										size="small"
										color="primary"
										sx={{ bgcolor: "#e3f2fd" }}
										onClick={(e) => {
											e.stopPropagation();
											onRetry(lead._id.toString());
										}}
										className="retry-button"
									>
										<ReplayIcon fontSize="small" />
									</IconButton>
								</Tooltip>
							)}
							{onDelete && (
								<Tooltip title="Delete">
									<IconButton size="small" onClick={handleOpenDeleteConfirm}>
										<DeleteIcon fontSize="small" />
									</IconButton>
								</Tooltip>
							)}
						</Box>
					</Box>
				</CardContent>
			</Card>

			<Dialog
				open={openDetails}
				onClose={handleCloseDetails}
				maxWidth="md"
				fullWidth
				PaperProps={{
					sx: {
						borderRadius: "12px",
						boxShadow: "0px 24px 48px rgba(0, 0, 0, 0.2)",
						maxHeight: "90vh",
					},
				}}
			>
				<DialogTitle sx={{ p: "16px 24px" }} className="lead-info-dialog">
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<Avatar
							sx={{
								bgcolor: getRandomColor(leadName),
								width: 40,
								height: 40,
							}}
						>
							{getInitials(leadName)}
						</Avatar>
						<Box>
							<Typography variant="h6" sx={{ fontWeight: 600 }}>
								{leadName}
							</Typography>
						</Box>
						<Box
							sx={{ ml: "auto", display: "flex", gap: 1, alignItems: "center" }}
						>
							<Tooltip title={`Source: ${lead.source || "Unknown"}`}>
								<Box
									sx={{
										bgcolor: `${getSourceColor(lead.source || "")}20`,
										color: getSourceColor(lead.source || ""),
										width: 32,
										height: 32,
										borderRadius: "50%",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									{getSourceIcon(lead.source || "")}
								</Box>
							</Tooltip>

							<Tooltip title={`Current Node: ${nodeType}`}>
								<Box
									sx={{
										bgcolor: `${nodeColor}20`,
										color: nodeColor,
										width: 32,
										height: 32,
										borderRadius: "50%",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									{getNodeIcon(nodeType)}
								</Box>
							</Tooltip>
						</Box>
					</Box>
				</DialogTitle>
				<DialogContent dividers sx={{ p: 0 }}>
					{loading ? (
						<Box sx={{ textAlign: "center", py: 3 }}>
							<Typography>Loading lead details...</Typography>
						</Box>
					) : (
						<Box sx={{ p: 3 }} className="column-header">
							<Grid container spacing={3}>
								<Grid item xs={12} md={6}>
									<Paper
										elevation={0}
										sx={{
											p: 2.5,
											height: "100%",
											borderRadius: "12px",
											border: "1px solid #E5E7EB",
										}}
										className="column-header"
									>
										<Typography
											variant="subtitle1"
											color="text.primary"
											fontWeight={600}
											gutterBottom
										>
											Contact Information
										</Typography>
										<Box sx={{ mt: 2 }}>
											{leadEmail && (
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														gap: 1.5,
														mb: 2,
													}}
												>
													<Avatar
														sx={{
															bgcolor: "#E3F2FD",
															width: 36,
															height: 36,
														}}
													>
														<EmailIcon
															fontSize="small"
															sx={{ color: "#2196F3" }}
														/>
													</Avatar>
													<Box>
														<Typography
															variant="caption"
															color="text.secondary"
														>
															Email
														</Typography>
														<Typography
															variant="body2"
															sx={{ wordBreak: "break-word" }}
														>
															{leadEmail}
														</Typography>
													</Box>
												</Box>
											)}
											{leadPhone && (
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														gap: 1.5,
														mb: 2,
													}}
												>
													<Avatar
														sx={{
															bgcolor: "#E8F5E9",
															width: 36,
															height: 36,
														}}
													>
														<PhoneIcon
															fontSize="small"
															sx={{ color: "#4CAF50" }}
														/>
													</Avatar>
													<Box>
														<Typography
															variant="caption"
															color="text.secondary"
														>
															Phone
														</Typography>
														<Typography variant="body2">{leadPhone}</Typography>
													</Box>
												</Box>
											)}
											{leadWebsite && (
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														gap: 1.5,
													}}
												>
													<Avatar
														sx={{
															bgcolor: "#FFF3E0",
															width: 36,
															height: 36,
														}}
													>
														<LanguageIcon
															fontSize="small"
															sx={{ color: "#FF9800" }}
														/>
													</Avatar>
													<Box>
														<Typography
															variant="caption"
															color="text.secondary"
														>
															Website
														</Typography>
														<Typography variant="body2">
															<a
																href={
																	leadWebsite.startsWith("http")
																		? leadWebsite
																		: `https://${leadWebsite}`
																}
																target="_blank"
																rel="noopener noreferrer"
																style={{
																	textDecoration: "none",
																	color: "#2065D1",
																}}
															>
																{leadWebsite}
															</a>
														</Typography>
													</Box>
												</Box>
											)}
										</Box>
									</Paper>
								</Grid>
								<Grid item xs={12} md={6}>
									<Paper
										elevation={0}
										sx={{
											p: 2.5,
											height: "100%",
											borderRadius: "12px",
											border: "1px solid #E5E7EB",
										}}
										className="column-header"
									>
										<Typography
											variant="subtitle1"
											color="text.primary"
											fontWeight={600}
											gutterBottom
										>
											Company Information
										</Typography>
										<Box sx={{ mt: 2 }}>
											{leadCompany && (
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														gap: 1.5,
														mb: 2,
													}}
												>
													<Avatar
														sx={{
															bgcolor: "#EDE7F6",
															width: 36,
															height: 36,
														}}
													>
														<BusinessIcon
															fontSize="small"
															sx={{ color: "#673AB7" }}
														/>
													</Avatar>
													<Box>
														<Typography
															variant="caption"
															color="text.secondary"
														>
															Company
														</Typography>
														<Typography variant="body2">
															{leadCompany}
														</Typography>
													</Box>
												</Box>
											)}
											{leadPosition && (
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														gap: 1.5,
													}}
												>
													<Avatar
														sx={{
															bgcolor: "#FFEBEE",
															width: 36,
															height: 36,
														}}
													>
														<WorkIcon
															fontSize="small"
															sx={{ color: "#F44336" }}
														/>
													</Avatar>
													<Box>
														<Typography
															variant="caption"
															color="text.secondary"
														>
															Position
														</Typography>
														<Typography variant="body2">
															{leadPosition}
														</Typography>
													</Box>
												</Box>
											)}
										</Box>
									</Paper>
								</Grid>
							</Grid>

							{detailedLead?.leadData.transcript && (
								<Paper
									elevation={0}
									sx={{
										mt: 3,
										p: 2.5,
										borderRadius: "12px",
										border: "1px solid #E5E7EB",
									}}
									className="column-header"
								>
									<Typography
										variant="subtitle1"
										color="text.primary"
										fontWeight={600}
										gutterBottom
									>
										Transcript
									</Typography>
									<Box
										sx={{
											mt: 2,
											p: 2,
											bgcolor: "#FAFAFA",
											borderRadius: 1,
											border: "1px solid #EEEEEE",
											maxHeight: "200px",
											overflow: "auto",
										}}
										className="transcript-bg"
									>
										<Typography
											variant="body2"
											whiteSpace="pre-line"
											sx={{ fontSize: "13px", color: "#424242" }}
											className="white-text"
										>
											{detailedLead.leadData.transcript}
										</Typography>
									</Box>
								</Paper>
							)}

							<Paper
								elevation={0}
								sx={{
									mt: 3,
									p: 2.5,
									borderRadius: "12px",
									border: "1px solid #E5E7EB",
								}}
								className="column-header"
							>
								<Typography
									variant="subtitle1"
									color="text.primary"
									fontWeight={600}
									gutterBottom
								>
									System Information
								</Typography>
								<Grid container spacing={2} sx={{ mt: 0.5 }}>
									<Grid item xs={12} sm={6} md={4}>
										<Box sx={{ mb: 2 }}>
											<Typography variant="caption" color="text.secondary">
												Lead ID
											</Typography>
											<Typography
												variant="body2"
												sx={{ wordBreak: "break-all" }}
											>
												{lead._id}
											</Typography>
										</Box>
									</Grid>
									<Grid item xs={12} sm={6} md={4}>
										<Box sx={{ mb: 2 }}>
											<Typography variant="caption" color="text.secondary">
												Flow ID
											</Typography>
											<Typography
												variant="body2"
												sx={{ wordBreak: "break-all" }}
											>
												{lead.flowId}
											</Typography>
										</Box>
									</Grid>
									<Grid item xs={12} sm={6} md={4}>
										<Box sx={{ mb: 2 }}>
											<Typography variant="caption" color="text.secondary">
												Node ID
											</Typography>
											<Typography
												variant="body2"
												sx={{ wordBreak: "break-all" }}
											>
												{lead.nodeId}
											</Typography>
										</Box>
									</Grid>
									<Grid item xs={12} sm={6} md={4}>
										<Box sx={{ mb: 2 }}>
											<Typography variant="caption" color="text.secondary">
												Status
											</Typography>
											<Typography variant="body2">
												{getStatusText(lead.status)} ({lead.status})
											</Typography>
										</Box>
									</Grid>
									<Grid item xs={12} sm={6} md={4}>
										<Box sx={{ mb: 2 }}>
											<Typography variant="caption" color="text.secondary">
												Created At
											</Typography>
											<Typography variant="body2">
												{new Date(lead.createdAt).toLocaleString()}
											</Typography>
										</Box>
									</Grid>
									<Grid item xs={12} sm={6} md={4}>
										<Box sx={{ mb: 2 }}>
											<Typography variant="caption" color="text.secondary">
												Updated At
											</Typography>
											<Typography variant="body2">
												{new Date(lead.updatedAt).toLocaleString()}
											</Typography>
										</Box>
									</Grid>
								</Grid>
							</Paper>

							{lead.isVerified && lead.isVerified.status > 0 && (
								<Paper
									elevation={0}
									sx={{
										mt: 3,
										p: 2.5,
										borderRadius: "12px",
										border: `1px solid ${
											lead.isVerified.status === 2 ? "#C8E6C9" : "#FFCCBC"
										}`,
										bgcolor:
											lead.isVerified.status === 2 ? "#F1F8E9" : "#FBE9E7",
									}}
									className="column-header"
								>
									<Typography
										variant="subtitle1"
										color={
											lead.isVerified.status === 2
												? "success.main"
												: "warning.main"
										}
										fontWeight={600}
										gutterBottom
									>
										Verification Information
									</Typography>
									<Box sx={{ mt: 1 }}>
										<Typography variant="body2">
											Status:{" "}
											{getVerificationStatusText(lead.isVerified.status)}
										</Typography>
										{lead.isVerified.message && (
											<Typography variant="body2" sx={{ mt: 1 }}>
												Message: {lead.isVerified.message}
											</Typography>
										)}
									</Box>
								</Paper>
							)}

							{lead.error && lead.error.status && (
								<Paper
									elevation={0}
									sx={{
										mt: 3,
										p: 2.5,
										borderRadius: "12px",
										border: "1px solid #FFCDD2",
										bgcolor: "#FFF5F5",
									}}
									className="column-header"
								>
									<Typography
										variant="subtitle1"
										color="error"
										fontWeight={600}
										gutterBottom
									>
										Error Information
									</Typography>
									<Box sx={{ mt: 1 }}>
										<Typography variant="body2">
											Error Status: {lead.error.status ? "Yes" : "No"}
										</Typography>
										<Typography variant="body2">
											Retry Count: {lead.error.retryCount}
										</Typography>
										{lead.error.message && (
											<Typography variant="body2">
												Message: {lead.error.message}
											</Typography>
										)}
									</Box>
								</Paper>
							)}
						</Box>
					)}
				</DialogContent>
				<DialogActions sx={{ p: 2 }} className="column-header">
					<Typography
						variant="caption"
						color="text.secondary"
						sx={{ marginRight: "auto", marginLeft: "10px" }}
					>
						Updated {timeAgo}
					</Typography>
					{onRetry && shouldShowRetryButton() && (
						<Button
							startIcon={<ReplayIcon />}
							onClick={() => {
								onRetry(lead._id.toString());
								handleCloseDetails();
							}}
							color="primary"
							variant="outlined"
							sx={{
								textTransform: "none",
								borderRadius: "8px",
								fontWeight: "500",
								mr: 1,
							}}
						>
							Retry Processing
						</Button>
					)}
					{onDelete && (
						<Button
							startIcon={<DeleteIcon />}
							onClick={handleOpenDeleteConfirm}
							color="error"
							variant="outlined"
							sx={{
								textTransform: "none",
								borderRadius: "8px",
								fontWeight: "500",
							}}
						>
							Delete
						</Button>
					)}
					<Button
						onClick={handleCloseDetails}
						sx={{
							textTransform: "none",
							borderRadius: "8px",
							fontWeight: "500",
						}}
					>
						Close
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog
				open={openDeleteConfirm}
				onClose={handleCloseDeleteConfirm}
				aria-labelledby="alert-dialog-title"
				aria-describedby="alert-dialog-description"
				PaperProps={{
					sx: {
						borderRadius: "12px",
						boxShadow: "0px 12px 24px rgba(0, 0, 0, 0.2)",
					},
				}}
			>
				<DialogTitle id="alert-dialog-title" sx={{ fontWeight: 600 }}>
					Delete Confirmation
				</DialogTitle>
				<DialogContent>
					<Typography>
						Are you sure you want to delete lead <strong>{leadName}</strong>?
						<br />
						This action cannot be undone.
					</Typography>
				</DialogContent>
				<DialogActions sx={{ p: 2 }}>
					<Button
						onClick={handleCloseDeleteConfirm}
						sx={{
							textTransform: "none",
							borderRadius: "8px",
							fontWeight: "500",
						}}
					>
						Cancel
					</Button>
					<Button
						onClick={handleConfirmDelete}
						color="error"
						variant="contained"
						autoFocus
						sx={{
							textTransform: "none",
							borderRadius: "8px",
							fontWeight: "500",
						}}
					>
						Delete
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

export default LeadCard;
