const DEFAULT_WEB_APP_URL = 'https://aprokoai.vercel.app';
const MAX_HOVER_FEED_ITEMS = 12;

const captureBtn = document.getElementById('capture-btn');
const statusEl = document.getElementById('status');
const webAppUrlEl = document.getElementById('web-app-url');
const hoverEnabledEl = document.getElementById('hover-enabled');
const saveSettingsBtn = document.getElementById('save-settings');
const connectLink = document.getElementById('connect-link');
const transcriptsLink = document.getElementById('transcripts-link');
const openTranscriptsBtn = document.getElementById('open-transcripts-btn');
const appFrame = document.getElementById('app-frame');
const trackingIndicator = document.getElementById('tracking-indicator');
const hoverFeedList = document.getElementById('hover-feed-list');
const modePills = Array.from(document.querySelectorAll('.mode-pill'));
const modePanels = Array.from(document.querySelectorAll('.mode-panel'));

let webAppUrl = DEFAULT_WEB_APP_URL;
let lastContext = null;
let activeMode = 'ask';
let hoverEnabled = true;
let trackingState = 'idle';
let trackingResetTimer = null;

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
  if (statusEl) {
    statusEl.textContent = text || '';
  }
}

function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.remove('light');
  root.classList.remove('dark');
  root.classList.add(theme === 'dark' ? 'dark' : 'light');
}

async function syncStoredTheme() {
  try {
    const stored = await chrome.storage.local.get(['appTheme']);
    applyTheme(stored.appTheme === 'dark' ? 'dark' : 'light');
  } catch {
    applyTheme('light');
  }
}

function panelUrl(base) {
  return `${normalizeWebAppUrl(base)}/extension/live?embed=1`;
}

function transcriptsUrl(base) {
  return `${normalizeWebAppUrl(base)}/transcripts`;
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

function setTrackingState(state) {
  trackingState = state;
  if (!trackingIndicator) {
    return;
  }
  trackingIndicator.dataset.state = state;
}

function scheduleTrackingIdle() {
  if (trackingResetTimer) {
    clearTimeout(trackingResetTimer);
  }
  trackingResetTimer = setTimeout(() => {
    if (trackingState !== 'locked') {
      setTrackingState(hoverEnabled ? 'idle' : 'idle');
    }
  }, 2400);
}

function formatFeedTime(timestamp) {
  try {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return 'Now';
  }
}

function prependHoverFeedItem(hover) {
  if (!hoverFeedList || !hover?.localText) {
    return;
  }

  const text = String(hover.localText).trim();
  if (!text) {
    return;
  }

  const item = document.createElement('li');
  item.className = 'hover-feed-item';

  const time = document.createElement('time');
  time.dateTime = new Date().toISOString();
  time.textContent = formatFeedTime(Date.now());

  const copy = document.createElement('p');
  copy.textContent = text.length > 220 ? `${text.slice(0, 217)}…` : text;

  item.append(time, copy);
  hoverFeedList.prepend(item);

  while (hoverFeedList.children.length > MAX_HOVER_FEED_ITEMS) {
    hoverFeedList.lastElementChild?.remove();
  }
}

function setActiveMode(mode) {
  activeMode = mode;

  for (const pill of modePills) {
    const selected = pill.dataset.mode === mode;
    pill.classList.toggle('is-active', selected);
    pill.setAttribute('aria-selected', selected ? 'true' : 'false');
  }

  for (const panel of modePanels) {
    const selected = panel.dataset.modePanel === mode;
    panel.classList.toggle('is-active', selected);
    panel.hidden = !selected;
  }
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
  const hoverSettings = await chrome.storage.sync.get({ hoverEnabled: true });
  hoverEnabled = hoverSettings.hoverEnabled !== false;
  if (hoverEnabledEl) {
    hoverEnabledEl.checked = hoverEnabled;
  }
  connectLink.href = `${webAppUrl}/extension/connect?from=extension`;
  transcriptsLink.href = transcriptsUrl(webAppUrl);
  const nextSrc = panelUrl(webAppUrl);
  if (appFrame.src !== nextSrc) {
    appFrame.src = nextSrc;
  }
  setTrackingState(hoverEnabled ? 'idle' : 'idle');
  return webAppUrl;
}

async function loadStoredContext() {
  const stored = await chrome.storage.session.get(['lastLiveContext', 'lastHoverContext']);
  if (stored.lastLiveContext) {
    lastContext = stored.lastLiveContext;
  }
  if (stored.lastHoverContext && hoverFeedList && !hoverFeedList.children.length) {
    prependHoverFeedItem({ localText: stored.lastHoverContext });
    setTrackingState('locked');
  }
}

function handleHoverFanout(message) {
  const snippet = message.hover?.localText || message.activeHoverContext || '';
  if (!snippet) {
    return;
  }

  if (!hoverEnabled) {
    setTrackingState('idle');
    return;
  }

  setTrackingState(message.hover?.localText ? 'locked' : 'active');
  scheduleTrackingIdle();
  prependHoverFeedItem({ localText: snippet });
  postHoverToFrame(message);

  if (activeMode === 'ask' && message.hover?.localText) {
    setStatus(`Hover: ${message.hover.localText.slice(0, 80)}`);
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
  transcriptsLink.href = transcriptsUrl(webAppUrl);
  appFrame.src = panelUrl(webAppUrl);
  setStatus('Settings saved — sign in at the web app if the panel asks you to');
});

openTranscriptsBtn?.addEventListener('click', () => {
  chrome.tabs.create({ url: transcriptsUrl(webAppUrl) });
});

for (const pill of modePills) {
  pill.addEventListener('click', () => {
    const mode = pill.dataset.mode;
    if (mode) {
      setActiveMode(mode);
    }
  });
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === 'SET_THEME') {
    applyTheme(message.theme === 'dark' ? 'dark' : 'light');
    return;
  }

  if (message?.type === 'APROKO_CONTEXT_UPDATED' && message.context) {
    lastContext = message.context;
    postContextToFrame(message.context);
    setStatus('Captured — ask in the panel below');
  }
  if (message?.type === 'APROKO_EXTENSION_AUTH_UPDATED') {
    void pushExtensionAuth();
  }
  if (message?.type === 'APROKO_HOVER_FANOUT' || message?.type === 'APROKO_HOVER_UPDATED') {
    handleHoverFanout(message);
  }
});

void loadSettings();
void syncStoredTheme();
void loadStoredContext();

if (hoverEnabledEl) {
  hoverEnabledEl.addEventListener('change', async () => {
    hoverEnabled = hoverEnabledEl.checked;
    await chrome.storage.sync.set({ hoverEnabled });
    setTrackingState(hoverEnabled ? 'idle' : 'idle');
    setStatus(hoverEnabled ? 'Cursor hover focus enabled' : 'Cursor hover focus disabled');
  });
}
