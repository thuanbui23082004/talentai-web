import { PaymentHistoryPage } from '@/features/recruiter-services';
import { subscriptionOrderStateSchema } from '@/lib/api/subscription-schemas';

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const status = subscriptionOrderStateSchema.safeParse(params.status);
  return <PaymentHistoryPage page={Number.isInteger(page) && page > 0 && page <= 100000 ? page : 1} status={status.success ? status.data : undefined} />;
}
