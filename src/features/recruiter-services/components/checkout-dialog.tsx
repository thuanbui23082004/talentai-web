'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal, ModalContent } from '@/components/ui/modal';
import { RadioGroup } from '@/components/ui/radio-group';
import { formatVND } from '@/lib/utils';
import { useCheckout } from '../hooks/use-checkout';
import { readCheckoutAttempt } from '../checkout-storage';
import { planPrice } from '../plan-presentation';
import type { PaymentMethod, SubscriptionPlan } from '../types';

export function CheckoutDialog({ plan, onClose }: { plan: SubscriptionPlan; onClose: () => void }) {
    const [method, setMethod] = useState<PaymentMethod>(() => { const attempt = readCheckoutAttempt(); return attempt?.planId === plan.id ? attempt.method : 'BANK'; });
    const checkout = useCheckout();
    const priceChanged = checkout.order && (checkout.order.amount !== plan.price || checkout.order.currency !== plan.currency);
    return <Modal open onOpenChange={open => { if (!open && !checkout.pending) onClose(); }}>
        <ModalContent title="Xác nhận đăng ký gói" description="Kiểm tra gói, giá và phương thức trước khi chuyển sang thanh toán." footer={<>
            <Button variant="outline" disabled={checkout.pending} onClick={onClose}>Quay lại</Button>
            {priceChanged ? <Button loading={checkout.pending} onClick={() => checkout.proceed()}>Đồng ý giá mới và thanh toán</Button> : <Button loading={checkout.pending} onClick={() => void checkout.submit(plan, method)}>{checkout.pending ? 'Đang tạo giao dịch…' : 'Xác nhận và thanh toán'}</Button>}
        </>}>
            <dl className="mb-6 space-y-3 rounded-xl border border-border bg-secondary/40 p-4 text-sm">
                <div className="flex justify-between gap-4"><dt>Gói dịch vụ</dt><dd className="text-right font-semibold">{plan.name}</dd></div>
                <div className="flex justify-between gap-4"><dt>Thời hạn</dt><dd>{plan.durationDays} ngày</dd></div>
                <div className="flex flex-wrap justify-between gap-3 border-t border-border pt-3"><dt>Tổng thanh toán</dt><dd className="text-lg font-bold text-primary">{planPrice(plan)}</dd></div>
            </dl>
            <RadioGroup label="Phương thức thanh toán" value={method} disabled={checkout.pending || Boolean(checkout.order)} onValueChange={value => { if (value === 'BANK' || value === 'MOMO' || value === 'ZALOPAY') setMethod(value); }} className="[&_label]:min-h-11 [&_label]:rounded-lg [&_label]:border [&_label]:border-border [&_label]:p-3" options={[
                { value: 'BANK', label: 'VietQR / Chuyển khoản ngân hàng', description: 'Phương thức mặc định' },
                { value: 'MOMO', label: 'MoMo' },
                { value: 'ZALOPAY', label: 'ZaloPay' },
            ]} />
            <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"><ShieldCheck size={18} className="shrink-0 text-primary" aria-hidden="true" />Gói được kích hoạt sau khi hệ thống xác nhận thanh toán thành công.</p>
            {priceChanged && <p role="alert" className="mt-4 rounded-xl border border-border bg-secondary p-4 text-sm">Giá do hệ thống xác nhận đã thay đổi: <strong>{checkout.order?.currency === 'VND' ? formatVND(checkout.order.amount) : `${checkout.order?.amount} ${checkout.order?.currency}`}</strong>. Vui lòng xác nhận giá mới để tiếp tục.</p>}
            {checkout.error && <div role="alert" className="mt-4 space-y-2 text-sm text-destructive"><p>{checkout.error}</p>{readCheckoutAttempt()?.orderId && <Link className="inline-flex min-h-11 items-center underline" href={`/recruiter/billing/result?orderId=${readCheckoutAttempt()?.orderId}`}>Mở giao dịch đang có</Link>}</div>}
        </ModalContent>
    </Modal>;
}
