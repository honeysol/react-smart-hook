import {
  type DocumentReference,
  type DocumentSnapshot,
  type FirestoreError,
  onSnapshot,
} from "firebase/firestore";
import {
  retentionCache,
  createStoreCacheHook,
  createEmitter,
  type Unsubscriber,
} from "@smart-hook/react-hook-retention-cache";

type emptyObject = { [P in string]: never };

export type DocumentResult<D> = {
  snapshot?: DocumentSnapshot<D>;
  error?: FirestoreError;
  data?: D;
  ref: DocumentReference<D>;
  loading?: boolean;
};

class DocumentStore<D> {
  public current: DocumentResult<D>;
  private ref: DocumentReference<D>;
  private emitter = createEmitter<DocumentResult<D>>("DocumentStore");
  private unsubscriber: Unsubscriber;
  constructor(docRef: DocumentReference<D>, withData?: boolean) {
    this.ref = docRef;
    this.emitter = createEmitter<DocumentResult<D>>(docRef);
    this.current = { ref: this.ref, loading: true };
    this.unsubscriber = onSnapshot<D>(docRef, {
      next: (snapshot: DocumentSnapshot<D>) => {
        if (withData) {
          this.current = { snapshot, ref: this.ref, data: snapshot.data() };
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

  on(handler: (result: DocumentResult<D>) => void) {
    return this.emitter.on(handler);
  }
}

export type UseDocumentOption = {
  withData?: boolean;
  retentionTime?: number | undefined;
};

export function getDocumentCache<D, P>(
  refGenerator: (params: P) => DocumentReference<D>,
  { withData, retentionTime }: UseDocumentOption = {}
) {
  return retentionCache({
    generator: (params: P) =>
      new DocumentStore<D>(refGenerator(params), withData !== false),
    cleanUp: (v) => v.close(),
    retentionTime: retentionTime || 1000,
  });
}

export function createDocumentHook<D, P>(
  refGenerator: (params: P) => DocumentReference<D>,
  { withData, retentionTime }: UseDocumentOption = {}
) {
  const cache = getDocumentCache(refGenerator, {
    withData,
    retentionTime,
  });
  return createStoreCacheHook(cache, {} as emptyObject);
}

export function createFixedDocumentCache<D>(
  refGenerator: () => DocumentReference<D>,
  { withData, retentionTime }: UseDocumentOption = {}
) {
  return retentionCache({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    generator: (_param: true) =>
      new DocumentStore<D>(refGenerator(), withData !== false),
    cleanUp: (v) => v.close(),
    retentionTime: retentionTime || 1000,
  });
}

export function createFixedDocumentHook<D>(
  refGenerator: () => DocumentReference<D>,
  { withData, retentionTime }: UseDocumentOption = {}
) {
  const cache = createFixedDocumentCache(refGenerator, {
    withData,
    retentionTime,
  });
  return createStoreCacheHook(cache, {} as never).bind(null, true);
}

export const getDocumentRefCache = <D>({
  withData,
  retentionTime,
}: UseDocumentOption = {}) => {
  return retentionCache({
    generator: (doc: DocumentReference<D>) =>
      new DocumentStore<D>(doc, withData !== false),
    serializer: (doc: DocumentReference<D>) => doc.path,
    cleanUp: (v) => v.close(),
    retentionTime: retentionTime || 1000,
  });
};

export const createDocumentRefHook = ({
  withData,
  retentionTime,
}: UseDocumentOption = {}) => {
  const cache = getDocumentRefCache({ withData, retentionTime });
  return createStoreCacheHook(cache, {} as emptyObject) as <D>(
    params: DocumentReference<D> | undefined | null
  ) => DocumentResult<D> | emptyObject;
};
