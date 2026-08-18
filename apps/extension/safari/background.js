const DEFAULT_WEB_APP_URL = 'https://aprokoai.vercel.app';

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

function isRestrictedTabUrl(url) {
  if (!url) {
    return true;
  }
  return /^(chrome|chrome-extension|chrome-search|chrome-untrusted|devtools|edge|about|view-source|safari-extension|safari-web-extension|resource):/i.test(
    url,
  );
}

async function getSettings() {
  const stored = await chrome.storage.sync.get({
    webAppUrl: DEFAULT_WEB_APP_URL,
  });
  return {
    webAppUrl: normalizeWebAppUrl(stored.webAppUrl || DEFAULT_WEB_APP_URL),
  };
}

async function storeHandoff(auth) {
  if (!auth?.token || !auth?.workspaceId) {
    return;
  }

  const payload = {
    extensionHandoff: {
      token: auth.token,
      workspaceId: auth.workspaceId,
      name: auth.name ?? null,
      role: auth.role ?? null,
      storedAt: Date.now(),
    },
  };

  await chrome.storage.session.set(payload);
  await chrome.storage.local.set(payload);
  chrome.runtime.sendMessage({ type: 'APROKO_EXTENSION_AUTH_UPDATED' }).catch(() => {});
}

async function getExtensionAuth() {
  const sessionStored = await chrome.storage.session.get(['extensionHandoff']);
  if (sessionStored.extensionHandoff?.token) {
    return sessionStored.extensionHandoff;
  }
  const localStored = await chrome.storage.local.get(['extensionHandoff']);
  return localStored.extensionHandoff || null;
}

