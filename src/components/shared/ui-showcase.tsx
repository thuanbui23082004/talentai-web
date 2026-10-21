"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
    ArrowRight,
    Bell,
    Bookmark,
    Check,
    CheckCircle2,
    ChevronRight,
    CircleHelp,
    Code2,
    Flame,
    Heart,
    Layers3,
    MapPin,
    Palette,
    Plus,
    Send,
    ShieldCheck,
    Sparkles,
    Users,
    WandSparkles,
    Zap,
} from "lucide-react";
import {
    Button,
    Input,
    FormField,
    Select,
    MultiSelect,
    Checkbox,
    RadioGroup,
    Badge,
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    Avatar,
    Tooltip,
    Modal,
    ModalTrigger,
    ModalClose,
    ModalContent,
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
    Pagination,
    Skeleton,
    Alert,
    useToast,
} from "@/components/ui";
import { EmptyState } from "./empty-state";
import { SearchBar } from "./search-bar";

const cities = [
    { value: "", label: "Tất cả địa điểm" },
    { value: "Hà Nội", label: "Hà Nội" },
    { value: "Đà Nẵng", label: "Đà Nẵng" },
    { value: "TP.HCM", label: "TP.HCM" },
];
const skills = [
    { value: "react", label: "React" },
    { value: "typescript", label: "TypeScript" },
    { value: "figma", label: "Figma" },
    { value: "node", label: "Node.js" },
    { value: "communication", label: "Giao tiếp" },
];
const examples = [
    {
        title: "Senior Frontend Developer",
        company: "Công ty mẫu TechVision",
        city: "TP.HCM",
        salary: "25–40 triệu",
        initials: "TV",
        tag: "React · TypeScript",
        tone: "bg-info-soft text-info-foreground",
    },
    {
        title: "Product Designer (UI/UX)",
        company: "Công ty mẫu Design Studio",
        city: "Hà Nội",
        salary: "18–30 triệu",
        initials: "ds.",
        tag: "Figma · Design System",
        tone: "bg-secondary text-primary",
    },
    {
        title: "Chuyên viên tuyển dụng",
        company: "Công ty mẫu People & Co.",
        city: "Đà Nẵng",
        salary: "12–18 triệu",
        initials: "p&c",
        tag: "Tuyển dụng · Giao tiếp",
        tone: "bg-success-soft text-success-foreground",
    },
];

function Section({
    number,
    title,
    description,
    children,
    id,
}: {
    number: string;
    title: string;
    description: string;
    children: ReactNode;
    id?: string;
}) {
    return (
        <section id={id} className="scroll-mt-8">
            <div className="mb-5 flex items-start gap-3">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-[11px] font-bold text-primary">
                    {number}
                </span>
                <div>
                    <h2 className="text-lg font-bold tracking-tight">
                        {title}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {description}
                    </p>
                </div>
            </div>
            {children}
        </section>
    );
}

