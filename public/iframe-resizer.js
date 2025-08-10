// Auto-resize iframe based on content height
(function() {
  'use strict';
  
  // Get the iframe element
  const iframe = document.querySelector('iframe[data-auto-resize="true"]');
  if (!iframe) return;
  
  // Function to resize iframe
  function resizeIframe(height) {
    if (height && height > 0) {
      iframe.style.height = height + 'px';
    }
  }
  
  // Listen for messages from the iframe content
  window.addEventListener('message', function(event) {
    // Security check - only accept messages from your domain
    const allowedOrigins = [
      'http://localhost:3001',
      'https://portal.ardenoak.co'
    ];
    
    if (!allowedOrigins.includes(event.origin)) return;
    
    if (event.data && event.data.type === 'resize' && event.data.height) {
      resizeIframe(event.data.height);
    }
  });
  
  // Initial load - try to resize after a short delay
  setTimeout(function() {
    iframe.contentWindow.postMessage({ type: 'getHeight' }, '*');
  }, 100);
  
})();