/**
 * Aproko Live Context — content script
 * Full-page scrape + cursor-following hover tip + Alt/Option-click solve.
 */

const PAGE_TEXT_MAX = 24_000;
const HOVER_THROTTLE_MS = 175;
const HOVER_LOCAL_MAX = 1_200;
const HOVER_PARENT_MAX = 2_400;

const state = {
  fullPageContext: null,
  activeHoverContext: null,
  lastPointer: { x: 0, y: 0 },
  lastClickedEl: null,
  solving: false,
  /** Store-friendly default: allow users to opt out of hover tracking. */
  hoverEnabled: true,
};

function normalizeReadableText(text) {
  return String(text || '')
    .replace(/\u00a0/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Za-z])(\d)/g, '$1 $2')
    .replace(/(\d)([A-Za-z])/g, '$1 $2')
    .replace(
      /([^\s|•·\n])(Menu|About|Contact|Home|Blog|Pricing|Recipes|Order|Shop|Cart|Login|Sign|Gifting|New|Bulk)/g,
      '$1\n$2',
    )
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function extractReadablePageText(root) {
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
      'p, div, h1, h2, h3, h4, h5, h6, li, tr, section, article, header, footer, nav, main, aside, blockquote, button, a, span, label, pre, code, td, th',
    )
    .forEach((el) => {
      el.prepend(document.createTextNode('\n'));
      el.append(document.createTextNode('\n'));
    });

  return normalizeReadableText(clone.innerText || '');
}

function scrapeFullPageContext() {
  try {
    const root = document.body;
    if (!root) {
      state.fullPageContext = {
        url: location.href,
        title: document.title || 'Untitled page',
        pageText: '',
        capturedAt: new Date().toISOString(),
        truncated: false,
      };
      return state.fullPageContext;
    }

    const pageTextRaw = extractReadablePageText(root);
    const truncated = pageTextRaw.length > PAGE_TEXT_MAX;
    state.fullPageContext = {
      url: location.href,
      title:
        document.title ||
        document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
        'Untitled page',
      pageText: truncated
        ? `${pageTextRaw.slice(0, PAGE_TEXT_MAX)}\n\n[…truncated]`
        : pageTextRaw,
      capturedAt: new Date().toISOString(),
      truncated,
    };
    return state.fullPageContext;
  } catch (error) {
    console.warn('Aproko full-page scrape failed', error);
    return state.fullPageContext;
  }
}

function textOf(el, max) {
  if (!el) {
    return '';
  }
  const raw = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
  if (!raw) {
    return '';
  }
  return raw.length > max ? `${raw.slice(0, max)}…` : raw;
}

function isOurUi(el) {
  return Boolean(
    el?.id === 'aproko-live-overlay-host' ||
      el?.id === 'aproko-cursor-tip-host' ||
      el?.closest?.('#aproko-live-overlay-host, #aproko-cursor-tip-host'),
  );
}

function resolveHoverContext(clientX, clientY) {
  let el = null;
  try {
    el = document.elementFromPoint(clientX, clientY);
  } catch {
    return null;
  }
  if (!el || isOurUi(el)) {
    return state.activeHoverContext;
  }

  const target =
    el.closest?.(
      'p, li, h1, h2, h3, h4, h5, h6, pre, code, td, th, blockquote, label, span, a, button, div, section, article',
    ) || el;

  const localText = textOf(target, HOVER_LOCAL_MAX);
  if (!localText) {
    return null;
  }

  const parent = target.parentElement;
  const parentText = textOf(parent, HOVER_PARENT_MAX);
  const surrounding =
    parentText && parentText !== localText && parentText.includes(localText.slice(0, 40))
      ? parentText
      : localText;

  return {
    localText,
    surroundingText: surrounding,
    tagName: (target.tagName || '').toLowerCase(),
    updatedAt: new Date().toISOString(),
  };
}

function formatHoverForPrompt(hover) {
  if (!hover?.localText) {
    return '';
  }
  const lines = [`[Hover node: ${hover.tagName || 'unknown'}]`, hover.localText];
  if (hover.surroundingText && hover.surroundingText !== hover.localText) {
    lines.push('', '[Parent / surrounding block]', hover.surroundingText);
  }
  return lines.join('\n');
}

function publishHover(hover) {
  const prev = state.activeHoverContext?.localText || '';
  state.activeHoverContext = hover;
  if ((hover?.localText || '') === prev) {
    return;
  }
  chrome.runtime
    .sendMessage({
      type: 'APROKO_HOVER_UPDATED',
      hover,
      activeHoverContext: formatHoverForPrompt(hover),
    })
    .catch(() => {});
}

