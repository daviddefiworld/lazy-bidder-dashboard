/**
 * Utility functions for URL operations
 */

export const truncateUrl = (url: string, maxLen = 60): string => {
  if (url.length <= maxLen) return url;
  return `${url.slice(0, maxLen - 1)}…`;
};

export const getDomainFromUrl = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

export const isUrlFromDomain = (url: string, domain: string): boolean => {
  try {
    const urlDomain = new URL(url).hostname;
    return urlDomain.includes(domain);
  } catch {
    return false;
  }
};
