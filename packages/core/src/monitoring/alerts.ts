/**
 * Alert system for production monitoring
 */

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface Alert {
  name: string;
  severity: AlertSeverity;
  message: string;
  timestamp?: number;
  data?: Record<string, any>;
}

export interface AlertChannel {
  type: string;
  config: Record<string, any>;
}

export interface AlertRule {
  name: string;
  condition: (metrics: any) => boolean;
  severity: AlertSeverity;
  channels: string[];
  throttle?: number;
  message?: string;
}

export interface AlertManagerOptions {
  channels: Record<string, AlertChannel>;
  rules?: AlertRule[];
  onAlert?: (alert: Alert) => void;
}

export class AlertManager {
  private lastAlertTime = new Map<string, number>();
  private monitorTimer?: NodeJS.Timeout;
  private running = false;

  constructor(private options: AlertManagerOptions) {}

  start(metrics?: () => any, interval = 60000): void {
    if (this.running || !metrics) {
      return;
    }

    this.running = true;

    this.monitorTimer = setInterval(() => {
      const currentMetrics = metrics();
      this.checkRules(currentMetrics);
    }, interval);
  }

  stop(): void {
    if (!this.running) {
      return;
    }

    this.running = false;

    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
      this.monitorTimer = undefined;
    }
  }

  async alert(alert: Alert): Promise<void> {
    const fullAlert: Alert = {
      ...alert,
      timestamp: alert.timestamp || Date.now(),
    };

    // Check throttling
    if (this.isThrottled(alert.name)) {
      return;
    }

    // Update last alert time
    this.lastAlertTime.set(alert.name, Date.now());

    // Notify callback
    this.options.onAlert?.(fullAlert);

    // Send to all channels (in a real implementation)
    console.log(`[ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`, alert.data);
  }

  private checkRules(metrics: any): void {
    if (!this.options.rules) {
      return;
    }

    for (const rule of this.options.rules) {
      try {
        if (rule.condition(metrics)) {
          this.alert({
            name: rule.name,
            severity: rule.severity,
            message: rule.message || `Alert triggered: ${rule.name}`,
            data: { metrics },
          });
        }
      } catch (error) {
        console.error(`Error checking rule ${rule.name}:`, error);
      }
    }
  }

  private isThrottled(name: string): boolean {
    const rule = this.options.rules?.find((r) => r.name === name);
    if (!rule?.throttle) {
      return false;
    }

    const lastTime = this.lastAlertTime.get(name);
    if (!lastTime) {
      return false;
    }

    return Date.now() - lastTime < rule.throttle;
  }

  async sendToChannel(channelName: string, alert: Alert): Promise<void> {
    const channel = this.options.channels[channelName];
    if (!channel) {
      throw new Error(`Channel not found: ${channelName}`);
    }

    // In a real implementation, send to the actual channel
    switch (channel.type) {
      case 'email':
        console.log(`[EMAIL] Sending alert to ${channel.config.to}:`, alert);
        break;
      case 'slack':
        console.log(`[SLACK] Sending alert to ${channel.config.webhookUrl}:`, alert);
        break;
      case 'webhook':
        console.log(`[WEBHOOK] Sending alert to ${channel.config.url}:`, alert);
        break;
      default:
        console.log(`[${channel.type.toUpperCase()}] Sending alert:`, alert);
    }
  }

  getAlertHistory(name?: string, limit = 100): Alert[] {
    // In a real implementation, return from storage
    return [];
  }

  clearAlertHistory(name?: string): void {
    if (name) {
      this.lastAlertTime.delete(name);
    } else {
      this.lastAlertTime.clear();
    }
  }
}

export function createAlertManager(options: AlertManagerOptions): AlertManager {
  return new AlertManager(options);
}

