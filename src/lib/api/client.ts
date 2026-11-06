import createClient from "openapi-fetch";
import type { paths } from "./generated/schema";
import { sessionFetch } from './session-fetch';

export const apiClient = createClient<paths>({
  baseUrl: "/api/bff",
  fetch: sessionFetch.fetch,
});
