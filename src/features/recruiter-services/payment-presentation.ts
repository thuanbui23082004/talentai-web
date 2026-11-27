import { ApiError } from '@/lib/api/errors';
import type { CurrentSubscription, SubscriptionOrderState } from './types';

export const PAYMENT_POLL_INTERVAL = 3000;
export const PAYMENT_MAX_CHECKS = 30;
export const ACTIVATION_MAX_CHECKS = 10;
export const isPendingPayment = (state?: SubscriptionOrderState) => state === 'CREATED' || state === 'PENDING';
export const isActivePlan = (subscription: CurrentSubscription | undefined, code?: string) => Boolean(code && subscription?.status === 'ACTIVE' && subscription.plan?.code === code);

export const paymentStateMessages = {
    CREATED: { title: 'Đang xử lý thanh toán', description: 'Đơn hàng đã được tạo. Bạn có thể tiếp tục thanh toán và chờ xác nhận.' },
    PENDING: { title: 'Đang xử lý thanh toán', description: 'Hệ thống đang chờ xác nhận giao dịch. Gói chỉ được kích hoạt sau khi thanh toán thành công.' },
    PAID: { title: 'Thanh toán thành công', description: 'Giao dịch đã được xác nhận. Thông tin gói đang được đồng bộ.' },
    FAILED: { title: 'Thanh toán thất bại', description: 'Giao dịch chưa thành công. Vui lòng kiểm tra với ngân hàng hoặc ví trước khi tạo lần mua mới.' },
    CANCELLED: { title: 'Thanh toán đã hủy', description: 'Đơn hàng đã được hủy. Bạn có thể quay lại bảng giá để chọn gói khi cần.' },
    EXPIRED: { title: 'Đơn thanh toán đã hết hạn', description: 'Đơn hàng không còn hiệu lực. Hãy kiểm tra với ngân hàng hoặc ví nếu bạn đã chuyển tiền.' },
    REFUNDED: { title: 'Giao dịch đã hoàn tiền', description: 'Payment Service đã ghi nhận hoàn tiền cho giao dịch này.' },
} satisfies Record<SubscriptionOrderState, { title: string; description: string }>;

export function paymentErrorMessage(error: unknown) {
    if (error instanceof ApiError) {
        if (error.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để kiểm tra giao dịch.';
        if (error.status === 403) return 'Bạn không có quyền thực hiện thao tác này. Hãy kiểm tra tài khoản hoặc tải lại trang.';
        if (error.status === 404) return 'Không tìm thấy đơn hàng của tài khoản này. Vui lòng kiểm tra lại đường dẫn.';
        if (error.status === 400 || error.status === 409) return 'Gói hoặc trạng thái đơn đã thay đổi. Vui lòng kiểm tra lại giao dịch trước khi mua tiếp.';
    }
    return 'Chưa thể xác nhận giao dịch. Vui lòng thử lại cùng lần mua để tránh tạo đơn trùng.';
}

export function safePaymentUrl(value: string | null | undefined, origin: string) {
    if (!value) return undefined;
    try {
        const url = new URL(value);
        if (url.username || url.password) return undefined;
        return url.protocol === 'https:' || url.protocol === 'http:' && url.origin === origin ? url.href : undefined;
    } catch { return undefined; }
}

export function safeQrImage(value: string | null | undefined) {
    if (!value) return undefined;
    if (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value)) return value;
    try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : undefined; }
    catch { return undefined; }
}
