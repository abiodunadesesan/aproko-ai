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
  /** Inline ask mode — cursor tip becomes an input + answer card. */
  askMode: false,
  askStreaming: false,
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
      pageText: truncated ? `${pageTextRaw.slice(0, PAGE_TEXT_MAX)}\n\n[…truncated]` : pageTextRaw,
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

      /* Inline ask mode */
      .ask-container { display: none; }
      .ask-container.is-active { display: flex; flex-direction: column; gap: 6px; }
      .ask-row {
        display: flex; gap: 4px; align-items: center;
      }
      .ask-input {
        flex: 1; border: 1px solid rgba(228, 228, 231, 0.3); border-radius: 8px;
        background: rgba(255, 255, 255, 0.08); color: #fafafa;
        font: 12px/1.4 ui-sans-serif, system-ui, sans-serif;
        padding: 6px 8px; outline: none; min-width: 0;
      }
      .ask-input::placeholder { color: #71717a; }
      .ask-input:focus { border-color: rgba(228, 228, 231, 0.55); }
      .ask-mic {
        width: 28px; height: 28px; border: 0; border-radius: 999px;
        background: rgba(255, 255, 255, 0.1); color: #fafafa;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        font-size: 14px; flex-shrink: 0; transition: background 0.15s;
      }
      .ask-mic:hover { background: rgba(255, 255, 255, 0.18); }
      .ask-mic.recording { background: rgba(239, 68, 68, 0.5); animation: mic-pulse 1.2s ease infinite; }
      @keyframes mic-pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
        50% { box-shadow: 0 0 0 5px rgba(239, 68, 68, 0); }
      }
      .ask-answer {
        font: 12px/1.5 ui-sans-serif, system-ui, sans-serif;
        color: #e4e4e7; white-space: pre-wrap; word-break: break-word;
        max-height: 260px; overflow-y: auto;
      }
      .ask-answer:empty { display: none; }
      .ask-hint { color: #71717a; font-size: 10px; }
    </style>
    <div class="tip" id="tip"></div>
    <div class="ask-container" id="ask-container">
      <div class="ask-row">
        <input class="ask-input" id="ask-input" placeholder="Ask about this…" autocomplete="off" />
        <button class="ask-mic" id="ask-mic" title="Voice input" aria-label="Voice input">🎤</button>
      </div>
      <div class="ask-answer" id="ask-answer"></div>
      <div class="ask-hint" id="ask-hint">Enter to send · Esc to close</div>
    </div>
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
  if (state.askMode) {
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
  exitAskMode();
}

/* ─── Inline Ask Mode ─── */

function enterAskMode() {
  if (state.askMode) {
    return;
  }
  state.askMode = true;
  const host = ensureCursorTip();
  host.style.pointerEvents = 'auto';
  host.style.display = 'block';
  host.style.maxWidth = '340px';
  positionCursorTip(state.lastPointer.x, state.lastPointer.y);

  const shadow = host.shadowRoot;
  const tip = shadow?.getElementById('tip');
  const askContainer = shadow?.getElementById('ask-container');
  const askInput = shadow?.getElementById('ask-input');
  const askAnswer = shadow?.getElementById('ask-answer');
  if (tip) tip.style.display = 'none';
  if (askContainer) askContainer.classList.add('is-active');
  if (askAnswer) askAnswer.textContent = '';
  if (askInput) {
    askInput.value = '';
    setTimeout(() => askInput.focus(), 30);
  }
}

function exitAskMode() {
  if (!state.askMode) {
    return;
  }
  state.askMode = false;
  state.askStreaming = false;
  const host = document.getElementById('aproko-cursor-tip-host');
  if (!host) return;
  host.style.pointerEvents = 'none';
  host.style.maxWidth = '280px';
  const shadow = host.shadowRoot;
  const tip = shadow?.getElementById('tip');
  const askContainer = shadow?.getElementById('ask-container');
  if (tip) tip.style.display = '';
  if (askContainer) askContainer.classList.remove('is-active');
  stopMicRecording();
}

function handleAskSubmit(query) {
  if (!query.trim() || state.askStreaming) {
    return;
  }
  state.askStreaming = true;
  const host = ensureCursorTip();
  const shadow = host.shadowRoot;
  const askInput = shadow?.getElementById('ask-input');
  const askAnswer = shadow?.getElementById('ask-answer');
  const askHint = shadow?.getElementById('ask-hint');
  if (askInput) askInput.value = '';
  if (askAnswer) askAnswer.textContent = 'Thinking…';
  if (askHint) askHint.textContent = 'Streaming answer…';

  const payload = getScreenContextPayload();
  chrome.runtime.sendMessage(
    {
      type: 'APROKO_PROXY_LIVE_CONTEXT_CHAT',
      body: {
        url: payload.url,
        title: payload.title,
        pageText: payload.pageText,
        fullPageContext: payload.pageText,
        activeHoverContext: payload.activeHoverContext || '',
        capturedAt: payload.capturedAt || new Date().toISOString(),
        userQuery: query.trim(),
        persistCapture: true,
      },
    },
    (response) => {
      state.askStreaming = false;
      if (chrome.runtime.lastError || !response?.ok) {
        const msg = response?.error || chrome.runtime.lastError?.message || 'Ask failed';
        if (askAnswer) askAnswer.textContent = msg;
        if (askHint) askHint.textContent = 'Enter to retry · Esc to close';
        return;
      }
      const sse = response.sse || '';
      const text = parseSseDeltas(sse);
      if (askAnswer) askAnswer.textContent = text || 'No answer returned.';
      if (askHint) askHint.textContent = 'Ask a follow-up or Esc to close';
      if (askInput) setTimeout(() => askInput.focus(), 30);
    },
  );
}

function parseSseDeltas(raw) {
  let result = '';
  const frames = String(raw).split('\n\n');
  for (const frame of frames) {
    const eventLine = frame.split('\n').find((l) => l.startsWith('event:'));
    const dataLine = frame.split('\n').find((l) => l.startsWith('data:'));
    if (!eventLine || !dataLine) continue;
    const event = eventLine.replace('event:', '').trim();
    if (event !== 'delta') continue;
    try {
      const payload = JSON.parse(dataLine.replace('data:', '').trim());
      if (payload.content) result += payload.content;
    } catch {
      /* ignore */
    }
  }
  return result.trim();
}

/* ─── Mic (getUserMedia → Whisper via background) ─── */

let micMediaStream = null;
let micRecorder = null;
let micChunks = [];

function toggleMicRecording() {
  if (micRecorder && micRecorder.state === 'recording') {
    micRecorder.stop();
    return;
  }
  startMicRecording();
}

async function startMicRecording() {
  const host = ensureCursorTip();
  const micBtn = host.shadowRoot?.getElementById('ask-mic');
  const askInput = host.shadowRoot?.getElementById('ask-input');
  const askHint = host.shadowRoot?.getElementById('ask-hint');

  try {
    micMediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    if (askInput) askInput.placeholder = 'Mic access denied — type your question';
    return;
  }

  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : '';

  micChunks = [];
  micRecorder = new MediaRecorder(micMediaStream, mimeType ? { mimeType } : {});
  if (micBtn) micBtn.classList.add('recording');
  if (askHint) askHint.textContent = 'Recording… tap 🎤 to stop';

  micRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) micChunks.push(e.data);
  };

  micRecorder.onstop = async () => {
    if (micBtn) micBtn.classList.remove('recording');
    if (micMediaStream) {
      micMediaStream.getTracks().forEach((t) => t.stop());
      micMediaStream = null;
    }
    micRecorder = null;

    if (!micChunks.length) return;
    const blob = new Blob(micChunks, { type: mimeType || 'audio/webm' });
    micChunks = [];

    if (askHint) askHint.textContent = 'Transcribing…';
    if (askInput) askInput.placeholder = 'Transcribing…';

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      chrome.runtime.sendMessage(
        { type: 'APROKO_TRANSCRIBE_AUDIO', audioDataUrl: dataUrl },
        (response) => {
          if (chrome.runtime.lastError || !response?.ok) {
            if (askInput) {
              askInput.placeholder = response?.error || 'Transcription failed — type instead';
            }
            if (askHint) askHint.textContent = 'Enter to send · Esc to close';
            return;
          }
          const text = (response.text || '').trim();
          if (askInput) {
            askInput.value = text;
            askInput.placeholder = 'Ask about this…';
          }
          if (askHint) askHint.textContent = 'Enter to send · Esc to close';
          if (text) handleAskSubmit(text);
        },
      );
    };
    reader.readAsDataURL(blob);
  };

  micRecorder.start();
}

