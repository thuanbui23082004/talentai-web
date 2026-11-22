import { apiClient, ensureApiSession } from "@/lib/api";
import type { CVPayload } from "../types/cv";

export async function saveTemplateCv(payload: CVPayload): Promise<CVPayload> {
    const { data, error } = await apiClient.POST("/cv", {
        headers: { "X-CSRF-Token": await ensureApiSession() }, body: payload,
    });
    if (error || !data) throw new Error("Không thể lưu CV. Vui lòng thử lại.");
    return data;
}
