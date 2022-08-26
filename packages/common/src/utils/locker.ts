import { Logger } from "@nestjs/common";
import { MetricsService } from "../common/metrics/metrics.service";
import { ContextTracker } from "./context.tracker";
import { CpuProfiler } from "./cpu.profiler";
import { PerformanceProfiler } from "./performance.profiler";

export class Locker {
  private static lockArray: string[] = [];

  static async lock(key: string, func: () => Promise<void>, log: boolean = false) {
    const logger = new Logger('Lock');

    if (Locker.lockArray.includes(key)) {
      logger.log(`${key} is already running`);
      return;
    }

    Locker.lockArray.push(key);

    const profiler = new PerformanceProfiler();
    const cpuProfiler = log ? new CpuProfiler() : undefined;

    ContextTracker.assign({ origin: key });

    try {
      await func();

      profiler.stop();
      cpuProfiler?.stop(log ? `Running ${key}` : undefined);

      MetricsService.setJobResult(key, 'success', profiler.duration);
    } catch (error) {
      logger.error(`Error running ${key}`);
      logger.error(error);

      profiler.stop();
      cpuProfiler?.stop(log ? `Running ${key}` : undefined);

      MetricsService.setJobResult(key, 'error', profiler.duration);
    } finally {
      Locker.lockArray.remove(key);
    }
  }
}
