/**
 * Audit logging for compliance and tracking
 */

export interface AuditLogEntry {
  id?: string;
  userId: string;
  action: string;
  resource: string;
  timestamp?: number;
  input?: any;
  output?: any;
  metadata?: Record<string, any>;
  success?: boolean;
  error?: string;
}

export interface AuditLogQuery {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditLoggerOptions {
  storage?: {
    type: 'memory' | 'database' | 'file';
    config?: Record<string, any>;
  };
  retention?: {
    days: number;
    autoCleanup?: boolean;
  };
  fields?: {
    userId?: boolean;
    action?: boolean;
    resource?: boolean;
    timestamp?: boolean;
    ip?: boolean;
    userAgent?: boolean;
    input?: boolean;
    output?: boolean;
  };
  onLog?: (entry: AuditLogEntry) => void;
}

export class AuditLogger {
  private logs: AuditLogEntry[] = [];
  private cleanupTimer?: NodeJS.Timeout;

  constructor(private options: AuditLoggerOptions = {}) {
    if (options.retention?.autoCleanup) {
      this.startCleanup();
    }
  }

  async log(entry: AuditLogEntry): Promise<void> {
    const fullEntry: AuditLogEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: entry.timestamp || Date.now(),
      success: entry.success ?? true,
    };

    // Filter fields based on configuration
    const fields = this.options.fields || {};
    const filteredEntry: AuditLogEntry = {
      id: fullEntry.id,
      userId: fields.userId !== false ? fullEntry.userId : '',
      action: fields.action !== false ? fullEntry.action : '',
      resource: fields.resource !== false ? fullEntry.resource : '',
      timestamp: fields.timestamp !== false ? fullEntry.timestamp : undefined,
    };

    if (fields.input !== false && fullEntry.input) {
      filteredEntry.input = fullEntry.input;
    }

    if (fields.output !== false && fullEntry.output) {
      filteredEntry.output = fullEntry.output;
    }

    if (fullEntry.metadata) {
      filteredEntry.metadata = fullEntry.metadata;
    }

    if (fullEntry.error) {
      filteredEntry.error = fullEntry.error;
      filteredEntry.success = false;
    }

    // Store the log
    this.logs.push(filteredEntry);

    // Notify callback
    this.options.onLog?.(filteredEntry);
  }

  async query(query: AuditLogQuery = {}): Promise<AuditLogEntry[]> {
    let results = [...this.logs];

    // Filter by userId
    if (query.userId) {
      results = results.filter((log) => log.userId === query.userId);
    }

    // Filter by action
    if (query.action) {
      results = results.filter((log) => log.action === query.action);
    }

    // Filter by resource
    if (query.resource) {
      results = results.filter((log) => log.resource === query.resource);
    }

    // Filter by date range
    if (query.startDate) {
      const startTime = query.startDate.getTime();
      results = results.filter((log) => (log.timestamp || 0) >= startTime);
    }

    if (query.endDate) {
      const endTime = query.endDate.getTime();
      results = results.filter((log) => (log.timestamp || 0) <= endTime);
    }

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    results = results.slice(offset, offset + limit);

    return results;
  }

  async export(path: string, options: { format?: 'json' | 'csv'; startDate?: Date; endDate?: Date } = {}): Promise<void> {
    const logs = await this.query({
      startDate: options.startDate,
      endDate: options.endDate,
    });

    const format = options.format || 'json';

    if (format === 'json') {
      console.log(`Exporting ${logs.length} audit logs to ${path} (JSON)`);
      // In a real implementation, write to file
      console.log(JSON.stringify(logs, null, 2));
    } else if (format === 'csv') {
      console.log(`Exporting ${logs.length} audit logs to ${path} (CSV)`);
      // In a real implementation, convert to CSV and write to file
      const csv = this.convertToCSV(logs);
      console.log(csv);
    }
  }

  private convertToCSV(logs: AuditLogEntry[]): string {
    if (logs.length === 0) {
      return '';
    }

    const headers = ['id', 'userId', 'action', 'resource', 'timestamp', 'success'];
    const rows = logs.map((log) => [
      log.id,
      log.userId,
      log.action,
      log.resource,
      log.timestamp,
      log.success,
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }

  private startCleanup(): void {
    const interval = 24 * 60 * 60 * 1000; // Daily
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, interval);
  }

  private cleanup(): void {
    if (!this.options.retention) {
      return;
    }

    const retentionMs = this.options.retention.days * 24 * 60 * 60 * 1000;
    const cutoffTime = Date.now() - retentionMs;

    this.logs = this.logs.filter((log) => (log.timestamp || 0) >= cutoffTime);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }
}

export function createAuditLogger(options?: AuditLoggerOptions): AuditLogger {
  return new AuditLogger(options);
}

