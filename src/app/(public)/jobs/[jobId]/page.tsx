import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JobDetailPage } from "@/features/jobs";
import { loadJobDetail, loadRelatedJobs } from "@/server/bff/job-detail";

type Props = { params: Promise<{ jobId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { jobId } = await params;
    const job = await loadJobDetail(jobId);
    return job
        ? {
              title: `${job.title} tại ${job.company.name} | TalentAI`,
              description: job.description.slice(0, 160),
          }
        : { title: "Không tìm thấy việc làm | TalentAI" };
}

export default async function PublicJobDetail({ params }: Props) {
    const { jobId } = await params;
    const job = await loadJobDetail(jobId);
    if (!job) notFound();
    const related = await loadRelatedJobs(job);
    return <JobDetailPage job={job} related={related} />;
}
