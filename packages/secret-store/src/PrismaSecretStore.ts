import type { PrismaClient } from "@binglow/prisma/client";
import { CryptoUtils } from "./CryptoUtils";
import type { SecretStore } from "./SecretStore";
import { SecretStoreError } from "./SecretStoreError";

export interface PrismaSecretStoreOptions {
  encryptionKey: string;
  prismaClient: PrismaClient;
}

export class PrismaSecretStore implements SecretStore {
  private readonly encryptionKey: string;
  private readonly prismaClient: PrismaClient;

  constructor({ encryptionKey, prismaClient }: PrismaSecretStoreOptions) {
    this.encryptionKey = encryptionKey;
    this.prismaClient = prismaClient;
  }

  async getSecret(key: string): Promise<string> {
    const secretData = await this.prismaClient.secretStore.findUnique({ where: { key } });

    if (!secretData) {
      throw new SecretStoreError(`Secret value from key ${key} could not be found.`);
    }

    return CryptoUtils.decryptString(
      { content: secretData.value, initializationVector: secretData.iv },
      { encryptionKey: this.encryptionKey }
    );
  }

  async setSecret(key: string, plainTextValue: string): Promise<void> {
    const { content, initializationVector } = CryptoUtils.encryptString(plainTextValue, {
      encryptionKey: this.encryptionKey
    });

    await this.prismaClient.secretStore.upsert({
      create: {
        key,
        iv: initializationVector,
        value: content
      },
      update: {
        iv: initializationVector,
        value: content
      },
      where: {
        key
      }
    });
  }
}
