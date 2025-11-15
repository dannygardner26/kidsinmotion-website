/**
 * Shared utility functions for formatting event data
 */

/**
 * Format date string without timezone issues
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @param {Object} options - Formatting options (optional)
 * @returns {string} Formatted date string
 */
export const formatEventDate = (dateString, options = {}) => {
  if (!dateString) return 'No date';

  try {
    // Add T00:00:00 to ensure local timezone interpretation
    // This prevents the timezone offset issue where dates show as 1 day behind
    const date = new Date(dateString + 'T00:00:00');

    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return 'Invalid date';
  }
};

/**
 * Format date and time together
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @param {string} startTime - Start time (optional)
 * @param {string} endTime - End time (optional)
 * @returns {string} Formatted date and time string
 */
export const formatEventDateTime = (dateString, startTime, endTime) => {
  let formattedDate = formatEventDate(dateString, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  if (startTime) {
    try {
      // Ensure time is in proper format for parsing
      let timeString = startTime.toString();
      if (timeString.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
        if (timeString.split(':').length === 2) {
          timeString = timeString + ':00';
        }
        const timeDate = new Date(`2000-01-01T${timeString}`);
        const formattedStartTime = timeDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit'
        });

        if (endTime && endTime !== startTime) {
          let endTimeString = endTime.toString();
          if (endTimeString.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
            if (endTimeString.split(':').length === 2) {
              endTimeString = endTimeString + ':00';
            }
            const endTimeDate = new Date(`2000-01-01T${endTimeString}`);
            const formattedEndTime = endTimeDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit'
            });
            formattedDate += ` from ${formattedStartTime} to ${formattedEndTime}`;
          }
        } else {
          formattedDate += ` at ${formattedStartTime}`;
        }
      }
    } catch (error) {
      console.error('Error formatting time:', startTime, endTime, error);
    }
  }

  return formattedDate;
};

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