import {
  OAuth,
  type ExchangeCodeForTokensOptions,
  type GetAuthorizationUrlOptions,
  type OAuthOptions,
  type TokenData
} from "./OAuth";
import { OAuthError } from "./OAuthError";

export interface TwitchTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
}

const isTwitchTokenResponse = (obj: unknown): obj is TwitchTokenResponse =>
  typeof (obj as TwitchTokenResponse).access_token !== "undefined" &&
  typeof (obj as TwitchTokenResponse).expires_in !== "undefined" &&
  typeof (obj as TwitchTokenResponse).refresh_token !== "undefined";

export class TwitchOAuthClient extends OAuth<TwitchTokenResponse> {
  private static readonly BASE_URL = "https://id.twitch.tv/oauth2";

  constructor(options: OAuthOptions) {
    super(options);
  }

  protected override fetchTokensWithCode({
    code,
    redirectUri
  }: ExchangeCodeForTokensOptions): Promise<TwitchTokenResponse> {
    return this.makeRequest({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri
    });
  }

  protected override fetchTokensWithRefreshToken(refreshToken: string): Promise<TwitchTokenResponse> {
    return this.makeRequest({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken
    });
  }

  override getAuthorizationUrl({ redirectUri, scopes }: GetAuthorizationUrlOptions): string {
    const url = new URL(`${TwitchOAuthClient.BASE_URL}/authorize`);
    const { searchParams } = url;

    searchParams.append("client_id", this.clientId);
    searchParams.append("redirect_uri", redirectUri);
    searchParams.append("response_type", "code");

    if (scopes) {
      searchParams.append("scope", scopes.join(" "));
    }

    return url.toString();
  }

  private async makeRequest(bodyParams: Record<string, string>): Promise<TwitchTokenResponse> {
    const response = await fetch(`${TwitchOAuthClient.BASE_URL}/token`, {
      body: new URLSearchParams(bodyParams),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      method: "POST"
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new OAuthError(`Request to Twitch OAuth failed: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const jsonResponse = await response.json();

    if (!isTwitchTokenResponse(jsonResponse)) {
      throw new OAuthError("Response does not conform to TwitchTokenResponse type: ", jsonResponse);
    }

    return jsonResponse;
  }

  protected override transformResponseToToken({
    access_token: accessToken,
    expires_in: expiresIn,
    refresh_token: refreshToken
  }: TwitchTokenResponse): TokenData {
    return {
      accessToken,
      expiresAt: Date.now() + expiresIn * 1000,
      refreshToken
    };
  }
}
