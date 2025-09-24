import { type GameId } from "@binglow/game-service/schemas/game";

export class BotState {
  private readonly activeGames: Map<string, GameId> = new Map();

  public findChannelByGameId(gameId: GameId): string | null {
    for (const [channelName, currentId] of this.activeGames.entries()) {
      if (currentId === gameId) {
        return channelName;
      }
    }

    return null;
  }

  public getActiveGame(channel: string): GameId | undefined {
    return this.activeGames.get(channel);
  }

  public removeActiveGame(channel: string): void {
    this.activeGames.delete(channel);
  }

  public setActiveGame(channel: string, gameId: GameId): void {
    this.activeGames.set(channel, gameId);
  }
}
