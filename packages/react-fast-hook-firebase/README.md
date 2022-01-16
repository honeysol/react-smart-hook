# Overview

React hook for Firebase based on `react-hook-retention-cache`.

## Difference from react-firebase-hook and plain firebase.

Firebase has an original excellent caching mechanism. In an example of firestore, if you have effective onSnapshot subscription, you can use a cached value via `getDocFromCache`, `getDoc` or other `onSnapshot` subscriptions. But this mechanism has a severe limitation.

1. You can only get value asynchronously, even if it has been cached. (`getDocFromCache` can only return Promise)
2. If a React component subscribe Firebase resource and unsubscribe in `unmount`, a cache of a value is also released. And next page cannot use cache. This behaviour cannot be changes at least you use react-firebase-react-hook.

This package resolve these problems with smart caching mechanism privided by `react-hook-retention-cache`.

## How to handle data model.

In Firestore + TypeScript project, how to handle data model of doc / collection is troublesome problem.
One of a smart strategy is to use a model dependent hooks. 
This strategy is also compatible with caching.

All functions of this package has form of `create***Hook(callback)` and generate model dependent hooks. This is very suitable for a modern TypeScript project.

## Example

```ts
// Doc
export const useClientDoc = createDocumentHook((id: string) =>
  doc(clientCollection, id)
);
/*  (params: string) => { 
    snapshot?: DocumentSnapshot<D>;
    error?: FirestoreError;
    data?: D;
    ref: DocumentReference<D>;
    loading?: boolean;
} */

export const useDefaultClientDoc = createDocumentHook(() =>
  doc(clientCollection, "default")
);
/*  () => { 
    snapshot?: DocumentSnapshot<D>;
    error?: FirestoreError;
    data?: D;
    ref: DocumentReference<D>;
    loading?: boolean;
} */

// Query
export const useCouponList = createQueryHookWithId(() => {
  return query(userCollection, orderBy("createdAt", "desc").withConverter(withIdConverter<D>()));
});
/* () =>{
    snapshot?: QuerySnapshot<D>;
    error?: FirestoreError;
    list?: D[];
    ref: Query<D>;
    loading?: boolean;
} */

const useIdTokenResult = createIdTokenHook(auth, (claims, user) => {
  return {
    role: claims?.role as string | undefined,
    uid: claims?.sub as string | undefined,
    email: claims?.email as string | undefined,
  };
});
/* () => {
    error?: Error;
    data?: {
      role: string | undefined;
      uid: string | undefined;
      email: string | undefined;
  };
} */
```

# API

## firestore doc
```ts
declare type DocumentResult<D> = {
    snapshot?: DocumentSnapshot<D>;
    error?: FirestoreError;
    data?: D;
    ref: DocumentReference<D>;
    loading?: boolean;
};
declare type UseDocumentOption = {
    withData?: boolean;
    retentionTime?: number | undefined;
};
declare function createDocumentHook<D, P = undefined>(refGenerator: (params: P) => DocumentReference<D>, { withData, retentionTime }?: UseDocumentOption): P extends undefined ? () => DocumentResult<D> : (params: P) => DocumentResult<D>;
declare const createDocumentRefHook: <D>({ withData, retentionTime }?: UseDocumentOption) => (params: DocumentReference<D>) => DocumentResult<D>;
```

## firestore query (including collection)
```ts
declare type QueryResult<D> = {
    snapshot?: QuerySnapshot<D>;
    error?: FirestoreError;
    list?: D[];
    ref: Query<D>;
    loading?: boolean;
};
declare type UseQueryOption = {
    withData?: boolean;
    retentionTime?: number | undefined;
};
declare const createQueryHook: <D, P = undefined>(refGenerator: (params: P) => Query<D>, { withData, retentionTime }?: UseQueryOption) => P extends undefined ? () => QueryResult<D> : (params: P) => QueryResult<D>;
declare const createQueryRefHook: <D>({ withData, retentionTime }?: UseQueryOption) => (params: Query<D>) => QueryResult<D>;
```

## firebase authentication 
```ts
declare type IdTokenResult<D> = {
    error?: Error;
    data?: D;
};
declare const createIdTokenHook: <D>(auth: Auth, projector: (claims?: ParsedToken | undefined, user?: User | undefined) => D, { retentionTime }?: {
    retentionTime: number | undefined;
}) => () => IdTokenResult<D>;
```