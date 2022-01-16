import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import eslint from "@rollup/plugin-eslint";
import typescript from "rollup-plugin-typescript2";
import { terser } from "rollup-plugin-terser";
import sourcemaps from "rollup-plugin-sourcemaps";
import { cjsEntryPlugin } from "./rollup/cjs-entry-plugin";
import * as path from "path";
import { escapeRegExp } from "lodash";

const extensions = [".ts", ".tsx", ".json"];

export const rollUpConfig = (pkg) => {
  const distDir = "./" + path.dirname(path.normalize(pkg.main));
  const packageName = path.basename(pkg.name);
  const BUILD_TYPE = {
    CJS_DEV: { format: "cjs", env: "development" },
    CJS_PROD: { format: "cjs", env: "production", minify: true },
    ESM: { format: "esm", fileName: "./" + path.normalize(pkg.module) },
  };

  const getFileName = ({ minify, format, env }) => {
    return [packageName, format, env, minify && "min", "js"]
      .filter(Boolean)
      .join(".");
  };
  const getOutputSetting = ({ minify, format, env, fileName }) => {
    return {
      file: fileName || distDir + "/" + getFileName({ minify, format, env }),
      format: format,
      sourcemap: true,
      plugins: [
        minify &&
          terser({
            output: {
              comments: false,
            },
          }),
      ].filter(Boolean),
    };
  };
  return {
    input: "src",
    output: [
      getOutputSetting(BUILD_TYPE.CJS_DEV),
      getOutputSetting(BUILD_TYPE.CJS_PROD),
      getOutputSetting(BUILD_TYPE.ESM),
    ],
    external: [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
    ].map((id) => RegExp("^" + escapeRegExp(id) + "($|/)")),
    plugins: [
      eslint(),
      typescript({ rollupCommonJSResolveHack: true, clean: true }),
      resolve({
        extensions,
      }),
      commonjs(),
      sourcemaps(),
      cjsEntryPlugin({
        prodPath: "./" + getFileName(BUILD_TYPE.CJS_PROD),
        devPath: "./" + getFileName(BUILD_TYPE.CJS_DEV),
        outputFile: path.basename(pkg.main),
      }),
    ],
  };
};
