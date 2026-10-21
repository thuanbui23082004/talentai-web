"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Button, Modal, ModalContent, ModalTrigger } from "@/components/ui";

export function AvailabilityButton({ children, title, description, className }: { children: ReactNode; title: string; description: string; className?: string }) {
    return <Modal>
        <ModalTrigger render={<button type="button" className={className} />}>{children}</ModalTrigger>
        <ModalContent title={title} description={description} footer={<Button nativeButton={false} role="link" render={<Link href="/jobs" />}>Khám phá việc làm</Button>} />
    </Modal>;
}
