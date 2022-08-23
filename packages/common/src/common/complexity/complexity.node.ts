export class ComplexityNode {
  identifier: string;
  complexity: number;
  group: string | undefined;

  children: { [identifier: string]: ComplexityNode; };

  constructor(identifier: string, complexity: number, group?: string) {
    this.identifier = identifier;
    this.complexity = complexity;
    this.group = group;

    this.children = {};
  }

  public addChild(identifier: string, complexity: number, group?: string) {
    this.children[identifier] = new ComplexityNode(identifier, complexity, group);
  }
}
