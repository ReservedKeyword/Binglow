export interface SecretStore {
  getSecret(key: string): Promise<string | null | undefined>;

  setSecret(key: string, value: string): Promise<void>;
}
