import {
  type Query,
  type QuerySnapshot,
  type FirestoreError,
  onSnapshot,
} from "firebase/firestore";
import {
  retentionCache,
  createStoreCacheHook,
  createMultipleStoreCacheHook,
} from "@smart-hook/react-hook-retention-cache";
import { createEmitter, type Unsubscriber } from "./util";

type emptyObject = { [P in string]: never };

export type QueryResult<D> = {
  snapshot?: QuerySnapshot<D>;
  error?: FirestoreError;
  list?: D[];
  ref: Query<D>;
  loading?: boolean;
};

class QueryStore<D> {
  public current: QueryResult<D>;
  private ref: Query<D>;
  private emitter = createEmitter<QueryResult<D>>();
  private unsubscriber: Unsubscriber;
  constructor(queryRef: Query<D>, withData?: boolean) {
    this.ref = queryRef;
    this.current = { ref: this.ref, loading: true };
    this.emitter = createEmitter<QueryResult<D>>(queryRef);
    this.unsubscriber = onSnapshot<D>(queryRef, {
      next: (snapshot: QuerySnapshot<D>) => {
        if (withData) {
          this.current = {
            snapshot,
            ref: this.ref,
            list: snapshot.docs.map((doc) => doc.data()),
          };
        } else {
          this.current = { snapshot, ref: this.ref };
        }
        this.emitter.emit(this.current);
      },
      error: (error: FirestoreError) => {
        this.current = { error, ref: this.ref };
        this.emitter.emit(this.current);
      },
    });
  }

  close() {
    this.unsubscriber();
  }

  on(handler: (result: QueryResult<D>) => void) {
    return this.emitter.on(handler);
  }
}

export type UseQueryOption = {
  withData?: boolean;
  retentionTime?: number | undefined;
};

export const createQueryHook = <D, P>(
  refGenerator: (params: P) => Query<D>,
  { withData, retentionTime }: UseQueryOption = {}
) => {
  const cache = retentionCache({
    generator: (params: P) =>
      new QueryStore<D>(refGenerator(params), withData !== false),
    cleanUp: (v) => v.close(),
    retentionTime: retentionTime || 1000,
  });
  return createStoreCacheHook(cache, {} as emptyObject);
};

export const createMultipleQueryHook = <D, P>(
  refGenerator: (params: P) => Query<D>,
  { withData, retentionTime }: UseQueryOption = {}
) => {
  const cache = retentionCache({
    generator: (params: P) =>
      new QueryStore<D>(refGenerator(params), withData !== false),
    cleanUp: (v) => v.close(),
    retentionTime: retentionTime || 1000,
  });
  return [
    createStoreCacheHook(cache, {} as emptyObject),
    createMultipleStoreCacheHook(cache, {} as emptyObject),
  ] as const;
};

export const createFixedQueryHook = <D>(
  refGenerator: () => Query<D>,
  { withData, retentionTime }: UseQueryOption = {}
) => {
  const cache = retentionCache({
    generator: (_params: true) =>
      new QueryStore<D>(refGenerator(), withData !== false),
    cleanUp: (v) => v.close(),
    retentionTime: retentionTime || 1000,
  });
  return createStoreCacheHook(cache, {} as never).bind(null, true);
};

// experimental. using private API (Query._query)
export const createQueryRefHook = (<D>({
  withData,
  retentionTime,
}: UseQueryOption = {}) => {
  const cache = retentionCache({
    generator: (query: Query<D>) =>
      new QueryStore<D>(query, withData !== false),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    serializer: (query: Query<D>) => (query as any)._query,
    cleanUp: (v) => v.close(),
    retentionTime: retentionTime || 1000,
  });
  return createStoreCacheHook(cache, {} as emptyObject);
}) as (
  options?: UseQueryOption
) => <D>(params: Query<D> | undefined | null) => QueryResult<D> | emptyObject;
