const DEFAULT_WEB_APP_URL = 'https://aprokoai.vercel.app';
const MAX_HOVER_FEED_ITEMS = 12;
const MAX_TRANSCRIPT_ITEMS = 40;

const captureBtn = document.getElementById('capture-btn');
const tabAudioBtn = document.getElementById('tab-audio-btn');
const statusEl = document.getElementById('status');
const webAppUrlEl = document.getElementById('web-app-url');
const hoverEnabledEl = document.getElementById('hover-enabled');
const cursorToggleEl = document.getElementById('cursor-toggle');
const cursorTogglePanelEl = document.getElementById('cursor-toggle-panel');
const saveSettingsBtn = document.getElementById('save-settings');
const connectLink = document.getElementById('connect-link');
const transcriptsLink = document.getElementById('transcripts-link');
const openTranscriptsBtn = document.getElementById('open-transcripts-btn');
const appFrame = document.getElementById('app-frame');
const trackingIndicator = document.getElementById('tracking-indicator');
const trackingLabel = trackingIndicator?.querySelector('.tracking-label');
const hoverFeedList = document.getElementById('hover-feed-list');
const liveTranscriptList = document.getElementById('live-transcript-list');
const modePills = Array.from(document.querySelectorAll('.mode-pill'));
const modePanels = Array.from(document.querySelectorAll('.mode-panel'));

let webAppUrl = DEFAULT_WEB_APP_URL;
let lastContext = null;
let activeMode = 'ask';
let hoverEnabled = true;
let trackingState = 'idle';
let trackingResetTimer = null;
let lastTranscriptFingerprint = '';

