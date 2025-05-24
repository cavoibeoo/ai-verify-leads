import React, { useEffect, useState } from "react";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { Box, Paper, Typography, Grid, Divider, alpha } from "@mui/material";
import { getCallAnalytics } from "@/services/analyticsServices";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface LeadAnalyticsChartProps {
	flowId: string | null;
	className?: string;
}

const LeadAnalyticsChart: React.FC<LeadAnalyticsChartProps> = ({
	flowId,
	className,
}) => {
	const [isChartLoaded, setChartLoaded] = useState(false);
	const [callData, setCallData] = useState({
		success: 0,
		noAnswer: 0,
		terminate: 0,
		decline: 0,
		total: 0,
	});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		setChartLoaded(true);
	}, []);

	useEffect(() => {
		const fetchData = async () => {
			if (!flowId) return;
			setLoading(true);
			const data = await getCallAnalytics(flowId);
			if (data) {
				const total =
					(data.success || 0) +
					(data.noAnswer || 0) +
					(data.terminate || 0) +
					(data.decline || 0);
				setCallData({
					...data,
					total,
				});
			}
			setLoading(false);
		};
		fetchData();
	}, [flowId]);

	const series = [
		callData.success,
		callData.noAnswer,
		callData.terminate,
		callData.decline,
	];
	const chartColors = ["#10b981", "#f59e0b", "#6366f1", "#ef4444"];

	const options: ApexOptions = {
		labels: ["Success", "No Answer", "Terminate", "Decline"],
		colors: chartColors,
		chart: {
			dropShadow: {
				enabled: true,
				top: 2,
				left: 0,
				blur: 4,
				opacity: 0.15,
			},
			animations: {
				enabled: true,
				speed: 800,
				animateGradually: {
					enabled: true,
					delay: 150,
				},
				dynamicAnimation: {
					enabled: true,
					speed: 350,
				},
			},
			fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
		},
		stroke: {
			width: 0.2,
			colors: [],
		},
		fill: {
			type: "gradient",
			gradient: {
				shade: "light",
				type: "vertical",
				shadeIntensity: 0.25,
				gradientToColors: undefined,
				inverseColors: true,
				opacityFrom: 0.85,
				opacityTo: 0.95,
				stops: [0, 100],
			},
		},
		legend: {
			show: false,
		},
		plotOptions: {
			pie: {
				expandOnClick: false,
				donut: {
					size: "78%",
					background: "transparent",
					labels: {
						show: true,
						name: {
							show: true,
							offsetY: -10,
							color: "#94a3b8",
							fontSize: "13px",
							fontFamily: '"Inter", sans-serif',
							fontWeight: 500,
						},
						value: {
							color: "#334155",
							fontSize: "24px",
							fontWeight: "600",
							fontFamily: '"Inter", sans-serif',
							formatter: function (val) {
								return val.toString();
							},
						},
						total: {
							show: true,
							label: "Total",
							color: "#64748b",
							fontFamily: '"Inter", sans-serif',
							fontSize: "14px",
							fontWeight: 600,
							formatter: function () {
								return callData.total.toString();
							},
						},
					},
				},
			},
		},
		states: {
			hover: {
				filter: {
					type: "lighten",
				},
			},
			active: {
				filter: {
					type: "lighten",
				},
			},
		},
		dataLabels: {
			enabled: false,
		},
		responsive: [
			{
				breakpoint: 480,
				options: {
					chart: {
						height: 280,
					},
				},
			},
		],
	};

	return (
		<Paper
			elevation={0}
			sx={{
				p: 3,
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
			className={className + " lead-analytics-chart"}
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
				Lead Call Analytics
			</Typography>

			<Box sx={{ mt: -0.5, mb: -1 }}>
				{isChartLoaded && !loading && (
					<Chart
						options={options}
						series={series}
						type="donut"
						height={270}
						width="100%"
					/>
				)}
			</Box>

			<Grid container spacing={2} sx={{ mt: 0.5 }}>
				{[
					{ label: "Success", value: callData.success, color: chartColors[0] },
					{
						label: "No Answer",
						value: callData.noAnswer,
						color: chartColors[1],
					},
					{
						label: "Terminate",
						value: callData.terminate,
						color: chartColors[2],
					},
					{ label: "Decline", value: callData.decline, color: chartColors[3] },
				].map((item, index) => (
					<Grid item xs={3} key={index}>
						<Box
							sx={{
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									gap: "6px",
									alignContent: "center",
									mb: 0.5,
								}}
							>
								<Box
									sx={{
										width: 10,
										height: 10,
										backgroundColor: item.color,
										boxShadow: `0 0 8px ${alpha(item.color, 0.35)}`,
									}}
								/>
								<Typography
									sx={{
										fontSize: "0.7125rem",
										color: (theme) => theme.palette.text.secondary,
										fontWeight: 500,
									}}
								>
									{item.label}
								</Typography>
							</Box>

							<Typography
								sx={{
									fontSize: "1.25rem",
									fontWeight: 600,
									color: (theme) => theme.palette.text.primary,
									lineHeight: 1,
								}}
							>
								{item.value}
							</Typography>
						</Box>
					</Grid>
				))}
			</Grid>
		</Paper>
	);
};

export default LeadAnalyticsChart;
