"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, FormField, Input, Modal, ModalContent } from "@/components/ui";
import { cvPreviewSchema, type CvPreviewValues } from "../schemas/cv-preview";

export function CvEditorModal({ values, creating, onClose, onSave }: { values: CvPreviewValues; creating: boolean; onClose: () => void; onSave: (values: CvPreviewValues) => void }) {
    const { register, handleSubmit, formState: { errors } } = useForm<CvPreviewValues>({ resolver: zodResolver(cvPreviewSchema), defaultValues: values, mode: "onBlur" });
    return <Modal open onOpenChange={(open) => { if (!open) onClose(); }}>
        <ModalContent forceBackdrop title={creating ? "Tạo CV từ mẫu" : "Chỉnh sửa CV"} description="Điền thông tin để cập nhật bản xem trước CV. Các thay đổi chưa đồng bộ vào tài khoản." footer={<><Button variant="outline" onClick={onClose}>Hủy</Button><Button type="submit" form="cv-preview-form">{creating ? "Tạo bản xem trước" : "Lưu thông tin"}</Button></>}>
            <form id="cv-preview-form" onSubmit={handleSubmit(onSave)} noValidate className="space-y-4">
                <FormField label="Tên CV" required error={errors.title?.message}>{(props) => <Input {...props} {...register("title")} maxLength={150} />}</FormField>
                <FormField label="Họ và tên" required error={errors.person?.message}>{(props) => <Input {...props} {...register("person")} maxLength={100} autoComplete="name" />}</FormField>
                <FormField label="Vị trí ứng tuyển" required error={errors.position?.message}>{(props) => <Input {...props} {...register("position")} maxLength={150} />}</FormField>
                <FormField label="Giới thiệu bản thân" error={errors.introduction?.message}>{(props) => <textarea {...props} {...register("introduction")} rows={4} maxLength={1000} className="ui-input h-auto min-h-28 resize-y py-3" />}</FormField>
            </form>
        </ModalContent>
    </Modal>;
}
