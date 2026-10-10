import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { getOpenAlexWork, OpenAlexError, parseOpenAlexWorkId } from "../src/lib/openalex.ts";

describe("OpenAlex work identifiers", () => {
  it("normalizes raw and lowercase IDs", () => {
    assert.equal(parseOpenAlexWorkId(" W2741809807 "), "W2741809807");
    assert.equal(parseOpenAlexWorkId("w2252795400"), "W2252795400");
  });

  it("accepts supported OpenAlex URLs", () => {
    assert.equal(parseOpenAlexWorkId("https://openalex.org/works/w2252795400"), "W2252795400");
    assert.equal(parseOpenAlexWorkId("https://openalex.org/W2741809807"), "W2741809807");
  });

  it("rejects invalid identifiers", () => {
    assert.throws(() => parseOpenAlexWorkId("works/w2252795400"), (error: unknown) => error instanceof OpenAlexError && error.kind === "invalid-identifier");
  });
});

describe("OpenAlex work fetch errors", () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => { globalThis.fetch = originalFetch; });

  it("classifies not-found responses", async () => {
    globalThis.fetch = async () => new Response(null, { status: 404 });
    await assert.rejects(getOpenAlexWork("W2252795400"), (error: unknown) => error instanceof OpenAlexError && error.kind === "not-found");
  });

  it("classifies API and network failures separately", async () => {
    globalThis.fetch = async () => new Response(null, { status: 500 });
    await assert.rejects(getOpenAlexWork("W2252795400"), (error: unknown) => error instanceof OpenAlexError && error.kind === "api-error");
    globalThis.fetch = async () => { throw new Error("offline"); };
    await assert.rejects(getOpenAlexWork("W2252795400"), (error: unknown) => error instanceof OpenAlexError && error.kind === "network-error");
  });
});
