"use client";

import { AtSign, CalendarDays, Camera, CircleAlert, MapPin, Pencil, Phone } from "lucide-react";
import { Avatar } from "@/components/ui";
import type { AuthUser } from "@/features/auth";
import { formatDate } from "@/lib/utils";
import { useProfileDraft } from "./profile-draft-provider";
import { ProfileAction } from "./profile-action";

export function ProfilePersonalInfo({ user }: { user: AuthUser }) {
    const { entries, personalDefaults } = useProfileDraft();
    const personal = entries.personal?.[0]?.values ?? personalDefaults;
    return <section aria-label="Thông tin cá nhân" className="rounded-2xl border border-border/80 bg-card p-5 shadow-card sm:p-6">
        <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Thông tin cá nhân</h2><ProfileAction section="personal" className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-primary"><Pencil className="size-4" /><span className="sr-only">Chỉnh sửa thông tin cá nhân</span></ProfileAction></div>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center"><div className="relative w-fit"><Avatar name={personal.name} src={user.avatarUrl} className="size-20 text-xl ring-4 ring-secondary" /><button type="button" disabled title="Cập nhật ảnh: sắp ra mắt" aria-label="Cập nhật ảnh đại diện (sắp ra mắt)" className="absolute right-0 bottom-0 flex size-7 items-center justify-center rounded-full border-2 border-white bg-secondary text-primary"><Camera className="size-3.5" /></button></div>
            <div className="min-w-0 flex-1"><h2 className="break-words text-lg font-semibold">{personal.name}</h2><div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground"><span className="inline-flex min-w-0 items-center gap-1.5 break-all"><AtSign className="size-3.5 shrink-0" />{personal.email}</span>{personal.phone && <span className="inline-flex items-center gap-1.5"><Phone className="size-3.5" />{personal.phone}</span>}<span className="inline-flex items-center gap-1.5 text-warning-foreground"><CircleAlert className="size-3.5" />Xác thực ngay</span></div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs"><ProfileAction section="personal" className="inline-flex min-h-9 items-center gap-1.5 text-left text-primary hover:underline"><MapPin className="size-3.5 shrink-0" /><span className="break-words">{personal.address || "Thêm địa chỉ hiện tại"}</span></ProfileAction><ProfileAction section="personal" className="inline-flex min-h-9 items-center gap-1.5 text-primary hover:underline"><CalendarDays className="size-3.5" />{personal.birthDate ? formatDate(personal.birthDate) : "Thêm ngày sinh"}</ProfileAction></div>
            </div>
        </div>
    </section>;
}