function stopMicRecording() {
  if (micRecorder && micRecorder.state === 'recording') {
    try {
      micRecorder.stop();
    } catch {
      /* already stopped */
    }
  }
  if (micMediaStream) {
    micMediaStream.getTracks().forEach((t) => t.stop());
    micMediaStream = null;
  }
  const host = document.getElementById('aproko-cursor-tip-host');
  const micBtn = host?.shadowRoot?.getElementById('ask-mic');
  if (micBtn) micBtn.classList.remove('recording');
}

function setupAskModeListeners() {
  const host = ensureCursorTip();
  const shadow = host.shadowRoot;
  const askInput = shadow?.getElementById('ask-input');
  const askMic = shadow?.getElementById('ask-mic');

  if (askInput) {
    askInput.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleAskSubmit(askInput.value);
      }
      if (e.key === 'Escape') {
        exitAskMode();
        hideCursorTip();
      }
    });
  }
  if (askMic) {
    askMic.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMicRecording();
    });
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
  el.style.backgroundColor = 'rgba(24, 24, 27, 0.06)';
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
  const proto =
    el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
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
  const nodes = [
    ...root.querySelectorAll('label, li, button, [role="radio"], [role="option"], span, div, p'),
  ];

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
  const input = best.matches?.('input')
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
    state.activeHoverContext || resolveHoverContext(state.lastPointer.x, state.lastPointer.y);

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
      target?.closest?.('p, li, label, h1, h2, h3, h4, div, section, article, fieldset, legend') ||
        target,
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
        `${hover.localText.slice(0, 180)}<div class="meta">Alt/Option-click to solve · Ctrl+/ to ask</div>`,
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
  if (message?.type === 'APROKO_GET_HOVER_CONTEXT' || message?.type === 'APROKO_CAPTURE_HOVER') {
    const hover =
      state.activeHoverContext || resolveHoverContext(state.lastPointer.x, state.lastPointer.y);
    if (!hover?.localText) {
      sendResponse({
        ok: false,
        error: 'No hover target. Move the cursor over readable text, then press Cmd/Ctrl+Shift+H.',
      });
      return true;
    }
    sendResponse({
      ok: true,
      hover,
      activeHoverContext: formatHoverForPrompt(hover),
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
    if (state.askMode) {
      exitAskMode();
      return;
    }
    hideCursorTip();
    clearHighlights();
  }
  if (event.ctrlKey && event.key === '/' && !event.shiftKey && !event.altKey && !event.metaKey) {
    event.preventDefault();
    event.stopPropagation();
    enterAskMode();
  }
});

