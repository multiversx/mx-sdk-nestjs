import { DynamicModule, Module } from "@nestjs/common";
import { RedisOptions } from "ioredis";
import { RedisModuleAsyncOptions } from "../redis/options";
import { RedisModule } from "../redis/redis.module";
import { LOCKER_REDIS_CLIENT } from "./entities/constants";
import { LockerService } from "./locker.service";

@Module({})
export class LockerModule {
  public static forRoot(redisOptions: { config: RedisOptions }): DynamicModule {
    return {
      module: LockerModule,
      imports: [
        RedisModule.forRoot(redisOptions, LOCKER_REDIS_CLIENT),
      ],
      providers: [
        LockerService,
      ],
      exports: [
        LockerService,
      ],
    };
  }

  public static forRootAsync(redisAsyncOptions: RedisModuleAsyncOptions): DynamicModule {
    return {
      module: LockerModule,
      imports: [
        RedisModule.forRootAsync(redisAsyncOptions, LOCKER_REDIS_CLIENT),
      ],
      providers: [
        LockerService,
      ],
      exports: [
        LockerService,
      ],
    };
  }
}
