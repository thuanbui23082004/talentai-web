"use client";

import type { ReactNode } from "react";
import { Button, Modal, ModalContent, ModalTrigger } from "@/components/ui";

export function ProfileAction({ label, title, children, className }: { label: string; title: string; children: ReactNode; className?: string }) {
    return <Modal>
        <ModalTrigger render={<button type="button" className={className} />}>{children}</ModalTrigger>
        <ModalContent title={title} description="Biểu mẫu cập nhật mục này đang được hoàn thiện. Thông tin hiện tại trên trang là dữ liệu trình bày và chưa được lưu vào hồ sơ.">
            <div className="rounded-xl bg-secondary/50 p-4 text-sm leading-6 text-muted-foreground">Bạn sẽ có thể nhập, chỉnh sửa và lưu {label.toLocaleLowerCase("vi")} khi API hồ sơ được kết nối.</div>
            <div className="mt-5 flex justify-end"><Button disabled>Lưu thay đổi</Button></div>
        </ModalContent>
    </Modal>;
}
