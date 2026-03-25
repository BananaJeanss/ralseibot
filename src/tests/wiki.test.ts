// tests the fetchWiki

import { test, expect } from "bun:test";
import {
  fetchWiki,
  fetchWikiInteface,
  formatNameToWikiUrl,
  searchWiki,
} from "../lib/fetchWiki";

async function fetchthefetcher(
  source: string,
  wiki: "undertale" | "deltarune",
): Promise<fetchWikiInteface> {
  const response = await fetchWiki(source, wiki);
  console.log("✅ Fetched wiki page:", response);
  return response;
}

// linux: WIKI_SEARCH="Egg" bun test wiki
// windows: set WIKI_SEARCH=Egg && bun test wiki
// reset with unset WIKI_SEARCH on linux, set WIKI_SEARCH= on windows
test("fetches a wiki page", async () => {
  // 1. run deltarune test
  let deltaSearch = Bun.env.WIKI_SEARCH ?? "Kris";

  const searchResult = await searchWiki(deltaSearch, "deltarune");
  console.log("🔍 Search result for", deltaSearch, ":", searchResult);
  expect(searchResult).not.toBeNull();
  // format for fetchTheFetcher
  const formatted = formatNameToWikiUrl(searchResult!, "deltarune");
  const response = await fetchthefetcher(formatted, "deltarune");
  expect(response).not.toBeNull();

  // 2. run undertale test
  let undertaleSearch = Bun.env.WIKI_SEARCH ?? "Frisk";
  const utSearchResult = await searchWiki(undertaleSearch, "undertale");
  console.log("🔍 Search result for", undertaleSearch, ":", utSearchResult);
  expect(utSearchResult).not.toBeNull();
  // format for fetchTheFetcher
  const utFormatted = formatNameToWikiUrl(utSearchResult!, "undertale");
  const utResponse = await fetchthefetcher(utFormatted, "undertale");
  expect(utResponse).not.toBeNull();
}, 20000);
