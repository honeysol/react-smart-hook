export type Unsubscriber = () => void;

let verbose = false;

export const setVerbose = (_verbose: boolean) => {
  verbose = _verbose;
};

export const createEmitter = <T>() => {
  const handlers = new Set<(value: T) => void>();
  return {
    emit(value: T) {
      handlers.forEach((handler) => handler(value));
    },
    on(handler: (value: T) => void): Unsubscriber {
      if (verbose) console.log("+ handlers size", handlers.size);
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
        if (verbose) console.log("- handlers size", handlers.size);
      };
    },
  };
};
