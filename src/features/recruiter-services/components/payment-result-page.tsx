'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock3, CircleX, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FeedbackState } from '@/components/shared/feedback-state';
import { formatDate, formatVND } from '@/lib/utils';
import { finishCheckout, resolveCheckoutOrder } from '../checkout-storage';
import { usePaymentResult, useSubscriptionActivation } from '../hooks/use-payment-result';
import { useSubscriptionPlans } from '../hooks/use-subscription-plans';
import { paymentApi } from '../services/payment-api';
import { subscriptionPlanKeys } from '../query-keys';
import { ACTIVATION_MAX_CHECKS, isActivePlan, isPendingPayment, paymentErrorMessage, PAYMENT_MAX_CHECKS, paymentStateMessages } from '../payment-presentation';
import { ServiceFrame } from './service-frame';
import { PaymentInstructions } from './payment-instructions';
import { Modal, ModalContent } from '@/components/ui/modal';

type ResultProps = { orderId?: string; checkout?: string; result?: string };
const subscribe = () => () => {};
export function PaymentResultPage(props: ResultProps) {
    const ready = useSyncExternalStore(subscribe, () => true, () => false);
    return ready ? <ResolvedPaymentResultPage key={`${props.orderId ?? ''}:${props.checkout ?? ''}`} {...props} /> : <ServiceFrame active="pricing"><Skeleton className="mx-auto my-10 h-96 max-w-xl" aria-label="Đang kiểm tra thanh toán" /></ServiceFrame>;
}

