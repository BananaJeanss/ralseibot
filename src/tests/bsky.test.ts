// bsky test
import fs from "fs";
import { BlueskyHandler } from "../handlers/bluesky";
import { test, expect } from "bun:test";

test("fetches posts from feed", async () => {
  const handler = new BlueskyHandler();
  // choose random feed from sources.yaml
  const sources = Bun.YAML.parse(
    fs.readFileSync("./sources.yaml", "utf-8"),
  ) as any;
  const feed = sources.sources.bsky.find((s: any) => s.type === "feed");
  console.log(feed);
  const posts = await handler.getLatestPostsFromFeed(feed.handle, feed.feedId);
  console.log("✅ Latest posts:", posts);
  const user = sources.sources.bsky.find((s: any) => s.type === "user");
  const userPosts = await handler.getLatestPostsFromUser(user.handle);
  console.log("✅ Latest posts from user:", userPosts);
  // image links
  const imageLinks = userPosts.postsArray
    .map((post) => {
      const images = post.post.embed?.images || [];
      return images.map((img: any) => img.fullsize);
    })
    .flat();
  console.log("✅ Extracted image links:", imageLinks);
  expect(posts).toBeDefined();
  expect(userPosts).toBeDefined();
});
