export type Unsubscriber = () => void;

let verbose = false;

export const setVerbose = (_verbose: boolean) => {
  verbose = _verbose;
};

let totalCounter = 0;

const counterMap = new Map<unknown, number>();

const getCounter = (key: unknown) => {
  return counterMap.get(key) || 0;
};

const addCounter = (key: unknown, addition: number) => {
  const value = (counterMap.get(key) || 0) + addition;
  if (value !== 0) {
    counterMap.set(key, value);
  } else {
    counterMap.delete(key);
  }
};

export const createEmitter = <T>(debug?: unknown) => {
  const handlers = new Set<(value: T) => void>();
  return {
    emit(value: T) {
      handlers.forEach((handler) => handler(value));
    },
    on(handler: (value: T) => void): Unsubscriber {
      if (process.env.NODE_ENV === "development") {
        if (verbose) {
          console.log("+", debug, totalCounter, getCounter(debug));
          addCounter(debug, 1);
          totalCounter += 1;
        }
      }
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
        if (process.env.NODE_ENV === "development") {
          if (verbose) {
            totalCounter -= 1;
            addCounter(debug, -1);
            console.log("-", debug, totalCounter, getCounter(debug));
          }
        }
      };
    },
    close() {
      if (process.env.NODE_ENV === "development") {
        if (verbose) {
          totalCounter -= handlers.size;
          addCounter(debug, -handlers.size);
          console.log("close", debug, totalCounter, getCounter(debug));
        }
      }
      handlers.clear();
    },
  };
};

if (process.env.NODE_ENV === "development") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any)["__react_smart_hook_firebase_debug_counterMap"] = counterMap;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any)["__react_smart_hook_firebase_debug_setVerbose"] = setVerbose;
}
