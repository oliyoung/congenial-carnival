import React from "react";
import { useRouter } from "next/router";

const SessionLogDetail = () => {
	const router = useRouter();
	const { id } = router.query;

	return (
		<div>
			<h1>Session Log Details</h1>
			<p>Details for session log with ID: {id}</p>
			{/* Display session log details here */}
		</div>
	);
};

export default SessionLogDetail;
