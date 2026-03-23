// the sky is blue
// i couldve done this with curl but nahhh
import { AtpAgent, ModerationOpts } from "@atproto/api";
import { moderatePost, ModerationPrefs } from "@atproto/api";
import { YAML } from "bun";
import path from "path/win32";
import fs from "fs";
import { RalseiPost } from "../commands/ralsei/ralsei";

const opts: ModerationOpts = {
  userDid: undefined,
  prefs: {
    adultContentEnabled: false,
    labels: {
      porn: "hide",
      sexual: "hide",
      nudity: "hide",
      "graphic-media": "hide",
    },
    labelers: [],
    mutedWords: [],
    hiddenPosts: [],
  } as ModerationPrefs,
};

const agent = new AtpAgent({
  service: "https://bsky.social",
});

await agent.login({
  identifier: Bun.env.BLUESKY_USERNAME!,
  password: Bun.env.BLUESKY_PASSWORD!,
});

export class BlueskyHandler {
  private async filterforralsei(posts: any[]) {
    // moderate posts
    const filtered = posts.filter((item) => {
      const result = moderatePost(item.post, opts);
      return !result.ui("contentList").filter;
    });

    // filter for ralsei
    const ralseiPosts = filtered.filter((item) =>
      (item.post.record as any)?.text?.toLowerCase().includes("ralsei"),
    );

    // filter for images
    const imagePosts = ralseiPosts.filter((item) => {
      return (item.post.embed as any)?.$type === "app.bsky.embed.images#view";
    });

    return imagePosts;
  }

  public async getLatestPostsFromFeed(handle: string, feedid: string) {
    const { data } = await agent.resolveHandle({
      handle: handle, // e.g. "ralsei.bsky.social"
    });
    const { data: feedData } = await agent.app.bsky.feed.getFeed({
      feed: `at://${data.did}/app.bsky.feed.generator/${feedid}`,
      limit: 30,
    });
    const { feed: postsArray, cursor: nextPage } = feedData;
    const imagePosts = await this.filterforralsei(postsArray);

    return { postsArray: imagePosts, nextPage };
  }

  public async getLatestPostsFromUser(username: string) {
    const { data: handle } = await agent.resolveHandle({
      handle: username,
    });

    const { data: feedData } = await agent.getAuthorFeed({
      actor: handle.did,
      filter: "posts_and_author_threads",
      limit: 30,
    });

    const { feed: postsArray, cursor: nextPage } = feedData;
    const ralseiPosts = await this.filterforralsei(postsArray);

    return { postsArray: ralseiPosts, nextPage };
  }

  // fetch a singular random post from either feed or user, refer to yaml for weights
  public async fetchPost() {
    const sources = YAML.parse(
      fs.readFileSync(path.join(process.cwd(), "sources.yaml"), "utf-8"),
    ) as any;
    const blueskySources = sources.sources.bsky || [];
    if (blueskySources.length === 0) {
      throw new Error("No Bluesky sources configured");
    }

    // weighted random selection
    const totalWeight = blueskySources.reduce(
      (sum: number, src: any) => sum + (src.weight || 1),
      0,
    );
    let rand = Math.random() * totalWeight;
    let selected: any = null;

    for (const src of blueskySources) {
      rand -= src.weight || 1;
      if (rand <= 0) {
        selected = src;
        break;
      }
    }

    if (!selected) {
      throw new Error("Failed to select a Bluesky source");
    }

    // Fetch post from the selected source
    if (selected.type === "feed") {
      const feedResult = (await this.getLatestPostsFromFeed(
        selected.handle,
        selected.feedId,
      )) as any;

      // get a random post from the feed results
      const posts = feedResult.postsArray;
      if (posts.length === 0) {
        throw new Error("No posts found in the selected feed");
      }
      const randomPost = posts[Math.floor(Math.random() * posts.length)];
      let builder: RalseiPost = {
        title: randomPost.post.record.text,
        sourceUrl: `https://bsky.app/profile/${selected.handle}/post/${randomPost.post.uri.split("/").pop()}`,
        mediaUrls: (randomPost.post.embed as any)?.images?.map((img: any) => img.fullsize) || [],
        sourceName: selected.name,
        author: randomPost.post.author.handle,
      };
      return builder;
    } else if (selected.type === "user") {
      const userResult = (await this.getLatestPostsFromUser(
        selected.handle,
      )) as any;

      const posts = userResult.postsArray;
      if (posts.length === 0) {
        throw new Error("No posts found for the selected user");
      }
      const randomPost = posts[Math.floor(Math.random() * posts.length)];
      let builder: RalseiPost = {
        title: randomPost.post.record.text,
        sourceUrl: `https://bsky.app/profile/${selected.handle}/post/${randomPost.post.uri.split("/").pop()}`,
        mediaUrls: (randomPost.post.embed as any)?.images?.map((img: any) => img.fullsize) || [],
        sourceName: selected.name,
        author: randomPost.post.author.handle,
      };
      return builder;
    }

    throw new Error("Invalid Bluesky source type");
  }
}
