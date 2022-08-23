import { DecoratorUtils } from "../../utils/decorator.utils";
import { ComplexityEstimationOptions } from "./complexity.estimation";
import { ComplexityTree } from "./complexity.tree";

export class ComplexityUtils {
  static updateComplexityTree(previousComplexity: any, target: any, fields: string[], size: number): ComplexityTree {
    const configuration = ComplexityUtils.getComplexityConfiguration(target);
    const complexityTree: ComplexityTree = previousComplexity?.tree ?? new ComplexityTree();

    complexityTree.addChildNode(target.name, (configuration.default ?? 1) * size, "root");

    for (const [field, estimation] of Object.entries(configuration.estimations ?? {})) {
      if (fields.find((item: any) => item === field)) {
        // @ts-ignore
        complexityTree.addChildNode(field, estimation.value, target.name, estimation.group);
      }
    }

    return complexityTree;
  }

  static getComplexityConfiguration(target: any): { [field: string]: number | any } {
    let configuration: {[key: string]: any} = {
      estimations: {
      }
    };

    const propertyConfiguration = DecoratorUtils.getPropertyDecorators(ComplexityEstimationOptions, target);
    if (propertyConfiguration) {
      for (const [field, estimation] of Object.entries(propertyConfiguration)) {
        configuration.estimations[field] = estimation;

        for (const alternative of estimation.alternatives ?? []) {
          configuration.estimations[alternative] = estimation;
        }
      }
    }

    return configuration;
  }
}
