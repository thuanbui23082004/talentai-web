/** Small brand marks, kept separate from the Lucide interface icon set. */
export function SocialIcon({ name }: { name: "Facebook" | "Instagram" | "YouTube" | "LinkedIn" }) {
    return <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true" focusable="false" fill="currentColor">
        {name === "Facebook" && <path d="M14 22v-9h3l.5-3H14V8c0-1 .3-1.5 1.6-1.5H18V3.2A26 26 0 0 0 15 3c-3 0-5 1.8-5 5v2H7v3h3v9Z" />}
        {name === "Instagram" && <><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="17.5" cy="6.5" r="1.3" /></>}
        {name === "YouTube" && <path fillRule="evenodd" d="M3 5h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm7 3v8l7-4-7-4Z" />}
        {name === "LinkedIn" && <><rect x="3" y="9" width="4" height="12" /><circle cx="5" cy="5" r="2" /><path d="M10 9h4v1.6C15 9.4 16 9 17.5 9c3 0 4.5 1.8 4.5 5v7h-4v-6c0-1.8-.5-2.8-2-2.8s-2 1-2 2.8v6h-4Z" /></>}
    </svg>;
}
