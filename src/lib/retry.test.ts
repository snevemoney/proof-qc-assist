import { describe, expect, it } from 'vitest';
import { isRetryableStatus, withRetry } from './retry';

describe('retry', () => {
  it('retries retryable failures then succeeds', async () => {
    let attempts = 0;
    const result = await withRetry(
      async () => {
        attempts += 1;
        if (attempts < 3) {
          throw new Error('transient');
        }
        return 'ok';
      },
      { maxRetries: 2, baseDelayMs: 1, maxDelayMs: 1 }
    );

    expect(result).toBe('ok');
    expect(attempts).toBe(3);
  });

  it('does not retry when isRetryable is false', async () => {
    const err = Object.assign(new Error('nope'), { isRetryable: false });
    let attempts = 0;

    await expect(
      withRetry(
        async () => {
          attempts += 1;
          throw err;
        },
        { maxRetries: 2, baseDelayMs: 1, maxDelayMs: 1 }
      )
    ).rejects.toThrow('nope');

    expect(attempts).toBe(1);
  });

  it('classifies retryable HTTP statuses', () => {
    expect(isRetryableStatus(429)).toBe(true);
    expect(isRetryableStatus(503)).toBe(true);
    expect(isRetryableStatus(401)).toBe(false);
    expect(isRetryableStatus(400)).toBe(false);
  });
});
