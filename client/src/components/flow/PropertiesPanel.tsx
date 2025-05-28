import React, { useState, useEffect, useContext } from "react";
import { Node } from "@xyflow/react";
import {
	Box,
	Paper,
	Typography,
	TextField,
	Select,
	MenuItem,
	InputLabel,
	FormControl,
	IconButton,
	Divider,
	Chip,
	styled,
	SelectChangeEvent,
	CircularProgress,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Alert,
	Tooltip,
	FormControlLabel,
	Checkbox,
} from "@mui/material";
import {
	Close,
	NotificationImportant,
	Refresh,
	Add,
	Call,
	Remove,
	Save,
	HelpOutline,
} from "@mui/icons-material";
import {
	useFacebookConnections,
	useFacebookPages,
	useFacebookForms,
	subscribePageToWebhook,
	unsubscribePageFromWebhook,
	openFacebookConnect,
} from "@/services/facebookServices";
import {
	useGoogleCalendarConnections,
	openGoogleCalendarConnect,
} from "@/services/googleCalendarServices";
import { toast } from "react-toastify";
import {
	callLead,
	LeadData,
	updateFlow,
	optimizePrompt,
} from "@/services/flowServices";
import { useReactFlow } from "@xyflow/react";
import { getNodeIcon } from "@/utils/nodeUtils";

type PropertiesPanelProps = {
	selectedNode: Node | null;
	onChange: (id: string, data: any) => void;
	onClose: () => void;
	flowId?: string;
	flowName?: string;
};

interface NodeSettings {
	sheetUrl?: string;
	excelUrl?: string;
	adAccountId?: string;
	campaignId?: string;
	apiProvider?: string;
	apiKey?: string;
	promptTemplate?: string;
	calendarId?: string;
	duration?: number;
	webhookUrl?: string;
	method?: string;
	headers?: string;
	timeout?: number;
	retryCount?: number;
	field?: string;
	operator?: string;
	value?: string;
	provider?: string;
	subject?: string;
	template?: string;
	connection?: string;
	pageId?: string;
	formId?: string;
	phoneNumber?: string;
	callerNumber?: string;
	attributeJson?: string;
	language?: string;
	prompt?: string;
	introduction?: string;
	questions?: Array<string>;
	goodByeMessage?: string;
	calendarName?: string;
	eventName?: string;
	startWorkDays?: number;
	endWorkDays?: number;
	startTime?: string;
	endTime?: string;
	enableWebScraping?: boolean;
	webScrapingPrompt?: string;
	criteria?: Array<{
		field: string;
		type: string;
		operator: string;
		value: string | boolean | number;
	}>;
	[key: string]:
		| string
		| number
		| boolean
		| Array<string>
		| Array<{ [key: string]: any }>
		| undefined;
}

const PanelContainer = styled(Paper)(({ theme }) => ({
	backgroundColor: theme.palette.background.paper,
	borderLeft: `1px solid ${theme.palette.divider}`,
	width: "380px",
	height: "100%",
	padding: theme.spacing(2),
	boxShadow: theme.shadows[2],
	zIndex: 10,
	overflow: "auto",
	animation: "slideInRight 0.3s ease-out",
	"@keyframes slideInRight": {
		from: { transform: "translateX(100%)" },
		to: { transform: "translateX(0)" },
	},
}));

const NodeInfoCard = styled(Box)(({ theme }) => ({
	padding: theme.spacing(1.5),
	backgroundColor: theme.palette.grey[50],
	borderRadius: theme.shape.borderRadius,
	marginBottom: theme.spacing(2),
}));

const NodeColorIndicator = styled(Box, {
	shouldForwardProp: (prop) => prop !== "bgcolor",
})<{ bgcolor: string }>(({ bgcolor }) => ({
	width: "16px",
	height: "16px",
	borderRadius: "50%",
	backgroundColor: bgcolor || "#94a3b8",
	marginRight: "8px",
}));

// Facebook Connection Select Component
interface ConnectionSelectProps {
	value: string;
	onChange: (value: string) => void;
}

const ConnectionSelect: React.FC<ConnectionSelectProps> = ({
	value,
	onChange,
}) => {
	const [refreshKey, setRefreshKey] = useState<number>(0);
	const [isConnecting, setIsConnecting] = useState<boolean>(false);
	const { connections, loading, error } = useFacebookConnections(refreshKey);

	const handleRefresh = () => {
		setRefreshKey((prevKey) => prevKey + 1);
	};

	const handleAddConnection = async () => {
		// Mở cửa sổ mới để kết nối Facebook
		setIsConnecting(true);

		try {
			const { popupWindow, error } = await openFacebookConnect();

			if (error) {
				setIsConnecting(false);
				return;
			}

			// Theo dõi trạng thái của cửa sổ popup
			const checkPopup = setInterval(() => {
				if (popupWindow?.closed) {
					clearInterval(checkPopup);
					setIsConnecting(false);
					handleRefresh();
				}
			}, 1000);
		} catch (err) {
			console.error("Error connecting to Facebook:", err);
			setIsConnecting(false);
		}
	};

	useEffect(() => {
		// Lắng nghe sự kiện từ cửa sổ popup khi kết nối hoàn tất
		const handleConnectionComplete = () => {
			if (isConnecting) {
				setTimeout(() => {
					handleRefresh();
				}, 1000);
			}
		};

		window.addEventListener("focus", handleConnectionComplete);

		return () => {
			window.removeEventListener("focus", handleConnectionComplete);
		};
	}, [isConnecting]);

	return (
		<>
			<FormControl fullWidth size="small">
				<Box sx={{ display: "flex", width: "100%" }}>
					<Select
						value={value}
						onChange={(e) => {
							if (e.target.value !== "add_new") {
								onChange(e.target.value);
							}
						}}
						disabled={loading}
						sx={{ flex: 1 }}
					>
						{loading ? (
							<MenuItem value="">
								<Box sx={{ display: "flex", alignItems: "center" }}>
									<CircularProgress size={20} sx={{ mr: 1 }} />
									Loading...
								</Box>
							</MenuItem>
						) : error ? (
							<MenuItem value="">Error: {error}</MenuItem>
						) : connections.length === 0 ? (
							<MenuItem
								key="add_new"
								value="add_new"
								onClick={(e) => {
									e.preventDefault(); // Ngăn chặn sự kiện chọn
									handleAddConnection();
								}}
								sx={{
									color: "primary.main",
									display: "flex",
									alignItems: "center",
								}}
							>
								{isConnecting ? (
									<>
										<CircularProgress size={20} sx={{ mr: 1 }} />
										Connecting...
									</>
								) : (
									<>
										<Add fontSize="small" sx={{ mr: 1 }} />
										Add new connection
									</>
								)}
							</MenuItem>
						) : (
							[
								...connections.map((connection) => (
									<MenuItem
										key={connection.profile.id}
										value={connection.profile.id}
									>
										{connection.profile.name}
									</MenuItem>
								)),
								<Divider key="divider" />,
								<MenuItem
									key="add_new"
									value="add_new"
									onClick={(e) => {
										e.preventDefault(); // Ngăn chặn sự kiện chọn
										handleAddConnection();
									}}
									sx={{
										color: "primary.main",
										display: "flex",
										alignItems: "center",
									}}
								>
									{isConnecting ? (
										<>
											<CircularProgress size={20} sx={{ mr: 1 }} />
											Connecting...
										</>
									) : (
										<>
											<Add fontSize="small" sx={{ mr: 1 }} />
											Add new connection
										</>
									)}
								</MenuItem>,
							]
						)}
					</Select>
					<Tooltip title="Refresh connections">
						<IconButton
							onClick={handleRefresh}
							size="small"
							sx={{ ml: 1 }}
							disabled={loading}
						>
							<Refresh fontSize="small" />
						</IconButton>
					</Tooltip>
				</Box>
			</FormControl>
		</>
	);
};

// Facebook Page Select Component
interface PageSelectProps {
	connection: string | undefined;
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
}

