import { Suspense } from "react";
import {
    CandidateDetailPage,
    JobApplicantDetail,
} from "@/features/applications";
type Props = {
    params: Promise<{ applicationId: string }>;
    searchParams: Promise<{ from?: string }>;
};
async function CandidateContent({ params, searchParams }: Props) {
    const { applicationId } = await params;
    const { from } = await searchParams;
    return from === "job" ? (
        <JobApplicantDetail id={applicationId} />
    ) : (
        <CandidateDetailPage id={applicationId} />
    );
}
export default function RecruiterCandidateDetailPage(props: Props) {
    return (
        <Suspense
            fallback={
                <div className="recruiter-route-skeleton" aria-busy="true">
                    <div />
                    <div />
                    <div />
                </div>
            }
        >
            <CandidateContent {...props} />
        </Suspense>
    );
}