function throttle(fn, waitMs) {
  let last = 0;
  let timer = null;
  let pendingArgs = null;
  return (...args) => {
    const now = Date.now();
    const remaining = waitMs - (now - last);
    pendingArgs = args;
    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      last = now;
      fn(...pendingArgs);
      pendingArgs = null;
      return;
    }
    if (!timer) {
      timer = setTimeout(() => {
        last = Date.now();
        timer = null;
        if (pendingArgs) {
          fn(...pendingArgs);
          pendingArgs = null;
        }
      }, remaining);
    }
  };
}

function ensureCursorTip() {
  let host = document.getElementById('aproko-cursor-tip-host');
  if (host) {
    return host;
  }
  host = document.createElement('div');
  host.id = 'aproko-cursor-tip-host';
  host.style.cssText =
    'all:initial;position:fixed;z-index:2147483647;pointer-events:none;display:none;max-width:280px;';
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      .tip {
        font: 12px/1.4 ui-sans-serif, system-ui, sans-serif;
        background: rgba(24, 24, 27, 0.96);
        color: #fafafa;
        border: 1px solid rgba(228, 228, 231, 0.28);
        border-radius: 12px;
        padding: 8px 10px;
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.28);
        white-space: pre-wrap;
        word-break: break-word;
      }
      .tip strong { color: #fafafa; font-weight: 600; }
      .tip .meta { color: #a1a1aa; font-size: 10px; margin-top: 4px; opacity: 0.9; }
    </style>
    <div class="tip" id="tip"></div>
  `;
  return host;
}

function positionCursorTip(x, y) {
  const host = ensureCursorTip();
  const offset = 16;
  const maxLeft = window.innerWidth - host.offsetWidth - 12;
  const maxTop = window.innerHeight - host.offsetHeight - 12;
  host.style.left = `${Math.max(8, Math.min(x + offset, maxLeft))}px`;
  host.style.top = `${Math.max(8, Math.min(y + offset, maxTop))}px`;
}

function showCursorTip(html, x, y) {
  const host = ensureCursorTip();
  const tip = host.shadowRoot?.getElementById('tip');
  if (!tip) {
    return;
  }
  tip.innerHTML = html;
  host.style.display = 'block';
  positionCursorTip(x, y);
}

function hideCursorTip() {
  const host = document.getElementById('aproko-cursor-tip-host');
  if (host) {
    host.style.display = 'none';
  }
}

function clearHighlights() {
  document.querySelectorAll('[data-aproko-highlight="1"]').forEach((el) => {
    el.style.outline = '';
    el.style.outlineOffset = '';
    el.style.backgroundColor = '';
    el.removeAttribute('data-aproko-highlight');
  });
}

function highlightEl(el) {
  if (!el) {
    return;
  }
  el.setAttribute('data-aproko-highlight', '1');
  el.style.outline = '2px solid #18181b';
  el.style.outlineOffset = '2px';
  el.style.backgroundColor = 'rgba(217,119,6,0.12)';
}

function findNearbyInput(fromEl) {
  const root =
    fromEl?.closest?.(
      'form, fieldset, [role="group"], .question, .quiz-question, .assessment, li, div, section, article',
    ) || document.body;

  const candidates = root.querySelectorAll(
    'textarea, input[type="text"], input[type="search"], input:not([type]), [contenteditable="true"]',
  );
  return candidates[0] || null;
}

function fillInput(el, value) {
  if (!el || !value) {
    return false;
  }
  if (el.isContentEditable) {
    el.focus();
    el.textContent = value;
    el.dispatchEvent(new InputEvent('input', { bubbles: true }));
    return true;
  }
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
  descriptor?.set?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

function findAndSelectOption(fromEl, optionKey, optionText) {
  const root =
    fromEl?.closest?.(
      'form, fieldset, [role="group"], .question, .quiz-question, .assessment, li, div, section, article',
    ) || document.body;

  const key = (optionKey || '').toString().trim().toUpperCase();
  const needle = (optionText || '').toString().trim().toLowerCase();
  const nodes = [...root.querySelectorAll('label, li, button, [role="radio"], [role="option"], span, div, p')];

  let best = null;
  for (const node of nodes) {
    const text = (node.innerText || '').replace(/\s+/g, ' ').trim();
    if (!text || text.length > 400) {
      continue;
    }
    const upper = text.toUpperCase();
    const lower = text.toLowerCase();
    const keyHit =
      key &&
      (new RegExp(`^\\s*${key}[)\\].:\\-\\s]`).test(upper) ||
        upper.startsWith(`${key})`) ||
        upper.startsWith(`${key}.`));
    const textHit = needle && lower.includes(needle.slice(0, Math.min(40, needle.length)));
    if (keyHit || textHit) {
      best = node;
      if (keyHit) {
        break;
      }
    }
  }

  if (!best) {
    return false;
  }

  highlightEl(best);
  const input =
    best.matches?.('input')
      ? best
      : best.querySelector?.('input[type="radio"], input[type="checkbox"]') ||
        best.closest?.('label')?.control ||
        null;
  if (input && 'click' in input) {
    input.click();
  } else {
    best.click?.();
  }
  return true;
}

function applySolveResult(result, clickedEl) {
  clearHighlights();
  let applied = false;

  if (result.kind === 'mcq') {
    applied = findAndSelectOption(clickedEl, result.optionKey, result.optionText);
  }

  if (result.kind === 'short' || result.fillText) {
    const input = findNearbyInput(clickedEl);
    if (input && result.fillText) {
      applied = fillInput(input, result.fillText) || applied;
      highlightEl(input);
    }
  }

  return applied;
}

function getScreenContextPayload() {
  const full = scrapeFullPageContext() || state.fullPageContext;
  const hover =
    state.activeHoverContext ||
    resolveHoverContext(state.lastPointer.x, state.lastPointer.y);

  return {
    ...(full || {
      url: location.href,
      title: document.title || 'Untitled page',
      pageText: '',
      capturedAt: new Date().toISOString(),
      truncated: false,
    }),
    activeHoverContext: formatHoverForPrompt(hover),
    hover,
  };
}

async function solveAtClick(event) {
  if (state.solving) {
    return;
  }
  const target = event.target;
  if (isOurUi(target)) {
    return;
  }

  state.solving = true;
  state.lastClickedEl = target instanceof Element ? target : null;
  const payload = getScreenContextPayload();
  const question =
    payload.activeHoverContext ||
    textOf(
      target?.closest?.(
        'p, li, label, h1, h2, h3, h4, div, section, article, fieldset, legend',
      ) || target,
      2_000,
    );

  showCursorTip(
    `<strong>Solving…</strong><div class="meta">Reading full page + clicked question</div>`,
    event.clientX,
    event.clientY,
  );

  chrome.runtime.sendMessage(
    {
      type: 'APROKO_SOLVE_CLICK',
      context: {
        ...payload,
        activeHoverContext: question,
        userQuery:
          'Solve the clicked question. If multiple choice, pick the correct option. If a blank/text answer, provide fillText.',
      },
    },
    (response) => {
      state.solving = false;
      if (chrome.runtime.lastError || !response?.ok) {
        showCursorTip(
          `<strong>Solve failed</strong>\n${
            response?.error || chrome.runtime.lastError?.message || 'Unknown error'
          }<div class="meta">Keep the extension on · sign in at your Web app URL · Alt/Option-click again</div>`,
          event.clientX,
          event.clientY,
        );
        return;
      }

      const data = response.data || {};
      const applied = applySolveResult(data, state.lastClickedEl);
      const headline =
        data.kind === 'mcq'
          ? `Choose ${data.optionKey || '?'}${data.optionText ? ` — ${data.optionText}` : ''}`
          : data.fillText || data.explanation || 'Done';

      showCursorTip(
        `<strong>${headline}</strong>\n${data.explanation || ''}<div class="meta">${
          applied ? 'Applied on page' : 'Shown only — could not auto-select field'
        }</div>`,
        event.clientX,
        event.clientY,
      );
    },
  );
}

const onMouseMove = throttle((event) => {
  state.lastPointer = { x: event.clientX, y: event.clientY };
  if (isOurUi(event.target)) {
    return;
  }

  if (!state.hoverEnabled) {
    return;
  }

  const hover = resolveHoverContext(event.clientX, event.clientY);
  if (hover) {
    publishHover(hover);
    if (!state.solving) {
      showCursorTip(
        `${hover.localText.slice(0, 180)}<div class="meta">Alt/Option-click to solve</div>`,
        event.clientX,
        event.clientY,
      );
    }
  }
}, HOVER_THROTTLE_MS);

function ensureCaptureChip() {
  if (document.getElementById('aproko-live-overlay-host')) {
    return;
  }
  const host = document.createElement('div');
  host.id = 'aproko-live-overlay-host';
  host.style.cssText = 'all:initial;position:fixed;z-index:2147483646;right:16px;bottom:16px;';
  document.documentElement.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      button {
        font: 600 12px ui-sans-serif, system-ui, sans-serif;
        border: 0; border-radius: 999px;
        background: #18181b;
        color: #fafafa;
        padding: 10px 14px; cursor: pointer;
        box-shadow: 0 10px 28px rgba(24, 24, 27, 0.22);
      }
      .hint { margin: 6px 0 0; font: 11px/1.3 ui-sans-serif, system-ui, sans-serif; color: #78716c; text-align: right; max-width: 220px; }
    </style>
    <button type="button" id="aproko-ask">Capture for Aproko</button>
    <p class="hint">Panel optional. Hover tip + Alt/Option-click work while the extension is on.</p>
  `;
  shadow.getElementById('aproko-ask')?.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'APROKO_TOGGLE_FROM_OVERLAY' });
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'APROKO_GET_SCREEN_CONTEXT') {
    try {
      sendResponse({ ok: true, context: getScreenContextPayload() });
    } catch (error) {
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to capture page context',
      });
    }
    return true;
  }
  if (message?.type === 'APROKO_GET_HOVER_CONTEXT') {
    sendResponse({
      ok: true,
      hover: state.activeHoverContext,
      activeHoverContext: formatHoverForPrompt(state.activeHoverContext),
    });
    return true;
  }
  if (message?.type === 'APROKO_ENSURE_OVERLAY') {
    ensureCaptureChip();
    ensureCursorTip();
    sendResponse({ ok: true });
    return true;
  }
  return false;
});

