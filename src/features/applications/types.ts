export type Application = {
  id: string;
  jobId: string;
  candidateId: string;
  status: "applied" | "reviewing" | "rejected" | "accepted";
};
