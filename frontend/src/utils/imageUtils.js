// Google Drive Image Utility
// To get shareable Google Drive links:
// 1. Upload images to Google Drive
// 2. Right-click image -> Get link -> Change to "Anyone with the link"
// 3. Copy the file ID from the URL: https://drive.google.com/file/d/FILE_ID/view
// 4. Use: https://drive.google.com/uc?export=view&id=FILE_ID

export const googleDriveImages = {
  // Add your image URLs here (Google Drive, Google Photos, or direct URLs)
  // For Google Photos: Right-click image → "Open image in new tab" → copy URL
  
  // Default placeholder until you add real images
  default: [
    '/assets/placeholder.png'
  ],
  
  // Add categories for different types of images
  sportsClinics: [
    '/assets/placeholder.png',
    // Example of how to add Google Photos images:
    // Right-click on the image in Google Photos → "Open image in new tab"
    // Then copy the direct image URL (usually starts with lh3.googleusercontent.com)
    // 'https://lh3.googleusercontent.com/pw/ADKREXXXXXXXXX=w1000-h667-s-no'
  ],
  
  teamPhotos: [
    '/assets/placeholder.png'
  ],
  
  events: [
    '/assets/placeholder.png'
  ]
};

// Check if URL is an image (not video)
export const isImageUrl = (url) => {
  if (typeof url !== 'string') return false;
  
  // Check file extension
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
  const lowercaseUrl = url.toLowerCase();
  
  // Check if URL ends with image extension
  const hasImageExtension = imageExtensions.some(ext => lowercaseUrl.includes(ext));
  
  // Check if URL contains video indicators
  const videoIndicators = ['video', '.mp4', '.mov', '.avi', '.webm', '.mkv', '.m4v'];
  const hasVideoIndicator = videoIndicators.some(indicator => lowercaseUrl.includes(indicator));
  
  // For Google Photos, also check for image-specific patterns
  const isGooglePhotosImage = url.includes('googleusercontent.com') && 
                             (hasImageExtension || !hasVideoIndicator);
  
  return hasImageExtension || (isGooglePhotosImage && !hasVideoIndicator);
};

// Convert Google Drive file ID to direct image URL
export const getGoogleDriveImageUrl = (fileId) => {
  if (fileId.startsWith('/') || fileId.startsWith('http')) {
    return fileId; // Return as-is if it's already a full URL or local path
  }
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
};

// Filter out videos and return only images
export const filterImageUrls = (urls) => {
  return urls.filter(isImageUrl);
};

// Get a random image from a category
export const getRandomImage = (category = 'default') => {
  const allImages = googleDriveImages[category] || googleDriveImages.default;
  const images = filterImageUrls(allImages); // Filter out videos
  
  if (images.length === 0) {
    return getGoogleDriveImageUrl('/assets/placeholder.png');
  }
  
  const randomIndex = Math.floor(Math.random() * images.length);
  const selectedImage = images[randomIndex];
  return getGoogleDriveImageUrl(selectedImage);
};

// Cycle through images in order
let imageCounters = {};

export const getNextImage = (category = 'default') => {
  const allImages = googleDriveImages[category] || googleDriveImages.default;
  const images = filterImageUrls(allImages); // Filter out videos
  
  if (images.length === 0) {
    return getGoogleDriveImageUrl('/assets/placeholder.png');
  }
  
  if (!imageCounters[category]) {
    imageCounters[category] = 0;
  }
  
  const selectedImage = images[imageCounters[category]];
  imageCounters[category] = (imageCounters[category] + 1) % images.length;
  
  return getGoogleDriveImageUrl(selectedImage);
};

// Get all images from a category
export const getAllImages = (category = 'default') => {
  const allImages = googleDriveImages[category] || googleDriveImages.default;
  const images = filterImageUrls(allImages); // Filter out videos
  return images.map(getGoogleDriveImageUrl);
};