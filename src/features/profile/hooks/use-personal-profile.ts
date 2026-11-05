import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPersonalProfile, savePersonalProfile } from "../services/profile";
import { personalPayload } from "../personal-mapping";
import { profileKeys } from "../query-keys";
import type { ProfileDraftValues } from "../schemas/profile-editor";
import type { PersonalProfile } from "../types";
import { ApiError } from "@/lib/api/errors";

export function usePersonalProfile(userId: string) {
    return useQuery({ queryKey: profileKeys.personal(userId), queryFn: ({ signal }) => getPersonalProfile(signal), retry: false });
}

export function useSavePersonalProfile(userId: string) {
    const client = useQueryClient();
    const queryKey = profileKeys.personal(userId);
    return useMutation({
        mutationFn: (values: ProfileDraftValues) => {
            const original = client.getQueryData<PersonalProfile>(queryKey);
            // The backend ignores null for dates, so clearing would silently keep the old value.
            if (values.section === "personal" && !values.birthDate && original?.dob) {
                throw new ApiError("Ngày sinh đã lưu chỉ có thể thay đổi, chưa thể để trống.", 422, "VALIDATION_FAILED", [{ field: "birthDate", code: "VALIDATION_FAILED", message: "Vui lòng chọn ngày sinh mới thay vì để trống." }]);
            }
            return savePersonalProfile(personalPayload(values, original));
        },
        onSuccess: async profile => {
            client.setQueryData(queryKey, profile);
            await client.invalidateQueries({ queryKey });
        },
        retry: false,
    });
}
