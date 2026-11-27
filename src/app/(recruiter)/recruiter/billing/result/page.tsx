import { PaymentResultPage } from '@/features/recruiter-services';

export const metadata = { title: 'Kết quả thanh toán | TalentAI' };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const params = await searchParams;
    const value = (key: string) => typeof params[key] === 'string' ? params[key] : undefined;
    return <PaymentResultPage orderId={value('orderId')} checkout={value('checkout')} result={value('result')} />;
}
