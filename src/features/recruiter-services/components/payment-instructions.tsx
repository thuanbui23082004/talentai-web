'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { safePaymentUrl, safeQrImage } from '../payment-presentation';

export function PaymentInstructions({ paymentUrl, qrCodeUrl, expiresAt }: { paymentUrl?: string | null; qrCodeUrl?: string | null; expiresAt?: string | null }) {
    const [imageFailed, setImageFailed] = useState(false);
    const url = typeof window === 'undefined' ? undefined : safePaymentUrl(paymentUrl, window.location.origin);
    const qr = safeQrImage(qrCodeUrl);
    return <section className="mt-6 space-y-4 rounded-xl border border-border bg-secondary/30 p-5 text-sm" aria-label="Hướng dẫn thanh toán">
        <h2 className="font-semibold">Hoàn tất thanh toán</h2>
        {qr && !imageFailed ? <div className="flex justify-center rounded-xl bg-card p-3">
            {/* QR URLs are supplied at runtime by the gateway and may use data URIs. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- Payment QR may be a provider URL or a data URI; preserve exact pixels. */}
            <img src={qr} alt="Mã QR thanh toán của đơn hàng" width={240} height={240} className="max-w-full object-contain" referrerPolicy="no-referrer" onError={() => setImageFailed(true)} />
        </div> : qrCodeUrl && !qr ? <div><p className="text-muted-foreground">Dữ liệu thanh toán từ cổng:</p><code className="mt-2 block max-h-32 overflow-auto break-all rounded-lg bg-card p-3 text-xs">{qrCodeUrl}</code></div> : null}
        {imageFailed && <p role="alert">Chưa tải được mã QR. Hãy mở trang thanh toán hoặc kiểm tra lại giao dịch.</p>}
        {url && <Button className="w-full" onClick={() => window.location.assign(url)}>Tiếp tục thanh toán</Button>}
        {!url && !qrCodeUrl && <p>Chưa có liên kết hoặc mã QR hợp lệ. Hãy kiểm tra lại trạng thái; không cần tạo thêm đơn.</p>}
        {expiresAt && <p className="text-xs text-muted-foreground">Ngày hết hạn thanh toán: {formatDate(expiresAt)}</p>}
    </section>;
}
