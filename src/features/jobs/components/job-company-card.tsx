import Image from "next/image";
import Link from "next/link";
import { Building2, MapPin } from "lucide-react";
import { LocationMap } from "@/components/shared/location-map";
import type { JobDetail } from "../types";

export function JobCompanyCard({ job }: { job: JobDetail }) {
    const name = job.company.name.replace("Công ty mẫu ", "");
    const address = [job.location.address, job.location.ward, job.location.city].filter(Boolean).join(", ");
    return <section aria-label="Thông tin công ty và địa điểm" className="rounded-2xl border border-border/50 bg-card p-5 shadow-card sm:p-7">
        <h2 className="text-base font-bold">Về công ty</h2>
        <div className="mt-5 flex items-center gap-3">
            <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/50 bg-card p-2 text-center text-xs font-bold text-primary">
                {job.company.logoUrl ? <Image src={job.company.logoUrl} alt={job.company.name} fill unoptimized className="object-contain p-2" /> : <span>{name}</span>}
            </div>
            <div className="min-w-0"><h3 className="text-base font-semibold leading-snug">{job.company.name}</h3><Link href={`/companies/${job.company.id}`} className="mt-1 inline-block text-xs font-medium text-primary hover:underline">Xem thông tin công ty →</Link></div>
        </div>
        <div className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground">
            <p className="flex items-start gap-2"><Building2 aria-hidden="true" className="mt-1 size-4 shrink-0" />{job.industry?.name ?? "Thông tin ngành nghề chưa cập nhật"}</p>
            <p className="flex items-start gap-2"><MapPin aria-hidden="true" className="mt-1 size-4 shrink-0" />{address}</p>
        </div>
        <LocationMap address={address} />
    </section>;
}