ensureCaptureChip();
ensureCursorTip();
setupAskModeListeners();

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

  function publishHandoff() {
    const token = document.documentElement.dataset.aprokoExtensionHandoff;
    if (!token) {
      return false;
    }

    const msg = {
      type: 'APROKO_STORE_HANDOFF',
      token,
      workspaceId: document.documentElement.dataset.aprokoExtensionWorkspaceId || '',
      name: document.documentElement.dataset.aprokoExtensionWorkspaceName || null,
      role: document.documentElement.dataset.aprokoExtensionRole || null,
    };

    // Send with callback — retries if the service worker was sleeping.
    function trySend(attemptsLeft) {
      chrome.runtime.sendMessage(msg, (response) => {
        if (chrome.runtime.lastError || !response?.ok) {
          if (attemptsLeft > 0) {
            setTimeout(() => trySend(attemptsLeft - 1), 800);
          }
        }
      });
    }
    trySend(4);
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
    attributeFilter: ['data-aproko-extension-handoff', 'data-aproko-extension-workspace-id'],
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

  // Fire-and-forget with retry in case service worker was sleeping.
  const msg = {
    type: 'APROKO_STORE_HANDOFF',
    token,
    workspaceId: document.documentElement.dataset.aprokoExtensionWorkspaceId || '',
    name: document.documentElement.dataset.aprokoExtensionWorkspaceName || null,
    role: document.documentElement.dataset.aprokoExtensionRole || null,
  };
  function trySendMsg(n) {
    chrome.runtime.sendMessage(msg, (r) => {
      if ((chrome.runtime.lastError || !r?.ok) && n > 0) {
        setTimeout(() => trySendMsg(n - 1), 800);
      }
    });
  }
  trySendMsg(4);
});

bridgeExtensionHandoffFromConnectPage();
