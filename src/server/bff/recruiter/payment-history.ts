import { z } from 'zod';
import { subscriptionOrderSchema, subscriptionOrderStateSchema } from '@/lib/api/subscription-schemas';
import { readRequestIdentity } from '../auth/session';
import { apiError } from '../responses';
import { listMockPaymentOrders } from './subscription-checkout-mock';

export const paymentHistoryQuerySchema = z.object({
    page: z.coerce.number().int().min(1).max(100000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
    status: subscriptionOrderStateSchema.optional(),
}).strict();
const upstreamPage = z.object({ content: z.array(subscriptionOrderSchema), number: z.number().int().nonnegative(), size: z.number().int().positive(), totalElements: z.number().int().nonnegative(), totalPages: z.number().int().nonnegative() });

export async function handlePaymentHistory(request: Request, baseUrl?: string): Promise<Response> {
    if (request.method !== 'GET') return apiError(405, 'BAD_REQUEST', 'Phương thức không được hỗ trợ.');
    const identity = await readRequestIdentity(request);
    if (!identity) return apiError(401, 'UNAUTHENTICATED', 'Vui lòng đăng nhập.');
    if (identity.user.role !== 'recruiter') return apiError(403, 'FORBIDDEN', 'Chức năng dành cho nhà tuyển dụng.');
    const search = new URL(request.url).searchParams;
    if ([...search.keys()].some(key => search.getAll(key).length > 1)) return apiError(422, 'VALIDATION_FAILED', 'Bộ lọc không hợp lệ.');
    const parsed = paymentHistoryQuerySchema.safeParse(Object.fromEntries(search));
    if (!parsed.success) return apiError(422, 'VALIDATION_FAILED', 'Bộ lọc hoặc trang không hợp lệ.');
    const { page, pageSize, status } = parsed.data;
    if (!baseUrl) return listMockPaymentOrders(request, identity.userId, parsed.data);
    try {
        const target = new URL(`${baseUrl.replace(/\/$/, '')}/orders/my`);
        target.searchParams.set('page', String(page - 1));
        target.searchParams.set('size', String(pageSize));
        target.searchParams.set('sort', 'createdAt,desc');
        if (status) target.searchParams.set('status', status);
        const response = await fetch(target, { headers: { Accept: 'application/json', Authorization: `Bearer ${identity.access}` }, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000) });
        if (response.status === 401) return apiError(401, 'SESSION_EXPIRED', 'Phiên đăng nhập đã hết hạn.');
        if (response.status === 403) return apiError(403, 'FORBIDDEN', 'Bạn không có quyền xem lịch sử này.');
        if (!response.ok) throw new Error('Payment history unavailable');
        const data = upstreamPage.parse(await response.json());
        if (data.content.some(item => item.userId && item.userId !== identity.userId)) return apiError(403, 'FORBIDDEN', 'Không thể xem đơn hàng của tài khoản khác.');
        return Response.json({ items: data.content, meta: { page: data.number + 1, pageSize: data.size, totalItems: data.totalElements, totalPages: data.totalPages } }, { headers: { 'Cache-Control': 'private, no-store' } });
    } catch { return apiError(503, 'SERVICE_UNAVAILABLE', 'Chưa thể tải lịch sử thanh toán. Vui lòng thử lại.'); }
}
