import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteCv, getCv, getCvFile, listCvs, setDefaultCv, uploadCv } from "../services/cvs";
import { cvKeys } from "../query-keys";

export function useCvs(userId: string) {
    return useQuery({ queryKey: cvKeys.list(userId), queryFn: ({ signal }) => listCvs(signal), retry: false });
}

export function useCvDetail(userId: string, id: string) {
    return useQuery({ queryKey: cvKeys.detail(userId, id), queryFn: ({ signal }) => getCv(id, signal), enabled: !!id, retry: false });
}

export function useCvFile(userId: string, id: string, enabled: boolean) {
    return useQuery({ queryKey: [...cvKeys.detail(userId, id), "file"], queryFn: ({ signal }) => getCvFile(id, signal), enabled, retry: false, gcTime: 0 });
}

export function useCvActions(userId: string) {
    const client = useQueryClient();
    const refresh = () => client.invalidateQueries({ queryKey: cvKeys.all(userId) });
    return {
        upload: useMutation({ mutationFn: uploadCv, onSuccess: refresh, retry: false, gcTime: 0 }),
        setDefault: useMutation({ mutationFn: setDefaultCv, onSuccess: refresh, retry: false }),
        remove: useMutation({ mutationFn: deleteCv, onSuccess: async (_, id) => {
            client.removeQueries({ queryKey: cvKeys.detail(userId, id), exact: true });
            await refresh();
        }, retry: false }),
    };
}
