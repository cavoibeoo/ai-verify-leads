"use client";

import React, { useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
import LeftSidebarMenu from "@/components/Layout/LeftSidebarMenu";
import TopNavbar from "./../components/Layout/TopNavbar/index";
import Footer from "@/components/Layout/Footer";
import ControlPanel from "@/components/Layout/ControlPanel";

interface LayoutProviderProps {
	children: ReactNode;
}

const LayoutProvider: React.FC<LayoutProviderProps> = ({ children }) => {
	const [active, setActive] = useState<boolean>(false);
	const pathname = usePathname();

	const toggleActive = () => {
		setActive(!active);
	};

	const isAuthPage = [
		"/pages/authentication/sign-in/",
		"/pages/authentication/sign-up/",
		"/pages/authentication/forgot-password/",
		"/pages/authentication/reset-password/",
		"/pages/authentication/confirm-email/",
		"/pages/authentication/lock-screen/",
		"/pages/authentication/logout/",
		"/pages/coming-soon/",
		"/pages/front-pages/features/",
		"/pages/front-pages/team/",
		"/pages/front-pages/faq/",
		"/pages/front-pages/contact/",
		"/pages/customflow/",
		"/pages/customflow/facebook-connect/",
		"/pages/customflow/email-connect/",
		"/",
	].includes(pathname ?? "");

	return (
		<>
			<div className={`main-wrapper-content ${active ? "active" : ""}`}>
				{!isAuthPage && (
					<>
						<TopNavbar toggleActive={toggleActive} />

						<LeftSidebarMenu toggleActive={toggleActive} />
					</>
				)}

				<div className="main-content">
					{children}

					{!isAuthPage && <Footer />}
				</div>
			</div>

			<div
				style={{
					position: "fixed",
					bottom: "15px",
					right: "15px",
					zIndex: "-5",
					opacity: 0,
					visibility: "hidden",
				}}
			>
				<ControlPanel />
			</div>
		</>
	);
};

export default LayoutProvider;
