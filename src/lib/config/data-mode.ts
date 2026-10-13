export type DataMode = "mock" | "real";

export const DATA_MODE: DataMode =
  (process.env.DATA_MODE as DataMode) || "mock";

export const isMockMode = (): boolean => DATA_MODE === "mock";
export const isRealMode = (): boolean => DATA_MODE === "real";
