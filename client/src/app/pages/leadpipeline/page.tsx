"use client";

import { useEffect, useMemo, useState } from "react";
import Grid from "@mui/material/Grid";
import AddIcon from "@mui/icons-material/Add";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import ImportLeadContent from "./Importlead";
import {
	Box,
	CircularProgress,
	Typography,
	Paper,
	Breadcrumbs,
	Link,
	Divider,
	TextField,
	InputAdornment,
	Select,
	SelectChangeEvent,
	MenuItem,
	FormControl,
	InputLabel,
	Chip,
	IconButton,
	styled,
	alpha,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import {
	Column,
	Id,
	Lead,
	NodeType,
	NodeDisplay,
	LeadStatus,
	LeadVerification,
	Node,
} from "../../../type";
import ColumnContainer from "../../../components/LeadPipeline/ColumnContainer";
import {
	DndContext,
	DragEndEvent,
	DragOverlay,
	DragStartEvent,
	PointerSensor,
	useSensor,
	useSensors,
	closestCorners,
	DragCancelEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import { getLeads, fetchLeadsByNodes } from "../../../services/leadServices";
import { getNodeIcon, getNodeColor } from "@/utils/nodeUtils";
import { useFlow } from "@/context/FlowContext";
import FlowSelector from "@/components/common/FlowSelector";
import { getFlowById } from "../../../services/flowServices";

const nodeTypeMap: Record<string, NodeDisplay> = {
	[NodeType.InProgressLeads]: {
		title: "In Progress",
		color: "#00BCD4",
		icon: "config",
	},
	[NodeType.QualifiedLeads]: {
		title: "Qualified Leads",
		color: "#4CAF50",
		icon: "verified",
	},
	[NodeType.UnqualifiedLeads]: {
		title: "Unqualified Leads",
		color: "#FFC107",
		icon: "condition",
	},
	[NodeType.DeadLead]: {
		title: "Dead Leads",
		color: "#F44336",
		icon: "error",
	},
};

// Custom styled componentsF
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

const ColorChip = styled(Chip)(({ theme }) => ({
	borderRadius: "8px",
	fontWeight: 500,
	fontSize: "0.75rem",
	height: "24px",
}));

const IconBox = styled(Box)(({ theme }) => ({
	display: "inline-flex",
	alignItems: "center",
	justifyContent: "center",
	width: "40px",
	height: "40px",
	borderRadius: "8px",
	color: "white",
	marginRight: "12px",
}));

export default function LeadPipelinePage() {
	const [open, setOpen] = useState(false);
	const [columns, setColumns] = useState<Column[]>([]);
	const [leads, setLeads] = useState<Lead[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [filterType, setFilterType] = useState("all");
	const { selectedFlowId } = useFlow();

	const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);
	const [activeColumn, setActiveColumn] = useState<Column | null>(null);

	// Configure sensor with strict constraints
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 1,
				tolerance: 0,
				delay: 0,
			},
		})
	);

	// Prevent drag operations when dialogs are open
	useEffect(() => {
		if (typeof document !== "undefined") {
			const style = document.createElement("style");
			style.id = "dnd-disable-style";

			if (open) {
				style.innerHTML = `
					.column-header {
						cursor: default !important;
						pointer-events: none !important;
					}
					.dndkit-sortable-handle {
						cursor: default !important;
						pointer-events: none !important;
					}
				`;
				document.head.appendChild(style);
			} else {
				const existingStyle = document.getElementById("dnd-disable-style");
				if (existingStyle) {
					existingStyle.remove();
				}
			}

			return () => {
				const existingStyle = document.getElementById("dnd-disable-style");
				if (existingStyle) {
					existingStyle.remove();
				}
			};
		}
	}, [open]);

	const handleDragCancel = (event: DragCancelEvent) => {
		setActiveColumn(null);
	};

	const handleDragStart = (event: DragStartEvent) => {
		if (open) {
			return;
		}

		if (event.active.data.current?.type === "Column") {
			setActiveColumn(event.active.data.current.column);
		}
	};

	const onDragEnd = (event: DragEndEvent) => {
		setActiveColumn(null);

		const { active, over } = event;
		if (!over) return;

		const activeColumnId = active.id;
		const overColumnId = over.id;

		if (activeColumnId === overColumnId) return;

		setColumns((columns) => {
			const activeColumnIndex = columns.findIndex(
				(col) => col.id === activeColumnId
			);
			const overColumnIndex = columns.findIndex(
				(col) => col.id === overColumnId
			);

			return arrayMove(columns, activeColumnIndex, overColumnIndex);
		});
	};

	// Fetch leads data khi selected flow thay đổi
	useEffect(() => {
		const fetchLeadData = async () => {
			setLoading(true);
			setError(null);

			try {
				if (selectedFlowId) {
					// Sử dụng API getLeadByNodes nếu có flowId
					const data = await fetchLeadsByNodes(selectedFlowId);
					console.log("Fetched lead data by nodes:", data);
					createColumnsFromNodesData(data);
				} else {
					// Khi không có flow được chọn, không load dữ liệu
					setLeads([]);
					setColumns([]);
					setLoading(false);
				}
			} catch (err) {
				console.error("Error fetching leads:", err);
				setError("Failed to load leads. Please try again.");
			} finally {
				setLoading(false);
			}
		};

		fetchLeadData();
	}, [selectedFlowId, searchTerm, filterType]);

	// Tạo columns từ dữ liệu API node
	const createColumnsFromNodesData = (nodesData: Node[]) => {
		if (!nodesData || nodesData.length === 0) {
			setColumns([]);
			setLeads([]);
			return;
		}

		// Lọc leads theo search term
		const filteredNodesData = nodesData.map((node) => {
			if (!node.leads) return node;

			const filteredLeads = (node.leads || []).filter((lead: Lead) => {
				if (!searchTerm) return true;

				return (
					(lead.leadData?.full_name || "")
						.toLowerCase()
						.includes(searchTerm.toLowerCase()) ||
					(lead.leadData?.email || "")
						.toLowerCase()
						.includes(searchTerm.toLowerCase())
				);
			});

			return {
				...node,
				leads: filteredLeads,
			};
		});

		// Thu thập tất cả leads đã lọc
		const allLeads = filteredNodesData.reduce((acc: Lead[], node) => {
			return acc.concat(node.leads || []);
		}, []);

		setLeads(allLeads);

		// Tạo columns từ node data
		const newColumns: Column[] = filteredNodesData.map((node, index) => {
			const nodeConfig = nodeTypeMap[node.id] || {
				title: node.label || node.id,
				color: "#9E9E9E",
				icon: "default",
			};

			return {
				id: index + 1,
				title: nodeConfig.title,
				type: node.id,
				iconColor: nodeConfig.color,
				leads: node.leads || [],
			};
		});

		console.log("Created columns from nodes:", newColumns);
		setColumns(newColumns);
	};

	const handleRefresh = async () => {
		setLoading(true);
		try {
			if (selectedFlowId) {
				const data = await fetchLeadsByNodes(selectedFlowId);
				createColumnsFromNodesData(data);
			} else {
				// Khi không có flow được chọn, không refresh dữ liệu
				setLeads([]);
				setColumns([]);
			}
		} catch (err) {
			console.error("Error refreshing leads:", err);
			setError("Failed to refresh leads. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value);
	};

	const handleFilterChange = (event: SelectChangeEvent<string>) => {
		setFilterType(event.target.value);
	};

	const handleClickOpen = () => {
		setOpen(true);
	};

	const handleClose = () => {
		setOpen(false);
	};

	const generateId = () => {
		return Math.floor(Math.random() * 10001);
	};

	const deleteColumn = (id: Id) => {
		// Chỉ để hỗ trợ interface, không thực sự xóa cột do chúng đã tạo từ API
		console.log(
			"Delete column functionality is disabled for API-generated columns"
		);
	};

	// Lấy icon cho cột
	const getColumnIcon = (columnType: string | undefined) => {
		if (!columnType) return getNodeIcon("default");

		const nodeConfig = nodeTypeMap[columnType];

		if (nodeConfig) {
			return getNodeIcon(nodeConfig.icon);
		}

		// Fallback mapping
		switch (columnType) {
			case NodeType.InProgressLeads:
				return getNodeIcon("config");
			case NodeType.QualifiedLeads:
				return getNodeIcon("verified");
			case NodeType.UnqualifiedLeads:
				return getNodeIcon("condition");
			case NodeType.DeadLead:
				return getNodeIcon("error");
			default:
				return getNodeIcon("default");
		}
	};

	// Nội dung hiển thị khi chưa chọn flow
	const renderNoFlowSelected = () => (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				height: "400px",
				width: "100%",
			}}
		>
			<Paper
				elevation={0}
				sx={{
					p: 4,
					textAlign: "center",
					maxWidth: "600px",
					borderRadius: 3,
					border: "1px dashed #d0d0d0",
				}}
				className="lighter-bg"
			>
				<Typography variant="h5" gutterBottom fontWeight="bold">
					No Flow Selected
				</Typography>
				<Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
					Please select a flow from the dropdown above to view and manage leads.
					Each flow will show its specific leads organized by processing stages.
				</Typography>
			</Paper>
		</Box>
	);

	return (
		<>
			<Box sx={{ minHeight: "85vh" }}>
				<Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
					<Link
						underline="hover"
						color="inherit"
						href="/app/dashboard"
						sx={{ fontSize: "14px" }}
					>
						Dashboard
					</Link>
					<Typography color="text.primary" sx={{ fontSize: "14px" }}>
						Lead Pipeline
					</Typography>
				</Breadcrumbs>

				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<Typography
						variant="h5"
						sx={{
							fontWeight: 700,
							color: "text.primary",
						}}
					>
						Lead Pipeline
					</Typography>

					<Box sx={{ display: "flex", gap: 1.5 }}>
						<Button
							variant="outlined"
							color="primary"
							startIcon={<FileDownloadIcon />}
							sx={{
								textTransform: "none",
								borderRadius: "8px",
								fontWeight: "500",
								fontSize: "13px",
								py: "8px",
								px: "16px",
							}}
						>
							Export
						</Button>

						<Button
							variant="outlined"
							color="primary"
							startIcon={<FileUploadIcon />}
							sx={{
								textTransform: "none",
								borderRadius: "8px",
								fontWeight: "500",
								fontSize: "13px",
								py: "8px",
								px: "16px",
							}}
							onClick={handleClickOpen}
						>
							Import
						</Button>
					</Box>
				</Box>

				<Divider sx={{ mt: 3, mb: 3 }} />

				{/* Flow Selector */}
				<Paper
					elevation={0}
					sx={{
						p: 3,
						mb: 3,
						borderRadius: 2,
						backgroundColor: "background.paper",
						boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
					}}
					className="lighter-bg flow-selector"
				>
					<Box
						sx={{
							display: "flex",
							flexDirection: { xs: "column", md: "row" },
							gap: 2,
							alignItems: { xs: "flex-start", md: "center" },
							justifyContent: "space-between",
						}}
					>
						<Box>
							<Typography variant="h6" sx={{ mb: 0.5, fontWeight: 600 }}>
								Select Flow to View Leads
							</Typography>
							<Typography variant="body2" color="text.secondary">
								Lead pipeline data will be filtered according to the flow you
								choose.
							</Typography>
						</Box>

						<Box>
							<FlowSelector />
							{!loading && selectedFlowId && (
								<Box sx={{ mt: 1, textAlign: "right" }}>
									<Typography variant="caption" color="text.secondary">
										{`Showing ${leads.length} leads for selected flow`}
									</Typography>
								</Box>
							)}
						</Box>
					</Box>
				</Paper>

				<Paper elevation={0} sx={{ mb: 3 }} className={"lighter-bg"}>
					<Box
						sx={{
							borderTopRightRadius: "12px",
							borderTopLeftRadius: "12px",
							p: "16px 24px",
							overflow: "hidden",
						}}
						className={"flow-card-header"}
					>
						<Box sx={{ mt: 2, display: "flex", gap: 2 }}>
							{selectedFlowId && (
								<Box sx={{ display: "flex", flexDirection: "row" }}>
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
										placeholder="Search leads..."
										size="small"
										value={searchTerm}
										onChange={handleSearchChange}
										className="white-text"
										sx={{ minWidth: "250px" }}
									/>
								</Box>
							)}

							{/* Status indicator chips */}
							<Box
								sx={{
									display: "flex",
									gap: 1,
									alignItems: "center",
									ml: "auto",
								}}
							>
								{selectedFlowId && (
									<IconButton
										size="small"
										onClick={handleRefresh}
										title="Refresh leads"
									>
										<RefreshIcon />
									</IconButton>
								)}
							</Box>
						</Box>
					</Box>

					<Box
						sx={{
							p: 2,
							borderBottomLeftRadius: "12px",
							borderBottomRightRadius: "12px",
							overflow: "hidden",
						}}
						className={"lead-board-insight"}
					>
						{loading ? (
							<Box
								sx={{
									display: "flex",
									justifyContent: "center",
									alignItems: "center",
									height: "200px",
									width: "100%",
								}}
							>
								<CircularProgress />
							</Box>
						) : error ? (
							<Box
								sx={{
									display: "flex",
									justifyContent: "center",
									alignItems: "center",
									height: "200px",
									width: "100%",
								}}
							>
								<Typography color="error">{error}</Typography>
							</Box>
						) : !selectedFlowId ? (
							renderNoFlowSelected()
						) : columns.length === 0 ? (
							<Box
								sx={{
									display: "flex",
									flexDirection: "column",
									justifyContent: "center",
									alignItems: "center",
									height: "200px",
									width: "100%",
								}}
							>
								<Typography
									variant="body1"
									color="text.secondary"
									sx={{ mb: 1 }}
								>
									No columns available for this flow
								</Typography>
							</Box>
						) : (
							<DndContext
								sensors={sensors}
								onDragStart={handleDragStart}
								onDragEnd={onDragEnd}
								onDragCancel={handleDragCancel}
								collisionDetection={closestCorners}
							>
								<Box
									sx={{
										display: "flex",
										flexDirection: "column",
									}}
								>
									<Box
										style={{
											overflowX: "auto",
											overflowY: "hidden",
											width: "100%",
											padding: "8px 4px",
										}}
									>
										<Box
											display="flex"
											flexDirection="row"
											alignItems="flex-start"
											gap="20px"
											sx={{ pb: 2 }}
										>
											<SortableContext items={columnsId}>
												{columns.map((column) => (
													<ColumnContainer
														key={column.id}
														column={{
															...column,
															title: (
																<Box
																	sx={{ display: "flex", alignItems: "center" }}
																	className="column-header"
																>
																	<IconBox
																		sx={{
																			backgroundColor:
																				column.iconColor || "#9e9e9e",
																			width: 32,
																			height: 32,
																		}}
																	>
																		{getColumnIcon(column.type as string)}
																	</IconBox>
																	<Typography component="span" sx={{ ml: 1 }}>
																		{column.title}
																	</Typography>
																</Box>
															),
														}}
														deleteColumn={deleteColumn}
													/>
												))}
											</SortableContext>
										</Box>
									</Box>
								</Box>

								{typeof document !== "undefined" &&
									createPortal(
										<DragOverlay>
											{activeColumn && (
												<ColumnContainer
													column={{
														...activeColumn,
														title: (
															<Box
																sx={{ display: "flex", alignItems: "center" }}
																className="column-header"
															>
																<Typography component="span" sx={{ ml: 1 }}>
																	{activeColumn.title}
																</Typography>
															</Box>
														),
													}}
													deleteColumn={deleteColumn}
												/>
											)}
										</DragOverlay>,
										document.body
									)}
							</DndContext>
						)}
					</Box>
				</Paper>

				<Dialog
					open={open}
					onClose={handleClose}
					fullWidth
					maxWidth="lg"
					PaperProps={{
						sx: {
							borderRadius: "16px",
							boxShadow: "0px 24px 48px rgba(0, 0, 0, 0.2)",
						},
					}}
				>
					<DialogContent sx={{ p: 0 }}>
						<ImportLeadContent />
					</DialogContent>
				</Dialog>
			</Box>
		</>
	);
}
