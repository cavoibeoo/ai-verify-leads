"use client";

import React, { useEffect, useState } from "react";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { Grid, Card, Box, Typography, CircularProgress } from "@mui/material";
import CustomDropdown from "./CustomDropdown";
import { getLeadBySource } from "@/services/analyticsServices";
import { useFlow } from "@/context/FlowContext";

// Dynamically import react-apexcharts with Next.js dynamic import
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface LeadSource {
	source: string;
	count: number;
}

const SOURCE_COLORS: Record<string, string> = {
	facebook: "#1877f2",
	sheet: "#0F9D58",
	excel: "#217346",
	other: "#64748B",
};

function getColorForSource(source: string): string {
	const key = source.toLowerCase();
	if (key.includes("facebook")) return SOURCE_COLORS.facebook;
	if (key.includes("sheet")) return SOURCE_COLORS.sheet;
	if (key.includes("excel")) return SOURCE_COLORS.excel;
	return SOURCE_COLORS.other;
}

const LeadsBySource: React.FC = () => {
	// Chart
	const [isChartLoaded, setChartLoaded] = useState(false);
	const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
	const [loading, setLoading] = useState(false);
	const [timeFilter, setTimeFilter] = useState("This Month");
	const { selectedFlowId } = useFlow();

	useEffect(() => {
		setChartLoaded(true);
	}, []);

	useEffect(() => {
		const fetchData = async () => {
			if (!selectedFlowId) {
				setLeadSources([]);
				return;
			}

			try {
				setLoading(true);
				const data = await getLeadBySource(selectedFlowId);
				if (data && Array.isArray(data)) {
					setLeadSources(data);
				} else {
					setLeadSources([]);
				}
			} catch (error) {
				console.error("Error fetching lead sources:", error);
				setLeadSources([]);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [selectedFlowId, timeFilter]);

	// Prepare chart data from API response
	const getChartSeries = () => {
		if (leadSources.length === 0) return [1, 1]; // Default for empty state
		return leadSources.map((source) => source.count);
	};

	const getChartLabels = () => {
		if (leadSources.length === 0) return ["No Data", "No Data"]; // Default for empty state
		return leadSources.map((source) => source.source);
	};

	// Dynamic colors based on number of sources
	const getChartColors = () => {
		if (leadSources.length === 0) return ["#e0e0e0", "#f5f5f5"];
		return leadSources.map((source) => getColorForSource(source.source));
	};

	const series = getChartSeries();

	const options: ApexOptions = {
		labels: getChartLabels(),
		colors: getChartColors(),
		stroke: {
			width: 1,
			show: true,
			colors: ["#ffffff"],
		},
		legend: {
			show: false,
			position: "top",
			fontSize: "12px",
			horizontalAlign: "center",
			itemMargin: {
				horizontal: 8,
				vertical: 0,
			},
			labels: {
				colors: "#64748B",
			},
			markers: {
				shape: "diamond",
				offsetX: -2,
				offsetY: -0.5,
			},
		},
		plotOptions: {
			pie: {
				expandOnClick: false,
				donut: {
					labels: {
						show: true,
						name: {
							color: "#64748B",
						},
						value: {
							show: true,
							color: "#3A4252",
							fontSize: "28px",
							fontWeight: "600",
						},
						total: {
							show: true,
							color: "#64748B",
						},
					},
				},
			},
		},
		dataLabels: {
			enabled: false,
		},
		tooltip: {
			enabled: false,
		},
	};

	const handleTimeFilterChange = (value: string) => {
		setTimeFilter(value);
		// In a real app, we would update the API call to include the time filter
		console.log(`Time filter changed to: ${value}`);
	};

	return (
		<>
			<Card
				sx={{
					boxShadow: "none",
					borderRadius: "7px",
					mb: "25px",
					padding: { xs: "18px", sm: "20px", lg: "25px" },
				}}
				className="rmui-card lighter-bg"
			>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						mb: "25px",
					}}
				>
					<Typography
						variant="h3"
						sx={{
							fontSize: { xs: "16px", md: "18px" },
							fontWeight: 700,
						}}
						className="text-black"
					>
						Leads Sources
					</Typography>
				</Box>

				{loading ? (
					<Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
						<CircularProgress />
					</Box>
				) : !selectedFlowId ? (
					<Box sx={{ textAlign: "center", py: 5 }}>
						<Typography variant="body1" color="text.secondary">
							Please select a flow to view lead sources
						</Typography>
					</Box>
				) : leadSources.length === 0 ? (
					<Box sx={{ textAlign: "center", py: 5 }}>
						<Typography variant="body1" color="text.secondary">
							No lead source data available for this flow
						</Typography>
					</Box>
				) : (
					<>
						<Box
							sx={{
								marginTop: "-15px",
								marginBottom: "-15px",
							}}
						>
							{isChartLoaded && (
								<Chart
									options={options}
									series={series}
									type="donut"
									height={282}
									width={"100%"}
								/>
							)}
						</Box>

						<Grid container spacing={4} sx={{ mt: "0" }}>
							{leadSources.map((source, index) => (
								<Grid item xs={6} key={source.source}>
									<Box>
										<Typography
											component="span"
											sx={{
												display: "flex",
												alignItems: "center",
												gap: "8px",
												fontSize: "13px",
												mb: "8px",
											}}
										>
											<Typography
												component="span"
												sx={{
													width: "11px",
													height: "11px",
													borderRadius: "3px",
													backgroundColor: getColorForSource(source.source),
												}}
											></Typography>
											{source.source}
										</Typography>

										<Typography
											variant="h6"
											mb={0}
											fontSize={18}
											fontWeight={500}
											lineHeight={1}
											className="text-black"
										>
											{source.count}
										</Typography>
									</Box>
								</Grid>
							))}
						</Grid>
					</>
				)}
			</Card>
		</>
	);
};

export default LeadsBySource;
