(async function () {
  // ── 内联 CSS 注入 ──
  const SWIPE_PREVIEWER_CSS = `
/* 遮罩层 */
.st-swipe-modal-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.7); display: flex; justify-content: center;
  align-items: center; z-index: 10000; backdrop-filter: blur(4px);
  font-family: var(--main-font, sans-serif); box-sizing: border-box;
  overscroll-behavior: contain;
}
.st-swipe-modal-overlay * { box-sizing: border-box; }
.st-swipe-modal-container {
  background: var(--SmartThemeBlurTintColor, #222); color: var(--SmartThemeBodyColor, var(--text-color, white));
  width: 96%; max-width: 1400px; height: 96%; max-height: 96vh; margin: auto;
  border-radius: 12px; display: flex; flex-direction: column; overflow: hidden;
  position: relative;
  backdrop-filter: blur(var(--SmartThemeBlurStrength, 10px));
}
.st-swipe-nav-btn {
  position: absolute; top: 55%; transform: translateY(-50%);
  width: 44px; height: 44px; border-radius: 50%;
  background: var(--SmartThemeBlurTintColor, rgba(0,0,0,0.4));
  border: 1px solid var(--SmartThemeBorderColor, rgba(255,255,255,0.15));
  display: flex; align-items: center; justify-content: center; z-index: 10001;
  font-size: 20px; color: var(--SmartThemeBodyColor, rgba(255,255,255,0.7));
  cursor: pointer; transition: all 0.2s;
  backdrop-filter: blur(var(--SmartThemeBlurStrength, 4px));
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  opacity: 0.5;
}
.st-swipe-nav-btn.left { left: 16px; }
.st-swipe-nav-btn.right { right: 16px; }
.st-swipe-nav-btn:hover:not([disabled]) {
  background: var(--SmartThemeQuoteColor, rgba(0,0,0,0.65));
  color: #fff;
  border-color: var(--SmartThemeQuoteColor, rgba(255,255,255,0.3));
  transform: translateY(-50%) scale(1.05);
  box-shadow: 0 4px 12px var(--SmartThemeQuoteColor, rgba(0,0,0,0.5));
  opacity: 1;
}
.st-swipe-nav-btn[disabled] { opacity: 0.2; pointer-events: none; cursor: not-allowed; }
.st-swipe-modal-header {
  padding: 0; border-bottom: 1px solid var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.1));
  display: flex; flex-direction: column; flex-shrink: 0;
}
.st-swipe-modal-header-top {
  padding: 12px 16px; display: flex; justify-content: space-between;
  align-items: center; font-weight: bold; font-size: 1.1em; gap: 10px;
}
.st-swipe-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.st-swipe-header-ops { display: flex; gap: 4px; align-items: center; flex-shrink: 0; }
.st-swipe-jump-list {
  display: flex; flex-wrap: wrap; gap: 6px; padding: 0 16px 12px 16px;
  transition: all 0.2s ease; overflow-y: auto; max-height: 120px;
  overscroll-behavior: contain; -webkit-overflow-scrolling: touch;
}
.st-swipe-jump-list.hidden { display: none; }
.st-swipe-jump-item {
  width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
  background: var(--black30a, rgba(0, 0, 0, 0.3)); border: 1px solid var(--SmartThemeBorderColor, rgba(255,255,255,0.1)); border-radius: 4px; cursor: pointer;
  font-size: 0.85em; flex-shrink: 0; transition: all 0.2s ease; color: var(--SmartThemeBodyColor, var(--text-color, #eee));
  user-select: none; -webkit-tap-highlight-color: transparent;
}
.st-swipe-jump-item:hover { background: var(--white20a, rgba(255, 255, 255, 0.2)); }
.st-swipe-jump-item.bookmarked { color: var(--SmartThemeEmColor, #ffc107); border-color: var(--SmartThemeEmColor, #ffc107); }
.st-swipe-jump-item.active { color: var(--SmartThemeBodyColor, #eee); border-color: var(--SmartThemeBodyColor, #eee); }
.st-swipe-jump-item.viewing { color: var(--SmartThemeBlurTintColor, #111); background: var(--SmartThemeBodyColor, #eee); border-color: var(--SmartThemeBodyColor, #eee); font-weight: bold; box-shadow: 0 0 6px var(--SmartThemeBodyColor, #eee); }
.st-swipe-modal-content {
  padding: 10px 12px; overflow-y: auto; flex: 1; display: flex; flex-direction: column;
  gap: 8px; scroll-behavior: smooth; overscroll-behavior: contain; -webkit-overflow-scrolling: touch;
}
.st-swipe-card {
  display: flex !important; flex-direction: column;
  height: 100%;
  padding: 0; background: transparent; border: none; position: relative;
  transition: all 0.2s ease; scroll-margin-top: 10px; width: 100%;
}
.st-swipe-card.active { background: transparent; border: none;  }
.st-swipe-card-badge {
  font-size: 0.75em; font-weight: bold; opacity: 0.6; margin-bottom: 0;
  text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 8px;
}
.st-swipe-card.active .st-swipe-card-badge { color: var(--SmartThemeBodyColor, #eee); opacity: 1; }
.st-swipe-card-text { white-space: pre-wrap; word-break: break-word; line-height: 1.6; font-size: 1.05em; color: var(--SmartThemeBodyColor, var(--text-color, #eee)); }
.st-swipe-card-header { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
.st-swipe-card-actions { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 0; align-items: center; justify-content: flex-end; }
.st-swipe-card-actions .menu_button {
  width: 30px; height: 30px; padding: 0 !important; margin: 0 !important;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 4px; font-size: 0.85em; flex-shrink: 0;
}
.st-swipe-action-delete { color: #ff9f9f; border-color: rgba(255, 107, 107, 0.45); }
.st-swipe-action-delete:hover:not(:disabled) { background: rgba(255, 107, 107, 0.12); border-color: rgba(255, 107, 107, 0.75); }
.st-swipe-card-actions .menu_button:disabled { opacity: 0.45; cursor: not-allowed; }
.st-swipe-card-actions .menu_button:disabled:hover { transform: none; }
.st-swipe-edit-textarea {
  width: 100%; min-height: 260px; max-height: 58vh; resize: vertical; border-radius: 8px;
  border: 1px solid var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.2)); background: var(--black30a, rgba(0, 0, 0, 0.25));
  color: var(--SmartThemeBodyColor, var(--text-color, #eee)); font-family: var(--main-font, sans-serif);
  line-height: 1.6; font-size: 1em; padding: 10px 12px;
}
.st-swipe-edit-actions { display: flex; flex-direction: row; justify-content: flex-end; gap: 8px; width: 100%; }
.st-swipe-edit-actions .menu_button { width: auto; display: inline-flex; align-items: center; justify-content: center; padding: 6px 16px; margin: 0; flex: 0 0 auto; }
.st-swipe-edit-save { outline: 1px solid var(--SmartThemeBodyColor, #eee); }
.st-swipe-card-body { width: 100%; display: flex; flex-direction: column; flex: 1; min-height: 60vh; }
.st-swipe-card-frame {
  display: none; width: 100%; height: 100%; min-height: 60vh; flex: 1;
  border: 1px solid var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.12)); border-radius: 8px; background: transparent; overflow: hidden;
}
:root {
  --st-swipe-previewer-md-em-color: #67c5ff; --st-swipe-previewer-md-strong-color: #ffa011;
  --st-swipe-previewer-md-quote-color: #7dd3fc; --st-swipe-previewer-md-quote-bg: rgba(125, 211, 252, 0.10);
  --st-swipe-previewer-md-quote-color-cn: #7dd3fc; --st-swipe-previewer-md-quote-color-en: #a7f3d0;
  --st-swipe-previewer-md-quote-color-jp: #fbcfe8; --st-swipe-previewer-md-quote-color-jp2: #fde68a;
  --st-swipe-previewer-md-del-line: rgba(255, 107, 107, 0.95); --st-swipe-previewer-md-del-bg: rgba(255, 107, 107, 0.08);
  --st-swipe-previewer-md-blockquote-bg: rgba(255, 255, 255, 0.03);
}
.st-swipe-md-root { font-size: 1.05em; color: var(--SmartThemeBodyColor, var(--text-color, #eee)); line-height: 1.6; }
.st-swipe-card-text .st-swipe-md-root { font-size: inherit; line-height: inherit; color: inherit; white-space: normal; }
.st-swipe-md-root p { margin: 6px 0; }
.st-swipe-md-textmode p { margin: 0; }
.st-swipe-md-textmode .st-swipe-md-blank { height: 10px; }
.st-swipe-md-textmode blockquote { margin: 6px 0; padding: 6px 10px; }
.st-swipe-md-root em { opacity: 0.95; color: var(--st-swipe-previewer-md-em-color, #67c5ff); }
.st-swipe-md-root strong { font-weight: 700; color: var(--st-swipe-previewer-md-strong-color, #ffa011); }
.st-swipe-md-root .st-swipe-quote {
  color: var(--st-swipe-previewer-md-quote-color, #7dd3fc);
  background: var(--st-swipe-previewer-md-quote-bg, rgba(125, 211, 252, 0.10));
  padding: 0 3px; border-radius: 4px;
}
.st-swipe-md-root .st-swipe-quote.q-cn-double, .st-swipe-md-root .st-swipe-quote.q-cn-single { color: var(--st-swipe-previewer-md-quote-color-cn, #7dd3fc); }
.st-swipe-md-root .st-swipe-quote.q-en-double, .st-swipe-md-root .st-swipe-quote.q-en-single { color: var(--st-swipe-previewer-md-quote-color-en, #a7f3d0); }
.st-swipe-md-root .st-swipe-quote.q-jp-kagi { color: var(--st-swipe-previewer-md-quote-color-jp, #fbcfe8); }
.st-swipe-md-root .st-swipe-quote.q-jp-doublekagi { color: var(--st-swipe-previewer-md-quote-color-jp2, #fde68a); }
.st-swipe-md-root del {
  background: var(--st-swipe-previewer-md-del-bg, rgba(255, 107, 107, 0.08)); border-radius: 4px; padding: 0 2px;
  text-decoration-color: var(--st-swipe-previewer-md-del-line, rgba(255, 107, 107, 0.95));
}
.st-swipe-md-root pre {
  white-space: pre-wrap; overflow-x: hidden; overflow-y: auto; padding: 8px 10px;
  background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 6px; margin: 6px 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.95em;
}
.st-swipe-md-root code {
  white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere;
  background: rgba(255, 255, 255, 0.06); padding: 0 4px; border-radius: 4px;
}
.st-swipe-md-root pre code { background: transparent; padding: 0; border-radius: 0; }
.st-swipe-md-root blockquote {
  border-left: 3px solid rgba(255, 255, 255, 0.25); margin: 8px 0; padding: 8px 10px;
  border-radius: 8px; background: var(--st-swipe-previewer-md-blockquote-bg, rgba(255, 255, 255, 0.03)); opacity: 0.95;
}
.st-swipe-md-root hr { border: 0; border-top: 1px solid var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.18)); margin: 12px 0; }
.st-swipe-md-blank { height: 10px; }
.st-swipe-md-textmode hr { margin: 8px 0; }
.st-swipe-card.render-on .st-swipe-card-text { display: none; }
.st-swipe-card.render-on .st-swipe-card-frame { display: block; }
.st-swipe-header-ops .menu_button.active, .st-swipe-action-render-one.active {
  outline: 1px solid var(--SmartThemeBodyColor, #eee); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.25);
}
.st-swipe-setting-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
.st-swipe-setting-card {
  display: block; padding: 12px 14px; border-radius: 12px;
  background: var(--black30a, rgba(0,0,0,0.3)); border: 1px solid var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.08)); cursor: pointer;
}
.st-swipe-setting-card:hover { background: var(--white10a, rgba(255, 255, 255, 0.1)); }
.st-swipe-setting-card-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.st-swipe-setting-card-title { font-weight: 700; }
.st-swipe-setting-card-desc { margin-top: 6px; font-size: 0.92em; opacity: 0.85; line-height: 1.5; }
.st-swipe-setting-toggle { width: 18px; height: 18px; }
.st-swipe-loading { opacity: 0.8; }
@media (min-width: 720px) { .st-swipe-setting-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 600px) {
  .st-swipe-nav-btn { width: 34px; height: 34px; font-size: 16px; }
  .st-swipe-nav-btn.left { left: 8px; }
  .st-swipe-nav-btn.right { right: 8px; }
  .st-swipe-modal-container { width: 95%; height: 90%; max-height: 90vh; border-radius: 8px; }
  .st-swipe-title { font-size: 0.9em; }
  .st-swipe-modal-header-top { padding: 8px 12px; }
  .st-swipe-modal-content { padding: 12px; }
  .st-swipe-card {
  display: flex !important; flex-direction: column;
  height: 100%; padding: 12px; }
  .st-swipe-header-ops .menu_button, .st-swipe-card-actions .menu_button { width: 28px; height: 28px; font-size: 0.75em; padding: 4px !important; }
  .st-swipe-jump-list { padding: 0 12px 10px 12px; gap: 4px; }
  .st-swipe-jump-item { width: 26px; height: 26px; font-size: 0.7em; }
}
/* ── 书签高亮样式 ── */
.st-swipe-card.bookmarked {
  border-color: rgba(255, 193, 7, 0.4);
  box-shadow: inset 0 0 8px rgba(255, 193, 7, 0.08);
}
.st-swipe-card.bookmarked .st-swipe-card-badge span::after { content: ' ⭐'; }
.st-swipe-card.bookmarked.active {
  border-color: rgba(255, 193, 7, 0.6);
  box-shadow: inset 0 0 10px rgba(255,255,255,0.1), inset 0 0 8px rgba(255, 193, 7, 0.08);
}
`;
  // 注入 CSS 到主窗口（脚本在 iframe 里，CSS 需要在 parent document 才能生效）
  const _cssId = 'st-swipe-previewer-inline-css';
  const _parentDoc = window.parent?.document || document;
  if (!_parentDoc.getElementById(_cssId)) {
    const styleEl = _parentDoc.createElement('style');
    styleEl.id = _cssId;
    styleEl.textContent = SWIPE_PREVIEWER_CSS;
    _parentDoc.head.appendChild(styleEl);
  }

  const PLUGIN_ID = 'swipe-previewer';

  const BTN_PREVIEW_ID = PLUGIN_ID;

  const SETTINGS_KEY = 'st-swipe-previewer-settings';
  const DEFAULT_SETTINGS = {
    /** 将按钮移动到 ... 菜单（.extraMesButtons） */
    moveButtonsToExtraMenu: false,
    /** 使用酒馆正则渲染（默认开启）；关闭则使用轻量 Markdown */
    useRegex: true,
  };

  /** @type {any} */
  let ST_API;
  let settings = loadSettings();
  /** @type {'mes'|'extra'|null} */
  let registeredMode = null;

  async function init() {
    // 插件依赖于 st-api-wrapper 提供的全局 API (脚本跑在 iframe 里，所以找 parent)
    ST_API = window.parent.ST_API;
    if (!ST_API) {
      console.warn('[Swipe Previewer] ST_API 未就绪，正在等待...');
      setTimeout(init, 1000);
      return;
    }

    await applyButtonRegistration();
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS };
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...(parsed || {}) };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function saveSettings(next) {
    settings = { ...DEFAULT_SETTINGS, ...(next || {}) };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return settings;
  }

  // ── 读取 Swipe 收藏数据（来自轮盘脚本写入的聊天变量）──
  const BOOKMARKS_CHAT_KEY = 'radial_swipe_bookmarks';
  function getSwipeBookmarks(mesId) {
    try {
      if (typeof getVariables === 'function') {
        const chatVars = getVariables({ type: 'chat' });
        const val = chatVars?.[BOOKMARKS_CHAT_KEY]?.[String(mesId)];
        return val ? JSON.parse(JSON.stringify(val)) : [];
      }
    } catch (e) {
      /* ignore */
    }
    return [];
  }

  function setSwipeBookmarks(mesId, bookmarksArr) {
    try {
      // 读取当前全部收藏数据
      let all = {};
      if (typeof getVariables === 'function') {
        const chatVars = getVariables({ type: 'chat' });
        const val = chatVars?.[BOOKMARKS_CHAT_KEY];
        all = val ? JSON.parse(JSON.stringify(val)) : {};
      }
      // 更新当前消息的收藏列表
      if (Array.isArray(bookmarksArr) && bookmarksArr.length > 0) {
        all[String(mesId)] = bookmarksArr;
      } else {
        delete all[String(mesId)];
      }
      // 写回 chat 变量
      if (typeof insertOrAssignVariables === 'function') {
        insertOrAssignVariables(
          { [BOOKMARKS_CHAT_KEY]: all },
          { type: 'chat' }
        );
      }
    } catch (e) {
      console.warn('[Swipe Previewer] setSwipeBookmarks failed', e);
    }
  }

  async function unregisterButtons() {
    // 注：unregister 是幂等操作，调用不存在的 ID 不会抛错（wrapper 文档如此；同时这里也 catch 以防万一）
    try {
      await ST_API.ui.unregisterMessageButton({ id: BTN_PREVIEW_ID });
    } catch {}
    try {
      await ST_API.ui.unregisterExtraMessageButton({ id: BTN_PREVIEW_ID });
    } catch {}
  }

  async function applyButtonRegistration() {
    const mode = settings.moveButtonsToExtraMenu ? 'extra' : 'mes';
    if (registeredMode === mode) return;

    await unregisterButtons();

    // 仅注册“分支预览”按钮；“设置”按钮移到预览窗口右上角操作区
    if (mode === 'mes') {
      // 注册消息按钮（与 Edit 同级，位于 .mes_buttons）
      await ST_API.ui.registerMessageButton({
        id: BTN_PREVIEW_ID,
        icon: 'fa-solid fa-layer-group',
        title: '预览所有生成的回复 (Swipes)',
        index: 0,
        onClick: async (mesId, messageElement) => {
          await onPreviewClick(mesId, messageElement);
        },
      });
    } else {
      // 注册扩展消息按钮（在 ... 展开菜单内，位于 .extraMesButtons）
      await ST_API.ui.registerExtraMessageButton({
        id: BTN_PREVIEW_ID,
        icon: 'fa-solid fa-layer-group',
        title: '预览所有生成的回复 (Swipes)',
        index: 0,
        onClick: async (mesId, messageElement) => {
          await onPreviewClick(mesId, messageElement);
        },
      });
    }

    registeredMode = mode;
  }

  async function onPreviewClick(mesId, messageElement) {
    try {
      if (!ST_API) ST_API = window.parent.ST_API;
      // 获取包含所有分支的消息数据
      const numericMesId = Number(mesId);
      const res = await ST_API.chatHistory.get({
        index: numericMesId,
        includeSwipes: true,
      });
      const message = res.message;

      if (!message.swipes || message.swipes.length <= 1) {
        window.parent.toastr?.info?.('该消息没有多个分支可供预览');
        return;
      }

      await showModal(mesId, message, messageElement);
    } catch (err) {
      console.error('[Swipe Previewer] 预览失败:', err);
      window.parent.toastr?.error?.('获取分支内容失败');
    }
  }

  // 暴露给外部脚本（如轮盘）调用 — 挂到 parent 上让不同 iframe 的脚本都能访问
  window.parent.action_openSwipePreviewer = onPreviewClick;
  window.action_openSwipePreviewer = onPreviewClick; // 本 iframe 内也留一份

  function showSettingsModal(opts = {}) {
    const { onSettingsChanged } = opts || {};
    const parentDoc = window.parent.document;

    const modalId = 'st-swipe-previewer-settings-modal';
    parentDoc.getElementById(modalId)?.remove();

    const overlay = parentDoc.createElement('div');
    overlay.id = modalId;
    overlay.className = 'st-swipe-modal-overlay';

    overlay.innerHTML = `
      <div class="st-swipe-modal-container" style="max-width: 700px; height: auto; max-height: 85vh;">
        <div class="st-swipe-modal-header">
          <div class="st-swipe-modal-header-top">
            <span class="st-swipe-title">分支预览器设置</span>
            <div class="st-swipe-header-ops">
              <div id="${modalId}-close" class="menu_button fa-solid fa-xmark" title="关闭"></div>
            </div>
          </div>
        </div>

        <div class="st-swipe-modal-content" style="gap: 12px;">
          <div class="st-swipe-setting-grid">
            <label class="st-swipe-setting-card" for="${modalId}-move">
              <div class="st-swipe-setting-card-head">
                <div class="st-swipe-setting-card-title">按钮位置</div>
                <input id="${modalId}-move" class="st-swipe-setting-toggle" type="checkbox" ${settings.moveButtonsToExtraMenu ? 'checked' : ''} />
              </div>
              <div class="st-swipe-setting-card-desc">将本插件按钮移动到消息的 <code>...</code> 菜单内。</div>
            </label>

          </div>
        </div>
      </div>
    `;

    parentDoc.body.appendChild(overlay);

    const closeModal = () => overlay.remove();
    overlay.querySelector(`#${modalId}-close`)?.addEventListener('click', closeModal);
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal();
    });

    const moveEl = overlay.querySelector(`#${modalId}-move`);

    moveEl?.addEventListener('change', async () => {
      saveSettings({ ...settings, moveButtonsToExtraMenu: !!moveEl.checked });
      try {
        await applyButtonRegistration();
      } catch (e) {
        console.error('[Swipe Previewer] applyButtonRegistration failed', e);
        window.parent.toastr?.error?.('切换按钮位置失败，请刷新页面后重试');
      }
    });

