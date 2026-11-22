import type { ComponentType } from "react";
import type { CVData } from "../types/cv";
import { CvDocument } from "./cv-document";

export type CvTemplateProps = { data: CVData; theme: string; background: string };
type CvTemplate = { id: string; name: string; thumbnail: string; component: ComponentType<CvTemplateProps> };

function template(id: string, name: string, thumbnail: string): CvTemplate {
    function Template({ data, theme, background }: CvTemplateProps) {
        return <CvDocument data={data} theme={theme} background={background} design={id} />;
    }
    Template.displayName = `CvTemplate${id}`;
    return { id, name, thumbnail, component: Template };
}

export const CV_TEMPLATE_REGISTRY = [
    template("modern-1", "Chuyên nghiệp tối", "navy"),
    template("modern-2", "Thanh lịch", "executive"),
    template("modern-3", "Sáng tạo", "creative"),
    template("modern-4", "Hiện đại", "green"),
    template("modern-5", "Tinh gọn", "classic"),
    template("modern-6", "Xanh dịu", "aqua"),
];

export function getCvTemplate(id: string): CvTemplate {
    return CV_TEMPLATE_REGISTRY.find(item => item.id === id) ?? CV_TEMPLATE_REGISTRY[0];
}
