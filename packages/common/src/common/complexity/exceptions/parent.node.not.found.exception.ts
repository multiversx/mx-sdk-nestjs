export class ParentNodeNotFoundException extends Error {
  constructor(identifier: string) {
    super(`Parent node with identifier ${identifier} not found.`);
  }
}
