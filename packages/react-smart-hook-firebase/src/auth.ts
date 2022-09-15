import { Auth, onIdTokenChanged, User } from "firebase/auth";

import {
  createStoreCacheHook,
  Store,
  retentionCache,
} from "@smart-hook/react-hook-retention-cache";
import { createEmitter } from "./util";

import deepEqual from "fast-deep-equal";

type Unsubscriber = () => void;

export type AuthResult<D> = {
  error?: Error;
  data?: D;
};

class AuthStore<D> implements Store<AuthResult<D>> {
  public current: AuthResult<D> = {};
  private emitter = createEmitter<AuthResult<D>>();
  private unsubscriber: Unsubscriber;
  constructor(auth: Auth, projector: (user?: User) => D) {
    this.unsubscriber = onIdTokenChanged(
      auth,
      async (user: User | null) => {
        const value = user ? projector(user) : projector();
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

  on(handler: (result: AuthResult<D>) => void) {
    return this.emitter.on(handler);
  }
}

export const createAuthHook = <D>(
  auth: Auth,
  projector: (user?: User) => D,
  { retentionTime }: { retentionTime: number | undefined } = {
    retentionTime: 1000,
  }
) => {
  const cache = retentionCache({
    generator: (_param: true) => new AuthStore<D>(auth, projector),
    cleanUp: (v) => v.close(),
    retentionTime,
  });
  return createStoreCacheHook(cache, {} as never).bind(null, true);
};
