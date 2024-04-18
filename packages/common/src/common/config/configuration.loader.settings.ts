import { ConfigurationLoaderSchemaType } from "./configuration.loader.schema.type";

export class ConfigurationLoaderSettings {
  constructor(init?: Partial<ConfigurationLoaderSettings>) {
    Object.assign(this, init);
  }

  configPath: string = '';
  applyEnvOverrides: boolean = true;

  schemaPath?: string;
  schemaType: ConfigurationLoaderSchemaType = ConfigurationLoaderSchemaType.yaml;
  schemaExpand: boolean = true;
}
