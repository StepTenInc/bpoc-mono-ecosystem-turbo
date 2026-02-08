/**
 * Debug Logger Utility
 * Provides consistent logging across the application
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: unknown;
}

class DebugLogger {
  private enabled: boolean;
  private category: string;

  constructor(category: string) {
    this.category = category;
    this.enabled = process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true';
  }

  private formatMessage(level: LogLevel, message: string, data?: unknown): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      category: this.category,
      message,
      data
    };
  }

  private getIcon(level: LogLevel): string {
    switch (level) {
      case 'info': return 'ℹ️';
      case 'warn': return '⚠️';
      case 'error': return '❌';
      case 'debug': return '🔍';
      default: return '📝';
    }
  }

  info(message: string, data?: unknown): void {
    const entry = this.formatMessage('info', message, data);
    console.log(`${this.getIcon('info')} [${this.category}] ${message}`, data ? data : '');
  }

  warn(message: string, data?: unknown): void {
    const entry = this.formatMessage('warn', message, data);
    console.warn(`${this.getIcon('warn')} [${this.category}] ${message}`, data ? data : '');
  }

  error(message: string, data?: unknown): void {
    const entry = this.formatMessage('error', message, data);
    console.error(`${this.getIcon('error')} [${this.category}] ${message}`, data ? data : '');
  }

  debug(message: string, data?: unknown): void {
    if (!this.enabled) return;
    const entry = this.formatMessage('debug', message, data);
    console.log(`${this.getIcon('debug')} [${this.category}] ${message}`, data ? data : '');
  }

  success(message: string, data?: unknown): void {
    console.log(`✅ [${this.category}] ${message}`, data ? data : '');
  }

  start(operation: string): void {
    console.log(`🚀 [${this.category}] Starting: ${operation}`);
  }

  complete(operation: string, data?: unknown): void {
    console.log(`✅ [${this.category}] Completed: ${operation}`, data ? data : '');
  }
}

export function createLogger(category: string): DebugLogger {
  return new DebugLogger(category);
}

/**
 * Simple function-based debug logger for backward compatibility.
 * Usage: logDebug('category', 'message', optionalData)
 */
export function logDebug(category: string, message: string, data?: unknown): void {
  const logger = new DebugLogger(category);
  logger.debug(message, data);
}

export { DebugLogger };
