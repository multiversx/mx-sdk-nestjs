import { INestApplication, INestMicroservice } from "@nestjs/common";
import { ShuttingDownError } from "./shutting-down.error";
import * as readline from 'readline';
import { OriginLogger } from "../../utils/origin.logger";

export class ShutdownAwareHandler {
  private static pendingTasks: Promise<any>[] = [];
  private static isInitialized = false;
  private static isShuttingDown = false;
  private static defaultTimeout = 30_000;  // Default timeout of 30 seconds
  private static logger = new OriginLogger(ShutdownAwareHandler.name);

  static setDefaultTimeout(timeoutMs: number) {
    this.defaultTimeout = timeoutMs;
  }

  static async executeCriticalTask<T>(task: () => Promise<T>): Promise<T> {
    if (!this.isInitialized) {
      throw new Error('ShutdownAwareHandler must be initialized with addShutdownHooks() before use.');
    }

    if (this.isShuttingDown) {
      throw new ShuttingDownError();
    }

    const taskPromise = task();
    this.pendingTasks.push(taskPromise);

    try {
      return await taskPromise;
    } finally {
      this.pendingTasks = this.pendingTasks.filter(x => x !== taskPromise);
    }
  }

  private static async signalShutdownAndWait() {
    this.isShuttingDown = true;

    // Create a timeout promise
    const timeoutPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        this.logger.log(`Timeout: Not all tasks finished within ${this.defaultTimeout} milliseconds, proceeding with shutdown.`);
        resolve();  // Resolve to allow the process to continue even if all tasks have not completed
      }, this.defaultTimeout);
    });

    // Await all tasks with a timeout
    await Promise.race([Promise.allSettled(this.pendingTasks), timeoutPromise]);
  }

  static addShutdownHooks(...apps: (INestApplication | INestMicroservice)[]) {
    async function handleShutdown(signal: string) {
      ShutdownAwareHandler.logger.log(`Received ${signal}. Cleaning up...`);
      try {
        await ShutdownAwareHandler.signalShutdownAndWait();
        ShutdownAwareHandler.logger.log('Shutdown process completed.');
      } finally {
        for (const app of apps) {
          await app.close();
        }
        process.exit(0);  // Ensure the process exits after cleanup
      }
    }

    readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    }).on('SIGINT', async () => await handleShutdown('SIGINT'));
    process.on('SIGTERM', async () => await handleShutdown('SIGTERM'));

    this.isInitialized = true;
  }
}
