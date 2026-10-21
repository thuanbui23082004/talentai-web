import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
export default function CompanyNotFound() {
    return <main className="ui-container py-16"><EmptyState title="Không tìm thấy công ty" description="Công ty không tồn tại hoặc đã ngừng hiển thị." action={<Link href="/companies" className="font-semibold text-primary hover:underline">Xem danh sách công ty →</Link>} /></main>;
}
