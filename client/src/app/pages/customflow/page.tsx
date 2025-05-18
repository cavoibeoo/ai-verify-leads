"use client";
import * as React from "react";
import { useSearchParams } from "next/navigation";
import FlowEditor from "@/components/flow/FlowEditor";

export default function Page() {
	const searchParams = useSearchParams();
	if (!searchParams) return null;
	const flowId = searchParams.get("id");

	return (
		<>
			<div className="fp-wrapper w-full h-screen overflow-hidden">
				<FlowEditor flowId={flowId} />
			</div>
		</>
	);
}
