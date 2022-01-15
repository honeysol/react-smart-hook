export type Unsubscriber = () => void;

export const createEmitter = <T>() => {
  const handlers = new Set<(value: T) => void>();
  return {
    emit(value: T) {
      handlers.forEach((handler) => handler(value));
    },
    on(handler: (value: T) => void): Unsubscriber {
      console.log("+ handlers size", handlers.size);
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
        console.log("- handlers size", handlers.size);
      };
    },
  };
};
