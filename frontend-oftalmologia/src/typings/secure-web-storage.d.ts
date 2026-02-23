declare module "secure-web-storage" {
  export default class SecureStorage {
    constructor(
      storage: Storage,
      options: {
        hash: (key: string) => string;
        encrypt: (data: string) => string;
        decrypt: (data: string) => string;
      }
    );

    setItem(key: string, value: string): void;
    getItem(key: string): string;
    removeItem(key: string): void;
    clear(): void;
  }
}
