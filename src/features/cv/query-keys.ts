export const cvKeys = {
    all: (userId: string) => ["candidate-cvs", userId] as const,
    list: (userId: string) => [...cvKeys.all(userId), "list"] as const,
    detail: (userId: string, id: string) => [...cvKeys.all(userId), "detail", id] as const,
};
