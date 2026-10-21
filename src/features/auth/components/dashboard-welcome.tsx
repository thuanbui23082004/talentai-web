import Link from "next/link";
import {
    ArrowRight,
    BriefcaseBusiness,
    LogOut,
    ShieldCheck,
} from "lucide-react";
import {
    Alert,
    Avatar,
    Badge,
    Button,
    Card,
    CardContent,
} from "@/components/ui";
import type { AuthUser } from "../types";

const roleLabels = {
    candidate: "Ứng viên",
    recruiter: "Nhà tuyển dụng",
    admin: "Quản trị viên",
};

export function DashboardWelcome({ user }: { user: AuthUser }) {
    return (
        <main className="min-h-svh bg-background">
            <header className="border-b border-border bg-card">
                <div className="ui-container flex min-h-20 flex-wrap items-center justify-between gap-4 py-4">
                    <Link
                        href="/jobs"
                        className="text-xl font-bold text-primary"
                    >
                        TalentAI
                    </Link>
                    <div className="flex items-center gap-4">
                        <span className="hidden text-sm text-muted-foreground sm:inline">
                            {user.fullName}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            nativeButton={false}
                            render={<Link href="/logout" />}
                        >
                            <LogOut />
                            Đăng xuất
                        </Button>
                    </div>
                </div>
            </header>
            <div className="ui-container max-w-4xl! space-y-6 py-12">
                <Badge>
                    <ShieldCheck />
                    {roleLabels[user.role]}
                </Badge>
                <h1 className="text-3xl font-bold tracking-tight">
                    Xin chào, {user.fullName}!
                </h1>
                <p className="text-muted-foreground">
                    Chào mừng bạn trở lại TalentAI.
                </p>
                {user.role === "recruiter" &&
                    user.companyVerificationStatus !== "verified" && (
                        <Alert
                            variant="info"
                            title="Doanh nghiệp đang chờ hoàn thiện và kiểm duyệt"
                        >
                            Bạn có thể truy cập tài khoản. Chức năng đăng tin
                            tuyển dụng sẽ được mở sau khi hồ sơ doanh nghiệp
                            được duyệt.
                        </Alert>
                    )}
                <Card>
                    <CardContent className="flex flex-wrap items-center gap-5">
                        <Avatar name={user.fullName} size="lg" />
                        <div className="min-w-0 flex-1">
                            <h2 className="text-base font-semibold">
                                Thông tin tài khoản
                            </h2>
                            <p className="mt-1 break-all text-sm text-muted-foreground">
                                {user.email}
                            </p>
                            <p className="mt-1 text-xs text-success-foreground">
                                Đang hoạt động
                            </p>
                        </div>
                        <Badge variant="outline">{roleLabels[user.role]}</Badge>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="space-y-4">
                        <BriefcaseBusiness className="size-7 text-primary" />
                        <h2 className="text-lg font-semibold">
                            Khám phá cơ hội cùng TalentAI
                        </h2>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            {user.role === "candidate"
                                ? "Tìm những việc làm phù hợp để bắt đầu bước tiếp theo trong sự nghiệp."
                                : "Các công cụ quản lý tuyển dụng sẽ tiếp tục được bổ sung trên không gian làm việc của bạn."}
                        </p>
                        <Button
                            nativeButton={false}
                            render={<Link href="/jobs" />}
                        >
                            Khám phá việc làm
                            <ArrowRight />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
