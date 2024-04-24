import { INestApplication, INestMicroservice } from "@nestjs/common";
import { ShuttingDownError } from "./shutting-down.error";
import * as readline from 'readline';

export class CriticalPathHandler {
  private static pendingPromises: Promise<any>[] = [];
  private static isShuttingDown = false;

  static async execute<T>(callback: () => Promise<T>): Promise<T> {
    if (this.isShuttingDown) {
      throw new ShuttingDownError();
    }

    const promise = callback();

    this.pendingPromises.push(promise);
    try {
      return await promise;
    } finally {
      this.pendingPromises.remove(promise);
    }
  }

  static async signalShutdownAndWait() {
    this.isShuttingDown = true;

    await Promise.allSettled(this.pendingPromises);
  }

  static addShutdownHooks(...apps: (INestApplication | INestMicroservice)[]) {
    // Function to handle cleanup logic
    async function handleShutdown(signal: string) {
      console.log(`Received ${signal}. Cleaning up...`);
      try {
        await CriticalPathHandler.signalShutdownAndWait();
        // Place your cleanup logic here, e.g., close database connections,
        // complete pending tasks, etc. You can use await since it's an async function.
        console.log('Cleanup completed.');
      } finally {
        for (const app of apps) {
          await app.close();
        }

        process.exit(0);  // Ensure the process exits after cleanup
      }
    }

    // Setup listeners for shutdown signals
    readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    }).on('SIGINT', async () => await handleShutdown('SIGINT'));
    process.on('SIGTERM', async () => await handleShutdown('SIGTERM'));
  }
}
