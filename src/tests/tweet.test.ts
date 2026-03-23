import { TwitterHandler } from "../handlers/twitter";
import { test, expect } from "bun:test";

// from testing this fails 100% so whatever
// TODO: switch from playwright using x.com to nitter.net i think that might work
test("fetches a tweet", async () => {
  const handler = TwitterHandler.getInstance();
  const tweet = await handler.fetchTweet();
  console.log("✅ Fetched tweet:", tweet);
  expect(tweet).not.toBeNull();
}, 20000);
