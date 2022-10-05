import { Auth, onIdTokenChanged, ParsedToken, User } from "firebase/auth";

import {
  createStoreCacheHook,
  Store,
  retentionCache,
} from "@smart-hook/react-hook-retention-cache";
import { createEmitter } from "./util";

import deepEqual from "fast-deep-equal";

type Unsubscriber = () => void;

export type IdTokenResult<D> = {
  error?: Error;
  data?: D;
};

let isFirstTime = true;

class IdTokenStore<D> implements Store<IdTokenResult<D>> {
  public current: IdTokenResult<D> = {};
  private emitter = createEmitter<IdTokenResult<D>>("IdTokenStore");
  private unsubscriber: Unsubscriber;
  constructor(
    auth: Auth,
    projector: (user?: User, claims?: ParsedToken | undefined) => D
  ) {
    this.unsubscriber = onIdTokenChanged(
      auth,
      async (user: User | null) => {
        const value = await (async () => {
          const isFirstTimeLocal = isFirstTime;
          if (isFirstTime) {
            isFirstTime = false;
          }
          if (!user) {
            return projector();
          } else {
            if (isFirstTimeLocal) {
              console.log("force refresh for persistent login");
            }
            const idTokenResult = await user.getIdTokenResult(isFirstTimeLocal);
            return projector(user, idTokenResult?.claims);
          }
        })();
        if (!deepEqual(this.current?.data, value)) {
          this.current = { data: value };
          this.emitter.emit(this.current);
        }
      },
      (error) => {
        this.current = { error };
        this.emitter.emit(this.current);
      }
    );
  }

  close() {
    this.unsubscriber();
  }

  on(handler: (result: IdTokenResult<D>) => void) {
    return this.emitter.on(handler);
  }
}

export const createIdTokenHook = <D>(
  auth: Auth,
  projector: (user?: User, claims?: ParsedToken) => D,
  { retentionTime }: { retentionTime?: number } = {}
) => {
  const cache = retentionCache({
    generator: (_param: true) => new IdTokenStore<D>(auth, projector),
    cleanUp: (v) => v.close(),
    retentionTime: retentionTime || 1000,
  });
  return createStoreCacheHook(cache, {} as never).bind(null, true);
};
