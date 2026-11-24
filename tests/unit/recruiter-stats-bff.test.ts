import { expect, it } from 'vitest';
import { handleBffRequest } from '@/server/bff/handler';
import { NextRequest } from 'next/server';

it('requires a session for recruiter statistics through the BFF', async () => {
  const response = await handleBffRequest(new Request('http://localhost:8080/api/bff/recruiter/stats/overview'));
  expect(response.status).toBe(401);
});

it('accepts a NextRequest from the route runtime', async () => {
  const response = await handleBffRequest(new NextRequest('http://localhost:8080/api/bff/recruiter/stats/overview'));
  expect(response.status).toBe(401);
});
