import Image from "next/image";

export function BrandLogo({ light = false }: { light?: boolean }) {
    return <span className="relative block h-9 w-32 shrink-0 overflow-hidden">
        <Image src={light ? "/logo/image 17.png" : "/logo/image 1.png"} alt="TalentAI" width={490} height={490} className="absolute top-1/2 -left-4 w-40 max-w-none -translate-y-1/2" />
    </span>;
}
