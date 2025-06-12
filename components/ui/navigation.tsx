"use client";

import {
	Calendar1,
	ClipboardIcon,
	FileTextIcon,
	HelpCircleIcon,
	LayoutDashboardIcon,
	SettingsIcon,
	TargetIcon,
	Users,
	ChevronLeft,
	ChevronRight,
	Menu,
	X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, createContext, useContext, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Separator } from "./separator";

const data = {
	user: {
		name: "Coach",
		email: "coach@example.com",
		avatar: "/avatars/coach.jpg",
	},
	navMain: [
		{
			title: "Athletes",
			url: "/athletes",
			icon: Users,
		},
		{
			title: "Training Plans",
			url: "/training-plans",
			icon: FileTextIcon,
		},
		{
			title: "Goals",
			url: "/goals",
			icon: TargetIcon,
		},
		{
			title: "Session Logs",
			url: "/session-logs",
			icon: Calendar1,
		},
	],

	navSecondary: [
		{
			title: "Assistants",
			url: "/assistants",
			icon: ClipboardIcon,
		},
		{
			title: "Settings",
			url: "/settings",
			icon: SettingsIcon,
		},
		{
			title: "Help",
			url: "/help",
			icon: HelpCircleIcon,
		},
	],
};

// Create context for sidebar state
const SidebarContext = createContext<{
	isCollapsed: boolean;
	setIsCollapsed: (collapsed: boolean) => void;
	isMobileOpen: boolean;
	setIsMobileOpen: (open: boolean) => void;
}>({
	isCollapsed: false,
	setIsCollapsed: () => { },
	isMobileOpen: false,
	setIsMobileOpen: () => { },
});

export const useSidebar = () => useContext(SidebarContext);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [isMobileOpen, setIsMobileOpen] = useState(false);

	// Close mobile menu on route change
	useEffect(() => {
		setIsMobileOpen(false);
	}, []);

	return (
		<SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }}>
			{children}
		</SidebarContext.Provider>
	);
}

// Mobile menu button component
export function MobileMenuButton() {
	const { isMobileOpen, setIsMobileOpen } = useSidebar();

	return (
		<button
			onClick={() => setIsMobileOpen(!isMobileOpen)}
			className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white border border-gray-200 shadow-sm"
		>
			{isMobileOpen ? (
				<X className="w-5 h-5 text-gray-600" />
			) : (
				<Menu className="w-5 h-5 text-gray-600" />
			)}
		</button>
	);
}

export default function Navigation() {
	const pathname = usePathname();
	const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();

	return (
		<>
			{/* Mobile overlay */}
			{isMobileOpen && (
				<button
					className="lg:hidden fixed inset-0 z-30 bg-black bg-opacity-50"
					onClick={() => setIsMobileOpen(false)}
				/>
			)}
			{/* Navigation */}
			<nav className={cn(
				"flex flex-col fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out gap-4",
				// Desktop behavior
				"hidden lg:flex",
				isCollapsed ? "lg:w-16" : "lg:w-64",
				// Mobile behavior
				"lg:translate-x-0",
				isMobileOpen ? "block w-64 translate-x-0" : "block w-64 -translate-x-full lg:translate-x-0"
			)}>
				{/* Header */}
				<div className="flex items-center justify-between p-4">
					{!isCollapsed && (
						<div className="flex items-center space-x-2">
							<div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
								<span className="text-white font-bold text-sm">CC</span>
							</div>
							<span className="font-semibold text-primary-foreground">Congenial Carnival</span>
						</div>
					)}
					<button
						onClick={() => setIsCollapsed(!isCollapsed)}
						className="hidden lg:block p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
					>
						{isCollapsed ? (
							<ChevronRight className="w-4 h-4 text-gray-600" />
						) : (
							<ChevronLeft className="w-4 h-4 text-gray-600" />
						)}
					</button>
				</div>
				<div className="border-t border-gray-200 p-4">
					{/* Main Navigation */}
					{data.navMain.map((item) => {
						const isActive = pathname === item.url;
						return (
							<Link
								key={item.title}
								href={item.url}
								onClick={() => setIsMobileOpen(false)}
								className={cn(
									"flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
									isActive
										? "bg-primary text-primary-foreground"
										: "text-primary bg-primary-foreground hover:bg-gray-100 hover:text-primary-foreground"
								)}
								title={isCollapsed ? item.title : undefined}
							>
								<item.icon className={cn("flex-shrink-0", isCollapsed ? "w-5 h-5" : "w-5 h-5 mr-3")} />
								{!isCollapsed && <span>{item.title}</span>}
							</Link>
						);
					})}
				</div>
				<div className="border-t border-gray-200 p-4">
					{/* Secondary Navigation */}
					{data.navSecondary.map((item) => {
						const isActive = pathname === item.url;
						return (
							<Link
								key={item.title}
								href={item.url}
								onClick={() => setIsMobileOpen(false)}
								className={cn(
									"flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
									isActive
										? "bg-primary text-primary-foreground"
										: "text-primary bg-primary-foreground hover:bg-gray-100 hover:text-primary-foreground"
								)}
								title={isCollapsed ? item.title : undefined}
							>
								<item.icon className={cn("flex-shrink-0", isCollapsed ? "w-5 h-5" : "w-5 h-5 mr-3")} />
								{!isCollapsed && <span>{item.title}</span>}
							</Link>
						);
					})}
				</div>
				{/* User Section */}
				<div className="border-t border-gray-200 p-4 justify-self-end">
					<div className={cn(
						"flex items-center",
						isCollapsed ? "justify-center" : "space-x-3"
					)}>
						<div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
							<span className="text-sm font-medium text-gray-700">
								{data.user.name.charAt(0)}
							</span>
						</div>
						{!isCollapsed && (
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-primary-foreground truncate">
									{data.user.name}
								</p>
								<p className="text-xs text-gray-500 truncate">
									{data.user.email}
								</p>
							</div>
						)}
					</div>
				</div>
			</nav>
		</>
	);
}
