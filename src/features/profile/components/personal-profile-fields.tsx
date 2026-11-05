"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Checkbox, DatePicker, FormField, Input } from "@/components/ui";
import { todayCalendarValue } from "@/lib/calendar";
import { LocationPicker } from "@/components/shared/location-picker";
import type { ProfileDraftValues } from "../schemas/profile-editor";

export function PersonalProfileFields() {
    const { register, control, formState: { errors, isSubmitting } } = useFormContext<ProfileDraftValues>();
    const text = (name: "name" | "email" | "phone", label: string, maxLength: number, type = "text", required = false) => (
        <FormField label={label} required={required} error={errors[name]?.message}>{field => <Input {...field} {...register(name)} type={type} maxLength={maxLength} />}</FormField>
    );
    const select = (name: "gender", label: string, options: [string, string][]) => (
        <FormField label={label} error={errors[name]?.message}>{field => <select {...field} {...register(name)} className="ui-input"><option value="">Chưa cung cấp</option>{options.map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select>}</FormField>
    );
    return <>
        {text("name", "Họ và tên", 150, "text", true)}
        <div className="grid gap-5 sm:grid-cols-2">{text("email", "Email", 320, "email", true)}{text("phone", "Số điện thoại", 30, "tel")}</div>
        <p className="text-xs leading-5 text-muted-foreground">Email và số điện thoại ở đây là thông tin liên hệ trên hồ sơ ứng viên.</p>
        <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Ngày sinh" error={errors.birthDate?.message}>{field => <Controller name="birthDate" control={control} render={({ field: selected }) => <DatePicker {...field} ref={selected.ref} value={selected.value} onValueChange={selected.onChange} onBlur={selected.onBlur} max={todayCalendarValue()} />} />}</FormField>
            {select("gender", "Giới tính", [["MALE", "Nam"], ["FEMALE", "Nữ"], ["OTHER", "Khác"]])}
        </div>
        <FormField label="Tỉnh/thành phố, phường/xã" error={errors.location?.message}>{field => <div className="rounded-xl border border-border bg-card has-[[aria-invalid=true]]:border-destructive">
            <Controller name="location" control={control} render={({ field: selected }) => <LocationPicker {...field} value={selected.value} onChange={selected.onChange} onBlur={selected.onBlur} disabled={isSubmitting} ariaLabel="Tỉnh/thành phố, phường/xã" placeholder="Chọn tỉnh/thành phố, phường/xã" />} />
        </div>}</FormField>
        <fieldset className="space-y-4 rounded-xl border border-border p-4">
            <legend className="px-1 font-medium">Quyền riêng tư hồ sơ</legend>
            <Checkbox {...register("searchable")} label="Cho phép nhà tuyển dụng tìm thấy hồ sơ" />
            <Checkbox {...register("showEmail")} label="Hiển thị email với nhà tuyển dụng" />
            <Checkbox {...register("showPhone")} label="Hiển thị số điện thoại với nhà tuyển dụng" />
        </fieldset>
    </>;
}
