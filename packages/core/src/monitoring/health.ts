/**
 * Health check system for production monitoring
 */

export type HealthStatus = 'healthy' | 'unhealthy' | 'degraded';

export interface HealthCheckResult {
  healthy: boolean;
  status?: HealthStatus;
  message?: string;
  error?: string;
  timestamp?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface HealthCheck {
  (): Promise<HealthCheckResult>;
}

export interface HealthCheckerOptions {
  checks: Record<string, HealthCheck>;
  timeout?: number;
  interval?: number;
  onHealthChange?: (health: HealthReport) => void;
  onCheckFail?: (name: string, error: Error) => void;
}

export interface HealthReport {
  healthy: boolean;
  status: HealthStatus;
  timestamp: number;
  checks: Record<string, HealthCheckResult>;
  uptime: number;
}

export class HealthChecker {
  private checkTimer?: NodeJS.Timeout;
  private lastReport?: HealthReport;
  private startTime = Date.now();
  private running = false;

  constructor(private options: HealthCheckerOptions) {}

  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    const interval = this.options.interval || 30000;

    // Run initial check
    this.runChecks().catch((error) => {
      console.error('Initial health check failed:', error);
    });

    // Schedule periodic checks
    this.checkTimer = setInterval(() => {
      this.runChecks().catch((error) => {
        console.error('Health check failed:', error);
      });
    }, interval);
  }

  stop(): void {
    if (!this.running) {
      return;
    }

    this.running = false;

    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = undefined;
    }
  }

  async getHealth(): Promise<HealthReport> {
    if (!this.lastReport) {
      return this.runChecks();
    }
    return this.lastReport;
  }

  async getLiveness(): Promise<HealthCheckResult> {
    // Liveness probe - is the app running?
    return {
      healthy: true,
      status: 'healthy',
      message: 'Application is running',
      timestamp: Date.now(),
    };
  }

  async getReadiness(): Promise<HealthReport> {
    // Readiness probe - is the app ready to serve traffic?
    return this.getHealth();
  }

  private async runChecks(): Promise<HealthReport> {
    const timeout = this.options.timeout || 5000;
    const results: Record<string, HealthCheckResult> = {};

    // Run all checks in parallel
    const checkPromises = Object.entries(this.options.checks).map(async ([name, check]) => {
      const startTime = Date.now();
      try {
        const result = await Promise.race([
          check(),
          new Promise<HealthCheckResult>((_, reject) =>
            setTimeout(() => reject(new Error('Health check timeout')), timeout)
          ),
        ]);

        results[name] = {
          ...result,
          timestamp: Date.now(),
          duration: Date.now() - startTime,
        };
      } catch (error) {
        const errorMessage = (error as Error).message;
        results[name] = {
          healthy: false,
          status: 'unhealthy',
          error: errorMessage,
          timestamp: Date.now(),
          duration: Date.now() - startTime,
        };
        this.options.onCheckFail?.(name, error as Error);
      }
    });

    await Promise.all(checkPromises);

    // Determine overall health
    const allHealthy = Object.values(results).every((r) => r.healthy);
    const anyUnhealthy = Object.values(results).some((r) => r.status === 'unhealthy');
    const status: HealthStatus = allHealthy ? 'healthy' : anyUnhealthy ? 'unhealthy' : 'degraded';

    const report: HealthReport = {
      healthy: allHealthy,
      status,
      timestamp: Date.now(),
      checks: results,
      uptime: Date.now() - this.startTime,
    };

    // Notify if health changed
    if (this.lastReport && this.lastReport.healthy !== report.healthy) {
      this.options.onHealthChange?.(report);
    }

    this.lastReport = report;
    return report;
  }
}

export function createHealthChecker(options: HealthCheckerOptions): HealthChecker {
  return new HealthChecker(options);
}

