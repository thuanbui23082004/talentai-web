'use client';
import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCompany, getCompanyCatalogs, saveCompany, uploadLogo, removeLogo, submitDocuments } from '@/features/company/services/company';
import type { Company, CompanyInput } from '@/features/company/schemas/company';
import { accountKey } from '@/features/account/hooks/use-account';
export const companyKey = ['recruiter-company'] as const;
export function useCompanyBusy() { return useIsMutating({ mutationKey: companyKey }) > 0; }
export function useCompany() { return useQuery({ queryKey: companyKey, queryFn: getCompany, retry: false }); }
export function useCompanyCatalogs() { return useQuery({ queryKey: ['company-catalogs'], queryFn: getCompanyCatalogs, retry: false, staleTime: 60000 }); }
export function useCompanyActions() {
  const client = useQueryClient();
  async function updated(company: Company) {
    client.setQueryData(companyKey, company);
    await Promise.all([client.invalidateQueries({ queryKey: accountKey }), client.invalidateQueries({ queryKey: ['recruiter-jobs'] })]);
  }
  return {
    save: useMutation({ mutationKey: companyKey, mutationFn: ({ input, creating }: { input: CompanyInput; creating: boolean }) => saveCompany(input, creating), onSuccess: updated, retry: false }),
    logo: useMutation({ mutationKey: companyKey, mutationFn: uploadLogo, onSuccess: updated, retry: false, gcTime: 0 }),
    remove: useMutation({ mutationKey: companyKey, mutationFn: removeLogo, onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: companyKey }), client.invalidateQueries({ queryKey: ['recruiter-jobs'] })]); }, retry: false }),
    documents: useMutation({ mutationKey: companyKey, mutationFn: submitDocuments, onSuccess: updated, retry: false, gcTime: 0 }),
  };
}
