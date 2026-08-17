const DEFAULT_WEB_APP_URL = 'http://localhost:3000';

const captureBtn = document.getElementById('capture-btn');
const statusEl = document.getElementById('status');
const webAppUrlEl = document.getElementById('web-app-url');
const hoverEnabledEl = document.getElementById('hover-enabled');
const saveSettingsBtn = document.getElementById('save-settings');
const connectLink = document.getElementById('connect-link');
const appFrame = document.getElementById('app-frame');

let webAppUrl = DEFAULT_WEB_APP_URL;
let lastContext = null;

function setStatus(text) {
  statusEl.textContent = text || '';
}

function panelUrl(base) {
  return `${base.replace(/\/$/, '')}/extension/live?embed=1`;
}

function postContextToFrame(context) {
  if (!context || !appFrame?.contentWindow) {
    return;
  }
  appFrame.contentWindow.postMessage(
    {
      type: 'APROKO_LIVE_CONTEXT',
      payload: context,
    },
    webAppUrl,
  );
}

function postHoverToFrame(message) {
  if (!appFrame?.contentWindow) {
    return;
  }
  appFrame.contentWindow.postMessage(
    {
      type: 'APROKO_HOVER_UPDATED',
      hover: message.hover,
      activeHoverContext: message.activeHoverContext || '',
    },
    webAppUrl,
  );
}

function postAuthToFrame(auth) {
  if (!auth?.token || !appFrame?.contentWindow) {
    return;
  }
  appFrame.contentWindow.postMessage(
    {
      type: 'APROKO_EXTENSION_AUTH',
      auth: {
        token: auth.token,
        workspaceId: auth.workspaceId,
        name: auth.name ?? null,
        role: auth.role ?? null,
      },
    },
    webAppUrl,
  );
}

async function pushExtensionAuth() {
  const response = await chrome.runtime.sendMessage({ type: 'APROKO_GET_EXTENSION_AUTH' });
  if (response?.ok && response.auth?.token) {
    postAuthToFrame(response.auth);
  }
}

async function loadSettings() {
  const stored = await chrome.storage.sync.get({ webAppUrl: DEFAULT_WEB_APP_URL });
  webAppUrl = String(stored.webAppUrl || DEFAULT_WEB_APP_URL).replace(/\/$/, '');
  webAppUrlEl.value = webAppUrl;
  const { hoverEnabled } = await chrome.storage.sync.get({ hoverEnabled: true });
  if (hoverEnabledEl) {
    hoverEnabledEl.checked = hoverEnabled !== false;
  }
  connectLink.href = `${webAppUrl}/extension/connect?from=extension`;
  const nextSrc = panelUrl(webAppUrl);
  if (appFrame.src !== nextSrc) {
    appFrame.src = nextSrc;
  }
  return webAppUrl;
}

async function loadStoredContext() {
  const stored = await chrome.storage.session.get(['lastLiveContext']);
  if (stored.lastLiveContext) {
    lastContext = stored.lastLiveContext;
  }
}

appFrame.addEventListener('load', () => {
  chrome.runtime.sendMessage({ type: 'APROKO_CLEAR_BADGE' });
  setTimeout(() => {
    void pushExtensionAuth();
    if (lastContext) {
      postContextToFrame(lastContext);
    }
  }, 250);
});

window.addEventListener('message', (event) => {
  if (event.source !== appFrame?.contentWindow) {
    return;
  }
  if (event.data?.type === 'APROKO_REQUEST_EXTENSION_AUTH') {
    void pushExtensionAuth();
  }
});

captureBtn.addEventListener('click', () => {
  setStatus('Capturing…');
  chrome.runtime.sendMessage({ type: 'APROKO_CAPTURE_NOW' }, (response) => {
    if (chrome.runtime.lastError) {
      setStatus(chrome.runtime.lastError.message);
      return;
    }
    if (!response?.ok) {
      setStatus(response?.error || 'Capture failed');
      return;
    }
    lastContext = response.context;
    postContextToFrame(response.context);
    setStatus('Captured — ask in the panel below');
  });
});

saveSettingsBtn.addEventListener('click', async () => {
  webAppUrl = webAppUrlEl.value.trim().replace(/\/$/, '') || DEFAULT_WEB_APP_URL;
  await chrome.storage.sync.set({ webAppUrl });
  connectLink.href = `${webAppUrl}/extension/connect?from=extension`;
  appFrame.src = panelUrl(webAppUrl);
  setStatus('Settings saved — sign in at the web app if the panel asks you to');
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === 'APROKO_CONTEXT_UPDATED' && message.context) {
    lastContext = message.context;
    postContextToFrame(message.context);
    setStatus('Captured — ask in the panel below');
  }
  if (message?.type === 'APROKO_EXTENSION_AUTH_UPDATED') {
    void pushExtensionAuth();
  }
  if (message?.type === 'APROKO_HOVER_FANOUT' || message?.type === 'APROKO_HOVER_UPDATED') {
    postHoverToFrame(message);
    if (message.hover?.localText) {
      setStatus(`Hover: ${message.hover.localText.slice(0, 80)}`);
    }
  }
});

void loadSettings();
void loadStoredContext();

if (hoverEnabledEl) {
  hoverEnabledEl.addEventListener('change', async () => {
    await chrome.storage.sync.set({ hoverEnabled: hoverEnabledEl.checked });
    setStatus(hoverEnabledEl.checked ? 'Cursor hover focus enabled' : 'Cursor hover focus disabled');
  });
}
