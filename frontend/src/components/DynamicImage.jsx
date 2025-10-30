import React, { useState, useEffect } from 'react';
import { getRandomImage, getNextImage } from '../utils/imageUtils';

const DynamicImage = ({ 
  category = 'default',
  mode = 'random', // 'random' or 'cycle'
  className = '',
  alt = 'Kids in Motion',
  fallback = '/assets/placeholder.png',
  cycleInterval = null, // milliseconds for auto-cycling
  ...props 
}) => {
  const [currentImage, setCurrentImage] = useState('');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Load initial image
    const loadImage = () => {
      const imageUrl = mode === 'cycle' ? getNextImage(category) : getRandomImage(category);
      setCurrentImage(imageUrl);
      setImageError(false);
    };

    loadImage();

    // Set up auto-cycling if interval is provided
    let intervalId;
    if (cycleInterval && cycleInterval > 0) {
      intervalId = setInterval(loadImage, cycleInterval);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [category, mode, cycleInterval]);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  return (
    <img
      src={imageError ? fallback : currentImage}
      alt={alt}
      className={className}
      onError={handleImageError}
      onLoad={handleImageLoad}
      {...props}
    />
  );
};

export default DynamicImage;