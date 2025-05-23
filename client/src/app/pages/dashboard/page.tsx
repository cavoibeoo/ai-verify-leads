"use client";
import * as React from "react";
import Grid from "@mui/material/Grid";
import RevenueGrowth from "@/components/Dashboard/Crm/RevenueGrowth";
import LeadConversion from "@/components/Dashboard/Crm/LeadConversion";
import TotalOrders from "@/components/Dashboard/Crm/TotalOrders";
import AnnualProfit from "@/components/Dashboard/Crm/AnnualProfit";
import BalanceOverview from "@/components/Dashboard/Crm/BalanceOverview";
import LeadsBySource from "@/components/Dashboard/Crm/LeadsBySource";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import FlowSelector from "@/components/common/FlowSelector";
import { useFlow } from "@/context/FlowContext";

export default function Page() {
	const { selectedFlowId } = useFlow();

	return (
		<Box sx={{ minHeight: "85vh" }}>
			<Paper
				elevation={0}
				sx={{
					p: 3,
					mb: 3,
					borderRadius: 2,
					boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
				}}
				className="lighter-bg"
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
							Select Flow to Analyze Data
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Dashboard data will be filtered according to the flow you choose.
						</Typography>
					</Box>

					<FlowSelector />
				</Box>
			</Paper>

			<Grid container columnSpacing={{ xs: 1, sm: 2, md: 2, lg: 3 }}>
				<Grid item xs={12} sm={12} md={5} lg={5} xl={6}>
					<LeadsBySource />
				</Grid>
				<Grid item xs={12} sm={12} md={5} lg={5} xl={6}>
					<RevenueGrowth />
					<LeadConversion />
					<TotalOrders />
					<AnnualProfit />
				</Grid>
			</Grid>
		</Box>
	);
}
