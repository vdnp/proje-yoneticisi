import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import MiniApp from './MiniApp.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* The mini window loads the same page with #mini. */}
    {window.location.hash === '#mini' ? <MiniApp /> : <App />}
  </React.StrictMode>
)
