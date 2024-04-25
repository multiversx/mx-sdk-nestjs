export class ShuttingDownError extends Error {
  constructor() {
    super('Shutting down');
  }
}
