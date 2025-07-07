import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';
import { chromium } from 'playwright';

export interface TweetResult {
  title: string;
  text: string;
  mediaUrls: string[];
  author: string;
  sourceUrl: string;
  sourceName: string;
}

interface TwitterSource {
  name: string;
  url: string;
  weight?: number;
}

export class TwitterHandler {
  private static instance: TwitterHandler;
  private config: any;

  private constructor() {
    this.loadConfig();
  }

  public static getInstance(): TwitterHandler {
    if (!TwitterHandler.instance) {
      TwitterHandler.instance = new TwitterHandler();
    }
    return TwitterHandler.instance;
  }

  private loadConfig() {
    const configFile = fs.readFileSync(
      path.join(process.cwd(), 'sources.yaml'),
      'utf8',
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
    const username = new URL(src.url).pathname.replace('/', '');

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
      await page.goto(`https://twitter.com/${username}`, {
        waitUntil: 'domcontentloaded',
      });

      // scroll to load more tweets
      for (let i = 0; i < 5; i++) {
        // @ts-expect-error: 'window' is defined in browser context
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await page.waitForTimeout(1000);
      }

      // wait for tweets to render
      await page.waitForSelector('article');

      const tweets = await page.$$eval('article', (articles) =>
        articles.map((article) => {
          // Get main tweet text only
          const textDiv = article.querySelector('div[data-testid="tweetText"]');
          const text = textDiv ? textDiv.innerText : '';
          const linkEl = article.querySelector('a[href*="/status/"]');
          const url = linkEl
            ? `https://twitter.com${linkEl.getAttribute('href')}`
            : '';
          // exclude profile pics
          const mediaUrls = Array.from(article.querySelectorAll('img'))
            .map((img: any) => img.src)
            .filter((src) => src.includes('twimg.com/media'));
          return { text, url, mediaUrls };
        }),
      );

      console.log('Fetched tweets:', JSON.stringify(tweets, null, 2));

      await browser.close();

      // Drop pinned tweet
      const isPinned = tweets[0]?.text?.toLowerCase().includes('pinned');
      const filtered = isPinned ? tweets.slice(1) : tweets;

      const cleaned = filtered.filter(
        (t) =>
          t.text &&
          !t.text.startsWith('RT ') &&
          !t.text.startsWith('@') &&
          t.url,
      );

      const randomTweet = cleaned[Math.floor(Math.random() * cleaned.length)];

      return {
        title: randomTweet.text.split('\n')[0] || '', // first line as a title
        text: randomTweet.text, // full text for desc.
        mediaUrls: randomTweet.mediaUrls || [],
        author: `@${username}`,
        sourceUrl: randomTweet.url || '',
        sourceName: src.name,
      };
    }
 catch (err) {
      console.error(`Twitter handler error for ${username}:`, err);
      await browser.close();
      return null;
    }
  }
}