async function fetchWebApp(path, options = {}, authOverride = null) {
  const settings = await getSettings();
  const auth = authOverride || (await getExtensionAuth());
  const url = `${settings.webAppUrl}${path}`;
  const headers = { ...(options.headers || {}) };
  if (auth?.token) {
    headers.Authorization = `Bearer ext.${auth.token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
    cache: 'no-store',
  });
  return { response, auth };
}

async function fetchWebAppJson(path, options = {}, authOverride = null) {
  const { response, auth } = await fetchWebApp(path, options, authOverride);
  const json = await response.json().catch(() => null);
  return { response, json, auth };
}

async function captureActiveTabContext() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    throw new Error('No active tab');
  }

  if (isRestrictedTabUrl(tab.url)) {
    throw new Error(
      'Cannot capture this tab. Switch to a normal webpage (http/https), then open the side panel from the toolbar and press Capture. Chrome blocks extensions on chrome:// pages.',
    );
  }

  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'APROKO_GET_SCREEN_CONTEXT',
    });
    if (response?.ok && response.context) {
      return { tabId: tab.id, context: response.context };
    }
  } catch {
    // Content script may not be injected yet.
  }

  // Fallback scrape if content script is unavailable (still no cursor hover).
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const PAGE_TEXT_MAX = 24000;
        const root = document.body;
        if (!root) {
          return null;
        }
        const clone = root.cloneNode(true);
        clone
          .querySelectorAll(
            'script, style, noscript, svg, iframe, canvas, template, [aria-hidden="true"], [hidden]',
          )
          .forEach((node) => node.remove());
        clone.querySelectorAll('br').forEach((br) => {
          br.replaceWith(document.createTextNode('\n'));
        });
        clone
          .querySelectorAll(
            'p, div, h1, h2, h3, h4, h5, h6, li, tr, section, article, header, footer, nav, main, aside, blockquote, button, a, span, label, pre, code',
          )
          .forEach((el) => {
            el.prepend(document.createTextNode('\n'));
            el.append(document.createTextNode('\n'));
          });
        let text = (clone.innerText || '')
          .replace(/\u00a0/g, ' ')
          .replace(/([a-z])([A-Z])/g, '$1 $2')
          .replace(/[ \t]+\n/g, '\n')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
        const truncated = text.length > PAGE_TEXT_MAX;
        return {
          url: location.href,
          title: document.title || 'Untitled page',
          pageText: truncated ? `${text.slice(0, PAGE_TEXT_MAX)}\n\n[…truncated]` : text,
          activeHoverContext: '',
          capturedAt: new Date().toISOString(),
          truncated,
        };
      },
    });

    if (!result?.pageText) {
      throw new Error('Could not extract page text from this tab');
    }

    return { tabId: tab.id, context: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/Cannot access a chrome:\/\//i.test(message) || /Cannot access contents of/i.test(message)) {
      throw new Error(
        'Cannot capture this tab. Switch to a normal webpage (http/https), then try again.',
      );
    }
    throw error instanceof Error ? error : new Error(message);
  }
}

async function setCaptureBadge(text) {
  try {
    await chrome.action.setBadgeBackgroundColor({ color: '#18181b' });
    await chrome.action.setBadgeText({ text });
  } catch {
    // Older Chrome / no action badge support.
  }
}

async function persistAndBroadcast(context) {
  await chrome.storage.session.set({
    lastLiveContext: context,
    lastLiveContextAt: Date.now(),
    lastHoverContext: context.activeHoverContext || '',
  });
  chrome.runtime.sendMessage({ type: 'APROKO_CONTEXT_UPDATED', context }).catch(() => {});
  await setCaptureBadge('1');
}

/** Capture only — never call chrome.sidePanel.open() from the service worker. */
async function captureAndNotify() {
  const { context } = await captureActiveTabContext();
  await persistAndBroadcast(context);
  return context;
}

chrome.commands.onCommand.addListener((command) => {
  if (command !== 'toggle-aproko-live-context') {
    return;
  }

  void captureAndNotify().catch(async (error) => {
    console.error('Aproko capture failed', error);
    await setCaptureBadge('!');
  });
});

chrome.runtime.onInstalled.addListener(async () => {
  // Safari Web Extensions use action.default_popup (no sidePanel API).
  await setCaptureBadge('');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'SET_THEME') {
    void (async () => {
      try {
        const theme = message.theme === 'dark' ? 'dark' : 'light';
        await chrome.storage.local.set({ appTheme: theme });
        // Fan-out to any open side-panels/popups.
        await chrome.runtime.sendMessage({ type: 'SET_THEME', theme }).catch(() => {});
        sendResponse({ ok: true });
      } catch {
        sendResponse({ ok: false });
      }
    })();
    return true;
  }

  if (message?.type === 'APROKO_HOVER_UPDATED') {
    const activeHoverContext = message.activeHoverContext || '';
    void chrome.storage.session.set({
      lastHoverContext: activeHoverContext,
      lastHoverAt: Date.now(),
      lastHoverTabId: sender.tab?.id ?? null,
    });
    // Fan-out with a distinct type so this worker does not re-handle its own broadcast.
    chrome.runtime
      .sendMessage({
        type: 'APROKO_HOVER_FANOUT',
        hover: message.hover,
        activeHoverContext,
        tabId: sender.tab?.id ?? null,
      })
      .catch(() => {});
    sendResponse({ ok: true });
    return true;
  }

  if (message?.type === 'APROKO_SOLVE_CLICK') {
    void (async () => {
      try {
        const settings = await getSettings();
        const webAppUrl = settings.webAppUrl;
        const solveUrls = [
          `${webAppUrl}/api/v1/live-context/solve`,
          null,
        ];

        const { response: workspaceRes, json: workspacePayload, auth } = await fetchWebAppJson(
          '/api/v1/workspaces/current',
        );
        if (!workspaceRes.ok || !workspacePayload?.data?.workspaceId) {
          throw new Error(
            workspacePayload?.error ||
              'Not signed in. Open Aproko at the web app URL in this browser profile, then try again.',
          );
        }

        const workspaceId = auth?.workspaceId || workspacePayload.data.workspaceId;
        solveUrls[1] = `${webAppUrl}/api/v1/workspaces/${workspaceId}/live-context/solve`;

        const context = message.context || {};
        const body = JSON.stringify({
          url: context.url,
          title: context.title,
          pageText: context.pageText,
          fullPageContext: context.pageText,
          activeHoverContext: context.activeHoverContext || '',
          capturedAt: context.capturedAt || new Date().toISOString(),
          userQuery:
            context.userQuery ||
            'Solve the clicked question using the full page and cursor focus.',
        });

        let lastError = 'Solve failed';
        const solveHeaders = { 'Content-Type': 'application/json' };
        if (auth?.token) {
          solveHeaders.Authorization = `Bearer ext.${auth.token}`;
        }

        for (const solveUrl of solveUrls) {
          if (!solveUrl) {
            continue;
          }
          const solveRes = await fetch(solveUrl, {
            method: 'POST',
            credentials: 'include',
            headers: solveHeaders,
            body,
          });
          const solvePayload = await solveRes.json().catch(() => null);
          if (solveRes.ok && solvePayload?.data) {
            sendResponse({ ok: true, data: solvePayload.data });
            return;
          }
          lastError =
            solvePayload?.error ||
            (solveRes.status === 401
              ? 'Not signed in. Open Aproko at the web app URL in this browser profile.'
              : `Solve failed (${solveRes.status})`);
          // Retry fallback on missing route only.
          if (solveRes.status !== 404) {
            break;
          }
        }
        throw new Error(lastError);
      } catch (error) {
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : 'Solve failed',
        });
      }
    })();
    return true;
  }

  if (message?.type === 'APROKO_TOGGLE_FROM_OVERLAY' || message?.type === 'APROKO_CAPTURE_NOW') {
    captureAndNotify()
      .then((context) => sendResponse({ ok: true, context }))
      .catch((error) =>
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : 'Capture failed',
        }),
      );
    return true;
  }

  if (message?.type === 'APROKO_CLEAR_BADGE') {
    void setCaptureBadge('');
    sendResponse({ ok: true });
    return true;
  }

  if (message?.type === 'APROKO_STORE_HANDOFF') {
    void storeHandoff(message).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message?.type === 'APROKO_GET_EXTENSION_AUTH') {
    getExtensionAuth()
      .then((auth) => sendResponse({ ok: true, auth }))
      .catch((error) =>
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : 'Auth failed',
        }),
      );
    return true;
  }

  if (message?.type === 'APROKO_PROXY_LIVE_CONTEXT_CHAT') {
    void (async () => {
      try {
        const workspaceId = message.workspaceId;
        if (!workspaceId) {
          throw new Error('Missing workspace');
        }

        const authOverride = message.token
          ? {
              token: message.token,
              workspaceId,
              name: message.workspaceName ?? null,
              role: message.workspaceRole ?? null,
            }
          : null;

        if (authOverride?.token) {
          await storeHandoff(authOverride);
        }

        const { response } = await fetchWebApp(
          '/api/v1/extension/live-context/chat',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message.body ?? {}),
          },
          authOverride,
        );

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          sendResponse({
            ok: false,
            error:
              payload?.error ||
              (response.status === 401
                ? 'Session expired. Open the connect checklist in a browser tab, then reload the panel.'
                : `Ask failed (${response.status})`),
          });
          return;
        }

        const sse = await response.text();
        sendResponse({ ok: true, sse });
      } catch (error) {
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : 'Ask failed',
        });
      }
    })();
    return true;
  }

  if (message?.type === 'APROKO_GET_SETTINGS') {
    getSettings()
      .then((settings) => sendResponse({ ok: true, settings }))
      .catch((error) =>
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : 'Settings failed',
        }),
      );
    return true;
  }

  return false;
});
