/**
 * Debounce utility for file watching
 * Delays function execution until after a specified delay has elapsed
 * since the last time it was invoked
 */

/**
 * Debouncer class for delaying function execution
 *
 * @example
 * ```ts
 * const debouncer = new Debouncer(() => console.log("called"), 500);
 * debouncer.trigger(); // Will call after 500ms
 * debouncer.trigger(); // Resets timer, will call 500ms from now
 * ```
 */
export class Debouncer<T extends (...args: any[]) => void> {
  private timer: number | null = null;
  private fn: T;
  private delay: number;
  private lastArgs: Parameters<T> | null = null;

  /**
   * Create a new Debouncer
   * @param fn - Function to debounce
   * @param delay - Delay in milliseconds
   */
  constructor(fn: T, delay: number) {
    this.fn = fn;
    this.delay = delay;
  }

  /**
   * Trigger the debounced function
   * Resets the timer on each call
   * @param args - Arguments to pass to the function
   */
  trigger(...args: Parameters<T>): void {
    // Store the latest arguments
    this.lastArgs = args;

    // Clear existing timer
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }

    // Set new timer
    this.timer = setTimeout(() => {
      this.timer = null;
      if (this.lastArgs !== null) {
        this.fn(...this.lastArgs);
        this.lastArgs = null;
      }
    }, this.delay);
  }

  /**
   * Immediately execute the function and cancel pending timer
   */
  flush(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.lastArgs !== null) {
      this.fn(...this.lastArgs);
      this.lastArgs = null;
    }
  }

  /**
   * Cancel pending execution
   */
  cancel(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.lastArgs = null;
  }
}