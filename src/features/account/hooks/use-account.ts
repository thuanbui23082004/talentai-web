'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteAvatar, getAccount, saveAccount, uploadAvatar } from '@/features/account/services/account';
import type { Account } from '@/features/account/schemas/account';
export const accountKey = ['account', 'me'] as const;
export function useAccount() { return useQuery({ queryKey: accountKey, queryFn: getAccount, retry: false, staleTime: 60000 }); }
export function useAccountActions() {
  const client = useQueryClient();
  const update = (value: Account) => { client.setQueryData(accountKey, value); };
  return {
    save: useMutation({ mutationFn: saveAccount, onSuccess: update, retry: false }),
    upload: useMutation({ mutationFn: uploadAvatar, onSuccess: update, retry: false, gcTime: 0 }),
    remove: useMutation({ mutationFn: deleteAvatar, onSuccess: () => client.invalidateQueries({ queryKey: accountKey }), retry: false }),
  };
}
