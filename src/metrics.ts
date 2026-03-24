// prometheus stats

import {
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
  Registry,
} from "prom-client";

// registry to hold metrics + defaults
export const registry = new Registry();
collectDefaultMetrics({ register: registry });

export const CommandErrorCount = new Counter({
  name: "command_error_count",
  help: "Total number of command errored",
  labelNames: ["command"],
  registers: [registry],
});

export const CommandDuration = new Histogram({
  name: "command_duration_seconds",
  help: "Duration of command execution in seconds",
  labelNames: ["command"],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [registry],
});

export const ServerCount = new Gauge({
  name: "server_count",
  help: "Number of servers the bot is in",
  registers: [registry],
});

export const HandlerTime = new Histogram({
  name: "handler_time_seconds",
  help: "Duration of /ralsei (reddit,twitter,bsky) handler execution in seconds",
  labelNames: ["handler"],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 20],
  registers: [registry],
});

export const RadioUsers = new Gauge({
  name: "radio_users",
  help: "Number of users currently listening to the radio",
  registers: [registry],
});

// if PROMETHEUS_ENABLED=true, serve metrics
// ion think there's any clean way to prevent stats from being collected
// in the first place without messy stuff so whatever just dont serve if not needed
export function serveMetrics() {
  const PROMETHEUS_PORT = Bun.env.PROMETHEUS_PORT || 9091;
  const PROMETHEUS_LISTEN = Bun.env.PROMETHEUS_LISTEN || "127.0.0.1";
  const serve = Bun.serve({
    port: PROMETHEUS_PORT, // wouldnt recommend serving to public btw
    hostname: PROMETHEUS_LISTEN,
    fetch: async (request) => {
      if (request.url.endsWith("/metrics")) {
        const metrics = await registry.metrics();
        return new Response(metrics, {
          headers: { "Content-Type": registry.contentType },
        });
      }
      return new Response("Not Found", { status: 404 });
    },
  });
  console.log(`📊 Prometheus Metrics running on ${serve.url}/metrics`);
}
