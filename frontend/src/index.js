import React from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
import App from './App';
import './css/app.css'; // Import global CSS
import './js/animations.js'; // Import global animations/interactions

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
