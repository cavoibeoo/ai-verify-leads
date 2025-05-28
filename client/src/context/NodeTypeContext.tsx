import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	ReactNode,
} from "react";
import { fetchAllNodeTypes, NodeType } from "@/services/nodetypeServices";

interface NodeTypeContextValue {
	nodeTypes: NodeType[];
	nodeTypeMap: Record<string, NodeType>;
	loading: boolean;
	error: boolean;
}

const NodeTypeContext = createContext<NodeTypeContextValue | undefined>(
	undefined
);

export const NodeTypeProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const [nodeTypes, setNodeTypes] = useState<NodeType[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	useEffect(() => {
		const load = async () => {
			setLoading(true);
			setError(false);
			const data = await fetchAllNodeTypes();
			if (data && !data.error && Array.isArray(data)) {
				setNodeTypes(data);
			} else {
				setError(true);
			}
			setLoading(false);
		};
		load();
	}, []);

	const nodeTypeMap = React.useMemo(() => {
		const map: Record<string, NodeType> = {};
		nodeTypes.forEach((nt) => {
			if (nt.key) map[nt.key] = nt;
		});
		return map;
	}, [nodeTypes]);

	return (
		<NodeTypeContext.Provider
			value={{ nodeTypes, nodeTypeMap, loading, error }}
		>
			{children}
		</NodeTypeContext.Provider>
	);
};

export const useNodeTypes = () => {
	const ctx = useContext(NodeTypeContext);
	if (!ctx)
		throw new Error("useNodeTypes must be used within a NodeTypeProvider");
	return ctx;
};
