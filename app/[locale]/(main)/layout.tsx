import type { Metadata } from "next";

import { Inter, Source_Sans_3 } from "next/font/google";
import "@/app/globals.css";
import Navigation from "@/components/ui/navigation";
import { AuthProvider } from "@/lib/auth/context";
import { UrqlProvider } from "@/lib/hooks/urql-provider";
import { OnboardingProvider } from "@/components/onboarding-provider";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
	display: "swap",
});

const sourceSansPro = Source_Sans_3({
	variable: "--font-source-sans-pro",
	subsets: ["latin"],
	display: "swap",
	weight: ["400", "600"], // Specify the weights you need
});

export const metadata: Metadata = {
	title: "congenial-carnival",
	description: "Generated by congenial-carnival",
};

export default ({
	children,
}: Readonly<{ children: React.ReactNode }>) => {
	return (
		<html lang="en">
			<body className={`antialiased ${inter.className} ${sourceSansPro.className}`} >
				<AuthProvider>
					<UrqlProvider>
						<OnboardingProvider>
							<div className="text-foreground flex-col align-top flex gap-2 px-8 mx-20 sm:mx-5 xs:mx-2 my-8  bg-white">
								<Navigation />
								{children}
							</div>
						</OnboardingProvider>
					</UrqlProvider>
				</AuthProvider>
			</body>
		</html>
	);
}