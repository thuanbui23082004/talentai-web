import { defineConfig } from '@playwright/test';
import config from './playwright.config';

const webServer = Array.isArray(config.webServer)
  ? config.webServer.map((server) => ({ ...server, timeout: 300_000 }))
  : config.webServer
    ? { ...config.webServer, timeout: 300_000 }
    : undefined;

export default defineConfig({ ...config, webServer });
