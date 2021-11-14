export class StorageMock implements Storage {
  public length = 0;
  public clear(): void { return; }
  public getItem(key: string): string { return ""; }
  public key(index: number): string { return ""; }
  public removeItem(key: string): void { return; }
  public setItem(key: string, value: string): void { return; }
}