import React, { useState, useEffect } from "react";
import {
	Box,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	CircularProgress,
	Typography,
	Tooltip,
	IconButton,
	SelectChangeEvent,
	Paper,
	Chip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { fetchAllFlow } from "@/services/flowServices";
import { useFlow } from "@/context/FlowContext";

// Định nghĩa kiểu dữ liệu cho flow
interface Flow {
	id: string;
	name: string;
	status: number;
}

const StyledFormControl = styled(FormControl)(({ theme }) => ({
	minWidth: 240,
	margin: theme.spacing(1),
	"& .MuiOutlinedInput-root": {
		borderRadius: "8px",
		transition: "all 0.2s ease-in-out",
		"&:hover": {
			borderColor: theme.palette.primary.main,
		},
		"&.Mui-focused": {
			boxShadow: `0 0 0 2px ${theme.palette.primary.light}`,
		},
	},
	"& .MuiInputLabel-root": {
		fontSize: "0.875rem",
	},
}));

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
	padding: "10px 16px",
	display: "flex",
	alignItems: "center",
	gap: "8px",
	borderRadius: "4px",
	margin: "2px 6px",
	"&:hover": {
		backgroundColor: theme.palette.action.hover,
	},
	"&.Mui-selected": {
		backgroundColor: theme.palette.primary.light,
		"&:hover": {
			backgroundColor: "#bdbcf7",
		},
	},
}));

const StyledChip = styled(Chip)(({ theme }) => ({
	height: "24px",
	fontSize: "0.75rem",
	marginLeft: "8px",
}));

const FlowSelector: React.FC = () => {
	const [flows, setFlows] = useState<Flow[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { selectedFlowId, setSelectedFlowId } = useFlow();

	const loadFlows = async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await fetchAllFlow();
			if (data) {
				const formattedFlows = data
					.filter((flow: any) => flow.status !== 0)
					.map((flow: any) => ({
						id: flow._id || flow.id,
						name: flow.name,
						status: flow.status,
					}));
				setFlows(formattedFlows);
			}
		} catch (error) {
			console.error("Error loading flows:", error);
			setError("Không thể tải danh sách flow");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadFlows();
	}, []);

	const handleChange = (event: SelectChangeEvent<string>) => {
		const flowId = event.target.value;
		setSelectedFlowId(flowId);
	};

	const getFlowStatusText = (status: number) => {
		switch (status) {
			case 1:
				return "inactive";
			case 2:
				return "active";
			default:
				return "not found";
		}
	};

	const getFlowStatusColor = (status: number) => {
		switch (status) {
			case 1:
				return "warning";
			case 2:
				return "success";
			default:
				return "default";
		}
	};

	return (
		<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
			<StyledFormControl fullWidth>
				<InputLabel id="flow-select-label">Flow Select</InputLabel>
				<Select
					labelId="flow-select-label"
					id="flow-select"
					value={selectedFlowId || ""}
					label="Select Flow"
					onChange={handleChange}
					disabled={loading}
					renderValue={(selected) => {
						const selectedFlow = flows.find((flow) => flow.id === selected);
						return (
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								<Typography variant="body1">
									{selectedFlow ? selectedFlow.name : "Select Flow"}
								</Typography>
								{selectedFlow && (
									<StyledChip
										label={getFlowStatusText(selectedFlow.status)}
										size="small"
										color={getFlowStatusColor(selectedFlow.status) as any}
									/>
								)}
							</Box>
						);
					}}
					MenuProps={{
						PaperProps: {
							style: {
								maxHeight: 300,
								borderRadius: 8,
								padding: "4px 0",
							},
						},
					}}
				>
					{loading ? (
						<MenuItem disabled>
							<CircularProgress size={20} sx={{ mr: 1 }} />
							Loading...
						</MenuItem>
					) : error ? (
						<MenuItem disabled>
							<Typography color="error">{error}</Typography>
						</MenuItem>
					) : flows.length === 0 ? (
						<MenuItem disabled>
							<Typography>Empty Flow</Typography>
						</MenuItem>
					) : (
						flows.map((flow) => (
							<StyledMenuItem key={flow.id} value={flow.id}>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
										width: "100%",
									}}
								>
									<Typography>{flow.name}</Typography>
									<StyledChip
										label={getFlowStatusText(flow.status)}
										size="small"
										color={getFlowStatusColor(flow.status) as any}
									/>
								</Box>
							</StyledMenuItem>
						))
					)}
				</Select>
			</StyledFormControl>

			<Tooltip title="Load Flow List">
				<IconButton
					onClick={loadFlows}
					disabled={loading}
					sx={{
						width: 40,
						height: 40,
						color: "primary.main",
						"&:hover": {
							backgroundColor: "action.hover",
						},
					}}
				>
					{loading ? <CircularProgress size={20} /> : <RefreshIcon />}
				</IconButton>
			</Tooltip>
		</Box>
	);
};

export default FlowSelector;
