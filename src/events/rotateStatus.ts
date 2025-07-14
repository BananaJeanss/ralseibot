import { Client, ActivityType } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface StatusConfig {
  type: number;
  text: string;
}

export function startRotatingStatus(client: Client, intervalMs = 30000) {
  let statuses: StatusConfig[] = [];
  
  try {
    const statusesPath = path.join(__dirname, 'statuses.json');
    const statusesData = fs.readFileSync(statusesPath, 'utf8');
    statuses = JSON.parse(statusesData);
  } catch (error) {
    console.error('Error loading statuses.json, using fallback:', error);
    statuses = [
      { type: ActivityType.Playing, text: 'with Ralsei' },
      { type: ActivityType.Watching, text: 'the stars' },
      { type: ActivityType.Playing, text: 'DELTARUNE' },
      { type: ActivityType.Listening, text: 'Cool Mixtape' },
    ];
  }

  const rotateStatus = () => {
    try {
      const currentStatus = statuses[i % statuses.length];
      client.user?.setActivity(currentStatus.text, {
        type: currentStatus.type as ActivityType,
      });
    } catch (error) {
      console.error('Error setting activity:', error);
    }
  };

  let i = 0;
  rotateStatus(); // Set initial status
  setInterval(() => {
    rotateStatus();
    i++;
  }, intervalMs);
}
