import { DependencyList, MutableRefObject, useMemo, useState } from "react";

export function useRefWithDeps<T>(
  initialValue: T,
  deps: DependencyList
): MutableRefObject<T>;
export function useRefWithDeps<T = undefined>(
  initialValue: undefined,
  deps: DependencyList
): MutableRefObject<T | undefined>;

export function useRefWithDeps<T>(initialValue: T, deps: DependencyList) {
  return useMemo(() => {
    return { current: initialValue };
  }, deps);
}

export function useStateWithDeps<T>(
  initialValue: T,
  deps: DependencyList
): readonly [T, (value: T | ((prevState: T) => T)) => void];

export function useStateWithDeps<T = undefined>(
  initialValue: undefined,
  deps: DependencyList
): readonly [
  T | undefined,
  (value: T | undefined | ((prevState: T | undefined) => T | undefined)) => void
];

export function useStateWithDeps<T>(initialValue: T, deps: DependencyList) {
  const [_counter, setCounter] = useState(0);
  const ref = useMemo(() => {
    return { current: initialValue };
  }, deps);
  const setter = useMemo(() => {
    return (value: T | ((prevState: T) => T)) => {
      if (ref.current !== value) {
        if (typeof value === "function") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ref.current = (value as any)(ref.current);
          // この挙動はおかしいが、React.useStateと同じ。
        } else {
          ref.current = value;
        }
        setCounter((v) => v + 1);
      }
    };
  }, [ref, setCounter]);
  const value = useMemo(() => ref.current, [ref.current]);
  return [value, setter] as const;
}
