import "reflect-metadata";
import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';

require("dotenv").config();

export interface ConfigurationOptions {
  yaml: string | string[]
  // TODO add support for JSON files
}

export interface ConfigurationValueOptions<T> {
  yaml?: string,
  env?: string,
  defaultValue?: T;
  mapper?: (rawValue: any) => T
}

class Configuration {
  private static yamlConfigurationRecords: Record<string, any>;

  constructor(readonly options: ConfigurationOptions) {
    Configuration.yamlConfigurationRecords = this.initializeYamlConfig(options.yaml);
  }

  private initializeYamlConfig(yamlPaths: string | string[]) {
    yamlPaths = [...new Set([yamlPaths].flat())]; // convert string to string[]

    let yamlConfig: Record<string, any> = {};
    for (const yamlPath of yamlPaths) {
      const configFile = readFileSync(yamlPath, 'utf8');
      const config = yaml.load(configFile) as Record<string, any>;

      yamlConfig = this.mergeJSONs(yamlConfig, config);
    }

    return yamlConfig;
  }

  private mergeJSONs(json1: any, json2: any): any {
    for (const key in json2) {
      if (json1[key] !== undefined) {
        json1[key] = this.mergeJSONs(json1[key], json2[key]);
      } else {
        json1[key] = json2[key];
      }
    }
    return json1;
  }

  static Value<T>(options: ConfigurationValueOptions<T>): PropertyDecorator {
    let value: T | undefined;

    const initialize = () => {
      let configValue: T | undefined;

      if (options.env) {
        configValue = process.env[options.env] as T | undefined;
      }

      if (options.yaml) {
        configValue = options.yaml
          .split('.')
          .reduce((value: any, field: string) => value ? value[field] : undefined, Configuration.yamlConfigurationRecords);
      }

      value = configValue ?? options?.defaultValue;

      if (value === undefined) {
        throw new Error(`No config with key '${options.env ?? options.yaml ?? ''}' is present!`);
      }

      if (options?.mapper) {
        value = options.mapper(value);
      }
    };

    return (target: any, key): void => {
      Reflect.deleteProperty(target, key);
      Reflect.defineProperty(target, key, {
        get: () => {
          if (value === undefined) {
            initialize();
          }

          return value;
        },
        set: () => value,
        enumerable: true,
        configurable: true,
      });
    };
  }
}

export { Configuration };
