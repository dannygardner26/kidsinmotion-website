import React, { useRef, useEffect, useState } from 'react';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { assetUrls } from '../utils/firebaseAssets';
import { formatAgeRange } from '../utils/eventFormatters';

const EventPosterGenerator = ({ event, onClose }) => {
  const posterRef = useRef();
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    // Generate QR code for events page
    QRCode.toDataURL('https://kidsinmotionpa.org/events', {
      width: 120,
      margin: 1,
      color: {
        dark: '#2f506a',
        light: '#ffffff'
      }
    }).then(url => {
      setQrCodeUrl(url);
    }).catch(err => {
      console.error('Error generating QR code:', err);
    });
  }, []);

  const generatePoster = async () => {
    try {
      // Preload logo image before capturing
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.src = assetUrls['realKIMlogo-transparent.png'];

      await new Promise((resolve, reject) => {
        logoImg.onload = resolve;
        logoImg.onerror = reject;
      });

      const element = posterRef.current;
      const canvas = await html2canvas(element, {
        backgroundColor: null,
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: false,
        logging: false
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${event.name.replace(/\s+/g, '_')}_poster.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      });
    } catch (error) {
      console.error('Error generating poster:', error);
      alert('Error generating poster. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Helper function to format time from various possible formats - using same logic as EventDetail
  const formatTime = (timeValue) => {
    if (!timeValue) return null;

    try {
      // Handle time formats like "17:00:00", "17:00", or already formatted times
      let timeString = timeValue.toString();

      // If it already looks like a formatted time (contains AM/PM), return as is
      if (timeString.includes('AM') || timeString.includes('PM')) {
        return timeString;
      }

      // If it's in HH:mm:ss or HH:mm format, parse it
      if (timeString.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
        // Split to check if we have seconds
        const timeParts = timeString.split(':');

        // If we only have hours and minutes, add seconds
        if (timeParts.length === 2) {
          timeString = timeString + ':00';
        }

        const timeDate = new Date(`2000-01-01T${timeString}`);
        return timeDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit'
        });
      }

      return null;
    } catch (error) {
      console.error('Error parsing time:', timeValue, error);
      return null;
    }
  };

  return (
    <div className="poster-generator-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Event Poster Generator</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        <div className="poster-preview">
          <div ref={posterRef} className="event-poster">
            {/* Header with logo */}
            <div className="poster-header">
              <img
                src={assetUrls['realKIMlogo-transparent.png']}
                alt="Kids in Motion Logo"
                className="poster-logo"
                crossOrigin="anonymous"
              />
              <div className="header-text">
                <h1>KIDS IN MOTION</h1>
                <p>Building Champions On and Off the Field</p>
              </div>
            </div>

            {/* Main content */}
            <div className="poster-main">
              <div className="event-title">
                <h2>{event.name}</h2>
              </div>

              <div className="event-details">
                <div className="detail-row">
                  <div className="detail-icon"><i className="fas fa-calendar-alt"></i></div>
                  <div className="detail-text">
                    <strong>{formatDate(event.date)}</strong>
                  </div>
                </div>

                <div className="detail-row">
                  <div className="detail-icon"><i className="fas fa-clock"></i></div>
                  <div className="detail-text">
                    <strong>
                      {(() => {
                        const formattedStartTime = formatTime(event.startTime);
                        const formattedEndTime = formatTime(event.endTime);

                        if (formattedStartTime && formattedEndTime) {
                          return `${formattedStartTime} - ${formattedEndTime}`;
                        } else if (formattedStartTime) {
                          return formattedStartTime;
                        } else {
                          return 'TBD';
                        }
                      })()}
                    </strong>
                  </div>
                </div>

                {event.location && (
                  <div className="detail-row">
                    <div className="detail-icon"><i className="fas fa-map-marker-alt"></i></div>
                    <div className="detail-text">
                      <strong>{event.location}</strong>
                    </div>
                  </div>
                )}

                <div className="detail-row">
                  <div className="detail-icon"><i className="fas fa-users"></i></div>
                  <div className="detail-text">
                    <strong>Ages: {formatAgeRange(event, { includePrefix: false })
                    }</strong>
                  </div>
                </div>

                {event.price && (
                  <div className="detail-row">
                    <div className="detail-icon"><i className="fas fa-dollar-sign"></i></div>
                    <div className="detail-text">
                      <strong>${event.price}</strong>
                    </div>
                  </div>
                )}
              </div>

              {event.description && (
                <div className="event-description">
                  <p>{event.description}</p>
                </div>
              )}

              <div className="call-to-action">
                <div className="call-to-action-text">
                  <h3>Register Today!</h3>
                  <p className="website-link">kidsinmotionpa.org/events</p>
                  <p>Scan QR code to register online</p>
                </div>
                <div className="qr-code">
                  {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" />}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="poster-footer">
              <div className="contact-info">
                <p><i className="fas fa-globe"></i> kidsinmotionpa.org | <i className="fas fa-envelope"></i> info@kidsinmotionpa.org</p>
              </div>
              <div className="footer-decoration"></div>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={generatePoster} className="btn btn-primary">
            Download Poster
          </button>
          <button onClick={onClose} className="btn btn-outline">
            Cancel
          </button>
        </div>
      </div>

      <style>{`
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css');

        .poster-generator-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          max-width: 900px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          padding: 20px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h3 {
          margin: 0;
          color: #2f506a;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        }

        .close-btn:hover {
          color: #333;
        }

        .poster-preview {
          padding: 20px;
          background: #f5f5f5;
          display: flex;
          justify-content: center;
        }

        .event-poster {
          width: 600px;
          height: 600px;
          background: linear-gradient(135deg, #2f506a 0%, #4a6b7a 50%, #2f506a 100%);
          color: white;
          font-family: 'Arial', sans-serif;
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          border-radius: 12px;
        }

        .poster-header {
          display: flex;
          align-items: center;
          padding: 15px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
        }

        .poster-logo {
          width: 60px;
          height: 60px;
          margin-right: 15px;
          border-radius: 50%;
          background: white;
          padding: 8px;
          border: 3px solid #2f506a;
          object-fit: contain;
          filter: contrast(1.1) brightness(1.05);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .header-text h1 {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }

        .header-text p {
          margin: 3px 0 0 0;
          font-size: 12px;
          opacity: 0.95;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
        }

        .poster-main {
          padding: 15px 20px 60px 20px;
          text-align: center;
        }

        .event-title h2 {
          font-size: 24px;
          margin: 0 0 12px 0;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .event-details {
          margin: 12px 0;
          text-align: left;
          background: rgba(255, 255, 255, 0.1);
          padding: 15px;
          border-radius: 8px;
          backdrop-filter: blur(10px);
        }

        .detail-row {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 600;
        }

        .detail-row:last-child {
          margin-bottom: 0;
        }

        .detail-icon {
          font-size: 20px;
          margin-right: 15px;
          width: 30px;
          text-align: center;
        }

        .detail-text {
          flex: 1;
        }

        .event-description {
          margin: 10px 0;
          background: rgba(255, 255, 255, 0.1);
          padding: 12px;
          border-radius: 8px;
          backdrop-filter: blur(10px);
        }

        .event-description p {
          margin: 0;
          font-size: 12px;
          line-height: 1.3;
        }

        .call-to-action {
          margin: 10px 0;
          background: rgba(255, 255, 255, 0.15);
          padding: 12px;
          border-radius: 8px;
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .call-to-action-text {
          flex: 1;
        }

        .call-to-action h3 {
          margin: 0 0 5px 0;
          font-size: 18px;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }

        .call-to-action p {
          margin: 2px 0;
          font-size: 12px;
        }

        .website-link {
          font-size: 14px;
          font-weight: bold;
          color: #fff;
          text-decoration: underline;
        }

        .qr-code {
          width: 60px;
          height: 60px;
          background: white;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #2f506a;
          overflow: hidden;
        }

        .qr-code img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .poster-footer {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.2);
          padding: 15px 30px;
          backdrop-filter: blur(10px);
        }

        .contact-info p {
          margin: 0;
          font-size: 14px;
          text-align: center;
          font-weight: 600;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.4);
        }

        .footer-decoration {
          height: 2px;
          background: linear-gradient(90deg, transparent, white, transparent);
          margin-top: 8px;
          opacity: 0.5;
        }

        .modal-actions {
          padding: 20px;
          border-top: 1px solid #eee;
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }

        .btn {
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.3s ease;
          font-size: 0.875rem;
        }

        .btn-primary {
          background-color: var(--primary, #2f506a);
          color: white;
          border-color: var(--primary, #2f506a);
        }

        .btn-primary:hover {
          background-color: #1e3a4a;
          border-color: #1e3a4a;
        }

        .btn-outline {
          background: white;
          color: var(--primary, #2f506a);
          border-color: var(--primary, #2f506a);
        }

        .btn-outline:hover {
          background-color: var(--primary, #2f506a);
          color: white;
        }

        @media (max-width: 768px) {
          .event-poster {
            width: 400px;
            height: 533px;
            transform: scale(0.8);
          }

          .modal-content {
            margin: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default EventPosterGenerator;