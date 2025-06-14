"use client";

import { AthletesFilterBar, type AthletesFilterState } from "@/components/athletes-filter-bar";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { PageCard, PageGrid, PageWrapper } from "@/components/ui/page-wrapper";
import type { Athlete } from "@/lib/types";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { useQuery } from "urql";

const AthletesQuery = `
	query {
		athletes {
			id
			sport
			firstName
			lastName
			email
			createdAt
		}
	}
`;

function AthletesList({ athletes }: { athletes: Athlete[] }) {
	return (
		<PageGrid columns={4}>
			{athletes.map((athlete) => (
				<PageCard
					key={athlete.id}
					href={`/athletes/${athlete.id}`}
					title={`${athlete.firstName} ${athlete.lastName}`}
					subtitle={athlete.sport}
				>&nbsp;</PageCard>
			))}
		</PageGrid>
	);
}

export default function Page() {
	const [{ data, fetching, error }, reexecuteQuery] = useQuery<{ athletes: Athlete[] }>({
		query: AthletesQuery,
	});

	const [filters, setFilters] = useState<AthletesFilterState>({
		search: "",
		sport: "",
		sortBy: "name",
		sortOrder: "asc",
	});

	const filteredAndSortedAthletes = useMemo(() => {
		if (!data?.athletes) return [];

		let filtered = data.athletes;

		// Apply search filter
		if (filters.search.trim()) {
			const searchLower = filters.search.toLowerCase();
			filtered = filtered.filter(
				(athlete) =>
					athlete.firstName.toLowerCase().includes(searchLower) ||
					athlete.lastName.toLowerCase().includes(searchLower) ||
					athlete.email.toLowerCase().includes(searchLower)
			);
		}

		// Apply sport filter
		if (filters.sport) {
			filtered = filtered.filter((athlete) => athlete.sport === filters.sport);
		}

		// Apply sorting
		filtered = [...filtered].sort((a, b) => {
			let comparison = 0;

			switch (filters.sortBy) {
				case "name":
					const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
					const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
					comparison = nameA.localeCompare(nameB);
					break;
				case "sport":
					comparison = a.sport.toLowerCase().localeCompare(b.sport.toLowerCase());
					break;
				case "createdAt":
					comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
					break;
			}

			return filters.sortOrder === "desc" ? -comparison : comparison;
		});

		return filtered;
	}, [data?.athletes, filters]);

	if (fetching) return <div className="p-4">Loading athletes...</div>;
	if (error)
		return (
			<ErrorMessage message={`Error loading athletes: ${error.message}`} />
		);

	return (
		<PageWrapper
			title="Athletes"
			description="Manage and view all your athletes"
			breadcrumbs={[{ label: "Athletes", href: "/athletes" }]}
			actions={
				<Button asChild>
					<Link href="/athletes/new">
						<PlusIcon className="w-4 h-4 mr-2" />
						Add Athlete
					</Link>
				</Button>
			}
		>
			<div className="space-y-6">
				<AthletesFilterBar
					filters={filters}
					onFiltersChangeAction={setFilters}
				/>

				{filteredAndSortedAthletes.length === 0 && data?.athletes && data.athletes.length > 0 && (
					<div className="text-center py-8 text-muted-foreground">
						No athletes match your current filters.
					</div>
				)}

				{filteredAndSortedAthletes.length === 0 && data?.athletes?.length === 0 && (
					<div className="flex flex-col items-center justify-center text-center py-16 px-6">
						<div className="mb-6 flex size-20 items-center justify-center rounded-full bg-muted/50">
							<PlusIcon className="size-10 text-muted-foreground/70" aria-hidden="true" />
						</div>
						<div className="space-y-2 max-w-sm">
							<h3 className="text-lg font-semibold tracking-tight text-foreground">
								No athletes yet
							</h3>
							<p className="text-sm text-muted-foreground leading-relaxed">
								Create athletes to start tracking their progress and training plans.
							</p>
						</div>
						<div className="mt-6">
							<Button asChild size="lg">
								<Link href="/athletes/new">
									<PlusIcon className="size-4" aria-hidden="true" />
									Create First Athlete
								</Link>
							</Button>
						</div>
					</div>
				)}

				{filteredAndSortedAthletes.length > 0 && (
					<AthletesList athletes={filteredAndSortedAthletes} />
				)}
			</div>
		</PageWrapper>
	);
}
