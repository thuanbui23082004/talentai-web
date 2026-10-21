"use client";

import { Alert, Button } from "@/components/ui";

export default function JobDetailError({ reset }: { reset: () => void }) {
    return (
        <main className="ui-container py-12">
            <Alert
                variant="error"
                title="Không thể tải thông tin công việc. Vui lòng thử lại."
            >
                <Button variant="outline" className="mt-4" onClick={reset}>
                    Thử lại
                </Button>
            </Alert>
        </main>
    );
}
