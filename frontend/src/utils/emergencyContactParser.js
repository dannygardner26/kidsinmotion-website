/**
 * Utility function to parse emergency contact information from a string
 * Supports international phone number formats
 *
 * @param {string} contact - The emergency contact string to parse
 * @returns {Object} An object with name and phone properties
 */
export const parseEmergencyContact = (contact) => {
  if (!contact) return { name: '', phone: '' };

  // Enhanced phone pattern for international formats
  // Matches: +1-555-123-4567, +44 20 7946 0958, (555) 123-4567, 555-123-4567, etc.
  const phonePattern = /(\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{0,4})/;
  const phoneMatch = contact.match(phonePattern);

  if (phoneMatch) {
    const phone = phoneMatch[0];
    const name = contact.replace(phoneMatch[0], '').replace(/[-,\s]+/g, ' ').trim();

    // Validate the extracted phone has at least 7 digits (minimum for most phone numbers)
    const digitCount = phone.replace(/\D/g, '').length;
    if (digitCount >= 7) {
      return { name: name || 'Emergency Contact', phone };
    }
  }

  // If no valid phone detected, treat as name only
  return { name: contact, phone: '' };
};