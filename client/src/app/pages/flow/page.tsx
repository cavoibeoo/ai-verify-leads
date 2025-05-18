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
