type DocumentFile = { companyId: string; type: string; bytes: Uint8Array };
const shared = globalThis as typeof globalThis & { talentaiVerificationFiles?: Map<string, DocumentFile> };
export function getVerificationFiles() { return shared.talentaiVerificationFiles ??= new Map<string, DocumentFile>(); }
