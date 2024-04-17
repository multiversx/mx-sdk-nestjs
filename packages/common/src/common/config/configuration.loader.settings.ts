import { ConfigurationLoaderSchemaType } from "./configuration.loader.schema.type";

export class ConfigurationLoaderSettings {
  constructor(init?: Partial<ConfigurationLoaderSettings>) {
    Object.assign(this, init);
  }

  configPath: string = '';

  schemaPath?: string;
  schemaType: ConfigurationLoaderSchemaType = ConfigurationLoaderSchemaType.yaml;
  schemaExpand: boolean = true;
}
