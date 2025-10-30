import React from 'react';
import { assetUrls } from '../utils/firebaseAssets';

const FirebaseImage = ({
  src,
  alt,
  className = '',
  style = {},
  fallback = assetUrls['placeholder.png'],
  ...props
}) => {
  // Extract filename from src if it's a local path
  const getImageUrl = (src) => {
    if (src && src.startsWith('/assets/')) {
      const filename = src.replace('/assets/', '');
      return assetUrls[filename] || fallback;
    }

    if (src && src.startsWith('http')) {
      return src; // Already a full URL
    }

    // Check if it's just a filename
    if (src && assetUrls[src]) {
      return assetUrls[src];
    }

    return src || fallback;
  };

  const imageUrl = getImageUrl(src);

  const handleError = (e) => {
    if (e.target.src !== fallback) {
      e.target.src = fallback;
    }
  };

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
      {...props}
    />
  );
};

export default FirebaseImage;