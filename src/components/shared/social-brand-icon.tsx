export function SocialBrandIcon({ brand }: { brand: "Facebook" | "X" | "LinkedIn" }) {
    if (brand === "Facebook") return <svg aria-hidden="true" focusable="false" viewBox="0 0 32 32" className="size-6">
        <circle cx="16" cy="16" r="16" fill="#2864F0" />
        <path fill="#fff" d="M18.5 32V19.6h4.2l.6-4.8h-4.8v-3.1c0-1.4.4-2.4 2.4-2.4h2.6V5a34 34 0 0 0-3.8-.2c-3.8 0-6.4 2.3-6.4 6.6v3.4H9v4.8h4.3V32z" />
    </svg>;
    if (brand === "X") return <svg aria-hidden="true" focusable="false" viewBox="0 0 32 32" className="size-6.5">
        <rect width="32" height="32" rx="6" fill="#000" />
        <path fill="#fff" transform="translate(6 6) scale(.8333)" d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.64 7.584H.47l8.6-9.835L0 1.154h7.594l5.243 6.932 6.064-6.933Zm-1.29 19.49h2.039L6.487 3.24H4.3l13.31 17.403Z" />
    </svg>;
    return <svg aria-hidden="true" focusable="false" viewBox="0 0 32 32" className="size-4.5">
        <rect width="32" height="32" rx="3" fill="#0A66C2" />
        <circle cx="7.5" cy="8" r="2.3" fill="#fff" />
        <path fill="#fff" d="M5.5 12h4v14h-4zm7 0h3.9v1.9h.1c.6-1.1 1.9-2.3 4-2.3 4.3 0 5 2.8 5 6.4v8h-4.1v-7.1c0-1.7 0-3.9-2.4-3.9s-2.6 1.8-2.6 3.8V26h-3.9z" />
    </svg>;
}
