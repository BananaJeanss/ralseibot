import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";
import { Scraper, Tweet } from "@the-convocation/twitter-scraper";

export interface TweetResult {
  text: string;
  mediaUrls: string[];
  author: string;
  sourceUrl: string;
  sourceName: string;
}

// shape of each entry in sources.yaml twitter list
interface TwitterSource {
  name: string;
  url: string;
  weight?: number;
}

export class TwitterHandler {
  private static instance: TwitterHandler;
  private config: any;
  private scraper: Scraper;

  private constructor() {
    this.loadConfig();
    const settings = this.config.settings.default;

    const baseHeaders: Record<string, string> = {
      ...settings.headers,
      "User-Agent": settings["user-agent"],
      ...(process.env.TWITTER_BEARER_TOKEN
        ? { Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}` }
        : {}),
    };

    this.scraper = new Scraper({
      // now only known ScraperOptions keys
      transform: {
        request(input: RequestInfo | URL, init?: RequestInit) {
          // merge our base headers with any per‐request headers
          const headers = {
            ...((init?.headers as Record<string, string>) || {}),
            ...baseHeaders,
          };
          return [input, { ...init, headers }];
        },
      },
    });
  }

  public static getInstance(): TwitterHandler {
    if (!TwitterHandler.instance) {
      TwitterHandler.instance = new TwitterHandler();
    }
    return TwitterHandler.instance;
  }

  private loadConfig() {
    const configFile = fs.readFileSync(
      path.join(process.cwd(), "sources.yaml"),
      "utf8"
    );
    this.config = yaml.parse(configFile);
  }

  private weightedRandom<T extends { weight?: number }>(sources: T[]): T {
    const total = sources.reduce((sum, s) => sum + (s.weight || 1), 0);
    let r = Math.random() * total;
    for (const s of sources) {
      r -= s.weight || 1;
      if (r <= 0) return s;
    }
    return sources[sources.length - 1];
  }

  public async fetchTweet(): Promise<TweetResult | null> {
    const twitterSources: TwitterSource[] = this.config.sources.twitter;
    if (!twitterSources?.length) return null;

    const src = this.weightedRandom(twitterSources);
    const username = new URL(src.url).pathname.replace("/", "");

    try {
      const tweetGen = this.scraper.getTweets(username, 50);

      const tweets: Tweet[] = [];
      for await (const tweet of tweetGen) {
        tweets.push(tweet);
      }

      const originals = tweets.filter(
        (t) => t.text && !t.text.startsWith("RT ") && !t.text.startsWith("@")
      );
      if (!originals.length) return null;

      const tw = originals[Math.floor(Math.random() * originals.length)];

      return {
        text: tw.text || "",
        mediaUrls: [],
        author: `@${username}`,
        sourceUrl: `https://twitter.com/${username}/status/${tw.id}`,
        sourceName: src.name,
      };
    } catch (err) {
      console.error(`Twitter handler error for ${username}:`, err);
      return null;
    }
  }
}
