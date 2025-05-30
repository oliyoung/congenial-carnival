import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import type React from "react";

interface LoadingProps {
	message?: string;
}

export const Loading: React.FC<LoadingProps> = ({ message = "Loading..." }) => (
	<Alert>
		<Loader2 className="h-4 w-4 animate-spin" />
		<AlertTitle>Loading</AlertTitle>
		<AlertDescription>{message}</AlertDescription>
	</Alert>
);


export const LoadingSpinner: React.FC = () => {
	return <></>
}