const PageSelect: React.FC<PageSelectProps> = ({
	connection,
	value,
	onChange,
	disabled,
}) => {
	const [refreshKey, setRefreshKey] = useState<number>(0);
	const { pages, loading, error } = useFacebookPages(
		connection || null,
		refreshKey
	);

	const handleRefresh = () => {
		setRefreshKey((prevKey) => prevKey + 1);
	};

	return (
		<FormControl fullWidth size="small" disabled={disabled}>
			<Box sx={{ display: "flex", width: "100%" }}>
				<Select
					value={value}
					onChange={(e) => onChange(e.target.value)}
					disabled={loading || disabled}
					sx={{ flex: 1 }}
				>
					{loading ? (
						<MenuItem value="">
							<Box sx={{ display: "flex", alignItems: "center" }}>
								<CircularProgress size={20} sx={{ mr: 1 }} />
								Loading...
							</Box>
						</MenuItem>
					) : error ? (
						<MenuItem value="">Error: {error}</MenuItem>
					) : pages.length === 0 ? (
						<MenuItem value="">No Facebook pages found</MenuItem>
					) : (
						pages.map((page) => (
							<MenuItem key={page.id} value={page.id}>
								{page.name}
							</MenuItem>
						))
					)}
				</Select>
				<Tooltip title="Refresh pages">
					<IconButton
						onClick={handleRefresh}
						size="small"
						sx={{ ml: 1 }}
						disabled={loading || disabled}
					>
						<Refresh fontSize="small" />
					</IconButton>
				</Tooltip>
			</Box>
		</FormControl>
	);
};

// Facebook Form Select Component
interface FormSelectProps {
	pageId: string | undefined;
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
}

const FormSelect: React.FC<FormSelectProps> = ({
	pageId,
	value,
	onChange,
	disabled,
}) => {
	const [refreshKey, setRefreshKey] = useState<number>(0);
	const { forms, loading, error } = useFacebookForms(
		pageId || null,
		refreshKey
	);

	const handleRefresh = () => {
		setRefreshKey((prevKey) => prevKey + 1);
	};

	return (
		<FormControl fullWidth size="small" disabled={disabled}>
			<Box sx={{ display: "flex", width: "100%" }}>
				<Select
					value={value}
					onChange={(e) => onChange(e.target.value)}
					disabled={loading || disabled}
					sx={{ flex: 1 }}
				>
					{loading ? (
						<MenuItem value="">
							<Box sx={{ display: "flex", alignItems: "center" }}>
								<CircularProgress size={20} sx={{ mr: 1 }} />
								Loading...
							</Box>
						</MenuItem>
					) : error ? (
						<MenuItem value="">Error: {error}</MenuItem>
					) : forms.length === 0 ? (
						<MenuItem value="">No lead forms found</MenuItem>
					) : (
						forms.map((form) => (
							<MenuItem key={form.id} value={form.id}>
								{form.name}
							</MenuItem>
						))
					)}
				</Select>
				<Tooltip title="Refresh forms">
					<IconButton
						onClick={handleRefresh}
						size="small"
						sx={{ ml: 1 }}
						disabled={loading || disabled}
					>
						<Refresh fontSize="small" />
					</IconButton>
				</Tooltip>
			</Box>
		</FormControl>
	);
};

// Add WebhookDialog component
interface WebhookDialogProps {
	open: boolean;
	onClose: () => void;
	pageId: string;
	pageName: string;
	isSubscribed: boolean;
	onUpdate: (subscribed: boolean) => void;
}

