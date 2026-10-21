import type { components } from "./generated/schema";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: components["schemas"]["ErrorCode"] = "INTERNAL_ERROR",
    public fieldErrors?: components["schemas"]["FieldError"][]
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function toApiError(status: number, body?: components["schemas"]["ApiError"]) {
  const code = body?.error?.code ?? "INTERNAL_ERROR";
  // Only use controlled UI messages; never show upstream error text.
  const messages: Partial<Record<components["schemas"]["ErrorCode"], string>> = {
    UNAUTHENTICATED: "Vui lòng đăng nhập để tiếp tục.",
    FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
    VALIDATION_FAILED: "Vui lòng kiểm tra lại thông tin đã nhập.",
    INVALID_CREDENTIALS: "Email hoặc mật khẩu không đúng.",
    EMAIL_ALREADY_EXISTS: "Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.",
    ACCOUNT_LOCKED: "Tài khoản đang bị khóa hoặc tạm khóa. Vui lòng thử lại sau 15 phút hoặc liên hệ quản trị viên.",
    SESSION_EXPIRED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    CSRF_TOKEN_INVALID: "Phiên thao tác không hợp lệ. Vui lòng tải lại trang rồi thử lại.",
    SERVICE_UNAVAILABLE: "Dịch vụ chưa sẵn sàng. Vui lòng thử lại sau.",
    RATE_LIMITED: "Bạn thao tác quá nhanh. Vui lòng thử lại sau.",
  };
  const fields = body?.error?.fieldErrors?.map((field) => ({
    field: field.field,
    code: field.code,
    message: field.code === "EMAIL_ALREADY_EXISTS" ? "Email này đã được sử dụng. Vui lòng dùng email khác." : "Vui lòng kiểm tra lại trường thông tin này.",
  }));
  return new ApiError(messages[code] ?? "Không thể tải dữ liệu. Vui lòng thử lại.", status, code, fields);
}