document.addEventListener('mousemove', onMouseMove, { passive: true });
document.addEventListener(
  'click',
  (event) => {
    // Alt/Option-click = solve (does not steal normal test clicks).
    if (event.altKey) {
      event.preventDefault();
      event.stopPropagation();
      void solveAtClick(event);
    }
  },
  true,
);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    hideCursorTip();
    clearHighlights();
  }
});

ensureCaptureChip();
ensureCursorTip();

// User control for hover tracking (store/privacy review friendly).
(async () => {
  try {
    const stored = await chrome.storage.sync.get({ hoverEnabled: true });
    state.hoverEnabled = stored.hoverEnabled !== false;
  } catch {
    // default true
  }
})();

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') {
    return;
  }
  if (Object.prototype.hasOwnProperty.call(changes, 'hoverEnabled')) {
    const next = changes.hoverEnabled?.newValue;
    state.hoverEnabled = next !== false;
    if (!state.hoverEnabled) {
      hideCursorTip();
      clearHighlights();
    }
  }
});

function bridgeExtensionHandoffFromConnectPage() {
  if (!location.pathname.includes('/extension/connect')) {
    return;
  }

  const params = new URLSearchParams(location.search);
  if (params.get('from') !== 'extension') {
    return;
  }

  function publishHandoff() {
    const token = document.documentElement.dataset.aprokoExtensionHandoff;
    if (!token) {
      return false;
    }

    chrome.runtime.sendMessage({
      type: 'APROKO_STORE_HANDOFF',
      token,
      workspaceId: document.documentElement.dataset.aprokoExtensionWorkspaceId || '',
      name: document.documentElement.dataset.aprokoExtensionWorkspaceName || null,
      role: document.documentElement.dataset.aprokoExtensionRole || null,
    });
    return true;
  }

  if (publishHandoff()) {
    return;
  }

  const observer = new MutationObserver(() => {
    if (publishHandoff()) {
      observer.disconnect();
    }
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [
      'data-aproko-extension-handoff',
      'data-aproko-extension-workspace-id',
    ],
  });

  let attempts = 0;
  const timer = window.setInterval(() => {
    if (publishHandoff() || ++attempts >= 30) {
      window.clearInterval(timer);
      observer.disconnect();
    }
  }, 500);
}

window.addEventListener('message', (event) => {
  if (event.source !== window || event.origin !== location.origin) {
    return;
  }
  if (event.data?.type !== 'APROKO_HANDOFF_READY') {
    return;
  }

  const token = document.documentElement.dataset.aprokoExtensionHandoff;
  if (!token) {
    return;
  }

  chrome.runtime.sendMessage({
    type: 'APROKO_STORE_HANDOFF',
    token,
    workspaceId: document.documentElement.dataset.aprokoExtensionWorkspaceId || '',
    name: document.documentElement.dataset.aprokoExtensionWorkspaceName || null,
    role: document.documentElement.dataset.aprokoExtensionRole || null,
  });
});

bridgeExtensionHandoffFromConnectPage();
