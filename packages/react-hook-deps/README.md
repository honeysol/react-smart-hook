# Overview

This package provides `useRef` and `useState` with additional dependency lists.
These will be regenerated when the dependency list changes.

# API

## useStateWithDeps

```ts
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

// example
const ref = useRefWithDeps(defaultValue, [dependentValue]);
```

## useStateWithDeps

```ts
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
          ref.current = (value as any)(ref.current);
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

// example
const [content, setContent] = useStateWithDeps(defaultContent, [
  defaultContent,
]);
```
