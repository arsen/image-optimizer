export interface OptimizeResult {
  src: string;
  dest: string;
  srcSize: number;
  destSize: number;
  savings: number;
  savingsPercent: number;
}

export interface AuditEntry extends OptimizeResult {
  aboveThreshold: boolean;
}

export interface BatchResult {
  files: OptimizeResult[];
  totalSrcSize: number;
  totalDestSize: number;
  totalSavings: number;
  totalSavingsPercent: number;
}

export interface OptimizeOptions {
  quality?: number;
  force?: boolean;
  silent?: boolean;
  concurrency?: number;
}

export interface AuditOptions extends OptimizeOptions {
  threshold: number;
}

export interface ImageFormatPlugin {
  name: string;
  extensions: string[];
  optimize(src: string, dest: string, options?: OptimizeOptions): Promise<void>;
}
