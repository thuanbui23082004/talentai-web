import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CompanyDetailPage } from "@/features/companies";
import { loadCompany, loadCompanyRelated } from "@/server/bff/company-detail";

type Props = { params: Promise<{ companyId: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { companyId } = await params;
    const company = await loadCompany(companyId);
    return company ? { title: `${company.name} — Thông tin và tuyển dụng | TalentAI`, description: company.description?.slice(0, 160) } : { title: "Không tìm thấy công ty | TalentAI" };
}
export default async function PublicCompanyDetail({ params }: Props) {
    const { companyId } = await params;
    const company = await loadCompany(companyId);
    if (!company) notFound();
    const related = await loadCompanyRelated(company);
    return <CompanyDetailPage company={company} related={related} />;
}
