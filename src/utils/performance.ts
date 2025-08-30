// Performance monitoring utility

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private marks: Map<string, number> = new Map();
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Mark the start of a performance measurement
  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  // Measure the time between mark and now
  measure(name: string, logResult = true): number {
    const startTime = this.marks.get(name);
    if (!startTime) {
      console.warn(`No mark found for ${name}`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    
    if (logResult && process.env.NODE_ENV === 'development') {
      console.warn(`⚡ ${name}: ${duration.toFixed(2)}ms`);
    }
    
    this.marks.delete(name);
    return duration;
  }

  // Log Core Web Vitals
  logWebVitals(): void {
    if ('PerformanceObserver' in window) {
      // First Contentful Paint
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            console.warn(`⚡ FCP: ${entry.startTime.toFixed(2)}ms`);
          }
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.warn(`⚡ LCP: ${lastEntry.startTime.toFixed(2)}ms`);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    }
  }
}

// Debounce function for performance
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {clearTimeout(timeout);}
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for scroll events
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function(this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Request idle callback polyfill
export const requestIdleCallback = 
  window.requestIdleCallback ||
  ((callback: IdleRequestCallback) => {
    const start = Date.now();
    return setTimeout(() => {
      callback({
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
      } as IdleDeadline);
    }, 1);
  });

// Defer non-critical work
export function deferWork(callback: () => void): void {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback);
  } else {
    setTimeout(callback, 0);
  }
}

// Image optimization helper
export function getOptimizedImageUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png';
  } = {}
): string {
  // For Supabase Storage, add transformation params
  if (url.includes('supabase')) {
    const params = new URLSearchParams();
    if (options.width) {params.append('width', options.width.toString());}
    if (options.height) {params.append('height', options.height.toString());}
    if (options.quality) {params.append('quality', options.quality.toString());}
    
    return `${url}?${params.toString()}`;
  }
  
  return url;
}

// Batch API calls
export class BatchQueue<T> {
  private queue: Array<{ id: string; resolver: (value: T) => void }> = [];
  private timeout: NodeJS.Timeout | null = null;
  private batchProcessor: (ids: string[]) => Promise<Map<string, T>>;
  private delay: number;
  
  constructor(
    batchProcessor: (ids: string[]) => Promise<Map<string, T>>,
    delay = 50
  ) {
    this.batchProcessor = batchProcessor;
    this.delay = delay;
  }
  
  async add(id: string): Promise<T> {
    return new Promise((resolve) => {
      this.queue.push({ id, resolver: resolve });
      
      if (this.timeout) {clearTimeout(this.timeout);}
      
      this.timeout = setTimeout(() => {
        this.processBatch();
      }, this.delay);
    });
  }
  
  private async processBatch(): Promise<void> {
    const batch = [...this.queue];
    this.queue = [];
    
    if (batch.length === 0) {return;}
    
    try {
      const ids = batch.map(item => item.id);
      const results = await this.batchProcessor(ids);
      
      batch.forEach(({ id, resolver }) => {
        const result = results.get(id);
        if (result !== undefined) {
          resolver(result);
        }
      });
    } catch (error) {
      console.error('Batch processing error:', error);
    }
  }
}

export const perf = PerformanceMonitor.getInstance();
