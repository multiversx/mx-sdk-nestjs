# Elrond NestJS Microservice Utilities

This package contains a set of utilities commonly used in the Elrond Microservice ecosystem.

It relies on the following peer dependencies which must be installed in the parent package:
- @elrondnetwork/erdjs
- @elrondnetwork/erdjs-walletcore
- @nestjs/common
- @nestjs/swagger

## Documentation

 - [Elrond Docs](https://docs.elrond.com/sdk-and-tools/erdnest/)

## CHANGELOG

[CHANGELOG](CHANGELOG.md)

## Distribution

[npm](https://socket.dev/npm/package/@elrondnetwork/erdnest)

## Installation

`erdnest` is delivered via **npm** and it can be installed as follows:

```
npm install @elrondnetwork/erdnest
```

## Code examples

In this section we will provide some code examples of how these packages can be used in your microservice.

These examples requires basic knowledge of NestJS framework, if you are not familiar with some of the key concepts like (Modules, Providers, Guards, Incerceptors, etc.) please make sure to check their documentation before proceeding with these examples. [NestJS Docs](https://docs.nestjs.com/#introduction)

As a rule of thumb, we recommend to import these modules everytime you use them, do not try to import them just once in the application root module.

Also, if you discover a feature that is missing and might be useful, we would appreciate if you open a PR to integrate it.

### Caching

Caching is one of the most important components when talking about high scalable applications that needs to serve thousands of requests per second.
`erdnest` uses both remote (redis) and local (in-memory) cache.

#### Import

In your module:

```
@Module({
  imports: [
    CachingModule.forRootAsync({
      imports: [ApiConfigModule],
      useFactory: (apiConfigService: ApiConfigService) => new CachingModuleOptions({
        url: apiConfigService.getRedisUrl(), 
        poolLimit: apiConfigService.getPoolLimit(),
        processTtl: apiConfigService.getProcessTtl(),
      }),
      inject: [ApiConfigService],
    });
  ],
  providers: [FeatureService]
})
export class FeatureModule{}
```

In your provider: 

```
import { CachingService } from "@elrondnetwork/erdnest";

@Injectable()
export class FeatureService {
  constructor(
    private readonly cachingService: CachingService,
  ) { }
```

#### Features

`getCache`

Returns a Promise with the value stored in cache at a specific key or undefined if key isn't in cache.
It searches the key first in local and then in remote cache.

```
const value = await this.cachingService.getCache<ExpectedType>(key);
```

`setCache`

Set both local and remote cache keys with the value you provided. It also accepts a ttl value  which represents the persistence time in seconds, if no value is provided it will use default ttl of 6 seconds.

```
await this.cachingService.setCache(key, value, ttl);
```

`getOrSetCache`

Returns a Promise with the value stored in cache at a specific key or set that key with the value you provided.
If you don't provide a remote ttl, it will use the default value of 6 seconds.
If you don't provide a local ttl, it will use half of the remote ttl value.
It also accepts a forceRefresh (boolean) parameter for situations you explicitly need to update the cache.

```
const value = await this.cachingService.getOrSetCache(
      key,
      async () => await rawValue,
      remoteCacheTtl,
      localCacheTtl
    );
```

These are the most used features of the CachingModule, there are some more advanced features related to batch processing.
If you need something else please make sure to check our [CachingService](packages/common/src/common/caching/caching.service.ts).

### Smart Contract Interactions

This package is for dApps that interacts with smart contracts

#### Contract Loader

Uses Singleton pattern and load a [SmartContract](https://github.com/ElrondNetwork/elrond-sdk-erdjs/blob/main/src/smartcontracts/smartContract.ts) from an abi path.
You can also load multiple contracts with same abi.

```
const cLoader = new ContractLoader(ABI_PATH, CONTRACT_INTERFACE);

const sc = await cLoader.getContract(CONTRACT_ADDRESS);
```

#### Contract Query Runner

Execute contract queries using an elrond proxy provider (api/gateway).

```
const cRunner = new ContractQueryRunner(new ApiNetworkProvider(this.apiConfigService.getApiUrl()));

const contract = await this.contractLoader.getContract(CONTRACT_ADDRESS);

const interaction: Interaction = contract.methodsExplicit.getTotalLockedAssetSupply([]);

const queryResponse = await cRunner.runQuery(contract, interaction);
```

#### Contract Transaction Generator

Create transactions from smart contract interactions using and elrond proxy provider (api/gateway).

```
const txGenerator = new ContractTransactionGenerator(provider);

const tx = await this.transactionGenerator.createTransaction(interaction, signer.getAddress());
```







