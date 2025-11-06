/**
 * Shared utility functions for formatting event data
 */

/**
 * Format age range for display based on event data
 * @param {Object} event - Event object containing age information
 * @param {Object} options - Formatting options
 * @param {boolean} options.includePrefix - Whether to include "Ages" prefix (default: true)
 * @returns {string} Formatted age range string
 */
export const formatAgeRange = (event, options = {}) => {
  const { includePrefix = true } = options;

  if (!event) {
    return includePrefix ? 'All ages' : 'All Ages';
  }

  const prefix = includePrefix ? 'Ages ' : '';

  // Check for new min/max age system
  if (event.minAge != null && event.maxAge != null) {
    return `${prefix}${event.minAge}-${event.maxAge}`;
  }

  if (event.minAge != null && event.maxAge == null) {
    return `${prefix}${event.minAge}+`;
  }

  if (event.minAge == null && event.maxAge != null) {
    return includePrefix ? `Ages up to ${event.maxAge}` : `up to ${event.maxAge}`;
  }

  // Fallback to legacy ageGroup if available
  if (event.ageGroup && event.ageGroup.trim()) {
    return event.ageGroup;
  }

  // Default case
  return includePrefix ? 'All ages' : 'All Ages';
};