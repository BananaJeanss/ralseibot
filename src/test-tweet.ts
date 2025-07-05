import { config } from 'dotenv';
config();
import { TwitterHandler } from './handlers/twitter';

async function main() {
  const handler = TwitterHandler.getInstance();
  const tweet = await handler.fetchTweet();
  if (!tweet) {
    console.log('No tweet returned');
  } else {
    console.log('✅ TweetResult:', tweet);
  }
}

main().catch(console.error);