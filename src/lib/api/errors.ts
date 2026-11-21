import type { components } from "./generated/schema";

export class ApiError extends Error {
  public readonly code: components["schemas"]["ErrorCode"];
  public readonly data?: components["schemas"]["ApiError"];
  public readonly fieldErrors?: components["schemas"]["FieldError"][];

  constructor(
    message: string,
    public status: number,
    codeOrBody: components["schemas"]["ErrorCode"] | components["schemas"]["ApiError"] = "INTERNAL_ERROR",
    fieldErrors?: components["schemas"]["FieldError"][]
  ) {
    super(message);
    this.name = "ApiError";
    this.data = typeof codeOrBody === "string" ? undefined : codeOrBody;
    this.code = typeof codeOrBody === "string" ? codeOrBody : codeOrBody.error.code;
    this.fieldErrors = fieldErrors ?? this.data?.error.fieldErrors;
  }
}

export function toApiError(status: number, body?: components["schemas"]["ApiError"]) {
  const code = body?.error?.code ?? "INTERNAL_ERROR";
  // Only use controlled UI messages; never show upstream error text.
  const messages: Partial<Record<components["schemas"]["ErrorCode"], string>> = {
    AUTH_ROLE_MISMATCH: "Tài khoản không thuộc loại tài khoản đang chọn. Vui lòng chọn đúng loại tài khoản để đăng nhập.",
    UNAUTHENTICATED: "Vui lòng đăng nhập để tiếp tục.",
    FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
    VALIDATION_FAILED: "Vui lòng kiểm tra lại thông tin đã nhập.",
    INVALID_CREDENTIALS: "Email hoặc mật khẩu không đúng.",
    EMAIL_ALREADY_EXISTS: "Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.",
    ACCOUNT_LOCKED: "Tài khoản đang bị khóa hoặc tạm khóa. Vui lòng thử lại sau 15 phút hoặc liên hệ quản trị viên.",
    SESSION_EXPIRED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    INVALID_RESET_TOKEN: "Mã xác thực không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu mã mới.",
    CSRF_TOKEN_INVALID: "Phiên thao tác không hợp lệ. Vui lòng tải lại trang rồi thử lại.",
    SERVICE_UNAVAILABLE: "Dịch vụ chưa sẵn sàng. Vui lòng thử lại sau.",
    RATE_LIMITED: "Bạn thao tác quá nhanh. Vui lòng thử lại sau.",
    CV_IN_USE: "CV đang được dùng trong hồ sơ ứng tuyển nên chưa thể xóa.",
    ALREADY_APPLIED: "Bạn đã ứng tuyển vị trí này. Không cần nộp lại.",
    PROFILE_INCOMPLETE: "Vui lòng cập nhật họ tên và email trong hồ sơ cá nhân trước khi ứng tuyển.",
    CV_NOT_FOUND: "CV không tồn tại hoặc không thuộc tài khoản. Vui lòng tải lại danh sách CV.",
    JOB_NOT_FOUND: "Tin tuyển dụng không tồn tại hoặc đã bị gỡ.",
    JOB_CLOSED: "Tin tuyển dụng đã đóng, không còn nhận hồ sơ.",
    JOB_NOT_OPEN: "Tin tuyển dụng hiện không nhận hồ sơ.",
    CONFLICT: "Không thể thực hiện thao tác. Vui lòng kiểm tra trạng thái hiện tại rồi thử lại.",
  };
  const fields = body?.error?.fieldErrors?.map((field) => ({
    field: field.field,
    code: field.code,
    message: field.code === "EMAIL_ALREADY_EXISTS" ? "Email này đã được sử dụng. Vui lòng dùng email khác." : "Vui lòng kiểm tra lại trường thông tin này.",
  }));
  return new ApiError(messages[code] ?? "Không thể tải dữ liệu. Vui lòng thử lại.", status, code, fields);
}
