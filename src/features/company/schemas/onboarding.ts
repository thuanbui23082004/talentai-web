import { z } from "zod";
import { findProvinceByCity } from "@/lib/locations/vietnam";

// Additional form requirements requested for company onboarding; not SRS rules.
export const companyOnboardingSchema = z.object({
    name: z.string().trim().min(2, "Nhập tên công ty có ít nhất 2 ký tự.").max(200, "Tên công ty tối đa 200 ký tự."),
    taxCode: z.string().trim().min(1, "Vui lòng nhập mã số thuế công ty.").refine(value => !value || /^\d{10}(?:-?\d{3})?$/.test(value), "Mã số thuế gồm 10 hoặc 13 chữ số."),
    description: z.string().trim().min(1, "Vui lòng giới thiệu ngắn về công ty.").max(5000, "Giới thiệu tối đa 5000 ký tự."),
    city: z.string().refine(value => !!findProvinceByCity(value), "Vui lòng chọn tỉnh/thành phố."),
    contactPhone: z.string().trim().regex(/^(?:0|\+84)[35789]\d{8}$/, "Nhập số di động Việt Nam hợp lệ, ví dụ 0912345678."),
    address: z.string().trim().min(1, "Nhập địa chỉ trụ sở công ty.").max(255, "Địa chỉ tối đa 255 ký tự."),
    industryId: z.string().regex(/^(?:[1-9]\d*|[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})$/i, "Vui lòng chọn lĩnh vực hoạt động."),
    website: z.string().trim().max(2048, "Website tối đa 2.048 ký tự.").refine(value => !value || /^https?:\/\//i.test(value) && z.url().safeParse(value).success, "Nhập website bắt đầu bằng http:// hoặc https://.").default(""),
    companySize: z.string().trim().refine(value => !value || /^\d+$/.test(value) && Number(value) > 0 && Number(value) <= 2147483647, "Nhập số nhân viên là số nguyên lớn hơn 0.").default(""),
    foundedYear: z.string().trim().refine(value => !value || /^\d{1,4}$/.test(value) && Number(value) >= 1 && Number(value) <= new Date().getFullYear(), "Nhập năm thành lập hợp lệ, không lớn hơn năm hiện tại.").default(""),
});

export const companyImageFileSchema = z.instanceof(File)
    .refine(file => file.size > 0, "Ảnh không được rỗng.")
    .refine(file => file.size <= 2 * 1024 * 1024, "Ảnh tối đa 2MB.")
    .refine(file => ["image/png", "image/jpeg", "image/webp"].includes(file.type) && /\.(png|jpe?g|webp)$/i.test(file.name), "Chọn ảnh PNG, JPG hoặc WebP.");

