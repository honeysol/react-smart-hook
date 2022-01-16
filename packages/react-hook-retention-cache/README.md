# Overview

This package provides an easy way to cache objects during the lifetime of a React component with additional retention time. You can create cache with `retentionCache` and use it with `useCache`. 

## Basic Usage

```ts
// global
const cache = retentionCache({
  generator: (documentId: string) => new CertainObject(documentId),
  retentionTime: 1000
});
// in react functional component
const obj: CertainObject = useCache(cache, documentId);
```

## With Store

Store is a interaface that provides a way to resolve streaming resource (such as websocket) into a value. 
This package includes convenient functions to work with Store `useStore`, `useStoreCache`, `createStoreCacheHook`.

```ts
export interface Store<C> {
  current: C;
  on(handler: (content: C) => void): Unsubscriber;
}

// global
const cache = retentionCache({
  generator: (documentId: string) => new CertainStore<C>(documentId),
});
// in react functional component
const data: C = useStoreCache(cache, documentId);
```

# API

## retentionCache
```ts
export declare function retentionCache<V, P = undefined>(params: {
    generator: (param: P) => V;
     // clean up function. (default: no operation)
    cleanUp: (value: V) => void;
    // retention time after component is unmounted. (default: 0)
    retentionTime: number | undefined; 
    // serializer to determine cache key. (default: stringify function like json-stable-stringify)
    serializer?: ((param: P) => string) | undefined;
}): RetentionCache<V, P>;

// example
const cache = retentionCache({
  generator: ({ userId, groupId }) => new CertainObject(documentId),
  cleanUp: (obj: CertainObject) => obj.close(),
  serializer: ({ userId, groupId }) => `${userId}:${groupId}`
  retentionTime: 1000
});
```

Usually (at least in React component), you don't have to use `RetentionCache` directly. Use it with useCache.

## useCache

```ts
export declare const useCache: <V, P>(
  // param to use generate object (via generator) and to determine cache (via serializer).
  param: P, 
  // RetentionCache object
  cache: RetentionCache<V, P>
) => V;

// example
// in react functional component
const obj: CertainObject = useCache(cache, { userId, groupId });
```

## useStore

```ts
export interface Store<C> {
    current: C;
    on(handler: (content: C) => void): Unsubscriber;
}
export declare const useStore: <C>(store: Store<C>) => C;
```

`useStore` is a helper independent with `RetentionCache`. It resolve streaming value.

## useStoreCache
```ts
export declare function useStoreCache<S extends Store<unknown>, P>(cache: RetentionCache<S, P>, params: P): ContentOfStore<S>;
```

`useStoreCache` is syntax sugar of `useStore(useCache(params, cache))`. If you want to use only content of Store in RetentionCache. It is convenient to use `useStoreCache`.


## createStoreCacheHook
```ts
export declare function createStoreCacheHook<S extends Store<unknown>, P>(cache: RetentionCache<S, P>): P extends undefined ? () => ContentOfStore<S> : (params: P) => ContentOfStore<S>;
```

`createStoreCacheHook` creates partial application of useStoreCache which RetentionCache is binded with. By this solution, you don't have to be aware of RetentionCache in application code.
