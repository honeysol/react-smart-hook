import { useEffect, useMemo, useState } from "react";
import { RetentionCache, useCache } from "./cache";

type Unsubscriber = () => void;

export interface Store<C> {
  current: C;
  on(handler: (content: C) => void): Unsubscriber;
}

export type ContentOfStore<S> = S extends Store<infer C> ? C : never;

export const useStore = <C>(store: Store<C> | undefined) => {
  const [content, setContent] = useState<C | undefined>(store?.current);
  useMemo(() => {
    setContent(store?.current);
  }, [store]);
  useEffect(() => {
    return store?.on((value) => {
      setContent(value);
    });
  }, [store]);
  return content;
};

export function useStoreCache<S extends Store<unknown>, P>(
  cache: RetentionCache<S, P>,
  params: P | undefined | null
) {
  const store = useCache(params, cache) as Store<ContentOfStore<S>>;
  return useStore(store) || undefined;
}

export function createStoreCacheHook<S extends Store<unknown>, P, V>(
  cache: RetentionCache<S, P>,
  defaultValue: V
) {
  return (params: P | undefined | null) => {
    return useStoreCache(cache, params) || defaultValue;
  };
}
