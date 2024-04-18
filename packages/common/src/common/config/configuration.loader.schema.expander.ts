export class ConfigurationSchemaExpander {
  static expand(input: any) {
    input['$schema'] = 'http://json-schema.org/draft-07/schema#';

    this.setTypeForPrimitives(input);
    this.setObjectsAsProperties(input);
    this.manageRequiredFields(input);
    this.setAdditionalPropertiesFalse(input);

    return input;
  }

  private static setTypeForPrimitives(input: any) {
    const primitiveTypes = ["string", "boolean", "integer", "number", "array", "object"];

    for (const key of Object.keys(input)) {
      if (primitiveTypes.includes(input[key]) && key !== 'type') {
        input[key] = { type: input[key] };
      } else if (typeof input[key] === 'object' && input[key] !== null && !Array.isArray(input[key])) {
        this.setTypeForPrimitives(input[key]);
      }
    }
  }

  private static setObjectsAsProperties(input: any) {
    if (input != null && typeof input === 'object' && !Array.isArray(input) && !input.type && !input.properties) {
      const properties: Record<string, any> = {};

      for (const key of Object.keys(input)) {
        if (key !== "$schema" && key !== "title") {
          properties[key] = input[key];
          delete input[key];
        }
      }

      input.type = 'object';
      input.properties = properties;
    }

    if (input.properties) {
      for (const key of Object.keys(input.properties)) {
        this.setObjectsAsProperties(input.properties[key]); // Recurse into properties
      }
    }
  }

  private static manageRequiredFields(input: any) {
    if (input.properties) {
      const required: string[] = [];

      for (const key in input.properties) {
        const prop = input.properties[key];

        if (!(prop.required === false)) {
          required.push(key);
        }

        delete prop.required; // Clean up required property regardless
        this.manageRequiredFields(input.properties[key]); // Recurse into properties
      }

      if (required.length > 0) {
        input.required = required;
      }
    }
  }

  private static setAdditionalPropertiesFalse(input: any) {
    if (input.type === "object") {
      if (input.additionalProperties !== true) {
        input.additionalProperties = false;
      }

      if (input.properties) {
        for (const key of Object.keys(input.properties)) {
          this.setAdditionalPropertiesFalse(input.properties[key]); // Recurse into nested properties
        }
      }
    }
  }
}
