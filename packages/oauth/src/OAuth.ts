import type { AppLogger } from "@binglow/logger";
import type { SecretStore } from "@binglow/secret-store/SecretStore";
import { OAuthError } from "./OAuthError";

export interface ExchangeCodeForTokensOptions {
  code: string;
  redirectUri: string;
}

export interface GetAuthorizationUrlOptions {
  redirectUri: string;
  scopes?: string[] | undefined;
}

export interface OAuthOptions {
  clientId: string;
  clientSecret: string;
  keyPrefix?: string | undefined;
  logger?: AppLogger | undefined;
  secretStore: SecretStore;
}

export interface TokenData {
  accessToken: string;
  expiresAt: number;
  refreshToken: string;
}

export abstract class OAuth<ResponseType extends object> {
  private readonly baseLogger?: AppLogger | undefined;
  protected readonly clientId: string;
  protected readonly clientSecret: string;
  private readonly keyPrefix?: string | undefined;
  private readonly secretStore: SecretStore;

  constructor({ clientId, clientSecret, keyPrefix, logger, secretStore }: OAuthOptions) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.keyPrefix = keyPrefix;
    this.baseLogger = logger?.getSubLogger({ name: "OAuth" });
    this.secretStore = secretStore;
  }

  async exchangeCodeForTokens(options: ExchangeCodeForTokensOptions): Promise<void> {
    this.baseLogger?.debug("exchangeCodeForTokens: ", options);
    const providerResponse = await this.fetchTokensWithCode(options);
    const tokenData = this.transformResponseToToken(providerResponse);
    await this.setTokenData(tokenData);
    this.baseLogger?.info("Successfully exchanged code for tokens and stored them.");
  }

  protected abstract fetchTokensWithCode(options: ExchangeCodeForTokensOptions): Promise<ResponseType>;

  protected abstract fetchTokensWithRefreshToken(refreshToken: string): Promise<ResponseType>;

  async getAccessToken(): Promise<string> {
    const tokenData = await this.getTokenData();

    if (!tokenData) {
      throw new OAuthError("Authentication required. No token data found in secret store.");
    }

    if (Date.now() >= tokenData.expiresAt - 60 * 1000) {
      this.baseLogger?.info("Access token expired or nearing expiration. Attempting a refresh...");
      const providerResponse = await this.fetchTokensWithRefreshToken(tokenData.refreshToken);
      const newTokenData = this.transformResponseToToken(providerResponse);
      await this.setTokenData(newTokenData);
      this.baseLogger?.info("Successfully refreshed and stored new tokens, returning new access token...");
      return newTokenData.accessToken;
    }

    return tokenData.accessToken;
  }

  abstract getAuthorizationUrl(options: GetAuthorizationUrlOptions): string;

  protected getBaseLogger(): AppLogger | undefined {
    return this.baseLogger;
  }

  protected getSecretStoreKeys(): Record<keyof TokenData, string> {
    const secretStorePrefix = this.keyPrefix ? `${this.keyPrefix}:` : "";

    return {
      accessToken: `${secretStorePrefix}oauth:accessToken`,
      expiresAt: `${secretStorePrefix}oauth:expiresAt`,
      refreshToken: `${secretStorePrefix}oauth:refreshToken`
    };
  }

  protected async getTokenData(): Promise<TokenData | null> {
    const {
      accessToken: accessTokenKey,
      expiresAt: expiresAtKey,
      refreshToken: refreshTokenKey
    } = this.getSecretStoreKeys();

    const [accessToken, expiresAtStr, refreshToken] = await Promise.all([
      this.secretStore.getSecret(accessTokenKey),
      this.secretStore.getSecret(expiresAtKey),
      this.secretStore.getSecret(refreshTokenKey)
    ]);

    if (!accessToken || !expiresAtStr || !refreshToken) {
      this.baseLogger?.warn("Access token, expires at, or refresh token not defined, returning null...");
      return null;
    }

    return {
      accessToken,
      expiresAt: parseInt(expiresAtStr),
      refreshToken
    };
  }

  protected abstract transformResponseToToken(response: ResponseType): TokenData;

  protected async setTokenData({ accessToken, expiresAt, refreshToken }: TokenData): Promise<void> {
    const {
      accessToken: accessTokenKey,
      expiresAt: expiresAtKey,
      refreshToken: refreshTokenKey
    } = this.getSecretStoreKeys();

    await Promise.all([
      this.secretStore.setSecret(accessTokenKey, accessToken),
      this.secretStore.setSecret(expiresAtKey, expiresAt.toString()),
      this.secretStore.setSecret(refreshTokenKey, refreshToken)
    ]);
  }
}
