import async_hooks from 'async_hooks';
import { randomUUID } from 'crypto';

export class ContextTracker {
  private static readonly asyncHookDict: Record<number, string> = {};
  private static readonly contextDict: Record<string, any> = {};
  private static hook?: async_hooks.AsyncHook;

  static assign(value: Object) {
    ContextTracker.ensureIsTracking();

    const asyncId = async_hooks.executionAsyncId();
    let contextId = ContextTracker.asyncHookDict[asyncId];
    if (!contextId) {
      contextId = randomUUID();

      ContextTracker.asyncHookDict[asyncId] = contextId;
    }

    let context = ContextTracker.contextDict[contextId];
    if (!context) {
      context = {};

      ContextTracker.contextDict[contextId] = context;
    }

    Object.assign(context, value);
  }

  static get() {
    const asyncId = async_hooks.executionAsyncId();
    const contextId = ContextTracker.asyncHookDict[asyncId];
    if (!contextId) {
      return undefined;
    }

    return ContextTracker.contextDict[contextId];
  }

  static unassign() {
    const asyncId = async_hooks.executionAsyncId();
    const contextId = ContextTracker.asyncHookDict[asyncId];
    if (!contextId) {
      return;
    }

    delete this.contextDict[contextId];
  }

  private static ensureIsTracking(): async_hooks.AsyncHook {
    if (!ContextTracker.hook) {
      ContextTracker.hook = async_hooks.createHook({ init: onInit, destroy: onDestroy }).enable();
    }

    return ContextTracker.hook;

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    function onInit(asyncId: number, _: string, triggerAsyncId: number) {
      const previousValue = ContextTracker.asyncHookDict[triggerAsyncId];
      if (previousValue) {
        ContextTracker.asyncHookDict[asyncId] = previousValue;
      }
    }

    function onDestroy(asyncId: number) {
      delete ContextTracker.asyncHookDict[asyncId];
    }
  }
}