function normalizeWebAppUrl(url) {
  let value = String(url || DEFAULT_WEB_APP_URL)
    .trim()
    .replace(/\/$/, '');
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

function syncHoverControls() {
  if (hoverEnabledEl) {
    hoverEnabledEl.checked = hoverEnabled;
  }
  if (cursorToggleEl) {
    cursorToggleEl.checked = hoverEnabled;
  }
  if (cursorTogglePanelEl) {
    cursorTogglePanelEl.checked = hoverEnabled;
  }
  if (trackingIndicator) {
    trackingIndicator.setAttribute('aria-pressed', hoverEnabled ? 'true' : 'false');
    if (!hoverEnabled) {
      trackingIndicator.dataset.state = 'off';
    } else if (trackingIndicator.dataset.state === 'off') {
      trackingIndicator.dataset.state = 'idle';
    }
  }
  if (trackingLabel) {
    trackingLabel.textContent = hoverEnabled ? 'Cursor on' : 'Cursor off';
  }
}

async function setHoverEnabled(next, { persist = true, announce = true } = {}) {
  hoverEnabled = Boolean(next);
  syncHoverControls();
  if (!hoverEnabled) {
    setTrackingState('off');
  } else if (trackingState === 'off') {
    setTrackingState('idle');
  }
  if (persist) {
    await chrome.storage.sync.set({ hoverEnabled });
  }
  if (announce) {
    setStatus(hoverEnabled ? 'Cursor tips on' : 'Cursor tips off');
  }
}

function setTrackingState(state) {
  trackingState = state;
  if (!trackingIndicator) {
    return;
  }
  if (!hoverEnabled) {
    trackingIndicator.dataset.state = 'off';
    if (trackingLabel) {
      trackingLabel.textContent = 'Cursor off';
    }
    return;
  }
  trackingIndicator.dataset.state = state === 'off' ? 'idle' : state;
  if (trackingLabel && (state === 'idle' || state === 'off')) {
    trackingLabel.textContent = 'Cursor on';
  }
}

function scheduleTrackingIdle() {
  if (trackingResetTimer) {
    clearTimeout(trackingResetTimer);
  }
  trackingResetTimer = setTimeout(() => {
    if (trackingState !== 'locked') {
      setTrackingState(hoverEnabled ? 'idle' : 'off');
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

function appendLiveTranscript({ kind, text, meta }) {
  if (!liveTranscriptList) {
    return;
  }
  const snippet = String(text || '').trim();
  if (!snippet) {
    return;
  }

  const fingerprint = `${kind}:${snippet.slice(0, 160)}`;
  if (fingerprint === lastTranscriptFingerprint) {
    return;
  }
  lastTranscriptFingerprint = fingerprint;

  const item = document.createElement('li');
  item.className = 'hover-feed-item transcript-item';

  const time = document.createElement('time');
  time.dateTime = new Date().toISOString();
  time.textContent = formatFeedTime(Date.now());

  const kindEl = document.createElement('span');
  kindEl.className = 'transcript-kind';
  kindEl.textContent =
    kind === 'page' ? 'Page snapshot' : kind === 'capture' ? 'Hover capture' : 'Hover';

  const copy = document.createElement('p');
  const prefix = meta ? `${meta} — ` : '';
  const body = `${prefix}${snippet}`;
  copy.textContent = body.length > 420 ? `${body.slice(0, 417)}…` : body;

  item.append(time, kindEl, copy);
  liveTranscriptList.append(item);
  while (liveTranscriptList.children.length > MAX_TRANSCRIPT_ITEMS) {
    liveTranscriptList.firstElementChild?.remove();
  }
  item.scrollIntoView({ block: 'end' });
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

async function readStoredAuth() {
  try {
    const localStored = await chrome.storage.local.get(['extensionHandoff']);
    if (localStored.extensionHandoff?.token) {
      return localStored.extensionHandoff;
    }
  } catch {
    // ignore
  }

  try {
    const response = await chrome.runtime.sendMessage({ type: 'APROKO_GET_EXTENSION_AUTH' });
    if (response?.ok && response.auth?.token) {
      return response.auth;
    }
  } catch {
    // Service worker may be asleep.
  }

  return null;
}

function deliverAuthToFrame(auth) {
  if (!auth?.token) {
    return;
  }
  postAuthToFrame(auth);
  setTimeout(() => postAuthToFrame(auth), 600);
  setTimeout(() => postAuthToFrame(auth), 1800);
}

async function pushExtensionAuth() {
  const auth = await readStoredAuth();
  if (auth?.token) {
    setStatus(`Signed in${auth.name ? ` · ${auth.name}` : ''}`);
    deliverAuthToFrame(auth);
    return true;
  }

  setStatus('Not signed in — open the connect checklist link below in a browser tab.');
  return false;
}

let authPollTimer = null;
function startAuthPolling() {
  if (authPollTimer) {
    return;
  }
  authPollTimer = setInterval(() => {
    void pushExtensionAuth().then((ok) => {
      if (ok && authPollTimer) {
        clearInterval(authPollTimer);
        authPollTimer = null;
      }
    });
  }, 1500);
}

async function loadSettings() {
  const stored = await chrome.storage.sync.get({ webAppUrl: DEFAULT_WEB_APP_URL });
  webAppUrl = normalizeWebAppUrl(stored.webAppUrl || DEFAULT_WEB_APP_URL);
  webAppUrlEl.value = webAppUrl;
  const hoverSettings = await chrome.storage.sync.get({ hoverEnabled: true });
  hoverEnabled = hoverSettings.hoverEnabled !== false;
  syncHoverControls();
  if (connectLink) {
    connectLink.href = `${webAppUrl}/extension/connect?from=extension`;
  }
  if (transcriptsLink) {
    transcriptsLink.href = transcriptsUrl(webAppUrl);
  }
  const nextSrc = panelUrl(webAppUrl);
  if (appFrame && appFrame.src !== nextSrc) {
    appFrame.src = nextSrc;
  }
  setTrackingState(hoverEnabled ? 'idle' : 'off');
  return webAppUrl;
}

async function loadStoredContext() {
  let stored = {};
  try {
    stored = await chrome.storage.session.get(['lastLiveContext', 'lastHoverContext']);
  } catch {
    // Safari may not support storage.session — fall through with empty
  }
  if (stored.lastLiveContext) {
    lastContext = stored.lastLiveContext;
    const pageText = String(stored.lastLiveContext.pageText || '').trim();
    if (pageText) {
      appendLiveTranscript({
        kind: 'page',
        text: pageText,
        meta: stored.lastLiveContext.title || stored.lastLiveContext.url || '',
      });
    }
  }
  if (stored.lastHoverContext && hoverFeedList && !hoverFeedList.children.length) {
    prependHoverFeedItem({ localText: stored.lastHoverContext });
    appendLiveTranscript({ kind: 'hover', text: stored.lastHoverContext });
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
  appendLiveTranscript({ kind: 'hover', text: snippet });
  postHoverToFrame(message);

  if (activeMode === 'ask' && message.hover?.localText) {
    setStatus(`Hover: ${message.hover.localText.slice(0, 80)}`);
  }
}

function handleHoverCaptured(message) {
  const snippet = message.hover?.localText || message.activeHoverContext || '';
  if (!snippet) {
    return;
  }
  prependHoverFeedItem({ localText: snippet });
  appendLiveTranscript({ kind: 'capture', text: snippet });
  setTrackingState('locked');
  setActiveMode('transcript');
  setStatus('Hover captured — Live Transcript');
}

appFrame.addEventListener('load', () => {
  chrome.runtime.sendMessage({ type: 'APROKO_CLEAR_BADGE' });
  setTimeout(() => {
    void pushExtensionAuth().then((ok) => {
      if (!ok) {
        startAuthPolling();
      }
    });
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

  if (event.data?.type === 'APROKO_PROXY_EXTENSION_SESSION') {
    chrome.runtime.sendMessage(
      {
        type: 'APROKO_PROXY_EXTENSION_SESSION',
        token: event.data.token ?? null,
        workspaceId: event.data.workspaceId ?? null,
        workspaceName: event.data.workspaceName ?? null,
        workspaceRole: event.data.workspaceRole ?? null,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          postMessageToFrame({
            type: 'APROKO_PROXY_EXTENSION_SESSION_RESULT',
            requestId: event.data.requestId,
            ok: false,
            error: chrome.runtime.lastError.message,
          });
          return;
        }
        postMessageToFrame({
          type: 'APROKO_PROXY_EXTENSION_SESSION_RESULT',
          requestId: event.data.requestId,
          ok: Boolean(response?.ok),
          session: response?.session ?? null,
          error: response?.error,
          status: response?.status ?? null,
        });
      },
    );
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
    appendLiveTranscript({
      kind: 'page',
      text: response.context?.pageText || '',
      meta: response.context?.title || response.context?.url || '',
    });
    setStatus('Captured — ask in the panel below');
  });
});

if (tabAudioBtn) {
  const canTabAudio = Boolean(chrome.tabCapture?.getMediaStreamId);
  tabAudioBtn.hidden = !canTabAudio;
  let recording = false;

  tabAudioBtn.addEventListener('click', () => {
    if (!canTabAudio) {
      return;
    }
    if (recording) {
      setStatus('Stopping tab audio…');
      chrome.runtime.sendMessage({ type: 'APROKO_STOP_TAB_AUDIO' }, (response) => {
        recording = false;
        tabAudioBtn.textContent = 'Record tab audio';
        if (chrome.runtime.lastError) {
          setStatus(chrome.runtime.lastError.message);
          return;
        }
        if (!response?.ok) {
          setStatus(response?.error || 'Tab audio failed');
          return;
        }
        appendLiveTranscript({
          kind: 'page',
          text: `Saved tab audio transcript: ${response.name}`,
          meta: 'Tab audio',
        });
        setActiveMode('transcript');
        setStatus(`Saved “${response.name}”. Open Transcripts to review.`);
      });
      return;
    }

    setStatus('Recording tab audio…');
    chrome.runtime.sendMessage({ type: 'APROKO_START_TAB_AUDIO' }, (response) => {
      if (chrome.runtime.lastError) {
        setStatus(chrome.runtime.lastError.message);
        return;
      }
      if (!response?.ok) {
        setStatus(response?.error || 'Tab audio failed');
        return;
      }
      recording = true;
      tabAudioBtn.textContent = 'Stop tab audio';
      setStatus('Recording this tab. Click Stop tab audio when finished.');
    });
  });
}

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
    appendLiveTranscript({
      kind: 'page',
      text: message.context?.pageText || '',
      meta: message.context?.title || message.context?.url || '',
    });
    setStatus('Captured — ask in the panel below');
  }
  if (message?.type === 'APROKO_EXTENSION_AUTH_UPDATED') {
    void pushExtensionAuth().then((ok) => {
      if (ok && authPollTimer) {
        clearInterval(authPollTimer);
        authPollTimer = null;
      }
    });
  }
  if (message?.type === 'APROKO_HOVER_CAPTURED') {
    handleHoverCaptured(message);
    return;
  }
  if (message?.type === 'APROKO_HOVER_FANOUT' || message?.type === 'APROKO_HOVER_UPDATED') {
    handleHoverFanout(message);
  }
});

void loadSettings();
void syncStoredTheme();
void loadStoredContext();
void pushExtensionAuth().then((ok) => {
  if (!ok) {
    startAuthPolling();
  }
});

if (hoverEnabledEl) {
  hoverEnabledEl.addEventListener('change', () => {
    void setHoverEnabled(hoverEnabledEl.checked);
  });
}

if (cursorToggleEl) {
  cursorToggleEl.addEventListener('change', () => {
    void setHoverEnabled(cursorToggleEl.checked);
  });
}

if (cursorTogglePanelEl) {
  cursorTogglePanelEl.addEventListener('change', () => {
    void setHoverEnabled(cursorTogglePanelEl.checked);
  });
}

if (trackingIndicator) {
  trackingIndicator.addEventListener('click', () => {
    void setHoverEnabled(!hoverEnabled);
  });
}
