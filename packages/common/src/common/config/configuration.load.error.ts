export class ConfigurationLoadError extends Error {
  constructor(readonly errors: any[]) {
    super();
  }
}
