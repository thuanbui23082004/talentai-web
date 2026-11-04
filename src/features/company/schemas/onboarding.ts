import { z } from "zod";
import { findProvinceByCity } from "@/lib/locations/vietnam";

// Additional form requirements requested for company onboarding; not SRS rules.
export const companyOnboardingSchema = z.object({
    name: z.string().trim().min(2, "Nhập tên công ty có ít nhất 2 ký tự.").max(200, "Tên công ty tối đa 200 ký tự."),
    taxCode: z.string().trim().refine(value => !value || /^\d{10}(?:-?\d{3})?$/.test(value), "Mã số thuế gồm 10 hoặc 13 chữ số."),
    city: z.string().refine(value => !!findProvinceByCity(value), "Vui lòng chọn tỉnh/thành phố."),
    contactPhone: z.string().trim().regex(/^(?:0|\+84)[35789]\d{8}$/, "Nhập số di động Việt Nam hợp lệ, ví dụ 0912345678."),
    address: z.string().trim().min(1, "Nhập địa chỉ trụ sở công ty.").max(255, "Địa chỉ tối đa 255 ký tự."),
    industryId: z.uuid("Vui lòng chọn lĩnh vực hoạt động."),
});

