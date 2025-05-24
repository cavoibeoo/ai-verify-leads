"use client";
import * as React from "react";
import { useSearchParams } from "next/navigation";
import FlowEditor from "@/components/flow/FlowEditor";
import { Suspense } from "react";

export default function Page() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<CustomFlowPageContent />
		</Suspense>
	);
}

function CustomFlowPageContent() {
	const searchParams = useSearchParams();
	const flowId = searchParams?.get("id");

	console.log(flowId);

	return (
		<div className="fp-wrapper w-full h-screen overflow-hidden">
			<FlowEditor flowId={flowId ?? null} />
		</div>
	);
}
