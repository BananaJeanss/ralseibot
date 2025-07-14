// validate env

import { config } from 'dotenv';

config();

export function envCheck() {
  let isWarning = false;
  const requiredEnvVars = [
    'DISCORD_BOT_TOKEN',
    'DISCORD_CLIENT_ID',
  ];
    const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
    if (missingEnvVars.length > 0) {
        console.error('Missing required environment variables:', missingEnvVars.join(', '));
        process.exit(1);
        }
    
    // optional env vars
    if (!process.env.RUN_MODE) {
        console.warn('RUN_MODE is not set, defaulting to "dual"');
        process.env.RUN_MODE = 'dual';
        isWarning = true;
    }

    if (!process.env.EXPRESS_PORT) {
        console.warn('EXPRESS_PORT is not set, defaulting to 3000');
        process.env.EXPRESS_PORT = '3000';
        isWarning = true;
    }

    if (isWarning) {
        console.warn('⚙️⚠️  envCheck Passed with warnings');
    } else {
        console.log('⚙️  envCheck Passed');
    }
    return true;
}