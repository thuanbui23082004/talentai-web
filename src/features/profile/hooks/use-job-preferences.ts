import { useMutation, useQueryClient } from "@tanstack/react-query";
import { savePersonalProfile } from "../services/profile";
import { jobPreferencesPayload } from "../job-preferences-mapping";
import { profileKeys } from "../query-keys";
import type { JobPreferencesDraft } from "../schemas/job-preferences";

export function useSaveJobPreferences(userId: string) {
    const client = useQueryClient();
    const queryKey = profileKeys.personal(userId);
    return useMutation({
        mutationFn: (values: JobPreferencesDraft) => savePersonalProfile(jobPreferencesPayload(values)),
        onSuccess: async profile => {
            client.setQueryData(queryKey, profile);
            await client.invalidateQueries({ queryKey });
        },
        retry: false,
    });
}
