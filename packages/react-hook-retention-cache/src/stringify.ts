// Refactored and shortened version of json-stable-stringify
/* eslint-disable @typescript-eslint/no-explicit-any */

export const stringify = (obj: unknown): string => {
  const seen: unknown[] = [];
  const stringify = (node: unknown): string => {
    const serializer =
      ((node as any)?.toJSON as (this: unknown) => string) || undefined;
    if (typeof serializer === "function") {
      node = serializer.call(node);
    }
    if (typeof node === "function" || node === undefined) {
      return "";
    } else if (typeof node === "bigint" || typeof node === "symbol") {
      return node.toString();
    } else if (typeof node !== "object" || node === null) {
      return JSON.stringify(node);
    } else {
      // object
      if (seen.includes(node)) {
        throw new TypeError("Converting circular structure to JSON");
      }
      if (Array.isArray(node)) {
        const itemStrings = node.map((item) => stringify(item) || "null");
        return "[" + itemStrings.join(",") + "]";
      }
      seen.push(node);
      const fields = (function* () {
        for (const key of Object.keys(node).sort()) {
          const valueString = stringify((node as Record<string, unknown>)[key]);
          if (valueString) yield key + ":" + valueString;
        }
      })();
      const str = "{" + Array.from(fields).join(",") + "}";
      seen.pop();
      return str;
    }
  };
  return stringify(obj);
};
