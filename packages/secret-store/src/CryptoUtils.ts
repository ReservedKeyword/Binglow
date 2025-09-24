import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export interface CryptoOptions {
  encryptionKey: string;
}

export interface EncryptedHash {
  content: string;
  initializationVector: string;
}

export class CryptoUtils {
  private static readonly ENCRYPTION_ALGORITHM = "aes-256-cbc";

  static decryptString({ content, initializationVector }: EncryptedHash, { encryptionKey }: CryptoOptions): string {
    const decipher = createDecipheriv(
      CryptoUtils.ENCRYPTION_ALGORITHM,
      CryptoUtils.getKeyBuffer(encryptionKey),
      Buffer.from(initializationVector, "hex")
    );

    let decrypted = decipher.update(content, "hex", "utf-8");
    decrypted += decipher.final("utf-8");
    return decrypted;
  }

  static encryptString(textToEncrypt: string, { encryptionKey }: CryptoOptions): EncryptedHash {
    const initializationVector = randomBytes(16);
    const cipher = createCipheriv(
      CryptoUtils.ENCRYPTION_ALGORITHM,
      CryptoUtils.getKeyBuffer(encryptionKey),
      initializationVector
    );

    let encrypted = cipher.update(textToEncrypt, "utf-8", "hex");
    encrypted += cipher.final("hex");

    return {
      content: encrypted,
      initializationVector: initializationVector.toString("hex")
    };
  }

  private static getKeyBuffer(key: string): Buffer {
    return Buffer.from(key);
  }
}
