import { Check } from "lucide-react";

function readableLines(text: string, heading?: string) {
    const decoded = text
        .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(?:p|div|li|ul|ol|h[1-6])\s*>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&(#x[0-9a-f]+|#\d+|nbsp|amp|lt|gt|quot|apos);/gi, (_, entity: string) => {
            if (entity.startsWith("#")) {
                const code = entity[1].toLowerCase() === "x" ? Number.parseInt(entity.slice(2), 16) : Number.parseInt(entity.slice(1), 10);
                return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
            }
            return { nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }[entity.toLowerCase() as "nbsp" | "amp" | "lt" | "gt" | "quot" | "apos"];
        });
    return decoded.split(/\r?\n/).map(line => line.trim()).filter(line => line && line.toLocaleLowerCase("vi") !== heading?.toLocaleLowerCase("vi"));
}

export function TextList({ text, heading }: { text: string; heading?: string }) {
    return (
        <ul className="space-y-3">
            {readableLines(text, heading).map((line, index) => (
                    <li
                        key={index}
                        className="flex items-start gap-3 text-sm leading-7"
                    >
                        <Check
                            aria-hidden="true"
                            className="mt-1.5 size-4 shrink-0 text-primary"
                        />
                        <span>{line}</span>
                    </li>
                ))}
        </ul>
    );
}

