import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';

interface RedditPost {
    data: {
        title: string;
        url: string;
        author: string;
        permalink: string;
        ups: number;
        is_self: boolean;
        over_18: boolean;
    }
}

interface RedditResponse {
    data: {
        children: RedditPost[];
    }
}

interface ImageResult {
    url: string;
    author: string;
    title: string;
    sourceUrl: string;
    sourceName: string;
}

export class RedditHandler {
    private config: any;
    private recentlyShown: Set<string> = new Set(); // Track recently shown posts
    private maxRecentlyShown: number = 50; // Keep track of last 50 posts

    constructor() {
        this.loadConfig();
    }

    private loadConfig() {
        try {
            const configPath = path.join(process.cwd(), 'sources.yaml');
            const configFile = fs.readFileSync(configPath, 'utf8');
            this.config = yaml.parse(configFile);
        } catch (error) {
            console.error('Failed to load sources.yaml:', error);
            throw error;
        }
    }

    async fetchImage(): Promise<ImageResult | null> {
        const redditSources = this.config.sources.reddit;
        if (!redditSources || redditSources.length === 0) return null;

        // Pick a random subreddit
        const randomSource = redditSources[Math.floor(Math.random() * redditSources.length)];
        
        // Try different sorting methods for variety
        const sortMethods = ['hot', 'new', 'top', 'rising'];
        const randomSort = sortMethods[Math.floor(Math.random() * sortMethods.length)];
        
        // For top, add time parameter for more variety
        let sortUrl = `${randomSource.url}${randomSort}.json?limit=100`;
        if (randomSort === 'top') {
            const timeParams = ['day', 'week', 'month', 'year'];
            const randomTime = timeParams[Math.floor(Math.random() * timeParams.length)];
            sortUrl += `&t=${randomTime}`;
        }
        
        try {
            const response = await fetch(sortUrl, {
                headers: {
                    'User-Agent': this.config.settings.default['user-agent'],
                },
            });

            if (!response.ok) return null;

            const data = await response.json() as RedditResponse;
            const filteredPosts = this.filterPosts(data.data.children);
            
            if (filteredPosts.length === 0) return null;

            // Filter out recently shown posts
            const unseenPosts = filteredPosts.filter(post => 
                !this.recentlyShown.has(post.data.permalink)
            );

            // If all posts have been seen recently, clear the cache and use all filtered posts
            const postsToChooseFrom = unseenPosts.length > 0 ? unseenPosts : filteredPosts;
            if (unseenPosts.length === 0) {
                console.log('All posts recently shown, clearing cache for variety');
                this.recentlyShown.clear();
            }

            // Pick a random post from available results
            const selectedPost = postsToChooseFrom[Math.floor(Math.random() * postsToChooseFrom.length)];

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
                sourceName: `${randomSource.name} (${randomSort})`,
            };

        } catch (error) {
            console.error(`Reddit handler error for ${randomSource.name}:`, error);
            return null;
        }
    }

    private filterPosts(posts: RedditPost[]): RedditPost[] {
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        const ralseiKeywords = ['ralsei', 'goat boy', 'fluffy boy', 'prince'];

        return posts.filter(post => {
            if (post.data.over_18) return false;
            if (post.data.is_self) return false;

            const hasImageExtension = allowedExtensions.some(ext => 
                post.data.url.toLowerCase().includes(`.${ext}`)
            );
            if (!hasImageExtension) return false;

            // Must mention Ralsei in title
            const titleLower = post.data.title.toLowerCase();
            const hasRalseiKeyword = ralseiKeywords.some(keyword => 
                titleLower.includes(keyword.toLowerCase())
            );
            
            if (!hasRalseiKeyword && !post.data.url.includes('ralsei')) {
                return false;
            }

            return true;
        });
    }
}