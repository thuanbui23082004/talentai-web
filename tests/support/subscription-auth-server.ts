import { createServer } from 'node:http';

// Test-only upstream, never imported by production code. The subscription suite
// exercises the actual BFF cookies/session/CSRF without consuming gateway limits.
export async function startSubscriptionAuthServer() {
    let email = 'checkout@example.test';
    const access = 'subscription-e2e-access';
    const user = () => ({ id: '00000000-0000-4000-8000-000000097001', email, displayName: 'Nhà tuyển dụng kiểm thử thanh toán', status: 'ACTIVE', roles: ['RECRUITER'], createdAt: '2026-11-27T00:00:00Z' });
    const tokens = { accessToken: access, refreshToken: 'subscription-e2e-refresh', tokenType: 'Bearer', expiresInSeconds: 3600 };
    const server = createServer(async (request, response) => {
        response.setHeader('Content-Type', 'application/json');
        const send = (status: number, value: unknown) => { response.statusCode = status; response.end(JSON.stringify(value)); };
        if (request.url === '/api/v1/auth/register' && request.method === 'POST') {
            const chunks: Buffer[] = [];
            for await (const chunk of request) chunks.push(Buffer.from(chunk));
            const body: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            if (typeof body === 'object' && body && 'email' in body && typeof body.email === 'string') email = body.email;
            return send(201, { success: true, data: { user: user(), tokens } });
        }
        if (request.url === '/api/v1/auth/me') return request.headers.authorization === `Bearer ${access}` ? send(200, { success: true, data: { profile: user() } }) : send(401, { error: { code: 'UNAUTHENTICATED' } });
        if (request.url === '/api/v1/auth/refresh') return send(200, { success: true, data: { tokens } });
        send(404, { error: { code: 'NOT_FOUND' } });
    });
    await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(3388, '127.0.0.1', resolve); });
    return async () => { await new Promise<void>((resolve, reject) => { server.close(error => error ? reject(error) : resolve()); server.closeAllConnections(); }); };
}
