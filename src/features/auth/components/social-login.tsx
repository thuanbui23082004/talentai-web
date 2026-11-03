"use client";

import Script from "next/script";
import { useEffect, useId, useRef, useState } from "react";
import { Alert, Button } from "@/components/ui";
import { ApiError } from "@/lib/api/errors";
import { useSocialLogin } from "../hooks/use-auth";
import type { RegistrationRole } from "./auth-role-switch";
import type {} from "../types/social-sdk";

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const facebookAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
const facebookVersion = process.env.NEXT_PUBLIC_FACEBOOK_API_VERSION || "v25.0";

export function SocialLogin({
    role = "candidate",
    disabled = false,
}: {
    role?: RegistrationRole;
    disabled?: boolean;
}) {
    const mutation = useSocialLogin();
    const statusId = useId();
    const googleButton = useRef<HTMLDivElement>(null);
    const [googleReady, setGoogleReady] = useState(false);
    const [facebookReady, setFacebookReady] = useState(false);
    const [facebookPending, setFacebookPending] = useState(false);
    const [sdkError, setSdkError] = useState("");
    const busy = disabled || mutation.isPending || facebookPending;
    // The provider callback can outlive the render in which the SDK initialized.
    const latest = useRef({ role, busy, mutate: mutation.mutate });
    useEffect(() => {
        latest.current = { role, busy, mutate: mutation.mutate };
    }, [role, busy, mutation.mutate]);

    function initializeGoogle() {
        if (!window.google || !googleButton.current || !googleClientId) return;
        try {
            window.google.accounts.id.initialize({
                client_id: googleClientId,
                auto_select: false,
                ux_mode: "popup",
                callback: ({ credential }) => {
                    if (latest.current.busy) return;
                    if (!credential) {
                        setSdkError(
                            "Chưa nhận được xác thực Google. Vui lòng thử lại.",
                        );
                        return;
                    }
                    setSdkError("");
                    latest.current.mutate({
                        provider: "GOOGLE",
                        token: credential,
                        role: latest.current.role,
                    });
                },
            });
            window.google.accounts.id.renderButton(googleButton.current, {
                type: "icon",
                theme: "outline",
                size: "large",
                shape: "circle",
                locale: "vi",
            });
            setGoogleReady(true);
        } catch {
            setSdkError(
                "Không tải được đăng nhập Google. Vui lòng tải lại trang để thử lại.",
            );
        }
    }

    function initializeFacebook() {
        if (!window.FB || !facebookAppId) return;
        try {
            window.FB.init({
                appId: facebookAppId,
                version: facebookVersion,
                cookie: false,
                xfbml: false,
            });
            setFacebookReady(true);
        } catch {
            setSdkError(
                "Không tải được đăng nhập Facebook. Vui lòng tải lại trang để thử lại.",
            );
        }
    }

    function loginFacebook() {
        if (!window.FB || !facebookReady || busy) return;
        setSdkError("");
        mutation.reset();
        setFacebookPending(true);
        try {
            // Call synchronously from the click so browsers can open the popup.
            window.FB.login(
                (response) => {
                    setFacebookPending(false);
                    const token = response.authResponse?.accessToken;
                    if (!token) {
                        setSdkError(
                            "Bạn chưa hoàn tất đăng nhập Facebook. Vui lòng thử lại.",
                        );
                        return;
                    }
                    mutation.mutate({ provider: "FACEBOOK", token, role });
                },
                { scope: "public_profile,email" },
            );
        } catch {
            setFacebookPending(false);
            setSdkError(
                "Không mở được đăng nhập Facebook. Vui lòng cho phép cửa sổ bật lên rồi thử lại.",
            );
        }
    }

    const errorMessage =
        sdkError ||
        (mutation.isError
            ? mutation.error instanceof ApiError &&
              mutation.error.code !== "INVALID_CREDENTIALS"
                ? mutation.error.message
                : "Không thể đăng nhập bằng tài khoản này. Vui lòng thử lại hoặc chọn cách đăng nhập khác."
            : "");
    return (
        <div className="mt-6">
            {googleClientId && (
                <Script
                    src="https://accounts.google.com/gsi/client"
                    onReady={initializeGoogle}
                    onError={() =>
                        setSdkError(
                            "Không tải được đăng nhập Google. Vui lòng tải lại trang để thử lại.",
                        )
                    }
                />
            )}
            {facebookAppId && (
                <Script
                    src="https://connect.facebook.net/vi_VN/sdk.js"
                    onReady={initializeFacebook}
                    onError={() =>
                        setSdkError(
                            "Không tải được đăng nhập Facebook. Vui lòng tải lại trang để thử lại.",
                        )
                    }
                />
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                <span>Hoặc đăng nhập bằng</span>
                <span className="h-px flex-1 bg-border" />
            </div>
            <div
                className="mt-4 flex items-center justify-center gap-4"
                aria-describedby={statusId}
                aria-busy={busy}
            >
                {googleClientId ? (
                    <div
                        className="flex size-11 items-center justify-center"
                        inert={busy}
                    >
                        {!googleReady && (
                            <span className="sr-only" role="status">
                                Đang tải Google…
                            </span>
                        )}
                        <div ref={googleButton} />
                    </div>
                ) : (
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Đăng nhập bằng Google"
                        title="Đăng nhập bằng Google"
                        disabled
                        className="rounded-full disabled:opacity-70 [&_svg]:size-5"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            focusable="false"
                        >
                            {/* Brand colors belong to the Google logo, not the UI palette. */}
                            <path
                                fill="#4285F4"
                                d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.23c1.89-1.74 2.98-4.3 2.98-7.36Z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.23-2.51c-.9.6-2.05.96-3.39.96-2.6 0-4.81-1.76-5.6-4.12H3.06v2.59A10 10 0 0 0 12 22Z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M6.4 13.92a6 6 0 0 1 0-3.84V7.49H3.06a10 10 0 0 0 0 9.02l3.34-2.59Z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.96c1.47 0 2.79.51 3.82 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.94 5.49l3.34 2.59C7.19 7.72 9.4 5.96 12 5.96Z"
                            />
                        </svg>
                    </Button>
                )}
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Đăng nhập bằng Facebook"
                    title="Đăng nhập bằng Facebook"
                    disabled={!facebookReady || busy}
                    onClick={loginFacebook}
                    loading={
                        facebookPending ||
                        (mutation.isPending &&
                            mutation.variables?.provider === "FACEBOOK")
                    }
                    className="rounded-full disabled:opacity-70 [&_svg]:size-5"
                >
                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        focusable="false"
                    >
                        <circle cx="12" cy="12" r="10" fill="#1877F2" />
                        <path
                            fill="#fff"
                            d="M13.4 22v-7.7H16l.4-3h-3V9.4c0-.87.25-1.46 1.5-1.46h1.6V5.25a21 21 0 0 0-2.33-.12c-2.3 0-3.87 1.4-3.87 3.97v2.2H7.7v3h2.6V22h3.1Z"
                        />
                    </svg>
                </Button>
            </div>
            <div id={statusId} className="mt-3" aria-live="polite">
                {mutation.isPending && (
                    <p className="text-xs text-muted-foreground">
                        Đang xác thực tài khoản…
                    </p>
                )}
                {(!googleClientId || !facebookAppId) && (
                    <p className="text-xs text-muted-foreground">
                        {!googleClientId && !facebookAppId
                            ? "Đăng nhập Google/Facebook hiện chưa sẵn sàng."
                            : !googleClientId
                              ? "Đăng nhập Google hiện chưa sẵn sàng."
                              : "Đăng nhập Facebook hiện chưa sẵn sàng."}
                    </p>
                )}
                {errorMessage && (
                    <Alert variant="error" title="Chưa thể đăng nhập">
                        {errorMessage}
                    </Alert>
                )}
            </div>
        </div>
    );
}
