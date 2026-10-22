export const recruiterJobKeys = {
  all: ['recruiter-jobs'] as const,
  lists: () => [...recruiterJobKeys.all, 'list'] as const,
  detail: (id: string) => [...recruiterJobKeys.all, 'detail', id] as const,
  options: () => [...recruiterJobKeys.all, 'options'] as const,
};
