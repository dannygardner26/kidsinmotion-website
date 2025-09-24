import { storage } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { readFileSync } from 'fs';
import path from 'path';

// List of all your assets
const assetFiles = [
  'about-hero.jpg',
  'about-purpose.jpg',
  'danny-profile.jpg',
  'kids-with-mentors.jpg',
  'nate-profile.jpg',
  'nate-profile-new.jpg',
  'placeholder.png',
  'ryan-profile.jpg',
  'ryan-profile-new.jpg',
  'team-huddle.jpg',
  'ty-profile.jpg',
  'volunteers-group.jpg'
];

// Function to upload a single file to Firebase Storage
export const uploadAssetToFirebase = async (fileName, fileBuffer) => {
  try {
    const storageRef = ref(storage, `assets/${fileName}`);
    const snapshot = await uploadBytes(storageRef, fileBuffer);
    const downloadURL = await getDownloadURL(snapshot.ref);

    console.log(`✅ Uploaded ${fileName}: ${downloadURL}`);
    return downloadURL;
  } catch (error) {
    console.error(`❌ Error uploading ${fileName}:`, error);
    throw error;
  }
};

// Function to upload all assets
export const uploadAllAssets = async () => {
  const uploadedUrls = {};

  for (const fileName of assetFiles) {
    try {
      // Note: This would need to be adapted for browser environment
      // For now, we'll create a manual upload interface
      console.log(`Processing ${fileName}...`);
    } catch (error) {
      console.error(`Failed to upload ${fileName}:`, error);
    }
  }

  return uploadedUrls;
};

// Asset URL mapping (to be populated after upload)
export const assetUrls = {
  'about-hero': '/assets/about-hero.jpg', // Will be replaced with Firebase URLs
  'about-purpose': '/assets/about-purpose.jpg',
  'danny-profile': '/assets/danny-profile.jpg',
  'kids-with-mentors': '/assets/kids-with-mentors.jpg',
  'nate-profile': '/assets/nate-profile.jpg',
  'nate-profile-new': '/assets/nate-profile-new.jpg',
  'placeholder': '/assets/placeholder.png',
  'ryan-profile': '/assets/ryan-profile.jpg',
  'ryan-profile-new': '/assets/ryan-profile-new.jpg',
  'team-huddle': '/assets/team-huddle.jpg',
  'ty-profile': '/assets/ty-profile.jpg',
  'volunteers-group': '/assets/volunteers-group.jpg'
};