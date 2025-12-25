/**
 * BIDFLOW Chrome Extension - Popup Script
 *
 * Handles popup UI interactions and state
 */

// DOM Elements
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const authenticatedView = document.getElementById('authenticated-view');
const unauthenticatedView = document.getElementById('unauthenticated-view');
const extractBtn = document.getElementById('extract-btn');
const viewBidsBtn = document.getElementById('view-bids-btn');
const loginBtn = document.getElementById('login-btn');
const devModeToggle = document.getElementById('dev-mode-toggle');
const autoExtractToggle = document.getElementById('auto-extract-toggle');

// Stats elements
const statsExtracted = document.getElementById('stats-extracted');
const statsUsage = document.getElementById('stats-usage');
const statsSuccess = document.getElementById('stats-success');

// Check authentication status
async function checkAuth() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'checkAuth' });

    if (response.authenticated) {
      showAuthenticatedView();
      loadStats();
    } else {
      showUnauthenticatedView();
    }
  } catch (error) {
    console.error('Auth check error:', error);
    showUnauthenticatedView();
  }
}

// Show authenticated view
function showAuthenticatedView() {
  statusIndicator.classList.remove('offline');
  statusText.textContent = 'Connected to BIDFLOW';
  authenticatedView.style.display = 'block';
  unauthenticatedView.style.display = 'none';
}

// Show unauthenticated view
function showUnauthenticatedView() {
  statusIndicator.classList.add('offline');
  statusText.textContent = 'Not connected';
  authenticatedView.style.display = 'none';
  unauthenticatedView.style.display = 'block';
}

// Load stats from storage
async function loadStats() {
  try {
    const data = await chrome.storage.local.get(['todayStats']);
    const stats = data.todayStats || { extracted: 0, usage: 0, success: 100 };

    statsExtracted.textContent = stats.extracted;
    statsUsage.textContent = `$${stats.usage.toFixed(3)}`;
    statsSuccess.textContent = `${stats.success}%`;
  } catch (error) {
    console.error('Load stats error:', error);
  }
}

// Load settings
async function loadSettings() {
  try {
    const data = await chrome.storage.local.get(['devMode', 'autoExtract']);

    if (data.devMode) {
      devModeToggle.classList.add('active');
    }

    if (data.autoExtract) {
      autoExtractToggle.classList.add('active');
    }
  } catch (error) {
    console.error('Load settings error:', error);
  }
}

// Extract current page
async function extractCurrentPage() {
  try {
    extractBtn.disabled = true;
    extractBtn.innerHTML = '<div class="loading"></div><span>Extracting...</span>';

    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      throw new Error('No active tab');
    }

    // Execute content script to get page HTML
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => ({
        url: window.location.href,
        html: document.documentElement.outerHTML,
      }),
    });

    if (!result) {
      throw new Error('Failed to access page');
    }

    // Send extraction request
    const response = await chrome.runtime.sendMessage({
      action: 'extractBid',
      url: result.result.url,
      html: result.result.html,
    });

    if (response.success) {
      // Update stats
      const data = await chrome.storage.local.get(['todayStats']);
      const stats = data.todayStats || { extracted: 0, usage: 0, success: 100 };
      stats.extracted += 1;
      await chrome.storage.local.set({ todayStats: stats });

      // Show success
      extractBtn.innerHTML = '<span>✓</span><span>Extracted!</span>';
      loadStats();

      // Auto-save if enabled
      const settings = await chrome.storage.local.get(['autoSave']);
      if (settings.autoSave) {
        await chrome.runtime.sendMessage({
          action: 'saveBid',
          bidData: response.data,
        });
      }

      // Reset button after 2 seconds
      setTimeout(() => {
        extractBtn.disabled = false;
        extractBtn.innerHTML = '<span>⚡</span><span>Extract Current Page</span>';
      }, 2000);
    } else {
      throw new Error(response.error);
    }
  } catch (error) {
    console.error('Extract error:', error);

    extractBtn.innerHTML = '<span>✕</span><span>Error: ' + error.message + '</span>';

    setTimeout(() => {
      extractBtn.disabled = false;
      extractBtn.innerHTML = '<span>⚡</span><span>Extract Current Page</span>';
    }, 3000);
  }
}

// View bids in BIDFLOW
function viewBids() {
  chrome.tabs.create({ url: 'https://bidflow.vercel.app/bids' });
}

// Login to BIDFLOW
function login() {
  chrome.tabs.create({ url: 'https://bidflow.vercel.app/auth/signin?redirect=/extension/callback' });
}

// Toggle dev mode
async function toggleDevMode() {
  const isActive = devModeToggle.classList.toggle('active');

  await chrome.storage.local.set({ devMode: isActive });
  await chrome.runtime.sendMessage({
    action: 'setEnvironment',
    environment: isActive ? 'development' : 'production',
  });
}

// Toggle auto-extract
async function toggleAutoExtract() {
  const isActive = autoExtractToggle.classList.toggle('active');
  await chrome.storage.local.set({ autoExtract: isActive });
}

// Event listeners
extractBtn.addEventListener('click', extractCurrentPage);
viewBidsBtn.addEventListener('click', viewBids);
loginBtn.addEventListener('click', login);
devModeToggle.addEventListener('click', toggleDevMode);
autoExtractToggle.addEventListener('click', toggleAutoExtract);

// Initialize
checkAuth();
loadSettings();
