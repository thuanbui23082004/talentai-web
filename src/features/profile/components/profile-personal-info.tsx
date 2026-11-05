"use client";

import {
    AtSign,
    CalendarDays,
    CircleAlert,
    MapPin,
    Pencil,
    Phone,
    UserRound,
} from "lucide-react";
import { Alert, Avatar, Button } from "@/components/ui";
import { LoadingState } from "@/components/shared/loading-state";
import type { AuthUser } from "@/features/auth";
import { formatDate } from "@/lib/utils";
import { useProfileDraft } from "./profile-draft-provider";
import { ProfileAction } from "./profile-action";
import { personalAddressPayload } from "../personal-address";

export function ProfilePersonalInfo({ user }: { user: AuthUser }) {
    const {
        entries,
        personalDefaults,
        personalPending,
        personalError,
        reloadPersonal,
    } = useProfileDraft();
    const personal = entries.personal?.[0]?.values ?? personalDefaults;
    if (personalPending)
        return (
            <section
                aria-label="Thông tin cá nhân"
                className="rounded-2xl border border-border bg-card p-6"
            >
                <LoadingState title="Đang tải thông tin cá nhân" />
            </section>
        );
    if (personalError)
        return (
            <section
                aria-label="Thông tin cá nhân"
                className="rounded-2xl border border-border bg-card p-6"
            >
                <Alert variant="error" title="Không tải được thông tin cá nhân">
                    <Button variant="outline" onClick={reloadPersonal}>
                        Thử lại
                    </Button>
                </Alert>
            </section>
        );
    return (
        <section
            aria-label="Thông tin cá nhân"
            className="rounded-2xl border border-border/80 bg-card p-5 shadow-card sm:p-6"
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Avatar
                    name={personal.name}
                    src={personal.avatarUrl || user.avatarUrl}
                    className="size-20 shrink-0 text-xl ring-4 ring-secondary"
                />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="min-w-0 break-words text-lg font-semibold">
                            {personal.name}
                        </h2>
                        <ProfileAction
                            section="personal"
                            className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-primary"
                        >
                            <Pencil className="size-4" />
                            <span className="sr-only">
                                Chỉnh sửa thông tin cá nhân
                            </span>
                        </ProfileAction>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                        <span className="inline-flex min-w-0 items-center gap-1.5 break-all">
                            <AtSign className="size-3.5 shrink-0" />
                            {personal.email}
                        </span>
                        {personal.phone && (
                            <span className="inline-flex items-center gap-1.5">
                                <Phone className="size-3.5" />
                                {personal.phone}
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 text-warning-foreground">
                            <CircleAlert className="size-3.5" />
                            Xác thực ngay
                        </span>
                    </div>
                    {personal.headline && (
                        <p className="mt-2 break-words text-sm text-muted-foreground">
                            {personal.headline}
                        </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                        <ProfileAction
                            section="personal"
                            className="inline-flex min-h-11 items-center gap-1.5 text-left text-primary hover:underline"
                        >
                            <MapPin className="size-3.5 shrink-0" />
                            <span className="break-words">
                                {personalAddressPayload(
                                    personal.location,
                                ).address || "Thêm địa chỉ hiện tại"}
                            </span>
                        </ProfileAction>
                        <ProfileAction
                            section="personal"
                            className="inline-flex min-h-11 items-center gap-1.5 text-primary hover:underline"
                        >
                            <CalendarDays className="size-3.5" />
                            {personal.birthDate
                                ? formatDate(personal.birthDate)
                                : "Thêm ngày sinh"}
                        </ProfileAction>
                        {personal.gender && (
                            <span className="inline-flex min-h-11 items-center gap-1.5 text-muted-foreground">
                                <UserRound className="size-3.5 shrink-0" aria-hidden="true" />
                                {{ MALE: "Nam", FEMALE: "Nữ", OTHER: "Khác" }[
                                    personal.gender
                                ] ?? personal.gender}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
