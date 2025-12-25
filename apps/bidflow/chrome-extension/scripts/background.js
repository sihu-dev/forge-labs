/**
 * BIDFLOW Chrome Extension - Background Service Worker
 *
 * Handles:
 * - Message passing between content script and popup
 * - API communication with BIDFLOW backend
 * - User authentication state
 */

// API Configuration
const API_BASE_URL = 'https://bidflow.vercel.app'; // Production
const API_DEV_URL = 'http://localhost:3010'; // Development

let currentEnvironment = 'production';

// Get API URL based on environment
function getApiUrl() {
  return currentEnvironment === 'development' ? API_DEV_URL : API_BASE_URL;
}

// Extract bid information from HTML
async function extractBidInfo(url, html) {
  try {
    // Get user session token
    const { sessionToken } = await chrome.storage.local.get('sessionToken');

    if (!sessionToken) {
      throw new Error('Not authenticated. Please log in to BIDFLOW.');
    }

    // Call BIDFLOW API
    const response = await fetch(`${getApiUrl()}/api/v1/ai/extract-bid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ url, html }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'Extraction failed');
    }

    return result;
  } catch (error) {
    console.error('Extract bid error:', error);
    throw error;
  }
}

// Save extracted bid to user's BIDFLOW account
async function saveBidData(bidData) {
  try {
    const { sessionToken } = await chrome.storage.local.get('sessionToken');

    if (!sessionToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${getApiUrl()}/api/v1/bids`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
      },
      body: JSON.stringify(bidData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'Save failed');
    }

    return result;
  } catch (error) {
    console.error('Save bid error:', error);
    throw error;
  }
}

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractBid') {
    // Extract bid from current page
    extractBidInfo(request.url, request.html)
      .then(result => {
        sendResponse({ success: true, data: result.data });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });

    return true; // Keep message channel open for async response
  }

  if (request.action === 'saveBid') {
    // Save extracted bid data
    saveBidData(request.bidData)
      .then(result => {
        sendResponse({ success: true, data: result.data });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });

    return true;
  }

  if (request.action === 'checkAuth') {
    // Check authentication status
    chrome.storage.local.get('sessionToken', (data) => {
      sendResponse({ authenticated: !!data.sessionToken });
    });

    return true;
  }

  if (request.action === 'setEnvironment') {
    // Switch between dev/prod
    currentEnvironment = request.environment;
    sendResponse({ success: true, environment: currentEnvironment });
    return true;
  }
});

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('BIDFLOW Extension installed');
    // Open welcome page
    chrome.tabs.create({ url: `${getApiUrl()}/extension/welcome` });
  }
});
