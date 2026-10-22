import type { components, operations } from "@/lib/api/generated/schema";

export type Notification = components["schemas"]["Notification"];
export type NotificationFilters = NonNullable<operations["listNotifications"]["parameters"]["query"]>;
