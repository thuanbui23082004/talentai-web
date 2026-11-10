// Internal BFF routing hint; never grants permissions or goes to the backend proxy.
export const adminWorkspaceHeaders = { 'X-TalentAI-Workspace': 'admin' } as const;
