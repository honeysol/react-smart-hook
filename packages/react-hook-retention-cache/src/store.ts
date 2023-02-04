import { useEffect, useMemo, useState } from "react";
import {
  RetentionCache,
  useCachedValue,
  useMultipleCachedValues,
} from "./cache";
import { useStateWithDeps } from "./util";

type Unsubscriber = () => void;

export interface Store<C> {
  current: C;
  on(handler: (content: C) => void): Unsubscriber;
}

export type ContentOfStore<S> = S extends Store<infer C> ? C : never;

export const useStore = <C>(store: Store<C> | undefined) => {
  const [_content, setContent] = useState<C | undefined>(store?.current);
  useEffect(() => {
    return store?.on((value) => {
      setContent(value);
    });
  }, [store]);
  return store?.current;
};

export const useMultipleStore = <C, V>(
  stores: Record<string, Store<C> | undefined>,
  defaultValue: V
) => {
  const defaultContent = useMemo(() => {
    return Object.fromEntries(
      Object.entries(stores).map(([key, store]) => [
        key,
        store?.current || defaultValue,
      ])
    );
  }, [stores]);
  const [contents, setContents] = useStateWithDeps<
    Record<string, C | undefined | V>
  >(defaultContent, [defaultContent]);
  useEffect(() => {
    const unsubscribers = Object.entries(stores).map(([key, store]) => {
      return store?.on((value) => {
        setContents((contents) => {
          return { ...contents, [key]: value };
        });
      });
    });
    return () => {
      unsubscribers.forEach((unsubscriber) => unsubscriber?.());
    };
  }, [stores]);
  return contents;
};

export function useStoreCache<S extends Store<unknown>, P>(
  cache: RetentionCache<S, P>,
  params: P | undefined | null
) {
  const store = useCachedValue(params, cache) as Store<ContentOfStore<S>>;
  return useStore(store) || undefined;
}

export function useMultipleStoreCache<S extends Store<unknown>, P, V>(
  cache: RetentionCache<S, P>,
  params: Record<string, P | undefined | null>,
  defaultValue: V
) {
  const stores = useMultipleCachedValues(params, cache) as Record<
    string,
    Store<ContentOfStore<S>>
  >;
  return useMultipleStore(stores, defaultValue);
}

export function createStoreCacheHook<S extends Store<unknown>, P, V>(
  cache: RetentionCache<S, P>,
  defaultValue: V
) {
  return (params: P | undefined | null) => {
    return useStoreCache(cache, params) || defaultValue;
  };
}

export function createMultipleStoreCacheHook<S extends Store<unknown>, P, V>(
  cache: RetentionCache<S, P>,
  defaultValue: V
) {
  return (params: Record<string, P | undefined | null>) => {
    return useMultipleStoreCache(cache, params, defaultValue) || {};
  };
}
