import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { assetUrls } from '../utils/firebaseAssets';

const PosterTemplateSelector = ({ event, onClose }) => {
  const [selectedTemplate, setSelectedTemplate] = useState('clean-blue');
  const posterRef = useRef();

  const templates = [
    {
      id: 'clean-blue',
      name: 'Clean Blue',
      theme: {
        background: '#2f506a',
        headerBg: 'rgba(255, 255, 255, 0.1)',
        cardBg: 'rgba(255, 255, 255, 0.15)',
        text: 'white',
        accent: '#ffffff'
      }
    },
    {
      id: 'light-blue',
      name: 'Light Blue',
      theme: {
        background: '#ffffff',
        headerBg: '#2f506a',
        cardBg: '#f8fafc',
        text: '#2f506a',
        accent: '#2f506a',
        border: '3px solid #2f506a'
      }
    },
    {
      id: 'modern-clean',
      name: 'Modern Clean',
      theme: {
        background: '#f8fafc',
        headerBg: '#ffffff',
        cardBg: '#ffffff',
        text: '#1e293b',
        accent: '#2f506a',
        shadow: true
      }
    },
    {
      id: 'red',
      name: 'Red',
      theme: {
        background: '#dc2626',
        headerBg: 'rgba(255, 255, 255, 0.1)',
        cardBg: 'rgba(255, 255, 255, 0.15)',
        text: 'white',
        accent: '#ffffff'
      }
    },
    {
      id: 'white',
      name: 'White',
      theme: {
        background: '#ffffff',
        headerBg: '#2f506a',
        cardBg: '#f8fafc',
        text: '#2f506a',
        accent: '#2f506a',
        border: '3px solid #2f506a'
      }
    },
    {
      id: 'black',
      name: 'Black',
      theme: {
        background: '#1f2937',
        headerBg: 'rgba(255, 255, 255, 0.1)',
        cardBg: 'rgba(255, 255, 255, 0.1)',
        text: 'white',
        accent: '#2f506a'
      }
    }
  ];

  const selectedTheme = templates.find(t => t.id === selectedTemplate)?.theme;

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
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false
      });

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${event.name.replace(/\s+/g, '_')}_${selectedTemplate}_poster.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      });
    } catch (error) {
      console.error('Error generating poster:', error);
      alert('Error generating poster. Please try again.');
    }
  };

  const getQRCodeUrl = () => {
    const color = selectedTheme.accent === '#ffffff' ? '2f506a' : selectedTheme.accent.replace('#', '');
    return `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://kidsinmotionpa.org/events&color=${color}&bgcolor=ffffff`;
  };

  return (
    <div className="poster-selector-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Choose Poster Template</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        <div className="template-selector">
          <h4>Select Template Style:</h4>
          <div className="template-grid">
            {templates.map(template => (
              <button
                key={template.id}
                className={`template-option ${selectedTemplate === template.id ? 'selected' : ''}`}
                onClick={() => setSelectedTemplate(template.id)}
                style={{
                  background: template.theme.background,
                  color: template.theme.text,
                  border: template.theme.border || `2px solid ${template.theme.accent}`
                }}
              >
                {template.name}
              </button>
            ))}
          </div>
        </div>

        <div className="poster-preview">
          <div ref={posterRef} className="event-poster" style={{
            background: selectedTheme.background,
            color: selectedTheme.text,
            border: selectedTheme.border || 'none'
          }}>
            {/* Header with logo */}
            <div className="poster-header" style={{
              background: selectedTheme.headerBg,
              color: selectedTemplate === 'light-blue' || selectedTemplate === 'white' ? 'white' : selectedTheme.text
            }}>
              <img
                src={assetUrls['realKIMlogo-transparent.png']}
                alt="Kids in Motion Logo"
                className="poster-logo"
                style={{
                  background: 'white',
                  border: `3px solid ${selectedTheme.accent}`,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                }}
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
                <h2 style={{ color: selectedTheme.text }}>{event.name || 'Event Title'}</h2>
              </div>

              <div className="event-details" style={{
                background: selectedTheme.cardBg,
                border: selectedTemplate === 'light-blue' || selectedTemplate === 'white' ? '2px solid #e2e8f0' :
                        selectedTemplate === 'modern-clean' ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                borderLeft: selectedTemplate === 'modern-clean' ? '4px solid #2f506a' : undefined,
                boxShadow: selectedTheme.shadow ? '0 4px 15px rgba(47, 80, 106, 0.1)' : 'none'
              }}>
                <div className="detail-row">
                  <div className="detail-icon" style={{ color: selectedTheme.accent }}>
                    <i className="fas fa-calendar-alt"></i>
                  </div>
                  <div className="detail-text">
                    <strong>{formatDate(event.date)}</strong>
                  </div>
                </div>

                <div className="detail-row">
                  <div className="detail-icon" style={{ color: selectedTheme.accent }}>
                    <i className="fas fa-clock"></i>
                  </div>
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
                    <div className="detail-icon" style={{ color: selectedTheme.accent }}>
                      <i className="fas fa-map-marker-alt"></i>
                    </div>
                    <div className="detail-text">
                      <strong>{event.location}</strong>
                    </div>
                  </div>
                )}

                {event.ageGroup && (
                  <div className="detail-row">
                    <div className="detail-icon" style={{ color: selectedTheme.accent }}>
                      <i className="fas fa-users"></i>
                    </div>
                    <div className="detail-text">
                      <strong>Ages: {event.ageGroup}</strong>
                    </div>
                  </div>
                )}

                {event.price > 0 && (
                  <div className="detail-row">
                    <div className="detail-icon" style={{ color: selectedTheme.accent }}>
                      <i className="fas fa-dollar-sign"></i>
                    </div>
                    <div className="detail-text">
                      <strong>${event.price}</strong>
                    </div>
                  </div>
                )}
              </div>

              {event.description && (
                <div className="event-description" style={{
                  background: selectedTheme.cardBg,
                  border: selectedTemplate === 'light-blue' || selectedTemplate === 'white' ? '2px solid #e2e8f0' :
                          selectedTemplate === 'black' ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
                  boxShadow: selectedTheme.shadow ? '0 4px 15px rgba(47, 80, 106, 0.1)' : 'none'
                }}>
                  <p>{event.description}</p>
                </div>
              )}

              <div className="call-to-action" style={{
                background: selectedTemplate === 'modern-clean' ? '#2f506a' :
                           selectedTemplate === 'black' ? '#2f506a' :
                           selectedTheme.cardBg,
                color: selectedTemplate === 'modern-clean' || selectedTemplate === 'black' ? 'white' : selectedTheme.text,
                border: selectedTemplate === 'light-blue' || selectedTemplate === 'white' ? 'none' :
                        selectedTemplate === 'black' ? 'none' : '1px solid rgba(255, 255, 255, 0.4)',
                boxShadow: selectedTheme.shadow ? '0 4px 15px rgba(47, 80, 106, 0.3)' : 'none'
              }}>
                <div className="call-to-action-text">
                  <h3>Register Today!</h3>
                  <p className="website-link">kidsinmotionpa.org/events</p>
                  <p>Scan QR code to register online</p>
                </div>
                <div className="qr-code" style={{
                  background: 'white',
                  border: `2px solid ${selectedTemplate === 'light-blue' || selectedTemplate === 'white' ? '#ffffff' : selectedTheme.accent}`
                }}>
                  <img src={getQRCodeUrl()} alt="QR Code" />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="poster-footer" style={{
              background: selectedTemplate === 'modern-clean' ? '#1e293b' :
                         selectedTemplate === 'light-blue' || selectedTemplate === 'white' ? '#2f506a' :
                         selectedTemplate === 'black' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)',
              color: 'white'
            }}>
              <div className="contact-info">
                <p><i className="fas fa-globe"></i> kidsinmotionpa.org | <i className="fas fa-envelope"></i> info@kidsinmotionpa.org</p>
              </div>
              <div className="footer-decoration" style={{
                background: selectedTemplate === 'modern-clean' ? '#2f506a' : '#ffffff'
              }}></div>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={generatePoster} className="btn btn-primary">
            Download {templates.find(t => t.id === selectedTemplate)?.name} Poster
          </button>
          <button onClick={onClose} className="btn btn-outline">
            Cancel
          </button>
        </div>
      </div>

      <style>{`
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css');

        .poster-selector-modal {
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
          max-width: 1000px;
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

        .template-selector {
          padding: 20px;
          border-bottom: 1px solid #eee;
        }

        .template-selector h4 {
          margin: 0 0 15px 0;
          color: #2f506a;
        }

        .template-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 10px;
        }

        .template-option {
          padding: 15px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          text-align: center;
          transition: all 0.3s ease;
          font-size: 14px;
        }

        .template-option:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .template-option.selected {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(47, 80, 106, 0.3);
          outline: 3px solid #2f506a;
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
          font-family: 'Arial', sans-serif;
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          border-radius: 12px;
        }

        .poster-header {
          display: flex;
          align-items: center;
          padding: 20px;
        }

        .poster-logo {
          width: 60px;
          height: 60px;
          margin-right: 15px;
          border-radius: 50%;
          padding: 8px;
          object-fit: contain;
          filter: contrast(1.1) brightness(1.05);
        }

        .header-text h1 {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
        }

        .header-text p {
          margin: 3px 0 0 0;
          font-size: 12px;
          opacity: 0.95;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
        }

        .poster-main {
          padding: 15px 20px 70px 20px;
          text-align: center;
        }

        .event-title h2 {
          font-size: 24px;
          margin: 0 0 15px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
          font-weight: bold;
        }

        .event-details {
          margin: 10px 0;
          text-align: left;
          padding: 12px;
          border-radius: 8px;
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
          font-size: 18px;
          margin-right: 12px;
          width: 25px;
          text-align: center;
        }

        .detail-text {
          flex: 1;
        }

        .event-description {
          margin: 8px 0;
          padding: 10px;
          border-radius: 8px;
        }

        .event-description p {
          margin: 0;
          font-size: 12px;
          line-height: 1.3;
        }

        .call-to-action {
          margin: 8px 0;
          padding: 10px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .call-to-action-text {
          flex: 1;
        }

        .call-to-action h3 {
          margin: 0 0 5px 0;
          font-size: 16px;
          font-weight: bold;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
        }

        .call-to-action p {
          margin: 2px 0;
          font-size: 12px;
        }

        .website-link {
          font-size: 16px;
          font-weight: bold;
          text-decoration: underline;
        }

        .qr-code {
          width: 55px;
          height: 55px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
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
          padding: 15px 30px;
        }

        .contact-info p {
          margin: 0;
          font-size: 14px;
          text-align: center;
          font-weight: 600;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
        }

        .footer-decoration {
          height: 2px;
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
          background-color: #2f506a;
          color: white;
          border-color: #2f506a;
        }

        .btn-primary:hover {
          background-color: #1e3a4a;
          border-color: #1e3a4a;
        }

        .btn-outline {
          background: white;
          color: #2f506a;
          border-color: #2f506a;
        }

        .btn-outline:hover {
          background-color: #2f506a;
          color: white;
        }

        @media (max-width: 768px) {
          .event-poster {
            width: 400px;
            height: 400px;
            transform: scale(0.8);
          }

          .modal-content {
            margin: 10px;
          }

          .template-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default PosterTemplateSelector;