// 让“预览正则”开关能即时影响已经打开的预览窗口

  }

  /**
   * 显示预览模态框
   */
  async function showModal(mesId, message, messageElement) {
    const parentDoc = window.parent.document;
    const modalId = 'st-swipe-preview-modal';
    parentDoc.getElementById(modalId)?.remove();

    let swipes = Array.isArray(message?.swipes) ? [...message.swipes] : [];
    let currentSwipeId = Number.isInteger(message?.swipeId) ? message.swipeId : 0;

    const modalOverlay = parentDoc.createElement('div');
    modalOverlay.id = modalId;
    modalOverlay.className = 'st-swipe-modal-overlay';

    // 先渲染骨架，内容异步填充（因为可能需要跑 regex）
    modalOverlay.innerHTML = `
      <div class="st-swipe-modal-container">
        <div id="${modalId}-prev" class="st-swipe-nav-btn left" title="上一个"><i class="fa-solid fa-chevron-left"></i></div>
        <div id="${modalId}-next" class="st-swipe-nav-btn right" title="下一个"><i class="fa-solid fa-chevron-right"></i></div>
        <div class="st-swipe-modal-header">
          <div class="st-swipe-modal-header-top">
            <span class="st-swipe-title">消息 #${mesId} (${swipes.length} 分支)</span>
            <div class="st-swipe-header-ops">
              <div id="${modalId}-smart-delete" class="menu_button fa-solid fa-broom" title="智能清理 (清理少于 500 token 的未收藏分支)"></div>
              <div id="${modalId}-toggle" class="menu_button fa-solid fa-list-ol" title="展开/收起列表"></div>
              <div id="${modalId}-close" class="menu_button fa-solid fa-xmark" title="关闭"></div>
            </div>
          </div>
          <div id="${modalId}-jump-list" class="st-swipe-jump-list">
            ${swipes
              .map(
                (_, idx) => `
              <div class="st-swipe-jump-item ${idx === currentSwipeId ? 'active' : ''}" data-idx="${idx}">
                ${idx + 1}
              </div>
            `,
              )
              .join('')}
          </div>
        </div>

        <div class="st-swipe-modal-content" id="${modalId}-content">
          <div class="st-swipe-loading">正在加载分支内容...</div>
        </div>
      </div>
    `;

    parentDoc.body.appendChild(modalOverlay);

    // 状态
    let currentViewIdx = currentSwipeId;


    // iframe 高度通信 token（用于区分不同打开的预览窗口）
    const iframeToken = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const onIframeMessage = event => {
      const data = event?.data;
      if (!data || data.type !== 'swipe-previewer:height') return;
      if (data.token !== iframeToken) return;

      const idx = Number(data.idx);
      const height = Number(data.height);
      if (!Number.isFinite(idx) || !Number.isFinite(height)) return;

      const frame = modalOverlay.querySelector(`#${modalId}-single-frame`);
      if (!frame) return;

      // 更激进的“去掉空白”：对高度做一点缩减，避免滚动条/边距导致的过高
      const h = Math.min(Math.max(height - 4, 160), 2400);
      /* height is now 100% */
    };

    window.addEventListener('message', onIframeMessage);

    const getSwipeText = swipe => {
      const text = Array.isArray(swipe) ? swipe.map(p => ('text' in p ? p.text : '')).join('') : String(swipe ?? '');
      return text;
    };

    let swipeTextsRaw = [];
    let swipeTexts = [];

    const clampSwipeIdx = (idx, total = swipes.length) => {
      if (!Number.isFinite(total) || total <= 0) return 0;
      const n = Number.isFinite(idx) ? Math.trunc(idx) : 0;
      return Math.min(Math.max(n, 0), total - 1);
    };

    const syncSwipesFromChat = () => {
      const ctx = window.parent.SillyTavern?.getContext?.();
      const stMsg = ctx?.chat?.[mesId];

      if (Array.isArray(stMsg?.swipes)) {
        swipes = stMsg.swipes;
        message.swipes = stMsg.swipes;
      } else {
        swipes = Array.isArray(message?.swipes) ? message.swipes : [];
      }

      const rawCurrent = Number.isInteger(stMsg?.swipe_id)
        ? stMsg.swipe_id
        : Number.isInteger(message?.swipeId)
          ? message.swipeId
          : 0;
      currentSwipeId = clampSwipeIdx(rawCurrent, swipes.length);
      message.swipeId = currentSwipeId;

      currentViewIdx = clampSwipeIdx(currentViewIdx, swipes.length);
      swipeTextsRaw = swipes.map(getSwipeText);
      swipeTexts = new Array(swipes.length);
    };

    const contentEl = modalOverlay.querySelector(`#${modalId}-content`);
    const jumpListEl = modalOverlay.querySelector(`#${modalId}-jump-list`);
    const titleEl = modalOverlay.querySelector('.st-swipe-title');

    // 重新计算（清空缓存），供设置切换时调用
    const recomputeSwipeTexts = async () => {
      swipeTexts = new Array(swipes.length);
    };

    // 懒加载：用户切到哪一页才计算哪一页的正则
    const getSwipeTextLazy = (idx) => {
      if (!settings.useRegex) return swipeTextsRaw[idx];
      if (swipeTexts[idx] !== undefined) return swipeTexts[idx];

      const t = swipeTextsRaw[idx];
      if (!t) return t;

      const ctx = window.parent.SillyTavern?.getContext?.();
      const chatLen = ctx?.chat?.length ?? 0;
      const depth = chatLen > 0 ? chatLen - 1 - mesId : 0;

      try {
        const res = formatAsTavernRegexedString(t, 'ai_output', 'display', { depth });
        swipeTexts[idx] = res;
        return res;
      } catch (e) {
        console.warn('[Swipe Previewer] regex failed for swipe', e);
        swipeTexts[idx] = t;
        return t;
      }
    };

    const renderTitle = () => {
      if (!titleEl) return;
      titleEl.textContent = `消息 #${mesId} (${swipes.length} 分支)`;
    };

    const renderJumpList = () => {
      if (!jumpListEl) return;
      const bookmarkedSwipes = getSwipeBookmarks(mesId);
      jumpListEl.innerHTML = swipes
        .map(
          (_, idx) => `
        <div class="st-swipe-jump-item ${idx === currentSwipeId ? 'active' : ''} ${bookmarkedSwipes.includes(idx) ? 'bookmarked' : ''} ${idx === currentViewIdx ? 'viewing' : ''}" data-idx="${idx}">
          ${idx + 1}
        </div>
      `,
        )
        .join('');
    };

    const renderCardsMarkup = () => {
      if (!contentEl) return;
      if (!swipes.length) {
        contentEl.innerHTML = '<div class="st-swipe-loading">当前消息没有可展示的分支</div>';
        return;
      }

      // 仅渲染单个静态卡片骨架
      contentEl.innerHTML = `
        <div class="st-swipe-card" id="${modalId}-single-card">
          <div class="st-swipe-card-header">
            <div class="st-swipe-card-badge">
              <span id="${modalId}-single-badge"></span>
            </div>
            <div class="st-swipe-card-actions">
              <button class="menu_button st-swipe-action-bookmark" id="${modalId}-btn-bookmark" title="收藏 / 取消收藏">
                <i class="fa-regular fa-star"></i>
              </button>
              <button class="menu_button st-swipe-action-render-one" id="${modalId}-btn-render" title="重载/切换渲染器">
                <i class="fa-solid fa-code"></i>
              </button>
              <button class="menu_button st-swipe-action-switch" id="${modalId}-btn-switch" title="切换为此分支">
                <i class="fa-solid fa-location-arrow"></i>
              </button>
              <button class="menu_button st-swipe-action-branch" id="${modalId}-btn-branch" title="创建新存档">
                <i class="fa-solid fa-code-branch"></i>
              </button>
              <button class="menu_button st-swipe-action-edit" id="${modalId}-btn-edit" title="编辑分支">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="menu_button st-swipe-action-move-up" id="${modalId}-btn-up" title="上移">
                <i class="fa-solid fa-arrow-up"></i>
              </button>
              <button class="menu_button st-swipe-action-move-down" id="${modalId}-btn-down" title="下移">
                <i class="fa-solid fa-arrow-down"></i>
              </button>
              <button class="menu_button st-swipe-action-delete" id="${modalId}-btn-delete" title="删除该分支">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>

          <div class="st-swipe-card-body">
            <iframe class="st-swipe-card-frame" id="${modalId}-single-frame" sandbox="allow-scripts" referrerpolicy="no-referrer" loading="lazy" style="display: block;"></iframe>
          </div>
        </div>
      `;
    };

    // 渲染逻辑（iframe 预览）
    const escapeHtml = text =>
      String(text ?? '').replace(
        /[&<>"']/g,
        m =>
          ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
          })[m],
      );

    const sanitizeHtml = html => {
      try {
        if (window.parent.DOMPurify?.sanitize) {
          return window.parent.DOMPurify.sanitize(html, {
            USE_PROFILES: { html: true },
          });
        }
      } catch {}

      // fallback：做一个非常基础的清理（不如 DOMPurify 完整，但能挡掉明显的脚本注入）
      try {
        const tpl = parentDoc.createElement('template');
        tpl.innerHTML = String(html ?? '');

        const blockedTags = ['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta'];
        blockedTags.forEach(tag => tpl.content.querySelectorAll(tag).forEach(n => n.remove()));

        // 移除 on* 事件属性 + javascript: 协议
        tpl.content.querySelectorAll('*').forEach(el => {
          for (const attr of Array.from(el.attributes)) {
            const name = attr.name.toLowerCase();
            const value = String(attr.value || '')
              .trim()
              .toLowerCase();
            if (name.startsWith('on')) {
              el.removeAttribute(attr.name);
            }
            if ((name === 'href' || name === 'src') && value.startsWith('javascript:')) {
              el.removeAttribute(attr.name);
            }
          }
        });

        return tpl.innerHTML;
      } catch {
        return String(html ?? '');
      }
    };

    // iframe 渲染：支持有限 Markdown（``` 代码块、*斜体*、> 引用、# 标题 等），并尽量兼容“Markdown + HTML 混排”。
    // 说明：这里不做完整 Markdown 解析，仅做“显示层面”还原；目标是尽量贴近 SillyTavern 的显示效果。
    const isProbablyHtml = s => /<\/?[a-z][\s\S]*?>/i.test(String(s || ''));

    const wrapPlainText = raw => {
      // 纯文本：保留换行（pre-wrap），并做 HTML escape
      return `<div class="st-swipe-previewer-plain" style="white-space: pre-wrap; word-break: break-word;">${escapeHtml(raw)}</div>`;
    };

    const markdownToHtmlLite = input => {
      const src = String(input ?? '').replace(/\r\n/g, '\n');

      // 保护 <style>/<script> 块：避免其中的 `/* ... */`、`*...*` 等触发 Markdown 特征检测/解析。
      // 同时也避免把 CSS/JS 每行当成段落包裹。
      const htmlBlocks = [];
      const htmlPlaceholder = i => `__ST_SWIPE_HTML_BLOCK_${i}__`;

      let stage0 = src.replace(/<(style|script)\b[\s\S]*?<\/\1>/gi, m => {
        const idx = htmlBlocks.length;
        htmlBlocks.push(String(m));
        return htmlPlaceholder(idx);
      });

      // 1) 提取 ``` fenced code blocks（不解析语言标识）
      const codeBlocks = [];
      const codePlaceholder = i => `__ST_SWIPE_CODE_BLOCK_${i}__`;

      stage0 = stage0.replace(/```([\s\S]*?)```/g, (m, code) => {
        const idx = codeBlocks.length;
        codeBlocks.push(String(code || '').replace(/^\n+|\n+$/g, ''));
        return codePlaceholder(idx);
      });

      // 2) 行级 Markdown：标题/引用/段落/空行/分隔线 + 允许行级 HTML 直通
      const lines = stage0.split('\n');
      const out = [];
      let inBlockquote = false;

      const flushBlockquote = () => {
        if (inBlockquote) {
          out.push('</blockquote>');
          inBlockquote = false;
        }
      };

      const inlineMdToHtml = text => {
        const raw = String(text ?? '');

        // 保留 HTML tag（例如 <a>、<img> 等），只对纯文本部分做 escape + md-lite。
        const parts = raw.split(/(<[^>]+>)/g);
        return parts
          .map(part => {
            if (part.startsWith('<') && part.endsWith('>')) return part;

            let t = escapeHtml(part);

            // inline code: `code`
            t = t.replace(/`([^`\n]+?)`/g, '<code>$1</code>');
            // bold: **text**
            t = t.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
            // italic: *text* （尽量避免误伤）
            t = t.replace(/\*(?!\s)([^*\n]+?)\*(?!\w)/g, '<em>$1</em>');
            // del: ~~text~~
            t = t.replace(/~~([^~\n]+?)~~/g, '<del>$1</del>');

            return t;
          })
          .join('');
      };

      const isHtmlBlockLine = line => {
        const t = String(line ?? '').trim();
        if (!t) return false;
        if (!t.startsWith('<')) return false;
        // 简单判定：以标签开头的行（包括关闭标签、注释、<!doctype ...>）
        return /^<\/?[a-z!]|^<!--/i.test(t);
      };

      for (let line of lines) {
        // html block placeholder
        const hph = line.match(/__ST_SWIPE_HTML_BLOCK_(\d+)__/);
        if (hph) {
          flushBlockquote();
          // placeholder 可能与其它字符同一行：先把整行按占位符拆开，拼接回去
          const withBlocks = String(line).replace(
            /__ST_SWIPE_HTML_BLOCK_(\d+)__/g,
            (m, i) => htmlBlocks[Number(i)] ?? '',
          );
          out.push(withBlocks);
          continue;
        }

        // code placeholder
        const cph = line.match(/__ST_SWIPE_CODE_BLOCK_(\d+)__/);
        if (cph) {
          flushBlockquote();
          const idx = Number(cph[1]);
          const code = codeBlocks[idx] ?? '';
          out.push(`<pre><code>${escapeHtml(code)}</code></pre>`);
          continue;
        }

        // 行级 HTML：原样直通（避免被 <p> 包裹导致布局错乱）
        if (isHtmlBlockLine(line)) {
          flushBlockquote();
          out.push(String(line));
          continue;
        }

        // heading
        const h = line.match(/^(#{1,6})\s+(.*)$/);
        if (h) {
          flushBlockquote();
          const level = h[1].length;
          out.push(`<h${level}>${inlineMdToHtml(h[2] ?? '')}</h${level}>`);
          continue;
        }

        // blockquote
        const bq = line.match(/^>\s?(.*)$/);
        if (bq) {
          if (!inBlockquote) {
            flushBlockquote();
            out.push('<blockquote>');
            inBlockquote = true;
          }
          out.push(`<div>${inlineMdToHtml(bq[1] ?? '')}</div>`);
          continue;
        }

        // hr
        const t = line.trim();
        if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(t)) {
          flushBlockquote();
          out.push('<hr/>');
          continue;
        }

        // blank line -> keep spacing
        if (t === '') {
          flushBlockquote();
          out.push('<div class="st-swipe-md-blank"></div>');
          continue;
        }

        out.push(`<p>${inlineMdToHtml(line)}</p>`);
      }

      flushBlockquote();

      // 3) 兜底替换：把 HTML 块占位符还原
      let html = out.join('\n');
      html = html.replace(/__ST_SWIPE_HTML_BLOCK_(\d+)__/g, (m, i) => htmlBlocks[Number(i)] ?? '');

      return `<div class="st-swipe-md-root">${html}</div>`;
    };

    // 文本视图：用于“未开启 iframe 渲染预览”时的轻量 Markdown（安全：不直通 HTML 标签）
    const escapeHtmlTextOnly = text =>
      String(text ?? '').replace(
        /[&<>]/g,
        m =>
          ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
          })[m],
      );

    const highlightQuotedSegments = html => {
      // 目标：给被引号包裹的句子做高亮。
      // 注意：
      // - 只处理“标签外”的文本片段，避免污染标签/属性。
      // - 同时保护 <code>...</code>（不在代码里做引号高亮）。

      const input = String(html ?? '');

      // 1) 保护 code 段
      const codeBlocks = [];
      const codePlaceholder = i => `__ST_SWIPE_Q_CODE_${i}__`;

      const withoutCode = input.replace(/<code\b[^>]*>[\s\S]*?<\/code>/gi, m => {
        const idx = codeBlocks.length;
        codeBlocks.push(String(m));
        return codePlaceholder(idx);
      });

      // 2) 分段处理：只对“标签外”的文本片段做引号高亮。
      // 插入 <span class="...">，如果后续替换再对整串做正则，
      // 可能误把 class="..." 等属性值当成英文引号内容再次匹配，导致 HTML 被破坏。
      const wrap = (cls, full) => `<span class="st-swipe-quote ${cls}">${full}</span>`;

      const replaceOutsideTags = (inputHtml, re, replacer) => {
        const parts = String(inputHtml ?? '').split(/(<[^>]+>)/g);
        return parts.map(p => (p.startsWith('<') && p.endsWith('>') ? p : p.replace(re, replacer))).join('');
      };

      let out = withoutCode;

      // 中文引号
      out = replaceOutsideTags(out, /“([^”\n]{1,300})”/g, m => wrap('q-cn-double', m));
      out = replaceOutsideTags(out, /‘([^’\n]{1,300})’/g, m => wrap('q-cn-single', m));
      // 日文引号
      out = replaceOutsideTags(out, /「([^」\n]{1,300})」/g, m => wrap('q-jp-kagi', m));
      out = replaceOutsideTags(out, /『([^』\n]{1,300})』/g, m => wrap('q-jp-doublekagi', m));
      // 英文引号（注意：会误伤英文缩写中的 '，这里做一个相对保守的长度限制）
      out = replaceOutsideTags(out, /"([^"\n]{1,300})"/g, m => wrap('q-en-double', m));
      out = replaceOutsideTags(out, /'([^'\n]{1,300})'/g, m => wrap('q-en-single', m));

      // 3) 还原 code 段
      out = out.replace(/__ST_SWIPE_Q_CODE_(\d+)__/g, (m, i) => codeBlocks[Number(i)] ?? m);
      return out;
    };

    const markdownToHtmlTextLite = input => {
      const src = String(input ?? '').replace(/\r\n/g, '\n');

      // 1) 提取 ``` fenced code blocks（不解析语言标识）
      const codeBlocks = [];
      const placeholder = i => `__ST_SWIPE_TEXT_CODE_BLOCK_${i}__`;

      const withoutCode = src.replace(/```([\s\S]*?)```/g, (m, code) => {
        const idx = codeBlocks.length;
        codeBlocks.push(String(code || '').replace(/^\n+|\n+$/g, ''));
        return placeholder(idx);
      });

      // 2) 逐行处理标题/引用/段落，并保留空行（不直通 HTML）
      const lines = withoutCode.split('\n');
      const out = [];
      let inBlockquote = false;

      const flushBlockquote = () => {
        if (inBlockquote) {
          out.push('</blockquote>');
          inBlockquote = false;
        }
      };

      const inlineMd = line => {
        // 安全：先 escape <>&，保留引号以便高亮
        let t = escapeHtmlTextOnly(line);

        // inline code: `code`
        t = t.replace(/`([^`\n]+?)`/g, '<code>$1</code>');
        // bold: **text**
        t = t.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
        // italic: *text*
        t = t.replace(/\*(?!\s)([^*\n]+?)\*(?!\w)/g, '<em>$1</em>');
        // del: ~~text~~
        t = t.replace(/~~([^~\n]+?)~~/g, '<del>$1</del>');

        // 引号高亮
        t = highlightQuotedSegments(t);
        return t;
      };

      for (let line of lines) {
        // code placeholder
        const ph = line.match(/__ST_SWIPE_TEXT_CODE_BLOCK_(\d+)__/);
        if (ph) {
          flushBlockquote();
          const idx = Number(ph[1]);
          const code = codeBlocks[idx] ?? '';
          out.push(`<pre><code>${escapeHtmlTextOnly(code)}</code></pre>`);
          continue;
        }

        // heading
        const h = line.match(/^(#{1,6})\s+(.*)$/);
        if (h) {
          flushBlockquote();
          const level = h[1].length;
          out.push(`<h${level}>${inlineMd(h[2] ?? '')}</h${level}>`);
          continue;
        }

        // blockquote
        const bq = line.match(/^>\s?(.*)$/);
        if (bq) {
          if (!inBlockquote) {
            flushBlockquote();
            out.push('<blockquote>');
            inBlockquote = true;
          }
          out.push(`<div>${inlineMd(bq[1] ?? '')}</div>`);
          continue;
        }

        // hr
        const t = line.trim();
        if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(t)) {
          flushBlockquote();
          out.push('<hr/>');
          continue;
        }

        // blank line -> keep spacing
        if (t === '') {
          flushBlockquote();
          out.push('<div class="st-swipe-md-blank"></div>');
          continue;
        }

        out.push(`<p>${inlineMd(line)}</p>`);
      }

      flushBlockquote();

      // 注意：这里不要 join("\n")，否则在父容器 white-space: pre-wrap 的情况下会把这些换行当成可见空行。
      return `<div class="st-swipe-md-root st-swipe-md-textmode">${out.join('')}</div>`;
    };

    const toHtmlForPreview = text => {
      const raw = String(text ?? '');

      // 命中 Markdown 特征：走 md-lite
      // 注意：先剔除 <style>/<script>，避免 CSS/JS 中的 `*...*` 误判为 Markdown。
      const mdProbe = raw.replace(/<(style|script)\b[\s\S]*?<\/\1>/gi, '');

      const emphasisProbe = /\*(?!\s)([^*\n]+?)\*(?!\w)/.test(mdProbe) || /\*\*([^*\n]+?)\*\*/.test(mdProbe);
      const looksLikeMd =
        /```/.test(mdProbe) ||
        /^(\s{0,3}#{1,6}\s+|\s{0,3}>\s+)/m.test(mdProbe) ||
        emphasisProbe ||
        /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/m.test(mdProbe);
      if (looksLikeMd) return markdownToHtmlLite(raw);

      // 纯文本
      if (!isProbablyHtml(raw)) return wrapPlainText(raw);

      // HTML
      return raw;
    };

    const toHtmlForTextView = text => {
      const raw = String(text ?? '');
      const probe = raw;

      const emphasisProbe = /\*(?!\s)([^*\n]+?)\*(?!\w)/.test(probe) || /\*\*([^*\n]+?)\*\*/.test(probe);
      const quoteProbe = /[“”‘’"']|[「」『』]/.test(probe);
      const looksLikeLiteMdOrQuote =
        /```/.test(probe) ||
        /^(\s{0,3}#{1,6}\s+|\s{0,3}>\s+)/m.test(probe) ||
        emphasisProbe ||
        /~~[^~\n]+?~~/.test(probe) ||
        /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/m.test(probe) ||
        quoteProbe;

      if (!looksLikeLiteMdOrQuote) {
        // 纯文本（保持原样）
        return wrapPlainText(raw);
      }

      // 轻量 Markdown（安全：不渲染 HTML 标签）
      return markdownToHtmlTextLite(raw);
    };

    const getRootCssVar = (varName, fallback = '') => {
      // 必须从 parent document（酒馆主页面）读取，因为本脚本运行在插件 iframe 里，
      // 而 --SmartTheme* 等 CSS 变量只定义在酒馆主页面的 :root 上。
      const parentDoc = window.parent?.document || document;
      let val = '';
      try {
        val = getComputedStyle(parentDoc.body).getPropertyValue(varName).trim();
        if (!val) val = getComputedStyle(parentDoc.documentElement).getPropertyValue(varName).trim();
      } catch { /* cross-origin fallback */ }
      return val || fallback;
    };

    /**
     * 从酒馆主页面的真实 AI 消息元素中读取已计算的样式，
     * 这样 iframe 内容就能完全匹配用户当前主题的 .mes_text 外观。
     */
    const getAiMessageStyles = () => {
      const parentDoc = window.parent?.document || document;
      const result = {
        // body 级
        bgColor: '', bgImage: 'none',
        color: '', fontFamily: '', lineHeight: '1.6',
        // pre 级
        preBg: '', preColor: '', preBorder: '', preBorderRadius: '6px',
        preFont: '', preFontSize: '', preBoxShadow: 'none',
        preCodeBg: '', preCodeColor: '', preCodeFont: '',
        preCodeBorderLeft: '',
      };

      try {
        // ① 读 .mes_text 的样式（AI 消息优先）
        const mesText =
          parentDoc.querySelector('.mes[data-uid="char"] .mes_text') ||
          parentDoc.querySelector('.mes:not([data-uid="user"]) .mes_text') ||
          parentDoc.querySelector('.mes .mes_text');

        if (mesText) {
          const cs = getComputedStyle(mesText);
          result.bgColor = cs.backgroundColor || '';
          const bgImg = cs.backgroundImage;
          if (bgImg && bgImg !== 'none') result.bgImage = bgImg;
          result.color = cs.color || '';
          result.fontFamily = cs.fontFamily || '';
          result.lineHeight = cs.lineHeight || '1.6';
        }

        // 如果 .mes_text 的 bg 是透明的，尝试退而读取 .mes 容器的 bg
        const isTransparent = v => !v || v === 'transparent' || v === 'rgba(0, 0, 0, 0)';
        if (isTransparent(result.bgColor)) {
          const mes =
            parentDoc.querySelector('.mes[data-uid="char"]') ||
            parentDoc.querySelector('.mes:not([data-uid="user"])');
          if (mes) {
            const cs = getComputedStyle(mes);
            if (!isTransparent(cs.backgroundColor)) result.bgColor = cs.backgroundColor;
          }
        }

        // ② 读 pre 的样式
        const preEl = parentDoc.querySelector('.mes_text pre');
        if (preEl) {
          const ps = getComputedStyle(preEl);
          result.preBg = ps.backgroundColor || '';
          result.preColor = ps.color || '';
          result.preBorder = ps.border || '';
          result.preBorderRadius = ps.borderRadius || '6px';
          result.preFont = ps.fontFamily || '';
          result.preFontSize = ps.fontSize || '';
          result.preBoxShadow = ps.boxShadow || 'none';
        }

        // ③ 读 pre code 的样式
        const preCodeEl = parentDoc.querySelector('.mes_text pre code');
        if (preCodeEl) {
          const pc = getComputedStyle(preCodeEl);
          result.preCodeBg = pc.backgroundColor || '';
          result.preCodeColor = pc.color || '';
          result.preCodeFont = pc.fontFamily || '';
          result.preCodeBorderLeft = pc.borderLeft || '';
        }
      } catch { /* cross-origin or missing elements */ }

      return result;
    };

    const buildSrcdoc = (htmlBody, token, idx) => {
      // 注意：此处刻意不做 DOMPurify 清理，以便允许运行用户提供的 <script>
      // 安全依赖于 iframe sandbox（allow-scripts 且不允许 same-origin）。
      const body = String(htmlBody ?? '');

      // 从宿主页面读取 md-lite 配色（iframe 内的 srcdoc 有自己的一套 <style>，不会继承）。
      const mdEmColor = getRootCssVar('--st-swipe-previewer-md-em-color', '#67c5ff');
      const mdStrongColor = getRootCssVar('--st-swipe-previewer-md-strong-color', '#ffa011');
      const mdQuoteColor = getRootCssVar('--st-swipe-previewer-md-quote-color', '#7dd3fc');
      const mdQuoteBg = getRootCssVar('--st-swipe-previewer-md-quote-bg', 'rgba(125, 211, 252, 0.10)');

      // 读取酒馆 CSS 变量作为兜底
      const themeColor = getRootCssVar('--SmartThemeBodyColor', getRootCssVar('--text-color-high', '#eee'));
      const themeBorder = getRootCssVar('--SmartThemeBorderColor', 'rgba(255,255,255,0.15)');
      const themeFont = getRootCssVar('--main-font', 'sans-serif');

      // ★ 从实际 AI 消息元素读取已计算的主题样式
      const ai = getAiMessageStyles();
      const bodyColor = ai.color || themeColor;
      const bodyFont = ai.fontFamily || themeFont;
      const bodyLineHeight = ai.lineHeight || '1.6';
      // 背景：如果主题设置了 bgImage（渐变等），优先用；否则用 bgColor
      const bodyBgColor = ai.bgColor || 'transparent';
      const bodyBgImage = (ai.bgImage && ai.bgImage !== 'none') ? `background-image: ${ai.bgImage};` : '';

      // pre 样式：有主题就用主题的，没有就用默认
      const preBg = ai.preBg || 'rgba(128,128,128,0.06)';
      const preColor = ai.preColor ? `color: ${ai.preColor};` : '';
      const preBorder = ai.preBorder || `1px solid ${themeBorder}`;
      const preBorderRadius = ai.preBorderRadius || '6px';
      const preFont = ai.preFont || 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
      const preFontSize = ai.preFontSize || '0.95em';
      const preBoxShadow = (ai.preBoxShadow && ai.preBoxShadow !== 'none') ? `box-shadow: ${ai.preBoxShadow};` : '';
      // pre code
      const preCodeBg = ai.preCodeBg ? `background: ${ai.preCodeBg};` : 'background: transparent;';
      const preCodeColor = ai.preCodeColor ? `color: ${ai.preCodeColor};` : 'color: inherit;';
      const preCodeFont = ai.preCodeFont ? `font-family: ${ai.preCodeFont};` : '';
      const preCodeBorderLeft = ai.preCodeBorderLeft ? `border-left: ${ai.preCodeBorderLeft};` : '';

      // 自适应高度：在 iframe 内用 ResizeObserver/MO 发送高度给父页面
      const heightScript = `(() => {
        const send = () => {
          const body = document.body;
          const doc = document.documentElement;
          const h = Math.max(
            body ? body.scrollHeight : 0,
            doc ? doc.scrollHeight : 0,
            body ? body.offsetHeight : 0,
            doc ? doc.offsetHeight : 0
          );
          parent.postMessage({
            type: 'swipe-previewer:height',
            token: ${JSON.stringify(token)},
            idx: ${idx},
            height: h
          }, '*');
        };

        const ro = (window.ResizeObserver) ? new ResizeObserver(() => send()) : null;
        if (ro) ro.observe(document.documentElement);
        if (ro && document.body) ro.observe(document.body);

        const mo = new MutationObserver(() => send());
        mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true, characterData: true });

        window.addEventListener('load', send);
        setTimeout(send, 0);
        setTimeout(send, 50);
        setTimeout(send, 200);
        setInterval(send, 1000);
      })();`;

      return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  body {
    margin: 0; padding: 12px;
    background-color: ${bodyBgColor}; ${bodyBgImage}
    font-family: ${bodyFont};
    color: ${bodyColor};
    line-height: ${bodyLineHeight};
  }
  img { max-width: 100%; height: auto; }

  /* 代码块：跟随主题样式 */
  pre {
    overflow-x: hidden; overflow-y: auto;
    padding: 8px 10px;
    background: ${preBg};
    border: ${preBorder};
    border-radius: ${preBorderRadius};
    margin: 6px 0;
    white-space: pre-wrap;
    font-family: ${preFont};
    font-size: ${preFontSize};
    ${preColor}
    ${preBoxShadow}
  }

  code {
    background: rgba(128,128,128,0.1);
    padding: 0 4px; border-radius: 4px;
    white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere;
  }

  pre code { ${preCodeBg} ${preCodeColor} ${preCodeFont} ${preCodeBorderLeft} padding: 0; border-radius: 0; }

  a { color: #6ea8fe; }
  table { border-collapse: collapse; }
  th, td { border: 1px solid ${themeBorder}; padding: 6px 8px; }
  blockquote { border-left: 3px solid rgba(128,128,128,0.4); margin: 8px 0; padding-left: 10px; }

  /* md-lite 着色 */
  .st-swipe-md-root em { color: ${mdEmColor}; }
  .st-swipe-md-root strong { color: ${mdStrongColor}; }
  .st-swipe-md-root .st-swipe-quote { color: ${mdQuoteColor}; background: ${mdQuoteBg}; padding: 0 3px; border-radius: 4px; }
</style>
<script>${heightScript}</script>
</head>
<body>${body}</body>
</html>`;
    };

    const renderCurrentCard = () => {
      const idx = currentViewIdx;
      const text = getSwipeTextLazy(idx) ?? '';

      const badge = modalOverlay.querySelector(`#${modalId}-single-badge`);
      const btnBookmark = modalOverlay.querySelector(`#${modalId}-btn-bookmark`);
      const iconBookmark = btnBookmark?.querySelector('i');
      const btnRender = modalOverlay.querySelector(`#${modalId}-btn-render`);
      const btnUp = modalOverlay.querySelector(`#${modalId}-btn-up`);
      const btnDown = modalOverlay.querySelector(`#${modalId}-btn-down`);
      const card = modalOverlay.querySelector(`#${modalId}-single-card`);
      const frame = modalOverlay.querySelector(`#${modalId}-single-frame`);

      if (!card || !frame || !badge) return;

      // 更新卡片状态
      const bookmarkedSwipes = getSwipeBookmarks(mesId);
      const isBookmarked = bookmarkedSwipes.includes(idx);
      const isActive = idx === currentSwipeId;

      card.classList.toggle('active', isActive);
      card.classList.toggle('bookmarked', isBookmarked);

      badge.textContent = `分支 #${idx + 1}/${swipes.length} ${isActive ? '(当前选中)' : ''}`;

      // 更新收藏按钮状态
      if (btnBookmark && iconBookmark) {
        btnBookmark.classList.toggle('bookmarked', isBookmarked);
        iconBookmark.className = isBookmarked ? 'fa-solid fa-star' : 'fa-regular fa-star';
        iconBookmark.style.color = isBookmarked ? '#ffc107' : '';
      }

      // 【关键修复】：更新正则按钮的状态、描述，并同步切换图标让你一眼看出状态
      if (btnRender) {
        btnRender.classList.toggle('active', !!settings.useRegex);
        btnRender.title = settings.useRegex
          ? '应用正则渲染中 (点击切换为纯净 Markdown 显示)'
          : '纯净 Markdown 显示中 (点击应用酒馆正则显示)';
        const iconRender = btnRender.querySelector('i');
        if (iconRender) {
          iconRender.className = settings.useRegex ? 'fa fa-magic' : 'fa-solid fa-file-lines';
        }
      }

      if (btnUp) btnUp.toggleAttribute('disabled', idx === 0);
      if (btnDown) btnDown.toggleAttribute('disabled', idx === swipes.length - 1);

      // 【核心修复】：由于当前版本统一使用 iframe 预览分支内容，
      // 对于 iframe，无论是否开启正则，必须统一使用 toHtmlForPreview。
      // 它内置了对 Markdown 和纯文本的安全转换，并在检测到前端 HTML 界面时能原样抛出，不会破坏特殊标签。
      const finalHtml = toHtmlForPreview(text);

      frame.style.height = '100%';
      frame.setAttribute('srcdoc', buildSrcdoc(finalHtml, iframeToken, idx));
    };

    const scrollToIdx = (idx) => {
      if (!swipes.length) {
        currentViewIdx = 0;
        return;
      }
      currentViewIdx = clampSwipeIdx(idx, swipes.length);
      renderJumpList();
      renderCurrentCard();
    };

    async function refreshModalList(opts = {}) {
      const { focusIdx = currentViewIdx } = opts;
      syncSwipesFromChat();
      await recomputeSwipeTexts();
      renderTitle();
      currentViewIdx = clampSwipeIdx(focusIdx, swipes.length);
      renderJumpList();
      renderCardsMarkup();
      bindDynamicEvents();
      renderCurrentCard();
    }

    // 对外操作：将分支应用到聊天中
    const applySwipeToChat = async targetSwipeIdx => {
      const ctx = window.parent.SillyTavern?.getContext?.();
      const chat = ctx?.chat;
      const stMsg = chat?.[mesId];

      if (!stMsg) throw new Error(`找不到 chat[${mesId}]`);
      if (!Array.isArray(stMsg.swipes) || targetSwipeIdx < 0 || targetSwipeIdx >= stMsg.swipes.length) {
        throw new Error('目标分支不存在');
      }

      // 应用到酒馆内部数据
      stMsg.swipe_id = targetSwipeIdx;
      stMsg.mes = stMsg.swipes[targetSwipeIdx];

      // 尝试同步该分支的媒体信息（如果酒馆提供 swipe_info）
      try {
        const swipeMedia = stMsg.swipe_info?.[targetSwipeIdx]?.extra?.media;
        if (Array.isArray(swipeMedia)) {
          stMsg.extra = { ...(stMsg.extra || {}), media: swipeMedia, media_index: 0, inline_image: true };
        }
      } catch {}

      // 同步 UI
      if (typeof ctx?.updateMessageBlock === 'function') {
        ctx.updateMessageBlock(mesId, stMsg);
      } else {
        // 兜底：触发 chat changed
        ctx?.eventSource?.emit?.(ctx?.event_types?.CHAT_CHANGED);
      }

      // 同步 swipes-counter（例如：1/14）
      try {
        const mesEl = parentDoc.querySelector(`#chat .mes[mesid="${mesId}"]`);
        const counter = mesEl?.querySelector?.('.swipes-counter');
        const total = Array.isArray(stMsg.swipes) ? stMsg.swipes.length : null;
        if (counter && total) {
          counter.textContent = `${targetSwipeIdx + 1}/${total}`;
        }
      } catch {}

      // 持久化
      if (typeof ctx?.saveChat === 'function') {
        await ctx.saveChat();
      }

      message.swipes = stMsg.swipes;
      message.swipeId = targetSwipeIdx;
    };

    const jumpToSwipe = async targetSwipeIdx => {
      await applySwipeToChat(targetSwipeIdx);
      closeModal();
      setTimeout(() => {
        try {
          ST_API.ui.scrollChat({ target: 'bottom', behavior: 'smooth' });
        } catch {}
      }, 80);
    };

    const createBranchFromSwipe = async targetSwipeIdx => {
      await applySwipeToChat(targetSwipeIdx);

      const mesEl = messageElement || parentDoc.querySelector(`#chat .mes[mesid="${mesId}"]`);
      const btn = mesEl?.querySelector?.('.mes_create_branch');

      if (!btn) {
        window.parent.toastr?.error?.('找不到“创建分支”按钮，可能不是 AI 楼层或酒馆版本不支持');
        return;
      }

      // 使用酒馆原生功能创建分支
      btn.click();
      closeModal();
    };

    const swapArrayItem = (arr, a, b) => {
      const t = arr[a];
      arr[a] = arr[b];
      arr[b] = t;
    };

    const moveSwipeOrder = async (fromIdx, toIdx) => {
      const ctx = window.parent.SillyTavern?.getContext?.();
      const chat = ctx?.chat;
      const stMsg = chat?.[mesId];

      if (!stMsg) throw new Error(`找不到 chat[${mesId}]`);
      if (!Array.isArray(stMsg.swipes)) throw new Error('当前消息没有分支数据');
      if (fromIdx === toIdx) return;

      const maxIdx = stMsg.swipes.length - 1;
      if (fromIdx < 0 || toIdx < 0 || fromIdx > maxIdx || toIdx > maxIdx) {
        throw new Error('目标分支下标越界');
      }

      swapArrayItem(stMsg.swipes, fromIdx, toIdx);
      if (Array.isArray(stMsg.swipe_info) && stMsg.swipe_info.length > Math.max(fromIdx, toIdx)) {
        swapArrayItem(stMsg.swipe_info, fromIdx, toIdx);
      }

      const current = Number.isInteger(stMsg.swipe_id) ? stMsg.swipe_id : 0;
      let nextCurrent = current;
      if (current === fromIdx) nextCurrent = toIdx;
      else if (current === toIdx) nextCurrent = fromIdx;

      nextCurrent = Math.min(Math.max(nextCurrent, 0), stMsg.swipes.length - 1);
      await applySwipeToChat(nextCurrent);
    };

    const deleteSwipe = async targetSwipeIdx => {
      const shouldDelete =
        typeof window.parent.confirm === 'function'
          ? window.parent.confirm(`确定要删除分支 #${targetSwipeIdx + 1} 吗？\n此操作会直接修改当前聊天记录。`)
          : true;
      if (!shouldDelete) return false;

      const ctx = window.parent.SillyTavern?.getContext?.();
      const chat = ctx?.chat;
      const stMsg = chat?.[mesId];

      if (!stMsg) throw new Error(`找不到 chat[${mesId}]`);
      if (!Array.isArray(stMsg.swipes) || stMsg.swipes.length <= 1) {
        throw new Error('至少需要保留一个分支');
      }
      if (targetSwipeIdx < 0 || targetSwipeIdx >= stMsg.swipes.length) {
        throw new Error('目标分支不存在');
      }

      stMsg.swipes.splice(targetSwipeIdx, 1);
      if (Array.isArray(stMsg.swipe_info) && stMsg.swipe_info.length > targetSwipeIdx) {
        stMsg.swipe_info.splice(targetSwipeIdx, 1);
      }

      const current = Number.isInteger(stMsg.swipe_id) ? stMsg.swipe_id : 0;
      const nextCurrent = Math.min(
        Math.max(targetSwipeIdx < current ? current - 1 : current, 0),
        stMsg.swipes.length - 1,
      );
      await applySwipeToChat(nextCurrent);
      return true;
    };

    const showEditSwipeModal = ({ idx, initialText }) => {
      return new Promise(resolve => {
        const editModalId = `${modalId}-edit-${Date.now()}-${Math.random().toString(16).slice(2)}`;

        const editOverlay = parentDoc.createElement('div');
        editOverlay.id = editModalId;
        editOverlay.className = 'st-swipe-modal-overlay';
        editOverlay.innerHTML = `
          <div class="st-swipe-modal-container" style="max-width: 820px; width: min(95vw, 820px); height: auto; max-height: 90vh;">
            <div class="st-swipe-modal-header">
              <div class="st-swipe-modal-header-top">
                <span class="st-swipe-title">编辑分支 #${idx + 1}</span>
                <div class="st-swipe-header-ops">
                  <div id="${editModalId}-close" class="menu_button fa-solid fa-xmark" title="关闭"></div>
                </div>
              </div>
            </div>
            <div class="st-swipe-modal-content" style="padding-top: 14px;">
              <textarea id="${editModalId}-textarea" class="st-swipe-edit-textarea" spellcheck="false"></textarea>
              <div class="st-swipe-edit-actions">
                <button id="${editModalId}-cancel" class="menu_button">取消</button>
                <button id="${editModalId}-save" class="menu_button st-swipe-edit-save">保存</button>
              </div>
              <div class="st-swipe-setting-card-desc">提示：支持多行编辑，可使用 Ctrl/⌘ + Enter 快速保存。</div>
            </div>
          </div>
        `;

        parentDoc.body.appendChild(editOverlay);

        const textarea = editOverlay.querySelector(`#${editModalId}-textarea`);
        if (textarea) {
          textarea.value = String(initialText ?? '');
          textarea.focus();
          const len = textarea.value.length;
          textarea.setSelectionRange(len, len);
        }

        let closed = false;
        const done = value => {
          if (closed) return;
          closed = true;
          editOverlay.remove();
          window.removeEventListener('keydown', onKeydown, true);
          resolve(value);
        };

        const onKeydown = e => {
          if (!parentDoc.getElementById(editModalId)) return;
          if (e.key === 'Escape') {
            e.preventDefault();
            done(null);
            return;
          }

          const isSaveHotkey = e.key === 'Enter' && (e.ctrlKey || e.metaKey);
          if (isSaveHotkey) {
            e.preventDefault();
            done(textarea?.value ?? '');
          }
        };
        window.addEventListener('keydown', onKeydown, true);

        // 为了可靠抓取 iframe 外的事件
        window.parent.addEventListener('keydown', onKeydown, true);

        const _done = val => {
          window.parent.removeEventListener('keydown', onKeydown, true);
          done(val);
        };

        editOverlay.querySelector(`#${editModalId}-close`)?.addEventListener('click', () => _done(null));
        editOverlay.querySelector(`#${editModalId}-cancel`)?.addEventListener('click', () => _done(null));
        editOverlay
          .querySelector(`#${editModalId}-save`)
          ?.addEventListener('click', () => _done(textarea?.value ?? ''));
        editOverlay.addEventListener('click', e => {
          if (e.target === editOverlay) _done(null);
        });
      });
    };

    const editSwipe = async targetSwipeIdx => {
      const ctx = window.parent.SillyTavern?.getContext?.();
      const chat = ctx?.chat;
      const stMsg = chat?.[mesId];

      if (!stMsg) throw new Error(`找不到 chat[${mesId}]`);
      if (!Array.isArray(stMsg.swipes) || targetSwipeIdx < 0 || targetSwipeIdx >= stMsg.swipes.length) {
        throw new Error('目标分支不存在');
      }

      const oldText = String(stMsg.swipes[targetSwipeIdx] ?? '');
      const editedText = await showEditSwipeModal({ idx: targetSwipeIdx, initialText: oldText });
      if (editedText === null) return false;
      if (editedText === oldText) return false;

      stMsg.swipes[targetSwipeIdx] = editedText;

      const current = Number.isInteger(stMsg.swipe_id) ? stMsg.swipe_id : 0;
      if (current === targetSwipeIdx) {
        await applySwipeToChat(targetSwipeIdx);
      } else {
        if (typeof ctx?.saveChat === 'function') {
          await ctx.saveChat();
        }
        message.swipes = stMsg.swipes;
      }

      return true;
    };

    function bindDynamicEvents() {
      // Jump list 数字点击（事件委托，避免 renderJumpList 重新生成 DOM 后事件丢失）
      jumpListEl?.addEventListener('click', e => {
        const item = e.target.closest('.st-swipe-jump-item');
        if (!item) return;
        e.preventDefault();
        e.stopPropagation();
        const idx = parseInt(item.getAttribute('data-idx') || '0', 10);
        scrollToIdx(idx);
      });

      // 单卡按钮事件（用 ID 绑定，只绑一次）
      const getIdx = () => currentViewIdx;

      modalOverlay.querySelector(`#${modalId}-btn-switch`)?.addEventListener('click', async e => {
        e.preventDefault(); e.stopPropagation();
        try { await jumpToSwipe(getIdx()); }
        catch (err) { console.error('[Swipe Previewer] switch failed', err); window.parent.toastr?.error?.('切换楼层内容失败'); }
      });

      modalOverlay.querySelector(`#${modalId}-btn-branch`)?.addEventListener('click', async e => {
        e.preventDefault(); e.stopPropagation();
        try { await createBranchFromSwipe(getIdx()); }
        catch (err) { console.error('[Swipe Previewer] branch failed', err); window.parent.toastr?.error?.('创建新存档失败'); }
      });

      modalOverlay.querySelector(`#${modalId}-btn-edit`)?.addEventListener('click', async e => {
        e.preventDefault(); e.stopPropagation();
        try {
          const changed = await editSwipe(getIdx());
          if (!changed) return;
          await refreshModalList({ focusIdx: getIdx() });
          window.parent.toastr?.success?.('分支内容已更新');
        } catch (err) { console.error('[Swipe Previewer] edit failed', err); window.parent.toastr?.error?.('编辑分支失败'); }
      });

      modalOverlay.querySelector(`#${modalId}-btn-up`)?.addEventListener('click', async e => {
        e.preventDefault(); e.stopPropagation();
        const idx = getIdx();
        if (idx <= 0) return;
        try { await moveSwipeOrder(idx, idx - 1); await refreshModalList({ focusIdx: idx - 1 }); }
        catch (err) { console.error('[Swipe Previewer] move up failed', err); window.parent.toastr?.error?.('上移分支失败'); }
      });

      modalOverlay.querySelector(`#${modalId}-btn-down`)?.addEventListener('click', async e => {
        e.preventDefault(); e.stopPropagation();
        const idx = getIdx();
        if (idx >= swipes.length - 1) return;
        try { await moveSwipeOrder(idx, idx + 1); await refreshModalList({ focusIdx: idx + 1 }); }
        catch (err) { console.error('[Swipe Previewer] move down failed', err); window.parent.toastr?.error?.('下移分支失败'); }
      });

      modalOverlay.querySelector(`#${modalId}-btn-delete`)?.addEventListener('click', async e => {
        e.preventDefault(); e.stopPropagation();
        try {
          const deleted = await deleteSwipe(getIdx());
          if (!deleted) return;
          await refreshModalList({ focusIdx: getIdx() });
        } catch (err) { console.error('[Swipe Previewer] delete failed', err); window.parent.toastr?.error?.('删除分支失败'); }
      });

      // 收藏按钮
      modalOverlay.querySelector(`#${modalId}-btn-bookmark`)?.addEventListener('click', async e => {
        e.preventDefault(); e.stopPropagation();

        const idx = getIdx();
        const bookmarks = getSwipeBookmarks(mesId);
        const pos = bookmarks.findIndex(x => Number(x) === Number(idx));
        if (pos >= 0) {
          bookmarks.splice(pos, 1);
        } else {
          bookmarks.push(idx);
        }
        await setSwipeBookmarks(mesId, bookmarks);
        renderJumpList();
        renderCurrentCard();
      });

      // 渲染模式切换（正则 ↔ 轻量）
      modalOverlay.querySelector(`#${modalId}-btn-render`)?.addEventListener('click', async e => {
        e.preventDefault(); e.stopPropagation();
        settings.useRegex = !settings.useRegex;
        saveSettings(settings);
        await recomputeSwipeTexts();
        renderCurrentCard();
      });
    }

    // 初次打开预览：按当前设置决定是否应用正则，并渲染列表
    await refreshModalList({ keepScroll: false });

    modalOverlay
      .querySelector(`#${modalId}-prev`)
      ?.addEventListener('click', () => scrollToIdx(currentViewIdx - 1));
    modalOverlay
      .querySelector(`#${modalId}-next`)
      ?.addEventListener('click', () => scrollToIdx(currentViewIdx + 1));

    // 智能清理按钮事件
    modalOverlay.querySelector(`#${modalId}-smart-delete`)?.addEventListener('click', async e => {
      e.preventDefault(); e.stopPropagation();

      const shouldDelete = typeof window.parent.confirm === 'function'
          ? window.parent.confirm('确定要智能清理当前楼层中长度较短 (估算 < 500 tokens) 的未收藏分支吗？\\n此操作会直接修改当前聊天记录。')
          : true;

      if (!shouldDelete) return;

      const ctx = window.parent.SillyTavern?.getContext?.();
      const chat = ctx?.chat;
      const stMsg = chat?.[mesId];

      if (!stMsg || !Array.isArray(stMsg.swipes) || stMsg.swipes.length <= 1) {
          window.parent.toastr?.warning?.('分支数不足，无需清理');
          return;
      }

      const getTokenEstimation = (text) => {
           if (typeof window.parent.getTokenCount === 'function') {
               return window.parent.getTokenCount(text);
           }
           if (typeof window.parent.SillyTavern?.getTokenCount === 'function') {
               return window.parent.SillyTavern.getTokenCount(text);
           }
           return text.length / 2; // 粗略估算，中文字符较多
      };

      let bookmarks = getSwipeBookmarks(mesId).map(Number);
      let deletedCount = 0;

      // 从后往前删，避免索引偏移问题
      for (let i = stMsg.swipes.length - 1; i >= 0; i--) {
          // 至少保留一个分支
          if (stMsg.swipes.length <= 1) break;

          // 跳过已收藏的分支
          if (bookmarks.includes(i)) continue;

          const text = String(stMsg.swipes[i] ?? '');
          const tokens = getTokenEstimation(text);

          if (tokens < 500) {
              stMsg.swipes.splice(i, 1);
              if (Array.isArray(stMsg.swipe_info) && stMsg.swipe_info.length > i) {
                  stMsg.swipe_info.splice(i, 1);
              }

              // 更新 bookmarks 中比 i 大的索引
              bookmarks = bookmarks.map(b => b > i ? b - 1 : b);
              deletedCount++;
          }
      }

      if (deletedCount > 0) {
          // 需要重新修正 current
          let current = Number.isInteger(stMsg.swipe_id) ? stMsg.swipe_id : 0;
          current = Math.min(Math.max(current, 0), Math.max(0, stMsg.swipes.length - 1));

          await setSwipeBookmarks(mesId, bookmarks);
          await applySwipeToChat(current);
          await refreshModalList({ focusIdx: current });
          window.parent.toastr?.success?.(`智能清理完成，删除了 ${deletedCount} 个较短分支`);
      } else {
          window.parent.toastr?.info?.('没有匹配清理条件的分支');
      }
    });

    // Jump List 事件代理
    modalOverlay.querySelector(`#${modalId}-jump-list`)?.addEventListener('click', e => {
      const item = e.target.closest('.st-swipe-jump-item');
      if (!item) return;
      e.preventDefault(); e.stopPropagation();
      const idx = parseInt(item.getAttribute('data-idx') || '0', 10);
      if (idx === currentViewIdx) return;
      scrollToIdx(idx);
    });

    modalOverlay
      .querySelector(`#${modalId}-toggle`)
      ?.addEventListener('click', () =>
        modalOverlay.querySelector(`#${modalId}-jump-list`)?.classList.toggle('hidden'),
      );

    // 绑定关闭逻辑
    function closeModal() {
      modalOverlay.remove();
      window.removeEventListener('keydown', onKeydown);
      window.removeEventListener('message', onIframeMessage);
    }

    function onKeydown(e) {
      if (e.key === 'Escape') closeModal();
    }

    modalOverlay.querySelector(`#${modalId}-close`)?.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', e => {
      if (e.target === modalOverlay) closeModal();
    });
    window.addEventListener('keydown', onKeydown);
  }

  init();
})();
