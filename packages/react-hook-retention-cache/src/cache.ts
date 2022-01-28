import { useEffect, useMemo } from "react";
import { stringify } from "./stringify";
type Unsubscriber = () => void;

export class RetentionItem<V> {
  value: V;
  private retentionTime?: number;
  private counter = 0;
  private cleanUp: Unsubscriber;
  private cancelTimer?: NodeJS.Timeout;

  constructor(value: V, cleanUp: Unsubscriber, retentionTime?: number) {
    this.value = value;
    this.cleanUp = cleanUp;
    this.retentionTime = retentionTime;
    this.startCleanUpTimer();
  }

  subscribe(): Unsubscriber {
    this.counter += 1;
    this.stopCleanUpTimer();
    return () => {
      this.counter -= 1;
      if (this.counter === 0) {
        this.startCleanUpTimer();
      }
    };
  }

  private startCleanUpTimer = () => {
    if (typeof this.retentionTime === "number") {
      this.stopCleanUpTimer();
      this.cancelTimer = setTimeout(() => {
        this.cancelTimer = undefined;
        this.cleanUp();
      }, this.retentionTime);
    } else {
      this.cleanUp();
    }
  };

  private stopCleanUpTimer = () => {
    if (this.cancelTimer) {
      clearTimeout(this.cancelTimer);
      this.cancelTimer = undefined;
    }
  };
}

export function retentionCache<V, P = undefined>(params: {
  generator: (param: P) => V;
  cleanUp: (value: V) => void;
  retentionTime: number | undefined;
  serializer?: ((param: P) => string) | undefined;
}): RetentionCache<V, P> {
  return new RetentionCache(params);
}

class RetentionCache<V, P> {
  private cache = new Map<string, RetentionItem<V>>();
  private generator: (param: P) => V;
  private retentionTime?: number;
  private serializer: (param: P) => string;
  private cleanUp: (value: V) => void;

  constructor({
    generator,
    cleanUp,
    retentionTime,
    serializer,
  }: {
    generator: (param: P) => V;
    cleanUp: (value: V) => void;
    retentionTime: number | undefined;
    serializer?: (param: P) => unknown;
  }) {
    this.generator = generator;
    this.retentionTime = retentionTime;
    this.cleanUp = cleanUp;
    this.serializer = serializer
      ? (param: P) => stringify(serializer(param))
      : stringify;
  }

  getItem(param: P): RetentionItem<V> {
    const key = this.serializer(param);
    return (
      this.cache.get(key) ||
      (() => {
        const value = this.generator(param);
        const item = new RetentionItem(
          value,
          () => {
            this.cache.delete(key);
            this.cleanUp(value);
          },
          this.retentionTime
        );
        this.cache.set(key, item);
        return item;
      })()
    );
  }
}

export type { RetentionCache };

export const useCache = <V, P>(
  param: P | undefined | null,
  cache: RetentionCache<V, P>
) => {
  const item = useMemo(
    () => (param == null ? undefined : cache.getItem(param)),
    [cache, param]
  );
  useEffect(() => {
    return item?.subscribe();
  }, [item]);
  return item?.value;
};

export const useCacheItem = <V>(item: RetentionItem<V>) => {
  useEffect(() => {
    return item.subscribe();
  }, [item]);
  return item.value;
};
