import { storage } from '../firebaseConfig';
import { ref, getDownloadURL } from 'firebase/storage';

// Firebase Storage URLs for your uploaded assets
export const getAssetUrl = async (fileName) => {
  try {
    const imageRef = ref(storage, fileName);
    const url = await getDownloadURL(imageRef);
    return url;
  } catch (error) {
    console.error(`Error getting URL for ${fileName}:`, error);
    return '/assets/placeholder.png'; // fallback
  }
};

// Firebase Storage URLs converted to public HTTPS URLs
export const assetUrls = {
  'about-hero.jpg': 'https://firebasestorage.googleapis.com/v0/b/kids-in-motion-website-b1c09.firebasestorage.app/o/IMG_2338.JPG?alt=media',
  'about-purpose.jpg': 'https://firebasestorage.googleapis.com/v0/b/kids-in-motion-website-b1c09.firebasestorage.app/o/IMG_2341.JPG?alt=media',
  'danny-profile.jpg': 'https://firebasestorage.googleapis.com/v0/b/kids-in-motion-website-b1c09.firebasestorage.app/o/danny-profile.jpg?alt=media',
  'kids-with-mentors.jpg': 'https://firebasestorage.googleapis.com/v0/b/kids-in-motion-website-b1c09.firebasestorage.app/o/IMG_2344.JPG?alt=media',
  'nate-profile-new.jpg': 'https://firebasestorage.googleapis.com/v0/b/kids-in-motion-website-b1c09.firebasestorage.app/o/nate-profile-new.jpg?alt=media',
  'placeholder.png': 'https://firebasestorage.googleapis.com/v0/b/kids-in-motion-website-b1c09.firebasestorage.app/o/placeholder.png?alt=media',
  'ryan-profile-new.jpg': 'https://firebasestorage.googleapis.com/v0/b/kids-in-motion-website-b1c09.firebasestorage.app/o/ryan-profile-new.jpg?alt=media',
  'team-huddle.jpg': 'https://firebasestorage.googleapis.com/v0/b/kids-in-motion-website-b1c09.firebasestorage.app/o/IMG_2343.JPG?alt=media',
  'ty-profile.jpg': 'https://firebasestorage.googleapis.com/v0/b/kids-in-motion-website-b1c09.firebasestorage.app/o/ty-profile.jpg?alt=media',
  'volunteers-group.jpg': 'https://firebasestorage.googleapis.com/v0/b/kids-in-motion-website-b1c09.firebasestorage.app/o/IMG_2345.JPG?alt=media',
  'realKIMlogo-transparent.png': 'https://firebasestorage.googleapis.com/v0/b/kids-in-motion-website-b1c09.firebasestorage.app/o/realKIMlogo-transparent.png?alt=media'
};

// Function to generate all URLs
export const generateAllUrls = async () => {
  const urls = {};
  for (const fileName of Object.keys(assetUrls)) {
    urls[fileName] = await getAssetUrl(fileName);
  }
  console.log('Generated Firebase URLs:', urls);
  return urls;
};