function ResolvedPaymentResultPage({ orderId: queryOrderId, checkout, result }: ResultProps) {
    const [orderId] = useState(() => resolveCheckoutOrder({ orderId: queryOrderId, checkout }));
    const router = useRouter();
    useEffect(() => { if (checkout && orderId) router.replace(`/recruiter/billing/result?orderId=${orderId}`); }, [checkout, orderId, router]);
    const { detail, status, restart } = usePaymentResult(orderId);
    const plans = useSubscriptionPlans();
    const order = status.data?.order;
    const plan = plans.data?.find(plan => plan.id === detail.data?.itemId);
    const paid = order?.status === 'PAID';
    const activation = useSubscriptionActivation(plan?.code, paid);
    const active = isActivePlan(activation.query.data?.subscription, plan?.code);
    const queryClient = useQueryClient();
    const [cancelOpen, setCancelOpen] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [cancelError, setCancelError] = useState<string>();
    const cancelLock = useRef(false);
    const pending = isPendingPayment(order?.status);
    const exhausted = pending && (status.data?.attempt ?? 0) >= PAYMENT_MAX_CHECKS;

    useEffect(() => {
        if (order && !isPendingPayment(order.status) && order.status !== 'PAID') finishCheckout(order.orderId);
        if (paid) void queryClient.invalidateQueries({ queryKey: subscriptionPlanKeys.current });
    }, [order, paid, queryClient]);
    useEffect(() => {
        if (active && activation.query.data) {
            queryClient.setQueryData(subscriptionPlanKeys.current, activation.query.data.subscription);
            if (orderId) finishCheckout(orderId);
        }
    }, [active, activation.query.data, orderId, queryClient]);

    async function cancel() {
        if (!orderId || cancelLock.current) return;
        cancelLock.current = true;
        setCancelling(true);
        setCancelError(undefined);
        try { await paymentApi.cancel(orderId); setCancelOpen(false); restart(); }
        catch (error) { setCancelError(paymentErrorMessage(error)); restart(); }
        finally { cancelLock.current = false; setCancelling(false); }
    }

    const content = orderId && status.isPending ? <div className="space-y-4" role="status" aria-label="Đang kiểm tra thanh toán"><Skeleton className="mx-auto h-16 w-16 rounded-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-24 w-full" /></div> : !orderId ? <FeedbackState kind="error" title="Chưa xác định được giao dịch" description="Đường dẫn thiếu mã đơn hoặc phiên thanh toán không còn trong trình duyệt này. Hãy mở lại đường dẫn có mã đơn của bạn; trạng thái trên URL không phải xác nhận thanh toán." /> : status.isError ? <FeedbackState kind="error" title="Chưa kiểm tra được thanh toán" description={paymentErrorMessage(status.error)} action={<Button onClick={restart}>Kiểm tra lại</Button>} /> : order ? <>
        <div className={`mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl ${paid ? 'bg-success/10 text-success' : pending ? 'bg-secondary text-primary' : 'bg-destructive/10 text-destructive'}`}>
            {paid ? <CheckCircle2 size={32} aria-hidden="true" /> : pending ? <Clock3 size={32} aria-hidden="true" /> : <CircleX size={32} aria-hidden="true" />}
        </div>
        <div className="text-center" role="status" aria-live="polite"><h1 className="text-2xl font-bold">{paymentStateMessages[order.status].title}</h1><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{paymentStateMessages[order.status].description}</p></div>
        <dl className="mt-6 space-y-3 rounded-xl border border-border p-4 text-sm">
            <div className="flex flex-wrap justify-between gap-2"><dt className="text-muted-foreground">Mã đơn</dt><dd className="break-all font-medium">{order.orderCode ?? order.orderId}</dd></div>
            {detail.data && <><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Gói dịch vụ</dt><dd className="text-right font-medium">{plan?.name ?? detail.data.description ?? 'Gói dịch vụ'}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Thanh toán</dt><dd className="font-bold text-primary">{detail.data.currency === 'VND' ? formatVND(detail.data.amount) : `${detail.data.amount} ${detail.data.currency}`}</dd></div></>}
        </dl>
        {detail.isError && <p role="alert" className="mt-3 text-sm">Chưa tải được chi tiết đơn. <Button variant="link" onClick={() => void detail.refetch()}>Tải lại chi tiết</Button></p>}
        {pending && <>
            {result === 'cancel' && <p className="mt-4 text-sm">Bạn đã quay lại từ trang hủy. Hệ thống vẫn đang ghi nhận đơn chờ thanh toán; bạn có thể xác nhận hủy bên dưới.</p>}
            <PaymentInstructions paymentUrl={order.paymentUrl === undefined ? detail.data?.paymentUrl : order.paymentUrl} qrCodeUrl={order.qrCodeUrl === undefined ? detail.data?.qrCodeUrl : order.qrCodeUrl} expiresAt={order.expiresAt === undefined ? detail.data?.expiresAt : order.expiresAt} />
            <p className="mt-4 text-sm text-muted-foreground" role="status" data-payment-check={status.data?.attempt}>{exhausted ? 'Đã dừng tự động kiểm tra sau 30 lần. Giao dịch vẫn đang xử lý; bạn có thể kiểm tra lại sau.' : 'Đang tự động kiểm tra mỗi 3 giây, tối đa 30 lần.'}</p>
            {exhausted && <Button className="mt-4 w-full" variant="outline" onClick={restart}>Kiểm tra lại trạng thái</Button>}
            <Button className="mt-3 w-full" variant="ghost" disabled={cancelling} onClick={() => setCancelOpen(true)}>Hủy đơn hàng</Button>
        </>}
        {paid && <section className="mt-6 space-y-3 rounded-xl bg-secondary/50 p-5 text-sm" aria-live="polite">
            {active ? <><h2 className="font-semibold text-primary">Gói đã được kích hoạt</h2><p>Bạn đang sử dụng {activation.query.data?.subscription.plan?.name}.</p>{activation.query.data?.subscription.expiresAt && <p>Hiệu lực đến {formatDate(activation.query.data.subscription.expiresAt)}</p>}</> : <><h2 className="font-semibold">Đang cập nhật gói của bạn</h2><p>Thanh toán đã thành công. Gói có thể cần thêm thời gian để kích hoạt; bạn không cần thanh toán lại.</p>{(activation.query.isError || (activation.query.data?.attempt ?? 0) >= ACTIVATION_MAX_CHECKS || !plan) && <><p>Chưa xác nhận được gói mới. Bạn có thể kiểm tra lại sau.</p><Button variant="outline" loading={activation.query.isFetching} onClick={() => { activation.restart(); void plans.refetch(); void detail.refetch(); }}>Kiểm tra kích hoạt gói</Button></>}</>}
        </section>}
        {cancelError && <p role="alert" className="mt-3 text-sm text-destructive">{cancelError}</p>}
    </> : null;

    return <ServiceFrame active="pricing"><section className="mx-auto my-6 max-w-xl rounded-2xl border border-border bg-card p-5 shadow-sm sm:my-10 sm:p-8" aria-label="Kết quả thanh toán">
        {content}
        <Link className="mt-6 flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-primary hover:bg-secondary" href="/recruiter/pricing"><ArrowLeft size={16} aria-hidden="true" />Quay lại bảng giá</Link>
    </section>
    <Modal open={cancelOpen} onOpenChange={open => { if (!cancelling) setCancelOpen(open); }}><ModalContent title="Hủy đơn thanh toán?" description="Chỉ xác nhận hủy nếu bạn chưa chuyển tiền. Hệ thống sẽ kiểm tra đơn còn được phép hủy trước khi xử lý." footer={<><Button variant="outline" disabled={cancelling} onClick={() => setCancelOpen(false)}>Giữ đơn</Button><Button variant="destructive" loading={cancelling} onClick={() => void cancel()}>Xác nhận hủy đơn</Button></>}>{cancelError && <p role="alert" className="text-sm text-destructive">{cancelError}</p>}</ModalContent></Modal>
    </ServiceFrame>;
}
