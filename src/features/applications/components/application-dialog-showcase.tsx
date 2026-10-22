"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { ApplicationDialog } from "./application-dialog";
import type { Application } from "../types";

// Presentation-only examples for the cases the current job API cannot represent.
const locations: Application["job"]["location"][] = [
    { city: "TP.HCM", ward: "Phường Phú Lợi" },
    { city: "Đà Nẵng", ward: "Phường Hải Vân" },
];
const job = { title: "Kỹ sư BIM MEP (Nhân viên thiết kế MEP) – Thu nhập 10–13 triệu", company: { name: "Doanh nghiệp minh họa" }, location: locations[0], status: "open" as const };

export function ApplicationDialogShowcase() {
    const [example, setExample] = useState<"single" | "multiple" | "empty">();
    return <main className="ui-container space-y-5 py-10">
        <h1 className="text-2xl font-bold">Popup ứng tuyển</h1>
        <p className="text-muted-foreground">Bản xem trước giao diện, không gửi hồ sơ hoặc tải CV lên hệ thống.</p>
        <div className="flex flex-wrap gap-3">
            <Button onClick={() => setExample("single")}>Job một địa điểm</Button>
            <Button variant="outline" onClick={() => setExample("multiple")}>Job nhiều địa điểm</Button>
            <Button variant="outline" onClick={() => setExample("empty")}>Chưa có CV</Button>
        </div>
        <ApplicationDialog key={example ?? "closed"} job={job} open={!!example} onOpenChange={(open) => { if (!open) setExample(undefined); }} locations={example === "multiple" ? locations : [locations[0]]} cvs={example === "empty" ? [] : undefined} />
    </main>;
}
