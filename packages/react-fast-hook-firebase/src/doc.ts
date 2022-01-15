import {
  type DocumentReference,
  type DocumentSnapshot,
  type FirestoreError,
  onSnapshot,
} from "firebase/firestore";
import {
  retentionCache,
  createStoreCacheHook,
} from "react-hook-retention-cache";
import { createEmitter, type Unsubscriber } from "./util";

const a = "abc";

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
  private emitter = createEmitter<DocumentResult<D>>();
  private unsubscriber: Unsubscriber;
  constructor(docRef: DocumentReference<D>, withData?: boolean) {
    this.ref = docRef;
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

export function createDocumentHook<D, P = undefined>(
  refGenerator: (params: P) => DocumentReference<D>,
  { withData, retentionTime }: UseDocumentOption = { retentionTime: 1000 }
) {
  const cache = retentionCache({
    generator: (params: P) =>
      new DocumentStore<D>(refGenerator(params), withData !== false),
    cleanUp: (v) => v.close(),
    retentionTime,
  });
  return createStoreCacheHook(cache);
}

export const createDocumentRefHook = <D>(
  { withData, retentionTime }: UseDocumentOption = { retentionTime: 1000 }
) => {
  const cache = retentionCache({
    generator: (doc: DocumentReference<D>) =>
      new DocumentStore<D>(doc, withData !== false),
    serializer: (doc: DocumentReference<D>) => doc.path,
    cleanUp: (v) => v.close(),
    retentionTime,
  });
  return createStoreCacheHook(cache);
};
