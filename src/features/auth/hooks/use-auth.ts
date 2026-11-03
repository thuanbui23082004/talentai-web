"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login, logout, register, socialLogin } from "../services/auth";
import { authKeys } from "../query-keys";

export function useLogin() {
    const client = useQueryClient();
    return useMutation({
        mutationFn: login,
        onSuccess: async (session) => {
            await client.cancelQueries();
            client.clear();
            client.setQueryData(authKeys.me, session.user);
            // A full navigation discards prior identity's RSC/browser query caches.
            window.location.replace(`/${session.user.role}/dashboard`);
        },
    });
}

export function useRegister() {
    const client = useQueryClient();
    return useMutation({
        mutationFn: register,
        onSuccess: async (session) => {
            await client.cancelQueries();
            client.clear();
            client.setQueryData(authKeys.me, session.user);
            window.location.replace("/?registered=1");
        },
    });
}

export function useSocialLogin() {
    const client = useQueryClient();
    return useMutation({
        mutationFn: socialLogin,
        retry: false,
        onSuccess: async (session) => {
            await client.cancelQueries();
            client.clear();
            client.setQueryData(authKeys.me, session.user);
            window.location.replace(`/${session.user.role}/dashboard`);
        },
    });
}

export function useLogout() {
    const client = useQueryClient();
    return useMutation({
        mutationFn: logout,
        onSuccess: async () => {
            await client.cancelQueries();
            client.clear();
            window.location.replace("/login?reason=logged-out");
        },
    });
}
