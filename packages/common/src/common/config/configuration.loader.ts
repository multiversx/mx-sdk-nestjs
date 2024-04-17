import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import Ajv from 'ajv';
import fs from 'fs';
import { ConfigurationLoaderSettings } from './configuration.loader.settings';
import { ConfigurationLoadError } from './configuration.load.error';
import { ConfigurationLoaderSchemaType } from './configuration.loader.schema.type';
import { ConfigurationSchemaExpander } from './configuration.loader.schema.expander';
import { OriginLogger } from '../../utils/origin.logger';
import { BaseConfigUtils } from './base.config.utils';

export class ConfigurationLoader {
  private static configuration?: Record<string, any>;

  static getConfiguration<T>(settings: ConfigurationLoaderSettings): T {
    if (!this.configuration) {
      this.configuration = ConfigurationLoader.loadConfiguration(settings);
    }

    return this.configuration as T;
  }

  private static loadConfiguration(settings: ConfigurationLoaderSettings): Record<string, any> {
    const configuration = yaml.load(readFileSync(settings.configPath, 'utf8')) as Record<string, any>;

    this.applyEnvironmentVariables(configuration);

    if (settings.schemaPath) {
      this.validateConfiguration(configuration, settings.schemaPath, settings);
    }

    return configuration;
  }

  private static validateConfiguration(
    configuration: Record<string, any>,
    schemaPath: string,
    settings: Pick<ConfigurationLoaderSettings, 'schemaType' | 'schemaExpand'>,
  ): void {
    const schema = this.readSchema(schemaPath, settings.schemaType);

    if (settings.schemaExpand) {
      ConfigurationSchemaExpander.expand(schema);
    }

    const ajv = new Ajv({ allErrors: true });
    const validate = ajv.compile(schema);

    if (!validate(configuration)) {
      const logger = new OriginLogger(ConfigurationLoader.name);
      logger.error('Validation errors:', validate.errors);
      throw new ConfigurationLoadError(validate.errors ?? []);
    }
  }

  private static readSchema(schemaPath: string, schemaType: ConfigurationLoaderSchemaType): Record<string, any> {
    switch (schemaType) {
      case ConfigurationLoaderSchemaType.json:
        return JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
      case ConfigurationLoaderSchemaType.yaml:
        return yaml.load(fs.readFileSync(schemaPath, 'utf8')) as Record<string, any>;
      default:
        throw new Error(`Unsupported schema type: ${schemaType}`);
    }
  }

  private static applyEnvironmentVariables(obj: any, fullKey: string = ''): void {
    for (const [key, value] of Object.entries(obj)) {
      const newFullKey = fullKey ? `${fullKey}.${key}` : key;

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        this.applyEnvironmentVariables(value, newFullKey);
        continue;
      }

      const keyOverride = BaseConfigUtils.getKeyOverride(newFullKey);
      if (keyOverride !== undefined) {
        obj[key] = keyOverride;
        continue;
      }

      const valueOverride = BaseConfigUtils.getValueOverride(newFullKey, value);
      if (valueOverride !== undefined) {
        obj[key] = valueOverride;
        continue;
      }
    }
  }
}
