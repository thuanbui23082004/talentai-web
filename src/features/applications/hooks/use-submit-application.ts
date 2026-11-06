import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitApplication } from "../services/applications";
import { applicationKeys } from "../query-keys";

export function useSubmitApplication() {
    const client = useQueryClient();
    return useMutation({ mutationFn: submitApplication, retry: false, onSuccess: () => {
        void client.invalidateQueries({ queryKey: applicationKeys.all });
    } });
}
