import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Home from './src/Home';  // Importa il componente Home
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Home />  {/* Qui usi Home come componente principale */}
  </React.StrictMode>
);

reportWebVitals();
