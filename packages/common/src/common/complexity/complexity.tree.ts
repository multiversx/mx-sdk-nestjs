import { ComplexityNode } from "./complexity.node";
import { ParentNodeNotFoundException } from "./exceptions/parent.node.not.found.exception";

import * as uuid from "uuid";

export class ComplexityTree {
  root: ComplexityNode;

  constructor() {
    this.root = new ComplexityNode("root", 1, uuid.v4());
  }

  public addChildNode(identifier: string, complexity: number, parent: string, group?: string): void {
    const queue: ComplexityNode[] = [];
    queue.push(this.root);

    while (queue.length != 0) {
      const currentNode: ComplexityNode = queue[0];
      queue.shift();

      if (currentNode.identifier === parent) {
        currentNode.addChild(identifier, complexity, `${parent}|${group ?? uuid.v4()}`);
        return;
      }

      for (const node of Object.values(currentNode.children)) {
        queue.push(node);
      }
    }

    throw new ParentNodeNotFoundException(identifier);
  }

  public updateNodeComplexityWithSize(identifier: string, size: number): void {
    const queue: ComplexityNode[] = [];
    queue.push(this.root);

    while (queue.length != 0) {
      const currentNode: ComplexityNode = queue[0];
      queue.shift();

      if (currentNode.identifier === identifier) {
        currentNode.complexity += size;
        return;
      }

      for (const node of Object.values(currentNode.children)) {
        queue.push(node);
      }
    }

    throw new ParentNodeNotFoundException(identifier);
  }

  public getComplexity(): number {
    const processedGroups: any[] = [];

    const queue: any[] = [];
    queue.push({ node: this.root, parentComplexity: 0 });

    let complexity = 0;

    while (queue.length != 0) {
      const currentLevel = queue[0];
      queue.shift();

      const group: string = currentLevel.node.group;

      if (!processedGroups.includes(group)) {
        if (Object.keys(currentLevel.node.children).length === 0) {
          complexity += currentLevel.node.complexity * currentLevel.parentComplexity;
        }

        if (group !== undefined) {
          processedGroups.push(group);
        }
      }

      for (const node of Object.values(currentLevel.node.children)) {
        queue.push({ node: node, parentComplexity: currentLevel.node.complexity });
      }
    }

    return complexity;
  }
}
