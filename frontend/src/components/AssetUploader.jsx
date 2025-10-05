import React, { useState } from 'react';
import { storage } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const AssetUploader = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState({});
  const [progress, setProgress] = useState('');

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

  const uploadSingleAsset = async (file, fileName) => {
    const storageRef = ref(storage, `assets/${fileName}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  };

  const handleFileUpload = async (event, fileName) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setProgress(`Uploading ${fileName}...`);
      const url = await uploadSingleAsset(file, fileName);

      setUploadedUrls(prev => ({
        ...prev,
        [fileName]: url
      }));

<<<<<<< HEAD
      setProgress(`✅ ${fileName} uploaded successfully!`);
      console.log(`${fileName}: ${url}`);
    } catch (error) {
      setProgress(`❌ Error uploading ${fileName}: ${error.message}`);
=======
      setProgress(`${fileName} uploaded successfully!`);
      console.log(`${fileName}: ${url}`);
    } catch (error) {
      setProgress(`Error uploading ${fileName}: ${error.message}`);
>>>>>>> db03c1d12b4d8355fc970330f2d440837c0e2733
      console.error('Upload error:', error);
    }
  };

  const copyUrlsToClipboard = () => {
    const urlsText = Object.entries(uploadedUrls)
      .map(([fileName, url]) => `${fileName}: ${url}`)
      .join('\n');

    navigator.clipboard.writeText(urlsText);
<<<<<<< HEAD
    setProgress('📋 URLs copied to clipboard!');
=======
    setProgress('URLs copied to clipboard!');
>>>>>>> db03c1d12b4d8355fc970330f2d440837c0e2733
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Upload Assets to Firebase Storage</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {assetFiles.map((fileName) => (
          <div key={fileName} className="border rounded-lg p-4">
            <h3 className="font-medium text-sm mb-2">{fileName}</h3>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, fileName)}
              className="w-full text-sm"
              disabled={uploading}
            />
            {uploadedUrls[fileName] && (
              <div className="mt-2">
<<<<<<< HEAD
                <span className="text-green-600 text-xs">✅ Uploaded</span>
=======
                <span className="text-green-600 text-xs">Uploaded</span>
>>>>>>> db03c1d12b4d8355fc970330f2d440837c0e2733
                <img
                  src={uploadedUrls[fileName]}
                  alt={fileName}
                  className="w-full h-20 object-cover mt-1 rounded"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {progress && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">{progress}</p>
        </div>
      )}

      {Object.keys(uploadedUrls).length > 0 && (
        <div className="mt-6">
          <button
            onClick={copyUrlsToClipboard}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Copy All URLs to Clipboard
          </button>

          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h3 className="font-semibold mb-2">Uploaded URLs:</h3>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(uploadedUrls, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetUploader;