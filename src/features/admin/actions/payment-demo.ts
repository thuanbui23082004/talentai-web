'use server';

import { readPaymentDemo, reconcilePaymentDemo } from '@/server/bff/admin-payments-demo';

// Next.js enforces same-origin action requests; the BFF bridge checks the admin session on every call.
export async function readPaymentDemoAction() { return readPaymentDemo(); }
export async function reconcilePaymentDemoAction(input: unknown) { return reconcilePaymentDemo(input); }
