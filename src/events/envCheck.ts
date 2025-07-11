// validate env

import { config } from 'dotenv';

config();

export function envCheck() {
  const requiredEnvVars = [
    'DISCORD_BOT_TOKEN',
    'DISCORD_CLIENT_ID',
  ];
    const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
    if (missingEnvVars.length > 0) {
        console.error('Missing required environment variables:', missingEnvVars.join(', '));
        process.exit(1);
        }
    console.log('⚙️  envCheck Passed');
    return true;
}