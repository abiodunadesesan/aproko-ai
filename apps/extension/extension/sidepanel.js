const DEFAULT_WEB_APP_URL = 'https://aprokoai.vercel.app';

const captureBtn = document.getElementById('capture-btn');
const statusEl = document.getElementById('status');
const webAppUrlEl = document.getElementById('web-app-url');
const hoverEnabledEl = document.getElementById('hover-enabled');
const saveSettingsBtn = document.getElementById('save-settings');
const connectLink = document.getElementById('connect-link');
const appFrame = document.getElementById('app-frame');

let webAppUrl = DEFAULT_WEB_APP_URL;
let lastContext = null;

function normalizeWebAppUrl(url) {
  let value = String(url || DEFAULT_WEB_APP_URL).trim().replace(/\/$/, '');
  if (!value) {
    value = DEFAULT_WEB_APP_URL;
  }
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(value)) {
    return value.replace(/\/$/, '');
  }
  if (value.startsWith('http://')) {
    value = `https://${value.slice('http://'.length)}`;
  }
  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`;
  }
  return value.replace(/\/$/, '');
}

function iframeTargetOrigin() {
  try {
    if (appFrame?.src) {
      return new URL(appFrame.src).origin;
    }
  } catch {
    // ignore invalid src while loading
  }
  return webAppUrl;
}

function setStatus(text) {
  statusEl.textContent = text || '';
}

function panelUrl(base) {
  return `${normalizeWebAppUrl(base)}/extension/live?embed=1`;
}

function postMessageToFrame(message) {
  if (!appFrame?.contentWindow) {
    return;
  }
  const targetOrigin = iframeTargetOrigin();
  appFrame.contentWindow.postMessage(message, targetOrigin || '*');
}

function postContextToFrame(context) {
  if (!context) {
    return;
  }
  postMessageToFrame({
    type: 'APROKO_LIVE_CONTEXT',
    payload: context,
  });
}

function postHoverToFrame(message) {
  postMessageToFrame({
    type: 'APROKO_HOVER_UPDATED',
    hover: message.hover,
    activeHoverContext: message.activeHoverContext || '',
  });
}

function postAuthToFrame(auth) {
  if (!auth?.token) {
    return;
  }
  postMessageToFrame({
    type: 'APROKO_EXTENSION_AUTH',
    auth: {
      token: auth.token,
      workspaceId: auth.workspaceId,
      name: auth.name ?? null,
      role: auth.role ?? null,
    },
  });
}

async function pushExtensionAuth() {
  const response = await chrome.runtime.sendMessage({ type: 'APROKO_GET_EXTENSION_AUTH' });
  if (response?.ok && response.auth?.token) {
    postAuthToFrame(response.auth);
  }
}

async function loadSettings() {
  const stored = await chrome.storage.sync.get({ webAppUrl: DEFAULT_WEB_APP_URL });
  webAppUrl = normalizeWebAppUrl(stored.webAppUrl || DEFAULT_WEB_APP_URL);
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
    return;
  }

  if (event.data?.type === 'APROKO_EMBED_ASK') {
    chrome.runtime.sendMessage(
      {
        type: 'APROKO_PROXY_LIVE_CONTEXT_CHAT',
        workspaceId: event.data.workspaceId,
        body: event.data.body,
        token: event.data.token ?? null,
        workspaceName: event.data.workspaceName ?? null,
        workspaceRole: event.data.workspaceRole ?? null,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          postMessageToFrame({
            type: 'APROKO_EMBED_ASK_RESULT',
            requestId: event.data.requestId,
            ok: false,
            error: chrome.runtime.lastError.message,
          });
          return;
        }

        postMessageToFrame({
          type: 'APROKO_EMBED_ASK_RESULT',
          requestId: event.data.requestId,
          ok: Boolean(response?.ok),
          sse: response?.sse,
          error: response?.error,
        });
      },
    );
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
  webAppUrl = normalizeWebAppUrl(webAppUrlEl.value.trim() || DEFAULT_WEB_APP_URL);
  webAppUrlEl.value = webAppUrl;
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
