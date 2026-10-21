import { Skeleton } from "@/components/ui";
export default function CompanyLoading() {
    return <main role="status" aria-label="Đang tải thông tin công ty" className="mx-auto max-w-[1180px] space-y-6 px-5 py-8 sm:px-8"><Skeleton className="h-80 rounded-2xl" /><div className="grid gap-5 lg:grid-cols-[2.1fr_1fr]"><Skeleton className="h-96 rounded-2xl" /><Skeleton className="h-80 rounded-2xl" /></div></main>;
}
