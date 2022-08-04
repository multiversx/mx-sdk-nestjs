import {
  CacheModule, Global, Module,
} from '@nestjs/common';
import { InMemoryCacheService } from './in-memory-cache.service';

@Global()
@Module({
  imports: [
    CacheModule.register({
      store: 'memory',
    }),
  ],
  exports: [
    InMemoryCacheService,
  ],
  providers: [
    InMemoryCacheService,
  ],
})
export class InMemoryCacheModule { }
