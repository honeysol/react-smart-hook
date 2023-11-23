import { retentionCache } from "./cache";
import { createEmitter } from "./emitter";
import { Store, createStoreCacheHook } from "./store";

export type AsyncState<R> = {
  error?: Error;
  value?: R;
};

class AsyncStore<R> implements Store<AsyncState<R>> {
  public current: AsyncState<R> = {};
  private emitter = createEmitter<AsyncState<R>>();
  constructor(promise: Promise<R>) {
    promise.then(
      (value) => {
        this.current = { value };
        this.emitter.emit(this.current);
      },
      (error) => {
        console.error(error);
        this.current = { error };
        this.emitter.emit(this.current);
      }
    );
  }

  close() {
    this.emitter.close();
  }

  on(handler: (result: AsyncState<R>) => void) {
    return this.emitter.on(handler);
  }
}

export const createAsyncCache = <P, R>(
  handler: (params: P) => Promise<R>,
  { retentionTime }: { retentionTime?: number } = {}
) => {
  return retentionCache({
    generator: (params: P) => new AsyncStore<R>(handler(params)),
    cleanUp: (v) => v.close(),
    retentionTime: retentionTime || 1000,
  });
};

export const createAsyncHook = <P, R>(
  handler: (params: P) => Promise<R>,
  { retentionTime }: { retentionTime?: number } = {}
) => {
  const cache = createAsyncCache(handler, { retentionTime });
  return createStoreCacheHook(cache, {} as AsyncState<R>);
};
