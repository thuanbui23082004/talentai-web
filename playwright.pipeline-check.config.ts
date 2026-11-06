import config from './playwright.config';
import { defineConfig } from '@playwright/test';
export default defineConfig({ ...config, webServer: { ...(Array.isArray(config.webServer) ? config.webServer[0] : config.webServer), timeout: 300000 } });