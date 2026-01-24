/**
 * Format a date as relative time (e.g., "2m ago", "1h ago", "Yesterday")
 * Supports both English and French
 */
export function formatRelativeTime(date: Date, language: 'en' | 'fr' = 'en'): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return language === 'fr' ? 'à l\'instant' : 'just now';
  }

  if (diffMinutes < 60) {
    return language === 'fr' 
      ? `il y a ${diffMinutes}m` 
      : `${diffMinutes}m ago`;
  }

  if (diffHours < 24) {
    return language === 'fr'
      ? `il y a ${diffHours}h`
      : `${diffHours}h ago`;
  }

  if (diffDays === 1) {
    const timeStr = formatTime(date, language);
    return language === 'fr'
      ? `Hier à ${timeStr}`
      : `Yesterday at ${timeStr}`;
  }

  if (diffDays < 7) {
    const timeStr = formatTime(date, language);
    const dayName = formatDayName(date, language);
    return language === 'fr'
      ? `${dayName} à ${timeStr}`
      : `${dayName} at ${timeStr}`;
  }

  // More than 7 days ago
  return formatShortDate(date, language);
}

/**
 * Format time as "3:45 PM" or "15:45"
 */
function formatTime(date: Date, language: 'en' | 'fr'): string {
  if (language === 'fr') {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/**
 * Format day name (e.g., "Monday", "Lundi")
 */
function formatDayName(date: Date, language: 'en' | 'fr'): string {
  return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long' });
}

/**
 * Format short date (e.g., "Jan 24" or "24 janv.")
 */
function formatShortDate(date: Date, language: 'en' | 'fr'): string {
  const now = new Date();
  const isSameYear = date.getFullYear() === now.getFullYear();

  if (language === 'fr') {
    const options: Intl.DateTimeFormatOptions = isSameYear
      ? { day: 'numeric', month: 'short' }
      : { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
  }

  const options: Intl.DateTimeFormatOptions = isSameYear
    ? { month: 'short', day: 'numeric' }
    : { month: 'short', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Format full date and time for tooltip
 * e.g., "January 24, 2026 at 3:45 PM" or "24 janvier 2026 à 15:45"
 */
export function formatFullDateTime(date: Date, language: 'en' | 'fr' = 'en'): string {
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  if (language === 'fr') {
    const dateStr = date.toLocaleDateString('fr-FR', dateOptions);
    const timeStr = formatTime(date, 'fr');
    return `${dateStr} à ${timeStr}`;
  }

  const dateStr = date.toLocaleDateString('en-US', dateOptions);
  const timeStr = formatTime(date, 'en');
  return `${dateStr} at ${timeStr}`;
}