function ExampleJobCard({ job }: { job: (typeof examples)[number] }) {
    const [saved, setSaved] = useState(false);
    const { toast } = useToast();
    return (
        <Card className="group transition hover:border-primary/25 hover:shadow-float">
            <CardContent className="p-5!">
                <div className="flex items-start gap-3">
                    <div
                        className={`flex size-12 shrink-0 items-center justify-center rounded-xl text-base font-bold ${job.tone}`}
                    >
                        {job.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="truncate text-[13px] font-semibold">
                            {job.title}
                        </h3>
                        <p className="mt-1 truncate text-[11px] text-muted-foreground">
                            {job.company}
                        </p>
                    </div>
                    <Tooltip
                        content={saved ? "Bỏ lưu việc làm" : "Lưu việc làm"}
                    >
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`${saved ? "Bỏ lưu" : "Lưu"} ${job.title}`}
                            aria-pressed={saved}
                            className="-mt-1 -mr-2 size-8!"
                            onClick={() => {
                                setSaved(!saved);
                                toast({
                                    title: saved
                                        ? "Đã bỏ lưu việc làm mẫu"
                                        : "Đã lưu việc làm mẫu",
                                    description:
                                        "Tương tác minh họa trong bộ giao diện.",
                                });
                            }}
                        >
                            <Heart
                                className={
                                    saved ? "fill-primary text-primary" : ""
                                }
                            />
                        </Button>
                    </Tooltip>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                    <Badge>{job.salary}</Badge>
                    <Badge variant="neutral">
                        <MapPin />
                        {job.city}
                    </Badge>
                    <Badge variant="neutral">Toàn thời gian</Badge>
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">
                    {job.tag}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    <Badge variant="hot">
                        <Flame />
                        HOT
                    </Badge>
                    <Button
                        variant="link"
                        size="sm"
                        className="h-7! px-0!"
                        onClick={() =>
                            toast({
                                title: "Bạn đang xem thẻ minh họa",
                                description:
                                    "Luồng ứng tuyển sẽ được triển khai ở bước tiếp theo.",
                                variant: "info",
                            })
                        }
                    >
                        Ứng tuyển
                        <ArrowRight />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export function UiShowcase() {
    const router = useRouter();
    const { toast } = useToast();
    const [selectedSkills, setSelectedSkills] = useState([
        "react",
        "typescript",
    ]);
    const [location, setLocation] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [subscribed, setSubscribed] = useState(true);
    const [showError, setShowError] = useState(false);
    return (
        <>
            <section className="hero-surface relative isolate overflow-hidden border-b border-border/50 pb-10 pt-10 sm:pb-12 sm:pt-14">
                <div className="ui-container relative z-10">
                    <div className="text-center">
                        <Badge
                            variant="outline"
                            className="gap-1.5 rounded-full bg-card/80 px-3 py-1.5 font-medium"
                        >
                            <Sparkles className="text-primary" />
                            TalentAI Design System{" "}
                            <span className="ml-1 text-muted-foreground">
                                v1.0
                            </span>
                        </Badge>
                        <h1 className="mx-auto mt-5 max-w-4xl text-[28px] leading-[1.2] font-bold tracking-[-0.035em] text-primary sm:text-[40px] lg:text-[44px]">
                            Tìm Đúng Việc – Chạm Đến Tương Lai
                        </h1>
                        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                            Kết nối nhân tài với cơ hội. Cùng bạn mở lối đến
                            thành công trong sự nghiệp.
                        </p>
                    </div>
                    <div className="relative mx-auto mt-8 max-w-5xl">
                        <SearchBar
                            locations={cities}
                            onSearch={({ query, location: city }) => {
                                const params = new URLSearchParams();
                                if (query) params.set("q", query);
                                if (city) params.set("city", city);
                                router.push(`/jobs?${params}`);
                            }}
                            filters={
                                <>
                                    <Badge
                                        variant="outline"
                                        className="h-9 gap-1.5 px-3 text-xs"
                                    >
                                        <Zap className="text-primary" />
                                        Tìm việc nhanh
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        Từ khóa rõ ràng. Cơ hội phù hợp.
                                    </span>
                                    <span className="ml-auto hidden rounded-lg bg-secondary px-3 py-2 text-xs text-primary sm:inline-flex">
                                        <ShieldCheck className="mr-1.5 size-3.5" />
                                        Trải nghiệm đơn giản
                                    </span>
                                </>
                            }
                        />
                    </div>
                    <div className="mx-auto mt-9 flex max-w-xl flex-wrap items-center justify-center gap-6 sm:gap-12">
                        {[
                            {
                                icon: Layers3,
                                number: "18",
                                label: "Thành phần UI",
                            },
                            {
                                icon: Palette,
                                number: "01",
                                label: "Ngôn ngữ thiết kế",
                            },
                            {
                                icon: Users,
                                number: "03",
                                label: "Vai trò sử dụng",
                            },
                        ].map(({ icon: Icon, number, label }) => (
                            <div
                                key={label}
                                className="flex items-center gap-3"
                            >
                                <span className="flex size-10 items-center justify-center rounded-full bg-brand-deep text-white sm:size-12">
                                    <Icon
                                        className="size-5"
                                        strokeWidth={1.6}
                                    />
                                </span>
                                <span>
                                    <strong className="block text-lg font-bold text-primary">
                                        {number}
                                    </strong>
                                    <span className="text-[11px] text-muted-foreground sm:text-xs">
                                        {label}
                                    </span>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
                <Image
                    src="/images/image 15.png"
                    alt=""
                    width={190}
                    height={250}
                    loading="eager"
                    className="pointer-events-none absolute -bottom-3 -left-6 hidden w-40 -rotate-12 opacity-90 xl:block"
                />
                <Image
                    src="/images/image 16.png"
                    alt=""
                    width={220}
                    height={265}
                    loading="eager"
                    className="pointer-events-none absolute -right-6 -bottom-10 hidden w-48 rotate-8 opacity-90 xl:block"
                />
            </section>

            <main
                className="ui-container space-y-12 py-10 sm:py-12"
                id="components"
            >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
                    <div>
                        <p className="text-[11px] font-semibold tracking-[0.18em] text-primary uppercase">
                            The foundation
                        </p>
                        <h2 className="mt-2 ui-section-heading">
                            Nhất quán từ những chi tiết nhỏ.
                        </h2>
                    </div>
                    <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                        Không gian thoáng. Tương tác rõ ràng.
                        <br />
                        Một trải nghiệm xuyên suốt trên mọi màn hình.
                    </p>
                </div>

                <Section
                    number="01"
                    title="Màu sắc & kiểu chữ"
                    description="Tím làm điểm nhận diện, nền sáng giữ sự tập trung vào nội dung."
                >
                    <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
                        <Card>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                                    {[
                                        {
                                            name: "Tím đậm",
                                            code: "#46009B",
                                            style: "bg-brand-deep",
                                        },
                                        {
                                            name: "Tím sáng",
                                            code: "#7C3AED",
                                            style: "bg-brand-bright",
                                        },
                                        {
                                            name: "Tím nhạt",
                                            code: "#F0EAFA",
                                            style: "bg-secondary",
                                        },
                                        {
                                            name: "Xanh nhạt",
                                            code: "#EDF5FF",
                                            style: "bg-info-soft",
                                        },
                                        {
                                            name: "Cam nhấn",
                                            code: "#F07818",
                                            style: "bg-warning",
                                        },
                                        {
                                            name: "Xám sáng",
                                            code: "#F7F8FC",
                                            style: "bg-background",
                                        },
                                    ].map((color) => (
                                        <div key={color.code}>
                                            <div
                                                className={`mb-3 h-16 rounded-xl border border-foreground/5 ${color.style}`}
                                            />
                                            <p className="text-[11px] font-medium">
                                                {color.name}
                                            </p>
                                            <p className="mt-1 font-mono text-[9px] text-muted-foreground">
                                                {color.code}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="flex h-full items-center gap-6">
                                <span className="text-6xl font-semibold tracking-tight text-primary">
                                    Aa
                                </span>
                                <div>
                                    <p className="text-lg font-semibold">
                                        Inter
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Hiện đại. Rõ ràng. Dễ đọc.
                                    </p>
                                    <p className="mt-3 text-xs tracking-wider text-muted-foreground">
                                        Regular · Medium · Semibold · Bold
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </Section>

                <Section
                    number="02"
                    title="Button"
                    description="Hành động chính nổi bật, hành động phụ nhẹ nhàng. Chiều cao mặc định 44px."
                >
                    <Card>
                        <CardContent className="space-y-6">
                            <div className="flex flex-wrap items-center gap-3">
                                <Button>
                                    <Plus />
                                    Tạo hồ sơ
                                </Button>
                                <Button variant="secondary">
                                    Khám phá việc làm
                                    <ArrowRight />
                                </Button>
                                <Button variant="outline">
                                    <Bookmark />
                                    Lưu việc làm
                                </Button>
                                <Button variant="ghost">
                                    Bỏ qua
                                    <ChevronRight />
                                </Button>
                                <Button variant="destructive">Xóa</Button>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
                                <Button loading>Đang xử lý</Button>
                                <Button disabled>Chưa khả dụng</Button>
                                <Button size="sm">Nhỏ</Button>
                                <Button size="lg">
                                    <Send />
                                    Ứng tuyển ngay
                                </Button>
                                <Tooltip content="Thông báo của bạn">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        aria-label="Thông báo"
                                    >
                                        <Bell />
                                    </Button>
                                </Tooltip>
                                <Tooltip content="Lưu các cơ hội để xem lại sau">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Giải thích lưu việc"
                                    >
                                        <CircleHelp />
                                    </Button>
                                </Tooltip>
                            </div>
                            <Button
                                className="w-full rounded-2xl"
                                size="lg"
                                onClick={() =>
                                    toast({
                                        title: "Đã hoàn tất thao tác mẫu",
                                        description:
                                            "Button sử dụng thống nhất màu sắc và khoảng cách.",
                                    })
                                }
                            >
                                Hoàn tất
                                <Check />
                            </Button>
                        </CardContent>
                    </Card>
                </Section>

                <Section
                    number="03"
                    title="Input & lựa chọn"
                    description="Label rõ ràng, thông báo ngay tại trường nhập. Hỗ trợ chọn một hoặc nhiều giá trị."
                >
                    <div className="grid gap-5 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Thông tin cơ bản</CardTitle>
                                <CardDescription>
                                    Những trường nhập dùng xuyên suốt nền tảng.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <FormField label="Họ và tên" required>
                                    {(props) => (
                                        <Input
                                            {...props}
                                            placeholder="Nhập họ và tên của bạn"
                                            autoComplete="name"
                                        />
                                    )}
                                </FormField>
                                <FormField
                                    label="Email"
                                    required
                                    description="Chúng tôi sẽ gửi thông báo việc làm tới địa chỉ này."
                                    error={
                                        showError
                                            ? "Vui lòng nhập địa chỉ email hợp lệ, ví dụ ban@example.com."
                                            : undefined
                                    }
                                >
                                    {(props) => (
                                        <Input
                                            {...props}
                                            type="email"
                                            placeholder="ban@example.com"
                                            autoComplete="email"
                                        />
                                    )}
                                </FormField>
                                <FormField
                                    label="Mật khẩu"
                                    description="Tối thiểu 8 ký tự, bao gồm chữ hoa và chữ số."
                                >
                                    {(props) => (
                                        <Input
                                            {...props}
                                            type="password"
                                            placeholder="Nhập mật khẩu"
                                            autoComplete="new-password"
                                        />
                                    )}
                                </FormField>
                                <FormField label="Tìm kiếm">
                                    {(props) => (
                                        <Input
                                            {...props}
                                            type="search"
                                            placeholder="Vị trí, công ty hoặc kỹ năng…"
                                        />
                                    )}
                                </FormField>
                                <FormField
                                    label="Mã hồ sơ"
                                    description="Trường thông tin không thể chỉnh sửa."
                                >
                                    {(props) => (
                                        <Input
                                            {...props}
                                            value="TA-2026-001"
                                            disabled
                                        />
                                    )}
                                </FormField>
                                <Checkbox
                                    label="Hiển thị trạng thái lỗi minh họa"
                                    checked={showError}
                                    onChange={(event) =>
                                        setShowError(event.target.checked)
                                    }
                                />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Tiêu chí của bạn</CardTitle>
                                <CardDescription>
                                    Chọn đúng thông tin để tìm cơ hội phù hợp
                                    hơn.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <FormField label="Địa điểm làm việc">
                                    {(props) => (
                                        <Select
                                            {...props}
                                            options={cities.filter(
                                                (city) => city.value,
                                            )}
                                            value={location}
                                            onValueChange={setLocation}
                                            placeholder="Chọn tỉnh / thành phố"
                                        />
                                    )}
                                </FormField>
                                <FormField
                                    label="Kỹ năng"
                                    description="Bạn có thể chọn nhiều kỹ năng."
                                >
                                    {(props) => (
                                        <MultiSelect
                                            {...props}
                                            label="Kỹ năng"
                                            options={skills}
                                            value={selectedSkills}
                                            onValueChange={setSelectedSkills}
                                        />
                                    )}
                                </FormField>
                                <RadioGroup
                                    label="Hình thức làm việc"
                                    defaultValue="full_time"
                                    options={[
                                        {
                                            value: "full_time",
                                            label: "Toàn thời gian",
                                        },
                                        {
                                            value: "remote",
                                            label: "Làm việc từ xa",
                                            description:
                                                "Linh hoạt địa điểm, kết nối mọi nơi.",
                                        },
                                        {
                                            value: "hybrid",
                                            label: "Kết hợp (Hybrid)",
                                        },
                                    ]}
                                />
                                <div className="space-y-4 border-t border-border pt-5">
                                    <Checkbox
                                        label="Nhận thông báo việc làm phù hợp"
                                        description="Cập nhật các cơ hội mới dành cho bạn."
                                        checked={subscribed}
                                        onChange={(event) =>
                                            setSubscribed(event.target.checked)
                                        }
                                    />
                                    <Checkbox label="Tôi đồng ý với điều khoản sử dụng" />
                                    <Checkbox
                                        label="Lựa chọn đang bị khóa"
                                        disabled
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </Section>

                <Section
                    number="04"
                    title="Badge, Avatar & Card"
                    description="Thông tin cô đọng, dễ quét. Mẫu thẻ việc làm dưới đây chỉ dùng để xem thử giao diện."
                >
                    <Card className="mb-5">
                        <CardContent className="flex flex-wrap items-center justify-between gap-6">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="hot">
                                    <Flame />
                                    HOT
                                </Badge>
                                <Badge variant="new">New</Badge>
                                <Badge variant="remote">Remote</Badge>
                                <Badge>Full-time</Badge>
                                <Badge variant="outline">Hybrid</Badge>
                                <Badge variant="neutral">
                                    2 năm kinh nghiệm
                                </Badge>
                            </div>
                            <div className="flex items-center gap-3">
                                <Avatar name="Nguyễn Minh Anh" size="sm" />
                                <Avatar name="Trần Hoàng Nam" />
                                <Avatar name="Lê Thanh Hà" size="lg" />
                                <span className="text-xs text-muted-foreground">
                                    Ảnh & chữ viết tắt
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-base font-semibold text-warning-foreground">
                            <Flame className="size-5" />
                            Việc làm nổi bật
                        </h3>
                        <Badge variant="outline">Dữ liệu minh họa</Badge>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {examples.map((job) => (
                            <ExampleJobCard job={job} key={job.title} />
                        ))}
                    </div>
                </Section>

                <div className="grid gap-8 lg:grid-cols-2">
                    <Section
                        number="05"
                        title="Tabs & Pagination"
                        description="Di chuyển giữa các nội dung và trang kết quả."
                    >
                        <Card>
                            <CardContent className="space-y-7">
                                <Tabs defaultValue="recommended">
                                    <TabsList aria-label="Nhóm việc làm">
                                        <TabsTrigger value="recommended">
                                            Dành cho bạn
                                        </TabsTrigger>
                                        <TabsTrigger value="saved">
                                            Đã lưu
                                        </TabsTrigger>
                                        <TabsTrigger value="applied" disabled>
                                            Đã ứng tuyển
                                        </TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="recommended">
                                        <div className="flex items-center gap-3 rounded-xl bg-info-soft p-4 text-info-foreground">
                                            <WandSparkles className="size-5 shrink-0" />
                                            <div>
                                                <p className="text-sm font-semibold">
                                                    Cơ hội phù hợp với bạn
                                                </p>
                                                <p className="mt-1 text-xs">
                                                    Nội dung minh họa cho tab
                                                    đang chọn.
                                                </p>
                                            </div>
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="saved">
                                        <div className="flex items-center gap-3 rounded-xl bg-secondary p-4 text-primary">
                                            <Bookmark className="size-5" />
                                            <div>
                                                <p className="text-sm font-semibold">
                                                    Danh sách việc làm đã lưu
                                                </p>
                                                <p className="mt-1 text-xs">
                                                    Các cơ hội bạn muốn quay lại
                                                    khám phá.
                                                </p>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                                <div className="space-y-3 border-t border-border pt-6">
                                    <Pagination
                                        page={page}
                                        totalPages={8}
                                        onPageChange={setPage}
                                    />
                                    <p
                                        className="text-center text-xs text-muted-foreground"
                                        aria-live="polite"
                                    >
                                        Trang {page} trên 8
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </Section>
                    <Section
                        number="06"
                        title="Modal, Tooltip & Toast"
                        description="Phản hồi đúng lúc, giúp người dùng tự tin thao tác."
                    >
                        <Card>
                            <CardContent className="space-y-5">
                                <div className="flex items-center gap-3 rounded-xl bg-secondary/60 p-4">
                                    <div className="rounded-lg bg-card p-2 text-primary">
                                        <CheckCircle2 className="size-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">
                                            Mỗi thao tác đều có phản hồi
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Xác nhận rõ ràng. Thông báo dễ hiểu.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <Modal
                                        open={modalOpen}
                                        onOpenChange={setModalOpen}
                                    >
                                        <ModalTrigger
                                            render={
                                                <Button variant="outline" />
                                            }
                                        >
                                            Mở hộp thoại
                                            <ArrowRight />
                                        </ModalTrigger>
                                        <ModalContent
                                            title="Lưu thay đổi hồ sơ?"
                                            description="Thông tin cập nhật sẽ giúp nhà tuyển dụng hiểu rõ hơn về bạn."
                                            footer={
                                                <>
                                                    <ModalClose
                                                        render={
                                                            <Button variant="outline" />
                                                        }
                                                    >
                                                        Hủy bỏ
                                                    </ModalClose>
                                                    <Button
                                                        onClick={() => {
                                                            setModalOpen(false);
                                                            toast({
                                                                title: "Đã lưu thay đổi mẫu",
                                                                description:
                                                                    "Hồ sơ minh họa đã được cập nhật.",
                                                            });
                                                        }}
                                                    >
                                                        Lưu thay đổi
                                                    </Button>
                                                </>
                                            }
                                        >
                                            <Alert
                                                variant="info"
                                                title="Đây là thao tác minh họa"
                                            >
                                                Không có dữ liệu tài khoản nào
                                                được thay đổi.
                                            </Alert>
                                        </ModalContent>
                                    </Modal>
                                    <Button
                                        variant="secondary"
                                        onClick={() =>
                                            toast({
                                                title: "Đã lưu thành công",
                                                description:
                                                    "Bạn có thể tiếp tục khám phá các cơ hội.",
                                            })
                                        }
                                    >
                                        Toast thành công
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() =>
                                            toast({
                                                title: "Chưa thể hoàn tất",
                                                description:
                                                    "Vui lòng thử lại sau ít phút.",
                                                variant: "error",
                                            })
                                        }
                                    >
                                        Toast lỗi
                                    </Button>
                                </div>
                                <p className="text-xs leading-relaxed text-muted-foreground">
                                    Di chuột hoặc focus vào biểu tượng để xem
                                    giải thích.
                                </p>
                                <Tooltip content="Chỉ bạn và nhà tuyển dụng được phép mới có thể xem hồ sơ.">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        aria-label="Quyền riêng tư hồ sơ"
                                    >
                                        <ShieldCheck />
                                    </Button>
                                </Tooltip>
                            </CardContent>
                        </Card>
                    </Section>
                </div>

                <Section
                    number="07"
                    title="Trạng thái & thông báo"
                    description="Luôn cho người dùng biết điều gì đang diễn ra và có thể làm gì tiếp theo."
                >
                    <div className="grid gap-5 lg:grid-cols-2">
                        <div className="space-y-3">
                            <Alert title="Gợi ý từ AI" variant="info">
                                Kết quả chỉ hỗ trợ tham khảo. Quyết định luôn
                                thuộc về bạn.
                            </Alert>
                            <Alert
                                title="Hồ sơ đã được cập nhật"
                                variant="success"
                            >
                                Thông tin mới đã sẵn sàng để sử dụng.
                            </Alert>
                            <Alert
                                title="Hồ sơ còn thiếu thông tin"
                                variant="warning"
                            >
                                Bổ sung kỹ năng để nhà tuyển dụng hiểu rõ hơn về
                                bạn.
                            </Alert>
                            <Alert
                                title="Không thể tải dữ liệu"
                                variant="error"
                            >
                                <div className="flex flex-wrap items-center gap-3">
                                    Kiểm tra kết nối và thử lại.
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            toast({
                                                title: "Đã gửi yêu cầu thử lại mẫu",
                                                variant: "info",
                                            })
                                        }
                                    >
                                        Thử lại
                                    </Button>
                                </div>
                            </Alert>
                        </div>
                        <EmptyState
                            action={
                                <Button
                                    variant="outline"
                                    onClick={() => router.push("/jobs")}
                                >
                                    Khám phá việc làm
                                    <ArrowRight />
                                </Button>
                            }
                        />
                    </div>
                    <Card className="mt-5">
                        <CardHeader>
                            <CardTitle>Skeleton</CardTitle>
                            <CardDescription>
                                Giữ bố cục ổn định khi nội dung đang được tải.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div
                                role="status"
                                aria-label="Đang tải nội dung mẫu"
                                className="grid gap-6 md:grid-cols-3"
                            >
                                {[1, 2, 3].map((item) => (
                                    <div className="flex gap-3" key={item}>
                                        <Skeleton className="size-12 shrink-0 rounded-xl" />
                                        <div className="flex-1 space-y-2.5">
                                            <Skeleton className="h-3.5 w-4/5" />
                                            <Skeleton className="h-3 w-3/5" />
                                            <Skeleton className="mt-4 h-5 w-2/3" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </Section>

                <Card className="overflow-hidden border-primary/10 bg-secondary/40">
                    <CardContent className="flex flex-wrap items-center justify-between gap-5">
                        <div className="flex items-center gap-4">
                            <span className="hidden rounded-2xl bg-card p-3 text-primary sm:block">
                                <Code2 className="size-6" />
                            </span>
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Sẵn sàng cho những trải nghiệm tiếp theo.
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Một nền tảng UI chung cho ứng viên, nhà
                                    tuyển dụng và quản trị viên.
                                </p>
                            </div>
                        </div>
                        <Button onClick={() => router.push("/jobs")}>
                            Xem trang việc làm
                            <ArrowRight />
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </>
    );
}
