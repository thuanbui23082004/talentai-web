export type AuthUser = {
  id: string;
  email: string;
  role: "candidate" | "recruiter" | "admin";
};
