import { Logger } from "@nestjs/common";
import { MetricsService, CpuProfiler, PerformanceProfiler } from "@multiversx/sdk-nestjs-monitoring";
import { ContextTracker } from "./context.tracker";

export class Locker {
  private static lockSet: Set<string> = new Set();

  static async lock(key: string, func: () => Promise<void>, log: boolean = false): Promise<LockResult> {
    const logger = new Logger('Lock');

    if (Locker.lockSet.has(key)) {
      logger.log(`${key} is already running`);
      return LockResult.ALREADY_RUNNING;
    }

    Locker.lockSet.add(key);

    const profiler = new PerformanceProfiler();
    const cpuProfiler = log ? new CpuProfiler() : undefined;

    ContextTracker.assign({ origin: key });

    try {
      await func();

      profiler.stop();
      cpuProfiler?.stop(log ? `Running ${key}` : undefined);

      MetricsService.setJobResult(key, 'success', profiler.duration);

      return LockResult.SUCCESS;
    } catch (error) {
      logger.error(`Error running ${key}`);
      logger.error(error);

      profiler.stop();
      cpuProfiler?.stop(log ? `Running ${key}` : undefined);

      MetricsService.setJobResult(key, 'error', profiler.duration);

      return LockResult.ERROR;
    } finally {
      Locker.lockSet.delete(key);
    }
  }
}

export enum LockResult {
  SUCCESS = 'success',
  ALREADY_RUNNING = 'alreadyRunning',
  ERROR = 'error'
}
