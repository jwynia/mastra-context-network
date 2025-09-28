import { defineConfig } from '@mastra/core';

export default defineConfig({
  // Server configuration
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    middleware: [
      // Add your custom middleware here
    ],
    cors: {
      origin: true, // Configure according to your needs
      credentials: true,
    },
    // Optional: Rate limiting
    rateLimit: {
      windowMs: 60 * 1000, // 1 minute
      max: process.env.RATE_LIMIT_REQUESTS_PER_MINUTE ?
        parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE) : 100,
    },
    // Optional: API documentation
    swagger: {
      enabled: process.env.NODE_ENV === 'development',
      path: '/docs',
    },
  },

  // Bundler configuration
  bundler: {
    sourcemap: process.env.NODE_ENV === 'development',
    minify: process.env.NODE_ENV === 'production',
  },

  // Telemetry configuration (optional)
  telemetry: {
    enabled: process.env.TELEMETRY_ENABLED === 'true',
    serviceName: 'mastra-app',
    // Configure OTEL exporter if needed
    ...(process.env.OTEL_EXPORTER_OTLP_ENDPOINT && {
      otlp: {
        endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
      },
    }),
  },

  // Development configuration
  dev: {
    watch: true,
    hotReload: true,
    logLevel: (process.env.LOG_LEVEL as any) || 'info',
  },
});