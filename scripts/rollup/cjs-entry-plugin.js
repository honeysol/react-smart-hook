import * as path from "path";

export const cjsEntryPlugin = ({ prodPath, devPath, outputFile }) => {
  return {
    generateBundle(context) {
      if (!context.file.includes(path.basename(prodPath))) {
        return;
      }
      const content = `"use strict";
if (process.env.NODE_ENV === "production") {
  module.exports = require(${JSON.stringify(prodPath)});
} else {
  module.exports = require(${JSON.stringify(devPath)});
}
`;
      this.emitFile({
        type: "asset",
        fileName: outputFile,
        source: content,
      });
    },
  };
};
