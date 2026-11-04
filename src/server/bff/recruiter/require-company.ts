import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { handleBffRequest } from "../handler";

// Use the same company lookup as the form, including its mock/real adapter.
// Auth's user profile does not contain the company created in company-service.
export async function requireCompany() {
    const cookieStore = await cookies();
    const response = await handleBffRequest(new Request("http://localhost/api/bff/recruiter/company", {
        headers: { cookie: cookieStore.toString() },
    }));

    if (response.status === 401) redirect("/login?role=recruiter");
    if (response.status === 404) redirect("/recruiter/onboarding");
    // An unavailable service must not grant access or imply a missing company.
    if (!response.ok) throw new Error("Không thể kiểm tra hồ sơ doanh nghiệp. Vui lòng thử lại.");
}
