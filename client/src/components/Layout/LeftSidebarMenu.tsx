// File path: /styles/left-sidebar-menu.scss

"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { styled } from "@mui/material/styles";
import ArrowForwardIosSharpIcon from "@mui/icons-material/ArrowForwardIosSharp";
import MuiAccordion, { AccordionProps } from "@mui/material/Accordion";
import MuiAccordionSummary, {
	AccordionSummaryProps,
} from "@mui/material/AccordionSummary";
import MuiAccordionDetails from "@mui/material/AccordionDetails";
import { Box, Typography } from "@mui/material";
import { useUserInfo } from "@/services/userServices";

const Accordion = styled((props: AccordionProps) => (
	<MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
	border: `1px solid ${theme.palette.divider}`,
	"&:not(:last-child)": {
		borderBottom: 0,
	},
	"&::before": {
		display: "none",
	},
}));

const AccordionSummary = styled((props: AccordionSummaryProps) => (
	<MuiAccordionSummary
		expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: "0.9rem" }} />}
		{...props}
	/>
))(({ theme }) => ({
	backgroundColor: theme.palette.mode === "dark" ? "#3a4252" : "#f6f7f9",
	flexDirection: "row-reverse",
	"& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
		transform: "rotate(90deg)",
	},
	"& .MuiAccordionSummary-content": {
		// marginLeft: theme.spacing(1),
	},
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
	padding: theme.spacing(2),
	// borderTop: "1px solid rgba(0, 0, 0, .125)",
}));

interface LeftSidebarProps {
	toggleActive: () => void;
}

const LeftSidebarMenu: React.FC<LeftSidebarProps> = ({ toggleActive }) => {
	const pathname = usePathname();
	const { user, loading } = useUserInfo();

	const [expanded, setExpanded] = React.useState<string | false>("panel1");

	const handleChange =
		(panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
			setExpanded(newExpanded ? panel : false);
		};

	return (
		<>
			<Box className="leftSidebarDark">
				<Box className="left-sidebar-menu">
					<Box className="logo">
						<Link href="/">
							<Image
								src="/images/Sine_logo_icon.png"
								alt="logo-icon"
								width={26}
								height={26}
							/>
							<Typography component={"span"}>Sine</Typography>
						</Link>
					</Box>

					<Box className="burger-menu" onClick={toggleActive}>
						<Typography component={"span"} className="top-bar"></Typography>
						<Typography component={"span"} className="middle-bar"></Typography>
						<Typography component={"span"} className="bottom-bar"></Typography>
					</Box>

					<Box className="sidebar-inner">
						<Box className="sidebar-menu">
							<Typography
								className="sub-title"
								sx={{
									display: "block",
									fontWeight: "500",
									textTransform: "uppercase",
								}}
							>
								MAIN
							</Typography>

							<Link
								href="/pages/dashboard/"
								className={`sidebar-menu-link ${
									pathname === "/pages/dashboard/" ? "active" : ""
								}`}
							>
								<i className="ri-layout-masonry-fill"></i>
								<Typography component={"span"} className="title">
									Dashboard
								</Typography>
							</Link>

							<Link
								href="/pages/leadpipeline/"
								className={`sidebar-menu-link ${
									pathname === "/pages/leadpipeline/" ? "active" : ""
								}`}
							>
								<i className="ri-team-fill"></i>
								<Typography component={"span"} className="title">
									Lead Pipeline
								</Typography>
							</Link>

							<Link
								href="/pages/flow/"
								className={`sidebar-menu-link ${
									pathname === "/pages/flow/" ? "active" : ""
								}`}
							>
								<i className="ri-swap-2-fill"></i>
								<Typography component={"span"} className="title">
									Flow
								</Typography>
							</Link>

							{!loading && user?.role === "admin" && (
								<Link
									href="/pages/admin/user-management/"
									className={`sidebar-menu-link ${
										pathname === "/pages/admin/user-management/" ? "active" : ""
									}`}
								>
									<i className="ri-user-fill"></i>
									<Typography component={"span"} className="title">
										Admin Site
									</Typography>
								</Link>
							)}

							{/* <Link
								href="/pages/analytics/"
								className={`sidebar-menu-link ${
									pathname === "/pages/analytics/" ? "active" : ""
								}`}
							>
								<i className="ri-bar-chart-box-fill"></i>
								<Typography component={"span"} className="title">
									Analytics
								</Typography>
							</Link> */}

							{/* 
							<Link
								href="/pages/settings/"
								className={`sidebar-menu-link ${
									pathname === "/pages/settings/" ? "active" : ""
								}`}
							>
								<i className="ri-equalizer-fill"></i>
								<Typography component={"span"} className="title">
									Settings
								</Typography>
							</Link> */}
						</Box>
					</Box>
				</Box>
			</Box>
		</>
	);
};

export default LeftSidebarMenu;
