import { Client, ActivityType } from 'discord.js';
import statuses from '../../static/statuses';

interface StatusConfig {
  type: number;
  text: string;
}

export function startRotatingStatus(client: Client, intervalMs = 30000) {
  let FinStatuses = statuses as StatusConfig[];

  const rotateStatus = () => {
    try {
      const currentStatus = FinStatuses[i % FinStatuses.length];
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
