export const interviewKeys = { all: ['recruiter-interviews'] as const, detail: (id: string) => ['recruiter-interviews', 'detail', id] as const };
