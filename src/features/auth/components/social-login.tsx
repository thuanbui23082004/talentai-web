import { Button } from "@/components/ui";

export function SocialLogin() {
    return (
        <div className="mt-6">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                <span>Hoặc đăng nhập bằng</span>
                <span className="h-px flex-1 bg-border" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3" aria-describedby="social-login-status">
                <Button variant="outline" disabled className="w-full disabled:opacity-70">
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        {/* Brand colors belong to the Google logo, not the UI palette. */}
                        <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.23c1.89-1.74 2.98-4.3 2.98-7.36Z" />
                        <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.23-2.51c-.9.6-2.05.96-3.39.96-2.6 0-4.81-1.76-5.6-4.12H3.06v2.59A10 10 0 0 0 12 22Z" />
                        <path fill="#FBBC05" d="M6.4 13.92a6 6 0 0 1 0-3.84V7.49H3.06a10 10 0 0 0 0 9.02l3.34-2.59Z" />
                        <path fill="#EA4335" d="M12 5.96c1.47 0 2.79.51 3.82 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.94 5.49l3.34 2.59C7.19 7.72 9.4 5.96 12 5.96Z" />
                    </svg>
                    Google
                </Button>
                <Button variant="outline" disabled className="w-full disabled:opacity-70">
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <circle cx="12" cy="12" r="10" fill="#1877F2" />
                        <path fill="#fff" d="M13.4 22v-7.7H16l.4-3h-3V9.4c0-.87.25-1.46 1.5-1.46h1.6V5.25a21 21 0 0 0-2.33-.12c-2.3 0-3.87 1.4-3.87 3.97v2.2H7.7v3h2.6V22h3.1Z" />
                    </svg>
                    Facebook
                </Button>
            </div>
            <p id="social-login-status" className="mt-3 text-center text-xs text-muted-foreground">
                Đăng nhập Google và Facebook: sắp ra mắt.
            </p>
        </div>
    );
}
