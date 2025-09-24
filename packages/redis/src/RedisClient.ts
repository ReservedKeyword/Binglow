import type { AppLogger, Loggable } from "@binglow/logger";
import { createClient as createRedisClient } from "redis";
import type { PubSub } from "./schemas";

interface RedisClientOptions extends Loggable {
  url?: string | undefined;
}

type CreateClientOptions = Pick<RedisClientOptions, "url"> & { type: CreateClientType };

type CreateClientType = "command" | "subscriber";

export type CommandUnionForChannel<Channel extends PubSub["channel"]> = Extract<
  PubSub,
  { channel: Channel }
>["command"];

export type GetCommandPayload<
  Channel extends PubSub["channel"],
  Command extends CommandUnionForChannel<Channel>["command"]
> = Extract<CommandUnionForChannel<Channel>, { command: Command }>["payload"];

export class RedisClient {
  private readonly commandClient;
  private readonly logger?: AppLogger | undefined;
  private readonly subscriberClient;

  constructor({ logger, url }: RedisClientOptions) {
    this.logger = logger?.getSubLogger({ name: "RedisClient" });
    this.commandClient = this.createClient({ type: "command", url });
    this.subscriberClient = this.createClient({ type: "subscriber", url });
  }

  private createClient({ type, url }: CreateClientOptions) {
    const redisClient = url ? createRedisClient({ url }) : createRedisClient();

    redisClient.on("error", (err) => {
      this.logger?.error(`Redis failed to connect to ${url}.`, err);
    });

    if (!redisClient.isOpen) {
      this.logger?.info(`Connecting to Redis as ${type} client...`);
      redisClient.connect().then(() => this.logger?.info(`Connected to Redis as ${type} client!`));
    }

    return redisClient;
  }

  getCommandClient() {
    return this.commandClient;
  }

  async killClients(): Promise<void> {
    await this.commandClient.quit();
    await this.subscriberClient.quit();
  }

  async publishCommand(data: PubSub) {
    const { channel, command } = data;
    await this.commandClient.publish(channel, JSON.stringify(command));
  }

  async subscribeCommand<Channel extends PubSub["channel"], Command extends CommandUnionForChannel<Channel>["command"]>(
    channel: Channel,
    command: Command,
    // @ts-ignore
    callback: (payload: GetCommandPayload<Channel, Command>) => void | Promise<void>
  ) {
    this.logger?.info(`Subscribing to ${channel}:${command}...`);

    this.subscriberClient.subscribe(channel, async (message) => {
      try {
        const { command: parsedCommand, payload: parsedPayload } = JSON.parse(message);

        if (command === parsedCommand) {
          await callback(parsedPayload);
        }
      } catch (err) {
        this.logger?.error("Failed to process incoming command from Redis.", err);
      }
    });
  }
}
