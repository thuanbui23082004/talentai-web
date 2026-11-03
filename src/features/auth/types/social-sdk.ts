// Only the SDK surface used by this feature; no dependency or token storage.
export type GoogleIdentity = {
    accounts: { id: {
        initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select: boolean;
            ux_mode: "popup";
        }) => void;
        renderButton: (element: HTMLElement, options: {
            type: "icon"; theme: "outline"; size: "large";
            shape: "circle"; locale: "vi";
        }) => void;
    } };
};

export type FacebookIdentity = {
    init: (options: { appId: string; version: string; cookie: boolean; xfbml: boolean }) => void;
    login: (
        callback: (response: { authResponse?: { accessToken?: string } | null }) => void,
        options: { scope: string },
    ) => void;
};

declare global {
    interface Window {
        google?: GoogleIdentity;
        FB?: FacebookIdentity;
    }
}