const WebhookDialog: React.FC<WebhookDialogProps> = ({
	open,
	onClose,
	pageId,
	pageName,
	isSubscribed,
	onUpdate,
}) => {
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [appId, setAppId] = useState<string>("");
	const [showUnsubscribeForm, setShowUnsubscribeForm] =
		useState<boolean>(false);

	const handleSubscribe = async () => {
		try {
			setLoading(true);
			setError(null);
			const response = await subscribePageToWebhook(pageId);
			if (response && !response.error) {
				onUpdate(true);
				onClose();
			} else {
				setError(response.error?.message || "Failed to subscribe to webhook");
			}
		} catch (err: any) {
			setError(err.message || "An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	};

	const handleUnsubscribe = async () => {
		if (!appId.trim()) {
			setError("App ID is required for unsubscribing");
			return;
		}
		try {
			setLoading(true);
			setError(null);
			const response = await unsubscribePageFromWebhook(pageId, appId);
			if (response && !response.error) {
				onUpdate(false);
				onClose();
			} else {
				setError(
					response.error?.message || "Failed to unsubscribe from webhook"
				);
			}
		} catch (err: any) {
			setError(err.message || "An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle>
				{isSubscribed ? "Webhook Subscription" : "Subscribe to Webhook"}
			</DialogTitle>
			<DialogContent>
				{error && (
					<Alert severity="error" sx={{ mb: 2 }}>
						{error}
					</Alert>
				)}
				<DialogContentText gutterBottom>
					{isSubscribed
						? `Page "${pageName}" is currently subscribed to webhook notifications.`
						: `Subscribe page "${pageName}" to webhook notifications to receive lead data in real-time.`}
				</DialogContentText>

				{isSubscribed && (
					<>
						<Box sx={{ mt: 2 }}>
							<Button
								variant="outlined"
								color="error"
								onClick={() => setShowUnsubscribeForm(true)}
								disabled={loading || showUnsubscribeForm}
							>
								Unsubscribe from Webhook
							</Button>
						</Box>

						{showUnsubscribeForm && (
							<Box sx={{ mt: 2 }}>
								<DialogContentText>
									To unsubscribe, please enter your Facebook App ID:
								</DialogContentText>
								<TextField
									autoFocus
									margin="dense"
									label="Facebook App ID"
									type="text"
									fullWidth
									multiline
									minRows={1}
									maxRows={10}
									value={appId}
									onChange={(e) => setAppId(e.target.value)}
								/>
							</Box>
						)}
					</>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} disabled={loading}>
					Cancel
				</Button>
				{isSubscribed ? (
					showUnsubscribeForm && (
						<Button
							onClick={handleUnsubscribe}
							color="error"
							variant="contained"
							disabled={loading || !appId.trim()}
						>
							{loading ? <CircularProgress size={24} /> : "Unsubscribe"}
						</Button>
					)
				) : (
					<Button
						onClick={handleSubscribe}
						color="primary"
						variant="contained"
						disabled={loading}
					>
						{loading ? <CircularProgress size={24} /> : "Subscribe"}
					</Button>
				)}
			</DialogActions>
		</Dialog>
	);
};

// Add new WebhookSection component
interface WebhookSectionProps {
	pageId: string;
	connection?: string;
	isSubscribed: boolean;
	onUpdate: (subscribed: boolean) => void;
}

const WebhookSection: React.FC<WebhookSectionProps> = ({
	pageId,
	connection,
	isSubscribed,
	onUpdate,
}) => {
	const [dialogOpen, setDialogOpen] = useState<boolean>(false);
	const { pages } = useFacebookPages(connection || null);
	const page = pages.find((p) => p.id === pageId);
	const pageName = page?.name || "Selected Page";

	return (
		<>
			<Box sx={{ mt: 2, mb: 1 }}>
				<Divider>
					<Chip label="Webhook Settings" />
				</Divider>
			</Box>

			<Box
				sx={{
					mt: 2,
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center" }}>
					<Chip
						size="small"
						label={isSubscribed ? "Subscribed" : "Not Subscribed"}
						color={isSubscribed ? "success" : "default"}
						sx={{ ml: 1 }}
					/>
				</Box>

				<Button
					startIcon={<NotificationImportant />}
					variant="outlined"
					size="small"
					onClick={() => setDialogOpen(true)}
				>
					Manage Webhook
				</Button>
			</Box>

			<WebhookDialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				pageId={pageId}
				pageName={pageName}
				isSubscribed={isSubscribed}
				onUpdate={onUpdate}
			/>
		</>
	);
};

// Google Calendar Connection Select Component
interface CalendarConnectionSelectProps {
	value: string;
	onChange: (value: string) => void;
}

const CalendarConnectionSelect: React.FC<CalendarConnectionSelectProps> = ({
	value,
	onChange,
}) => {
	const [refreshKey, setRefreshKey] = useState<number>(0);
	const [isConnecting, setIsConnecting] = useState<boolean>(false);
	const { connections, loading, error } =
		useGoogleCalendarConnections(refreshKey);

	const handleRefresh = () => {
		setRefreshKey((prevKey) => prevKey + 1);
	};

	const handleAddConnection = async () => {
		// Mở cửa sổ mới để kết nối Google Calendar
		setIsConnecting(true);

		try {
			const { popupWindow, error } = await openGoogleCalendarConnect();

			if (error) {
				setIsConnecting(false);
				return;
			}

			// Theo dõi trạng thái của cửa sổ popup
			const checkPopup = setInterval(() => {
				if (popupWindow?.closed) {
					clearInterval(checkPopup);
					setIsConnecting(false);
					handleRefresh();
				}
			}, 1000);
		} catch (err) {
			console.error("Error connecting to Google Calendar:", err);
			setIsConnecting(false);
		}
	};

	useEffect(() => {
		// Lắng nghe sự kiện từ cửa sổ popup khi kết nối hoàn tất
		const handleConnectionComplete = () => {
			if (isConnecting) {
				setTimeout(() => {
					handleRefresh();
				}, 1000);
			}
		};

		window.addEventListener("focus", handleConnectionComplete);

		return () => {
			window.removeEventListener("focus", handleConnectionComplete);
		};
	}, [isConnecting]);

	return (
		<>
			<FormControl fullWidth size="small">
				<Box sx={{ display: "flex", width: "100%" }}>
					<Select
						value={value}
						onChange={(e) => {
							// Chỉ thay đổi giá trị khi không phải là "add_new"
							if (e.target.value !== "add_new") {
								onChange(e.target.value);
							}
						}}
						disabled={loading}
						sx={{ flex: 1 }}
					>
						{loading ? (
							<MenuItem value="">
								<Box sx={{ display: "flex", alignItems: "center" }}>
									<CircularProgress size={20} sx={{ mr: 1 }} />
									Loading...
								</Box>
							</MenuItem>
						) : error ? (
							<MenuItem value="">Error: {error}</MenuItem>
						) : connections.length === 0 ? (
							<MenuItem
								key="add_new"
								value="add_new"
								onClick={(e) => {
									e.preventDefault(); // Ngăn chặn sự kiện chọn
									handleAddConnection();
								}}
								sx={{
									color: "primary.main",
									display: "flex",
									alignItems: "center",
								}}
							>
								{isConnecting ? (
									<>
										<CircularProgress size={20} sx={{ mr: 1 }} />
										Connecting...
									</>
								) : (
									<>
										<Add fontSize="small" sx={{ mr: 1 }} />
										Add new connection
									</>
								)}
							</MenuItem>
						) : (
							[
								...connections.map((connection) => (
									<MenuItem
										key={connection.profile.id}
										value={connection.profile.id}
									>
										{connection.profile.name || connection.profile.email}
									</MenuItem>
								)),
								<Divider key="divider" />,
								<MenuItem
									key="add_new"
									value="add_new"
									onClick={(e) => {
										e.preventDefault(); // Ngăn chặn sự kiện chọn
										handleAddConnection();
									}}
									sx={{
										color: "primary.main",
										display: "flex",
										alignItems: "center",
									}}
								>
									{isConnecting ? (
										<>
											<CircularProgress size={20} sx={{ mr: 1 }} />
											Connecting...
										</>
									) : (
										<>
											<Add fontSize="small" sx={{ mr: 1 }} />
											Add new connection
										</>
									)}
								</MenuItem>,
							]
						)}
					</Select>
					<Tooltip title="Refresh connections">
						<IconButton
							onClick={handleRefresh}
							size="small"
							sx={{ ml: 1 }}
							disabled={loading}
						>
							<Refresh fontSize="small" />
						</IconButton>
					</Tooltip>
				</Box>
			</FormControl>
		</>
	);
};

// Function to get operators based on type
const getOperatorsForType = (type: string) => {
	switch (type) {
		case "string":
			return [
				{ value: "equals", label: "Equals" },
				{ value: "notEquals", label: "Not Equals" },
				{ value: "contains", label: "Contains" },
				{ value: "startsWith", label: "Starts With" },
				{ value: "endsWith", label: "Ends With" },
				{ value: "isEmpty", label: "Is Empty" },
				{ value: "isNotEmpty", label: "Is Not Empty" },
			];
		case "number":
			return [
				{ value: "equals", label: "Equals" },
				{ value: "notEquals", label: "Not Equals" },
				{ value: "greaterThan", label: "Greater Than" },
				{ value: "greaterThanOrEqual", label: "Greater Than or Equal" },
				{ value: "lessThan", label: "Less Than" },
				{ value: "lessThanOrEqual", label: "Less Than or Equal" },
				{ value: "between", label: "Between" },
			];
		case "email":
			return [
				{ value: "equals", label: "Equals" },
				{ value: "notEquals", label: "Not Equals" },
				{ value: "contains", label: "Contains" },
				{ value: "domainEquals", label: "Domain Equals" },
				{ value: "isValid", label: "Is Valid Email" },
			];
		case "phone":
			return [
				{ value: "equals", label: "Equals" },
				{ value: "notEquals", label: "Not Equals" },
				{ value: "startsWith", label: "Starts With" },
				{ value: "countryCode", label: "Has Country Code" },
			];
		case "date":
			return [
				{ value: "equals", label: "Equals" },
				{ value: "notEquals", label: "Not Equals" },
				{ value: "before", label: "Before" },
				{ value: "after", label: "After" },
				{ value: "between", label: "Between" },
			];
		case "boolean":
			return [
				{ value: "isTrue", label: "Is True" },
				{ value: "isFalse", label: "Is False" },
			];
		default:
			return [{ value: "equals", label: "Equals" }];
	}
};

// Function to determine if value input should be shown
const shouldShowValueInput = (operator: string) => {
	return !["isEmpty", "isNotEmpty", "isValid", "isTrue", "isFalse"].includes(
		operator
	);
};

// Add these utility functions before the PropertiesPanel component
const dayNameToNumber = (dayName: string): number => {
	const days = [
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
		"Sunday",
	];
	return days.indexOf(dayName);
};

const dayNumberToName = (dayNumber: number): string => {
	const days = [
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
		"Sunday",
	];
	return days[dayNumber];
};

const daysOfWeek = [
	{ value: 0, label: "Monday" },
	{ value: 1, label: "Tuesday" },
	{ value: 2, label: "Wednesday" },
	{ value: 3, label: "Thursday" },
	{ value: 4, label: "Friday" },
	{ value: 5, label: "Saturday" },
	{ value: 6, label: "Sunday" },
];

// Tooltip mapping
const propertyTooltips = {
	prompt:
		"Describe what the AI should say or ask. Example: 'Ask the lead about their business needs.'",
	introduction:
		"Opening message for the call. Example: 'Hello, this is Anna from Acme Corp.'",
	questions:
		"List of questions to ask the lead. Example: 'What is your budget? What services are you interested in?' You can add multiple questions.",
	goodByeMessage:
		"Closing message for the call. Example: 'Thank you for your time! We will be in touch soon.'",
	language: "Select the language for the AI call. Supported: English.",
	// Pre-verify tooltips:
	enableWebScraping:
		"Enable to use web scraping for additional lead verification based on online data.",
	webScrapingPrompt:
		"Describe what information to extract from the web for verification. Example: 'Check if the company website lists a valid phone number.'",
	criteriaField: "The field to check, e.g., 'email', 'phone', or 'company'.",
	criteriaType:
		"The data type of the field, e.g., string, number, email, phone, date, boolean.",
	criteriaOperator:
		"How to compare the field, e.g., equals, contains, is valid, is empty, etc.",
	criteriaValue:
		"The value to compare against. Example: 'gmail.com' for email domain, or a minimum number for budget.",
	// Google Calendar tooltips:
	calendarConnection:
		"Select or connect your Google Calendar account to sync events.",
	calendarName:
		"Name of the calendar to use for scheduling meetings. Example: 'Sales Team Calendar'.",
	eventName:
		"Title for the scheduled event. Example: 'Consultation Call with Lead'.",
	startWorkDay:
		"The first day of the work week for scheduling. Example: Monday.",
	endWorkDay: "The last day of the work week for scheduling. Example: Friday.",
	startTime: "The earliest time meetings can be scheduled. Example: 09:00.",
	endTime: "The latest time meetings can be scheduled. Example: 17:00.",
	duration: "Length of each meeting in minutes. Example: 30.",
	// Facebook Lead Ads tooltips:
	facebookConnection:
		"Select or connect your Facebook account to access your pages and forms.",
	facebookPage: "Choose the Facebook Page that owns the lead form.",
	facebookForm: "Select the Facebook Lead Form to capture leads from.",
	// Sheet tooltips:
	sheetConnection:
		"Select or connect your Google account to access Google Sheets.",
	sheetUrl:
		"Paste the full URL of the Google Sheet to import/export leads. Example: 'https://docs.google.com/spreadsheets/d/...'",
	// Webhook tooltips:
	webhookUrl:
		"The endpoint where lead data will be sent. Must start with http(s)://. Example: 'https://yourdomain.com/webhook'",
};

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
	selectedNode,
	onChange,
	onClose,
	flowId,
	flowName = "Untitled Flow",
}) => {
	const [localSettings, setLocalSettings] = useState<NodeSettings>({});
	const [isTestingCall, setIsTestingCall] = useState<boolean>(false);
	const [callResult, setCallResult] = useState<any>(null);
	const [openCallResultDialog, setOpenCallResultDialog] =
		useState<boolean>(false);
	const [hasChanges, setHasChanges] = useState<boolean>(false);
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const reactFlowInstance = useReactFlow();
	const [subscribing, setSubscribing] = useState(false);

	// --- Added for Optimize Dialog ---
	const [optimizeDialogOpen, setOptimizeDialogOpen] = useState(false);
	const [optimizedPrompt, setOptimizedPrompt] = useState<string>("");
	const [isOptimizing, setIsOptimizing] = useState<boolean>(false);

	if (!selectedNode) {
		return null;
	}

	// Initialize local settings if node changes
	useEffect(() => {
		if (selectedNode) {
			const nodeSettings = selectedNode.data?.settings || {};
			let defaultSettingsApplied = false;
			let defaultSettings = {};

			// Khởi tạo giá trị mặc định cho node aiCall mới
			if (
				selectedNode.type === "aiCall" &&
				Object.keys(nodeSettings).length === 0
			) {
				defaultSettings = {
					language: "english",
					prompt: "",
					introduction: "",
					questions: [""],
					goodByeMessage: "",
				};
				setLocalSettings(defaultSettings);
				defaultSettingsApplied = true;
			}
			// Khởi tạo giá trị mặc định cho node googleCalendar mới
			else if (
				selectedNode.type === "googleCalendar" &&
				Object.keys(nodeSettings).length === 0
			) {
				defaultSettings = {
					calendarName: "",
					eventName: "",
					startWorkDays: 0,
					endWorkDays: 4,
					startTime: "09:00",
					endTime: "17:00",
					duration: 30,
				};
				setLocalSettings(defaultSettings);
				defaultSettingsApplied = true;
			}
			// Khởi tạo giá trị mặc định cho node preVerify mới
			else if (
				selectedNode.type === "preVerify" &&
				Object.keys(nodeSettings).length === 0
			) {
				defaultSettings = {
					enableWebScraping: false,
					webScrapingPrompt: "",
					criteria: [
						{
							field: "email",
							type: "email",
							operator: "isValid",
							value: "",
						},
						{
							field: "phone",
							type: "string",
							operator: "isNotEmpty",
							value: "",
						},
					],
				};
				setLocalSettings(defaultSettings);
				defaultSettingsApplied = true;
			}
			// Khởi tạo giá trị mặc định cho node Facebook Lead Ads mới
			else if (
				selectedNode.type === "facebookLeadAds" &&
				Object.keys(nodeSettings).length === 0
			) {
				defaultSettings = {
					connection: "",
					pageId: "",
					formId: "",
				};
				setLocalSettings(defaultSettings);
				defaultSettingsApplied = true;
			}
			// Khởi tạo giá trị mặc định cho node webhook mới
			else if (
				selectedNode.type === "sendWebhook" &&
				Object.keys(nodeSettings).length === 0
			) {
				defaultSettings = {
					webhookUrl: "",
					method: "POST",
					headers: "{}",
					timeout: 30,
					retryCount: 3,
				};
				setLocalSettings(defaultSettings);
				defaultSettingsApplied = true;
			} else {
				setLocalSettings(nodeSettings as NodeSettings);
			}

			// Nếu đã áp dụng giá trị mặc định, tự động cập nhật node data
			if (defaultSettingsApplied) {
				// Cập nhật node data với giá trị mặc định
				onChange(selectedNode.id, {
					...selectedNode.data,
					settings: defaultSettings,
				});
			}

			setHasChanges(false);
		}
	}, [selectedNode, onChange]);

	const updateSettings = (
		key: string,
		value:
			| string
			| number
			| boolean
			| Array<string>
			| Array<{ [key: string]: any }>
	) => {
		const updatedSettings = { ...localSettings, [key]: value };
		setLocalSettings(updatedSettings);
		setHasChanges(true);
	};

	const handleSaveChanges = async () => {
		if (!validateSettings()) {
			toast.error("Please fill in all required fields before saving.");
			return;
		}

		if (selectedNode.type === "facebookLeadAds" && localSettings.pageId) {
			setIsSaving(true);
			try {
				const response = await subscribePageToWebhook(
					localSettings.pageId as string
				);
				if (response && !response.error) {
				} else {
					toast.error(
						response.error?.message || "Failed to subscribe to webhook"
					);
					setIsSaving(false);
					return;
				}
			} catch (err) {
				toast.error("Unexpected error subscribing to webhook");
				setIsSaving(false);
				return;
			}
		}

		// Update locally first
		onChange(selectedNode.id, {
			...selectedNode.data,
			settings: localSettings,
			...(selectedNode.type === "facebookLeadAds" && localSettings.pageId
				? { webhookSubscribed: true }
				: {}),
		});

		// If we have a flowId, also update on the server
		if (flowId) {
			try {
				setIsSaving(true);

				// Get current flow data directly from the React Flow instance
				const currentFlowData = reactFlowInstance.toObject();

				// Update the specific node's settings in the current flow data
				const updatedNodes = currentFlowData.nodes.map((node: any) => {
					if (node.id === selectedNode.id) {
						return {
							...node,
							data: {
								...node.data,
								settings: localSettings,
								...(selectedNode.type === "facebookLeadAds" &&
								localSettings.pageId
									? { webhookSubscribed: true }
									: {}),
							},
						};
					}
					return node;
				});

				// Prepare the data for API call (similar to onSave in FlowEditor)
				const flowUpdateData = {
					flowName: flowName,
					nodeData: {
						...currentFlowData,
						nodes: updatedNodes,
					},
				};

				// Save to localStorage for consistency with FlowEditor
				localStorage.setItem(
					"flow-data",
					JSON.stringify({
						...currentFlowData,
						nodes: updatedNodes,
					})
				);

				// Call API to update the flow on the server
				await updateFlow(flowId, flowUpdateData);
			} catch (error) {
				console.error("Error saving node settings:", error);
				toast.error("Failed to save settings to server");
			} finally {
				setIsSaving(false);
				setHasChanges(false);
			}
		} else {
			// No flowId, just update locally
			toast.success(`${selectedNode.type} node settings saved locally!`);
			setHasChanges(false);
			setIsSaving(false);
		}
	};

	const handleTextChange =
		(key: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
			updateSettings(key, event.target.value);
		};

	const handleSelectChange = (key: string) => (event: SelectChangeEvent) => {
		updateSettings(key, event.target.value);
	};

	const handleNumberChange =
		(key: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
			updateSettings(key, parseInt(event.target.value) || 0);
		};

	const validateSettings = (): boolean => {
		const nodeType = selectedNode.type || "default";
		switch (nodeType) {
			case "aiCall":
				return (
					!!localSettings.language &&
					!!localSettings.introduction &&
					Array.isArray(localSettings.questions) &&
					localSettings.questions.length > 0 &&
					localSettings.questions.every((q) => q && q.trim() !== "") &&
					!!localSettings.goodByeMessage
				);
			case "preVerify":
				return (
					Array.isArray(localSettings.criteria) &&
					localSettings.criteria.length > 0 &&
					localSettings.criteria.every((c: any) => c.field && c.operator)
				);
			case "facebookLeadAds":
				return (
					!!localSettings.connection &&
					!!localSettings.pageId &&
					!!localSettings.formId
				);
			case "sendWebhook":
				return !!localSettings.webhookUrl;
			case "googleCalendar":
				return (
					!!localSettings.connection &&
					!!localSettings.calendarName &&
					!!localSettings.eventName
				);
			case "getSheetLead":
			case "exportSheetLead":
				return !!localSettings.connection && !!localSettings.sheetUrl;
			default:
				return true;
		}
	};

	const handleOpenOptimizeDialog = () => {
		setOptimizedPrompt(localSettings.prompt || "");
		setOptimizeDialogOpen(true);
	};

	const handleCloseOptimizeDialog = () => {
		setOptimizeDialogOpen(false);
	};

	const handleOptimizePrompt = async () => {
		if (!localSettings.prompt) {
			toast.error("Please enter a prompt to optimize.");
			return;
		}
		setIsOptimizing(true);
		try {
			const result = await optimizePrompt(localSettings.prompt);
			if (result && typeof result === "string") {
				setOptimizedPrompt(result);
				toast.success("Prompt optimized!");
			} else if (result?.optimizedPrompt) {
				setOptimizedPrompt(result.optimizedPrompt);
				toast.success("Prompt optimized!");
			} else {
				toast.error("Failed to optimize prompt.");
			}
		} catch (error) {
			toast.error("Failed to optimize prompt.");
		} finally {
			setIsOptimizing(false);
		}
	};

	const handleUseOptimizedPrompt = () => {
		updateSettings("prompt", optimizedPrompt);
		setOptimizeDialogOpen(false);
	};

	const renderSettings = () => {
		const nodeType = selectedNode.type || "default";

		switch (nodeType) {
			case "facebookLeadAds":
				return (
					<>
						<FormControl fullWidth margin="normal" size="small">
							<Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
								<Typography variant="body2" sx={{ fontWeight: 500 }}>
									Facebook Connection *
								</Typography>
								<Tooltip
									title={propertyTooltips.facebookConnection}
									arrow
									placement="right"
									enterDelay={300}
								>
									<IconButton size="small" sx={{ ml: 0.5 }}>
										<HelpOutline fontSize="small" color="primary" />
									</IconButton>
								</Tooltip>
							</Box>
							<ConnectionSelect
								value={localSettings.connection || ""}
								onChange={(value) => updateSettings("connection", value)}
							/>
						</FormControl>

						<FormControl fullWidth margin="normal" size="small">
							<Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
								<Typography variant="body2" sx={{ fontWeight: 500 }}>
									Facebook Page *
								</Typography>
								<Tooltip
									title={propertyTooltips.facebookPage}
									arrow
									placement="right"
									enterDelay={300}
								>
									<IconButton size="small" sx={{ ml: 0.5 }}>
										<HelpOutline fontSize="small" color="primary" />
									</IconButton>
								</Tooltip>
							</Box>
							<PageSelect
								connection={localSettings.connection}
								value={localSettings.pageId || ""}
								onChange={(value) => updateSettings("pageId", value)}
								disabled={!localSettings.connection}
							/>
						</FormControl>

						<FormControl fullWidth margin="normal" size="small">
							<Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
								<Typography variant="body2" sx={{ fontWeight: 500 }}>
									Lead Form *
								</Typography>
								<Tooltip
									title={propertyTooltips.facebookForm}
									arrow
									placement="right"
									enterDelay={300}
								>
									<IconButton size="small" sx={{ ml: 0.5 }}>
										<HelpOutline fontSize="small" color="primary" />
									</IconButton>
								</Tooltip>
							</Box>
							<FormSelect
								pageId={localSettings.pageId}
								value={localSettings.formId || ""}
								onChange={(value) => updateSettings("formId", value)}
								disabled={!localSettings.pageId}
							/>
						</FormControl>
					</>
				);

			case "aiCall":
				return (
					<>
						<FormControl fullWidth margin="normal" size="small">
							<Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
								<Typography variant="body2" sx={{ fontWeight: 500 }}>
									Language *
								</Typography>
								<Tooltip
									title={propertyTooltips.language}
									arrow
									placement="right"
									enterDelay={300}
								>
									<IconButton size="small" sx={{ ml: 0.5 }}>
										<HelpOutline fontSize="small" color="primary" />
									</IconButton>
								</Tooltip>
							</Box>
							<Select
								value={localSettings.language || "vietnamese"}
								onChange={handleSelectChange("language")}
							>
								<MenuItem value="english">English</MenuItem>
							</Select>
						</FormControl>

						{/* Optimize Button above Prompt */}
						<Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
							<Button
								variant="outlined"
								size="small"
								onClick={handleOpenOptimizeDialog}
							>
								Optimize
							</Button>
						</Box>
						<FormControl fullWidth margin="normal" size="small">
							<Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
								<Typography variant="body2" sx={{ fontWeight: 500 }}>
									Prompt *
								</Typography>
								<Tooltip
									title={propertyTooltips.prompt}
									arrow
									placement="right"
									enterDelay={300}
								>
									<IconButton size="small" sx={{ ml: 0.5 }}>
										<HelpOutline fontSize="small" color="primary" />
									</IconButton>
								</Tooltip>
							</Box>
							<TextField
								fullWidth
								size="small"
								value={localSettings.prompt || ""}
								onChange={handleTextChange("prompt")}
								placeholder="Enter prompt"
							/>
						</FormControl>

						{/* Optimize Dialog */}
						<Dialog
							open={optimizeDialogOpen}
							onClose={handleCloseOptimizeDialog}
							maxWidth="sm"
							fullWidth
						>
							<DialogTitle
								sx={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
								}}
							>
								Optimize Prompt
								<Button
									onClick={handleOptimizePrompt}
									variant="contained"
									size="small"
									disabled={isOptimizing}
								>
									{isOptimizing ? <CircularProgress size={20} /> : "Optimize"}
								</Button>
							</DialogTitle>
							<DialogContent>
								<TextField
									fullWidth
									label="Prompt"
									multiline
									minRows={4}
									maxRows={12}
									value={optimizedPrompt}
									onChange={(e) => setOptimizedPrompt(e.target.value)}
									margin="normal"
								/>
							</DialogContent>
							<DialogActions sx={{ justifyContent: "center" }}>
								<Button
									variant="contained"
									color="primary"
									onClick={handleUseOptimizedPrompt}
								>
									Use the optimized prompt
								</Button>
							</DialogActions>
						</Dialog>

						<FormControl fullWidth margin="normal" size="small">
							<Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
								<Typography variant="body2" sx={{ fontWeight: 500 }}>
									Introduction *
								</Typography>
								<Tooltip
									title={propertyTooltips.introduction}
									arrow
									placement="right"
									enterDelay={300}
								>
									<IconButton size="small" sx={{ ml: 0.5 }}>
										<HelpOutline fontSize="small" color="primary" />
									</IconButton>
								</Tooltip>
							</Box>
							<TextField
								fullWidth
								size="small"
								variant="outlined"
								multiline
								minRows={1}
								maxRows={10}
								value={localSettings.introduction || ""}
								onChange={handleTextChange("introduction")}
								placeholder="Enter introduction message"
								required
							/>
						</FormControl>

						<Box sx={{ mt: 2, mb: 1 }}>
							<Divider>
								<Chip label="Questions" />
								<Tooltip
									title={propertyTooltips.questions}
									arrow
									placement="top"
									enterDelay={300}
								>
									<IconButton size="small" sx={{ ml: 0.5 }}>
										<HelpOutline fontSize="small" color="primary" />
									</IconButton>
								</Tooltip>
							</Divider>
						</Box>

						{/* Render questions dynamically */}
						{(localSettings.questions || [""]).map((question, index) => (
							<Box
								key={index}
								sx={{ display: "flex", mb: 3, alignItems: "center" }}
							>
								<TextField
									fullWidth
									size="small"
									label={`Question ${index + 1}`}
									required
									variant="outlined"
									multiline
									minRows={1}
									maxRows={10}
									value={question}
									onChange={(e) => {
										const newQuestions = [...(localSettings.questions || [""])];
										newQuestions[index] = e.target.value;
										updateSettings("questions", newQuestions);
									}}
									placeholder="Enter question"
								/>
								<Box sx={{ display: "flex", ml: 1 }}>
									{(localSettings.questions || [""]).length > 1 && (
										<IconButton
											size="small"
											color="error"
											onClick={() => {
												const newQuestions = [
													...(localSettings.questions || [""]),
												];
												newQuestions.splice(index, 1);
												updateSettings("questions", newQuestions);
											}}
										>
											<Close fontSize="small" />
										</IconButton>
									)}
								</Box>
							</Box>
						))}

						{/* Add question button */}
						<Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
							<Button
								variant="outlined"
								size="small"
								startIcon={<Add />}
								onClick={() => {
									const newQuestions = [
										...(localSettings.questions || [""]),
										"",
									];
									updateSettings("questions", newQuestions);
								}}
							>
								Add question
							</Button>
						</Box>

						<FormControl fullWidth margin="normal" size="small">
							<Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
								<Typography variant="body2" sx={{ fontWeight: 500 }}>
									Goodbye Message *
								</Typography>
								<Tooltip
									title={propertyTooltips.goodByeMessage}
									arrow
									placement="right"
									enterDelay={300}
								>
									<IconButton size="small" sx={{ ml: 0.5 }}>
										<HelpOutline fontSize="small" color="primary" />
									</IconButton>
								</Tooltip>
							</Box>
							<TextField
								fullWidth
								size="small"
								variant="outlined"
								multiline
								minRows={1}
								maxRows={10}
								value={localSettings.goodByeMessage || ""}
								onChange={handleTextChange("goodByeMessage")}
								placeholder="Enter goodbye message"
								required
							/>
						</FormControl>
					</>
				);

			case "googleCalendar":
				return (
					<>
						<FormControl fullWidth margin="normal" size="small">
							<Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
								<Typography variant="body2" sx={{ fontWeight: 500 }}>
									Google Calendar Connection *
								</Typography>
								<Tooltip
									title={propertyTooltips.calendarConnection}
									arrow
									placement="right"
									enterDelay={300}
								>
									<IconButton size="small" sx={{ ml: 0.5 }}>
										<HelpOutline fontSize="small" color="primary" />
									</IconButton>
								</Tooltip>
							</Box>
							<CalendarConnectionSelect
								value={localSettings.connection || ""}
								onChange={(value) => updateSettings("connection", value)}
							/>
						</FormControl>

						<FormControl fullWidth margin="normal" size="small">
							<Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
								<Typography variant="body2" sx={{ fontWeight: 500 }}>
									Calendar Name *
								</Typography>
								<Tooltip
									title={propertyTooltips.calendarName}
									arrow
									placement="right"
									enterDelay={300}
								>
									<IconButton size="small" sx={{ ml: 0.5 }}>
										<HelpOutline fontSize="small" color="primary" />
									</IconButton>
								</Tooltip>
							</Box>
							<TextField
								fullWidth
								size="small"
								variant="outlined"
								multiline
								minRows={1}
								maxRows={10}
								value={localSettings.calendarName || ""}
								onChange={handleTextChange("calendarName")}
								placeholder="Enter calendar name"
								required
							/>
						</FormControl>

						<FormControl fullWidth margin="normal" size="small">
							<Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
								<Typography variant="body2" sx={{ fontWeight: 500 }}>
									Event Name *
								</Typography>
								<Tooltip
									title={propertyTooltips.eventName}
									arrow
									placement="right"
									enterDelay={300}
								>
									<IconButton size="small" sx={{ ml: 0.5 }}>
										<HelpOutline fontSize="small" color="primary" />
									</IconButton>
								</Tooltip>
							</Box>
							<TextField
								fullWidth
								size="small"
								variant="outlined"
								multiline
								minRows={1}
								maxRows={10}
								value={localSettings.eventName || ""}
								onChange={handleTextChange("eventName")}
								placeholder="Enter event name"
								required
							/>
						</FormControl>

						<Box sx={{ mt: 2, mb: 1 }}>
							<Divider>
								<Chip label="Working Days" />
								<Tooltip
									title={propertyTooltips.startWorkDay}
									arrow
									placement="top"
									enterDelay={300}
								>
									<IconButton size="small" sx={{ ml: 0.5 }}>
										<HelpOutline fontSize="small" color="primary" />
									</IconButton>
								</Tooltip>
							</Divider>
						</Box>

						<FormControl fullWidth margin="normal" size="small">
							<Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
								<Typography variant="body2" sx={{ fontWeight: 500 }}>
									Start Work Day *
								</Typography>
								<Tooltip
									title={propertyTooltips.startWorkDay}
									arrow
									placement="right"
									enterDelay={300}
								>
									<IconButton size="small" sx={{ ml: 0.5 }}>
										<HelpOutline fontSize="small" color="primary" />
									</IconButton>
								</Tooltip>
							</Box>
							<Select
								value={
									localSettings.startWorkDays !== undefined
										? localSettings.startWorkDays
										: 0
								}
								onChange={(e) => {
									updateSettings("startWorkDays", Number(e.target.value));
								}}
							>
								{daysOfWeek.map((day) => (
									<MenuItem key={day.value} value={day.value}>
										{day.label}
									</MenuItem>
								))}
							</Select>
						</FormControl>

						<FormControl fullWidth margin="normal" size="small">
							<Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
								<Typography variant="body2" sx={{ fontWeight: 500 }}>
									End Work Day *
								</Typography>
								<Tooltip
									title={propertyTooltips.endWorkDay}
									arrow
									placement="right"
									enterDelay={300}
								>
									<IconButton size="small" sx={{ ml: 0.5 }}>
										<HelpOutline fontSize="small" color="primary" />
									</IconButton>
								</Tooltip>
							</Box>
							<Select
								value={
									localSettings.endWorkDays !== undefined
										? localSettings.endWorkDays
										: 4
								}
								onChange={(e) => {
									updateSettings("endWorkDays", Number(e.target.value));
								}}
							>
								{daysOfWeek.map((day) => (
									<MenuItem key={day.value} value={day.value}>
										{day.label}
									</MenuItem>
								))}
							</Select>
						</FormControl>

						<Box sx={{ mt: 2, mb: 1 }}>
							<Divider>
								<Chip label="Working Hours" />
								<Tooltip
									title={propertyTooltips.startTime}
									arrow
									placement="top"
									enterDelay={300}
								>
									<IconButton size="small" sx={{ ml: 0.5 }}>
										<HelpOutline fontSize="small" color="primary" />
									</IconButton>
								</Tooltip>
							</Divider>
						</Box>

						<Box sx={{ display: "flex", gap: 2 }}>
							<FormControl fullWidth margin="normal" size="small">
								<Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
									<Typography variant="body2" sx={{ fontWeight: 500 }}>
										Start Time *
									</Typography>
									<Tooltip
										title={propertyTooltips.startTime}
										arrow
										placement="right"
										enterDelay={300}
									>
										<IconButton size="small" sx={{ ml: 0.5 }}>
											<HelpOutline fontSize="small" color="primary" />
										</IconButton>
									</Tooltip>
								</Box>
								<TextField
									fullWidth
									size="small"
									type="time"
									variant="outlined"
									value={localSettings.startTime || "09:00"}
									onChange={handleTextChange("startTime")}
									InputLabelProps={{ shrink: true }}
									inputProps={{ step: 300 }}
								/>
							</FormControl>
							<FormControl fullWidth margin="normal" size="small">
								<Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
									<Typography variant="body2" sx={{ fontWeight: 500 }}>
										End Time *
									</Typography>
									<Tooltip
										title={propertyTooltips.endTime}
										arrow
										placement="right"
										enterDelay={300}
									>
										<IconButton size="small" sx={{ ml: 0.5 }}>
											<HelpOutline fontSize="small" color="primary" />
										</IconButton>
									</Tooltip>
								</Box>
								<TextField
									fullWidth
									size="small"
									type="time"
									variant="outlined"
									value={localSettings.endTime || "17:00"}
									onChange={handleTextChange("endTime")}
									InputLabelProps={{ shrink: true }}
									inputProps={{ step: 300 }}
								/>
							</FormControl>
						</Box>

						<Box sx={{ mt: 2, mb: 2 }}>
							<Typography variant="subtitle2" gutterBottom>
								Duration (minutes)
								<Tooltip
									title={propertyTooltips.duration}
									arrow
									placement="right"
									enterDelay={300}
								>
									<IconButton size="small" sx={{ ml: 0.5 }}>
										<HelpOutline fontSize="small" color="primary" />
									</IconButton>
								</Tooltip>
							</Typography>
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									gap: 2,
								}}
							>
								<IconButton
									color="primary"
									onClick={() => {
										const currentValue = parseInt(
											String(localSettings.duration || 30)
										);
										if (currentValue >= 10) {
											// Không cho phép giảm dưới 5 phút
											updateSettings("duration", currentValue - 5);
										}
									}}
								>
									<Remove />
								</IconButton>
								<Box
									sx={{
										width: "80px",
										textAlign: "center",
										padding: "8px 12px",
										border: "1px solid #e0e0e0",
										borderRadius: "4px",
										fontSize: "16px",
										fontWeight: "bold",
										backgroundColor: "#f5f5f5",
									}}
									className="lead-info-dialog"
								>
									{localSettings.duration || 30}
								</Box>
								<IconButton
									color="primary"
									onClick={() => {
										const currentValue = parseInt(
											String(localSettings.duration || 0)
										);
										updateSettings("duration", currentValue + 5);
									}}
								>
									<Add />
								</IconButton>
							</Box>
							<Typography
								variant="caption"
								color="text.secondary"
								align="center"
								sx={{ display: "block", mt: 1 }}
							>
								Meeting Duration (minutes)
							</Typography>
						</Box>
					</>
				);

			case "sendWebhook":
				return (
					<>
						<FormControl fullWidth margin="normal" size="small">
							<Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
								<Typography variant="body2" sx={{ fontWeight: 500 }}>
									Webhook URL *
								</Typography>
								<Tooltip
									title={propertyTooltips.webhookUrl}
									arrow
									placement="right"
									enterDelay={300}
								>
									<IconButton size="small" sx={{ ml: 0.5 }}>
										<HelpOutline fontSize="small" color="primary" />
									</IconButton>
								</Tooltip>
							</Box>
							<TextField
								fullWidth
								size="small"
								value={localSettings.webhookUrl || ""}
								onChange={(e) => {
									let value = e.target.value;
									if (
										value &&
										!(
											value.startsWith("http://") ||
											value.startsWith("https://")
										)
									) {
										value = "https://" + value;
									}
									updateSettings("webhookUrl", value);
								}}
								placeholder="Enter webhook URL"
								required
							/>
						</FormControl>
					</>
				);

			case "condition":
				return (
					<>
						<TextField
							fullWidth
							size="small"
							label="Condition Field"
							variant="outlined"
							margin="normal"
							multiline
							minRows={1}
							maxRows={10}
							value={localSettings.field || ""}
							onChange={handleTextChange("field")}
							placeholder="Enter field name"
						/>
						<FormControl fullWidth margin="normal" size="small">
							<InputLabel>Operator</InputLabel>
							<Select
								value={localSettings.operator || "equals"}
								onChange={handleSelectChange("operator")}
								label="Operator"
							>
								<MenuItem value="equals">Equals</MenuItem>
								<MenuItem value="notEquals">Not Equals</MenuItem>
								<MenuItem value="contains">Contains</MenuItem>
								<MenuItem value="greaterThan">Greater Than</MenuItem>
								<MenuItem value="lessThan">Less Than</MenuItem>
							</Select>
						</FormControl>
						<TextField
							fullWidth
							size="small"
							label="Value"
							variant="outlined"
							margin="normal"
							multiline
							minRows={1}
							maxRows={10}
							value={localSettings.value || ""}
							onChange={handleTextChange("value")}
							placeholder="Enter value to compare"
						/>
					</>
				);

			case "email":
				return (
					<>
						<FormControl fullWidth margin="normal" size="small">
							<InputLabel>Email Provider</InputLabel>
							<Select
								value={localSettings.provider || "smtp"}
								onChange={handleSelectChange("provider")}
								label="Email Provider"
							>
								<MenuItem value="smtp">SMTP</MenuItem>
								<MenuItem value="sendgrid">SendGrid</MenuItem>
								<MenuItem value="mailchimp">Mailchimp</MenuItem>
							</Select>
						</FormControl>
						<TextField
							fullWidth
							size="small"
							label="Subject Template"
							variant="outlined"
							margin="normal"
							multiline
							minRows={1}
							maxRows={10}
							value={localSettings.subject || ""}
							onChange={handleTextChange("subject")}
							placeholder="Enter email subject"
						/>
						<TextField
							fullWidth
							size="small"
							label="Email Template"
							variant="outlined"
							margin="normal"
							multiline
							minRows={3}
							maxRows={10}
							value={localSettings.template || ""}
							onChange={handleTextChange("template")}
							placeholder="Enter email template"
						/>
					</>
				);

			case "exportSheetLead":
				return (
					<>
						<FormControl fullWidth margin="normal" size="small">
							<Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
								<Typography variant="body2" sx={{ fontWeight: 500 }}>
									Google Account Connection *
								</Typography>
								<Tooltip
									title={propertyTooltips.sheetConnection}
									arrow
									placement="right"
									enterDelay={300}
								>
									<IconButton size="small" sx={{ ml: 0.5 }}>
										<HelpOutline fontSize="small" color="primary" />
									</IconButton>
								</Tooltip>
							</Box>
							<CalendarConnectionSelect
								value={localSettings.connection || ""}
								onChange={(value) => updateSettings("connection", value)}
							/>
						</FormControl>

						<FormControl fullWidth margin="normal" size="small">
							<Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
								<Typography variant="body2" sx={{ fontWeight: 500 }}>
									Sheet URL *
								</Typography>
								<Tooltip
									title={propertyTooltips.sheetUrl}
									arrow
									placement="right"
									enterDelay={300}
								>
									<IconButton size="small" sx={{ ml: 0.5 }}>
										<HelpOutline fontSize="small" color="primary" />
									</IconButton>
								</Tooltip>
							</Box>
							<TextField
								fullWidth
								size="small"
								value={localSettings.sheetUrl || ""}
								onChange={handleTextChange("sheetUrl")}
								placeholder="Enter Google Sheet URL"
								required
							/>
						</FormControl>
					</>
				);

			case "getSheetLead":
				return (
					<>
						<FormControl fullWidth margin="normal" size="small">
							<Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
								<Typography variant="body2" sx={{ fontWeight: 500 }}>
									Google Account Connection *
								</Typography>
								<Tooltip
									title={propertyTooltips.sheetConnection}
									arrow
									placement="right"
									enterDelay={300}
								>
									<IconButton size="small" sx={{ ml: 0.5 }}>
										<HelpOutline fontSize="small" color="primary" />
									</IconButton>
								</Tooltip>
							</Box>
							<CalendarConnectionSelect
								value={localSettings.connection || ""}
								onChange={(value) => updateSettings("connection", value)}
							/>
						</FormControl>

						<FormControl fullWidth margin="normal" size="small">
							<Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
								<Typography variant="body2" sx={{ fontWeight: 500 }}>
									Sheet URL *
								</Typography>
								<Tooltip
									title={propertyTooltips.sheetUrl}
									arrow
									placement="right"
									enterDelay={300}
								>
									<IconButton size="small" sx={{ ml: 0.5 }}>
										<HelpOutline fontSize="small" color="primary" />
									</IconButton>
								</Tooltip>
							</Box>
							<TextField
								fullWidth
								size="small"
								value={localSettings.sheetUrl || ""}
								onChange={handleTextChange("sheetUrl")}
								placeholder="Enter Google Sheet URL"
								required
							/>
						</FormControl>
					</>
				);
			case "preVerify":
				return (
					<>
						<Typography variant="subtitle2" gutterBottom>
							Configure Pre-verification Criteria
						</Typography>
						<Box sx={{ mt: 2, mb: 3 }}>
							<FormControlLabel
								control={
									<Checkbox
										checked={localSettings.enableWebScraping || false}
										onChange={(e) => {
											updateSettings("enableWebScraping", e.target.checked);
										}}
										size="small"
									/>
								}
								label={
									<Box sx={{ display: "flex", alignItems: "center" }}>
										<span>Enable Web Scraping Verification</span>
										<Tooltip
											title={propertyTooltips.enableWebScraping}
											arrow
											placement="right"
											enterDelay={300}
										>
											<IconButton size="small" sx={{ ml: 0.5 }}>
												<HelpOutline fontSize="small" color="primary" />
											</IconButton>
										</Tooltip>
									</Box>
								}
							/>
							{localSettings.enableWebScraping && (
								<FormControl fullWidth margin="normal" size="small">
									<Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
										<Typography variant="body2" sx={{ fontWeight: 500 }}>
											Web Scraping Prompt
										</Typography>
										<Tooltip
											title={propertyTooltips.webScrapingPrompt}
											arrow
											placement="right"
											enterDelay={300}
										>
											<IconButton size="small" sx={{ ml: 0.5 }}>
												<HelpOutline fontSize="small" color="primary" />
											</IconButton>
										</Tooltip>
									</Box>
									<TextField
										fullWidth
										size="small"
										label="Web Scraping Prompt"
										variant="outlined"
										margin="normal"
										multiline
										minRows={3}
										maxRows={10}
										value={localSettings.webScrapingPrompt || ""}
										onChange={handleTextChange("webScrapingPrompt")}
										placeholder="Enter prompt for web scraping verification"
										helperText="This prompt will be used to give criteras for the web scraping verification process"
									/>
								</FormControl>
							)}
						</Box>
						<Divider sx={{ my: 2 }}>
							<Chip label="Field Criteria" />
						</Divider>
						{/* Danh sách các tiêu chí */}
						{(
							localSettings.criteria || [
								{
									field: "",
									type: "string",
									operator: "equals",
									value: "",
								},
							]
						).map((criterion, index) => (
							<Box key={index} sx={{ p: 2, mb: 2 }} className="criteria-info">
								<Box
									sx={{
										display: "flex",
										justifyContent: "space-between",
										mb: 1,
									}}
								>
									<Typography variant="body2" fontWeight="bold">
										Criteria #{index + 1}
									</Typography>
									{(localSettings.criteria || []).length > 1 && (
										<IconButton
											size="small"
											color="error"
											onClick={() => {
												const newCriteria = [...(localSettings.criteria || [])];
												newCriteria.splice(index, 1);
												updateSettings("criteria", newCriteria);
											}}
										>
											<Close fontSize="small" />
										</IconButton>
									)}
								</Box>
								<FormControl fullWidth margin="normal" size="small">
									<Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
										<Typography variant="body2" sx={{ fontWeight: 500 }}>
											Field *
										</Typography>
										<Tooltip
											title={propertyTooltips.criteriaField}
											arrow
											placement="right"
											enterDelay={300}
										>
											<IconButton size="small" sx={{ ml: 0.5 }}>
												<HelpOutline fontSize="small" color="primary" />
											</IconButton>
										</Tooltip>
									</Box>
									<TextField
										fullWidth
										size="small"
										required
										variant="outlined"
										multiline
										minRows={1}
										maxRows={10}
										value={criterion.field || ""}
										onChange={(e) => {
											const newCriteria = [...(localSettings.criteria || [])];
											newCriteria[index] = {
												...newCriteria[index],
												field: e.target.value,
											};
											updateSettings("criteria", newCriteria);
										}}
										placeholder="Enter field name (e.g. email, phone)"
									/>
								</FormControl>
								<FormControl fullWidth margin="normal" size="small">
									<Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
										<Typography variant="body2" sx={{ fontWeight: 500 }}>
											Type *
										</Typography>
										<Tooltip
											title={propertyTooltips.criteriaType}
											arrow
											placement="right"
											enterDelay={300}
										>
											<IconButton size="small" sx={{ ml: 0.5 }}>
												<HelpOutline fontSize="small" color="primary" />
											</IconButton>
										</Tooltip>
									</Box>
									<Select
										value={criterion.type || "string"}
										onChange={(e) => {
											const newCriteria = [...(localSettings.criteria || [])];
											// Update type
											const newType = e.target.value as string;
											// Set default operator for this type
											const defaultOperator =
												getOperatorsForType(newType)[0].value;

											newCriteria[index] = {
												...newCriteria[index],
												type: newType,
												operator: defaultOperator,
											};
											updateSettings("criteria", newCriteria);
										}}
									>
										<MenuItem value="string">String</MenuItem>
										<MenuItem value="number">Number</MenuItem>
										<MenuItem value="email">Email</MenuItem>
										<MenuItem value="phone">Phone</MenuItem>
										<MenuItem value="date">Date</MenuItem>
										<MenuItem value="boolean">Boolean</MenuItem>
									</Select>
								</FormControl>
								<FormControl fullWidth margin="normal" size="small">
									<Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
										<Typography variant="body2" sx={{ fontWeight: 500 }}>
											Operator *
										</Typography>
										<Tooltip
											title={propertyTooltips.criteriaOperator}
											arrow
											placement="right"
											enterDelay={300}
										>
											<IconButton size="small" sx={{ ml: 0.5 }}>
												<HelpOutline fontSize="small" color="primary" />
											</IconButton>
										</Tooltip>
									</Box>
									<Select
										value={criterion.operator || "equals"}
										onChange={(e) => {
											const newCriteria = [...(localSettings.criteria || [])];
											newCriteria[index] = {
												...newCriteria[index],
												operator: e.target.value,
												// Reset value if changing to an operator that doesn't need a value
												...(shouldShowValueInput(e.target.value as string)
													? {}
													: { value: "" }),
											};
											updateSettings("criteria", newCriteria);
										}}
									>
										{getOperatorsForType(criterion.type || "string").map(
											(op) => (
												<MenuItem key={op.value} value={op.value}>
													{op.label}
												</MenuItem>
											)
										)}
									</Select>
								</FormControl>
								{shouldShowValueInput(criterion.operator || "equals") && (
									<FormControl fullWidth margin="normal" size="small">
										<Box
											sx={{ display: "flex", alignItems: "center", mb: 0.5 }}
										>
											<Typography variant="body2" sx={{ fontWeight: 500 }}>
												Value
											</Typography>
											<Tooltip
												title={propertyTooltips.criteriaValue}
												arrow
												placement="right"
												enterDelay={300}
											>
												<IconButton size="small" sx={{ ml: 0.5 }}>
													<HelpOutline fontSize="small" color="primary" />
												</IconButton>
											</Tooltip>
										</Box>
										<TextField
											fullWidth
											size="small"
											label="Value"
											variant="outlined"
											type={
												criterion.type === "number"
													? "number"
													: criterion.type === "date"
													? "date"
													: "text"
											}
											value={criterion.value || ""}
											onChange={(e) => {
												const newCriteria = [...(localSettings.criteria || [])];
												let newValue: string | number | boolean =
													e.target.value;

												// Convert value based on type
												if (criterion.type === "number" && e.target.value) {
													newValue = Number(e.target.value);
												} else if (criterion.type === "boolean") {
													newValue = e.target.value === "true";
												}

												newCriteria[index] = {
													...newCriteria[index],
													value: newValue,
												};
												updateSettings("criteria", newCriteria);
											}}
											placeholder={
												criterion.type === "date"
													? "Select date"
													: criterion.type === "number"
													? "Enter numeric value"
													: "Enter comparison value"
											}
											InputLabelProps={
												criterion.type === "date" ? { shrink: true } : undefined
											}
										/>
									</FormControl>
								)}
							</Box>
						))}
						{/* Nút thêm tiêu chí */}
						<Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
							<Button
								variant="outlined"
								size="small"
								startIcon={<Add />}
								onClick={() => {
									const newCriteria = [
										...(localSettings.criteria || []),
										{
											field: "",
											type: "string",
											operator: "equals",
											value: "",
										},
									];
									updateSettings("criteria", newCriteria);
								}}
							>
								Add Criteria
							</Button>
						</Box>
						<Box
							sx={{
								mt: 2,
								p: 2,
								borderRadius: "4px",
							}}
							className="criteria-info"
						>
							<Typography variant="caption" color="text.secondary">
								Configure criteria to pre-verify leads before further
								processing. Each criteria evaluates a field against the
								specified value based on its data type and chosen operator.
							</Typography>
						</Box>
					</>
				);

			default:
				return (
					<Typography variant="body2" color="text.secondary">
						No specific settings available for this node type.
					</Typography>
				);
		}
	};

	return (
		<PanelContainer className="sidebar">
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					mb: 2,
				}}
			>
				<Typography variant="h6">Node Properties</Typography>
				<IconButton size="small" onClick={onClose}>
					<Close fontSize="small" />
				</IconButton>
			</Box>

			<NodeInfoCard className="transcript-bg">
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					{getNodeIcon(String(selectedNode.type))}
					<Typography variant="subtitle2">
						{String(selectedNode.type) || "Unknown Node"}
					</Typography>
				</Box>
				<Typography variant="caption" color="text.secondary">
					{String(selectedNode.data?.description) || "No description available"}
				</Typography>
			</NodeInfoCard>

			<Divider sx={{ my: 2 }} />

			<Typography variant="subtitle2" gutterBottom>
				Node Settings
			</Typography>

			{renderSettings()}

			<Divider sx={{ my: 2 }} />

			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					mb: 2,
				}}
			>
				<Box>
					<Chip
						size="small"
						label={`Type: ${selectedNode.type}`}
						variant="outlined"
						sx={{ ml: 1 }}
					/>
				</Box>
				{selectedNode.type !== "deadLead" && (
					<Button
						variant="contained"
						color="primary"
						startIcon={
							isSaving ? (
								<CircularProgress size={16} color="inherit" />
							) : (
								<Save />
							)
						}
						onClick={handleSaveChanges}
						disabled={!hasChanges || isSaving}
					>
						{isSaving ? "Saving..." : "Save Changes"}
					</Button>
				)}
			</Box>
		</PanelContainer>
	);
};

export default PropertiesPanel;
