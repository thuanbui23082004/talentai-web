export type Session = {
  userId: string;
  role: "candidate" | "recruiter" | "admin";
  token?: string;
};

export async function getSession(): Promise<Session | null> {
  return null;
}
