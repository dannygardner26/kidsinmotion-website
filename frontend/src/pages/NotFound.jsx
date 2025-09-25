import React from 'react';


const NotFound = () => {
  return (
    <>
      <div className="container mt-4">
        <div className="card">
          <div className="card-header">
            <h1>Page Not Found</h1>
          </div>
          <div className="card-body text-center">
            <div style={{ fontSize: '72px', color: 'var(--primary)' }}>
              404
            </div>
            <p className="mb-4">
              The page you are looking for does not exist or has been moved.
            </p>
            <a href="/" className="btn btn-primary">Return to Home</a>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;