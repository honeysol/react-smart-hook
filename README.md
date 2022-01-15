# React smart hook

React hooks with automatic cache retention

Example Application
```ts
export const useClientDoc = createDocumentHook((id: string) =>
  doc(clientCollection, id)
);

export const useUserList = createQueryHook(() => {
  return query(useCollection, orderBy("createdAt", "desc"));
});
```

# React hook retention cache

Core concept of React smart hook is written in `react-hook-retention-cache` package. This enables easy way of caching during react component lifetime with additional retention time.

```ts
// global
const cache = retentionCache({
  generator: (documentId: string) => new AStore<D>(documentId),
});
// in react functional component
const store: AStore<D> = useCache(cache, documentId);
```

# Store

Store provides a way to resolve streaming resource (such as websocket) into a value.

```ts
export interface Store<C> {
  current: C;
  on(handler: (content: C) => void): Unsubscriber;
}

// global
const cache = retentionCache({
  generator: (documentId: string) => new AStore<D>(documentId),
});
// in react functional component
const data: D = useStoreCache(cache, documentId);
```