import { DecoratorUtils } from "../../utils/decorator.utils";
import { ComplexityEstimationOptions, ComplexityOptions } from "./complexity";
import { ComplexityTree } from "./complexity.tree";

export class ComplexityUtils {
  static updateComplexityTree(previousComplexity: any, target: any, fields: string[], size: number): ComplexityTree {
    const configuration = ComplexityUtils.getComplexityConfiguration(target);
    const complexityTree: ComplexityTree = previousComplexity?.tree ?? new ComplexityTree();

    if (configuration.parent === undefined) {
      complexityTree.addChildNode(target.name, (configuration.default ?? 1) * size, "root");
    } else {
      complexityTree.updateNodeComplexityWithSize(configuration.target, size);
    }

    for (const [field, estimation] of Object.entries(configuration.estimations ?? {})) {
      if (fields.find((item: any) => item === field)) {
        if (configuration.parent === undefined) {
          // @ts-ignore
          complexityTree.addChildNode(field, estimation.value, target.name, estimation.group);
        } else {
          // @ts-ignore
          complexityTree.addChildNode(field, estimation.value * size, configuration.parent, estimation.group);
        }
      }
    }

    return complexityTree;
  }

  static getComplexityConfiguration(target: any): { [field: string]: number | any } {
    const options = DecoratorUtils.getClassDecorator(ComplexityOptions, target);

    const properties = DecoratorUtils.getPropertyDecorators(ComplexityEstimationOptions, target);

    // TODO: 💪🔥🔥🔥

    console.log({ properties, options });

    return options ?? {};
  }
}