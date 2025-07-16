import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";
import { config } from "dotenv";
config();

const CLIENT_ID = process.env.REDDIT_CLIENT_ID;
const CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET;

interface RedditPost {
  data: {
    title: string;
    url: string;
    author: string;
    permalink: string;
    ups: number;
    is_self: boolean;
    over_18: boolean;
  };
}

interface RedditResponse {
  data: {
    children: RedditPost[];
  };
}

interface ImageResult {
  url: string;
  author: string;
  title: string;
  sourceUrl: string;
  sourceName: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export class RedditHandler {
  private static instance: RedditHandler;
  private config: any;
  private recentlyShown: Set<string> = new Set();
  private maxRecentlyShown: number = 50;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  private constructor() {
    this.loadConfig();
  }

  public static getInstance(): RedditHandler {
    if (!RedditHandler.instance) {
      RedditHandler.instance = new RedditHandler();
    }
    return RedditHandler.instance;
  }

  private loadConfig() {
    try {
      const configPath = path.join(process.cwd(), "sources.yaml");
      const configFile = fs.readFileSync(configPath, "utf8");
      this.config = yaml.parse(configFile);
    } catch (error) {
      console.error("Failed to load sources.yaml:", error);
      throw error;
    }
  }

  private async getAccessToken(): Promise<string | null> {
    // check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // get new token if not
    try {
      const response = await fetch(
        "https://www.reddit.com/api/v1/access_token",
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${CLIENT_ID}:${CLIENT_SECRET}`
            ).toString("base64")}`,
            "User-Agent": this.config.settings.default["user-agent"],
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: "grant_type=client_credentials",
        }
      );

      if (!response.ok) {
        console.error(
          "Failed to get Reddit access token:",
          response.status,
          response.statusText
        );
        return null;
      }

      const tokenData = (await response.json()) as TokenResponse;

      if (!tokenData.access_token) {
        console.error("No access token in response");
        return null;
      }

      this.accessToken = tokenData.access_token;
      // Set expiry with 5 minute buffer
      this.tokenExpiry = Date.now() + (tokenData.expires_in - 300) * 1000;

      console.log("Successfully obtained Reddit access token");
      return this.accessToken;
    } catch (error) {
      console.error("Error getting Reddit access token:", error);
      return null;
    }
  }

  // pick a random subreddit using weights
  private weightedRandom(sources: any[]) {
    const totalWeight = sources.reduce(
      (sum, src) => sum + (src.weight || 1),
      0
    );
    let rand = Math.random() * totalWeight;
    for (const src of sources) {
      rand -= src.weight || 1;
      if (rand <= 0) return src;
    }
    return sources[sources.length - 1];
  }

  async fetchImage(): Promise<ImageResult | null> {
    const redditSources = this.config.sources.reddit;
    if (!redditSources || redditSources.length === 0) {
      console.log("No Reddit sources configured");
      return null;
    }

    // Get access token
    const token = await this.getAccessToken();
    if (!token) {
      console.error("Could not obtain Reddit access token");
      return null;
    }

    // Pick a random subreddit
    const randomSource = this.weightedRandom(redditSources);
    console.log(`Trying Reddit source: ${randomSource.name}`);

    // Try different sorting methods for variety
    const sortMethods = ["hot", "new", "top", "rising"];
    const randomSort =
      sortMethods[Math.floor(Math.random() * sortMethods.length)];

    // Use oauth.reddit.com for authenticated requests
    let sortUrl = `https://oauth.reddit.com${randomSource.url}${randomSort}.json?limit=100`;
    if (randomSort === "top") {
      const timeParams = ["day", "week", "month", "year"];
      const randomTime =
        timeParams[Math.floor(Math.random() * timeParams.length)];
      sortUrl += `&t=${randomTime}`;
    }

    console.log(`Fetching from: ${sortUrl}`);

    try {
      const response = await fetch(sortUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": this.config.settings.default["user-agent"],
        },
      });

      console.log(`Response status: ${response.status}`);

      if (!response.ok) {
        console.log(
          `Response not OK: ${response.status} ${response.statusText}`
        );
        return null;
      }

      const data = (await response.json()) as RedditResponse;
      console.log(`Total posts fetched: ${data.data.children.length}`);

      const filteredPosts = this.filterPosts(data.data.children);
      console.log(`Posts after filtering: ${filteredPosts.length}`);

      if (filteredPosts.length === 0) {
        console.log("No posts passed filtering");
        return null;
      }

      // Filter out recently shown posts
      const unseenPosts = filteredPosts.filter(
        (post) => !this.recentlyShown.has(post.data.permalink)
      );

      // If all posts have been seen recently, clear the cache and use all filtered posts
      const postsToChooseFrom =
        unseenPosts.length > 0 ? unseenPosts : filteredPosts;
      if (unseenPosts.length === 0) {
        console.log("All posts recently shown, clearing cache for variety");
        this.recentlyShown.clear();
      }

      // Pick a random post from available results
      const selectedPost =
        postsToChooseFrom[Math.floor(Math.random() * postsToChooseFrom.length)];

      // Track this post as recently shown
      this.recentlyShown.add(selectedPost.data.permalink);

      // Keep the recent cache from growing too large
      if (this.recentlyShown.size > this.maxRecentlyShown) {
        const firstItem = this.recentlyShown.values().next().value;
        if (firstItem) {
          this.recentlyShown.delete(firstItem);
        }
      }

      return {
        url: selectedPost.data.url,
        author: `u/${selectedPost.data.author}`,
        title: selectedPost.data.title,
        sourceUrl: `https://reddit.com${selectedPost.data.permalink}`,
        sourceName: `${randomSource.name} (sort by ${randomSort})`,
      };
    } catch (error) {
      console.error(`Reddit handler error for ${randomSource.name}:`, error);
      return null;
    }
  }

  private filterPosts(posts: RedditPost[]): RedditPost[] {
    const allowedExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
    const ralseiKeywords = ["ralsei", "goat boy", "fluffy boy", "prince"];

    return posts.filter((post) => {
      if (post.data.over_18) return false;
      if (post.data.is_self) return false;

      const hasImageExtension =
        allowedExtensions.some((ext) =>
          post.data.url.toLowerCase().includes(`.${ext}`)
        ) || post.data.url.includes("i.redd.it");

      if (!hasImageExtension) return false;

      // Must mention Ralsei in title
      const titleLower = post.data.title.toLowerCase();
      const hasRalseiKeyword = ralseiKeywords.some((keyword) =>
        titleLower.includes(keyword.toLowerCase())
      );

      if (!hasRalseiKeyword && !post.data.url.includes("ralsei")) {
        return false;
      }

      return true;
    });
  }
}
