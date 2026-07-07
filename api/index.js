"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// script/api-entry.ts
var api_entry_exports = {};
__export(api_entry_exports, {
  default: () => handler
});
module.exports = __toCommonJS(api_entry_exports);
async function handler(req, res) {
  const results = {};
  const mods = ["express", "postgres", "web-push", "drizzle-orm/postgres-js"];
  for (const m of mods) {
    try {
      await import(m);
      results[m] = "OK";
    } catch (e) {
      results[m] = `FAIL: ${e?.message || e}`;
    }
  }
  res.statusCode = 200;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(results));
}
