(() => {
  'use strict';
  const DICT = window.GH_DICT || {};
  const RULES = window.GH_REGEX || [];
  const MAP = new Map(Object.entries(DICT));
  const cache = new Map();

  // 这些区域不翻译：代码、README/评论正文、输入框、议题标题、提交说明等用户内容
  const SKIP_SEL = [
    'script', 'style', 'noscript', 'textarea', 'pre', 'code', 'kbd', 'samp', 'svg', 'math',
    '[contenteditable="true"]', '.markdown-body', '.blob-code', '.react-code-text',
    '.react-code-line-contents', '.js-file-line', '.CodeMirror', '.cm-editor', '.monaco-editor',
    '.js-issue-title', '.markdown-title', '.commit-title', '.commit-message',
    '[data-testid="issue-title"]', '[data-testid="list-view-item-title"]',
    '[itemprop="name"]', '.js-navigation-open', '[data-skip-i18n]'
  ].join(',');

  const ATTRS = ['placeholder', 'title', 'aria-label', 'data-tooltip'];

  function translate(raw) {
    const s = raw.trim();
    if (!s || s.length > 120) return null;
    if (cache.has(s)) return cache.get(s);
    let out = MAP.get(s) || null;
    if (!out) {
      for (const [re, rep] of RULES) {
        if (re.test(s)) { out = s.replace(re, rep); break; }
      }
    }
    if (cache.size > 5000) cache.clear();
    cache.set(s, out);
    return out;
  }

  function doText(node) {
    const v = node.nodeValue;
    if (!v) return;
    const t = translate(v);
    if (t && t !== v.trim()) {
      const lead = v.match(/^\s*/)[0];
      const tail = v.match(/\s*$/)[0];
      node.nodeValue = lead + t + tail;
    }
  }

  function doAttrs(el) {
    for (const a of ATTRS) {
      const v = el.getAttribute && el.getAttribute(a);
      if (v) {
        const t = translate(v);
        if (t) el.setAttribute(a, t);
      }
    }
    if (el.tagName === 'INPUT') {
      const type = (el.getAttribute('type') || '').toLowerCase();
      if (type === 'submit' || type === 'button') {
        const t = el.value && translate(el.value);
        if (t) el.value = t;
      }
    }
  }

  function walk(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      const p = root.parentElement;
      if (p && !p.closest(SKIP_SEL)) doText(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE && root.closest(SKIP_SEL)) return;

    if (root.nodeType === Node.ELEMENT_NODE) doAttrs(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (n.nodeType === Node.TEXT_NODE) return NodeFilter.FILTER_ACCEPT;
        if (n.matches(SKIP_SEL)) return NodeFilter.FILTER_REJECT;
        doAttrs(n);
        return NodeFilter.FILTER_SKIP;
      }
    });
    let n;
    while ((n = walker.nextNode())) doText(n);
  }

  // ---- 变更队列：合并一帧内的所有 DOM 变化 ----
  const queue = new Set();
  let scheduled = false;
  function flush() {
    scheduled = false;
    for (const n of queue) if (n.isConnected) walk(n);
    queue.clear();
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    (document.hidden ? setTimeout : requestAnimationFrame)(flush, 0);
  }

  const observer = new MutationObserver(muts => {
    for (const m of muts) {
      if (m.type === 'childList') m.addedNodes.forEach(n => queue.add(n));
      else if (m.type === 'characterData') queue.add(m.target);
      else if (m.type === 'attributes') queue.add(m.target);
    }
    schedule();
  });

  function start() {
    observer.observe(document.documentElement, {
      childList: true, subtree: true, characterData: true,
      attributes: true, attributeFilter: ATTRS
    });
    queue.add(document.documentElement);
    schedule();
    // GitHub 使用 Turbo 导航，页面切换后再扫一遍兜底
    document.addEventListener('turbo:render', () => { queue.add(document.documentElement); schedule(); });
    document.addEventListener('turbo:load', () => { queue.add(document.documentElement); schedule(); });
  }

  chrome.storage.sync.get({ enabled: true }, ({ enabled }) => {
    if (enabled) start();
  });
})();
