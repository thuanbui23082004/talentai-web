import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCareerProfile, removeCareerEntry, saveCareerSection } from "../services/profile";
import { profileKeys } from "../query-keys";
import type { CareerProfile } from "../types";
import type { ProfileDraftValues } from "../schemas/profile-editor";
import { createCertificate, uploadCertificateFile } from "../services/certificates";

export function useCareerProfile(userId: string) {
    return useQuery({ queryKey: profileKeys.career(userId), queryFn: ({ signal }) => getCareerProfile(signal), retry: false });
}
export function useCareerActions(userId: string) {
    const client = useQueryClient();
    const updated = () => client.invalidateQueries({ queryKey: profileKeys.career(userId) });
    return {
        save: useMutation({ mutationFn: (variables: { values: ProfileDraftValues; id?: string }) => saveCareerSection({ ...variables, original: client.getQueryData<CareerProfile>(profileKeys.career(userId)) }), onSuccess: updated, retry: false }),
        remove: useMutation({ mutationFn: removeCareerEntry, onSuccess: updated, retry: false }),
        createCertificate: useMutation({ mutationFn: createCertificate, onSuccess: updated, retry: false }),
        uploadCertificate: useMutation({ mutationFn: ({ id, file }: { id: string; file: File }) => uploadCertificateFile(id, file), onSuccess: updated, retry: false, gcTime: 0 }),
    };
}
