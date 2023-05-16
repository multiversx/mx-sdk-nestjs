/**
 * @param ttlSeconds Time to live seconds
 * @param slidingPercentage sliding percentage for example 10% is 0.1
 * @returns jitter in seconds.
 */
export const jitter = (
  ttlSeconds: number,
  slidingPercentage = 0.1,
): number => {
  if (!ttlSeconds) {
    throw Error('ttl is required');
  }
  const ttl = Number(ttlSeconds);
  if (Number.isNaN(ttl)) {
    throw Error(`error occur while trying to apply jitter, ${ttlSeconds} is NaN!`);
  }
  const slidingExpirationFactor = (Math.random() * slidingPercentage * 2) - slidingPercentage; // (0 to 1) * 0.2 - 0.1 --> +-10%
  return ttl + Math.round(ttl * slidingExpirationFactor); // ttl + jitter sliding in second
};
