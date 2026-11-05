export const profileKeys = {
    career: (userId: string) => ["candidate-career-profile", userId] as const,
    personal: (userId: string) => ["candidate-personal-profile", userId] as const,
};
