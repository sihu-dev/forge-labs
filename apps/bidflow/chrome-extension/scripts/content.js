/**
 * BIDFLOW Chrome Extension - Content Script
 *
 * Runs on bid website pages
 * Injects extraction button and handles page interaction
 */

// Whitelisted domains
const SUPPORTED_DOMAINS = [
  'g2b.go.kr',
  'ungm.org',
  'dgmarket.com',
  'ted.europa.eu',
  'sam.gov',
];

// Check if current page is a bid detail page
function isBidDetailPage() {
  const url = window.location.href;
  const hostname = window.location.hostname;

  // Check if on supported domain
  const isSupported = SUPPORTED_DOMAINS.some(domain => hostname.includes(domain));

  if (!isSupported) return false;

  // Domain-specific detection logic
  if (hostname.includes('g2b.go.kr')) {
    // Korean procurement - check for bid detail indicators
    return url.includes('dtlView') || document.querySelector('.table_info');
  }

  if (hostname.includes('ungm.org')) {
    // UN procurement
    return url.includes('/notice/') || document.querySelector('.notice-detail');
  }

  // Default: assume any page on supported domain is extractable
  return true;
}

// Create floating extraction button
function createExtractionButton() {
  const button = document.createElement('div');
  button.id = 'bidflow-extract-btn';
  button.innerHTML = `
    <div class="bidflow-btn-inner">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 2L3 14h8l-2 8 10-12h-8l2-8z" fill="currentColor"/>
      </svg>
      <span>Extract Bid</span>
    </div>
  `;

  button.addEventListener('click', handleExtraction);

  document.body.appendChild(button);
}

// Handle bid extraction
async function handleExtraction() {
  const button = document.getElementById('bidflow-extract-btn');
  const originalContent = button.innerHTML;

  // Show loading state
  button.innerHTML = `
    <div class="bidflow-btn-inner bidflow-loading">
      <div class="bidflow-spinner"></div>
      <span>Extracting...</span>
    </div>
  `;
  button.style.pointerEvents = 'none';

  try {
    // Get page HTML
    const html = document.documentElement.outerHTML;
    const url = window.location.href;

    // Send to background script
    const response = await chrome.runtime.sendMessage({
      action: 'extractBid',
      url,
      html,
    });

    if (response.success) {
      // Show success
      button.innerHTML = `
        <div class="bidflow-btn-inner bidflow-success">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2"/>
          </svg>
          <span>Extracted!</span>
        </div>
      `;

      // Show notification
      showNotification('Bid extracted successfully!', response.data);

      // Reset button after 3 seconds
      setTimeout(() => {
        button.innerHTML = originalContent;
        button.style.pointerEvents = 'auto';
      }, 3000);
    } else {
      throw new Error(response.error);
    }
  } catch (error) {
    console.error('Extraction error:', error);

    // Show error
    button.innerHTML = `
      <div class="bidflow-btn-inner bidflow-error">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2"/>
        </svg>
        <span>Error</span>
      </div>
    `;

    showNotification('Extraction failed', { error: error.message }, 'error');

    // Reset button after 3 seconds
    setTimeout(() => {
      button.innerHTML = originalContent;
      button.style.pointerEvents = 'auto';
    }, 3000);
  }
}

// Show notification overlay
function showNotification(title, data, type = 'success') {
  // Remove existing notification
  const existing = document.getElementById('bidflow-notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.id = 'bidflow-notification';
  notification.className = `bidflow-notification bidflow-notification-${type}`;

  notification.innerHTML = `
    <div class="bidflow-notification-content">
      <div class="bidflow-notification-header">
        <h4>${title}</h4>
        <button class="bidflow-notification-close">&times;</button>
      </div>
      <div class="bidflow-notification-body">
        ${type === 'success' ? `
          <p><strong>Title:</strong> ${data.title || 'N/A'}</p>
          <p><strong>Organization:</strong> ${data.organization || 'N/A'}</p>
          <p><strong>Budget:</strong> ${data.budget ? `$${data.budget.toLocaleString()}` : 'N/A'}</p>
          <p><strong>Deadline:</strong> ${data.deadline || 'N/A'}</p>
        ` : `
          <p>${data.error}</p>
        `}
      </div>
      <div class="bidflow-notification-actions">
        <a href="https://bidflow.vercel.app/bids" target="_blank" class="bidflow-btn-primary">
          View in BIDFLOW
        </a>
      </div>
    </div>
  `;

  document.body.appendChild(notification);

  // Auto-hide after 10 seconds
  setTimeout(() => {
    notification.classList.add('bidflow-notification-hide');
    setTimeout(() => notification.remove(), 300);
  }, 10000);

  // Close button
  notification.querySelector('.bidflow-notification-close').addEventListener('click', () => {
    notification.classList.add('bidflow-notification-hide');
    setTimeout(() => notification.remove(), 300);
  });
}

// Initialize
if (isBidDetailPage()) {
  // Wait for page to fully load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createExtractionButton);
  } else {
    createExtractionButton();
  }
}
