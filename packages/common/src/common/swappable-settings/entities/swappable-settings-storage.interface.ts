export interface SwappableSettingsStorageInterface {
  set: (key: string, value: string, redisEx?: string, redisTtl?: number) => Promise<void>,
  get: (key: string) => Promise<string>,
  delete: (key: string) => Promise<void>
}
