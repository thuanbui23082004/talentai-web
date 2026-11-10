import { create } from 'zustand';
// UI notice only; job records remain in TanStack Query.
export const useAdminJobsNotice = create<{ deleted: boolean; setDeleted: (value: boolean) => void }>(set => ({ deleted: false, setDeleted: deleted => set({ deleted }) }));
