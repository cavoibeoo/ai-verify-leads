"use client";

import React, { useEffect, useState } from "react";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { Card, Box, Typography, CircularProgress } from "@mui/material";
import { getBasicMetrics } from "@/services/analyticsServices";
import { useFlow } from "@/context/FlowContext";

// Dynamically import react-apexcharts with Next.js dynamic import
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const TotalOrders: React.FC = () => {
	const [isChartLoaded, setChartLoaded] = useState(false);
	const [unverifiedLeads, setUnverifiedLeads] = useState<number | null>(null);
	const [loading, setLoading] = useState(false);
	const { selectedFlowId } = useFlow();

	useEffect(() => {
		setChartLoaded(true);
	}, []);

	useEffect(() => {
		const fetchData = async () => {
			if (!selectedFlowId) {
				setUnverifiedLeads(null);
				return;
			}

			try {
				setLoading(true);
				const data = await getBasicMetrics(selectedFlowId);
				if (data) {
					setUnverifiedLeads(data.unverifiedLead);
				}
			} catch (error) {
				console.error("Error fetching unverified leads:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [selectedFlowId]);

	const series = [
		{
			name: "Lead Verified",
			data: [44, 55, 57, 56, 61, 58, 63],
		},
	];

	const options: ApexOptions = {
		chart: {
			toolbar: {
				show: false,
			},
		},
		plotOptions: {
			bar: {
				columnWidth: "50%",
				borderRadius: 2,
			},
		},
		colors: ["#0dcaf0"],
		dataLabels: {
			enabled: false,
		},
		grid: {
			show: false,
			borderColor: "#ECEEF2",
		},
		stroke: {
			width: 2,
			show: true,
			colors: ["transparent"],
		},
		xaxis: {
			categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
			axisTicks: {
				show: false,
				color: "#ECEEF2",
			},
			axisBorder: {
				show: false,
				color: "#ECEEF2",
			},
			labels: {
				show: false,
				style: {
					colors: "#8695AA",
					fontSize: "12px",
				},
			},
		},
		yaxis: {
			show: false,
			labels: {
				style: {
					colors: "#64748B",
					fontSize: "12px",
				},
			},
			axisBorder: {
				show: false,
				color: "#ECEEF2",
			},
			axisTicks: {
				show: false,
				color: "#ECEEF2",
			},
		},
		tooltip: {
			y: {
				formatter: function (val) {
					return val + " " + "lead";
				},
			},
		},
	};

	return (
		<>
			<Card
				sx={{
					boxShadow: "0 4px 24px 0 rgba(34, 41, 47, 0.08)",
					borderRadius: "7px",
					mb: "25px",
					padding: { xs: "18px", sm: "20px", lg: "25px" },
					overflow: "visible",
				}}
				className="rmui-card lighter-bg"
			>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						position: "relative",
					}}
				>
					<Box>
						<Typography component="span" sx={{ mb: "3px", display: "block" }}>
							Unqualified Leads
						</Typography>

						<Typography
							variant="h5"
							sx={{
								fontSize: { xs: "18px", lg: "20px" },
								fontWeight: 700,
								display: "flex",
								alignItems: "center",
								gap: 1,
							}}
							className="text-black"
						>
							{loading ? (
								<CircularProgress size={16} />
							) : !selectedFlowId ? (
								"Null"
							) : unverifiedLeads === null ? (
								"No data"
							) : (
								unverifiedLeads
							)}
						</Typography>
					</Box>

					<Box
						sx={{
							position: "absolute",
							top: "-28px",
							right: "-9px",
							maxWidth: "120px",
						}}
						className="crm-to"
					>
						{isChartLoaded && (
							<Chart
								options={options}
								series={series}
								type="bar"
								height={110}
								width={"100%"}
							/>
						)}
					</Box>
				</Box>
			</Card>
		</>
	);
};

export default TotalOrders;
