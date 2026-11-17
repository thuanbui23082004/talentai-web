import { CandidateApplicationDetail } from "@/features/applications";

export default async function CandidateApplicationDetailPage({ params }: { params: Promise<{ applicationId: string }> }) {
    const { applicationId } = await params;
    return <CandidateApplicationDetail id={applicationId} />;
}
