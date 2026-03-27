$(
  (() => {
    'use strict';

    const MENU_CONTAINER_ID = 'k-pc-radial-menu-container-v5-2-opt';
    const BUTTON_CLASS = 'k-pc-radial-button-v5-2-opt';
    const TOGGLE_CLASS = 'k-pc-radial-toggle-switch';
    const STYLE_ID = 'k-pc-radial-styles-v5-2-opt';
    const SETTINGS_STYLE_ID = 'k-pc-radial-settings-styles';
    const SELECTED_CLASS = 'selected';
    const MENU_RADIUS = 75;
    const TOOLBAR_CONTAINER_ID = 'k-pc-toolbar-container';
    const TOOLBAR_BTN_CLASS = 'k-pc-toolbar-btn';

    function isMobileDevice() {
      return (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.parent.innerWidth <= 768
      );
    }

    // ── 设置版本号，用于未来迁移 ──
    const SETTINGS_VERSION = 2;
    const SETTINGS_STORAGE_KEY = 'k-radial-menu-settings';
    const BOOKMARKS_CHAT_KEY = 'radial_swipe_bookmarks';

    // ── 所有可用按钮注册表 ──
    const ALL_BUTTONS = [
      { id: 'jumpToLatest', icon: 'fa-angles-down', tooltip: '跳转至最新', category: 'navigation' },
      { id: 'jumpToCurrentTop', icon: 'fa-arrow-up', tooltip: '跳转至当前层顶部 / 上一层', category: 'navigation' },
      {
        id: 'jumpToCurrentBottom',
        icon: 'fa-arrow-down',
        tooltip: '跳转至当前层底部 / 下一层',
        category: 'navigation',
      },
      { id: 'jumpToTarget', icon: 'fa-bullseye', tooltip: '跳转至指定楼层', category: 'navigation' },
      { id: 'deleteMessage', icon: 'fa-trash-can', tooltip: '删除功能', category: 'edit' },
      { id: 'toggleFullscreen', icon: 'fa-expand', tooltip: '浏览器全屏', category: 'utility' },
      { id: 'bookmarkSwipe', icon: 'fa-bookmark', tooltip: '收藏/取消收藏当前 Swipe', category: 'swipe' },
      { id: 'previewSwipes', icon: 'fa-layer-group', tooltip: '打开分支预览器', category: 'swipe' },
      { id: 'generateLastSwipe', icon: 'fa-angles-right', tooltip: '生成最新一楼的新回复', category: 'swipe' },
    ];

    // ── 默认启用的按钮 ID 列表 ──
    const DEFAULT_ENABLED_BUTTONS = [
      'jumpToLatest',
      'jumpToCurrentTop',
      'jumpToCurrentBottom',
      'jumpToTarget',
      'deleteMessage',
    ];

    const DEFAULT_PROFILE_PC = {
      enabledButtons: [...DEFAULT_ENABLED_BUTTONS],
      buttonSize: 30,
      menuRadius: 75,
      pencilSize: 36,
      toolbarMode: true,
      toolbarCollapsed: false,
      toolbarPosition: { x: 20, y: 100 },
      mobileTriggerMode: 'longPress',
    };

    const DEFAULT_PROFILE_MOBILE = {
      enabledButtons: [...DEFAULT_ENABLED_BUTTONS],
      buttonSize: 60,
      menuRadius: 75,
      pencilSize: 36,
      toolbarMode: false,
      toolbarCollapsed: false,
      toolbarPosition: { x: 20, y: 100 },
      mobileTriggerMode: 'longPress',
    };

    // ── 设置持久化 ──
    function loadSettings() {
      let parsed = null;
      try {
        // 优先尝试脚本变量
        if (typeof getVariables === 'function') {
          const vars = getVariables({ type: 'script' });
          if (vars) parsed = vars;
        }
      } catch (e) {
        console.warn('[RadialMenu] loadSettings from script vars failed:', e);
      }

      // 回退到 localStorage
      if (!parsed) {
        try {
          const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
          if (raw) parsed = JSON.parse(raw);
        } catch (e) {}
      }

      if (!parsed) {
        return {
          _version: SETTINGS_VERSION,
          modeOverride: 'auto',
          profiles: {
            pc: JSON.parse(JSON.stringify(DEFAULT_PROFILE_PC)),
            mobile: JSON.parse(JSON.stringify(DEFAULT_PROFILE_MOBILE)),
          },
        };
      }

      // Exact match for V2
      if (parsed._version === SETTINGS_VERSION && parsed.profiles) {
        if (typeof parsed.modeOverride === 'undefined') parsed.modeOverride = 'auto';
        return parsed;
      }

      // Migration from V1 (or broken structures)
      if (parsed._version === 1 || !parsed.profiles) {
        const legacyProfile = {
          enabledButtons: parsed.enabledButtons || [...DEFAULT_ENABLED_BUTTONS],
          buttonSize: parsed.buttonSize || 60,
          menuRadius: parsed.menuRadius || 75,
          pencilSize: parsed.pencilSize || 36,
          toolbarMode: !!parsed.toolbarMode,
          toolbarCollapsed: false,
          toolbarPosition: parsed.toolbarPosition || { x: 20, y: 100 },
          mobileTriggerMode: 'longPress',
        };
        return {
          _version: SETTINGS_VERSION,
          modeOverride: 'auto',
          profiles: {
            pc: JSON.parse(JSON.stringify(legacyProfile)),
            mobile: JSON.parse(JSON.stringify(legacyProfile)),
          },
        };
      }

      return parsed;
    }

    function saveSettings(settings) {
      settings._version = SETTINGS_VERSION;
      // 保存到脚本变量
      try {
        if (typeof replaceVariables === 'function') {
          replaceVariables(JSON.parse(JSON.stringify(settings)), { type: 'script' });
        }
      } catch (e) {
        console.warn('[RadialMenu] saveSettings to script vars failed:', e);
      }
      // 同时保存到 localStorage 作为备份
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      } catch (e) {}
    }

    let currentSettings = null; // 延迟到 init 中加载

    // ── 获取当前设备对应设置 ──
    function getEffectiveSettings() {
      if (!currentSettings) currentSettings = loadSettings();
      const p = currentSettings.profiles;
      if (!p) return currentSettings;

      let mode = isMobileDevice() ? 'mobile' : 'pc';
      if (currentSettings.modeOverride === 'pc') mode = 'pc';
      if (currentSettings.modeOverride === 'mobile') mode = 'mobile';

      return mode === 'mobile' ? p.mobile : p.pc;
    }

    // ── 根据设置生成当前活跃的按钮配置 ──
    function getActiveButtonsConfig() {
      if (!currentSettings) currentSettings = loadSettings();
      const effective = getEffectiveSettings();
      const ids = effective.enabledButtons || DEFAULT_ENABLED_BUTTONS;
      const count = ids.length;
      if (count === 0) return [];
      const angleStep = 360 / count;
      return ids
        .map((id, index) => {
          const btn = ALL_BUTTONS.find(b => b.id === id);
          if (!btn) return null;
          // 从正上方 (270°) 开始顺时针均匀分布
          const angle = (270 + index * angleStep) % 360;
          return { ...btn, angle };
        })
        .filter(Boolean);
    }

    // ── Swipe 收藏数据读写（聊天变量）──
    function loadSwipeBookmarks() {
      try {
        if (typeof getVariables === 'function') {
          const chatVars = getVariables({ type: 'chat' });
          const val = chatVars?.[BOOKMARKS_CHAT_KEY];
          return val ? JSON.parse(JSON.stringify(val)) : {};
        }
      } catch (e) {}
      return {};
    }

    function saveSwipeBookmarks(bookmarks) {
      try {
        if (typeof insertOrAssignVariables === 'function') {
          insertOrAssignVariables({ [BOOKMARKS_CHAT_KEY]: JSON.parse(JSON.stringify(bookmarks)) }, { type: 'chat' });
        }
      } catch (e) {
        console.warn('[RadialMenu] saveBookmarks failed:', e);
      }
    }

    // Smooth scroll helper — easeOutQuart feels natural and non-jarring
    function smoothScrollTo(el, targetPos, duration) {
      const start = el.scrollTop;
      const distance = targetPos - start;
      if (Math.abs(distance) < 2) return;
      const startTime = performance.now();
      function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutQuart: decelerates quickly, arrives softly
        const ease = 1 - Math.pow(1 - progress, 4);
        el.scrollTop = start + distance * ease;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    // ── Safe ST API wrappers ─────────────────────────────────────────────────
    // All SillyTavern globals are optional — future versions may rename or remove
    // them. Every call goes through these wrappers so a missing API degrades
    // gracefully instead of throwing an uncaught TypeError.
    const ST = {
      chat: () => (typeof SillyTavern !== 'undefined' ? SillyTavern.chat : window.chat || []),
      lastMesId: () => {
        if (typeof getLastMessageId === 'function') return getLastMessageId();
        const msgs = ST.chat();
        return Array.isArray(msgs) ? msgs.length - 1 : -1;
      },
      popup: async (msg, type, def) => {
        try {
          if (typeof SillyTavern !== 'undefined' && SillyTavern.callGenericPopup)
            return await SillyTavern.callGenericPopup(msg, type, def);
        } catch (e) {}
        // Fallback to native prompt/confirm
        if (type && type === (SillyTavern?.POPUP_TYPE?.CONFIRM ?? 'confirm'))
          return window.confirm(msg) ? true : undefined;
        const r = window.prompt(msg, def ?? '');
        return r !== null ? r : undefined;
      },
      deleteMes: async id => {
        try {
          if (typeof SillyTavern !== 'undefined' && SillyTavern.deleteMessage)
            return await SillyTavern.deleteMessage(id);
        } catch (e) {
          console.warn('[RadialMenu] deleteMessage API missing:', e);
        }
      },
      saveChat: async () => {
        try {
          if (typeof SillyTavern !== 'undefined' && SillyTavern.saveChat) return await SillyTavern.saveChat();
        } catch (e) {}
      },
      setMessages: async arr => {
        try {
          if (typeof setChatMessages === 'function') return await setChatMessages(arr);
        } catch (e) {
          console.warn('[RadialMenu] setChatMessages unavailable:', e);
          throw e;
        }
      },
      slash: async cmd => {
        try {
          if (typeof triggerSlash === 'function') return await triggerSlash(cmd);
        } catch (e) {
          console.warn('[RadialMenu] triggerSlash unavailable:', e);
          return undefined;
        }
      },
      onEvent: (ev, fn, useLast = false) => {
        try {
          if (typeof tavern_events === 'undefined') return;
          const evName = tavern_events[ev];
          if (!evName) return;
          if (useLast && typeof eventMakeLast === 'function') eventMakeLast(evName, fn);
          else if (typeof eventOn === 'function') eventOn(evName, fn);
        } catch (e) {}
      },
    };

    const LONG_PRESS_DURATION = 450;
    const MOVE_THRESHOLD = 10;
    let touchTimer = null;
    let isPossiblyLongPress = false;
    let pressCoords = { x: 0, y: 0 };
    let lastTriggerWasTouch = false;

    let isAutoJumpEnabled = localStorage.getItem('k-pc-radial-auto-jump') !== 'false';

    const EDIT_CONFIG = {
      RE_ENTRY_GUARD_DELAY: 100,
      OBSERVER_TIMEOUT: 1000,
      EDITOR_APPEAR_TIMEOUT: 5000,
      SCROLL_INTO_VIEW_OFFSET: 120,
      EDITOR_SCROLL_ALIGNMENT_RATIO: 0.3,
      SELECTORS: {
        MESSAGE: '.mes',
        EDIT_BUTTONS: ['.mes_edit', '.fa-edit', '.fa-pencil'],
        DONE_BUTTON: '.mes_edit_done',
        EDITOR: 'textarea:visible, [contenteditable="true"]:visible',
        ST_EDITOR_TEXTAREA: '#curEditTextarea, textarea.edit_textarea, .mes_text textarea',
        SCROLL_CONTAINERS: ['.simplebar-content-wrapper', '#chat', '.chat-area', '#chat_container'],
      },
      ATTRIBUTES: { TEMP_TARGET: 'data-k-radial-edit-target' },
    };

    let menuVisible = false;
    let selectedButton = null;
    // Perf caches
    let buttonCache = []; // [{el, cx, cy}]
    let knownChatLength = -1; // tracks message count — auto-jump triggers only when this grows
    let cachedChatRect = null; // chat's getBoundingClientRect — stable while visible
    let selRafId = null; // rAF handle for updateSelection throttle
    let targetedMessageCard = null;
    let isSmartEditing = false;
    let previousScrollPosition = null;

    // ── 浮动铅笔编辑按钮状态 ──
    const PENCIL_BUTTON_ID = 'k-radial-floating-pencil';
    let isEditingMode = false; // 选区状态锁: 防止 selectionchange 频繁触发 DOM 操作
    let selectionDebounceTimer = null;
    let mostVisibleMessageCard = null;
    let autoJumpTimer = null;

    const log = (msg, ...args) => console.log(`[PC_RadialMenu_v2] ${msg}`, ...args);

    // ── Future-proof API wrappers ─────────────────────────────────────────────
    // All ST-specific globals are accessed through these helpers.
    // If ST renames or removes an API, we get a graceful warning instead of
    // a silent TypeError that kills the whole script.
    function safeSTAPI(name, ...args) {
      try {
        const parts = name.split('.');
        let obj = window;
        for (const p of parts.slice(0, -1)) obj = obj[p];
        const fn = obj?.[parts.at(-1)];
        if (typeof fn !== 'function') {
          console.warn(`[RadialMenu] ST API "${name}" not found — skipping`);
          return undefined;
        }
        return fn.apply(obj, args);
      } catch (e) {
        console.warn(`[RadialMenu] ST API "${name}" threw:`, e);
        return undefined;
      }
    }

    function safeGetLastMessageId() {
      try {
        if (typeof getLastMessageId === 'function') return safeGetLastMessageId();
      } catch (e) {}
      // Fallback: count .mes elements in #chat
      const msgs = window.parent.document.querySelectorAll('#chat .mes[mesid]');
      if (msgs.length === 0) return -1;
      return parseInt([...msgs].at(-1).getAttribute('mesid') ?? '-1', 10);
    }

    function safeEventOn(eventName, handler) {
      try {
        if (
          typeof eventOn === 'function' &&
          typeof tavern_events === 'object' &&
          tavern_events[eventName] !== undefined
        ) {
          eventOn(tavern_events[eventName], handler);
          return true;
        }
      } catch (e) {}
      console.warn(`[RadialMenu] eventOn("${eventName}") unavailable`);
      return false;
    }

    function safeEventMakeLast(eventName, handler) {
      try {
        if (
          typeof eventMakeLast === 'function' &&
          typeof tavern_events === 'object' &&
          tavern_events[eventName] !== undefined
        ) {
          eventMakeLast(tavern_events[eventName], handler);
          return true;
        }
      } catch (e) {}
      console.warn(`[RadialMenu] eventMakeLast("${eventName}") unavailable`);
      return false;
    }

    async function safeTriggerSlash(cmd) {
      if (typeof triggerSlash !== 'function') {
        console.warn('[RadialMenu] triggerSlash not available');
        return undefined;
      }
      return triggerSlash(cmd);
    }

    async function safeSetChatMessages(payload, options) {
      if (typeof setChatMessages !== 'function') {
        console.warn('[RadialMenu] setChatMessages not available');
        return false;
      }
      try {
        await setChatMessages(payload, options);
      } catch (e) {
        console.warn('[RadialMenu] setChatMessages error:', e);
        return false;
      }
      return true;
    }

    // ─────────────────────────────────────────────────────────────────────────

    function injectStyles() {
      const parentDoc = window.parent.document;
      if (parentDoc.getElementById(STYLE_ID)) return;
      $('style[id^="k-pc-radial-styles"]', parentDoc).remove();
      parentDoc.head.insertAdjacentHTML(
        'beforeend',
        `<style id="${STYLE_ID}">
    #${MENU_CONTAINER_ID} { display: none; }

    /* ── All colour tokens are runtime-injected by applyTheme()       ── */
    /* ── CSS here only defines structure/geometry/transitions         ── */
    /* ── Dark-neutral safe defaults (overridden at showMenu time)     ── */
    #${MENU_CONTAINER_ID} {
        --rb-bg:     rgba(28, 28, 32, 0.92);
        --rb-text:   rgba(220, 220, 220, 0.95);
        --rb-border: rgba(255, 255, 255, 0.14);
        --rb-shadow: rgba(0, 0, 0, 0.50);
        --rb-ok:     var(--SmartThemeQuoteColor, #4caf8a);
        --rb-size:   60px;
    }

    /* ── Button base ── */
    .${BUTTON_CLASS} {
        position:         fixed !important;
        width:            var(--rb-size);
        height:           var(--rb-size);
        background-color: var(--rb-bg);
        color:            var(--rb-text);
        border:           1.5px solid var(--rb-border);
        border-radius:    50%;
        display:          flex !important;
        align-items:      center;
        justify-content:  center;
        font-size:        calc(var(--rb-size) * 0.36);
        cursor:           pointer;
        transform:        translate(-50%, -50%);
        box-shadow:       0 4px 18px var(--rb-shadow);
        z-index:          99999 !important;
        pointer-events:   auto;
        transition:       border-color .15s, box-shadow .15s,
                          color .15s, transform .15s,
                          background-color .15s;
        will-change:      transform;
    }

    /* ── Selected: accent border + glow + icon tint ── */
    .${BUTTON_CLASS}.${SELECTED_CLASS} {
        transform:    translate(-50%, -50%) scale(1.18);
        border-color: var(--rb-ok);
        color:        var(--rb-ok);
        box-shadow:   0 4px 18px var(--rb-shadow), 0 0 14px var(--rb-ok);
    }

    /* ── Delete popup (rendered inside ST Popup) ── */
    .k-radial-delete-popup {
        width: 100%;
        max-height: 60vh;
        overflow-y: auto;
    }
    .k-radial-delete-popup .k-del-title {
        font-size: 15px;
        font-weight: 600;
        margin-bottom: 14px;
        text-align: center;
    }
    .k-radial-delete-popup .k-del-inputs {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-bottom: 16px;
    }
    .k-radial-delete-popup .k-del-input {
        width: 80px;
        padding: 6px 8px;
        border: 1.5px solid rgba(255,255,255,0.18);
        border-radius: 8px;
        background: rgba(255,255,255,0.06);
        color: inherit;
        font-size: 15px;
        text-align: center;
        outline: none;
        -moz-appearance: textfield;
    }
    .k-radial-delete-popup .k-del-input:focus {
        border-color: var(--rb-ok, #4caf8a);
    }
    .k-radial-delete-popup .k-del-input::-webkit-inner-spin-button,
    .k-radial-delete-popup .k-del-input::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    .k-radial-delete-popup .k-del-sep {
        font-size: 16px;
        opacity: 0.6;
    }
    .k-radial-delete-popup .k-del-section-label {
        font-size: 12px;
        opacity: 0.55;
        margin-bottom: 8px;
        text-align: center;
    }
    .k-radial-delete-popup .k-del-btns {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-bottom: 14px;
    }
    .k-radial-delete-popup .k-del-btn {
        padding: 8px 0;
        border: 1.5px solid rgba(255,255,255,0.14);
        border-radius: 8px;
        background: rgba(255,255,255,0.05);
        color: inherit;
        font-size: 13px;
        cursor: pointer;
        transition: background .15s, border-color .15s, color .15s;
        text-align: center;
    }
    .k-radial-delete-popup .k-del-btn:hover {
        background: rgba(255,255,255,0.12);
        border-color: var(--rb-ok, #4caf8a);
    }
    .k-radial-delete-popup .k-del-btn:active {
        transform: scale(0.97);
    }
    .k-radial-delete-popup .k-del-btn.disabled {
        opacity: 0.35;
        pointer-events: none;
    }
    .k-radial-delete-popup .k-del-btn-danger {
        color: #f87171;
        border-color: rgba(248,113,113,0.3);
    }
    .k-radial-delete-popup .k-del-btn-danger:hover {
        background: rgba(248,113,113,0.12);
        border-color: #f87171;
    }

    /* ── PC Toolbar Mode ── */
    #${TOOLBAR_CONTAINER_ID} {
        --rb-bg:     rgba(28, 28, 32, 0.92);
        --rb-text:   rgba(220, 220, 220, 0.95);
        --rb-border: rgba(255, 255, 255, 0.14);
        --rb-shadow: rgba(0, 0, 0, 0.50);
        --rb-ok:     var(--SmartThemeQuoteColor, #4caf8a);
        --rb-size:   60px;
    }
    #${TOOLBAR_CONTAINER_ID} {
        position: fixed;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: 8px 6px;
        background: var(--rb-bg);
        border: 1.5px solid var(--rb-border);
        border-radius: 14px;
        box-shadow: 0 6px 24px var(--rb-shadow);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        z-index: 99998;
        user-select: none;
        transition: box-shadow .2s;
    }
    #${TOOLBAR_CONTAINER_ID}:hover {
        box-shadow: 0 8px 30px var(--rb-shadow), 0 0 0 1px var(--rb-border);
    }
    .k-pc-toolbar-drag-handle {
        width: 28px;
        height: 6px;
        border-radius: 3px;
        background: var(--rb-border);
        cursor: grab;
        margin-bottom: 2px;
        transition: background .15s;
        flex-shrink: 0;
    }
    .k-pc-toolbar-drag-handle:hover {
        background: var(--rb-ok);
    }
    .k-pc-toolbar-drag-handle:active {
        cursor: grabbing;
    }
    .${TOOLBAR_BTN_CLASS} {
        width: var(--rb-size);
        height: var(--rb-size);
        background: transparent;
        color: var(--rb-text);
        border: 1.5px solid transparent;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: calc(var(--rb-size) * 0.36);
        cursor: pointer;
        transition: border-color .15s, background-color .15s, color .15s, transform .15s;
        flex-shrink: 0;
    }
    .${TOOLBAR_BTN_CLASS}:hover {
        border-color: var(--rb-border);
        background: rgba(255,255,255,0.08);
        transform: scale(1.08);
    }
    .${TOOLBAR_BTN_CLASS}:active {
        transform: scale(0.94);
        border-color: var(--rb-ok);
        color: var(--rb-ok);
    }
    </style>`,
      );
    }

    function createAndInjectUI() {
      if (!currentSettings) currentSettings = loadSettings();
      const effective = getEffectiveSettings();
      const parentDoc = window.parent.document;
      let $container = $(`#${MENU_CONTAINER_ID}`, parentDoc);
      if ($container.length === 0) $container = $('<div/>', { id: MENU_CONTAINER_ID }).appendTo($(parentDoc.body));
      $container.empty();
      $container[0].style.setProperty('--rb-size', `${effective.buttonSize || 60}px`);
      const buttonsConfig = getActiveButtonsConfig();
      buttonsConfig.forEach(config => {
        const $btn = $('<div/>', {
          class: BUTTON_CLASS,
          'data-id': config.id,
          title: config.tooltip,
          style: 'display:none',
        }).html(`<i class="fa-solid ${config.icon}"></i>`);
        $btn.appendTo($container);
      });
    }

    // ── PC Toolbar Mode ──────────────────────────────────────────────────────
    let toolbarEl = null;
    let toolbarDragState = null;

    function getToolbarTargetCard() {
      if (mostVisibleMessageCard) return mostVisibleMessageCard;
      try {
        const sc = findScrollContainer();
        if (!sc || !sc.length) return null;
        const cr = sc[0].getBoundingClientRect();
        const midY = cr.top + cr.height / 2;
        let best = null,
          minDist = Infinity;
        $(window.parent.document)
          .find('.mes:visible')
          .each((_, el) => {
            const r = el.getBoundingClientRect();
            const elMidY = r.top + r.height / 2;
            const dist = Math.abs(elMidY - midY);
            if (dist < minDist) {
              minDist = dist;
              best = el;
            }
          });
        return best;
      } catch (e) {
        return null;
      }
    }

    function executeToolbarAction(actionId) {
      targetedMessageCard = getToolbarTargetCard();
      if (!targetedMessageCard) {
        toastr.warning('当前视野内找不到任何可操作的消息楼层');
        return;
      }
      // For actions that need pressCoords (e.g. editParagraph), use center of target
      if (targetedMessageCard) {
        const rect = targetedMessageCard.getBoundingClientRect();
        pressCoords = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      }
      lastTriggerWasTouch = false;
      switch (actionId) {
        case 'deleteMessage':
          action_deleteMessage();
          break;
        case 'jumpToLatest':
          action_jumpToLatest();
          break;
        case 'jumpToTarget':
          action_jumpToTarget();
          break;
        case 'jumpToCurrentTop':
          action_jumpToCurrentTop();
          break;
        case 'jumpToCurrentBottom':
          action_jumpToCurrentBottom();
          break;
        case 'toggleFullscreen':
          action_toggleFullscreen();
          break;
        case 'bookmarkSwipe':
          action_bookmarkSwipe();
          break;
        case 'previewSwipes':
          action_previewSwipes();
          break;
        case 'generateLastSwipe':
          action_generateLastSwipe();
          break;
      }
    }

    function createToolbar() {
      destroyToolbar();
      if (!currentSettings) currentSettings = loadSettings();
      const effective = getEffectiveSettings();
      const parentDoc = window.parent.document;

      const container = parentDoc.createElement('div');
      container.id = TOOLBAR_CONTAINER_ID;
      applyTheme(container);
      container.style.setProperty('--rb-size', `${effective.buttonSize || 60}px`);

      let isCollapsed = effective.toolbarCollapsed || false;

      // Restore saved position
      const pos = effective.toolbarPosition || { x: 20, y: 100 };

      // Mobile center init
      if (isMobileDevice() && pos.x === 20 && pos.y === 100) {
        const w = 40;
        const h = 200; // rough initial estimate
        pos.x = Math.max(0, (window.parent.innerWidth - w) / 2);
        pos.y = Math.max(0, (window.parent.innerHeight - h) / 2);
        effective.toolbarPosition = pos;
        saveSettings(currentSettings);
      }

      container.style.left = `${pos.x}px`;
      container.style.top = `${pos.y}px`;

      // Drag handle
      const handle = parentDoc.createElement('div');
      handle.className = 'k-pc-toolbar-drag-handle';
      handle.title = '拖拽移动 / 单击收起展开';
      container.appendChild(handle);

      // Buttons
      const buttonsConfig = getActiveButtonsConfig();
      const btnEls = [];
      buttonsConfig.forEach(config => {
        const btn = parentDoc.createElement('div');
        btn.className = TOOLBAR_BTN_CLASS;
        btn.dataset.id = config.id;
        btn.title = config.tooltip;
        btn.innerHTML = `<i class="fa-solid ${config.icon}"></i>`;
        btn.addEventListener('click', e => {
          e.stopPropagation();
          executeToolbarAction(config.id);
        });
        btnEls.push(btn);
        container.appendChild(btn);
      });

      const updateCollapseState = () => {
        btnEls.forEach(btn => (btn.style.display = isCollapsed ? 'none' : 'flex'));
      };
      updateCollapseState();

      parentDoc.body.appendChild(container);
      toolbarEl = container;

      // ── Drag logic ──
      let isDragging = false;
      let startX = 0,
        startY = 0;

      const onDragStart = e => {
        if (e.type === 'touchstart' && e.cancelable) e.preventDefault();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        startX = clientX;
        startY = clientY;
        isDragging = false;

        const rect = container.getBoundingClientRect();
        toolbarDragState = { offsetX: clientX - rect.left, offsetY: clientY - rect.top };
        handle.style.cursor = 'grabbing';
        container.style.transition = 'none';
      };

      handle.addEventListener('mousedown', onDragStart);
      handle.addEventListener('touchstart', onDragStart, { passive: false });

      const onMouseMove = e => {
        if (!toolbarDragState) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        if (!isDragging && Math.hypot(clientX - startX, clientY - startY) > 5) {
          isDragging = true;
        }
        if (!isDragging) return;

        if (e.cancelable) e.preventDefault();
        const vw = parentDoc.documentElement.clientWidth;
        const vh = parentDoc.documentElement.clientHeight;
        const w = container.offsetWidth;
        const h = container.offsetHeight;
        let nx = clientX - toolbarDragState.offsetX;
        let ny = clientY - toolbarDragState.offsetY;

        nx = Math.max(0, Math.min(nx, vw - w));
        ny = Math.max(0, Math.min(ny, vh - h));

        container.style.left = `${nx}px`;
        container.style.top = `${ny}px`;
      };

      const onMouseUp = e => {
        if (!toolbarDragState) return;
        toolbarDragState = null;
        handle.style.cursor = '';
        container.style.transition = '';

        const eff = getEffectiveSettings();

        if (!isDragging) {
          // Was a click
          isCollapsed = !isCollapsed;
          updateCollapseState();
          eff.toolbarCollapsed = isCollapsed;
        }

        // Persist pos after any layout update
        setTimeout(() => {
          const vw = parentDoc.documentElement.clientWidth;
          const vh = parentDoc.documentElement.clientHeight;
          const w = container.offsetWidth;
          const h = container.offsetHeight;
          let nx = parseInt(container.style.left, 10) || 0;
          let ny = parseInt(container.style.top, 10) || 0;
          nx = Math.max(0, Math.min(nx, vw - w));
          ny = Math.max(0, Math.min(ny, vh - h));
          container.style.left = `${nx}px`;
          container.style.top = `${ny}px`;

          eff.toolbarPosition = { x: nx, y: ny };
          saveSettings(currentSettings);
        }, 50);
      };

      parentDoc.addEventListener('mousemove', onMouseMove, { passive: false });
      parentDoc.addEventListener('mouseup', onMouseUp);
      parentDoc.addEventListener('touchmove', onMouseMove, { passive: false });
      parentDoc.addEventListener('touchend', onMouseUp);

      // Store cleanup references
      container._toolbarCleanup = () => {
        parentDoc.removeEventListener('mousemove', onMouseMove);
        parentDoc.removeEventListener('mouseup', onMouseUp);
        parentDoc.removeEventListener('touchmove', onMouseMove);
        parentDoc.removeEventListener('touchend', onMouseUp);
      };
    }

    function destroyToolbar() {
      if (toolbarEl) {
        if (toolbarEl._toolbarCleanup) toolbarEl._toolbarCleanup();
        toolbarEl.remove();
        toolbarEl = null;
      } else {
        // Fallback: clean up by ID
        const existing = window.parent.document.getElementById(TOOLBAR_CONTAINER_ID);
        if (existing) existing.remove();
      }
    }

    function refreshToolbar() {
      if (getEffectiveSettings().toolbarMode) {
        createToolbar();
      }
    }

    // ─── FIX #2 ────────────────────────────────────────────────────────────────
    // Previously: scrollIntoView({ block:'start' }) → latest message pinned to
    // the TOP of the viewport. Now: scroll #chat to its own scrollHeight so the
    // full latest message is visible at the BOTTOM.
    function robustAutoJump(isCheckUser = false, isManual = false) {
      if (!isManual && !isAutoJumpEnabled) return;
      if (autoJumpTimer !== null) clearTimeout(autoJumpTimer);
      autoJumpTimer = setTimeout(() => {
        try {
          // Only auto-jump when the chat has grown (new message added)
          // or on manual trigger. Edits/re-renders don't change chat length.
          const currentLen = SillyTavern?.chat?.length ?? -1;
          if (!isManual && currentLen > 0 && currentLen <= knownChatLength) return;
          knownChatLength = currentLen;

          const latestId = safeGetLastMessageId();
          if (latestId === undefined || latestId < 0) return;
          const parentDoc = window.parent.document;
          const lastEl = parentDoc.querySelector(`div.mes[mesid="${latestId}"]`);
          if (!lastEl) {
            return setTimeout(() => robustAutoJump(isCheckUser, isManual), 200);
          }
          if (isCheckUser && lastEl.getAttribute('is_user') !== 'false') return;
          const chat = parentDoc.getElementById('chat');
          const scrollPos = getScrollPositionOf(lastEl, chat);
          smoothScrollTo(chat, scrollPos, 550);
        } catch (err) {
          console.error('[PC_RadialMenu] robustAutoJump:', err);
        }
      }, 150);
    }

    // ── Delete popup helpers ─────────────────────────────────────────────────
    async function deleteFloorRange(start, end) {
      if (start < 0 || end < 0 || start > end) {
        toastr.error('楼层范围无效');
        return;
      }
      const maxId = ST.lastMesId();
      if (start > maxId) {
        toastr.error(`起始楼层 ${start} 不存在（最大 ${maxId}）`);
        return;
      }
      const clampedEnd = Math.min(end, maxId);
      try {
        await ST.slash(`/cut ${start}-${clampedEnd}`);
        toastr.success(`已删除楼层 ${start}–${clampedEnd}`);
      } catch (e) {
        console.error('[RadialMenu] deleteFloorRange failed:', e);
        toastr.error('删除楼层失败');
      }
    }

    async function deleteCurrentSwipe(mesid) {
      try {
        const ctx = typeof SillyTavern !== 'undefined' ? SillyTavern.getContext() : null;
        const stMsg = ctx?.chat?.[mesid];
        if (!stMsg || !Array.isArray(stMsg.swipes)) {
          toastr.error('无法获取 swipe 数据');
          return;
        }
        if (stMsg.swipes.length <= 1) {
          toastr.warning('只有一个 swipe，无法删除');
          return;
        }
        const targetIdx = Number.isInteger(stMsg.swipe_id) ? stMsg.swipe_id : 0;

        const newSwipes = [...stMsg.swipes];
        newSwipes.splice(targetIdx, 1);
        const newSwipeInfo = Array.isArray(stMsg.swipe_info) ? [...stMsg.swipe_info] : [];
        if (newSwipeInfo.length > targetIdx) {
          newSwipeInfo.splice(targetIdx, 1);
        }
        const nextIdx = Math.min(targetIdx, newSwipes.length - 1);

        // 直接修改底层引用，避开部分版本 setChatMessages 使用 _.merge 导致的长数组无法被短数组整个替换的幽灵 bug
        stMsg.swipes = newSwipes;
        stMsg.swipe_info = newSwipeInfo;
        stMsg.swipe_id = nextIdx;
        stMsg.mes = newSwipes[nextIdx];

        // 优先使用高级 API 触发保存和刷新同步
        if (typeof setChatMessages === 'function') {
          await safeSetChatMessages([{ message_id: mesid }], { refresh: 'affected' });
        } else {
          // 原生 ST 退避模式
          if (typeof updateMessageBlock === 'function') {
            updateMessageBlock(mesid, stMsg);
          } else if (ctx && typeof ctx.updateMessageBlock === 'function') {
            ctx.updateMessageBlock(mesid, stMsg);
          }

          if (typeof eventSource !== 'undefined' && typeof tavern_events !== 'undefined') {
            eventSource.emit(tavern_events.CHAT_CHANGED);
          }
          if (typeof ctx.saveChat === 'function') {
            await ctx.saveChat();
          }
        }
        toastr.success(`已删除第 ${mesid} 楼的 swipe #${targetIdx + 1}`);
      } catch (e) {
        console.error('[RadialMenu] deleteCurrentSwipe failed:', e);
        toastr.error('删除 swipe 失败');
      }
    }

    function showDeletePopup(mesid) {
      const maxId = ST.lastMesId();

      // Check swipe count for disabling the swipe-delete button
      let swipeCount = 1;
      try {
        const ctx = typeof SillyTavern !== 'undefined' ? SillyTavern.getContext() : null;
        const stMsg = ctx?.chat?.[mesid];
        if (stMsg && Array.isArray(stMsg.swipes)) swipeCount = stMsg.swipes.length;
      } catch (_) {}

      // Build popup content using jQuery (same pattern as 数据搬家新聊天.js)
      const $wrapper = $(`
            <div class="k-radial-delete-popup">
                <div class="k-del-title">删除 — 第 ${mesid} 楼</div>
                <div class="k-del-inputs">
                    <input id="k-del-start" class="k-del-input" type="number" min="0" max="${maxId}" value="${mesid}" />
                    <span class="k-del-sep">—</span>
                    <input id="k-del-end" class="k-del-input" type="number" min="0" max="${maxId}" value="${maxId}" />
                </div>
                <div class="k-del-section-label">删除选择</div>
                <div class="k-del-btns">
                    <button class="k-del-btn k-del-btn-danger" data-action="range">删范围</button>
                    <button class="k-del-btn k-del-btn-danger" data-action="toEnd">删到最后</button>
                    <button class="k-del-btn k-del-btn-danger" data-action="single">删本楼</button>
                    <button class="k-del-btn k-del-btn-danger ${swipeCount <= 1 ? 'disabled' : ''}" data-action="swipe">删当前swipe</button>
                </div>
            </div>
        `);

      // Use ST Popup API (same approach as 数据搬家新聊天.js)
      let popupInstance = null;
      const closePopup = () => {
        if (popupInstance && popupInstance.completeAffirmative) {
          popupInstance.completeAffirmative();
        } else {
          // Fallback: try clicking the swal2 confirm button
          $('.swal2-confirm', window.parent.document).click();
        }
      };

      const getInputs = () => {
        const s = parseInt($wrapper.find('#k-del-start').val(), 10);
        const e = parseInt($wrapper.find('#k-del-end').val(), 10);
        return { start: s, end: e };
      };

      // Bind button actions
      $wrapper.on('click', '[data-action]', function () {
        const action = $(this).data('action');
        closePopup();
        switch (action) {
          case 'range': {
            const { start, end } = getInputs();
            if (isNaN(start) || isNaN(end)) {
              toastr.error('请输入有效数字');
              return;
            }
            if (start > end) {
              toastr.error('起始楼层不能大于结束楼层');
              return;
            }
            deleteFloorRange(start, end);
            break;
          }
          case 'toEnd': {
            const { start } = getInputs();
            if (isNaN(start)) {
              toastr.error('请输入有效的起始楼层');
              return;
            }
            deleteFloorRange(start, maxId);
            break;
          }
          case 'single':
            deleteFloorRange(mesid, mesid);
            break;
          case 'swipe':
            deleteCurrentSwipe(mesid);
            break;
        }
      });

      // Show via SillyTavern.Popup API
      if (typeof SillyTavern !== 'undefined' && SillyTavern.Popup) {
        popupInstance = new SillyTavern.Popup($wrapper, SillyTavern.POPUP_TYPE.TEXT, '', { okButton: '取消' });
        popupInstance.show();
      } else {
        // Fallback: use callGenericPopup
        const popupFunc =
          typeof SillyTavern !== 'undefined' && SillyTavern.callGenericPopup
            ? SillyTavern.callGenericPopup
            : typeof callGenericPopup === 'function'
              ? callGenericPopup
              : null;
        if (popupFunc) {
          popupFunc($wrapper, 1, '', { okButton: '取消' });
        } else {
          toastr.error('弹窗 API 不可用');
        }
      }
    }

    async function action_deleteMessage() {
      if (!targetedMessageCard) return;
      const $mes = $(targetedMessageCard);
      const mesid = parseInt($mes.attr('mesid'), 10);
      if (isNaN(mesid)) {
        toastr.error('无法获取楼层 ID');
        return;
      }
      showDeletePopup(mesid);
    }

    const SCROLL_TOLERANCE = 5;
    function isScrolledToTop(sc) {
      return sc.scrollTop <= SCROLL_TOLERANCE;
    }
    function isScrolledToBottom(sc) {
      return sc.scrollHeight - sc.scrollTop - sc.clientHeight <= SCROLL_TOLERANCE;
    }
    function isElementAtTop(el, sc) {
      const cr = sc.getBoundingClientRect(),
        er = el.getBoundingClientRect();
      if (Math.abs(er.top - cr.top) < SCROLL_TOLERANCE) return true;
      return $(el).nextAll('.mes').length === 0 && isScrolledToBottom(sc);
    }
    function isElementAtBottom(el, sc) {
      const cr = sc.getBoundingClientRect(),
        er = el.getBoundingClientRect();
      if (Math.abs(er.bottom - cr.bottom) < SCROLL_TOLERANCE) return true;
      return $(el).prevAll('.mes').length === 0 && isScrolledToTop(sc);
    }

    function action_jumpToLatest() {
      robustAutoJump(false, true);
    }

    function getScrollPositionOf(el, chat) {
      // chat.getBoundingClientRect() is stable (chat fills the screen and never moves).
      // Cache it for the duration of a scroll action; cleared in hideMenu.
      if (!cachedChatRect) cachedChatRect = chat.getBoundingClientRect();
      const cr = cachedChatRect;

      const cs = getComputedStyle(el);
      if (cs.display !== 'none') {
        const r = el.getBoundingClientRect();
        return r.top - cr.top + chat.scrollTop;
      }
      // Hidden element: temp-reveal to resolve position without visual flash
      const origDisplay = el.style.display;
      const origVisibility = el.style.visibility;
      const origPosition = el.style.position;
      el.style.visibility = 'hidden';
      el.style.display = 'flex';
      el.style.position = 'relative';
      const r = el.getBoundingClientRect();
      const pos = r.top - cr.top + chat.scrollTop;
      el.style.display = origDisplay;
      el.style.visibility = origVisibility;
      el.style.position = origPosition;
      return pos;
    }

    async function action_jumpToTarget() {
      if (!SillyTavern?.callGenericPopup) {
        toastr.error('ST 弹窗 API 不可用');
        return;
      }
      const input = await ST.popup(
        '请输入目标楼层号 (支持负数，如 -5 代表倒数第5楼)：',
        SillyTavern?.POPUP_TYPE?.INPUT ?? 'input',
        '',
      );
      if (input === undefined || String(input).trim() === '') return;
      let t = parseInt(input, 10);
      if (isNaN(t)) {
        toastr.error('请输入有效的数字楼层号');
        return;
      }

      const maxId = safeGetLastMessageId();

      if (t < 0) {
        t = Math.max(0, maxId + t + 1);
      }

      if (t > maxId) {
        toastr.error(`楼层 ${t} 不存在（当前最大 ${maxId}）`);
        return;
      }

      try {
        SillyTavern.SlashCommandParser.commands['chat-jump'].callback({}, t);
      } catch (e) {
        console.error('[RadialMenu] jumpToTarget failed:', e);
        toastr.error('跳转失败。');
      }
    }

    function action_jumpToCurrentTop() {
      if (!targetedMessageCard) return;
      const parentDoc = window.parent.document;
      const chat = parentDoc.getElementById('chat');
      const targetPos = getScrollPositionOf(targetedMessageCard, chat);

      // If already within 12px of this message's top, advance to previous message.
      // This replaces the old isElementAtTop() check which incorrectly triggered
      // on the latest message (its nextAll().length===0 made isElementAtTop true
      // even when scrolled to the bottom of the chat).
      if (Math.abs(chat.scrollTop - targetPos) < 12) {
        const prev = $(targetedMessageCard).prev('.mes')[0];
        if (prev) {
          targetedMessageCard = prev;
          const prevPos = getScrollPositionOf(prev, chat);
          smoothScrollTo(chat, prevPos, 650);
        } else {
          // Already at the very first message — nudge to indicate boundary
          const $c = $(targetedMessageCard);
          $c.css({ transition: 'transform 0.1s', transform: 'translateY(5px)' });
          setTimeout(() => $c.css('transform', ''), 120);
        }
      } else {
        smoothScrollTo(chat, targetPos, 650);
      }
    }
    function action_jumpToCurrentBottom() {
      if (!targetedMessageCard) return;
      const parentDoc = window.parent.document;
      const chat = parentDoc.getElementById('chat');
      const el = targetedMessageCard;
      const rect = el.getBoundingClientRect();
      const cr = chat.getBoundingClientRect();
      // Bottom of the element relative to chat scroll origin
      const targetPos = rect.bottom - cr.top + chat.scrollTop - chat.clientHeight;

      // If already within 12px of this message's bottom, advance to next message.
      if (Math.abs(chat.scrollTop - targetPos) < 12) {
        const next = $(el).next('.mes')[0];
        if (next) {
          targetedMessageCard = next;
          const nr = next.getBoundingClientRect();
          const nextBottom = nr.bottom - cr.top + chat.scrollTop - chat.clientHeight;
          smoothScrollTo(chat, nextBottom, 650);
        } else {
          const $c = $(el);
          $c.css({ transition: 'transform 0.1s', transform: 'translateY(-5px)' });
          setTimeout(() => $c.css('transform', ''), 120);
        }
      } else {
        smoothScrollTo(chat, targetPos, 650);
      }
    }

    // ── 指纹 Source Map 算法 ─────────────────────────────────────────────────
    // 只保留字母/数字/汉字，剔除所有标点、空格、格式符号
    function getCleanFingerprint(text) {
      if (!text) return '';
      const matches = text.match(/[\p{L}\p{N}]/gu);
      return matches ? matches.join('') : '';
    }

    // 建立 原文 → 纯净指纹 的位置映射表
    function getFingerprintMap(rawText) {
      const map = [];
      let fingerprint = '';
      let i = 0;
      while (i < rawText.length) {
        if (rawText.startsWith('<!--', i)) {
          const end = rawText.indexOf('-->', i);
          i = end === -1 ? rawText.length : end + 3;
          continue;
        }
        if (rawText[i] === '<') {
          const end = rawText.indexOf('>', i);
          if (end !== -1) {
            i = end + 1;
            continue;
          }
        }
        const char = rawText[i];
        if (/^[\p{L}\p{N}]$/u.test(char)) {
          map.push(i);
          fingerprint += char;
        }
        i++;
      }
      return { fingerprint, map };
    }

    // ── 高级模糊/抗干扰指纹匹配算法 (LCS/Sliding Window) ───────────────────
    function fuzzyFindFingerprint(rawFinger, targetFinger, expectedIndex) {
      // 1. 精确匹配（最快路径）
      const exactMatches = [];
      let idx = rawFinger.indexOf(targetFinger);
      while (idx !== -1) {
        exactMatches.push(idx);
        idx = rawFinger.indexOf(targetFinger, idx + 1);
      }
      if (exactMatches.length > 0) {
        let best = exactMatches[0];
        let minDiff = Math.abs(best - expectedIndex);
        for (let i = 1; i < exactMatches.length; i++) {
          const diff = Math.abs(exactMatches[i] - expectedIndex);
          if (diff < minDiff) {
            minDiff = diff;
            best = exactMatches[i];
          }
        }
        return { start: best, end: best + targetFinger.length - 1, isExact: true };
      }

      // 2. 降维模糊追踪（抵抗插件塞字、吞字干扰）
      const T = targetFinger;
      // 取消 150 字符的区域限制，直接在全量数据中暴力滑窗。
      // 因为现代 JS 引擎即便对 10000 字符文本进行滑窗运算，耗时也仅需 10-30 毫秒。
      // 彻底破除区域限制后，能完美抵抗由巨量前置 DOM 节点（如大量被翻译的文本/隐形代码库）导致的极端坐标轴偏移。
      const searchSpace = rawFinger;

      let bestScore = -1;
      let bestStart = -1;
      let bestEnd = -1;

      // 在全量源码内滑动比对
      for (let i = 0; i <= searchSpace.length - (T.length * 0.4); i++) {
        let score = 0, tIdx = 0, sIdx = i, errors = 0;
        while (tIdx < T.length && sIdx < searchSpace.length && errors < 50) {
          if (searchSpace[sIdx] === T[tIdx]) {
            score++;
            sIdx++;
            tIdx++;
          } else {
            errors++;
            // 尝试向前试探重新同步 (最大试探深度3)
            let synced = false;
            for (let look = 1; look <= 3; look++) {
              if (tIdx + look < T.length && searchSpace[sIdx] === T[tIdx + look]) {
                tIdx += look; synced = true; break;
              }
              if (sIdx + look < searchSpace.length && searchSpace[sIdx + look] === T[tIdx]) {
                sIdx += look; synced = true; break;
              }
            }
            if (!synced) { sIdx++; tIdx++; } // 两败俱伤往前走
          }
        }
        const matchRatio = score / T.length;
        if (matchRatio > 0.65) { // 核心容错率：允许 35% 的外部干扰！
          // 若之前没有最佳得分，或者新得分碾压旧得分(大于10%)，或者得分相近但坐标更接近肉眼预估光标位置：
          if (bestScore === -1 || matchRatio > bestScore + 0.1 || (Math.abs(matchRatio - bestScore) <= 0.1 && Math.abs(i - expectedIndex) < Math.abs(bestStart - expectedIndex))) {
            bestScore = matchRatio;
            bestStart = i;
            // 后撤剔除结尾多匹配的冗余量
            bestEnd = sIdx - 1;
          }
        }
      }

      if (bestScore > 0.65) {
        log(`[模糊匹配] 命中！容错得分: ${(bestScore * 100).toFixed(1)}%`);
        return { start: bestStart, end: Math.min(rawFinger.length - 1, bestEnd), isExact: false };
      }
      return null;
    }

    // 通过选中文本 + 前置文本偏移量精准定位，并扩散到 \n\n 段落边界
    function findParagraphFromSelection(rawText, precedingText, selectedText) {
      const { fingerprint: rawFinger, map } = getFingerprintMap(rawText);
      const preFinger = getCleanFingerprint(precedingText);
      const targetFinger = getCleanFingerprint(selectedText);
      if (!targetFinger) return null;

      const expectedIndex = preFinger.length;
      
      const matchResult = fuzzyFindFingerprint(rawFinger, targetFinger, expectedIndex);
      if (!matchResult) return null;

      const matchEnd = matchResult.end;
      const rawStartIndex = map[matchResult.start];
      const rawEndIndex = map[matchEnd];

      // 向两侧扩散到 \n\n 段落边界
      const normalizedRaw = rawText.replace(/\r\n/g, '\n');
      let paraStart = normalizedRaw.lastIndexOf('\n\n', rawStartIndex);
      paraStart = paraStart === -1 ? 0 : paraStart + 2;
      let paraEnd = normalizedRaw.indexOf('\n\n', rawEndIndex);
      paraEnd = paraEnd === -1 ? rawText.length : paraEnd;

      return {
        paragraphText: rawText.substring(paraStart, paraEnd),
        startIndex: paraStart,
        endIndex: paraEnd,
        // 精确匹配范围（选中字在原文中的位置）
        matchRawStart: rawStartIndex,
        matchRawEnd: rawEndIndex,
      };
    }

    // 老式指纹（保留给 findAndReplace 向下兼容）
    function fingerprint(text) {
      if (!text) return '';
      return text
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/~~(.+?)~~/g, '$1')
        .replace(/`(.+?)`/g, '$1')
        .replace(/^#+\s+/gm, '')
        .replace(/[*_~`#-]/g, '')
        .replace(/\s+/g, '')
        .trim();
    }

    // ── 段落编辑弹窗（统一 UI，双端共用）──────────────────────────────────────
    async function showParagraphEditPopup(mesid, paragraphText, startIndex, endIndex, exactStartOffset, exactEndOffset) {
      log(`[编辑流程] showParagraphEditPopup mesid=${mesid}, range=[${startIndex}:${endIndex}], text="${paragraphText.substring(0, 40)}"`);
      const $editWrapper = $(`
            <div style="width:100%;">
                <div style="margin-bottom:8px;font-weight:600;">编辑段落 (楼层 ${mesid})</div>
                <textarea id="k-radial-edit-textarea" style="
                    width:100%; min-height:80px; max-height:60vh; resize:vertical;
                    padding:10px; border-radius:8px; font-size:14px; line-height:1.6;
                    border:1px solid rgba(128,128,128,0.3); background:rgba(0,0,0,0.05);
                    color:inherit; font-family:inherit; box-sizing:border-box;
                    overscroll-behavior:contain; -webkit-overflow-scrolling:touch;
                ">${$('<span/>').text(paragraphText).html()}</textarea>
            </div>
        `);

      setTimeout(() => {
        const ta = $editWrapper.find('#k-radial-edit-textarea')[0];
        if (ta) {
          ta.style.height = 'auto';
          ta.style.height = Math.min(ta.scrollHeight + 4, window.parent.innerHeight * 0.6) + 'px';
          ta.focus();

          if (exactStartOffset !== undefined && exactEndOffset !== undefined) {
            ta.setSelectionRange(exactStartOffset, exactEndOffset);
            
            // 比例估算法：使光标大致出现在视口顶部约 25% 的位置
            const ratio = exactStartOffset / Math.max(1, ta.value.length);
            const cursorY = ta.scrollHeight * ratio;
            const targetScrollTop = cursorY - (ta.clientHeight * 0.25);
            ta.scrollTop = Math.max(0, targetScrollTop);
          }
        }
      }, 100);

      let editedText;
      if (typeof SillyTavern !== 'undefined' && SillyTavern.Popup) {
        const popup = new SillyTavern.Popup($editWrapper, SillyTavern.POPUP_TYPE.CONFIRM, '', {
          okButton: '保存',
          cancelButton: '取消',
        });
        const result = await popup.show();
        if (!result) return;
        editedText = $editWrapper.find('#k-radial-edit-textarea').val();
      } else {
        const popupFunc =
          SillyTavern?.callGenericPopup || (typeof callGenericPopup === 'function' ? callGenericPopup : null);
        if (!popupFunc) {
          toastr.error('弹窗 API 不可用');
          return;
        }
        const result = await popupFunc($editWrapper, SillyTavern?.POPUP_TYPE?.CONFIRM ?? 3, '', {
          okButton: '保存',
          cancelButton: '取消',
        });
        if (!result) return;
        editedText = $editWrapper.find('#k-radial-edit-textarea').val();
      }
      if (editedText === undefined || editedText === null) return;
      if (editedText === paragraphText) return; // 无改动

      // 精确 splice 回写
      const rawMes = SillyTavern.chat[mesid]?.mes ?? '';
      const newMes = rawMes.slice(0, startIndex) + editedText + rawMes.slice(endIndex);

      const ok = await safeSetChatMessages([{ message_id: parseInt(mesid, 10), message: newMes }]);
      if (!ok) {
        toastr.error('保存失败');
        return;
      }
      toastr.success('段落已保存');
    }

    // ── 选区驱动的编辑入口（双端统一）─────────────────────────────────────────
    // activeIframeSelection: 保存 iframe 内选区的上下文（因为父文档拿不到 iframe 选区）
    let activeIframeSelection = null; // { iframe, mesid, selectedText }

    async function editFromSelection() {
      log('[编辑流程] editFromSelection 被调用, activeIframeSelection=' + !!activeIframeSelection);
      // 优先检查是否有 iframe 内选区
      if (activeIframeSelection) {
        const { iframe, mesid, selectedText } = activeIframeSelection;
        log(`[编辑流程] 走 iframe 路径, mesid=${mesid}, text="${selectedText.substring(0, 30)}"`);
        activeIframeSelection = null;
        await editFromIframeSelection(iframe, mesid, selectedText);
        return;
      }

      const parentWin = window.parent;
      const parentDoc = parentWin.document;
      const selection = parentWin.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

      const selectedText = selection.toString().trim();
      if (!selectedText) return;

      const range = selection.getRangeAt(0);
      const startNode = range.startContainer;
      const mesTextEl = (startNode.nodeType === Node.TEXT_NODE ? startNode.parentElement : startNode)?.closest?.(
        '.mes_text',
      );
      if (!mesTextEl) {
        toastr.warning('请在消息区域内选字');
        return;
      }

      const mesEl = mesTextEl.closest('[mesid]');
      const mesid = mesEl?.getAttribute('mesid');
      if (!mesid) {
        toastr.error('无法获取楼层 ID');
        return;
      }

      // 获取前置文本（从 mes_text 开头到选区起点）
      const preRange = range.cloneRange();
      preRange.selectNodeContents(mesTextEl);
      preRange.setEnd(range.startContainer, range.startOffset);
      const precedingText = preRange.toString();

      // 获取原始消息
      const ctx = typeof SillyTavern !== 'undefined' ? SillyTavern.getContext() : null;
      const rawMes = ctx?.chat?.[mesid]?.mes;
      if (!rawMes) {
        toastr.error('无法获取原始消息数据');
        return;
      }

      // 指纹反查
      const result = findParagraphFromSelection(rawMes, precedingText, selectedText);
      if (!result) {
        toastr.warning('无法在原文中定位该段落，尝试整楼编辑');
        handleSmartEdit();
        return;
      }

      // 清除选区
      selection.removeAllRanges();
      // 隐藏铅笔
      const btn = parentDoc.getElementById(PENCIL_BUTTON_ID);
      if (btn) btn.style.display = 'none';
      isEditingMode = false;

      // PC 端：使用指纹反查算出的原文字符串给 ST 内置编辑器定位
      if (!isMobileDevice()) {
        const exactRawMatch = rawMes.substring(result.matchRawStart, result.matchRawEnd + 1);
        const messageCard = parentDoc.querySelector(`.mes[mesid="${mesid}"]`);
        handleSmartEdit(messageCard, exactRawMatch);
        return;
      }

      const exactStartOffset = result.matchRawStart - result.startIndex;
      const exactEndOffset = result.matchRawEnd + 1 - result.startIndex;
      await showParagraphEditPopup(mesid, result.paragraphText, result.startIndex, result.endIndex, exactStartOffset, exactEndOffset);
    }

    // ── iframe 内选区编辑 ────────────────────────────────────────────────────
    async function editFromIframeSelection(iframe, mesid, selectedText) {
      log(`[编辑流程] editFromIframeSelection mesid=${mesid}, text="${selectedText.substring(0, 40)}"`);
      const parentDoc = window.parent.document;

      const ctx = typeof SillyTavern !== 'undefined' ? SillyTavern.getContext() : null;
      const rawMes = ctx?.chat?.[mesid]?.mes;
      if (!rawMes) {
        log('[编辑流程] ❌ rawMes 为空');
        toastr.error('无法获取原始消息数据');
        return;
      }

      // iframe 内的 precedingText 不可靠（DOM 结构和原文差异太大）
      // 用 iframe 在 mes_text 中的文本顺序位置做粗粒度偏移估算
      const mesTextEl = iframe.closest('.mes_text');
      let approxPrecedingText = '';
      if (mesTextEl) {
        // 获取 iframe 之前所有兄弟节点的文本
        let el = iframe;
        // 如果 iframe 包裹在 pre > code > ... 里，向上找到直接子节点
        while (el.parentElement && el.parentElement !== mesTextEl) {
          el = el.parentElement;
        }
        let sibling = mesTextEl.firstChild;
        while (sibling && sibling !== el) {
          approxPrecedingText += sibling.textContent || '';
          sibling = sibling.nextSibling;
        }
      }

      // 指纹反查（用近似 precedingText）
      log(`[编辑流程] iframe 指纹反查, precedingText长度=${approxPrecedingText.length}, selectedText="${selectedText.substring(0, 30)}"`);
      const result = findParagraphFromSelection(rawMes, approxPrecedingText, selectedText);
      if (!result) {
        log('[编辑流程] ❌ 指纹反查失败，fallback 整楼编辑');
        toastr.warning('无法在原文中定位该内容，尝试整楼编辑');
        handleSmartEdit(iframe.closest('.mes'));
        return;
      }
      log(`[编辑流程] ✅ 反查成功, paragraph[${result.startIndex}:${result.endIndex}]="${result.paragraphText.substring(0, 40)}"`);

      // 清理 iframe 内选区
      try {
        iframe.contentDocument?.getSelection()?.removeAllRanges();
      } catch (_) {}
      const btn = parentDoc.getElementById(PENCIL_BUTTON_ID);
      if (btn) btn.style.display = 'none';
      isEditingMode = false;

      // 如果是 PC 端，走原生内联编辑流程
      if (!isMobileDevice()) {
        log('[编辑流程] PC 端 iframe 选区，使用 handleSmartEdit');
        const messageCard = parentDoc.querySelector(`.mes[mesid="${mesid}"]`);
        const exactRawMatch = rawMes.substring(result.matchRawStart, result.matchRawEnd + 1);
        handleSmartEdit(messageCard, exactRawMatch);
        return;
      }

      const exactStartOffset = result.matchRawStart - result.startIndex;
      const exactEndOffset = result.matchRawEnd + 1 - result.startIndex;
      log('[编辑流程] 准备调用 showParagraphEditPopup...');
      await showParagraphEditPopup(mesid, result.paragraphText, result.startIndex, result.endIndex, exactStartOffset, exactEndOffset);
    }

    // ── 浮动铅笔按钮 UI 注入 ────────────────────────────────────────────────
    function initFloatingPencil() {
      const parentDoc = window.parent.document;
      const parentWin = window.parent;
      if (parentDoc.getElementById(PENCIL_BUTTON_ID)) return;

      const style = parentDoc.createElement('style');
      style.id = PENCIL_BUTTON_ID + '-style';
      style.innerHTML = `
            #${PENCIL_BUTTON_ID} {
                position: fixed;
                display: none;
                z-index: 99999;
                background-color: var(--SmartThemeBlurTintColor, rgba(50,50,50,0.85));
                color: var(--SmartThemeBodyColor, #fff);
                border: 1px solid var(--SmartThemeBorderColor, rgba(255,255,255,0.2));
                border-radius: 50%;
                width: 36px;
                height: 36px;
                box-sizing: border-box;
                font-size: 16px;
                cursor: pointer;
                box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                backdrop-filter: blur(5px);
                transition: opacity 0.2s, transform 0.15s;
                touch-action: manipulation;
                user-select: none;
                align-items: center;
                justify-content: center;
            }
            #${PENCIL_BUTTON_ID}:hover {
                transform: scale(1.1);
                filter: brightness(1.2);
            }
            #${PENCIL_BUTTON_ID}:active {
                transform: scale(0.95);
            }
        `;
      parentDoc.head.appendChild(style);

      const btn = parentDoc.createElement('div');
      btn.id = PENCIL_BUTTON_ID;
      btn.innerHTML = '<i class="fa-solid fa-pencil"></i>';
      parentDoc.body.appendChild(btn);

      // 用 mousedown/touchstart + preventDefault 防止点击时选区被清除
      const handlePencilClick = e => {
        e.preventDefault();
        e.stopPropagation();
        editFromSelection();
      };
      btn.addEventListener('mousedown', handlePencilClick);
      btn.addEventListener('touchstart', handlePencilClick, { passive: false });
    }

    // ── 选区监听：selectionchange + isCollapsed 检测 + 状态锁 ────────────────
    // ── 铅笔显示辅助：检测选区 + 定位铅笔 ─────────────────────────────────────
    function showPencilForSelection() {
      const parentDoc = window.parent.document;
      const parentWin = window.parent;
      const selection = parentWin.getSelection();
      const hasTextSelected =
        selection && selection.rangeCount > 0 && !selection.isCollapsed && selection.toString().trim().length > 0;

      const btn = parentDoc.getElementById(PENCIL_BUTTON_ID);

      if (hasTextSelected) {
        const range = selection.getRangeAt(0);
        const startNode = range.startContainer;
        const inMesText = (startNode.nodeType === Node.TEXT_NODE ? startNode.parentElement : startNode)?.closest?.(
          '.mes_text',
        );
        if (!inMesText) {
          // 选区不在 .mes_text 内 → 不显示铅笔，也不锁状态
          return false;
        }

        // 清除 iframe 选区上下文
        activeIframeSelection = null;

        // 首次进入编辑状态
        if (!isEditingMode) {
          isEditingMode = true;
          const eff = getEffectiveSettings();
          const shouldHideMenu = isMobileDevice() && eff.mobileTriggerMode === 'longPress' && !eff.toolbarMode;
          if (shouldHideMenu && menuVisible) {
            hideMenu();
          }
        }

        // 定位铅笔（position:fixed → 直接用 viewport 坐标）
        if (btn) {
          const rects = range.getClientRects();
          if (rects && rects.length > 0) {
            const lastRect = rects[rects.length - 1]; // 精确定位到选取的最后一行末尾
            btn.style.display = 'flex'; // 使用 flex 使图标居中
            
            // 应用动态大小
            const eff = getEffectiveSettings();
            const pSize = eff.pencilSize || 36;
            btn.style.width = `${pSize}px`;
            btn.style.height = `${pSize}px`;
            btn.style.fontSize = `${Math.floor(pSize * 0.45)}px`;

            btn.style.top = `${lastRect.bottom + 8}px`; // 指针/选区末尾的正下方
            
            // 按钮水平中点对齐选区的终点像素 (lastRect.right)
            let leftPos = lastRect.right - (pSize / 2);
            leftPos = Math.max(10, Math.min(leftPos, parentWin.innerWidth - pSize - 10));
            btn.style.left = `${leftPos}px`;
          }
        }
        return true;
      } else if (isEditingMode && !activeIframeSelection) {
        // 选区消失 → 退出编辑状态
        isEditingMode = false;
        if (btn) btn.style.display = 'none';
        if (toolbarEl && getEffectiveSettings().toolbarMode) {
          toolbarEl.style.removeProperty('display');
        }
        return false;
      }
      return false;
    }

    function initSelectionWatcher() {
      const parentDoc = window.parent.document;

      parentDoc.addEventListener('selectionchange', () => {
        clearTimeout(selectionDebounceTimer);
        selectionDebounceTimer = setTimeout(() => {
          showPencilForSelection();
        }, 200);
      });
    }

    // ── iOS Safari 和懒加载插件的终极后备：心跳轮询 Patcher ─────────────────────
    function initIframeAutoPatcher() {
      if (window.parent._k_radial_iframe_interval) {
        clearInterval(window.parent._k_radial_iframe_interval);
      }
      // 每 2.5 秒扫一次，无视加载时机、无视 MutationObserver 脱帧、永远保持最新绑定
      window.parent._k_radial_iframe_interval = setInterval(patchIframeSelections, 2500);
    }

    // ── iframe 选区穿透 (邪术) ───────────────────────────────────────────────
    // 不用 WeakSet 跟踪 iframe 元素，因为 srcdoc 重设后 contentDocument 会变
    // 改为在 body 上打标记，保证每个 document 在当前脚本生命周期内只 patch 一次
    // 加上 Date.now() 确保每次重新开关脚本/热重载时，都会覆盖掉旧脚本的事件绑定
    const IFRAME_PATCHED_MARK = '_k_radial_patched_' + Date.now();

    function patchIframeSelections() {
      const parentDoc = window.parent.document;
      const parentWin = window.parent;
      const iframes = parentDoc.querySelectorAll('.mes_text iframe');

      log(`[iframe穿透] 扫描到 ${iframes.length} 个 .mes_text iframe`);

      iframes.forEach((iframe, idx) => {
        const tryPatch = () => {
          let iframeDoc;
          try {
            iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          } catch (e) {
            log(`[iframe穿透] iframe[${idx}] 跨域，跳过: ${e.message}`);
            return;
          }
          if (!iframeDoc?.body) {
            log(`[iframe穿透] iframe[${idx}] body 不存在，跳过`);
            return;
          }
          // 已经 patch 过这个 document 的 body → 跳过
          if (iframeDoc.body[IFRAME_PATCHED_MARK]) {
            return;
          }
          iframeDoc.body[IFRAME_PATCHED_MARK] = true;

          const mesEl = iframe.closest('[mesid]');
          const mesid = mesEl?.getAttribute('mesid');
          log(`[iframe穿透] ✅ patch iframe[${idx}], mesid=${mesid}, body children=${iframeDoc.body.children.length}`);

          // 关键修复：srcdoc iframe 的 document 级 selectionchange 不触发！
          // 改用 body 级 mouseup/touchend + 延迟 getSelection() 检测
          const checkIframeSelection = (evtType) => {
            log(`[iframe穿透] iframe[${idx}] 收到 ${evtType}`);
            setTimeout(() => {
              // 重新获取 selection（以防 document 引用过期）
              let currentDoc;
              try {
                currentDoc = iframe.contentDocument;
              } catch (_) { return; }
              if (!currentDoc) return;

              const iframeSel = currentDoc.getSelection();
              const hasText =
                iframeSel &&
                iframeSel.rangeCount > 0 &&
                !iframeSel.isCollapsed &&
                iframeSel.toString().trim().length > 0;

              log(`[iframe穿透] iframe[${idx}] 选区检查: hasText=${hasText}${hasText ? ', text="' + iframeSel.toString().substring(0, 30) + '"' : ''}`);

              const btn = parentDoc.getElementById(PENCIL_BUTTON_ID);

              if (hasText) {
                const selectedText = iframeSel.toString().trim();

                if (!mesid) {
                  log(`[iframe穿透] iframe[${idx}] 无 mesid，跳过`);
                  return;
                }

                // 保存 iframe 选区上下文
                activeIframeSelection = { iframe, mesid, selectedText };

                // 进入编辑模式
                if (!isEditingMode) {
                  isEditingMode = true;
                  const eff = getEffectiveSettings();
                  const shouldHideMenu = isMobileDevice() && eff.mobileTriggerMode === 'longPress' && !eff.toolbarMode;
                  if (shouldHideMenu && menuVisible) {
                    hideMenu();
                  }
                }

                // 定位铅笔按钮：iframe 的选区 rect 需要换算到父文档坐标
                if (btn) {
                  const iframeRange = iframeSel.getRangeAt(0);
                  const selRects = iframeRange.getClientRects();
                  if (selRects && selRects.length > 0) {
                    const lastRect = selRects[selRects.length - 1]; // 精确定位到最后一行
                    const iframeRect = iframe.getBoundingClientRect();

                    // 应用动态大小
                    const eff = getEffectiveSettings();
                    const pSize = eff.pencilSize || 36;
                    btn.style.width = `${pSize}px`;
                    btn.style.height = `${pSize}px`;
                    btn.style.fontSize = `${Math.floor(pSize * 0.45)}px`;

                    const absTop = iframeRect.top + lastRect.bottom + 8;
                    let absLeft = iframeRect.left + lastRect.right - (pSize / 2);
                    absLeft = Math.max(10, Math.min(absLeft, parentWin.innerWidth - pSize - 10));

                    btn.style.display = 'flex'; // 使用 flex 居中
                    btn.style.top = `${absTop}px`;
                    btn.style.left = `${absLeft}px`;
                    log(`[iframe穿透] 铅笔显示于 top=${absTop}, left=${absLeft}`);
                  }
                }
              } else {
                activeIframeSelection = null;
                if (isEditingMode) {
                  isEditingMode = false;
                  if (btn) btn.style.display = 'none';
                  if (toolbarEl && getEffectiveSettings().toolbarMode) {
                    toolbarEl.style.removeProperty('display');
                  }
                }
              }
            }, 350);
          };

          // 兼容热重载：使用 on*** 直接覆盖旧版脚本的事件，避免内存和闭包泄漏
          // 打包伪事件（进行由于跨域或隔离导致的坐标修复）以直通父层的控制系统
          const wrapEvent = (e) => {
              const iframeRect = iframe.getBoundingClientRect();
              const card = iframe.closest('.mes');
              let cx = e.clientX, cy = e.clientY;
              let touches = [], changedTouches = [];
              if (e.touches && e.touches.length > 0) {
                  cx = e.touches[0].clientX;
                  cy = e.touches[0].clientY;
                  touches = [{ clientX: cx + iframeRect.left, clientY: cy + iframeRect.top }];
              }
              if (e.changedTouches && e.changedTouches.length > 0) {
                  changedTouches = [{ clientX: e.changedTouches[0].clientX + iframeRect.left, clientY: e.changedTouches[0].clientY + iframeRect.top }];
              }
              return {
                  preventDefault: () => e.preventDefault?.(),
                  stopPropagation: () => e.stopPropagation?.(),
                  button: e.button,
                  currentTarget: card,
                  clientX: cx !== undefined ? cx + iframeRect.left : undefined,
                  clientY: cy !== undefined ? cy + iframeRect.top : undefined,
                  originalEvent: { touches, changedTouches }
              };
          };

          iframeDoc.body.onmousedown = (e) => {
              if (e.button === 2) { // 鼠标右键唤出
                  e.preventDefault();
                  lastTriggerWasTouch = false;
                  const fe = wrapEvent(e);
                  showMenu(fe.clientX, fe.clientY, fe.currentTarget);
              }
          };
          iframeDoc.body.oncontextmenu = (e) => e.preventDefault();
          iframeDoc.body.ondblclick = (e) => handleDoubleClick(wrapEvent(e));
          iframeDoc.body.ontouchstart = (e) => handleTouchStart(wrapEvent(e));
          iframeDoc.body.ontouchmove = (e) => handleTouchMove(wrapEvent(e));

          iframeDoc.body.onmouseup = (e) => {
            handleMouseUp(wrapEvent(e));
            checkIframeSelection('mouseup');
          };
          iframeDoc.body.ontouchend = (e) => {
            handleTouchEnd(wrapEvent(e));
            checkIframeSelection('touchend');
          };
        };

        // iframe 可能还没 load —— 两种策略都试
        if (iframe.contentDocument?.readyState === 'complete' && iframe.contentDocument?.body) {
          tryPatch();
        } else {
          iframe.addEventListener('load', () => {
            log(`[iframe穿透] iframe[${idx}] load 事件触发`);
            tryPatch();
          }, { once: true });
          // 也加一个延迟兜底（有些 iframe load 不触发）
          setTimeout(tryPatch, 1000);
        }
      });
    }

    // ── 移动端 touchend 选区检测后备方案 ──────────────────────────────────────
    // 某些移动端浏览器可能不对跨 frame 的 selectionchange 事件触发。
    // touchend 后延迟检查是否有选区产生，作为 selectionchange 的补充。
    function initTouchSelectionFallback() {
      const parentDoc = window.parent.document;
      parentDoc.addEventListener(
        'touchend',
        () => {
          setTimeout(() => showPencilForSelection(), 350);
        },
        { passive: true },
      );
    }

    // ── 老式 findAndReplace（保留给 F8 兼容）──────────────────────────────────
    function findAndReplace(rawMes, originalText, replacement) {
      const trimmed = originalText.trim();
      if (!trimmed) return null;
      let idx = rawMes.indexOf(originalText);
      if (idx !== -1) return rawMes.slice(0, idx) + replacement + rawMes.slice(idx + originalText.length);
      idx = rawMes.indexOf(trimmed);
      if (idx !== -1) return rawMes.slice(0, idx) + replacement + rawMes.slice(idx + trimmed.length);

      const fp = fingerprint(trimmed);
      if (!fp) return null;
      const paragraphs = rawMes.split(/\n\n+/);
      for (let i = 0; i < paragraphs.length; i++) {
        const pFp = fingerprint(paragraphs[i]);
        if (pFp && (pFp === fp || pFp.includes(fp) || fp.includes(pFp))) {
          paragraphs[i] = replacement;
          return paragraphs.join('\n\n');
        }
      }
      return null;
    }

    // ── PC smart-edit (kept for PC double-click) ────────────────────────────────
    function handleSmartEdit(forceCard, forceText) {
      if (isSmartEditing) return;
      isSmartEditing = true;
      try {
        const stEd = $(window.parent.document).find(EDIT_CONFIG.SELECTORS.ST_EDITOR_TEXTAREA);
        if (stEd.length > 0) {
          const mc = stEd.closest(EDIT_CONFIG.SELECTORS.MESSAGE);
          if (mc.length) saveAndCloseEditor(mc);
        } else {
          startEditing(forceCard, forceText);
        }
      } finally {
        setTimeout(() => {
          isSmartEditing = false;
        }, EDIT_CONFIG.RE_ENTRY_GUARD_DELAY);
      }
    }
    function startEditing(forceCard, forceText) {
      const { target, selectedText } = forceCard 
        ? { target: $(forceCard), selectedText: forceText || '' } 
        : determineEditTarget();
      if (!target || target.length === 0) return;
      const sc = findScrollContainer();
      if (sc) previousScrollPosition = sc.scrollTop();
      target.attr(EDIT_CONFIG.ATTRIBUTES.TEMP_TARGET, 'true');
      if (!clickFirstVisible(target, EDIT_CONFIG.SELECTORS.EDIT_BUTTONS)) {
        target.removeAttr(EDIT_CONFIG.ATTRIBUTES.TEMP_TARGET);
        previousScrollPosition = null;
      } else {
        waitForEditorAndHighlight(`[${EDIT_CONFIG.ATTRIBUTES.TEMP_TARGET}="true"]`, selectedText);
      }
    }
    function saveAndCloseEditor(messageCard) {
      const done = messageCard.find(EDIT_CONFIG.SELECTORS.DONE_BUTTON);
      if (done.length > 0) {
        setTimeout(() => {
          done.trigger('click');
          if (previousScrollPosition === null) return;
          const saved = previousScrollPosition;
          previousScrollPosition = null;
          const sc = findScrollContainer();
          if (!sc) return;
          const obs = new MutationObserver((m, o) => {
            if (!isEditorOpenOnCard(messageCard)) {
              sc.stop(true).animate({ scrollTop: saved }, 200);
              o.disconnect();
              clearTimeout(tid);
            }
          });
          const tid = setTimeout(() => {
            obs.disconnect();
            if (!isEditorOpenOnCard(messageCard)) sc.stop(true).animate({ scrollTop: saved }, 200);
          }, EDIT_CONFIG.OBSERVER_TIMEOUT);
          obs.observe(messageCard[0], { childList: true, subtree: true });
        }, 50);
      } else {
        previousScrollPosition = null;
      }
    }
    function determineEditTarget() {
      const sel = window.parent.getSelection();
      if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
        const r = sel.getRangeAt(0);
        const c = r.commonAncestorContainer;
        const pe = c.nodeType === Node.TEXT_NODE ? c.parentElement : c;
        if (pe) {
          const t = $(pe).closest(EDIT_CONFIG.SELECTORS.MESSAGE);
          if (t.length) return { target: t, selectedText: sel.toString() };
        }
      }
      return {
        target: targetedMessageCard
          ? $(targetedMessageCard)
          : mostVisibleMessageCard
            ? $(mostVisibleMessageCard)
            : null,
        selectedText: '',
      };
    }
    function waitForEditorAndHighlight(sel, txt) {
      const te = $(window.parent.document).find(sel);
      if (!te.length) return;
      const cleanup = o => {
        o?.disconnect();
        clearTimeout(tid);
        te.removeAttr(EDIT_CONFIG.ATTRIBUTES.TEMP_TARGET);
      };

      const onReady = ed => {
        // 1. Scroll the parent (#chat) so the message card's editor area is
        //    visible — use a small top offset so the user sees the card header.
        scrollToElement(ed, EDIT_CONFIG.SCROLL_INTO_VIEW_OFFSET);

        // --- NEW: Universal Scroll Restoration on Editor Close ---
        if (previousScrollPosition !== null) {
          const sc = findScrollContainer();
          if (sc) {
            const saved = previousScrollPosition;
            previousScrollPosition = null; // consume
            const mc = $(ed).closest('.mes');
            if (mc.length) {
              const obs = new MutationObserver((m, o) => {
                if (!isEditorOpenOnCard(mc)) {
                  sc.stop(true).animate({ scrollTop: saved }, 200);
                  o.disconnect();
                }
              });
              obs.observe(mc[0], { childList: true, subtree: true });
            }
          }
        }
        // ---------------------------------------------------------

        // 2. After parent scroll settles, highlight text in the textarea
        requestAnimationFrame(() => {
          if (txt.trim()) {
            highlightText(ed, txt);
          } else {
            ed.focus();
            ed.scrollTop = 0;
          }
        });
      };

      const obs = new MutationObserver((m, o) => {
        const ed = te.find(EDIT_CONFIG.SELECTORS.EDITOR).first();
        if (ed.length) {
          cleanup(o);
          onReady(ed[0]);
        }
      });
      const tid = setTimeout(() => {
        const ed = te.find(EDIT_CONFIG.SELECTORS.EDITOR).first();
        if (ed.length) onReady(ed[0]);
        cleanup(obs);
      }, EDIT_CONFIG.EDITOR_APPEAR_TIMEOUT);
      obs.observe(te[0], { childList: true, subtree: true });

      const init = te.find(EDIT_CONFIG.SELECTORS.EDITOR).first();
      if (init.length) {
        cleanup(obs);
        onReady(init[0]);
      }
    }

    function highlightText(editor, text) {
      if (!text) {
        editor.focus();
        if (editor.tagName === 'TEXTAREA') editor.setSelectionRange(0, 0);
        return;
      }

      const tc = editor.tagName === 'TEXTAREA' ? editor.value : editor.textContent || '';
      
      let si = -1;
      let ei = -1;

      // 1. 精确查找（最高优先级）
      let idx = tc.indexOf(text);
      if (idx !== -1) {
        si = idx;
        ei = idx + text.length;
      } else {
        // 2. 软换行符降级查找 (textarea.value 会将 \r\n 归一化为 \n)
        const normText = text.replace(/\r\n/g, '\n');
        const normTc = tc.replace(/\r\n/g, '\n');
        idx = normTc.indexOf(normText);
        if (idx !== -1) {
          // 如果仅换行符不同，起始位置在 \n 转换下会发生极微小偏移，在绝大多数短文本中可直接用 idx
          si = idx;
          ei = idx + normText.length;
        }
      }

      // 3. 最后降级：忽略所有首尾空格与格式符号的模糊搜寻 (应对极少量的 DOM 扭曲)
      if (si === -1) {
        const stripped = text.trim().replace(/[*_~`]/g, '');
        if (stripped) {
          const pattern = stripped.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
          const m = tc.match(new RegExp(pattern, 'i'));
          if (m && m.index !== undefined) {
            si = m.index;
            ei = si + m[0].length;
          }
        }
      }

      if (si !== -1 && ei !== -1) {
        if (editor.tagName === 'TEXTAREA') {
          editor.focus();
          editor.setSelectionRange(si, ei);
          scrollToTextareaMatch(editor);
        } else {
          const range = window.parent.document.createRange();
          const [sn, so] = findTextNodeAndOffset(editor, si);
          const [en, eo] = findTextNodeAndOffset(editor, ei);
          if (sn && en) {
            range.setStart(sn, so);
            range.setEnd(en, eo);
            const sel = window.parent.getSelection();
            if (sel) {
              sel.removeAllRanges();
              sel.addRange(range);
            }
            editor.focus();
            scrollToContentEditableMatch(editor, range);
          }
        }
      } else {
        editor.focus();
      }
    }

    function applyTheme(containerEl) {
      if (!containerEl) return;
      const parentDoc = window.parent.document;
      const root = parentDoc.documentElement;
      const rs = getComputedStyle(root);

      // ── Read ST's own button background ──────────────────────────────────
      // Priority: a native ST button element → SmartTheme bg var → safe fallback
      let bg = '',
        text = '',
        border = '',
        ok = '';

      // Try to read from an actual ST interactive button
      const nativeBtn = parentDoc.querySelector('#send_but, .menu_button, .interactable, #option_toggle_magnets');
      if (nativeBtn) {
        const ns = getComputedStyle(nativeBtn);
        bg = ns.backgroundColor;
        text = ns.color;
        border = ns.borderColor;
      }

      // Fill any gaps from ST CSS variables
      function stVar(name) {
        return rs.getPropertyValue(name).trim();
      }
      if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') {
        const raw = stVar('--SmartThemeBlurTintColor') || stVar('--black-blur');
        bg = raw || null;
      }
      if (!text || text === 'rgba(0, 0, 0, 0)') {
        const raw = stVar('--SmartThemeFontColor') || stVar('--SmartThemeBodyColor');
        if (raw) text = raw.includes(',') && !raw.includes('(') ? `rgb(${raw})` : raw;
      }
      if (!border || border === 'rgba(0, 0, 0, 0)') {
        const raw = stVar('--SmartThemeBorderColor');
        if (raw) border = raw.includes(',') && !raw.includes('(') ? `rgb(${raw})` : raw;
      }

      // Accent colour — ST quote/primary colour is the most reliable theme accent
      ok = stVar('--SmartThemeQuoteColor') || stVar('--primary') || '';

      // ── Detect light vs dark from the text colour luminance ──────────────
      // Text is dark on light themes, light on dark themes.
      // Parsing text colour is more reliable than parsing background.
      let isLight = false;
      if (text) {
        const m = text.match(/\d+/g);
        if (m && m.length >= 3) {
          const [r, g, b] = m.map(Number);
          // Relative luminance — if text is dark the background must be light
          const lum = 0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255);
          isLight = lum < 0.4; // dark text = light theme
        }
      }

      // ── Compute final tokens ─────────────────────────────────────────────
      if (isLight) {
        // Light theme: desaturate and slightly darken the native button bg
        // so icons stand out without inverting to a heavy dark surface.
        // Strategy: parse the bg colour, reduce saturation by mixing toward grey.
        let finalBg = bg;
        if (bg) {
          const m = bg.match(/[\d.]+/g);
          if (m && m.length >= 3) {
            let [r, g, b, a] = m.map(Number);
            if (isNaN(a)) a = 1;
            // Desaturate: mix 40% toward mid-grey
            const grey = 0.299 * r + 0.587 * g + 0.114 * b;
            const mix = 0.4;
            r = Math.round(r * (1 - mix) + grey * mix);
            g = Math.round(g * (1 - mix) + grey * mix);
            b = Math.round(b * (1 - mix) + grey * mix);
            // Slightly darken: multiply by 0.88 to ensure contrast with light page
            r = Math.round(r * 0.88);
            g = Math.round(g * 0.88);
            b = Math.round(b * 0.88);
            finalBg = `rgba(${r},${g},${b},${Math.min(a, 0.95)})`;
          }
        }
        containerEl.style.setProperty('--rb-bg', finalBg || 'rgba(200,200,205,0.92)');
        containerEl.style.setProperty('--rb-text', text || '#1a1a1e');
        containerEl.style.setProperty('--rb-border', border || 'rgba(0,0,0,0.18)');
        containerEl.style.setProperty('--rb-shadow', 'rgba(0,0,0,0.20)');
      } else {
        // Dark theme: use native values directly, trust ST's own palette
        containerEl.style.setProperty('--rb-bg', bg || 'rgba(28,28,32,0.92)');
        containerEl.style.setProperty('--rb-text', text || 'rgba(220,220,220,0.95)');
        containerEl.style.setProperty('--rb-border', border || 'rgba(255,255,255,0.14)');
        containerEl.style.setProperty('--rb-shadow', 'rgba(0,0,0,0.50)');
      }

      // Accent: ensure enough contrast against the button bg on either theme
      // Use ST's provided quote color directly
      containerEl.style.setProperty('--rb-ok', 'var(--SmartThemeQuoteColor, #4caf8a)');
    }

    // ── Menu show / hide / selection ─────────────────────────────────────────
    function showMenu(cX, cY, card) {
      targetedMessageCard = card;
      const $container = $(`#${MENU_CONTAINER_ID}`, window.parent.document);
      applyTheme($container[0]); // sample native button colours on each open

      // Check bookmark status
      let isBookmarked = false;
      const mesid = $(card).attr('mesid');
      if (mesid !== undefined && mesid !== null) {
        try {
          const ctx = typeof SillyTavern !== 'undefined' ? SillyTavern.getContext() : null;
          const stMsg = ctx?.chat?.[mesid];
          if (stMsg && Array.isArray(stMsg.swipes)) {
            const currentSwipeIdx = Number.isInteger(stMsg.swipe_id) ? stMsg.swipe_id : 0;
            const bookmarks = loadSwipeBookmarks();
            if (bookmarks[mesid] && bookmarks[mesid].includes(currentSwipeIdx)) {
              isBookmarked = true;
            }
          }
        } catch (e) {}
      }

      const activeButtons = getActiveButtonsConfig();
      const dynamicRadius = getEffectiveSettings().menuRadius || 75;
      $container
        .show()
        .children('.' + BUTTON_CLASS)
        .each(function () {
          const btnId = $(this).data('id');
          const c = activeButtons.find(c => c.id === btnId);
          if (!c) return;
          const a = (c.angle * Math.PI) / 180;
          $(this).css({
            left: `${cX + dynamicRadius * Math.cos(a)}px`,
            top: `${cY - dynamicRadius * Math.sin(a)}px`,
            display: 'flex',
          });

          if (btnId === 'bookmarkSwipe') {
            if (isBookmarked) $(this).css('color', '#ffeb3b');
            else $(this).css('color', '');
          }
        });
      // Cache each button's centre coords — they won't move until hideMenu
      buttonCache = [];
      $container[0].querySelectorAll('.' + BUTTON_CLASS).forEach(el => {
        const r = el.getBoundingClientRect();
        buttonCache.push({ el, cx: r.left + r.width / 2, cy: r.top + r.height / 2 });
      });
      menuVisible = true;
    }
    function hideMenu() {
      if (!menuVisible) return;
      if (selRafId) {
        cancelAnimationFrame(selRafId);
        selRafId = null;
      }
      buttonCache = [];
      cachedChatRect = null;
      $(`#${MENU_CONTAINER_ID}`, window.parent.document)
        .hide()
        .children('.' + BUTTON_CLASS)
        .removeClass(SELECTED_CLASS);
      menuVisible = false;
      selectedButton = null;
      targetedMessageCard = null;
    }
    function updateSelection(cx, cy) {
      if (!menuVisible || buttonCache.length === 0) return;
      let best = null,
        mD = Infinity;
      for (const b of buttonCache) {
        const d = Math.hypot(cx - b.cx, cy - b.cy);
        if (d < mD) {
          mD = d;
          best = b.el;
        }
      }
      if (mD < 35) {
        if (best !== selectedButton) {
          if (selectedButton) selectedButton.classList.remove(SELECTED_CLASS);
          selectedButton = best;
          selectedButton.classList.add(SELECTED_CLASS);
        }
      } else if (selectedButton) {
        selectedButton.classList.remove(SELECTED_CLASS);
        selectedButton = null;
      }
    }
    // Returns true if menu should be hidden after this action
    function executeSelected() {
      if (!selectedButton) return true;
      const id = $(selectedButton).data('id');
      let shouldHide = true;
      switch (id) {
        case 'deleteMessage':
          action_deleteMessage();
          break;
        case 'jumpToLatest':
          action_jumpToLatest();
          break;
        case 'jumpToTarget':
          action_jumpToTarget();
          break;
        case 'jumpToCurrentTop':
          action_jumpToCurrentTop();
          shouldHide = false;
          break;
        case 'jumpToCurrentBottom':
          action_jumpToCurrentBottom();
          shouldHide = false;
          break;
        case 'toggleFullscreen':
          action_toggleFullscreen();
          break;
        case 'bookmarkSwipe':
          action_bookmarkSwipe();
          break;
        case 'previewSwipes':
          action_previewSwipes();
          break;
        case 'generateLastSwipe':
          action_generateLastSwipe();
          break;
      }
      if (shouldHide) hideMenu();
      return shouldHide;
    }

    // ── 新增动作：生成最新一条的新回复 (重roll) ─────────────────────────────────
    function action_generateLastSwipe() {
      const parentDoc = window.parent.document;
      const lastId = ST.lastMesId();
      if (lastId === undefined || lastId < 0) return;

      try {
        const ctx = typeof SillyTavern !== 'undefined' ? SillyTavern.getContext() : null;
        const stMsg = ctx?.chat?.[lastId];

        // 1. Force the UI to go to the last swipe of the last message if it exists
        if (stMsg && Array.isArray(stMsg.swipes) && stMsg.swipes.length > 0) {
          const targetSwipeId = stMsg.swipes.length - 1;
          if (stMsg.swipe_id !== targetSwipeId) {
            stMsg.swipe_id = targetSwipeId;
            stMsg.mes = stMsg.swipes[targetSwipeId];
            if (typeof ctx.updateMessageBlock === 'function') {
              ctx.updateMessageBlock(lastId, stMsg);
            }
          }
        }

        // 2. Jump to the bottom visually
        robustAutoJump(false, true);

        // 3. Click swipe_right NOW that we are at the last swipe!
        setTimeout(() => {
          const lastEl = parentDoc.querySelector(`div.mes[mesid="${lastId}"]`);
          if (lastEl) {
            const rightBtn = lastEl.querySelector('.swipe_right');
            if (rightBtn) {
              rightBtn.click();
              toastr.success('已触发重新生成');
            } else {
              // fallback if button not found
              if (typeof triggerSlash === 'function') triggerSlash('/swipe');
            }
          }
        }, 50);
      } catch (e) {
        console.error('[RadialMenu] generateLastSwipe failed:', e);
        toastr.error('生成动作触发失败');
      }
    }

    // ── 新增动作：浏览器全屏 ──────────────────────────────────────────────────
    function action_toggleFullscreen() {
      const doc = window.parent.document;
      if (!doc.fullscreenElement) {
        doc.documentElement.requestFullscreen().catch(() => {
          toastr.error('无法进入全屏模式');
        });
      } else {
        doc.exitFullscreen();
      }
    }

    // ── 新增动作：收藏/取消收藏当前 Swipe ─────────────────────────────────────
    function action_bookmarkSwipe() {
      if (!targetedMessageCard) return;
      const mesid = $(targetedMessageCard).attr('mesid');
      if (mesid === undefined) {
        toastr.error('无法获取楼层 ID');
        return;
      }
      try {
        const ctx = typeof SillyTavern !== 'undefined' ? SillyTavern.getContext() : null;
        const stMsg = ctx?.chat?.[mesid];
        if (!stMsg || !Array.isArray(stMsg.swipes) || stMsg.swipes.length <= 1) {
          toastr.warning('当前消息没有多个 swipe');
          return;
        }
        const currentSwipeIdx = Number.isInteger(stMsg.swipe_id) ? stMsg.swipe_id : 0;
        const bookmarks = loadSwipeBookmarks();
        const mesBookmarks = bookmarks[mesid] || [];

        if (mesBookmarks.some(x => Number(x) === Number(currentSwipeIdx))) {
          bookmarks[mesid] = mesBookmarks.filter(i => Number(i) !== Number(currentSwipeIdx));
          if (bookmarks[mesid].length === 0) delete bookmarks[mesid];
          toastr.info(`已取消收藏 swipe #${currentSwipeIdx + 1}`);
        } else {
          mesBookmarks.push(currentSwipeIdx);
          bookmarks[mesid] = mesBookmarks;
          toastr.success(`已收藏 swipe #${currentSwipeIdx + 1}`);
        }
        saveSwipeBookmarks(bookmarks);
      } catch (e) {
        console.error('[RadialMenu] bookmarkSwipe failed:', e);
        toastr.error('收藏操作失败');
      }
    }

    // ── 新增动作：打开分支预览器 ──────────────────────────────────────────────
    function action_previewSwipes() {
      if (!targetedMessageCard) return;
      const mesid = $(targetedMessageCard).attr('mesid');
      // 分支预览器脚本会在 window.parent 上暴露 action_openSwipePreviewer
      const fn = window.parent?.action_openSwipePreviewer || window.action_openSwipePreviewer;
      if (typeof fn === 'function') {
        fn(mesid, targetedMessageCard);
      } else {
        toastr.error('分支预览器未加载，请确保启用了"分支预览器"脚本');
      }
    }

    // ── 设置弹窗 ─────────────────────────────────────────────────────────────
    function injectSettingsStyles() {
      const parentDoc = window.parent.document;
      if (parentDoc.getElementById(SETTINGS_STYLE_ID)) return;
      parentDoc.head.insertAdjacentHTML(
        'beforeend',
        `<style id="${SETTINGS_STYLE_ID}">
    .k-radial-settings-overlay {
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: var(--black50a, rgba(0,0,0,0.6)); display: flex; justify-content: center;
        align-items: center; z-index: 100001; backdrop-filter: blur(3px);
        font-family: var(--main-font, sans-serif);
    }
    .k-radial-settings-container {
        background: var(--SmartThemeBlurTintColor, #222); color: var(--SmartThemeBodyColor, var(--text-color, #eee));
        width: 760px; max-width: 95vw; max-height: 85vh; border-radius: 14px;
        display: flex; flex-direction: row; overflow: hidden;
        border: 1px solid var(--SmartThemeBorderColor, rgba(255,255,255,0.12));
        box-shadow: 0 12px 40px rgba(0,0,0,0.5); backdrop-filter: blur(var(--SmartThemeBlurStrength, 10px));
    }
    @media (max-width: 768px) {
        .k-radial-settings-container { flex-direction: column; width: 420px; }
        .k-radial-preview-area { min-height: 280px; border-left: none; border-bottom: 1px solid var(--SmartThemeBorderColor, rgba(255,255,255,0.1)); }
        .k-radial-settings-left { max-height: 50vh; }
    }
    .k-radial-settings-left {
        display: flex; flex-direction: column; flex: 1; overflow: hidden;
    }
    .k-radial-preview-area {
        flex: 1; min-width: 320px; background: var(--black30a, rgba(0,0,0,0.15)); display: flex; align-items: center; justify-content: center;
        position: relative; overflow: hidden; border-left: 1px solid var(--SmartThemeBorderColor, rgba(255,255,255,0.1));
    }
    .k-radial-settings-slider-row {
        display: flex; align-items: center; gap: 12px; margin-bottom: 16px;
    }
    .k-radial-settings-slider-row input[type="range"] { flex: 1; }
    .k-radial-settings-slider-val { width: 30px; text-align: right; font-size: 0.9em; opacity: 0.8; }
    .k-radial-settings-header {
        padding: 14px 18px; font-weight: 700; font-size: 1.1em;
        border-bottom: 1px solid var(--SmartThemeBorderColor, rgba(255,255,255,0.1));
        display: flex; justify-content: space-between; align-items: center;
    }
    .k-radial-settings-body {
        padding: 14px 18px; overflow-y: auto; flex: 1;
    }
    .k-radial-settings-section { margin-bottom: 16px; }
    .k-radial-settings-section-title {
        font-size: 0.8em; opacity: 0.6; text-transform: uppercase;
        letter-spacing: 0.5px; margin-bottom: 8px;
    }
    .k-radial-btn-list { display: flex; flex-direction: column; gap: 4px; }
    .k-radial-btn-item {
        display: flex; align-items: center; gap: 8px; padding: 8px 10px;
        border-radius: 8px; background: var(--black30a, rgba(255,255,255,0.05));
        border: 1px solid var(--SmartThemeBorderColor, rgba(255,255,255,0.08)); transition: background 0.15s;
    }
    .k-radial-btn-item:hover { background: var(--white10a, rgba(255,255,255,0.1)); }
    .k-radial-btn-item i.fa-solid { width: 20px; text-align: center; opacity: 0.8; }
    .k-radial-btn-item-label { flex: 1; font-size: 0.92em; }
    .k-radial-btn-item-actions { display: flex; gap: 4px; }
    .k-radial-btn-item-actions button {
        width: 26px; height: 26px; border: 1px solid var(--SmartThemeBorderColor, rgba(255,255,255,0.15));
        border-radius: 6px; background: var(--black30a, rgba(255,255,255,0.06)); color: inherit;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        font-size: 11px; transition: all 0.12s;
    }
    .k-radial-btn-item-actions button:hover {
        background: var(--white10a, rgba(255,255,255,0.15)); border-color: var(--SmartThemeBorderColor, rgba(255,255,255,0.3));
    }
    .k-radial-btn-item-actions button.k-radial-add-btn { color: var(--SmartThemeQuoteColor, #4caf8a); }
    .k-radial-btn-item-actions button.k-radial-remove-btn { color: #f87171; }
    .k-radial-settings-footer {
        padding: 12px 18px; border-top: 1px solid var(--SmartThemeBorderColor, rgba(255,255,255,0.1));
        display: flex; justify-content: flex-end; gap: 8px;
    }
    .k-radial-settings-footer button {
        padding: 6px 16px; border-radius: 8px; border: 1px solid var(--SmartThemeBorderColor, rgba(255,255,255,0.15));
        background: var(--black30a, rgba(255,255,255,0.06)); color: inherit; cursor: pointer;
        font-size: 0.9em; transition: all 0.12s;
    }
    .k-radial-settings-footer button:hover {
        background: var(--white10a, rgba(255,255,255,0.15));
    }
    .k-radial-settings-footer button.k-radial-primary {
        background: var(--SmartThemeQuoteColor, rgba(76,175,138,0.2)); color: var(--SmartThemeBodyColor, var(--text-color, #fff));
    }
    .k-radial-settings-footer button.k-radial-primary:hover {
        filter: brightness(1.2);
    }
    .k-radial-settings-tabs {
        display: flex; background: var(--black30a, rgba(0,0,0,0.2));
        border-bottom: 1px solid var(--SmartThemeBorderColor, rgba(255,255,255,0.1));
    }
    .k-radial-settings-tab {
        flex: 1; padding: 12px; text-align: center; cursor: pointer;
        font-size: 0.95em; opacity: 0.6; transition: all 0.2s;
        border-bottom: 2px solid transparent;
    }
    .k-radial-settings-tab.active {
        opacity: 1; border-bottom: 2px solid var(--SmartThemeQuoteColor, #4caf8a);
        background: var(--white10a, rgba(255,255,255,0.05)); color: var(--SmartThemeBodyColor, var(--SmartThemeQuoteColor, #4caf8a));
    }
    .k-radial-sortable-ghost {
        opacity: 0.4; background: rgba(255,255,255,0.1) !important;
    }
    .k-radial-preview-indicator {
        position: absolute; width: 18px; height: 18px;
        background: var(--rb-bg, rgba(28,28,32,0.92));
        border: 1px solid var(--rb-border, rgba(255,255,255,0.14));
        border-radius: 50%; color: var(--rb-text, #fff);
        font-size: 10px; display: flex; align-items: center; justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.4);
        pointer-events: none; z-index: 10;
    }
    .k-radial-drag-handle {
        cursor: grab; padding: 0 8px; opacity: 0.5; transition: opacity .2s;
    }
    .k-radial-drag-handle:hover { opacity: 1; }
    .k-radial-drag-handle:active { cursor: grabbing; }
    </style>`,
      );
    }

    function loadSortableJS(parentDoc) {
      return new Promise(resolve => {
        if (parentDoc.defaultView.Sortable) return resolve(parentDoc.defaultView.Sortable);
        const script = parentDoc.createElement('script');
        script.src = 'https://fastly.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js';
        script.onload = () => resolve(parentDoc.defaultView.Sortable);
        script.onerror = () => {
          toastr?.error?.('无法加载 SortableJS 库');
          resolve(null);
        };
        parentDoc.head.appendChild(script);
      });
    }

    async function showSettingsPopup() {
      injectSettingsStyles();
      const parentDoc = window.parent.document;
      // Wait for SortableJS to load if needed
      const Sortable = await loadSortableJS(parentDoc);
      // 移除旧弹窗
      parentDoc.getElementById('k-radial-settings-overlay')?.remove();

      if (!currentSettings) currentSettings = loadSettings();

      // Deep copy of profiles for editing
      let tempProfiles = {
        pc: JSON.parse(JSON.stringify(currentSettings.profiles?.pc || DEFAULT_PROFILE_PC)),
        mobile: JSON.parse(JSON.stringify(currentSettings.profiles?.mobile || DEFAULT_PROFILE_MOBILE)),
      };
      let tempModeOverride = currentSettings.modeOverride || 'auto';
      let currentTab = window.kRadialLastSettingsTab || (isMobileDevice() ? 'mobile' : 'pc');

      const overlay = parentDoc.createElement('div');
      overlay.id = 'k-radial-settings-overlay';
      overlay.className = 'k-radial-settings-overlay';

      let sortableInstance = null;

      // Construct permanent shell layout
      overlay.innerHTML = `
            <div class="k-radial-settings-container">
                <div class="k-radial-settings-left">
                    <div class="k-radial-settings-header">
                        <span>轮盘快捷菜单设置</span>
                        <button id="k-radial-settings-close" style="background:none;border:none;color:inherit;cursor:pointer;font-size:18px;padding:2px 6px;">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div class="k-radial-settings-body" id="k-radial-settings-body-container"></div>
                    <div class="k-radial-settings-footer" style="padding:12px 18px; border-top:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; gap:12px;">
                        <div class="k-radial-settings-tabs" id="k-radial-settings-tabs-container" style="display:flex; flex:1; background:rgba(0,0,0,0.2); border-radius:6px; overflow:hidden; border:1px solid rgba(255,255,255,0.1);"></div>
                        <button id="k-radial-settings-save" class="k-radial-primary" style="padding:8px 16px;">保存并立刻应用</button>
                    </div>
                </div>
                <div class="k-radial-preview-area" id="k-radial-preview-area"></div>
            </div>
        `;

      // Shell events
      overlay.querySelector('#k-radial-settings-close')?.addEventListener('click', closeSettings);
      overlay.addEventListener('click', e => {
        if (e.target === overlay) closeSettings();
      });

      overlay.querySelector('#k-radial-settings-save')?.addEventListener('click', () => {
        const effectiveOld = getEffectiveSettings();
        const oldToolbarMode = effectiveOld.toolbarMode;

        currentSettings.profiles = JSON.parse(JSON.stringify(tempProfiles));
        currentSettings.modeOverride = tempModeOverride;
        saveSettings(currentSettings);

        const effectiveNew = getEffectiveSettings();

        createAndInjectUI();

        if (effectiveNew.toolbarMode) {
          createToolbar();
          const chatEl = parentDoc.getElementById('chat') || parentDoc.querySelector('.chat-area');
          if (chatEl) {
            $(chatEl).off('dblclick.radialMenu');
            $(chatEl).off('touchstart.radialMenu');
            $(chatEl).off('touchend.radialMenu touchcancel.radialMenu');
          }
        } else {
          destroyToolbar();
          if (oldToolbarMode) {
            const chatEl = parentDoc.getElementById('chat') || parentDoc.querySelector('.chat-area');
            if (chatEl) {
              $(chatEl)
                .off('.radialMenu')
                .on('dblclick.radialMenu', '.mes', handleDoubleClick)
                .on('touchstart.radialMenu', '.mes', handleTouchStart)
                .on('touchend.radialMenu touchcancel.radialMenu', '.mes', handleTouchEnd);
            }
          }
        }

        toastr.success('轮盘设置已保存');
        closeSettings();
      });

      // Event delegation for dynamically re-rendered elements handling actions
      overlay.addEventListener('click', e => {
        const tabBtn = e.target.closest('.k-radial-settings-tab');
        if (tabBtn) {
          currentTab = tabBtn.dataset.tab;
          window.kRadialLastSettingsTab = currentTab;
          renderContent();
          return;
        }
        const addBtn = e.target.closest('.k-radial-add-btn');
        if (addBtn) {
          tempProfiles[currentTab].enabledButtons.push(addBtn.dataset.id);
          renderContent();
          return;
        }
        const rmBtn = e.target.closest('.k-radial-remove-btn');
        if (rmBtn) {
          tempProfiles[currentTab].enabledButtons = tempProfiles[currentTab].enabledButtons.filter(
            id => id !== rmBtn.dataset.id,
          );
          renderContent();
          return;
        }
      });

      // Event delegation for form inputs
      overlay.addEventListener('change', e => {
        if (e.target.id === 'k-radial-mode-override') {
          tempModeOverride = e.target.value;
        }
        if (e.target.id === 'k-radial-toolbar-toggle') {
          tempProfiles[currentTab].toolbarMode = e.target.checked;
          renderContent();
        }
        if (e.target.id === 'k-radial-mobile-trigger') {
          tempProfiles[currentTab].mobileTriggerMode = e.target.value;
          renderContent();
        }
      });

      overlay.addEventListener('input', e => {
        if (e.target.id === 'k-radial-size-slider') {
          tempProfiles[currentTab].buttonSize = parseInt(e.target.value, 10);
          const valSpan = overlay.querySelector('#k-radial-size-val');
          if (valSpan) valSpan.textContent = tempProfiles[currentTab].buttonSize;
          renderPreview();
        }
        if (e.target.id === 'k-radial-radius-slider') {
          tempProfiles[currentTab].menuRadius = parseInt(e.target.value, 10);
          const rValSpan = overlay.querySelector('#k-radial-radius-val');
          if (rValSpan) rValSpan.textContent = tempProfiles[currentTab].menuRadius;
          renderPreview();
        }
        if (e.target.id === 'k-radial-pencil-slider') {
          tempProfiles[currentTab].pencilSize = parseInt(e.target.value, 10);
          const pValSpan = overlay.querySelector('#k-radial-pencil-val');
          if (pValSpan) pValSpan.textContent = tempProfiles[currentTab].pencilSize;
          renderPreview();
        }
      });

      function renderContent() {
        const p = tempProfiles[currentTab];
        const tempEnabled = p.enabledButtons || [];
        const enabledBtns = tempEnabled.map(id => ALL_BUTTONS.find(b => b.id === id)).filter(Boolean);
        const availableBtns = ALL_BUTTONS.filter(b => !tempEnabled.includes(b.id));

        const bodyContainer = overlay.querySelector('#k-radial-settings-body-container');
        const scrollTop = bodyContainer ? bodyContainer.scrollTop : 0;

        if (bodyContainer)
          bodyContainer.innerHTML = `
                <div class="k-radial-settings-section" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; background:rgba(255,255,255,0.05); padding:10px 14px; border-radius:8px;">
                    <div style="font-size:0.92em; font-weight:bold;">⚙️ 此设备运行模式</div>
                    <select id="k-radial-mode-override" style="background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.2); color:#fff; border-radius:4px; padding:4px 8px; outline:none; font-size:0.9em; cursor:pointer;">
                        <option value="auto" ${tempModeOverride === 'auto' ? 'selected' : ''}>自动判断 (当前为${isMobileDevice() ? '移动端' : 'PC'})</option>
                        <option value="pc" ${tempModeOverride === 'pc' ? 'selected' : ''}>强制应用 PC 槽位</option>
                        <option value="mobile" ${tempModeOverride === 'mobile' ? 'selected' : ''}>强制应用移动端槽位</option>
                    </select>
                </div>
                <div class="k-radial-settings-section" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; ${p.toolbarMode ? 'opacity:0.4;pointer-events:none;' : ''}">
                    <div class="k-radial-settings-section-title" style="margin:0; font-size:0.9em; text-transform:none;">移动端轮盘唤出方式</div>
                    <select id="k-radial-mobile-trigger" style="background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.2); color:#fff; border-radius:4px; padding:4px 8px; outline:none; font-size:0.9em; cursor:pointer;" ${p.toolbarMode ? 'disabled title="固定工具栏模式下不适用"' : ''}>
                        <option value="longPress" ${p.mobileTriggerMode !== 'doubleTap' ? 'selected' : ''}>长按 (450ms)</option>
                        <option value="doubleTap" ${p.mobileTriggerMode === 'doubleTap' ? 'selected' : ''}>双击</option>
                    </select>
                </div>
                <div class="k-radial-settings-section" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <div class="k-radial-settings-section-title" style="margin:0; font-size:0.9em; text-transform:none;">固定长条工具栏模式</div>
                    <label style="position:relative;display:inline-block;width:42px;height:22px;cursor:pointer;">
                        <input type="checkbox" id="k-radial-toolbar-toggle" ${p.toolbarMode ? 'checked' : ''} style="opacity:0;width:0;height:0;">
                        <span style="position:absolute;top:0;left:0;right:0;bottom:0;background:${p.toolbarMode ? 'var(--SmartThemeQuoteColor,#4caf8a)' : 'rgba(255,255,255,0.15)'};border-radius:22px;transition:background .2s;"></span>
                        <span style="position:absolute;top:2px;left:${p.toolbarMode ? '22px' : '2px'};width:18px;height:18px;background:#fff;border-radius:50%;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></span>
                    </label>
                </div>
                <div class="k-radial-settings-section" style="display:flex; justify-content:space-between; align-items:center;">
                    <div class="k-radial-settings-section-title" style="margin:0; font-size:0.9em; text-transform:none;">智能划词铅笔大小</div>
                    <div class="k-radial-settings-slider-row" style="margin:0; width:55%;">
                        <input type="range" id="k-radial-pencil-slider" min="20" max="80" value="${p.pencilSize || 36}">
                        <span class="k-radial-settings-slider-val" id="k-radial-pencil-val">${p.pencilSize || 36}</span>
                    </div>
                </div>
                <div class="k-radial-settings-section" style="display:flex; justify-content:space-between; align-items:center;">
                    <div class="k-radial-settings-section-title" style="margin:0; font-size:0.9em; text-transform:none;">按钮直径调节</div>
                    <div class="k-radial-settings-slider-row" style="margin:0; width:55%;">
                        <input type="range" id="k-radial-size-slider" min="30" max="100" value="${p.buttonSize}">
                        <span class="k-radial-settings-slider-val" id="k-radial-size-val">${p.buttonSize}</span>
                    </div>
                </div>
                <div class="k-radial-settings-section" style="display:flex; justify-content:space-between; align-items:center;${p.toolbarMode ? 'opacity:0.35;pointer-events:none;' : ''}">
                    <div class="k-radial-settings-section-title" style="margin:0; font-size:0.9em; text-transform:none;">轮盘直径调节</div>
                    <div class="k-radial-settings-slider-row" style="margin:0; width:55%;">
                        <input type="range" id="k-radial-radius-slider" min="40" max="150" value="${p.menuRadius}">
                        <span class="k-radial-settings-slider-val" id="k-radial-radius-val">${p.menuRadius}</span>
                    </div>
                </div>
                <div class="k-radial-settings-section" style="margin-top:16px;">
                    <div class="k-radial-settings-section-title">已启用按钮（拖拽重排序）</div>
                    <div class="k-radial-btn-list" id="k-radial-enabled-list">
                        ${enabledBtns
                          .map(
                            btn => `
                            <div class="k-radial-btn-item" data-id="${btn.id}">
                                <i class="fa-solid fa-grip-vertical k-radial-drag-handle" title="拖拽重排序"></i>
                                <i class="fa-solid ${btn.icon}"></i>
                                <span class="k-radial-btn-item-label">${btn.tooltip}</span>
                                <div class="k-radial-btn-item-actions">
                                    <button class="k-radial-remove-btn" data-id="${btn.id}" title="移除">
                                        <i class="fa-solid fa-minus"></i>
                                    </button>
                                </div>
                            </div>
                        `,
                          )
                          .join('')}
                        ${enabledBtns.length === 0 ? '<div style="opacity:0.5;text-align:center;padding:12px">无已启用按钮</div>' : ''}
                    </div>
                </div>
                ${
                  availableBtns.length > 0
                    ? `
                <div class="k-radial-settings-section">
                    <div class="k-radial-settings-section-title">可添加按钮</div>
                    <div class="k-radial-btn-list" id="k-radial-available-list">
                        ${availableBtns
                          .map(
                            btn => `
                            <div class="k-radial-btn-item" data-id="${btn.id}">
                                <i class="fa-solid ${btn.icon}"></i>
                                <span class="k-radial-btn-item-label">${btn.tooltip}</span>
                                <div class="k-radial-btn-item-actions">
                                    <button class="k-radial-add-btn" data-id="${btn.id}" title="添加">
                                        <i class="fa-solid fa-plus"></i>
                                    </button>
                                </div>
                            </div>
                        `,
                          )
                          .join('')}
                    </div>
                </div>
                `
                    : ''
                }
            `;

        if (bodyContainer) bodyContainer.scrollTop = scrollTop;

        const tabsContainer = overlay.querySelector('#k-radial-settings-tabs-container');
        if (tabsContainer)
          tabsContainer.innerHTML = `
                <div class="k-radial-settings-tab ${currentTab === 'pc' ? 'active' : ''}" data-tab="pc" style="flex:1; padding:8px 12px; text-align:center; cursor:pointer; font-size:0.95em; transition:all 0.2s; ${currentTab === 'pc' ? 'background:color-mix(in srgb, var(--SmartThemeQuoteColor, #4caf8a) 25%, transparent); color:var(--SmartThemeQuoteColor, #4caf8a); font-weight:bold;' : 'opacity:0.6; color:inherit;'}">💻 PC</div>
                <div class="k-radial-settings-tab ${currentTab === 'mobile' ? 'active' : ''}" data-tab="mobile" style="flex:1; padding:8px 12px; text-align:center; cursor:pointer; font-size:0.95em; transition:all 0.2s; border-left:1px solid rgba(255,255,255,0.1); ${currentTab === 'mobile' ? 'background:color-mix(in srgb, var(--SmartThemeQuoteColor, #4caf8a) 25%, transparent); color:var(--SmartThemeQuoteColor, #4caf8a); font-weight:bold;' : 'opacity:0.6; color:inherit;'}">📱 手机</div>
            `;

        // Sortable JS re-init
        const listEl = overlay.querySelector('#k-radial-enabled-list');
        if (Sortable && listEl && tempEnabled.length > 0) {
          if (sortableInstance) sortableInstance.destroy();
          sortableInstance = new Sortable(listEl, {
            handle: '.k-radial-drag-handle',
            animation: 150,
            ghostClass: 'k-radial-sortable-ghost',
            forceFallback: true, // 强制开启 fallback 模式（阻止 HTML5 原生拖拽）以支持滚轮滚动
            fallbackClass: 'k-radial-sortable-fallback',
            onEnd: evt => {
              const newOrder = Array.from(listEl.children)
                .map(el => el.dataset.id)
                .filter(Boolean);
              tempProfiles[currentTab].enabledButtons = newOrder;
              renderPreview();
            },
          });
        }

        renderPreview();
      }

      function renderPreview() {
        const container = overlay.querySelector('#k-radial-preview-area');
        if (!container) return;

        const p = tempProfiles[currentTab];
        container.innerHTML = '';
        applyTheme(container);
        container.style.setProperty('--rb-size', `${p.buttonSize}px`);

        const activeB = p.enabledButtons.map(id => ALL_BUTTONS.find(b => b.id === id)).filter(Boolean);
        const count = activeB.length;
        if (count === 0) return;

        if (p.toolbarMode) {
          // ── Toolbar preview ──
          const toolbar = parentDoc.createElement('div');
          toolbar.style.cssText = `
                    display:flex; flex-direction:column; align-items:center; gap:6px;
                    padding:8px 6px; background:var(--rb-bg); border:1.5px solid var(--rb-border);
                    border-radius:14px; box-shadow:0 6px 24px var(--rb-shadow);
                    backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
                `;
          // Drag handle indicator
          const handle = parentDoc.createElement('div');
          handle.style.cssText =
            'width:28px;height:6px;border-radius:3px;background:var(--rb-border);margin-bottom:2px;flex-shrink:0;';
          toolbar.appendChild(handle);

          activeB.forEach(btn => {
            const fakeBtn = parentDoc.createElement('div');
            fakeBtn.className = TOOLBAR_BTN_CLASS;
            fakeBtn.innerHTML = `<i class="fa-solid ${btn.icon}"></i>`;
            fakeBtn.title = btn.tooltip;
            toolbar.appendChild(fakeBtn);
          });
          container.appendChild(toolbar);
        } else {
          // ── Radial preview ──
          const radius = p.menuRadius;
          const angleStep = 360 / count;
          activeB.forEach((btn, index) => {
            const angle = (270 + index * angleStep) % 360;
            const rad = (angle * Math.PI) / 180;
            const dx = radius * Math.cos(rad);
            const dy = -radius * Math.sin(rad);

            const fakeBtn = parentDoc.createElement('div');
            fakeBtn.className = BUTTON_CLASS;
            fakeBtn.innerHTML = `<i class="fa-solid ${btn.icon}"></i>`;
            fakeBtn.style.setProperty('position', 'absolute', 'important');
            fakeBtn.style.left = `calc(50% + ${dx}px)`;
            fakeBtn.style.top = `calc(50% + ${dy}px)`;
            container.appendChild(fakeBtn);

            // Position indicator
            const indicatorRadius = Math.max(0, radius - p.buttonSize / 2 - 14);
            const idx = indicatorRadius * Math.cos(rad);
            const idy = -indicatorRadius * Math.sin(rad);

            const indicator = parentDoc.createElement('div');
            indicator.className = 'k-radial-preview-indicator';
            indicator.textContent = index + 1;
            indicator.style.left = `calc(50% + ${idx}px - 9px)`;
            indicator.style.top = `calc(50% + ${idy}px - 9px)`;
            container.appendChild(indicator);
          });
        }
      }

      function closeSettings() {
        overlay.remove();
      }

      renderContent();
      parentDoc.body.appendChild(overlay);
    }

    // ── 在扩展设置面板挂载设置入口（使用 ST_API）──────────────────────────────
    async function mountSettingsEntry() {
      const ST_API = window.parent?.ST_API || window.ST_API;
      if (!ST_API?.ui?.registerSettingsPanel) {
        console.warn('[RadialMenu] ST_API.ui.registerSettingsPanel 不可用');
        return;
      }
      if (window.parent.kRadialSettingsRegistered) return; // 防止热重载/开关脚本时重复注册
      try {
        await ST_API.ui.registerSettingsPanel({
          id: 'k-radial-menu.settings',
          title: '轮盘快捷菜单',
          target: 'right',
          content: {
            kind: 'render',
            render: container => {
              const btn = document.createElement('button');
              btn.className = 'menu_button';
              btn.style.cssText = 'width:100%;padding:6px 12px;font-size:0.9em;';
              btn.innerHTML = '<i class="fa-solid fa-compass" style="margin-right:6px;"></i>打开轮盘按钮设置';
              btn.addEventListener('click', e => {
                e.stopPropagation();
                showSettingsPopup();
              });
              container.appendChild(btn);
            },
          },
        });
        log('设置面板已通过 ST_API 注册');
        window.parent.kRadialSettingsRegistered = true;
      } catch (e) {
        console.warn('[RadialMenu] registerSettingsPanel failed:', e);
      }
    }

    // ── Mouse handlers (PC) ─────────────────────────────────────────────────
    function handleMouseMove(e) {
      updateSelection(e.clientX, e.clientY);
    }
    let lastTouchEndTime = 0;
    let lastTapTime = 0;
    let lastTapCoords = { x: 0, y: 0 };
    let lastTapCard = null;
    function handleDoubleClick(e) {
      if (Date.now() - lastTouchEndTime < 600) return; // came from a double-tap, ignore
      e.preventDefault();
      lastTriggerWasTouch = false;
      pressCoords = { x: e.clientX, y: e.clientY };
      showMenu(e.clientX, e.clientY, e.currentTarget);
    }
    function handleMouseUp(e) {
      if (Date.now() - lastTouchEndTime < 600) return; // Prevent synthetic mouse events from dismissing menu on mobile
      if (!menuVisible || e.button !== 0) return;
      if (!selectedButton) {
        // Click outside any button → just dismiss
        hideMenu();
        return;
      }
      executeSelected();
    }
    function handleF8Key(e) {
      if (e.key === 'F8') {
        e.preventDefault();
        lastTriggerWasTouch = false;

        // 优先检查是否有 iframe 内的活跃选区
        if (activeIframeSelection) {
          const { iframe, mesid, selectedText } = activeIframeSelection;
          activeIframeSelection = null; // 消耗掉
          editFromIframeSelection(iframe, mesid, selectedText);
          return;
        }

        // 如果有普通选区则走指纹反查编辑，否则走 ST 原生编辑
        const sel = window.parent.getSelection();
        if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) {
          editFromSelection();
        } else {
          setTimeout(handleSmartEdit, 0);
        }
      }
    }
    function handleGlobalMouseDown(e) {
      const pd = window.parent?.document;
      if (!pd) return;

      // ====== 修复 iframe 悬浮按钮“幽灵残留”问题 ======
      // 如果发生全局点击且点的不是铅笔按钮本身，强行清除活跃的 iframe 选区
      if (activeIframeSelection) {
        const btn = pd.getElementById(PENCIL_BUTTON_ID);
        if (!btn || !btn.contains(e.target)) {
          try {
            const iframeSel = activeIframeSelection.iframe.contentWindow.getSelection();
            if (iframeSel) iframeSel.removeAllRanges();
          } catch (err) {}
          activeIframeSelection = null;
          if (btn) btn.style.display = 'none';
        }
      }

      const stEd = $(pd).find(EDIT_CONFIG.SELECTORS.ST_EDITOR_TEXTAREA);
      if (stEd.length === 0) return;
      const mc = stEd.closest(EDIT_CONFIG.SELECTORS.MESSAGE);
      if (
        (mc.length && mc[0].contains(e.target)) ||
        (menuVisible && $(`#${MENU_CONTAINER_ID}`, pd)[0]?.contains(e.target)) ||
        pd.getElementById(TOOLBAR_CONTAINER_ID)?.contains(e.target)
      )
        return;
      saveAndCloseEditor(mc);
    }

    // ── Touch handlers (Mobile) ─────────────────────────────────────────────
    function handleTouchStart(e) {
      if (touchTimer) clearTimeout(touchTimer);
      const touch = e.originalEvent.touches[0];
      pressCoords = { x: touch.clientX, y: touch.clientY };

      // If menu is already visible (e.g. arrow kept it open), check if this
      // new touch lands on a button. If not → dismiss immediately.
      if (menuVisible) {
        updateSelection(touch.clientX, touch.clientY);
        if (!selectedButton) {
          hideMenu();
          isPossiblyLongPress = false;
          return;
        }
        return;
      }

      const eff = getEffectiveSettings();
      if (eff.mobileTriggerMode === 'doubleTap') {
        isPossiblyLongPress = false;
        return;
      }

      isPossiblyLongPress = true;
      const card = e.currentTarget;
      touchTimer = setTimeout(() => {
        if (isPossiblyLongPress) {
          lastTriggerWasTouch = true;
          showMenu(pressCoords.x, pressCoords.y, card);
        }
      }, LONG_PRESS_DURATION);
    }
    function handleTouchMove(e) {
      if (!menuVisible) {
        if (isPossiblyLongPress) {
          const t = e.originalEvent.touches[0];
          if (Math.hypot(t.clientX - pressCoords.x, t.clientY - pressCoords.y) > MOVE_THRESHOLD) {
            isPossiblyLongPress = false;
            if (touchTimer) clearTimeout(touchTimer);
          }
        }
        return;
      }
      e.preventDefault();
      const t = e.originalEvent.touches[0];
      const cx = t.clientX,
        cy = t.clientY;
      // Throttle to one update per animation frame — prevents layout thrash
      // at raw touch rate (can be 120+ events/sec on ProMotion screens)
      if (!selRafId) {
        selRafId = requestAnimationFrame(() => {
          selRafId = null;
          updateSelection(cx, cy);
        });
      }
    }
    function handleTouchEnd(e) {
      lastTouchEndTime = Date.now(); // record so dblclick handler can ignore synthetic events
      if (touchTimer) clearTimeout(touchTimer);
      isPossiblyLongPress = false;

      if (menuVisible) {
        if (!selectedButton) {
          // Finger lifted outside any button → just dismiss
          hideMenu();
        } else {
          executeSelected();
        }
        return;
      }

      const eff = getEffectiveSettings();
      if (eff.mobileTriggerMode === 'doubleTap') {
        const touch = e.originalEvent.changedTouches
          ? e.originalEvent.changedTouches[0]
          : e.originalEvent.touches
            ? e.originalEvent.touches[0]
            : pressCoords;
        const now = Date.now();
        const card = e.currentTarget;
        if (
          lastTapCard === card &&
          now - lastTapTime < 350 &&
          Math.hypot(touch.clientX - lastTapCoords.x, touch.clientY - lastTapCoords.y) < 30
        ) {
          lastTriggerWasTouch = true;
          showMenu(touch.clientX, touch.clientY, card);
          lastTapTime = 0;
          lastTapCard = null;
        } else {
          lastTapTime = now;
          lastTapCoords = { x: touch.clientX, y: Math.max(0, touch.clientY) };
          lastTapCard = card;
        }
      }
    }

    // ── Utilities ────────────────────────────────────────────────────────────
    function findScrollContainer() {
      for (const s of EDIT_CONFIG.SELECTORS.SCROLL_CONTAINERS) {
        const c = $(window.parent.document).find(s);
        if (c.length) return c.first();
      }
      return null;
    }
    function clickFirstVisible($c, sels) {
      for (const s of sels) {
        const $b = $c.find(s).filter(':visible').first();
        if ($b.length) {
          $b.trigger('click');
          return true;
        }
      }
      return false;
    }
    function isEditorOpenOnCard($c) {
      return $c.find(EDIT_CONFIG.SELECTORS.EDITOR).length > 0;
    }
    function scrollToElement(el, offset) {
      const c = findScrollContainer();
      if (!c || !el) return;
      const off = offset ?? EDIT_CONFIG.SCROLL_INTO_VIEW_OFFSET;
      c.stop(true).scrollTop(($(el).offset()?.top || 0) - (c.offset()?.top || 0) + c.scrollTop() - off);
    }

    function scrollToTextareaMatch(ta) {
      try {
        const parentDoc = window.parent.document;
        let pre = parentDoc.getElementById('k-radial-pre-calc');
        if (!pre) {
          pre = parentDoc.createElement('div');
          pre.id = 'k-radial-pre-calc';
          pre.style.cssText =
            'position:absolute;visibility:hidden;pointer-events:none;' +
            'box-sizing:border-box;left:-9999px;top:-9999px;white-space:pre-wrap;word-wrap:break-word;';
          parentDoc.body.appendChild(pre);
        }
        const st = getComputedStyle(ta);
        $(pre).css({
          width: `${ta.clientWidth}px`,
          padding: `${st.paddingTop} ${st.paddingRight} ${st.paddingBottom} ${st.paddingLeft}`,
          font: st.font,
          lineHeight: st.lineHeight,
          letterSpacing: st.letterSpacing,
        });

        // Content before selection start → shadow div height = text offset
        pre.textContent = ta.value.substring(0, ta.selectionStart);
        const textOffset = pre.offsetHeight;
        const lineH = parseFloat(st.lineHeight) || 20;

        // Target: place selected text at ALIGNMENT_RATIO (30%) of textarea viewport
        const targetScroll = textOffset + lineH / 2 - ta.clientHeight * EDIT_CONFIG.EDITOR_SCROLL_ALIGNMENT_RATIO;

        $(ta)
          .stop(true)
          .animate(
            {
              scrollTop: Math.max(0, Math.min(targetScroll, ta.scrollHeight - ta.clientHeight)),
            },
            200,
            'swing',
          );
      } catch (e) {
        console.warn('[RadialMenu] scrollToTextareaMatch error:', e);
      }
    }

    function scrollToContentEditableMatch(container, range) {
      try {
        const rr = range.getBoundingClientRect();
        const cr = container.getBoundingClientRect();
        const targetScroll =
          rr.top - cr.top + container.scrollTop - container.clientHeight * EDIT_CONFIG.EDITOR_SCROLL_ALIGNMENT_RATIO;
        $(container)
          .stop(true)
          .animate(
            {
              scrollTop: Math.max(0, Math.min(targetScroll, container.scrollHeight - container.clientHeight)),
            },
            200,
            'swing',
          );
      } catch (e) {
        console.warn('[RadialMenu] scrollToContentEditableMatch error:', e);
      }
    }
    function findTextNodeAndOffset(parent, offset) {
      let o = 0;
      const w = window.parent.document.createTreeWalker(parent, NodeFilter.SHOW_TEXT, null);
      let n;
      while ((n = w.nextNode())) {
        const l = n.textContent?.length || 0;
        if (o + l >= offset) return [n, Math.max(0, offset - o)];
        o += l;
      }
      return [null, 0];
    }

    function init() {
      log('初始化双端快捷轮盘 (修复版 v2)...');

      // 强力清理旧实例残留（应对脚本热重载/重新开关）
      const parentDoc = window.parent.document;
      const oldMenu = parentDoc.getElementById(MENU_CONTAINER_ID);
      if (oldMenu) oldMenu.remove();
      const oldPencil = parentDoc.getElementById(PENCIL_BUTTON_ID);
      if (oldPencil) oldPencil.remove();
      const oldToolbar = parentDoc.getElementById(TOOLBAR_CONTAINER_ID);
      if (oldToolbar) oldToolbar.remove();

      knownChatLength = typeof SillyTavern !== 'undefined' && SillyTavern.chat ? SillyTavern.chat.length : -1;
      currentSettings = loadSettings();
      injectStyles();
      createAndInjectUI();
      mountSettingsEntry();
      initFloatingPencil();
      initSelectionWatcher();
      initTouchSelectionFallback();
      initIframeAutoPatcher(); // 启动心跳绑定
      // iframe 扫描：用 MutationObserver 持续监控 #chat 内新增的 iframe
      setTimeout(patchIframeSelections, 2000);
      // 多一轮延迟扫描兜底（分页渲染插件可能晚于 2s 才创建 iframe）
      setTimeout(patchIframeSelections, 5000);
      setTimeout(patchIframeSelections, 10000);

      safeEventMakeLast('CHAT_CHANGED', () => {
        knownChatLength = typeof SillyTavern !== 'undefined' && SillyTavern.chat ? SillyTavern.chat.length : -1;
        robustAutoJump(false, false);
        setTimeout(patchIframeSelections, 1000);
        setTimeout(patchIframeSelections, 3000);
      });
      safeEventMakeLast('CHARACTER_MESSAGE_RENDERED', () => {
        robustAutoJump(true, false);
        setTimeout(patchIframeSelections, 500);
        setTimeout(patchIframeSelections, 2000);
      });

      const chatEl = parentDoc.getElementById('chat') || parentDoc.querySelector('.chat-area');
      const $chat = $(chatEl);

      // MutationObserver：当 #chat 内有新节点（含 iframe）出现时自动扫描
      try {
        if (chatEl) {
          const iframeObserver = new MutationObserver((mutations) => {
            let hasNewIframe = false;
            for (const m of mutations) {
              for (const node of m.addedNodes) {
                if (node.nodeType !== 1) continue;
                if (node.tagName === 'IFRAME' || node.querySelector?.('iframe')) {
                  hasNewIframe = true;
                  break;
                }
              }
              if (hasNewIframe) break;
            }
            if (hasNewIframe) {
              log('[iframe穿透] MutationObserver 检测到新 iframe，延迟扫描...');
              setTimeout(patchIframeSelections, 500);
              setTimeout(patchIframeSelections, 1500);
            }
          });
          iframeObserver.observe(chatEl, { childList: true, subtree: true });
          log('[iframe穿透] MutationObserver 已挂载到 #chat');
        }
      } catch(e) {
        log('[iframe穿透] MutationObserver 挂载失败: ' + e.message);
      }

      if ($chat.length > 0) {
        // PC/Mobile: toolbar mode mutually excludes radial menu bindings
        if (getEffectiveSettings().toolbarMode) {
          createToolbar();
        } else {
          $chat
            .off('.radialMenu')
            .on('dblclick.radialMenu', '.mes', handleDoubleClick)
            .on('touchstart.radialMenu', '.mes', handleTouchStart)
            .on('touchend.radialMenu touchcancel.radialMenu', '.mes', handleTouchEnd);
        }
        $(parentDoc)
          .off('.radialMenu')
          .on('mousemove.radialMenu', handleMouseMove)
          .on('mouseup.radialMenu', handleMouseUp)
          .on('keydown.radialEdit', handleF8Key)
          .on('mousedown.radialEdit', handleGlobalMouseDown);

        // Mobile — touchmove via native API (passive:false required for preventDefault)
        // It's safe to always bind this because handleTouchMove checks !menuVisible
        chatEl.addEventListener(
          'touchmove',
          function (e) {
            handleTouchMove({ preventDefault: () => e.preventDefault(), originalEvent: e });
          },
          { passive: false },
        );

        // Track most-visible message (PC smart-edit fallback)
        const sc = findScrollContainer();
        if (sc) {
          const map = new Map();
          const io = new IntersectionObserver(
            entries => {
              entries.forEach(e => (e.isIntersecting ? map.set(e.target, e.intersectionRatio) : map.delete(e.target)));
              let maxR = 0;
              mostVisibleMessageCard = null;
              for (const [t, r] of map.entries()) {
                if (r > maxR) {
                  maxR = r;
                  mostVisibleMessageCard = t;
                }
              }
            },
            { root: sc[0], threshold: [0, 0.25, 0.5, 0.75, 1.0] },
          );
          const obs = () => {
            io.disconnect();
            $(parentDoc)
              .find(EDIT_CONFIG.SELECTORS.MESSAGE)
              .each((_, el) => io.observe(el));
          };
          obs();
          safeEventOn('CHAT_CHANGED', () => setTimeout(obs, 300));
          safeEventOn('MESSAGE_RECEIVED', () => setTimeout(obs, 300));
          safeEventOn('MESSAGE_DELETED', () => setTimeout(obs, 300));
        }
        log('双端事件绑定成功。');
      } else {
        console.warn('[PC_RadialMenu_v2] 未找到 #chat 元素');
      }
    }

    setTimeout(init, 1000);
  })(),
);
