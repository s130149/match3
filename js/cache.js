export function getCachedData(key, duration = 24 * 60 * 60 * 1000) {
  const cached = localStorage.getItem(key);
  if (!cached) return null;

  const parsed = JSON.parse(cached);
  const isExpired = Date.now() - parsed.timestamp > duration;

  if (isExpired) {
    localStorage.removeItem(key);
    return null;
  }
  return parsed.data;
}

export function saveToCache(key, data) {
  localStorage.setItem(key, JSON.stringify({
    data: data,
    timestamp: Date.now()
  }));
}