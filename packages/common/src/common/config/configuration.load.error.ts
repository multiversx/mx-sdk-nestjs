export class ConfigurationLoadError extends Error {
  constructor(readonly errors: any[]) {
    const message = ConfigurationLoadError.getConsolidatedErrorMessage(errors);

    super(message);
  }

  private static getConsolidatedErrorMessage(errors: any[]) {
    return errors.map((error) => ConfigurationLoadError.getErrorMessage(error)).join('\n');
  }

  private static getErrorMessage(error: any) {
    const paramsString = Object.entries(error.params).map(([key, value]) => `${key}:${value}`).join(',');

    return `${error.keyword} error on path ${error.instancePath}: ${error.message} (${paramsString})`;
  }
}
