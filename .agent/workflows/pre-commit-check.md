# Workflow: Pre-commit Check

Trước khi commit code, đảm bảo vượt qua các kiểm tra sau:
1. `npm run lint`
2. `npm run typecheck`
3. `npm run test`
4. `npm run test:e2e` (nếu có cập nhật E2E test)
