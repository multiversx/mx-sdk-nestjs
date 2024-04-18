export class ConfigurationLoaderError extends Error {
  constructor(readonly errors: any[]) {
    const message = ConfigurationLoaderError.getConsolidatedErrorMessage(errors);

    super(message);
  }

  private static getConsolidatedErrorMessage(errors: any[]) {
    return errors.map((error) => ConfigurationLoaderError.getErrorMessage(error)).join('\n');
  }

  private static getErrorMessage(error: any) {
    const paramsString = Object.entries(error.params).map(([key, value]) => `${key}:${value}`).join(',');

    return `${error.keyword} error on path ${error.instancePath}: ${error.message} (${paramsString})`;
  }
}
