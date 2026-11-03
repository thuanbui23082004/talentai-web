"use client";

import { useMutation } from "@tanstack/react-query";
import { forgotPassword, resetPassword } from "../services/auth";

export function useForgotPassword() {
    return useMutation({ mutationFn: forgotPassword, retry: false });
}

export function useResetPassword() {
    return useMutation({ mutationFn: resetPassword, retry: false });
}
