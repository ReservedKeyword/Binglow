import type { AppLogger } from "@binglow/logger";
import { RedisClient } from "@binglow/redis";

export interface HeartbeatManagerOptions {
  intervalMilliseconds?: number | undefined;
  keyPrefix?: string | undefined;
  logger: AppLogger;
  redisClient: RedisClient;
  serviceName: string;
}

export interface HeartbeatPayload {
  isoTimestamp: string;
  processId: number;
  serviceName: string;
}

export class HeartbeatManager {
  private static readonly DEFAULT_KEY_PREFIX = "service-health";
  private static readonly DEFAULT_INTERVAL_MILLISECONDS = 30 * 1000;

  private readonly intervalMilliseconds: number;
  private readonly keyPrefix: string;
  private readonly logger: AppLogger;
  private readonly redisClient: RedisClient;
  private readonly serviceName: string;

  private isRegistered = false;
  private pingTimer: NodeJS.Timeout | null = null;

  constructor({ intervalMilliseconds, keyPrefix, logger, redisClient, serviceName }: HeartbeatManagerOptions) {
    this.intervalMilliseconds = intervalMilliseconds ?? HeartbeatManager.DEFAULT_INTERVAL_MILLISECONDS;
    this.keyPrefix = keyPrefix ?? HeartbeatManager.DEFAULT_KEY_PREFIX;
    this.logger = logger.getSubLogger({ name: "HeartbeatManager" });
    this.redisClient = redisClient;
    this.serviceName = serviceName;

    this.logger.info(
      `Created for service ${this.serviceName} with an interval of ${this.intervalMilliseconds / 1000}s.`
    );
  }

  private async sendHeartbeat(): Promise<void> {
    if (!this.isRegistered) {
      this.logger.warn("Attempted to send heartbeat, but service not registered or stopped.");
      return;
    }

    const key = `${this.keyPrefix}:${this.serviceName}`;

    const payload = {
      isoTimestamp: new Date().toISOString(),
      processId: process.pid,
      serviceName: this.serviceName
    } as HeartbeatPayload;

    try {
      const commandClient = this.redisClient.getCommandClient();

      await commandClient.set(key, JSON.stringify(payload), {
        expiration: {
          type: "EX",
          value: Math.ceil((this.intervalMilliseconds * 2) / 1000)
        }
      });

      this.logger.debug(`Sent heartbeat to Redis for ${this.serviceName}.`);
    } catch (err) {
      this.logger.error(`Failed to send heartbeat for ${this.serviceName}.`, err);
    }
  }

  start(): void {
    if (this.pingTimer) {
      this.logger.warn("Heartbeart cycle is already running.");
      return;
    }

    this.isRegistered = true;
    this.logger.info("Starting heartbeat cycle...");
    this.sendHeartbeat();
    this.pingTimer = setInterval(() => this.sendHeartbeat(), this.intervalMilliseconds);
  }

  stop(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.isRegistered = false;
      this.pingTimer = null;
      this.logger.info("Heartbeat cycle stopped.");
    }
  }
}
