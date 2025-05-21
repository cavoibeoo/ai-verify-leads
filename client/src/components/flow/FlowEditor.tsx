import React, { useState, useCallback, useRef, useEffect } from "react";
import {
	ReactFlow,
	ReactFlowProvider,
	MiniMap,
	Controls,
	Background,
	useNodesState,
	useEdgesState,
	addEdge,
	Panel,
	Connection,
	Edge,
	Node,
	useReactFlow,
	MarkerType,
	ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "@/styles/reactflow-theme.css"; // Import custom theme
import {
	Box,
	CssBaseline,
	LinearProgress,
	ThemeProvider,
	createTheme,
	Paper,
	Typography,
	CircularProgress,
	Backdrop,
	Snackbar,
	Alert,
	IconButton,
	Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import {
	Map as MapIcon,
	VisibilityOff,
	DarkMode as DarkModeIcon,
	LightMode as LightModeIcon,
	Assessment as AssessmentIcon,
	History as HistoryIcon,
} from "@mui/icons-material";

import Sidebar from "./Sidebar";
import PropertiesPanel from "./PropertiesPanel";
import CustomEdge from "./edges/CustomEdge";
import FlowToolbar from "./FlowToolbar";
import LeadAnalyticsChart from "./LeadAnalyticsChart";
import LeadHistoryPanel from "./LeadHistoryPanel";
import {
	AICallNode,
	CalendarNode,
	WebhookNode,
	ConditionNode,
	EmailNode,
	SMSNode,
	ConfigNode,
	ErrorNode,
	FacebookLeadAdsNode,
	SheetImportNode,
	SheetExportNode,
} from "./nodes/NodeTypes";
import { CustomEdgeData } from "./edges/CustomEdge";
import {
	getFlowById,
	createFlow,
	updateFlow,
	toggleFlowStatus,
} from "@/services/flowServices";
import { useTheme } from "@/context/ThemeContext";

// Define MUI themes
const getLightTheme = () =>
	createTheme({
		palette: {
			mode: "light",
			primary: {
				main: "#3b82f6",
			},
			secondary: {
				main: "#10b981",
			},
			error: {
				main: "#ef4444",
			},
			warning: {
				main: "#f59e0b",
			},
			info: {
				main: "#6366f1",
			},
			success: {
				main: "#22c55e",
			},
		},
	});

const getDarkTheme = () =>
	createTheme({
		palette: {
			mode: "dark",
			primary: {
				main: "#60a5fa",
			},
			secondary: {
				main: "#34d399",
			},
			error: {
				main: "#f87171",
			},
			warning: {
				main: "#fbbf24",
			},
			info: {
				main: "#818cf8",
			},
			success: {
				main: "#4ade80",
			},
			background: {
				default: "#1e293b",
				paper: "#334155",
			},
			text: {
				primary: "#f1f5f9",
				secondary: "#cbd5e1",
			},
		},
	});

// Define node types
const nodeTypes = {
	getSheetLead: SheetImportNode,
	exportSheetLead: SheetExportNode,
	facebookLeadAds: FacebookLeadAdsNode,
	aiCall: AICallNode,
	googleCalendar: CalendarNode,
	sendWebhook: WebhookNode,
	condition: ConditionNode,
	preVerify: ConditionNode,
	email: EmailNode,
	sms: SMSNode,
	config: ConfigNode,
	error: ErrorNode,
};

// Define edge types
const edgeTypes = {
	custom: CustomEdge,
};

const defaultEdgeOptions = {
	type: "custom",
	markerEnd: {
		type: MarkerType.ArrowClosed,
		width: 20,
		height: 20,
	},
	animated: true,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

interface FlowData {
	nodes: Node[];
	edges: Edge[];
}

interface FlowEditorProps {
	flowId: string | null;
}

const FlowEditorContent: React.FC<FlowEditorProps> = ({ flowId }) => {
	const reactFlowWrapper = useRef<HTMLDivElement>(null);
	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
	const [selectedNode, setSelectedNode] = useState<Node | null>(null);
	const [reactFlowInstance, setReactFlowInstance] =
		useState<ReactFlowInstance | null>(null);
	const [showPropertiesPanel, setShowPropertiesPanel] =
		useState<boolean>(false);
	const [loading, setLoading] = useState<boolean>(false);
	const [flowName, setFlowName] = useState<string>("Untitled Flow");
	const [flowStatus, setFlowStatus] = useState<number>(1); // Default to disabled
	const [showMiniMap, setShowMiniMap] = useState<boolean>(true);
	const [showAnalytics, setShowAnalytics] = useState<boolean>(false);
	const [showLeadHistory, setShowLeadHistory] = useState<boolean>(false);

	const fetchFlowData = useCallback(async () => {
		if (!flowId) return;

		try {
			setLoading(true);
			const data = await getFlowById(flowId);

			if (data) {
				setFlowName(data.name);
				setFlowStatus(data.status);

				if (data.nodeData?.nodes) {
					const processedNodes = data.nodeData.nodes.map((node: any) => {
						return {
							...node,
						};
					});
					setNodes(processedNodes);
				}

				if (data.nodeData?.edges) {
					const processedEdges = data.nodeData.edges.map((edge: any) => {
						return {
							...edge,
							type: "custom",
						};
					});
					setEdges(processedEdges);
				}
			}
		} catch (error) {
		} finally {
			setLoading(false);
		}
	}, [flowId, setEdges, setNodes]);

	const handleToggleStatus = async () => {
		if (!flowId) return;

		try {
			setLoading(true);
			const result = await toggleFlowStatus(flowId, flowStatus);

			if (result && !result.error) {
				setFlowStatus(flowStatus === 2 ? 1 : 2);
			}
		} catch (error) {
			console.error("Error toggling flow status:", error);
		} finally {
			setLoading(false);
		}
	};

	const onDragOver = useCallback((event: React.DragEvent) => {
		event.preventDefault();
		event.dataTransfer.dropEffect = "move";
	}, []);

	const onDrop = useCallback(
		(event: React.DragEvent) => {
			event.preventDefault();

			const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
			const type = event.dataTransfer.getData("application/reactflow");

			if (
				typeof type === "undefined" ||
				!type ||
				!reactFlowBounds ||
				!reactFlowInstance
			) {
				return;
			}

			const position = reactFlowInstance.screenToFlowPosition({
				x: event.clientX - reactFlowBounds.left,
				y: event.clientY - reactFlowBounds.top,
			});

			const id = `${type}_${Date.now()}`;

			const newNode: Node = {
				id,
				type,
				position,
				data: {
					label: getNodeLabel(type),
					description: getNodeDescription(type),
					settings: {},
				},
			};

			setNodes((nds) => nds.concat(newNode));
		},
		[reactFlowInstance, setNodes]
	);

	// Helper function to get node label based on type
	const getNodeLabel = (type: string): string => {
		switch (type) {
			case "googleSheets":
				return "Google Sheets";
			case "getSheetLead":
				return "Sheet Import";
			case "exportSheetLead":
				return "Sheet Export";
			case "facebookLeadAds":
				return "Facebook Lead Ads";
			case "aiCall":
				return "AI Call";
			case "googleCalendar":
				return "Google Calendar";
			case "sendWebhook":
				return "Send to webhook";
			case "condition":
				return "Condition";
			case "preVerify":
				return "Pre-Verify";
			case "email":
				return "Send Email";
			case "sms":
				return "Send SMS";
			case "config":
				return "Configuration";
			case "error":
				return "Error Handler";
			default:
				console.warn(`Unknown node type: ${type}`);
				return type || "Unknown Node";
		}
	};

	// Helper function to get node description based on type
	const getNodeDescription = (type: string): string => {
		switch (type) {
			case "googleSheets":
				return "Import leads from Google Sheets";
			case "getSheetLead":
				return "Import leads from Sheet files";
			case "exportSheetLead":
				return "Export leads to Sheet files";
			case "facebookLeadAds":
				return "Import leads from Facebook Lead Ads";
			case "aiCall":
				return "Process data with AI";
			case "googleCalendar":
				return "Schedule appointments";
			case "sendWebhook":
				return "Send lead data to a webhook";
			case "condition":
				return "Branch based on conditions";
			case "preVerify":
				return "Pre-verify leads before processing";
			case "email":
				return "Send email notification";
			case "sms":
				return "Send SMS notification";
			case "config":
				return "Configure flow settings";
			case "error":
				return "Handle errors in the flow";
			default:
				return `Node type: ${type}`;
		}
	};

	const onConnect = useCallback(
		(params: Connection) => {
			const newEdgeId = `e_${params.source}_${params.target}_${Date.now()}`;
			const sourceNodeId = params.source?.split("_")[0].toLowerCase();

			const isMultiOutputNode =
				sourceNodeId === "condition" ||
				sourceNodeId === "preverify" ||
				sourceNodeId === "aicall";

			let edgeLabel = "";
			if (isMultiOutputNode) {
				if (params.sourceHandle === "output-0") {
					edgeLabel = "success";
				} else if (params.sourceHandle === "output-1") {
					edgeLabel = "fail";
				}
			}

			// Tạo edge mới với CustomEdgeData
			const newEdge: Edge<CustomEdgeData> = {
				...params,
				id: newEdgeId,
				data: {
					label: edgeLabel,
				},
			};

			setEdges((eds) => {
				let filteredEdges = [...eds];

				if (isMultiOutputNode) {
					// Đối với node có nhiều đầu ra, chỉ xóa các cạnh có cùng sourceHandle
					// Điều này cho phép mỗi đầu ra của node có một kết nối duy nhất
					filteredEdges = filteredEdges.filter(
						(edge) =>
							!(
								edge.source === params.source &&
								edge.sourceHandle === params.sourceHandle
							)
					);
				} else {
					// Đối với các node khác, xóa tất cả kết nối từ source node
					filteredEdges = filteredEdges.filter(
						(edge) => edge.source !== params.source
					);
				}

				// Luôn xóa kết nối đến target node
				filteredEdges = filteredEdges.filter(
					(edge) => edge.target !== params.target
				);

				// Thêm edge mới vào danh sách đã lọc
				return [...filteredEdges, newEdge];
			});
		},
		[setEdges]
	);

	// Handle node selection
	const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
		setSelectedNode(node);
		setShowPropertiesPanel(true);
	}, []);

	// Handle background click (deselect nodes)
	const onPaneClick = useCallback(() => {
		setSelectedNode(null);
		setShowPropertiesPanel(false);
	}, []);

	// Update node data when properties change
	const onNodeDataChange = useCallback(
		(id: string, data: any) => {
			setNodes((nds) =>
				nds.map((node) => {
					if (node.id === id) {
						return { ...node, data: { ...data } };
					}
					return node;
				})
			);
		},
		[setNodes]
	);

	// Handle drag start from sidebar
	const onDragStart = (event: React.DragEvent, nodeType: string) => {
		event.dataTransfer.setData("application/reactflow", nodeType);
		event.dataTransfer.effectAllowed = "move";
	};

	// Xử lý đổi tên flow
	const handleRenameFlow = (newName: string) => {
		setFlowName(newName);

		// Cập nhật tên flow nếu đã có flowId
		if (flowId) {
			setLoading(true);
			const flowUpdateData = {
				flowName: newName,
				nodeData: reactFlowInstance ? reactFlowInstance.toObject() : {},
			};

			updateFlow(flowId, flowUpdateData)
				.then((response) => {
					console.log("Flow đã được đổi tên thành công:", response);
				})
				.catch((error) => {
					console.error("Error updating flow name:", error);
				})
				.finally(() => {
					setLoading(false);
				});
		}
	};

	// Save the current flow
	const onSave = useCallback(() => {
		if (reactFlowInstance) {
			setLoading(true);
			let flowData = reactFlowInstance.toObject();

			// Khởi tạo giá trị mặc định cho các node chưa có settings
			const updatedNodes = flowData.nodes.map((node: any) => {
				// Nếu node chưa có settings hoặc settings rỗng
				if (
					!node.data?.settings ||
					Object.keys(node.data.settings).length === 0
				) {
					let defaultSettings = {};

					// Thiết lập giá trị mặc định tùy theo loại node
					switch (node.type) {
						case "aiCall":
							defaultSettings = {
								language: "english",
								prompt: "",
								introduction: "",
								questions: [""],
								goodByeMessage: "",
							};
							break;
						case "googleCalendar":
							defaultSettings = {
								calendarName: "",
								eventName: "",
								startWorkDays: 0,
								endWorkDays: 4,
								startTime: "09:00",
								endTime: "17:00",
								duration: 30,
							};
							break;
						case "getSheetLead":
							defaultSettings = {
								sheetUrl: "",
								connection: "",
							};
							break;
						case "exportSheetLead":
							defaultSettings = {
								sheetUrl: "",
								connection: "",
							};
							break;
						case "preVerify":
							defaultSettings = {
								enableWebScraping: false,
								webScrapingPrompt: "",
								criteria: [
									{
										field: "email",
										type: "email",
										operator: "isValid",
										value: "",
									},
									{
										field: "phone",
										type: "phone",
										operator: "isValid",
										value: "",
									},
								],
							};
							break;
						case "facebookLeadAds":
							defaultSettings = {
								connection: "",
								pageId: "",
								formId: "",
							};
							break;
						case "sendWebhook":
							defaultSettings = {
								webhookUrl: "",
								method: "POST",
								headers: "{}",
								timeout: 30,
								retryCount: 3,
							};
							break;
						default:
							// Không có giá trị mặc định cho các loại node khác
							break;
					}

					// Chỉ cập nhật settings nếu có giá trị mặc định
					if (Object.keys(defaultSettings).length > 0) {
						return {
							...node,
							data: {
								...node.data,
								settings: defaultSettings,
							},
						};
					}
				}
				return node;
			});

			// Cập nhật flowData với các nodes đã được cập nhật settings
			flowData = {
				...flowData,
				nodes: updatedNodes,
			};

			localStorage.setItem("flow-data", JSON.stringify(flowData));

			// Lưu flow vào cơ sở dữ liệu
			if (flowId) {
				// Cập nhật flow hiện tại
				const flowUpdateData = {
					flowName: flowName,
					nodeData: flowData,
				};

				updateFlow(flowId, flowUpdateData)
					.then((response) => {
						console.log("Flow updated successfully:", response);
					})
					.catch((error) => {
						console.error("Error updating flow:", error);
					})
					.finally(() => {
						setLoading(false);
					});
			} else {
				const newFlowData = {
					name: flowName,
					nodeData: flowData,
				};

				createFlow(newFlowData)
					.then((response) => {
						console.log("Flow created successfully:", response);
						// Redirect to the flow editor with the new flow ID
						if (response && response._id) {
							window.location.href = `/pages/customflow?id=${response._id}`;
						}
					})
					.catch((error) => {
						console.error("Error creating flow:", error);
					})
					.finally(() => {
						setLoading(false);
					});
			}
		}
	}, [reactFlowInstance, flowId, flowName]);

	const onLoad = useCallback(() => {
		const savedFlow = localStorage.getItem("flow-data");
		if (savedFlow) {
			try {
				const flowData = JSON.parse(savedFlow) as FlowData;

				const typedEdges = flowData.edges.map((edge) => {
					return {
						...edge,
						data: edge.data || { label: "Connection" },
					} as Edge<CustomEdgeData>;
				});

				setNodes(flowData.nodes);
				setEdges(typedEdges);
			} catch (error) {
				console.error("Error loading flow:", error);
			}
		} else {
		}
	}, [setNodes, setEdges]);

	// Export flow as JSON
	const onExport = useCallback(() => {
		if (reactFlowInstance) {
			const flowData = reactFlowInstance.toObject();
			const jsonString = JSON.stringify(flowData, null, 2);
			const blob = new Blob([jsonString], { type: "application/json" });
			const url = URL.createObjectURL(blob);

			const link = document.createElement("a");
			link.href = url;
			link.download = "flow-export.json";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	}, [reactFlowInstance]);

	const onClear = useCallback(() => {
		setNodes([]);
		setEdges([]);
		setSelectedNode(null);
		setShowPropertiesPanel(false);
	}, [setNodes, setEdges]);

	const toggleMiniMap = () => {
		setShowMiniMap(!showMiniMap);
	};

	const toggleAnalytics = () => {
		setShowAnalytics(!showAnalytics);
		if (!showAnalytics) setShowLeadHistory(false); // Close lead history when opening analytics
	};

	const toggleLeadHistory = () => {
		setShowLeadHistory(!showLeadHistory);
		if (!showLeadHistory) setShowAnalytics(false); // Close analytics when opening lead history
	};

	useEffect(() => {
		fetchFlowData();
	}, [fetchFlowData]);

	return (
		<Box
			sx={{
				width: "100%",
				height: "100vh",
				display: "flex",
				position: "relative",
				overflow: "hidden",
			}}
		>
			<Sidebar onDragStart={onDragStart} />

			<Box ref={reactFlowWrapper} sx={{ flexGrow: 1, height: "100%" }}>
				<ReactFlow
					nodes={nodes}
					edges={edges}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onConnect={onConnect}
					onInit={setReactFlowInstance}
					onDrop={onDrop}
					onDragOver={onDragOver}
					onNodeClick={onNodeClick}
					onPaneClick={onPaneClick}
					nodeTypes={nodeTypes}
					edgeTypes={edgeTypes}
					defaultEdgeOptions={defaultEdgeOptions}
					fitView
					snapToGrid
					snapGrid={[10, 10]}
					attributionPosition="bottom-left"
					proOptions={{ hideAttribution: true }}
				>
					<Background gap={20} size={1.5} color="#e2e8f0" />
					<Controls
						position="bottom-right"
						style={{
							marginBottom: 20,
							marginRight: 20,
							padding: 5,
							borderRadius: 12,
						}}
					/>

					{showMiniMap && (
						<MiniMap
							nodeStrokeWidth={3}
							nodeColor={(node) => {
								switch (node.type) {
									case "googleSheets":
										return "#0F9D58";
									case "getSheetLead":
										return "#16a34a"; // Green
									case "exportSheetLead":
										return "#217346"; // Excel green
									case "facebookLeadAds":
										return "#1877f2";
									case "aiCall":
										return "#10b981";
									case "googleCalendar":
										return "#4285f4";
									case "sendWebhook":
										return "#8b5cf6";
									case "preVerify":
										return "#f59e0b";
									default:
										return "#9E9E9E";
								}
							}}
							style={{
								marginBottom: 20,
								marginRight: 20,
								borderRadius: 12,
							}}
						/>
					)}

					{/* Lead Analytics Panel */}
					{showAnalytics && (
						<Panel
							position="top-left"
							style={{
								width: 400,
								margin: 20,
								padding: 0,
								borderRadius: 12,
								overflow: "hidden",
								backdropFilter: "blur(8px)",
								boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
							}}
						>
							<LeadAnalyticsChart />
						</Panel>
					)}

					{/* Lead History Panel */}
					{showLeadHistory && (
						<Panel
							position="top-left"
							style={{
								width: 700,
								margin: 20,
								padding: 0,
								borderRadius: 12,
								overflow: "hidden",
								backdropFilter: "blur(8px)",
								boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
								maxHeight: "60vh",
							}}
						>
							<LeadHistoryPanel flowId={flowId} />
						</Panel>
					)}

					{/* Toggle buttons grouped in bottom-right */}
					<Panel
						position="bottom-right"
						style={{ marginBottom: 140, marginRight: 20 }}
					>
						<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
							{/* Analytics Toggle Button */}
							<Tooltip
								title={
									showAnalytics ? "Hide Call Analytics" : "Show Call Analytics"
								}
								placement="left"
							>
								<IconButton
									onClick={toggleAnalytics}
									sx={{
										backdropFilter: "blur(12px)",
										borderRadius: "10px",
										width: "40px",
										height: "40px",
										"&:hover": {
											boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
										},
										bgcolor: showAnalytics
											? "primary.main"
											: "background.paper",
										color: showAnalytics ? "white" : "primary.main",
									}}
								>
									<AssessmentIcon />
								</IconButton>
							</Tooltip>

							{/* Lead History Toggle Button */}
							<Tooltip
								title={
									showLeadHistory ? "Hide Lead History" : "Show Lead History"
								}
								placement="left"
							>
								<IconButton
									onClick={toggleLeadHistory}
									sx={{
										backdropFilter: "blur(12px)",
										borderRadius: "10px",
										width: "40px",
										height: "40px",
										"&:hover": {
											boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
										},
										bgcolor: showLeadHistory
											? "primary.main"
											: "background.paper",
										color: showLeadHistory ? "white" : "primary.main",
									}}
								>
									<HistoryIcon />
								</IconButton>
							</Tooltip>

							{/* MiniMap Toggle Button */}
							<Tooltip
								title={showMiniMap ? "Hide MiniMap" : "Show MiniMap"}
								placement="left"
							>
								<IconButton
									onClick={toggleMiniMap}
									sx={{
										backdropFilter: "blur(12px)",
										borderRadius: "10px",
										width: "40px",
										height: "40px",
										"&:hover": {
											boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
										},
										bgcolor: showMiniMap ? "primary.main" : "background.paper",
										color: showMiniMap ? "white" : "primary.main",
									}}
								>
									<MapIcon />
								</IconButton>
							</Tooltip>
						</Box>
					</Panel>

					<Panel position="top-right">
						<FlowToolbar
							onSave={onSave}
							onLoad={onLoad}
							onExport={onExport}
							onClear={onClear}
							onToggleStatus={handleToggleStatus}
							flowName={flowName}
							flowStatus={flowStatus}
							onRename={handleRenameFlow}
						/>
					</Panel>
				</ReactFlow>
			</Box>

			{/* Properties panel */}
			{showPropertiesPanel && (
				<PropertiesPanel
					selectedNode={selectedNode}
					onChange={onNodeDataChange}
					onClose={() => setShowPropertiesPanel(false)}
					flowId={flowId || undefined}
					flowName={flowName}
				/>
			)}

			<Backdrop
				sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
				open={loading}
			>
				<CircularProgress color="inherit" />
			</Backdrop>
		</Box>
	);
};

const FlowEditor: React.FC<FlowEditorProps> = ({ flowId }) => {
	const { isDarkMode } = useTheme();
	const theme = isDarkMode ? getDarkTheme() : getLightTheme();

	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<Box
				sx={{
					height: "100vh",
					width: "100%",
					overflow: "hidden",
				}}
			>
				<ReactFlowProvider>
					<FlowEditorContent flowId={flowId} />
				</ReactFlowProvider>
			</Box>
		</ThemeProvider>
	);
};

export default FlowEditor;
