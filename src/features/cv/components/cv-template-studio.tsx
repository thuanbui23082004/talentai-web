"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { getCareerProfile, getPersonalProfile } from "@/features/profile";
import { mapProfileToCVData } from "../utils/map-profile-to-cv";
import type { CVData } from "../types/cv";
import { CvTemplateLibrary } from "./cv-template-library";
import { CvTemplateEditor } from "./editor/cv-template-editor";
import "../templates/cv-document.css";

export function CvTemplateStudio() {
    const [editor, setEditor] = useState<{ templateId: string; data: CVData }>();
    const [pending, setPending] = useState(false);
    const [error, setError] = useState("");
    const choose = async (templateId: string) => {
        setPending(true); setError("");
        try {
            const profile = await getPersonalProfile();
            const career = await getCareerProfile();
            setEditor({ templateId, data: mapProfileToCVData(profile, career) });
        } catch { setError("Không tải được hồ sơ để tạo CV. Vui lòng thử lại."); }
        finally { setPending(false); }
    };
    return <div className="candidate-page space-y-4">
        {error && <div role="alert" className="rounded-xl bg-destructive-soft p-4 text-sm text-destructive">{error}<Button variant="outline" onClick={() => setError("")} className="ml-3">Đóng</Button></div>}
        {pending && <p role="status" className="text-sm text-muted-foreground">Đang điền dữ liệu từ hồ sơ…</p>}
        <CvTemplateLibrary onChoose={choose} disabled={pending} />
        {editor && <CvTemplateEditor key={editor.templateId} templateId={editor.templateId} initial={editor.data} onClose={() => setEditor(undefined)} />}
    </div>;
}
