(() => {
  // node_modules/asyncglk/node_modules/lodash-es/_freeGlobal.js
  var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
  var freeGlobal_default = freeGlobal;

  // node_modules/asyncglk/node_modules/lodash-es/_root.js
  var freeSelf = typeof self == "object" && self && self.Object === Object && self;
  var root = freeGlobal_default || freeSelf || Function("return this")();
  var root_default = root;

  // node_modules/asyncglk/node_modules/lodash-es/_Symbol.js
  var Symbol2 = root_default.Symbol;
  var Symbol_default = Symbol2;

  // node_modules/asyncglk/node_modules/lodash-es/_getRawTag.js
  var objectProto = Object.prototype;
  var hasOwnProperty = objectProto.hasOwnProperty;
  var nativeObjectToString = objectProto.toString;
  var symToStringTag = Symbol_default ? Symbol_default.toStringTag : void 0;
  function getRawTag(value) {
    var isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
    try {
      value[symToStringTag] = void 0;
      var unmasked = true;
    } catch (e2) {
    }
    var result = nativeObjectToString.call(value);
    if (unmasked) {
      if (isOwn) {
        value[symToStringTag] = tag;
      } else {
        delete value[symToStringTag];
      }
    }
    return result;
  }
  var getRawTag_default = getRawTag;

  // node_modules/asyncglk/node_modules/lodash-es/_objectToString.js
  var objectProto2 = Object.prototype;
  var nativeObjectToString2 = objectProto2.toString;
  function objectToString(value) {
    return nativeObjectToString2.call(value);
  }
  var objectToString_default = objectToString;

  // node_modules/asyncglk/node_modules/lodash-es/_baseGetTag.js
  var nullTag = "[object Null]";
  var undefinedTag = "[object Undefined]";
  var symToStringTag2 = Symbol_default ? Symbol_default.toStringTag : void 0;
  function baseGetTag(value) {
    if (value == null) {
      return value === void 0 ? undefinedTag : nullTag;
    }
    return symToStringTag2 && symToStringTag2 in Object(value) ? getRawTag_default(value) : objectToString_default(value);
  }
  var baseGetTag_default = baseGetTag;

  // node_modules/asyncglk/node_modules/lodash-es/isObjectLike.js
  function isObjectLike(value) {
    return value != null && typeof value == "object";
  }
  var isObjectLike_default = isObjectLike;

  // node_modules/asyncglk/node_modules/lodash-es/isSymbol.js
  var symbolTag = "[object Symbol]";
  function isSymbol(value) {
    return typeof value == "symbol" || isObjectLike_default(value) && baseGetTag_default(value) == symbolTag;
  }
  var isSymbol_default = isSymbol;

  // node_modules/asyncglk/node_modules/lodash-es/_trimmedEndIndex.js
  var reWhitespace = /\s/;
  function trimmedEndIndex(string) {
    var index = string.length;
    while (index-- && reWhitespace.test(string.charAt(index))) {
    }
    return index;
  }
  var trimmedEndIndex_default = trimmedEndIndex;

  // node_modules/asyncglk/node_modules/lodash-es/_baseTrim.js
  var reTrimStart = /^\s+/;
  function baseTrim(string) {
    return string ? string.slice(0, trimmedEndIndex_default(string) + 1).replace(reTrimStart, "") : string;
  }
  var baseTrim_default = baseTrim;

  // node_modules/asyncglk/node_modules/lodash-es/isObject.js
  function isObject(value) {
    var type = typeof value;
    return value != null && (type == "object" || type == "function");
  }
  var isObject_default = isObject;

  // node_modules/asyncglk/node_modules/lodash-es/toNumber.js
  var NAN = 0 / 0;
  var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
  var reIsBinary = /^0b[01]+$/i;
  var reIsOctal = /^0o[0-7]+$/i;
  var freeParseInt = parseInt;
  function toNumber(value) {
    if (typeof value == "number") {
      return value;
    }
    if (isSymbol_default(value)) {
      return NAN;
    }
    if (isObject_default(value)) {
      var other = typeof value.valueOf == "function" ? value.valueOf() : value;
      value = isObject_default(other) ? other + "" : other;
    }
    if (typeof value != "string") {
      return value === 0 ? value : +value;
    }
    value = baseTrim_default(value);
    var isBinary = reIsBinary.test(value);
    return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
  }
  var toNumber_default = toNumber;

  // node_modules/asyncglk/node_modules/lodash-es/now.js
  var now = function() {
    return root_default.Date.now();
  };
  var now_default = now;

  // node_modules/asyncglk/node_modules/lodash-es/debounce.js
  var FUNC_ERROR_TEXT = "Expected a function";
  var nativeMax = Math.max;
  var nativeMin = Math.min;
  function debounce(func, wait, options) {
    var lastArgs, lastThis, maxWait, result, timerId, lastCallTime, lastInvokeTime = 0, leading = false, maxing = false, trailing = true;
    if (typeof func != "function") {
      throw new TypeError(FUNC_ERROR_TEXT);
    }
    wait = toNumber_default(wait) || 0;
    if (isObject_default(options)) {
      leading = !!options.leading;
      maxing = "maxWait" in options;
      maxWait = maxing ? nativeMax(toNumber_default(options.maxWait) || 0, wait) : maxWait;
      trailing = "trailing" in options ? !!options.trailing : trailing;
    }
    function invokeFunc(time) {
      var args = lastArgs, thisArg = lastThis;
      lastArgs = lastThis = void 0;
      lastInvokeTime = time;
      result = func.apply(thisArg, args);
      return result;
    }
    function leadingEdge(time) {
      lastInvokeTime = time;
      timerId = setTimeout(timerExpired, wait);
      return leading ? invokeFunc(time) : result;
    }
    function remainingWait(time) {
      var timeSinceLastCall = time - lastCallTime, timeSinceLastInvoke = time - lastInvokeTime, timeWaiting = wait - timeSinceLastCall;
      return maxing ? nativeMin(timeWaiting, maxWait - timeSinceLastInvoke) : timeWaiting;
    }
    function shouldInvoke(time) {
      var timeSinceLastCall = time - lastCallTime, timeSinceLastInvoke = time - lastInvokeTime;
      return lastCallTime === void 0 || timeSinceLastCall >= wait || timeSinceLastCall < 0 || maxing && timeSinceLastInvoke >= maxWait;
    }
    function timerExpired() {
      var time = now_default();
      if (shouldInvoke(time)) {
        return trailingEdge(time);
      }
      timerId = setTimeout(timerExpired, remainingWait(time));
    }
    function trailingEdge(time) {
      timerId = void 0;
      if (trailing && lastArgs) {
        return invokeFunc(time);
      }
      lastArgs = lastThis = void 0;
      return result;
    }
    function cancel() {
      if (timerId !== void 0) {
        clearTimeout(timerId);
      }
      lastInvokeTime = 0;
      lastArgs = lastCallTime = lastThis = timerId = void 0;
    }
    function flush() {
      return timerId === void 0 ? result : trailingEdge(now_default());
    }
    function debounced() {
      var time = now_default(), isInvoking = shouldInvoke(time);
      lastArgs = arguments;
      lastThis = this;
      lastCallTime = time;
      if (isInvoking) {
        if (timerId === void 0) {
          return leadingEdge(lastCallTime);
        }
        if (maxing) {
          clearTimeout(timerId);
          timerId = setTimeout(timerExpired, wait);
          return invokeFunc(lastCallTime);
        }
      }
      if (timerId === void 0) {
        timerId = setTimeout(timerExpired, wait);
      }
      return result;
    }
    debounced.cancel = cancel;
    debounced.flush = flush;
    return debounced;
  }
  var debounce_default = debounce;

  // node_modules/asyncglk/node_modules/lodash-es/throttle.js
  var FUNC_ERROR_TEXT2 = "Expected a function";
  function throttle(func, wait, options) {
    var leading = true, trailing = true;
    if (typeof func != "function") {
      throw new TypeError(FUNC_ERROR_TEXT2);
    }
    if (isObject_default(options)) {
      leading = "leading" in options ? !!options.leading : leading;
      trailing = "trailing" in options ? !!options.trailing : trailing;
    }
    return debounce_default(func, wait, {
      "leading": leading,
      "maxWait": wait,
      "trailing": trailing
    });
  }
  var throttle_default = throttle;

  // node_modules/asyncglk/dist/common/misc.js
  function is_pinch_zoomed() {
    if (visualViewport) {
      return visualViewport.scale - 1 > 1e-3;
    }
    return false;
  }
  var utf8decoder = new TextDecoder();
  var utf8encoder = new TextEncoder();

  // node_modules/asyncglk/dist/common/constants.js
  var DEFAULT_METRICS = {
    buffercharheight: 1,
    buffercharwidth: 1,
    buffermarginx: 0,
    buffermarginy: 0,
    graphicsmarginx: 0,
    graphicsmarginy: 0,
    gridcharheight: 1,
    gridcharwidth: 1,
    gridmarginx: 0,
    gridmarginy: 0,
    height: 50,
    inspacingx: 0,
    inspacingy: 0,
    outspacingx: 0,
    outspacingy: 0,
    width: 80
  };
  var KEY_CODES_TO_NAMES = {
    8: "delete",
    // Backspace to be precise
    9: "tab",
    13: "return",
    27: "escape",
    33: "pageup",
    34: "pagedown",
    35: "end",
    36: "home",
    37: "left",
    38: "up",
    39: "right",
    40: "down",
    112: "func1",
    113: "func2",
    114: "func3",
    115: "func4",
    116: "func5",
    117: "func6",
    118: "func7",
    119: "func8",
    120: "func9",
    121: "func10",
    122: "func11",
    123: "func12"
  };
  var KEY_CODE_DOWN = 40;
  var KEY_CODE_RETURN = 13;
  var KEY_CODE_UP = 38;
  var NBSP = "\xA0";
  var OFFSCREEN_OFFSET = "-10000px";
  var PACKAGE_VERSION = "0.1.0";

  // node_modules/asyncglk/dist/dialog/common/common.js
  function filetype_to_extension(filetype) {
    switch (filetype) {
      case "command":
      case "transcript":
        return ".txt";
      case "save":
        return ".glksave";
      default:
        return ".glkdata";
    }
  }

  // node_modules/asyncglk/dist/glkote/common/glkote.js
  var GlkOteBase = class {
    classname = "GlkOte";
    version = PACKAGE_VERSION;
    accept_func = () => {
    };
    autorestoring = false;
    Blorb;
    current_metrics = Object.assign({}, DEFAULT_METRICS);
    Dialog;
    disabled = false;
    generation = 0;
    is_inited = false;
    options = {};
    timer = null;
    waiting_for_update = false;
    async init(options) {
      if (!options) {
        return this.error("no options provided");
      }
      if (!options.accept) {
        return this.error("an accept function was not given to GlkOte");
      }
      this.options = options;
      this.accept_func = options.accept;
      if (options.Blorb) {
        this.Blorb = options.Blorb;
      }
      if (options.Dialog) {
        this.Dialog = options.Dialog;
      }
      this.is_inited = true;
      this.send_event({ type: "init" });
    }
    error(error) {
      throw typeof error === "string" ? new Error(error) : error;
    }
    extevent(value) {
      this.send_event({
        type: "external",
        value
      });
    }
    getdomcontext() {
      throw new Error("getdomcontext is not applicable to this GlkOte library");
    }
    getdomid(name) {
      throw new Error("getdomid is not applicable to this GlkOte library");
    }
    getinterface() {
      return this.options;
    }
    getlibrary(name) {
      switch (name) {
        case "Blorb":
          return this.Blorb;
        case "Dialog":
          return this.Dialog;
        default:
          return null;
      }
    }
    inited() {
      return this.is_inited;
    }
    log(msg) {
      console.log(msg);
    }
    setdomcontext(val) {
      throw new Error("setdomcontext is not applicable to this GlkOte library");
    }
    update(data3) {
      try {
        this.autorestoring = false;
        this.waiting_for_update = false;
        if (data3.type === "error") {
          return this.error(data3.message);
        }
        if (data3.type === "pass") {
          return;
        }
        if (data3.type === "retry") {
          setTimeout(() => this.send_event({ type: "refresh" }), 2e3);
          return;
        }
        if (data3.type !== "update") {
          return this.error(`Unknown update type: ${data3.type}`);
        }
        if (data3.gen === this.generation) {
          this.log(`Ignoring repeated generation number: ${data3.gen}`);
          return;
        }
        this.generation = data3.gen;
        if (this.disabled) {
          this.disable(false);
        }
        if (data3.input) {
          this.cancel_inputs(data3.input);
        }
        if (data3.windows) {
          this.update_windows(data3.windows);
        }
        if (data3.content) {
          this.update_content(data3.content);
        }
        if (data3.input) {
          this.update_inputs(data3.input);
        }
        if (data3.schannels && this.Blorb) {
          this.update_schannels(data3.schannels);
        }
        if (data3.timer !== void 0) {
          if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
          }
          if (data3.timer) {
            this.timer = setInterval(() => this.ontimer(), data3.timer);
          }
        }
        if (data3.specialinput) {
          this.handle_specialinput(data3.specialinput);
        }
        this.disabled = false;
        if (data3.disable || data3.specialinput) {
          this.disable(true);
        }
        if (data3.autorestore) {
          this.autorestoring = true;
          this.autorestore(data3.autorestore);
        }
        if (typeof data3.page_margin_bg !== "undefined" && this.options.set_body_to_page_bg) {
          this.set_page_bg(data3.page_margin_bg);
        }
        if (data3.disable) {
          this.exit();
        }
      } catch (err) {
        this.error(err);
      }
    }
    warning(msg) {
      console.warn(msg);
    }
    // AsyncGlk specific implementation methods
    autorestore(data3) {
    }
    capabilities() {
      return ["timer"];
    }
    exit() {
    }
    handle_specialinput(data3) {
      if (data3.type === "fileref_prompt") {
        const replyfunc = (ref) => this.send_event({
          type: "specialresponse",
          response: "fileref_prompt",
          value: ref
        });
        try {
          if (!this.Dialog) {
            setTimeout(() => replyfunc(null), 0);
          } else {
            if (this.Dialog.async) {
              this.Dialog.prompt(filetype_to_extension(data3.filetype), data3.filemode !== "read").then((filename) => {
                replyfunc(filename ? { filename } : null);
              });
            } else {
              this.Dialog.open(data3.filemode !== "read", data3.filetype, data3.gameid, replyfunc);
            }
          }
        } catch (ex) {
          this.log(`Unable to open file dialog: ${ex}`);
          setTimeout(() => replyfunc(null), 0);
        }
      } else {
        this.error(`Request for unknown special input type: ${data3.type}`);
      }
    }
    ontimer() {
      if (!this.disabled && this.timer) {
        this.send_event({ type: "timer" });
      }
    }
    save_allstate() {
    }
    send_event(ev) {
      if (this.disabled && ev.type !== "specialresponse") {
        return;
      }
      if (this.waiting_for_update) {
        console.log("Trying to send event when waiting for input", ev);
        return;
      }
      this.waiting_for_update = true;
      ev.gen = this.generation;
      switch (ev.type) {
        case "arrange":
          ev.metrics = this.current_metrics;
          break;
        case "init":
          ev.metrics = this.current_metrics;
          ev.support = this.capabilities();
          break;
        case "specialresponse":
          ev.response = "fileref_prompt";
          break;
      }
      this.accept_func(ev);
    }
    set_page_bg(colour) {
    }
    update_schannels(windows) {
    }
  };

  // node_modules/asyncglk/dist/glkote/web/shared.js
  function create(tag, className) {
    return $(`<${tag}>`, { "class": className });
  }
  var DOM = class {
    context_element;
    errorcontent_id;
    errorpane_id;
    gameport_id;
    loadingpane_id;
    prefix;
    windowport_id;
    constructor(options) {
      this.context_element = options.context_element;
      this.errorcontent_id = options.errorcontent_id;
      this.errorpane_id = options.errorpane_id;
      this.gameport_id = options.gameport_id;
      this.loadingpane_id = options.loadingpane_id;
      this.prefix = options.prefix;
      this.windowport_id = options.windowport_id;
    }
    /** Create an element, adding prefix to the ID */
    create(tag, id, props) {
      props ??= {};
      if (typeof props === "string") {
        props = {
          class: props
        };
      }
      props.id = this.prefix + id;
      return $(`<${tag}>`, props);
    }
    gameport() {
      return $(`#${this.gameport_id}`, this.context_element);
    }
    /** Return a jQuery search for an element ID, using prefix and context_element */
    id(id) {
      return $(`#${this.prefix}${id}`, this.context_element);
    }
    windowport() {
      return $(`#${this.windowport_id}`, this.context_element);
    }
  };
  function is_input_focused() {
    const activeElement_tagName = document.activeElement?.tagName;
    return activeElement_tagName === "INPUT" || activeElement_tagName === "TEXTAREA";
  }
  var is_iOS = /iPad|iPhone|iPod/.test(navigator.platform) || navigator.platform === "MacIntel" && (navigator.maxTouchPoints ?? 0) > 1;

  // node_modules/asyncglk/dist/glkote/web/metrics.js
  function get_size(el) {
    return {
      height: el.outerHeight(),
      width: el.outerWidth()
    };
  }
  function metrics_differ(newmetrics, oldmetrics) {
    return oldmetrics.buffercharheight !== newmetrics.buffercharheight || oldmetrics.buffercharwidth !== newmetrics.buffercharwidth || oldmetrics.gridcharheight !== newmetrics.gridcharheight || oldmetrics.gridcharwidth !== newmetrics.gridcharwidth || oldmetrics.height !== newmetrics.height || oldmetrics.width !== newmetrics.width;
  }
  var Metrics = class {
    /** When we don't know how high the screen is, use a height we've saved before, or, at the very beginning, a rough estimate */
    height_with_keyboard = (visualViewport?.height || window.innerHeight) / 2;
    loaded;
    glkote;
    // Shares the current_metrics and DOM of WebGlkOte
    metrics;
    observer;
    constructor(glkote2) {
      this.glkote = glkote2;
      this.metrics = glkote2.current_metrics;
      if (document.readyState === "complete") {
        this.loaded = Promise.resolve();
      } else {
        this.loaded = new Promise((resolve) => {
          window.addEventListener("load", resolve, { once: true });
        });
      }
      if (window.ResizeObserver) {
        this.observer = new ResizeObserver(this.on_gameport_resize);
        this.observer.observe(this.glkote.dom.gameport()[0]);
      } else {
        $(window).on("resize", this.on_gameport_resize);
      }
      if (is_iOS) {
        this.on_visualViewport_resize = throttle_default(this.on_visualViewport_resize, 700);
      }
      if (visualViewport) {
        $(visualViewport).on("resize", this.on_visualViewport_resize);
      }
    }
    destroy() {
      if (this.observer) {
        this.observer.disconnect();
      } else {
        $(window).off("resize", this.on_gameport_resize);
      }
      if (visualViewport) {
        $(visualViewport).off("resize", this.on_visualViewport_resize);
      }
    }
    async measure() {
      const dom = this.glkote.dom;
      const gameport = dom.gameport();
      if (!gameport.length) {
        throw new Error(`Cannot find gameport element #${dom.gameport_id}`);
      }
      dom.id("layouttestpane").remove();
      const layout_test_pane = dom.create("div", "layout_test_pane");
      layout_test_pane.text("This should not be visible");
      const line = $("<div>");
      create("span", "Style_normal").text("12345678").appendTo(line);
      const bufwin = create("div", "WindowFrame BufferWindow");
      const bufinnerwin = create("div", "BufferWindowInner").appendTo(bufwin);
      const bufline1 = line.clone().addClass("BufferLine").appendTo(bufinnerwin);
      const bufline2 = line.clone().addClass("BufferLine").appendTo(bufinnerwin);
      create("span", "InvisibleCursor").appendTo(bufline2);
      const bufspan = bufline1.children("span");
      layout_test_pane.append(bufwin);
      const graphwin = create("div", "WindowFrame GraphicsWindow");
      const graphcanvas = $("<canvas>", {
        height: 32,
        width: 64
      }).appendTo(graphwin);
      layout_test_pane.append(graphwin);
      const gridwin = create("div", "WindowFrame GridWindow");
      const gridline1 = line.clone().addClass("GridLine").appendTo(gridwin);
      const gridline2 = line.clone().addClass("GridLine").appendTo(gridwin);
      const gridspan = gridline1.children("span");
      layout_test_pane.append(gridwin);
      gameport.append(layout_test_pane);
      await this.loaded;
      const font_family = getComputedStyle(gridwin[0]).getPropertyValue("--glkote-grid-mono-family").split(",")[0].replace(/"/g, "");
      await document.fonts.load(`14px ${font_family}`);
      this.metrics.height = gameport.height();
      this.metrics.width = gameport.width();
      const bufwinsize = get_size(bufwin);
      const bufspansize = get_size(bufspan);
      const bufline1size = get_size(bufline1);
      const bufline2size = get_size(bufline2);
      this.metrics.buffercharheight = Math.max(1, bufline2.position().top - bufline1.position().top);
      this.metrics.buffercharwidth = Math.max(1, bufspan.width() / 8);
      this.metrics.buffermarginx = bufwinsize.width - bufspansize.width;
      this.metrics.buffermarginy = bufwinsize.height - (bufline1size.height + bufline2size.height);
      const graphicswinsize = get_size(graphwin);
      const canvassize = get_size(graphcanvas);
      this.metrics.graphicsmarginx = graphicswinsize.width - canvassize.width;
      this.metrics.graphicsmarginy = graphicswinsize.height - canvassize.height;
      const gridwinsize = get_size(gridwin);
      const gridspansize = get_size(gridspan);
      const gridline1size = get_size(gridline1);
      const gridline2size = get_size(gridline2);
      this.metrics.gridcharheight = Math.max(1, gridline2.position().top - gridline1.position().top);
      this.metrics.gridcharwidth = Math.max(1, gridspan.width() / 8);
      this.metrics.gridmarginx = gridwinsize.width - gridspansize.width;
      this.metrics.gridmarginy = gridwinsize.height - (gridline1size.height + gridline2size.height);
      layout_test_pane.remove();
    }
    on_gameport_resize = throttle_default(async () => {
      if (this.glkote.disabled || !this.glkote.inited()) {
        this.on_gameport_resize();
        return;
      }
      const oldmetrics = Object.assign({}, this.metrics);
      await this.measure();
      if (metrics_differ(this.metrics, oldmetrics)) {
        this.glkote.send_event({ type: "arrange" });
      }
    }, 200, { leading: false });
    on_visualViewport_resize = () => {
      const height = visualViewport.height;
      if (is_input_focused()) {
        this.height_with_keyboard = height;
      }
      this.set_gameport_height(height);
    };
    /** Update the gameport height and then send new metrics */
    set_gameport_height(height) {
      if (is_pinch_zoomed()) {
        return;
      }
      if (!height) {
        height = this.height_with_keyboard;
      }
      this.glkote.dom.gameport().outerHeight(height, true);
      window.scrollTo(0, 0);
      this.on_gameport_resize();
    }
  };

  // node_modules/asyncglk/node_modules/@audio/decode-aiff/decode-aiff.js
  var EMPTY = Object.freeze({ channelData: [], sampleRate: 0 });
  var ALAW_TBL = new Int16Array(256);
  var ULAW_TBL = new Int16Array(256);
  (function buildTables() {
    for (let i = 0; i < 256; i++) {
      let ax = i ^ 85, seg = ax >> 4 & 7, val = ((ax & 15) << 4) + 8;
      if (seg) val = val + 256 << seg - 1;
      ALAW_TBL[i] = ax & 128 ? val : -val;
      let ux = ~i & 255;
      seg = ux >> 4 & 7;
      val = ((ux & 15) << 3) + 132;
      val <<= seg;
      ULAW_TBL[i] = ux & 128 ? val - 132 : -(val - 132);
    }
  })();
  function readF80(b, o) {
    let sign = b[o] >> 7 & 1;
    let exp = (b[o] & 127) << 8 | b[o + 1];
    let hi = (b[o + 2] << 24 | b[o + 3] << 16 | b[o + 4] << 8 | b[o + 5]) >>> 0;
    let lo = (b[o + 6] << 24 | b[o + 7] << 16 | b[o + 8] << 8 | b[o + 9]) >>> 0;
    if (exp === 0 && hi === 0 && lo === 0) return 0;
    if (exp === 32767) return sign ? -Infinity : Infinity;
    let f = (hi * 4294967296 + lo) / 9223372036854776e3;
    return (sign ? -1 : 1) * f * Math.pow(2, exp - 16383);
  }
  function str4(b, o) {
    return String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);
  }
  function r32(b, o) {
    return (b[o] << 24 | b[o + 1] << 16 | b[o + 2] << 8 | b[o + 3]) >>> 0;
  }
  function r16(b, o) {
    return b[o] << 8 | b[o + 1];
  }
  function parseAiff(buf) {
    if (!buf || buf.length < 12) return EMPTY;
    let b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    if (b.length < 12) return EMPTY;
    if (str4(b, 0) !== "FORM") throw Error("Not an AIFF file");
    let form = str4(b, 8);
    if (form !== "AIFF" && form !== "AIFC") throw Error("Not an AIFF file");
    let isAIFC = form === "AIFC";
    let nCh = 0, nFrames = 0, bps = 0, sr = 0, comp = "NONE";
    let ssndOff = -1, ssndSize = 0;
    let pos = 12, end = Math.min(8 + r32(b, 4), b.length);
    while (pos + 8 <= end) {
      let ckId = str4(b, pos);
      let ckSize = r32(b, pos + 4);
      let ckData = pos + 8;
      if (ckId === "COMM") {
        if (ckData + 18 > b.length) throw Error("Truncated COMM chunk");
        nCh = r16(b, ckData);
        nFrames = r32(b, ckData + 2);
        bps = r16(b, ckData + 6);
        sr = readF80(b, ckData + 8);
        if (isAIFC && ckSize >= 22 && ckData + 22 <= b.length) {
          comp = str4(b, ckData + 18);
        }
      } else if (ckId === "SSND") {
        if (ckData + 8 > b.length) throw Error("Truncated SSND chunk");
        let dataOff = r32(b, ckData);
        ssndOff = ckData + 8 + dataOff;
        ssndSize = ckSize - 8 - dataOff;
      }
      pos = ckData + ckSize + (ckSize & 1);
    }
    if (!nCh || !nFrames || !sr || ssndOff < 0) return EMPTY;
    let byteDepth = Math.ceil(bps / 8);
    let frameBytes = byteDepth * nCh;
    let actualFrames = Math.min(nFrames, Math.floor(Math.min(ssndSize, b.length - ssndOff) / frameBytes));
    if (actualFrames <= 0) return EMPTY;
    let channelData = Array.from({ length: nCh }, () => new Float32Array(actualFrames));
    let p = ssndOff;
    let cUpper = comp.toUpperCase();
    if (cUpper === "NONE" || cUpper === "TWOS" || comp === "twos") {
      decodePCM_BE(b, p, channelData, actualFrames, nCh, bps, byteDepth);
    } else if (comp === "sowt") {
      decodePCM_LE(b, p, channelData, actualFrames, nCh, bps, byteDepth);
    } else if (comp === "fl32" || comp === "FL32") {
      decodeFloat32_BE(b, p, channelData, actualFrames, nCh);
    } else if (comp === "fl64" || comp === "FL64") {
      decodeFloat64_BE(b, p, channelData, actualFrames, nCh);
    } else if (comp === "alaw") {
      decodeLaw(b, p, channelData, actualFrames, nCh, ALAW_TBL);
    } else if (comp === "ulaw" || comp === "ULAW") {
      decodeLaw(b, p, channelData, actualFrames, nCh, ULAW_TBL);
    } else if (comp === "ima4") {
      return decodeIMA4(b, ssndOff, ssndSize, nCh, nFrames, sr);
    } else if (comp === "GSM " || comp === "gsm ") {
      return decodeGSM(b, ssndOff, ssndSize, nCh, nFrames, sr);
    } else {
      throw Error("Unsupported AIFF-C compression: " + comp);
    }
    return { channelData, sampleRate: sr };
  }
  function decodePCM_BE(b, p, channels2, frames, nCh, bps, byteDepth) {
    if (bps === 8) {
      for (let i = 0; i < frames; i++)
        for (let c = 0; c < nCh; c++)
          channels2[c][i] = (b[p++] - 128) / 128;
    } else if (bps === 16) {
      for (let i = 0; i < frames; i++)
        for (let c = 0; c < nCh; c++) {
          let v = b[p] << 8 | b[p + 1];
          p += 2;
          channels2[c][i] = (v > 32767 ? v - 65536 : v) / 32768;
        }
    } else if (bps === 24) {
      for (let i = 0; i < frames; i++)
        for (let c = 0; c < nCh; c++) {
          let v = b[p] << 16 | b[p + 1] << 8 | b[p + 2];
          p += 3;
          channels2[c][i] = (v > 8388607 ? v - 16777216 : v) / 8388608;
        }
    } else if (bps === 32) {
      for (let i = 0; i < frames; i++)
        for (let c = 0; c < nCh; c++) {
          let v = b[p] << 24 | b[p + 1] << 16 | b[p + 2] << 8 | b[p + 3];
          p += 4;
          channels2[c][i] = v / 2147483648;
        }
    } else {
      throw Error("Unsupported bit depth: " + bps);
    }
  }
  function decodePCM_LE(b, p, channels2, frames, nCh, bps, byteDepth) {
    if (bps === 8) {
      for (let i = 0; i < frames; i++)
        for (let c = 0; c < nCh; c++)
          channels2[c][i] = (b[p++] - 128) / 128;
    } else if (bps === 16) {
      for (let i = 0; i < frames; i++)
        for (let c = 0; c < nCh; c++) {
          let v = b[p] | b[p + 1] << 8;
          p += 2;
          channels2[c][i] = (v > 32767 ? v - 65536 : v) / 32768;
        }
    } else if (bps === 24) {
      for (let i = 0; i < frames; i++)
        for (let c = 0; c < nCh; c++) {
          let v = b[p] | b[p + 1] << 8 | b[p + 2] << 16;
          p += 3;
          channels2[c][i] = (v > 8388607 ? v - 16777216 : v) / 8388608;
        }
    } else if (bps === 32) {
      for (let i = 0; i < frames; i++)
        for (let c = 0; c < nCh; c++) {
          let v = b[p] | b[p + 1] << 8 | b[p + 2] << 16 | b[p + 3] << 24;
          p += 4;
          channels2[c][i] = v / 2147483648;
        }
    } else {
      throw Error("Unsupported bit depth: " + bps);
    }
  }
  function decodeFloat32_BE(b, p, channels2, frames, nCh) {
    let dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
    for (let i = 0; i < frames; i++)
      for (let c = 0; c < nCh; c++) {
        channels2[c][i] = dv.getFloat32(p, false);
        p += 4;
      }
  }
  function decodeFloat64_BE(b, p, channels2, frames, nCh) {
    let dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
    for (let i = 0; i < frames; i++)
      for (let c = 0; c < nCh; c++) {
        channels2[c][i] = dv.getFloat64(p, false);
        p += 8;
      }
  }
  function decodeLaw(b, p, channels2, frames, nCh, tbl) {
    for (let i = 0; i < frames; i++)
      for (let c = 0; c < nCh; c++)
        channels2[c][i] = tbl[b[p++]] / 32768;
  }
  var IMA_STEP = new Int16Array([7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 19, 21, 23, 25, 28, 31, 34, 37, 41, 45, 50, 55, 60, 66, 73, 80, 88, 97, 107, 118, 130, 143, 157, 173, 190, 209, 230, 253, 279, 307, 337, 371, 408, 449, 494, 544, 598, 658, 724, 796, 876, 963, 1060, 1166, 1282, 1411, 1552, 1707, 1878, 2066, 2272, 2499, 2749, 3024, 3327, 3660, 4026, 4428, 4871, 5358, 5894, 6484, 7132, 7845, 8630, 9493, 10442, 11487, 12635, 13899, 15289, 16818, 18500, 20350, 22385, 24623, 27086, 29794, 32767]);
  var IMA_IDX = new Int8Array([-1, -1, -1, -1, 2, 4, 6, 8, -1, -1, -1, -1, 2, 4, 6, 8]);
  function decodeIMA4(b, ssndOff, ssndSize, nCh, nBlocks, sr) {
    let blockBytes = 34 * nCh;
    let totalSamples3 = nBlocks * 64;
    let channelData = Array.from({ length: nCh }, () => new Float32Array(totalSamples3));
    let p = ssndOff, sample2 = 0;
    for (let blk = 0; blk < nBlocks && p + blockBytes <= ssndOff + ssndSize; blk++) {
      for (let c = 0; c < nCh; c++) {
        let bp = p + c * 34;
        let preamble = b[bp] << 8 | b[bp + 1];
        let predictor = preamble & 65408;
        if (predictor > 32767) predictor -= 65536;
        let stepIdx = preamble & 127;
        if (stepIdx > 88) stepIdx = 88;
        let out = channelData[c];
        for (let i = 0; i < 32; i++) {
          let byte = b[bp + 2 + i];
          for (let nibbleIdx = 0; nibbleIdx < 2; nibbleIdx++) {
            let nibble = nibbleIdx === 0 ? byte >> 4 & 15 : byte & 15;
            let step = IMA_STEP[stepIdx];
            let diff = step >> 3;
            if (nibble & 1) diff += step >> 2;
            if (nibble & 2) diff += step >> 1;
            if (nibble & 4) diff += step;
            if (nibble & 8) diff = -diff;
            predictor += diff;
            if (predictor > 32767) predictor = 32767;
            if (predictor < -32768) predictor = -32768;
            stepIdx += IMA_IDX[nibble];
            if (stepIdx < 0) stepIdx = 0;
            if (stepIdx > 88) stepIdx = 88;
            out[sample2 + i * 2 + nibbleIdx] = predictor / 32768;
          }
        }
      }
      p += blockBytes;
      sample2 += 64;
    }
    return { channelData, sampleRate: sr };
  }
  var GSM_QLB = [3277, 11469, 21299, 32767];
  var GSM_FAC = [18431, 20479, 22527, 24575, 26623, 28671, 30719, 32767];
  function sadd(a, b) {
    let s = a + b;
    return s > 32767 ? 32767 : s < -32768 ? -32768 : s;
  }
  function ssub(a, b) {
    let s = a - b;
    return s > 32767 ? 32767 : s < -32768 ? -32768 : s;
  }
  function multr(a, b) {
    if (a === -32768 && b === -32768) return 32767;
    return a * b + 16384 >> 15 | 0;
  }
  function asr(x, n) {
    if (n >= 16) return x < 0 ? -1 : 0;
    if (n <= -16) return 0;
    if (n < 0) return x << -n;
    return x >> n;
  }
  function decodeGSM(b, ssndOff, ssndSize, nCh, nFrames, sr) {
    let totalFrames = Math.min(nFrames, Math.floor(ssndSize / 33));
    let channelData = [new Float32Array(totalFrames * 160)];
    let out = channelData[0], p = ssndOff;
    let dp0 = new Int32Array(280);
    let v = new Int32Array(9);
    let LARpp = [new Int32Array(8), new Int32Array(8)];
    let j = 0, nrp = 40, msr = 0;
    for (let f = 0; f < totalFrames; f++) {
      let { LARc, sub } = gsmBits(b, p);
      let wt = new Int32Array(160);
      for (let s = 0; s < 4; s++) {
        let sf = sub[s];
        let erp = new Int32Array(40);
        gsmRpeDecode(sf.xmaxc, sf.Mc, sf.xmc, erp);
        let Nr = sf.Nc < 40 || sf.Nc > 120 ? nrp : sf.Nc;
        nrp = Nr;
        let brp = GSM_QLB[sf.bc];
        for (let k = 0; k < 40; k++) {
          let drpp = multr(brp, dp0[120 + k - Nr]);
          dp0[120 + k] = sadd(erp[k], drpp);
        }
        for (let k = 0; k < 40; k++) wt[s * 40 + k] = dp0[120 + k];
        for (let k = 0; k < 120; k++) dp0[k] = dp0[k + 40];
      }
      let LARpp_j = LARpp[j];
      let LARpp_j_1 = LARpp[j ^ 1];
      j ^= 1;
      gsmDecodeLAR(LARc, LARpp_j);
      let sr_out = new Int32Array(160);
      let LARp = new Int32Array(8);
      for (let i = 0; i < 8; i++)
        LARp[i] = sadd(sadd(LARpp_j_1[i] >> 2, LARpp_j[i] >> 2), LARpp_j_1[i] >> 1);
      gsmLARpToRp(LARp);
      gsmSynthFilter(v, LARp, 13, wt, 0, sr_out, 0);
      for (let i = 0; i < 8; i++)
        LARp[i] = sadd(LARpp_j_1[i] >> 1, LARpp_j[i] >> 1);
      gsmLARpToRp(LARp);
      gsmSynthFilter(v, LARp, 14, wt, 13, sr_out, 13);
      for (let i = 0; i < 8; i++)
        LARp[i] = sadd(sadd(LARpp_j_1[i] >> 2, LARpp_j[i] >> 2), LARpp_j[i] >> 1);
      gsmLARpToRp(LARp);
      gsmSynthFilter(v, LARp, 13, wt, 27, sr_out, 27);
      for (let i = 0; i < 8; i++) LARp[i] = LARpp_j[i];
      gsmLARpToRp(LARp);
      gsmSynthFilter(v, LARp, 120, wt, 40, sr_out, 40);
      for (let k = 0; k < 160; k++) {
        msr = sadd(sr_out[k], multr(msr, 28180));
        let s = sadd(msr, msr) & 65528;
        out[f * 160 + k] = (s > 32767 ? s - 65536 : s) / 32768;
      }
      p += 33;
    }
    return { channelData, sampleRate: sr };
  }
  function gsmBits(buf, off2) {
    let bc = 0;
    function r(n) {
      let val = 0;
      for (let i = 0; i < n; i++) {
        val = val << 1 | buf[off2 + (bc >> 3)] >> 7 - (bc & 7) & 1;
        bc++;
      }
      return val;
    }
    let LARc = [r(6), r(6), r(5), r(5), r(4), r(4), r(3), r(3)];
    let sub = [];
    for (let s = 0; s < 4; s++)
      sub.push({ Nc: r(7), bc: r(2), Mc: r(2), xmaxc: r(6), xmc: [r(3), r(3), r(3), r(3), r(3), r(3), r(3), r(3), r(3), r(3), r(3), r(3), r(3)] });
    return { LARc, sub };
  }
  function gsmDecodeLAR(LARc, LARpp) {
    const B2 = [0, 0, 4096, -5120, 188, -3584, -682, -2288];
    const MIC = [-32, -32, -16, -16, -8, -8, -4, -4];
    const INVA = [13107, 13107, 13107, 13107, 19223, 17476, 31454, 29708];
    for (let i = 0; i < 8; i++) {
      let t2 = sadd(LARc[i], MIC[i]) << 10;
      t2 = ssub(t2, B2[i]);
      t2 = multr(INVA[i], t2);
      LARpp[i] = sadd(t2, t2);
    }
  }
  function gsmLARpToRp(LARp) {
    for (let i = 0; i < 8; i++) {
      if (LARp[i] < 0) {
        let t2 = LARp[i] === -32768 ? 32767 : -LARp[i];
        LARp[i] = -(t2 < 11059 ? t2 << 1 : t2 < 20070 ? t2 + 11059 : sadd(t2 >> 2, 26112));
      } else {
        let t2 = LARp[i];
        LARp[i] = t2 < 11059 ? t2 << 1 : t2 < 20070 ? t2 + 11059 : sadd(t2 >> 2, 26112);
      }
    }
  }
  function gsmSynthFilter(v, rrp, k, wt, wtOff, sr, srOff) {
    for (let n = 0; n < k; n++) {
      let sri = wt[wtOff + n];
      for (let i = 7; i >= 0; i--) {
        sri = ssub(sri, multr(rrp[i], v[i]));
        v[i + 1] = sadd(v[i], multr(rrp[i], sri));
      }
      sr[srOff + n] = v[0] = sri;
    }
  }
  function gsmRpeDecode(xmaxc, Mc, xMc, erp) {
    let exp = 0, mant;
    if (xmaxc > 15) exp = (xmaxc >> 3) - 1;
    mant = xmaxc - (exp << 3);
    if (mant === 0) {
      exp = -4;
      mant = 7;
    } else {
      while (mant <= 7) {
        mant = mant << 1 | 1;
        exp--;
      }
      ;
      mant -= 8;
    }
    let fac = GSM_FAC[mant];
    let shift = 6 - exp;
    let round = shift > 1 ? 1 << shift - 1 : 0;
    let xMp = new Int32Array(13);
    for (let i = 0; i < 13; i++) {
      let t2 = (xMc[i] << 1) - 7 << 12;
      t2 = multr(fac, t2);
      t2 = sadd(t2, round);
      xMp[i] = asr(t2, shift);
    }
    for (let k = 0; k < 40; k++) erp[k] = 0;
    for (let i = 0; i < 13; i++) erp[Mc + 3 * i] = xMp[i];
  }
  async function decode(src) {
    let buf = src instanceof Uint8Array ? src : src instanceof ArrayBuffer ? new Uint8Array(src) : src;
    let dec = await decoder();
    try {
      let result = dec.decode(buf);
      if (!result.channelData.length) result = dec.flush();
      return result;
    } finally {
      dec.free();
    }
  }
  async function decoder() {
    let hdr = null, left = null, freed = false;
    return {
      decode(data3) {
        if (freed) throw Error("Decoder already freed");
        if (!data3?.length) return EMPTY;
        let chunk = data3 instanceof Uint8Array ? data3 : new Uint8Array(data3);
        if (left) {
          chunk = cat(left, chunk);
          left = null;
        }
        if (!hdr) {
          hdr = scanAiffHdr(chunk);
          if (!hdr) {
            left = chunk.slice();
            return EMPTY;
          }
          if (hdr.comp === "ima4" || hdr.comp === "GSM " || hdr.comp === "gsm ") {
            left = chunk.slice();
            return EMPTY;
          }
          chunk = chunk.subarray(hdr.dataStart);
        }
        let fb = hdr.frameBytes;
        let complete = Math.floor(chunk.length / fb) * fb;
        if (!complete) {
          if (chunk.length) left = chunk.slice();
          return EMPTY;
        }
        if (chunk.length > complete) left = chunk.subarray(complete).slice();
        return decodeAiffRaw(chunk.subarray(0, complete), hdr);
      },
      flush() {
        if (hdr && left && (hdr.comp === "ima4" || hdr.comp === "GSM " || hdr.comp === "gsm ")) {
          let result = parseAiff(left);
          left = null;
          return result;
        }
        left = null;
        return EMPTY;
      },
      free() {
        freed = true;
        left = null;
        hdr = null;
      }
    };
  }
  function cat(a, b) {
    let r = new Uint8Array(a.length + b.length);
    r.set(a);
    r.set(b, a.length);
    return r;
  }
  function scanAiffHdr(b) {
    if (!b || b.length < 12) return null;
    if (str4(b, 0) !== "FORM") throw Error("Not an AIFF file");
    let form = str4(b, 8);
    if (form !== "AIFF" && form !== "AIFC") throw Error("Not an AIFF file");
    let isAIFC = form === "AIFC";
    let nCh = 0, bps = 0, sr = 0, comp = "NONE", commFound = false;
    let pos = 12, end = Math.min(8 + r32(b, 4), b.length);
    while (pos + 8 <= end) {
      let ckId = str4(b, pos), ckSize = r32(b, pos + 4), ckData = pos + 8;
      if (ckId === "COMM") {
        if (ckData + 18 > b.length) return null;
        nCh = r16(b, ckData);
        bps = r16(b, ckData + 6);
        sr = readF80(b, ckData + 8);
        if (isAIFC && ckSize >= 22 && ckData + 22 <= b.length) comp = str4(b, ckData + 18);
        commFound = true;
      } else if (ckId === "SSND") {
        if (!commFound) return null;
        if (ckData + 8 > b.length) return null;
        let dataOff = r32(b, ckData);
        let dataStart = ckData + 8 + dataOff;
        let cUpper = comp.toUpperCase();
        let byteDepth = Math.ceil(bps / 8);
        let frameBytes;
        if (comp === "fl32" || comp === "FL32") frameBytes = nCh * 4;
        else if (comp === "fl64" || comp === "FL64") frameBytes = nCh * 8;
        else if (comp === "alaw" || comp === "ulaw" || comp === "ULAW") frameBytes = nCh;
        else if (comp === "ima4" || comp === "GSM " || comp === "gsm ") frameBytes = 1;
        else frameBytes = nCh * byteDepth;
        return { nCh, bps, sr, comp, byteDepth, frameBytes, dataStart, isAIFC };
      }
      pos = ckData + ckSize + (ckSize & 1);
    }
    return null;
  }
  function decodeAiffRaw(raw, hdr) {
    let { nCh, bps, sr, comp, byteDepth, frameBytes } = hdr;
    let frames = Math.floor(raw.length / frameBytes);
    if (!frames) return EMPTY;
    let channelData = Array.from({ length: nCh }, () => new Float32Array(frames));
    let cUpper = comp.toUpperCase();
    let p = 0;
    if (cUpper === "NONE" || cUpper === "TWOS" || comp === "twos") {
      decodePCM_BE(raw, 0, channelData, frames, nCh, bps, byteDepth);
    } else if (comp === "sowt") {
      decodePCM_LE(raw, 0, channelData, frames, nCh, bps, byteDepth);
    } else if (comp === "fl32" || comp === "FL32") {
      decodeFloat32_BE(raw, 0, channelData, frames, nCh);
    } else if (comp === "fl64" || comp === "FL64") {
      decodeFloat64_BE(raw, 0, channelData, frames, nCh);
    } else if (comp === "alaw") {
      decodeLaw(raw, 0, channelData, frames, nCh, ALAW_TBL);
    } else if (comp === "ulaw" || comp === "ULAW") {
      decodeLaw(raw, 0, channelData, frames, nCh, ULAW_TBL);
    } else {
      throw Error("Unsupported AIFF-C compression: " + comp);
    }
    return { channelData, sampleRate: sr };
  }

  // node_modules/asyncglk/node_modules/@audio/decode-vorbis/decode-vorbis.js
  var t = (t2, n = 4294967295, e2 = 79764919) => {
    const r = new Int32Array(256);
    let o, s, i, c = n;
    for (o = 0; o < 256; o++) {
      for (i = o << 24, s = 8; s > 0; --s) i = 2147483648 & i ? i << 1 ^ e2 : i << 1;
      r[o] = i;
    }
    for (o = 0; o < t2.length; o++) c = c << 8 ^ r[255 & (c >> 24 ^ t2[o])];
    return c;
  };
  var e = (n, e2 = t) => {
    const r = (t2) => new Uint8Array(t2.length / 2).map(((n2, e3) => parseInt(t2.substring(2 * e3, 2 * (e3 + 1)), 16))), o = (t2) => r(t2)[0], s = /* @__PURE__ */ new Map();
    [, 8364, , 8218, 402, 8222, 8230, 8224, 8225, 710, 8240, 352, 8249, 338, , 381, , , 8216, 8217, 8220, 8221, 8226, 8211, 8212, 732, 8482, 353, 8250, 339, , 382, 376].forEach(((t2, n2) => s.set(t2, n2)));
    const i = new Uint8Array(n.length);
    let c, a, l, f = false, g = 0, h = 42, p = n.length > 13 && "dynEncode" === n.substring(0, 9), u = 0;
    p && (u = 11, a = o(n.substring(9, u)), a <= 1 && (u += 2, h = o(n.substring(11, u))), 1 === a && (u += 8, l = ((t2) => new DataView(r(t2).buffer).getInt32(0, true))(n.substring(13, u))));
    const d = 256 - h;
    for (let t2 = u; t2 < n.length; t2++) if (c = n.charCodeAt(t2), 61 !== c || f) {
      if (92 === c && t2 < n.length - 5 && p) {
        const e3 = n.charCodeAt(t2 + 1);
        117 !== e3 && 85 !== e3 || (c = parseInt(n.substring(t2 + 2, t2 + 6), 16), t2 += 5);
      }
      if (c > 255) {
        const t3 = s.get(c);
        t3 && (c = t3 + 127);
      }
      f && (f = false, c -= 64), i[g++] = c < h && c > 0 ? c + d : c - h;
    } else f = true;
    const m = i.subarray(0, g);
    if (p && 1 === a) {
      const t2 = e2(m);
      if (t2 !== l) {
        const n2 = "Decode failed crc32 validation";
        throw console.error("`simple-yenc`\n", n2 + "\n", "Expected: " + l + "; Got: " + t2 + "\n", "Visit https://github.com/eshaz/simple-yenc for more information"), Error(n2);
      }
    }
    return m;
  };
  function WASMAudioDecoderCommon() {
    const uint8Array2 = Uint8Array;
    const float32Array = Float32Array;
    if (!WASMAudioDecoderCommon.modules) {
      Object.defineProperties(WASMAudioDecoderCommon, {
        modules: {
          value: /* @__PURE__ */ new WeakMap()
        },
        setModule: {
          value(Ref, module) {
            WASMAudioDecoderCommon.modules.set(Ref, Promise.resolve(module));
          }
        },
        getModule: {
          value(Ref, wasmString) {
            let module = WASMAudioDecoderCommon.modules.get(Ref);
            if (!module) {
              if (!wasmString) {
                wasmString = Ref.wasm;
                module = WASMAudioDecoderCommon.inflateDynEncodeString(
                  wasmString
                ).then((data3) => WebAssembly.compile(data3));
              } else {
                module = WebAssembly.compile(e(wasmString));
              }
              WASMAudioDecoderCommon.modules.set(Ref, module);
            }
            return module;
          }
        },
        concatFloat32: {
          value(buffers, length2) {
            let ret = new float32Array(length2), i = 0, offset = 0;
            while (i < buffers.length) {
              ret.set(buffers[i], offset);
              offset += buffers[i++].length;
            }
            return ret;
          }
        },
        getDecodedAudio: {
          value: (errors, channelData, samplesDecoded, sampleRate2, bitDepth2) => ({
            errors,
            channelData,
            samplesDecoded,
            sampleRate: sampleRate2,
            bitDepth: bitDepth2
          })
        },
        getDecodedAudioMultiChannel: {
          value(errors, input, channelsDecoded, samplesDecoded, sampleRate2, bitDepth2) {
            let channelData = [], i, j;
            for (i = 0; i < channelsDecoded; i++) {
              const channel2 = [];
              for (j = 0; j < input.length; ) channel2.push(input[j++][i] || []);
              channelData.push(
                WASMAudioDecoderCommon.concatFloat32(channel2, samplesDecoded)
              );
            }
            return WASMAudioDecoderCommon.getDecodedAudio(
              errors,
              channelData,
              samplesDecoded,
              sampleRate2,
              bitDepth2
            );
          }
        },
        /*
         ******************
         * Compression Code
         ******************
         */
        inflateDynEncodeString: {
          value(source) {
            source = e(source);
            return new Promise((resolve) => {
              const puffString = String.raw`dynEncode012804c7886d()((()>+*§§)§,§§§§)§+§§§)§+.-()(*)-+)(.7*§)i¸¸,3§(i¸¸,3/G+.¡*(,(,3+)2å:-),§H(P*DI*H(P*@I++hH)H*r,hH(H(P*<J,i)^*<H,H(P*4U((I-H(H*i0J,^*DH+H-H*I+H,I*4)33H(H*H)^*DH(H+H)^*@H+i§H)i§3æ*).§K(iHI/+§H,iHn,§H+i(H+i(rCJ0I,H*I-+hH,,hH(H-V)(i)J.H.W)(i)c)(H,i)I,H-i*I-4)33i(I.*hH(V)(H+n5(H(i*I-i(I,i)I.+hH,i*J+iHn,hi(I-i*I,+hH,H/H-c)(H,iFn,hi(I,+hH,H0n5-H*V)(J(,hH/H(i)J(H(V)(J(i)c)(H)H(i)H,c)(3H*i*I*H,i)I,4(3(-H(H,W)(H-I-H,i*I,4)3(3(3H,H-I1H+I,H.i)H1V)(J.i(v5(33H.-H(H,i(c)(H,i*I,4)333)-§i*I*+§H*iHn,hi73H,H(i)8(H+J+H)P*(H*V)(J-r,§H)P*,H.i)H+H,i)V)(-H*i*I*H+i)I+H-H.I.H,H-i)I,4)333Ã+)-§iø7i(^*(iü7I,*h+hH+iDn,h*hilI+i)I,+hH+,hH+iô7H,c)(i)H+i´8W)(H,I,H+i*I+4)-+hH(H)8*J-i(p5.*h*h*hH-i')u,hH(P*(J+,hH(P*0J,H(P*,n50H+H,H-b((3H(P*0i)I.4)3H-i¨*n5*H-iÅ*s,hi73H-i)J+V)&+I,H(H+V)æ,8(I.H(H*8*J-i(p51H-i)J+i¸7V)(H(H+iø7V)(8(J/H(P*0J+s,hi73H+H,H.J,I.H(P*(m5(H.H(P*,s5.+hH,m5*H(P*(J.H+H.H+H/U((b((H(H(P*0i)J+^*0H,i)I,4(3(3H(H.^*03H-i¨*o5)33i(73(3(3-H,H+i)c)(H,i*I,H+i)I+4)33i)I-3H-3!2)0§K(i2J,L(H,H(^*(H,H*^*4H,i(^*0H,i(^*DH,j(_*<H,H)P*(^*,H,H+P*(^*8*h*h+hH,i)8(I3i§I**h*h*h*h*h*h*hH,i*8(6+(),03H,j(_*@i*I-H,P*<J.i,J(H,P*8J/s50H,H.i+J0^*<i¦I*H.H,P*4J1J.U(*H.U((J2i')o5/H.U()I.H,H(^*<H0H1U((H.i0J.i§i0i')o5/H/H.H2J*H(J.q50H,P*0J/H*I-H,P*(J0,hH,P*,H-q,hi)I-423+hH*m5+H/H0H(H1U((b((H/i)I/H(i)I(H*i)I*4(3(3H,H.^*<H,H-^*04*3iØ1U((5+i(I(i¨7i1^*(i$6iè1^*(i°7iè6^*(i¬7iÈ6^*(+hH(iÈ*n,hiÈ*I(+hH(i¨,n,hi¨,I(+hH(iØ,n,hiØ,I(+hH(iè,o,hH,i-H(i0c)(H(i*I(4)33iè1i1H,i-iÈ*8)Bi(I(+hH(ido,hH,i-H(i-c)(H(i*I(4)33iÈ6iè6H,i-iF8)BiØ1i)b((41-H,i-H(i/c)(H(i*I(4)3(3(-H,i-H(i1c)(H(i*I(4)3(3(-H,i-H(i0c)(H(i*I(4)3(3(3H,H/^*0H,H(^*<3i(I*4*3H,H,i¸)^*TH,H,iø-^*PH,H,iX^*LH,H,i(^*HH,i-8(I(H,i-8(I-i¥I*H,i,8(I.H(iErH-iEr5)H(i©*I1H-i)I0i(i;H.i,J(i(H(i(rCJ(J*H*i;sCI*i¨1I-H(I/+hH/,hH,i-H-V)(i)H,i+8(c)(H/i)I/H-i*I-H*i)I*4)-H(i)i¨1I/+hH(H*o,hH,i-H/V)(i)i(c)(H/i*I/H(i)I(4)33i¤I*H,iø-H,i¸)H,i-i;8)5+H0H1I2i(I-+hH-H2p,hH,H,iP8*J*i(p5-H*i7u,hH,i-H-i)H*c)(H-i)I-4*3i(I/i+I.i+I(*h*h*hH*i86*(*)3H-m,hi£I*403H-i)H,W)-I/i*I(4)3i3I.i/I(3H2H,H(8(H.J(H-J.p,hi¢I*4.3H,i-H-i)I*+hH(,hH*H/c)(H*i*I*H(i)I(4)-H.I-4+3(3(33H,W)1m,hiI*4,3H,iø-H,i¸)H,i-H18)J(,hi¡I*H(i(p5,H1H,V)ú-H,V)ø-o5,3H,i(H,iXH,i-H1i)H08)J(,hi I*H(i(p5,H0H,V)H,V)o5,3H,H,iPH,iH8+I*4+3(3(3H,i$6i¬78+I*3H*H3m5(3i)I-H*i(r5)3H)H,P*0^*(H+H,P*<^*(H*I-3H,i2L(H-33Á)+(i¨03b+(,(-(.(/(0(1(2(3(5(7(9(;(?(C(G(K(S([(c(k({(((«(Ë(ë((*)(iø03O)()()()(*(*(*(*(+(+(+(+(,(,(,(,(-(-(-(-(i¨13M8(9(:(((0(/(1(.(2(-(3(,(4(+(5(*(6()(7(T7*S7US0U `;
              WASMAudioDecoderCommon.getModule(WASMAudioDecoderCommon, puffString).then((wasm) => WebAssembly.instantiate(wasm, {})).then(({ exports }) => {
                const instanceExports = new Map(Object.entries(exports));
                const puff = instanceExports.get("puff");
                const memory = instanceExports.get("memory")["buffer"];
                const dataArray = new uint8Array2(memory);
                const heapView = new DataView(memory);
                let heapPos = instanceExports.get("__heap_base");
                const sourceLength = source.length;
                const sourceLengthPtr = heapPos;
                heapPos += 4;
                heapView.setInt32(sourceLengthPtr, sourceLength, true);
                const sourcePtr = heapPos;
                heapPos += sourceLength;
                dataArray.set(source, sourcePtr);
                const destLengthPtr = heapPos;
                heapPos += 4;
                heapView.setInt32(
                  destLengthPtr,
                  dataArray.byteLength - heapPos,
                  true
                );
                puff(heapPos, destLengthPtr, sourcePtr, sourceLengthPtr);
                resolve(
                  dataArray.slice(
                    heapPos,
                    heapPos + heapView.getInt32(destLengthPtr, true)
                  )
                );
              });
            });
          }
        }
      });
    }
    Object.defineProperty(this, "wasm", {
      enumerable: true,
      get: () => this._wasm
    });
    this.getOutputChannels = (outputData, channelsDecoded, samplesDecoded) => {
      let output = [], i = 0;
      while (i < channelsDecoded)
        output.push(
          outputData.slice(
            i * samplesDecoded,
            i++ * samplesDecoded + samplesDecoded
          )
        );
      return output;
    };
    this.allocateTypedArray = (len, TypedArray, setPointer = true) => {
      const ptr = this._wasm.malloc(TypedArray.BYTES_PER_ELEMENT * len);
      if (setPointer) this._pointers.add(ptr);
      return {
        ptr,
        len,
        buf: new TypedArray(this._wasm.HEAP, ptr, len)
      };
    };
    this.free = () => {
      this._pointers.forEach((ptr) => {
        this._wasm.free(ptr);
      });
      this._pointers.clear();
    };
    this.codeToString = (ptr) => {
      const characters = [], heap = new Uint8Array(this._wasm.HEAP);
      for (let character = heap[ptr]; character !== 0; character = heap[++ptr])
        characters.push(character);
      return String.fromCharCode.apply(null, characters);
    };
    this.addError = (errors, message, frameLength2, frameNumber2, inputBytes, outputSamples) => {
      errors.push({
        message,
        frameLength: frameLength2,
        frameNumber: frameNumber2,
        inputBytes,
        outputSamples
      });
    };
    this.instantiate = (_EmscriptenWASM, _module) => {
      if (_module) WASMAudioDecoderCommon.setModule(_EmscriptenWASM, _module);
      this._wasm = new _EmscriptenWASM(WASMAudioDecoderCommon).instantiate();
      this._pointers = /* @__PURE__ */ new Set();
      return this._wasm.ready.then(() => this);
    };
  }
  var empty_worker_default = null;
  var getWorker = () => globalThis.Worker || empty_worker_default;
  var WASMAudioDecoderWorker = class extends getWorker() {
    constructor(options, name, Decoder2, EmscriptenWASM2) {
      if (!WASMAudioDecoderCommon.modules) new WASMAudioDecoderCommon();
      let source = WASMAudioDecoderCommon.modules.get(Decoder2);
      if (!source) {
        let type = "text/javascript", isNode, webworkerSourceCode = `'use strict';(${((_Decoder, _WASMAudioDecoderCommon, _EmscriptenWASM) => {
          let decoder22, moduleResolve, modulePromise = new Promise((resolve) => {
            moduleResolve = resolve;
          });
          self.onmessage = ({ data: { id, command, data: data3 } }) => {
            let messagePromise = modulePromise, messagePayload = { id }, transferList;
            if (command === "init") {
              Object.defineProperties(_Decoder, {
                WASMAudioDecoderCommon: { value: _WASMAudioDecoderCommon },
                EmscriptenWASM: { value: _EmscriptenWASM },
                module: { value: data3.module },
                isWebWorker: { value: true }
              });
              decoder22 = new _Decoder(data3.options);
              moduleResolve();
            } else if (command === "free") {
              decoder22.free();
            } else if (command === "ready") {
              messagePromise = messagePromise.then(() => decoder22.ready);
            } else if (command === "reset") {
              messagePromise = messagePromise.then(() => decoder22.reset());
            } else {
              Object.assign(
                messagePayload,
                decoder22[command](
                  // detach buffers
                  Array.isArray(data3) ? data3.map((data4) => new Uint8Array(data4)) : new Uint8Array(data3)
                )
              );
              transferList = messagePayload.channelData ? messagePayload.channelData.map((channel2) => channel2.buffer) : [];
            }
            messagePromise.then(
              () => self.postMessage(messagePayload, transferList)
            );
          };
        }).toString()})(${Decoder2}, ${WASMAudioDecoderCommon}, ${EmscriptenWASM2})`;
        try {
          isNode = typeof process.versions.node !== "undefined";
        } catch {
        }
        source = isNode ? `data:${type};base64,${Buffer.from(webworkerSourceCode).toString(
          "base64"
        )}` : URL.createObjectURL(new Blob([webworkerSourceCode], { type }));
        WASMAudioDecoderCommon.modules.set(Decoder2, source);
      }
      super(source, { name });
      this._id = Number.MIN_SAFE_INTEGER;
      this._enqueuedOperations = /* @__PURE__ */ new Map();
      this.onmessage = ({ data: data3 }) => {
        const { id, ...rest } = data3;
        this._enqueuedOperations.get(id)(rest);
        this._enqueuedOperations.delete(id);
      };
      new EmscriptenWASM2(WASMAudioDecoderCommon).getModule().then((module) => {
        this.postToDecoder("init", { module, options });
      });
    }
    async postToDecoder(command, data3) {
      return new Promise((resolve) => {
        this.postMessage({
          command,
          id: this._id,
          data: data3
        });
        this._enqueuedOperations.set(this._id++, resolve);
      });
    }
    get ready() {
      return this.postToDecoder("ready");
    }
    async free() {
      await this.postToDecoder("free").finally(() => {
        this.terminate();
      });
    }
    async reset() {
      await this.postToDecoder("reset");
    }
  };
  var assignNames = (Class, name) => {
    Object.defineProperty(Class, "name", { value: name });
  };
  var symbol = Symbol;
  var mappingJoin = ", ";
  var channelMappings = (() => {
    const front = "front";
    const side = "side";
    const rear = "rear";
    const left = "left";
    const center = "center";
    const right = "right";
    return ["", front + " ", side + " ", rear + " "].map(
      (x) => [
        [left, right],
        [left, right, center],
        [left, center, right],
        [center, left, right],
        [center]
      ].flatMap((y) => y.map((z) => x + z).join(mappingJoin))
    );
  })();
  var lfe = "LFE";
  var monophonic = "monophonic (mono)";
  var stereo = "stereo";
  var surround = "surround";
  var getChannelMapping = (channelCount, ...mappings) => `${[
    monophonic,
    stereo,
    `linear ${surround}`,
    "quadraphonic",
    `5.0 ${surround}`,
    `5.1 ${surround}`,
    `6.1 ${surround}`,
    `7.1 ${surround}`
  ][channelCount - 1]} (${mappings.join(mappingJoin)})`;
  var vorbisOpusChannelMapping = [
    monophonic,
    getChannelMapping(2, channelMappings[0][0]),
    getChannelMapping(3, channelMappings[0][2]),
    getChannelMapping(4, channelMappings[1][0], channelMappings[3][0]),
    getChannelMapping(5, channelMappings[1][2], channelMappings[3][0]),
    getChannelMapping(6, channelMappings[1][2], channelMappings[3][0], lfe),
    getChannelMapping(7, channelMappings[1][2], channelMappings[2][0], channelMappings[3][4], lfe),
    getChannelMapping(8, channelMappings[1][2], channelMappings[2][0], channelMappings[3][0], lfe)
  ];
  var rate192000 = 192e3;
  var rate176400 = 176400;
  var rate96000 = 96e3;
  var rate88200 = 88200;
  var rate64000 = 64e3;
  var rate48000 = 48e3;
  var rate44100 = 44100;
  var rate32000 = 32e3;
  var rate24000 = 24e3;
  var rate22050 = 22050;
  var rate16000 = 16e3;
  var rate12000 = 12e3;
  var rate11025 = 11025;
  var rate8000 = 8e3;
  var rate7350 = 7350;
  var absoluteGranulePosition = "absoluteGranulePosition";
  var bandwidth = "bandwidth";
  var bitDepth = "bitDepth";
  var bitrate = "bitrate";
  var bitrateMaximum = bitrate + "Maximum";
  var bitrateMinimum = bitrate + "Minimum";
  var bitrateNominal = bitrate + "Nominal";
  var buffer = "buffer";
  var bufferFullness = buffer + "Fullness";
  var codec = "codec";
  var codecFrames = codec + "Frames";
  var coupledStreamCount = "coupledStreamCount";
  var crc = "crc";
  var crc16 = crc + "16";
  var crc32 = crc + "32";
  var data = "data";
  var description = "description";
  var duration = "duration";
  var emphasis = "emphasis";
  var hasOpusPadding = "hasOpusPadding";
  var header = "header";
  var isContinuedPacket = "isContinuedPacket";
  var isCopyrighted = "isCopyrighted";
  var isFirstPage = "isFirstPage";
  var isHome = "isHome";
  var isLastPage = "isLastPage";
  var isOriginal = "isOriginal";
  var isPrivate = "isPrivate";
  var isVbr = "isVbr";
  var layer = "layer";
  var length = "length";
  var mode = "mode";
  var modeExtension = mode + "Extension";
  var mpeg = "mpeg";
  var mpegVersion = mpeg + "Version";
  var numberAACFrames = "numberAACFrames";
  var outputGain = "outputGain";
  var preSkip = "preSkip";
  var profile = "profile";
  var profileBits = symbol();
  var protection = "protection";
  var rawData = "rawData";
  var segments = "segments";
  var subarray = "subarray";
  var version = "version";
  var vorbis = "vorbis";
  var vorbisComments = vorbis + "Comments";
  var vorbisSetup = vorbis + "Setup";
  var block = "block";
  var blockingStrategy = block + "ingStrategy";
  var blockingStrategyBits = symbol();
  var blockSize = block + "Size";
  var blocksize0 = block + "size0";
  var blocksize1 = block + "size1";
  var blockSizeBits = symbol();
  var channel = "channel";
  var channelMappingFamily = channel + "MappingFamily";
  var channelMappingTable = channel + "MappingTable";
  var channelMode = channel + "Mode";
  var channelModeBits = symbol();
  var channels = channel + "s";
  var copyright = "copyright";
  var copyrightId = copyright + "Id";
  var copyrightIdStart = copyright + "IdStart";
  var frame = "frame";
  var frameCount = frame + "Count";
  var frameLength = frame + "Length";
  var Number2 = "Number";
  var frameNumber = frame + Number2;
  var framePadding = frame + "Padding";
  var frameSize = frame + "Size";
  var Rate = "Rate";
  var inputSampleRate = "inputSample" + Rate;
  var page = "page";
  var pageChecksum = page + "Checksum";
  var pageSegmentBytes = symbol();
  var pageSegmentTable = page + "SegmentTable";
  var pageSequenceNumber = page + "Sequence" + Number2;
  var sample = "sample";
  var sampleNumber = sample + Number2;
  var sampleRate = sample + Rate;
  var sampleRateBits = symbol();
  var samples = sample + "s";
  var stream = "stream";
  var streamCount = stream + "Count";
  var streamInfo = stream + "Info";
  var streamSerialNumber = stream + "Serial" + Number2;
  var streamStructureVersion = stream + "StructureVersion";
  var total = "total";
  var totalBytesOut = total + "BytesOut";
  var totalDuration = total + "Duration";
  var totalSamples = total + "Samples";
  var readRawData = symbol();
  var incrementRawData = symbol();
  var mapCodecFrameStats = symbol();
  var mapFrameStats = symbol();
  var logWarning = symbol();
  var logError2 = symbol();
  var syncFrame = symbol();
  var fixedLengthFrameSync = symbol();
  var getHeader = symbol();
  var setHeader = symbol();
  var getFrame = symbol();
  var parseFrame = symbol();
  var parseOggPage = symbol();
  var checkCodecUpdate = symbol();
  var reset = symbol();
  var enable = symbol();
  var getHeaderFromUint8Array = symbol();
  var checkFrameFooterCrc16 = symbol();
  var uint8Array = Uint8Array;
  var dataView = DataView;
  var reserved = "reserved";
  var bad = "bad";
  var free = "free";
  var none = "none";
  var sixteenBitCRC = "16bit CRC";
  var getCrcTable = (crcTable, crcInitialValueFunction, crcFunction) => {
    for (let byte = 0; byte < crcTable[length]; byte++) {
      let crc2 = crcInitialValueFunction(byte);
      for (let bit = 8; bit > 0; bit--) crc2 = crcFunction(crc2);
      crcTable[byte] = crc2;
    }
    return crcTable;
  };
  var crc8Table = getCrcTable(
    new uint8Array(256),
    (b) => b,
    (crc2) => crc2 & 128 ? 7 ^ crc2 << 1 : crc2 << 1
  );
  var flacCrc16Table = [
    getCrcTable(
      new Uint16Array(256),
      (b) => b << 8,
      (crc2) => crc2 << 1 ^ (crc2 & 1 << 15 ? 32773 : 0)
    )
  ];
  var crc32Table = [
    getCrcTable(
      new Uint32Array(256),
      (b) => b,
      (crc2) => crc2 >>> 1 ^ (crc2 & 1) * 3988292384
    )
  ];
  for (let i = 0; i < 15; i++) {
    flacCrc16Table.push(new Uint16Array(256));
    crc32Table.push(new Uint32Array(256));
    for (let j = 0; j <= 255; j++) {
      flacCrc16Table[i + 1][j] = flacCrc16Table[0][flacCrc16Table[i][j] >>> 8] ^ flacCrc16Table[i][j] << 8;
      crc32Table[i + 1][j] = crc32Table[i][j] >>> 8 ^ crc32Table[0][crc32Table[i][j] & 255];
    }
  }
  var crc8 = (data3) => {
    let crc2 = 0;
    const dataLength = data3[length];
    for (let i = 0; i !== dataLength; i++) crc2 = crc8Table[crc2 ^ data3[i]];
    return crc2;
  };
  var flacCrc16 = (data3) => {
    const dataLength = data3[length];
    const crcChunkSize = dataLength - 16;
    let crc2 = 0;
    let i = 0;
    while (i <= crcChunkSize) {
      crc2 ^= data3[i++] << 8 | data3[i++];
      crc2 = flacCrc16Table[15][crc2 >> 8] ^ flacCrc16Table[14][crc2 & 255] ^ flacCrc16Table[13][data3[i++]] ^ flacCrc16Table[12][data3[i++]] ^ flacCrc16Table[11][data3[i++]] ^ flacCrc16Table[10][data3[i++]] ^ flacCrc16Table[9][data3[i++]] ^ flacCrc16Table[8][data3[i++]] ^ flacCrc16Table[7][data3[i++]] ^ flacCrc16Table[6][data3[i++]] ^ flacCrc16Table[5][data3[i++]] ^ flacCrc16Table[4][data3[i++]] ^ flacCrc16Table[3][data3[i++]] ^ flacCrc16Table[2][data3[i++]] ^ flacCrc16Table[1][data3[i++]] ^ flacCrc16Table[0][data3[i++]];
    }
    while (i !== dataLength)
      crc2 = (crc2 & 255) << 8 ^ flacCrc16Table[0][crc2 >> 8 ^ data3[i++]];
    return crc2;
  };
  var crc32Function = (data3) => {
    const dataLength = data3[length];
    const crcChunkSize = dataLength - 16;
    let crc2 = 0;
    let i = 0;
    while (i <= crcChunkSize)
      crc2 = crc32Table[15][(data3[i++] ^ crc2) & 255] ^ crc32Table[14][(data3[i++] ^ crc2 >>> 8) & 255] ^ crc32Table[13][(data3[i++] ^ crc2 >>> 16) & 255] ^ crc32Table[12][data3[i++] ^ crc2 >>> 24] ^ crc32Table[11][data3[i++]] ^ crc32Table[10][data3[i++]] ^ crc32Table[9][data3[i++]] ^ crc32Table[8][data3[i++]] ^ crc32Table[7][data3[i++]] ^ crc32Table[6][data3[i++]] ^ crc32Table[5][data3[i++]] ^ crc32Table[4][data3[i++]] ^ crc32Table[3][data3[i++]] ^ crc32Table[2][data3[i++]] ^ crc32Table[1][data3[i++]] ^ crc32Table[0][data3[i++]];
    while (i !== dataLength)
      crc2 = crc32Table[0][(crc2 ^ data3[i++]) & 255] ^ crc2 >>> 8;
    return crc2 ^ -1;
  };
  var concatBuffers = (...buffers) => {
    const buffer2 = new uint8Array(
      buffers.reduce((acc, buf) => acc + buf[length], 0)
    );
    buffers.reduce((offset, buf) => {
      buffer2.set(buf, offset);
      return offset + buf[length];
    }, 0);
    return buffer2;
  };
  var bytesToString = (bytes) => String.fromCharCode(...bytes);
  var reverseTable = [0, 8, 4, 12, 2, 10, 6, 14, 1, 9, 5, 13, 3, 11, 7, 15];
  var reverse = (val) => reverseTable[val & 15] << 4 | reverseTable[val >> 4];
  var BitReader = class {
    constructor(data3) {
      this._data = data3;
      this._pos = data3[length] * 8;
    }
    set position(position) {
      this._pos = position;
    }
    get position() {
      return this._pos;
    }
    read(bits) {
      const byte = Math.floor(this._pos / 8);
      const bit = this._pos % 8;
      this._pos -= bits;
      const window2 = (reverse(this._data[byte - 1]) << 8) + reverse(this._data[byte]);
      return window2 >> 7 - bit & 255;
    }
  };
  var readInt64le = (view, offset) => {
    try {
      return view.getBigInt64(offset, true);
    } catch {
      const sign = view.getUint8(offset + 7) & 128 ? -1 : 1;
      let firstPart = view.getUint32(offset, true);
      let secondPart = view.getUint32(offset + 4, true);
      if (sign === -1) {
        firstPart = ~firstPart + 1;
        secondPart = ~secondPart + 1;
      }
      if (secondPart > 1048575) {
        console.warn("This platform does not support BigInt");
      }
      return sign * (firstPart + secondPart * 2 ** 32);
    }
  };
  var HeaderCache = class {
    constructor(onCodecHeader, onCodecUpdate) {
      this._onCodecHeader = onCodecHeader;
      this._onCodecUpdate = onCodecUpdate;
      this[reset]();
    }
    [enable]() {
      this._isEnabled = true;
    }
    [reset]() {
      this._headerCache = /* @__PURE__ */ new Map();
      this._codecUpdateData = /* @__PURE__ */ new WeakMap();
      this._codecHeaderSent = false;
      this._codecShouldUpdate = false;
      this._bitrate = null;
      this._isEnabled = false;
    }
    [checkCodecUpdate](bitrate2, totalDuration2) {
      if (this._onCodecUpdate) {
        if (this._bitrate !== bitrate2) {
          this._bitrate = bitrate2;
          this._codecShouldUpdate = true;
        }
        const codecData = this._codecUpdateData.get(
          this._headerCache.get(this._currentHeader)
        );
        if (this._codecShouldUpdate && codecData) {
          this._onCodecUpdate(
            {
              bitrate: bitrate2,
              ...codecData
            },
            totalDuration2
          );
        }
        this._codecShouldUpdate = false;
      }
    }
    [getHeader](key) {
      const header3 = this._headerCache.get(key);
      if (header3) {
        this._updateCurrentHeader(key);
      }
      return header3;
    }
    [setHeader](key, header3, codecUpdateFields) {
      if (this._isEnabled) {
        if (!this._codecHeaderSent) {
          this._onCodecHeader({ ...header3 });
          this._codecHeaderSent = true;
        }
        this._updateCurrentHeader(key);
        this._headerCache.set(key, header3);
        this._codecUpdateData.set(header3, codecUpdateFields);
      }
    }
    _updateCurrentHeader(key) {
      if (this._onCodecUpdate && key !== this._currentHeader) {
        this._codecShouldUpdate = true;
        this._currentHeader = key;
      }
    }
  };
  var headerStore = /* @__PURE__ */ new WeakMap();
  var frameStore = /* @__PURE__ */ new WeakMap();
  var Parser = class {
    constructor(codecParser, headerCache) {
      this._codecParser = codecParser;
      this._headerCache = headerCache;
    }
    *[syncFrame]() {
      let frameData;
      do {
        frameData = yield* this.Frame[getFrame](
          this._codecParser,
          this._headerCache,
          0
        );
        if (frameData) return frameData;
        this._codecParser[incrementRawData](1);
      } while (true);
    }
    /**
     * @description Searches for Frames within bytes containing a sequence of known codec frames.
     * @param {boolean} ignoreNextFrame Set to true to return frames even if the next frame may not exist at the expected location
     * @returns {Frame}
     */
    *[fixedLengthFrameSync](ignoreNextFrame) {
      let frameData = yield* this[syncFrame]();
      const frameLength2 = frameStore.get(frameData)[length];
      if (ignoreNextFrame || this._codecParser._flushing || // check if there is a frame right after this one
      (yield* this.Header[getHeader](
        this._codecParser,
        this._headerCache,
        frameLength2
      ))) {
        this._headerCache[enable]();
        this._codecParser[incrementRawData](frameLength2);
        this._codecParser[mapFrameStats](frameData);
        return frameData;
      }
      this._codecParser[logWarning](
        `Missing ${frame} at ${frameLength2} bytes from current position.`,
        `Dropping current ${frame} and trying again.`
      );
      this._headerCache[reset]();
      this._codecParser[incrementRawData](1);
    }
  };
  var Frame = class {
    constructor(headerValue, dataValue) {
      frameStore.set(this, { [header]: headerValue });
      this[data] = dataValue;
    }
  };
  var CodecFrame = class extends Frame {
    static *[getFrame](Header, Frame2, codecParser, headerCache, readOffset) {
      const headerValue = yield* Header[getHeader](
        codecParser,
        headerCache,
        readOffset
      );
      if (headerValue) {
        const frameLengthValue = headerStore.get(headerValue)[frameLength];
        const samplesValue = headerStore.get(headerValue)[samples];
        const frame2 = (yield* codecParser[readRawData](
          frameLengthValue,
          readOffset
        ))[subarray](0, frameLengthValue);
        return new Frame2(headerValue, frame2, samplesValue);
      } else {
        return null;
      }
    }
    constructor(headerValue, dataValue, samplesValue) {
      super(headerValue, dataValue);
      this[header] = headerValue;
      this[samples] = samplesValue;
      this[duration] = samplesValue / headerValue[sampleRate] * 1e3;
      this[frameNumber] = null;
      this[totalBytesOut] = null;
      this[totalSamples] = null;
      this[totalDuration] = null;
      frameStore.get(this)[length] = dataValue[length];
    }
  };
  var unsynchronizationFlag = "unsynchronizationFlag";
  var extendedHeaderFlag = "extendedHeaderFlag";
  var experimentalFlag = "experimentalFlag";
  var footerPresent = "footerPresent";
  var ID3v2 = class _ID3v2 {
    static *getID3v2Header(codecParser, headerCache, readOffset) {
      const headerLength = 10;
      const header3 = {};
      let data3 = yield* codecParser[readRawData](3, readOffset);
      if (data3[0] !== 73 || data3[1] !== 68 || data3[2] !== 51) return null;
      data3 = yield* codecParser[readRawData](headerLength, readOffset);
      header3[version] = `id3v2.${data3[3]}.${data3[4]}`;
      if (data3[5] & 15) return null;
      header3[unsynchronizationFlag] = !!(data3[5] & 128);
      header3[extendedHeaderFlag] = !!(data3[5] & 64);
      header3[experimentalFlag] = !!(data3[5] & 32);
      header3[footerPresent] = !!(data3[5] & 16);
      if (data3[6] & 128 || data3[7] & 128 || data3[8] & 128 || data3[9] & 128)
        return null;
      const dataLength = data3[6] << 21 | data3[7] << 14 | data3[8] << 7 | data3[9];
      header3[length] = headerLength + dataLength;
      return new _ID3v2(header3);
    }
    constructor(header3) {
      this[version] = header3[version];
      this[unsynchronizationFlag] = header3[unsynchronizationFlag];
      this[extendedHeaderFlag] = header3[extendedHeaderFlag];
      this[experimentalFlag] = header3[experimentalFlag];
      this[footerPresent] = header3[footerPresent];
      this[length] = header3[length];
    }
  };
  var CodecHeader = class {
    /**
     * @private
     */
    constructor(header3) {
      headerStore.set(this, header3);
      this[bitDepth] = header3[bitDepth];
      this[bitrate] = null;
      this[channels] = header3[channels];
      this[channelMode] = header3[channelMode];
      this[sampleRate] = header3[sampleRate];
    }
  };
  var bitrateMatrix = {
    // bits | V1,L1 | V1,L2 | V1,L3 | V2,L1 | V2,L2 & L3
    0: [free, free, free, free, free],
    16: [32, 32, 32, 32, 8],
    // 0b00100000: [64,   48,  40,  48,  16,],
    // 0b00110000: [96,   56,  48,  56,  24,],
    // 0b01000000: [128,  64,  56,  64,  32,],
    // 0b01010000: [160,  80,  64,  80,  40,],
    // 0b01100000: [192,  96,  80,  96,  48,],
    // 0b01110000: [224, 112,  96, 112,  56,],
    // 0b10000000: [256, 128, 112, 128,  64,],
    // 0b10010000: [288, 160, 128, 144,  80,],
    // 0b10100000: [320, 192, 160, 160,  96,],
    // 0b10110000: [352, 224, 192, 176, 112,],
    // 0b11000000: [384, 256, 224, 192, 128,],
    // 0b11010000: [416, 320, 256, 224, 144,],
    // 0b11100000: [448, 384, 320, 256, 160,],
    240: [bad, bad, bad, bad, bad]
  };
  var calcBitrate = (idx, interval, intervalOffset) => 8 * ((idx + intervalOffset) % interval + interval) * (1 << (idx + intervalOffset) / interval) - 8 * interval * (interval / 8 | 0);
  for (let i = 2; i < 15; i++)
    bitrateMatrix[i << 4] = [
      i * 32,
      //                V1,L1
      calcBitrate(i, 4, 0),
      //  V1,L2
      calcBitrate(i, 4, -1),
      // V1,L3
      calcBitrate(i, 8, 4),
      //  V2,L1
      calcBitrate(i, 8, 0)
      //  V2,L2 & L3
    ];
  var v1Layer1 = 0;
  var v1Layer2 = 1;
  var v1Layer3 = 2;
  var v2Layer1 = 3;
  var v2Layer23 = 4;
  var bands = "bands ";
  var to31 = " to 31";
  var layer12ModeExtensions = {
    0: bands + 4 + to31,
    16: bands + 8 + to31,
    32: bands + 12 + to31,
    48: bands + 16 + to31
  };
  var bitrateIndex = "bitrateIndex";
  var v2 = "v2";
  var v1 = "v1";
  var intensityStereo = "Intensity stereo ";
  var msStereo = ", MS stereo ";
  var on = "on";
  var off = "off";
  var layer3ModeExtensions = {
    0: intensityStereo + off + msStereo + off,
    16: intensityStereo + on + msStereo + off,
    32: intensityStereo + off + msStereo + on,
    48: intensityStereo + on + msStereo + on
  };
  var layersValues = {
    0: { [description]: reserved },
    2: {
      [description]: "Layer III",
      [framePadding]: 1,
      [modeExtension]: layer3ModeExtensions,
      [v1]: {
        [bitrateIndex]: v1Layer3,
        [samples]: 1152
      },
      [v2]: {
        [bitrateIndex]: v2Layer23,
        [samples]: 576
      }
    },
    4: {
      [description]: "Layer II",
      [framePadding]: 1,
      [modeExtension]: layer12ModeExtensions,
      [samples]: 1152,
      [v1]: {
        [bitrateIndex]: v1Layer2
      },
      [v2]: {
        [bitrateIndex]: v2Layer23
      }
    },
    6: {
      [description]: "Layer I",
      [framePadding]: 4,
      [modeExtension]: layer12ModeExtensions,
      [samples]: 384,
      [v1]: {
        [bitrateIndex]: v1Layer1
      },
      [v2]: {
        [bitrateIndex]: v2Layer1
      }
    }
  };
  var mpegVersionDescription = "MPEG Version ";
  var isoIec = "ISO/IEC ";
  var mpegVersions = {
    0: {
      [description]: `${mpegVersionDescription}2.5 (later extension of MPEG 2)`,
      [layer]: v2,
      [sampleRate]: {
        0: rate11025,
        4: rate12000,
        8: rate8000,
        12: reserved
      }
    },
    8: { [description]: reserved },
    16: {
      [description]: `${mpegVersionDescription}2 (${isoIec}13818-3)`,
      [layer]: v2,
      [sampleRate]: {
        0: rate22050,
        4: rate24000,
        8: rate16000,
        12: reserved
      }
    },
    24: {
      [description]: `${mpegVersionDescription}1 (${isoIec}11172-3)`,
      [layer]: v1,
      [sampleRate]: {
        0: rate44100,
        4: rate48000,
        8: rate32000,
        12: reserved
      }
    },
    length
  };
  var protectionValues = {
    0: sixteenBitCRC,
    1: none
  };
  var emphasisValues = {
    0: none,
    1: "50/15 ms",
    2: reserved,
    3: "CCIT J.17"
  };
  var channelModes = {
    0: { [channels]: 2, [description]: stereo },
    64: { [channels]: 2, [description]: "joint " + stereo },
    128: { [channels]: 2, [description]: "dual channel" },
    192: { [channels]: 1, [description]: monophonic }
  };
  var MPEGHeader = class _MPEGHeader extends CodecHeader {
    static *[getHeader](codecParser, headerCache, readOffset) {
      const header3 = {};
      const id3v2Header = yield* ID3v2.getID3v2Header(
        codecParser,
        headerCache,
        readOffset
      );
      if (id3v2Header) {
        yield* codecParser[readRawData](id3v2Header[length], readOffset);
        codecParser[incrementRawData](id3v2Header[length]);
      }
      const data3 = yield* codecParser[readRawData](4, readOffset);
      const key = bytesToString(data3[subarray](0, 4));
      const cachedHeader = headerCache[getHeader](key);
      if (cachedHeader) return new _MPEGHeader(cachedHeader);
      if (data3[0] !== 255 || data3[1] < 224) return null;
      const mpegVersionValues2 = mpegVersions[data3[1] & 24];
      if (mpegVersionValues2[description] === reserved) return null;
      const layerBits = data3[1] & 6;
      if (layersValues[layerBits][description] === reserved) return null;
      const layerValues2 = {
        ...layersValues[layerBits],
        ...layersValues[layerBits][mpegVersionValues2[layer]]
      };
      header3[mpegVersion] = mpegVersionValues2[description];
      header3[layer] = layerValues2[description];
      header3[samples] = layerValues2[samples];
      header3[protection] = protectionValues[data3[1] & 1];
      header3[length] = 4;
      header3[bitrate] = bitrateMatrix[data3[2] & 240][layerValues2[bitrateIndex]];
      if (header3[bitrate] === bad) return null;
      header3[sampleRate] = mpegVersionValues2[sampleRate][data3[2] & 12];
      if (header3[sampleRate] === reserved) return null;
      header3[framePadding] = data3[2] & 2 && layerValues2[framePadding];
      header3[isPrivate] = !!(data3[2] & 1);
      header3[frameLength] = Math.floor(
        125 * header3[bitrate] * header3[samples] / header3[sampleRate] + header3[framePadding]
      );
      if (!header3[frameLength]) return null;
      const channelModeBits2 = data3[3] & 192;
      header3[channelMode] = channelModes[channelModeBits2][description];
      header3[channels] = channelModes[channelModeBits2][channels];
      header3[modeExtension] = layerValues2[modeExtension][data3[3] & 48];
      header3[isCopyrighted] = !!(data3[3] & 8);
      header3[isOriginal] = !!(data3[3] & 4);
      header3[emphasis] = emphasisValues[data3[3] & 3];
      if (header3[emphasis] === reserved) return null;
      header3[bitDepth] = 16;
      {
        const { length: length2, frameLength: frameLength2, samples: samples2, ...codecUpdateFields } = header3;
        headerCache[setHeader](key, header3, codecUpdateFields);
      }
      return new _MPEGHeader(header3);
    }
    /**
     * @private
     * Call MPEGHeader.getHeader(Array<Uint8>) to get instance
     */
    constructor(header3) {
      super(header3);
      this[bitrate] = header3[bitrate];
      this[emphasis] = header3[emphasis];
      this[framePadding] = header3[framePadding];
      this[isCopyrighted] = header3[isCopyrighted];
      this[isOriginal] = header3[isOriginal];
      this[isPrivate] = header3[isPrivate];
      this[layer] = header3[layer];
      this[modeExtension] = header3[modeExtension];
      this[mpegVersion] = header3[mpegVersion];
      this[protection] = header3[protection];
    }
  };
  var MPEGFrame = class _MPEGFrame extends CodecFrame {
    static *[getFrame](codecParser, headerCache, readOffset) {
      return yield* super[getFrame](
        MPEGHeader,
        _MPEGFrame,
        codecParser,
        headerCache,
        readOffset
      );
    }
    constructor(header3, frame2, samples2) {
      super(header3, frame2, samples2);
    }
  };
  var MPEGParser = class extends Parser {
    constructor(codecParser, headerCache, onCodec) {
      super(codecParser, headerCache);
      this.Frame = MPEGFrame;
      this.Header = MPEGHeader;
      onCodec(this[codec]);
    }
    get [codec]() {
      return mpeg;
    }
    *[parseFrame]() {
      return yield* this[fixedLengthFrameSync]();
    }
  };
  var mpegVersionValues = {
    0: "MPEG-4",
    8: "MPEG-2"
  };
  var layerValues = {
    0: "valid",
    2: bad,
    4: bad,
    6: bad
  };
  var protectionValues2 = {
    0: sixteenBitCRC,
    1: none
  };
  var profileValues = {
    0: "AAC Main",
    64: "AAC LC (Low Complexity)",
    128: "AAC SSR (Scalable Sample Rate)",
    192: "AAC LTP (Long Term Prediction)"
  };
  var sampleRates = {
    0: rate96000,
    4: rate88200,
    8: rate64000,
    12: rate48000,
    16: rate44100,
    20: rate32000,
    24: rate24000,
    28: rate22050,
    32: rate16000,
    36: rate12000,
    40: rate11025,
    44: rate8000,
    48: rate7350,
    52: reserved,
    56: reserved,
    60: "frequency is written explicitly"
  };
  var channelModeValues = {
    0: { [channels]: 0, [description]: "Defined in AOT Specific Config" },
    /*
    'monophonic (mono)'
    'stereo (left, right)'
    'linear surround (front center, front left, front right)'
    'quadraphonic (front center, front left, front right, rear center)'
    '5.0 surround (front center, front left, front right, rear left, rear right)'
    '5.1 surround (front center, front left, front right, rear left, rear right, LFE)'
    '7.1 surround (front center, front left, front right, side left, side right, rear left, rear right, LFE)'
    */
    64: { [channels]: 1, [description]: monophonic },
    128: { [channels]: 2, [description]: getChannelMapping(2, channelMappings[0][0]) },
    192: { [channels]: 3, [description]: getChannelMapping(3, channelMappings[1][3]) },
    256: { [channels]: 4, [description]: getChannelMapping(4, channelMappings[1][3], channelMappings[3][4]) },
    320: { [channels]: 5, [description]: getChannelMapping(5, channelMappings[1][3], channelMappings[3][0]) },
    384: { [channels]: 6, [description]: getChannelMapping(6, channelMappings[1][3], channelMappings[3][0], lfe) },
    448: { [channels]: 8, [description]: getChannelMapping(8, channelMappings[1][3], channelMappings[2][0], channelMappings[3][0], lfe) }
  };
  var AACHeader = class _AACHeader extends CodecHeader {
    static *[getHeader](codecParser, headerCache, readOffset) {
      const header3 = {};
      const data3 = yield* codecParser[readRawData](7, readOffset);
      const key = bytesToString([
        data3[0],
        data3[1],
        data3[2],
        data3[3] & 252 | data3[6] & 3
        // frame length, buffer fullness varies so don't cache it
      ]);
      const cachedHeader = headerCache[getHeader](key);
      if (!cachedHeader) {
        if (data3[0] !== 255 || data3[1] < 240) return null;
        header3[mpegVersion] = mpegVersionValues[data3[1] & 8];
        header3[layer] = layerValues[data3[1] & 6];
        if (header3[layer] === bad) return null;
        const protectionBit = data3[1] & 1;
        header3[protection] = protectionValues2[protectionBit];
        header3[length] = protectionBit ? 7 : 9;
        header3[profileBits] = data3[2] & 192;
        header3[sampleRateBits] = data3[2] & 60;
        const privateBit = data3[2] & 2;
        header3[profile] = profileValues[header3[profileBits]];
        header3[sampleRate] = sampleRates[header3[sampleRateBits]];
        if (header3[sampleRate] === reserved) return null;
        header3[isPrivate] = !!privateBit;
        header3[channelModeBits] = (data3[2] << 8 | data3[3]) & 448;
        header3[channelMode] = channelModeValues[header3[channelModeBits]][description];
        header3[channels] = channelModeValues[header3[channelModeBits]][channels];
        header3[isOriginal] = !!(data3[3] & 32);
        header3[isHome] = !!(data3[3] & 8);
        header3[copyrightId] = !!(data3[3] & 8);
        header3[copyrightIdStart] = !!(data3[3] & 4);
        header3[bitDepth] = 16;
        header3[samples] = 1024;
        header3[numberAACFrames] = data3[6] & 3;
        {
          const {
            length: length2,
            channelModeBits: channelModeBits2,
            profileBits: profileBits2,
            sampleRateBits: sampleRateBits2,
            frameLength: frameLength2,
            samples: samples2,
            numberAACFrames: numberAACFrames2,
            ...codecUpdateFields
          } = header3;
          headerCache[setHeader](key, header3, codecUpdateFields);
        }
      } else {
        Object.assign(header3, cachedHeader);
      }
      header3[frameLength] = (data3[3] << 11 | data3[4] << 3 | data3[5] >> 5) & 8191;
      if (!header3[frameLength]) return null;
      const bufferFullnessBits = (data3[5] << 6 | data3[6] >> 2) & 2047;
      header3[bufferFullness] = bufferFullnessBits === 2047 ? "VBR" : bufferFullnessBits;
      return new _AACHeader(header3);
    }
    /**
     * @private
     * Call AACHeader.getHeader(Array<Uint8>) to get instance
     */
    constructor(header3) {
      super(header3);
      this[copyrightId] = header3[copyrightId];
      this[copyrightIdStart] = header3[copyrightIdStart];
      this[bufferFullness] = header3[bufferFullness];
      this[isHome] = header3[isHome];
      this[isOriginal] = header3[isOriginal];
      this[isPrivate] = header3[isPrivate];
      this[layer] = header3[layer];
      this[length] = header3[length];
      this[mpegVersion] = header3[mpegVersion];
      this[numberAACFrames] = header3[numberAACFrames];
      this[profile] = header3[profile];
      this[protection] = header3[protection];
    }
    get audioSpecificConfig() {
      const header3 = headerStore.get(this);
      const audioSpecificConfig = header3[profileBits] + 64 << 5 | header3[sampleRateBits] << 5 | header3[channelModeBits] >> 3;
      const bytes = new uint8Array(2);
      new dataView(bytes[buffer]).setUint16(0, audioSpecificConfig, false);
      return bytes;
    }
  };
  var AACFrame = class _AACFrame extends CodecFrame {
    static *[getFrame](codecParser, headerCache, readOffset) {
      return yield* super[getFrame](
        AACHeader,
        _AACFrame,
        codecParser,
        headerCache,
        readOffset
      );
    }
    constructor(header3, frame2, samples2) {
      super(header3, frame2, samples2);
    }
  };
  var AACParser = class extends Parser {
    constructor(codecParser, headerCache, onCodec) {
      super(codecParser, headerCache);
      this.Frame = AACFrame;
      this.Header = AACHeader;
      onCodec(this[codec]);
    }
    get [codec]() {
      return "aac";
    }
    *[parseFrame]() {
      return yield* this[fixedLengthFrameSync]();
    }
  };
  var FLACFrame = class _FLACFrame extends CodecFrame {
    static _getFrameFooterCrc16(data3) {
      return (data3[data3[length] - 2] << 8) + data3[data3[length] - 1];
    }
    // check frame footer crc
    // https://xiph.org/flac/format.html#frame_footer
    static [checkFrameFooterCrc16](data3) {
      const expectedCrc16 = _FLACFrame._getFrameFooterCrc16(data3);
      const actualCrc16 = flacCrc16(data3[subarray](0, -2));
      return expectedCrc16 === actualCrc16;
    }
    constructor(data3, header3, streamInfoValue) {
      header3[streamInfo] = streamInfoValue;
      header3[crc16] = _FLACFrame._getFrameFooterCrc16(data3);
      super(header3, data3, headerStore.get(header3)[samples]);
    }
  };
  var getFromStreamInfo = "get from STREAMINFO metadata block";
  var blockingStrategyValues = {
    0: "Fixed",
    1: "Variable"
  };
  var blockSizeValues = {
    0: reserved,
    16: 192
    // 0b00100000: 576,
    // 0b00110000: 1152,
    // 0b01000000: 2304,
    // 0b01010000: 4608,
    // 0b01100000: "8-bit (blocksize-1) from end of header",
    // 0b01110000: "16-bit (blocksize-1) from end of header",
    // 0b10000000: 256,
    // 0b10010000: 512,
    // 0b10100000: 1024,
    // 0b10110000: 2048,
    // 0b11000000: 4096,
    // 0b11010000: 8192,
    // 0b11100000: 16384,
    // 0b11110000: 32768,
  };
  for (let i = 2; i < 16; i++)
    blockSizeValues[i << 4] = i < 6 ? 576 * 2 ** (i - 2) : 2 ** i;
  var sampleRateValues = {
    0: getFromStreamInfo,
    1: rate88200,
    2: rate176400,
    3: rate192000,
    4: rate8000,
    5: rate16000,
    6: rate22050,
    7: rate24000,
    8: rate32000,
    9: rate44100,
    10: rate48000,
    11: rate96000,
    // 0b00001100: "8-bit sample rate (in kHz) from end of header",
    // 0b00001101: "16-bit sample rate (in Hz) from end of header",
    // 0b00001110: "16-bit sample rate (in tens of Hz) from end of header",
    15: bad
  };
  var channelAssignments = {
    /*'
    'monophonic (mono)'
    'stereo (left, right)'
    'linear surround (left, right, center)'
    'quadraphonic (front left, front right, rear left, rear right)'
    '5.0 surround (front left, front right, front center, rear left, rear right)'
    '5.1 surround (front left, front right, front center, LFE, rear left, rear right)'
    '6.1 surround (front left, front right, front center, LFE, rear center, side left, side right)'
    '7.1 surround (front left, front right, front center, LFE, rear left, rear right, side left, side right)'
    */
    0: { [channels]: 1, [description]: monophonic },
    16: { [channels]: 2, [description]: getChannelMapping(2, channelMappings[0][0]) },
    32: { [channels]: 3, [description]: getChannelMapping(3, channelMappings[0][1]) },
    48: { [channels]: 4, [description]: getChannelMapping(4, channelMappings[1][0], channelMappings[3][0]) },
    64: { [channels]: 5, [description]: getChannelMapping(5, channelMappings[1][1], channelMappings[3][0]) },
    80: { [channels]: 6, [description]: getChannelMapping(6, channelMappings[1][1], lfe, channelMappings[3][0]) },
    96: { [channels]: 7, [description]: getChannelMapping(7, channelMappings[1][1], lfe, channelMappings[3][4], channelMappings[2][0]) },
    112: { [channels]: 8, [description]: getChannelMapping(8, channelMappings[1][1], lfe, channelMappings[3][0], channelMappings[2][0]) },
    128: { [channels]: 2, [description]: `${stereo} (left, diff)` },
    144: { [channels]: 2, [description]: `${stereo} (diff, right)` },
    160: { [channels]: 2, [description]: `${stereo} (avg, diff)` },
    176: reserved,
    192: reserved,
    208: reserved,
    224: reserved,
    240: reserved
  };
  var bitDepthValues = {
    0: getFromStreamInfo,
    2: 8,
    4: 12,
    6: reserved,
    8: 16,
    10: 20,
    12: 24,
    14: reserved
  };
  var FLACHeader = class _FLACHeader extends CodecHeader {
    // https://datatracker.ietf.org/doc/html/rfc3629#section-3
    //    Char. number range  |        UTF-8 octet sequence
    //    (hexadecimal)    |              (binary)
    // --------------------+---------------------------------------------
    // 0000 0000-0000 007F | 0xxxxxxx
    // 0000 0080-0000 07FF | 110xxxxx 10xxxxxx
    // 0000 0800-0000 FFFF | 1110xxxx 10xxxxxx 10xxxxxx
    // 0001 0000-0010 FFFF | 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
    static _decodeUTF8Int(data3) {
      if (data3[0] > 254) {
        return null;
      }
      if (data3[0] < 128) return { value: data3[0], length: 1 };
      let length2 = 1;
      for (let zeroMask = 64; zeroMask & data3[0]; zeroMask >>= 1) length2++;
      let idx = length2 - 1, value = 0, shift = 0;
      for (; idx > 0; shift += 6, idx--) {
        if ((data3[idx] & 192) !== 128) {
          return null;
        }
        value |= (data3[idx] & 63) << shift;
      }
      value |= (data3[idx] & 127 >> length2) << shift;
      return { value, length: length2 };
    }
    static [getHeaderFromUint8Array](data3, headerCache) {
      const codecParserStub = {
        [readRawData]: function* () {
          return data3;
        }
      };
      return _FLACHeader[getHeader](codecParserStub, headerCache, 0).next().value;
    }
    static *[getHeader](codecParser, headerCache, readOffset) {
      let data3 = yield* codecParser[readRawData](6, readOffset);
      if (data3[0] !== 255 || !(data3[1] === 248 || data3[1] === 249)) {
        return null;
      }
      const header3 = {};
      const key = bytesToString(data3[subarray](0, 4));
      const cachedHeader = headerCache[getHeader](key);
      if (!cachedHeader) {
        header3[blockingStrategyBits] = data3[1] & 1;
        header3[blockingStrategy] = blockingStrategyValues[header3[blockingStrategyBits]];
        header3[blockSizeBits] = data3[2] & 240;
        header3[sampleRateBits] = data3[2] & 15;
        header3[blockSize] = blockSizeValues[header3[blockSizeBits]];
        if (header3[blockSize] === reserved) {
          return null;
        }
        header3[sampleRate] = sampleRateValues[header3[sampleRateBits]];
        if (header3[sampleRate] === bad) {
          return null;
        }
        if (data3[3] & 1) {
          return null;
        }
        const channelAssignment = channelAssignments[data3[3] & 240];
        if (channelAssignment === reserved) {
          return null;
        }
        header3[channels] = channelAssignment[channels];
        header3[channelMode] = channelAssignment[description];
        header3[bitDepth] = bitDepthValues[data3[3] & 14];
        if (header3[bitDepth] === reserved) {
          return null;
        }
      } else {
        Object.assign(header3, cachedHeader);
      }
      header3[length] = 5;
      data3 = yield* codecParser[readRawData](header3[length] + 8, readOffset);
      const decodedUtf8 = _FLACHeader._decodeUTF8Int(data3[subarray](4));
      if (!decodedUtf8) {
        return null;
      }
      if (header3[blockingStrategyBits]) {
        header3[sampleNumber] = decodedUtf8.value;
      } else {
        header3[frameNumber] = decodedUtf8.value;
      }
      header3[length] += decodedUtf8[length];
      if (header3[blockSizeBits] === 96) {
        if (data3[length] < header3[length])
          data3 = yield* codecParser[readRawData](header3[length], readOffset);
        header3[blockSize] = data3[header3[length] - 1] + 1;
        header3[length] += 1;
      } else if (header3[blockSizeBits] === 112) {
        if (data3[length] < header3[length])
          data3 = yield* codecParser[readRawData](header3[length], readOffset);
        header3[blockSize] = (data3[header3[length] - 1] << 8) + data3[header3[length]] + 1;
        header3[length] += 2;
      }
      header3[samples] = header3[blockSize];
      if (header3[sampleRateBits] === 12) {
        if (data3[length] < header3[length])
          data3 = yield* codecParser[readRawData](header3[length], readOffset);
        header3[sampleRate] = data3[header3[length] - 1] * 1e3;
        header3[length] += 1;
      } else if (header3[sampleRateBits] === 13) {
        if (data3[length] < header3[length])
          data3 = yield* codecParser[readRawData](header3[length], readOffset);
        header3[sampleRate] = (data3[header3[length] - 1] << 8) + data3[header3[length]];
        header3[length] += 2;
      } else if (header3[sampleRateBits] === 14) {
        if (data3[length] < header3[length])
          data3 = yield* codecParser[readRawData](header3[length], readOffset);
        header3[sampleRate] = ((data3[header3[length] - 1] << 8) + data3[header3[length]]) * 10;
        header3[length] += 2;
      }
      if (data3[length] < header3[length])
        data3 = yield* codecParser[readRawData](header3[length], readOffset);
      header3[crc] = data3[header3[length] - 1];
      if (header3[crc] !== crc8(data3[subarray](0, header3[length] - 1))) {
        return null;
      }
      {
        if (!cachedHeader) {
          const {
            blockingStrategyBits: blockingStrategyBits2,
            frameNumber: frameNumber2,
            sampleNumber: sampleNumber2,
            samples: samples2,
            sampleRateBits: sampleRateBits2,
            blockSizeBits: blockSizeBits2,
            crc: crc2,
            length: length2,
            ...codecUpdateFields
          } = header3;
          headerCache[setHeader](key, header3, codecUpdateFields);
        }
      }
      return new _FLACHeader(header3);
    }
    /**
     * @private
     * Call FLACHeader.getHeader(Array<Uint8>) to get instance
     */
    constructor(header3) {
      super(header3);
      this[crc16] = null;
      this[blockingStrategy] = header3[blockingStrategy];
      this[blockSize] = header3[blockSize];
      this[frameNumber] = header3[frameNumber];
      this[sampleNumber] = header3[sampleNumber];
      this[streamInfo] = null;
    }
  };
  var MIN_FLAC_FRAME_SIZE = 2;
  var MAX_FLAC_FRAME_SIZE = 512 * 1024;
  var FLACParser = class extends Parser {
    constructor(codecParser, headerCache, onCodec) {
      super(codecParser, headerCache);
      this.Frame = FLACFrame;
      this.Header = FLACHeader;
      onCodec(this[codec]);
    }
    get [codec]() {
      return "flac";
    }
    *_getNextFrameSyncOffset(offset) {
      const data3 = yield* this._codecParser[readRawData](2, 0);
      const dataLength = data3[length] - 2;
      while (offset < dataLength) {
        const firstByte = data3[offset];
        if (firstByte === 255) {
          const secondByte = data3[offset + 1];
          if (secondByte === 248 || secondByte === 249) break;
          if (secondByte !== 255) offset++;
        }
        offset++;
      }
      return offset;
    }
    *[parseFrame]() {
      do {
        const header3 = yield* FLACHeader[getHeader](
          this._codecParser,
          this._headerCache,
          0
        );
        if (header3) {
          let nextHeaderOffset = headerStore.get(header3)[length] + MIN_FLAC_FRAME_SIZE;
          while (nextHeaderOffset <= MAX_FLAC_FRAME_SIZE) {
            if (this._codecParser._flushing || (yield* FLACHeader[getHeader](
              this._codecParser,
              this._headerCache,
              nextHeaderOffset
            ))) {
              let frameData = yield* this._codecParser[readRawData](nextHeaderOffset);
              if (!this._codecParser._flushing)
                frameData = frameData[subarray](0, nextHeaderOffset);
              if (FLACFrame[checkFrameFooterCrc16](frameData)) {
                const frame2 = new FLACFrame(frameData, header3);
                this._headerCache[enable]();
                this._codecParser[incrementRawData](nextHeaderOffset);
                this._codecParser[mapFrameStats](frame2);
                return frame2;
              }
            }
            nextHeaderOffset = yield* this._getNextFrameSyncOffset(
              nextHeaderOffset + 1
            );
          }
          this._codecParser[logWarning](
            `Unable to sync FLAC frame after searching ${nextHeaderOffset} bytes.`
          );
          this._codecParser[incrementRawData](nextHeaderOffset);
        } else {
          this._codecParser[incrementRawData](
            yield* this._getNextFrameSyncOffset(1)
          );
        }
      } while (true);
    }
    [parseOggPage](oggPage) {
      if (oggPage[pageSequenceNumber] === 0) {
        this._headerCache[enable]();
        this._streamInfo = oggPage[data][subarray](13);
      } else if (oggPage[pageSequenceNumber] === 1) {
      } else {
        oggPage[codecFrames] = frameStore.get(oggPage)[segments].map((segment) => {
          const header3 = FLACHeader[getHeaderFromUint8Array](
            segment,
            this._headerCache
          );
          if (header3) {
            return new FLACFrame(segment, header3, this._streamInfo);
          } else {
            this._codecParser[logWarning](
              "Failed to parse Ogg FLAC frame",
              "Skipping invalid FLAC frame"
            );
          }
        }).filter((frame2) => !!frame2);
      }
      return oggPage;
    }
  };
  var OggPageHeader = class _OggPageHeader {
    static *[getHeader](codecParser, headerCache, readOffset) {
      const header3 = {};
      let data3 = yield* codecParser[readRawData](28, readOffset);
      if (data3[0] !== 79 || // O
      data3[1] !== 103 || // g
      data3[2] !== 103 || // g
      data3[3] !== 83) {
        return null;
      }
      header3[streamStructureVersion] = data3[4];
      const zeros = data3[5] & 248;
      if (zeros) return null;
      header3[isLastPage] = !!(data3[5] & 4);
      header3[isFirstPage] = !!(data3[5] & 2);
      header3[isContinuedPacket] = !!(data3[5] & 1);
      const view = new dataView(uint8Array.from(data3[subarray](0, 28))[buffer]);
      header3[absoluteGranulePosition] = readInt64le(view, 6);
      header3[streamSerialNumber] = view.getInt32(14, true);
      header3[pageSequenceNumber] = view.getInt32(18, true);
      header3[pageChecksum] = view.getInt32(22, true);
      const pageSegmentTableLength = data3[26];
      header3[length] = pageSegmentTableLength + 27;
      data3 = yield* codecParser[readRawData](header3[length], readOffset);
      header3[frameLength] = 0;
      header3[pageSegmentTable] = [];
      header3[pageSegmentBytes] = uint8Array.from(
        data3[subarray](27, header3[length])
      );
      for (let i = 0, segmentLength = 0; i < pageSegmentTableLength; i++) {
        const segmentByte = header3[pageSegmentBytes][i];
        header3[frameLength] += segmentByte;
        segmentLength += segmentByte;
        if (segmentByte !== 255 || i === pageSegmentTableLength - 1) {
          header3[pageSegmentTable].push(segmentLength);
          segmentLength = 0;
        }
      }
      return new _OggPageHeader(header3);
    }
    /**
     * @private
     * Call OggPageHeader.getHeader(Array<Uint8>) to get instance
     */
    constructor(header3) {
      headerStore.set(this, header3);
      this[absoluteGranulePosition] = header3[absoluteGranulePosition];
      this[isContinuedPacket] = header3[isContinuedPacket];
      this[isFirstPage] = header3[isFirstPage];
      this[isLastPage] = header3[isLastPage];
      this[pageSegmentTable] = header3[pageSegmentTable];
      this[pageSequenceNumber] = header3[pageSequenceNumber];
      this[pageChecksum] = header3[pageChecksum];
      this[streamSerialNumber] = header3[streamSerialNumber];
    }
  };
  var OggPage = class _OggPage extends Frame {
    static *[getFrame](codecParser, headerCache, readOffset) {
      const header3 = yield* OggPageHeader[getHeader](
        codecParser,
        headerCache,
        readOffset
      );
      if (header3) {
        const frameLengthValue = headerStore.get(header3)[frameLength];
        const headerLength = headerStore.get(header3)[length];
        const totalLength = headerLength + frameLengthValue;
        const rawDataValue = (yield* codecParser[readRawData](totalLength, 0))[subarray](0, totalLength);
        const frame2 = rawDataValue[subarray](headerLength, totalLength);
        return new _OggPage(header3, frame2, rawDataValue);
      } else {
        return null;
      }
    }
    constructor(header3, frame2, rawDataValue) {
      super(header3, frame2);
      frameStore.get(this)[length] = rawDataValue[length];
      this[codecFrames] = [];
      this[rawData] = rawDataValue;
      this[absoluteGranulePosition] = header3[absoluteGranulePosition];
      this[crc32] = header3[pageChecksum];
      this[duration] = 0;
      this[isContinuedPacket] = header3[isContinuedPacket];
      this[isFirstPage] = header3[isFirstPage];
      this[isLastPage] = header3[isLastPage];
      this[pageSequenceNumber] = header3[pageSequenceNumber];
      this[samples] = 0;
      this[streamSerialNumber] = header3[streamSerialNumber];
    }
  };
  var OpusFrame = class extends CodecFrame {
    constructor(data3, header3, samples2) {
      super(header3, data3, samples2);
    }
  };
  var channelMappingFamilies = {
    0: vorbisOpusChannelMapping.slice(0, 2),
    /*
    0: "monophonic (mono)"
    1: "stereo (left, right)"
    */
    1: vorbisOpusChannelMapping
    /*
    0: "monophonic (mono)"
    1: "stereo (left, right)"
    2: "linear surround (left, center, right)"
    3: "quadraphonic (front left, front right, rear left, rear right)"
    4: "5.0 surround (front left, front center, front right, rear left, rear right)"
    5: "5.1 surround (front left, front center, front right, rear left, rear right, LFE)"
    6: "6.1 surround (front left, front center, front right, side left, side right, rear center, LFE)"
    7: "7.1 surround (front left, front center, front right, side left, side right, rear left, rear right, LFE)"
    */
    // additional channel mappings are user defined
  };
  var silkOnly = "SILK-only";
  var celtOnly = "CELT-only";
  var hybrid = "Hybrid";
  var narrowBand = "narrowband";
  var mediumBand = "medium-band";
  var wideBand = "wideband";
  var superWideBand = "super-wideband";
  var fullBand = "fullband";
  var configTable = {
    0: { [mode]: silkOnly, [bandwidth]: narrowBand, [frameSize]: 10 },
    8: { [mode]: silkOnly, [bandwidth]: narrowBand, [frameSize]: 20 },
    16: { [mode]: silkOnly, [bandwidth]: narrowBand, [frameSize]: 40 },
    24: { [mode]: silkOnly, [bandwidth]: narrowBand, [frameSize]: 60 },
    32: { [mode]: silkOnly, [bandwidth]: mediumBand, [frameSize]: 10 },
    40: { [mode]: silkOnly, [bandwidth]: mediumBand, [frameSize]: 20 },
    48: { [mode]: silkOnly, [bandwidth]: mediumBand, [frameSize]: 40 },
    56: { [mode]: silkOnly, [bandwidth]: mediumBand, [frameSize]: 60 },
    64: { [mode]: silkOnly, [bandwidth]: wideBand, [frameSize]: 10 },
    72: { [mode]: silkOnly, [bandwidth]: wideBand, [frameSize]: 20 },
    80: { [mode]: silkOnly, [bandwidth]: wideBand, [frameSize]: 40 },
    88: { [mode]: silkOnly, [bandwidth]: wideBand, [frameSize]: 60 },
    96: { [mode]: hybrid, [bandwidth]: superWideBand, [frameSize]: 10 },
    104: { [mode]: hybrid, [bandwidth]: superWideBand, [frameSize]: 20 },
    112: { [mode]: hybrid, [bandwidth]: fullBand, [frameSize]: 10 },
    120: { [mode]: hybrid, [bandwidth]: fullBand, [frameSize]: 20 },
    128: { [mode]: celtOnly, [bandwidth]: narrowBand, [frameSize]: 2.5 },
    136: { [mode]: celtOnly, [bandwidth]: narrowBand, [frameSize]: 5 },
    144: { [mode]: celtOnly, [bandwidth]: narrowBand, [frameSize]: 10 },
    152: { [mode]: celtOnly, [bandwidth]: narrowBand, [frameSize]: 20 },
    160: { [mode]: celtOnly, [bandwidth]: wideBand, [frameSize]: 2.5 },
    168: { [mode]: celtOnly, [bandwidth]: wideBand, [frameSize]: 5 },
    176: { [mode]: celtOnly, [bandwidth]: wideBand, [frameSize]: 10 },
    184: { [mode]: celtOnly, [bandwidth]: wideBand, [frameSize]: 20 },
    192: { [mode]: celtOnly, [bandwidth]: superWideBand, [frameSize]: 2.5 },
    200: { [mode]: celtOnly, [bandwidth]: superWideBand, [frameSize]: 5 },
    208: { [mode]: celtOnly, [bandwidth]: superWideBand, [frameSize]: 10 },
    216: { [mode]: celtOnly, [bandwidth]: superWideBand, [frameSize]: 20 },
    224: { [mode]: celtOnly, [bandwidth]: fullBand, [frameSize]: 2.5 },
    232: { [mode]: celtOnly, [bandwidth]: fullBand, [frameSize]: 5 },
    240: { [mode]: celtOnly, [bandwidth]: fullBand, [frameSize]: 10 },
    248: { [mode]: celtOnly, [bandwidth]: fullBand, [frameSize]: 20 }
  };
  var OpusHeader = class _OpusHeader extends CodecHeader {
    static [getHeaderFromUint8Array](dataValue, packetData, headerCache) {
      const header3 = {};
      header3[channels] = dataValue[9];
      header3[channelMappingFamily] = dataValue[18];
      header3[length] = header3[channelMappingFamily] !== 0 ? 21 + header3[channels] : 19;
      if (dataValue[length] < header3[length])
        throw new Error("Out of data while inside an Ogg Page");
      const packetMode = packetData[0] & 3;
      const packetLength = packetMode === 3 ? 2 : 1;
      const key = bytesToString(dataValue[subarray](0, header3[length])) + bytesToString(packetData[subarray](0, packetLength));
      const cachedHeader = headerCache[getHeader](key);
      if (cachedHeader) return new _OpusHeader(cachedHeader);
      if (key.substr(0, 8) !== "OpusHead") {
        return null;
      }
      if (dataValue[8] !== 1) return null;
      header3[data] = uint8Array.from(dataValue[subarray](0, header3[length]));
      const view = new dataView(header3[data][buffer]);
      header3[bitDepth] = 16;
      header3[preSkip] = view.getUint16(10, true);
      header3[inputSampleRate] = view.getUint32(12, true);
      header3[sampleRate] = rate48000;
      header3[outputGain] = view.getInt16(16, true);
      if (header3[channelMappingFamily] in channelMappingFamilies) {
        header3[channelMode] = channelMappingFamilies[header3[channelMappingFamily]][header3[channels] - 1];
        if (!header3[channelMode]) return null;
      }
      if (header3[channelMappingFamily] !== 0) {
        header3[streamCount] = dataValue[19];
        header3[coupledStreamCount] = dataValue[20];
        header3[channelMappingTable] = [
          ...dataValue[subarray](21, header3[channels] + 21)
        ];
      }
      const packetConfig = configTable[248 & packetData[0]];
      header3[mode] = packetConfig[mode];
      header3[bandwidth] = packetConfig[bandwidth];
      header3[frameSize] = packetConfig[frameSize];
      switch (packetMode) {
        case 0:
          header3[frameCount] = 1;
          break;
        case 1:
        // 1: 2 frames in the packet, each with equal compressed size
        case 2:
          header3[frameCount] = 2;
          break;
        case 3:
          header3[isVbr] = !!(128 & packetData[1]);
          header3[hasOpusPadding] = !!(64 & packetData[1]);
          header3[frameCount] = 63 & packetData[1];
          break;
        default:
          return null;
      }
      {
        const {
          length: length2,
          data: headerData,
          channelMappingFamily: channelMappingFamily2,
          ...codecUpdateFields
        } = header3;
        headerCache[setHeader](key, header3, codecUpdateFields);
      }
      return new _OpusHeader(header3);
    }
    /**
     * @private
     * Call OpusHeader.getHeader(Array<Uint8>) to get instance
     */
    constructor(header3) {
      super(header3);
      this[data] = header3[data];
      this[bandwidth] = header3[bandwidth];
      this[channelMappingFamily] = header3[channelMappingFamily];
      this[channelMappingTable] = header3[channelMappingTable];
      this[coupledStreamCount] = header3[coupledStreamCount];
      this[frameCount] = header3[frameCount];
      this[frameSize] = header3[frameSize];
      this[hasOpusPadding] = header3[hasOpusPadding];
      this[inputSampleRate] = header3[inputSampleRate];
      this[isVbr] = header3[isVbr];
      this[mode] = header3[mode];
      this[outputGain] = header3[outputGain];
      this[preSkip] = header3[preSkip];
      this[streamCount] = header3[streamCount];
    }
  };
  var OpusParser = class extends Parser {
    constructor(codecParser, headerCache, onCodec) {
      super(codecParser, headerCache);
      this.Frame = OpusFrame;
      this.Header = OpusHeader;
      onCodec(this[codec]);
      this._identificationHeader = null;
      this._preSkipRemaining = null;
    }
    get [codec]() {
      return "opus";
    }
    /**
     * @todo implement continued page support
     */
    [parseOggPage](oggPage) {
      if (oggPage[pageSequenceNumber] === 0) {
        this._headerCache[enable]();
        this._identificationHeader = oggPage[data];
      } else if (oggPage[pageSequenceNumber] === 1) {
      } else {
        oggPage[codecFrames] = frameStore.get(oggPage)[segments].map((segment) => {
          const header3 = OpusHeader[getHeaderFromUint8Array](
            this._identificationHeader,
            segment,
            this._headerCache
          );
          if (header3) {
            if (this._preSkipRemaining === null)
              this._preSkipRemaining = header3[preSkip];
            let samples2 = header3[frameSize] * header3[frameCount] / 1e3 * header3[sampleRate];
            if (this._preSkipRemaining > 0) {
              this._preSkipRemaining -= samples2;
              samples2 = this._preSkipRemaining < 0 ? -this._preSkipRemaining : 0;
            }
            return new OpusFrame(segment, header3, samples2);
          }
          this._codecParser[logError2](
            "Failed to parse Ogg Opus Header",
            "Not a valid Ogg Opus file"
          );
        });
      }
      return oggPage;
    }
  };
  var VorbisFrame = class extends CodecFrame {
    constructor(data3, header3, samples2) {
      super(header3, data3, samples2);
    }
  };
  var blockSizes = {
    // 0b0110: 64,
    // 0b0111: 128,
    // 0b1000: 256,
    // 0b1001: 512,
    // 0b1010: 1024,
    // 0b1011: 2048,
    // 0b1100: 4096,
    // 0b1101: 8192
  };
  for (let i = 0; i < 8; i++) blockSizes[i + 6] = 2 ** (6 + i);
  var VorbisHeader = class _VorbisHeader extends CodecHeader {
    static [getHeaderFromUint8Array](dataValue, headerCache, vorbisCommentsData, vorbisSetupData) {
      if (dataValue[length] < 30)
        throw new Error("Out of data while inside an Ogg Page");
      const key = bytesToString(dataValue[subarray](0, 30));
      const cachedHeader = headerCache[getHeader](key);
      if (cachedHeader) return new _VorbisHeader(cachedHeader);
      const header3 = { [length]: 30 };
      if (key.substr(0, 7) !== "vorbis") {
        return null;
      }
      header3[data] = uint8Array.from(dataValue[subarray](0, 30));
      const view = new dataView(header3[data][buffer]);
      header3[version] = view.getUint32(7, true);
      if (header3[version] !== 0) return null;
      header3[channels] = dataValue[11];
      header3[channelMode] = vorbisOpusChannelMapping[header3[channels] - 1] || "application defined";
      header3[sampleRate] = view.getUint32(12, true);
      header3[bitrateMaximum] = view.getInt32(16, true);
      header3[bitrateNominal] = view.getInt32(20, true);
      header3[bitrateMinimum] = view.getInt32(24, true);
      header3[blocksize1] = blockSizes[(dataValue[28] & 240) >> 4];
      header3[blocksize0] = blockSizes[dataValue[28] & 15];
      if (header3[blocksize0] > header3[blocksize1]) return null;
      if (dataValue[29] !== 1) return null;
      header3[bitDepth] = 32;
      header3[vorbisSetup] = vorbisSetupData;
      header3[vorbisComments] = vorbisCommentsData;
      {
        const {
          length: length2,
          data: data3,
          version: version2,
          vorbisSetup: vorbisSetup3,
          vorbisComments: vorbisComments3,
          ...codecUpdateFields
        } = header3;
        headerCache[setHeader](key, header3, codecUpdateFields);
      }
      return new _VorbisHeader(header3);
    }
    /**
     * @private
     * Call VorbisHeader.getHeader(Array<Uint8>) to get instance
     */
    constructor(header3) {
      super(header3);
      this[bitrateMaximum] = header3[bitrateMaximum];
      this[bitrateMinimum] = header3[bitrateMinimum];
      this[bitrateNominal] = header3[bitrateNominal];
      this[blocksize0] = header3[blocksize0];
      this[blocksize1] = header3[blocksize1];
      this[data] = header3[data];
      this[vorbisComments] = header3[vorbisComments];
      this[vorbisSetup] = header3[vorbisSetup];
    }
  };
  var VorbisParser = class extends Parser {
    constructor(codecParser, headerCache, onCodec) {
      super(codecParser, headerCache);
      this.Frame = VorbisFrame;
      onCodec(this[codec]);
      this._identificationHeader = null;
      this._setupComplete = false;
      this._prevBlockSize = null;
    }
    get [codec]() {
      return vorbis;
    }
    [parseOggPage](oggPage) {
      oggPage[codecFrames] = [];
      for (const oggPageSegment of frameStore.get(oggPage)[segments]) {
        if (oggPageSegment[0] === 1) {
          this._headerCache[enable]();
          this._identificationHeader = oggPage[data];
          this._setupComplete = false;
        } else if (oggPageSegment[0] === 3) {
          this._vorbisComments = oggPageSegment;
        } else if (oggPageSegment[0] === 5) {
          this._vorbisSetup = oggPageSegment;
          this._mode = this._parseSetupHeader(oggPageSegment);
          this._setupComplete = true;
        } else if (this._setupComplete) {
          const header3 = VorbisHeader[getHeaderFromUint8Array](
            this._identificationHeader,
            this._headerCache,
            this._vorbisComments,
            this._vorbisSetup
          );
          if (header3) {
            oggPage[codecFrames].push(
              new VorbisFrame(
                oggPageSegment,
                header3,
                this._getSamples(oggPageSegment, header3)
              )
            );
          } else {
            this._codecParser[logError](
              "Failed to parse Ogg Vorbis Header",
              "Not a valid Ogg Vorbis file"
            );
          }
        }
      }
      return oggPage;
    }
    _getSamples(segment, header3) {
      const blockFlag = this._mode.blockFlags[segment[0] >> 1 & this._mode.mask];
      const currentBlockSize = blockFlag ? header3[blocksize1] : header3[blocksize0];
      const samplesValue = this._prevBlockSize === null ? 0 : (this._prevBlockSize + currentBlockSize) / 4;
      this._prevBlockSize = currentBlockSize;
      return samplesValue;
    }
    // https://gitlab.xiph.org/xiph/liboggz/-/blob/master/src/liboggz/oggz_auto.c#L911
    // https://github.com/FFmpeg/FFmpeg/blob/master/libavcodec/vorbis_parser.c
    /*
     * This is the format of the mode data at the end of the packet for all
     * Vorbis Version 1 :
     *
     * [ 6:number_of_modes ]
     * [ 1:size | 16:window_type(0) | 16:transform_type(0) | 8:mapping ]
     * [ 1:size | 16:window_type(0) | 16:transform_type(0) | 8:mapping ]
     * [ 1:size | 16:window_type(0) | 16:transform_type(0) | 8:mapping ]
     * [ 1:framing(1) ]
     *
     * e.g.:
     *
     * MsB         LsB
     *              <-
     * 0 0 0 0 0 1 0 0
     * 0 0 1 0 0 0 0 0
     * 0 0 1 0 0 0 0 0
     * 0 0 1|0 0 0 0 0
     * 0 0 0 0|0|0 0 0
     * 0 0 0 0 0 0 0 0
     * 0 0 0 0|0 0 0 0
     * 0 0 0 0 0 0 0 0
     * 0 0 0 0|0 0 0 0
     * 0 0 0|1|0 0 0 0 |
     * 0 0 0 0 0 0 0 0 V
     * 0 0 0|0 0 0 0 0
     * 0 0 0 0 0 0 0 0
     * 0 0|1 0 0 0 0 0
     *
     * The simplest way to approach this is to start at the end
     * and read backwards to determine the mode configuration.
     *
     * liboggz and ffmpeg both use this method.
     */
    _parseSetupHeader(setup) {
      const bitReader = new BitReader(setup);
      const mode2 = {
        count: 0,
        blockFlags: []
      };
      while ((bitReader.read(1) & 1) !== 1) {
      }
      let modeBits;
      while (mode2.count < 64 && bitReader.position > 0) {
        reverse(bitReader.read(8));
        let currentByte = 0;
        while (bitReader.read(8) === 0 && currentByte++ < 3) {
        }
        if (currentByte === 4) {
          modeBits = bitReader.read(7);
          mode2.blockFlags.unshift(modeBits & 1);
          bitReader.position += 6;
          mode2.count++;
        } else {
          if (((reverse(modeBits) & 126) >> 1) + 1 !== mode2.count) {
            this._codecParser[logWarning](
              "vorbis derived mode count did not match actual mode count"
            );
          }
          break;
        }
      }
      mode2.mask = (1 << Math.log2(mode2.count)) - 1;
      return mode2;
    }
  };
  var OggStream = class {
    constructor(codecParser, headerCache, onCodec) {
      this._codecParser = codecParser;
      this._headerCache = headerCache;
      this._onCodec = onCodec;
      this._continuedPacket = new uint8Array();
      this._codec = null;
      this._isSupported = null;
      this._previousAbsoluteGranulePosition = null;
    }
    get [codec]() {
      return this._codec || "";
    }
    _updateCodec(codec2, Parser2) {
      if (this._codec !== codec2) {
        this._headerCache[reset]();
        this._parser = new Parser2(
          this._codecParser,
          this._headerCache,
          this._onCodec
        );
        this._codec = codec2;
      }
    }
    _checkCodecSupport({ data: data3 }) {
      const idString = bytesToString(data3[subarray](0, 8));
      switch (idString) {
        case "fishead\0":
          return false;
        // ignore ogg skeleton packets
        case "OpusHead":
          this._updateCodec("opus", OpusParser);
          return true;
        case (/^\x7fFLAC/.test(idString) && idString):
          this._updateCodec("flac", FLACParser);
          return true;
        case (/^\x01vorbis/.test(idString) && idString):
          this._updateCodec(vorbis, VorbisParser);
          return true;
        default:
          return false;
      }
    }
    _checkPageSequenceNumber(oggPage) {
      if (oggPage[pageSequenceNumber] !== this._pageSequenceNumber + 1 && this._pageSequenceNumber > 1 && oggPage[pageSequenceNumber] > 1) {
        this._codecParser[logWarning](
          "Unexpected gap in Ogg Page Sequence Number.",
          `Expected: ${this._pageSequenceNumber + 1}, Got: ${oggPage[pageSequenceNumber]}`
        );
      }
      this._pageSequenceNumber = oggPage[pageSequenceNumber];
    }
    _parsePage(oggPage) {
      if (this._isSupported === null) {
        this._pageSequenceNumber = oggPage[pageSequenceNumber];
        this._isSupported = this._checkCodecSupport(oggPage);
      }
      this._checkPageSequenceNumber(oggPage);
      const oggPageStore = frameStore.get(oggPage);
      const headerData = headerStore.get(oggPageStore[header]);
      let offset = 0;
      oggPageStore[segments] = headerData[pageSegmentTable].map(
        (segmentLength) => oggPage[data][subarray](offset, offset += segmentLength)
      );
      if (this._continuedPacket[length]) {
        oggPageStore[segments][0] = concatBuffers(
          this._continuedPacket,
          oggPageStore[segments][0]
        );
        this._continuedPacket = new uint8Array();
      }
      if (headerData[pageSegmentBytes][headerData[pageSegmentBytes][length] - 1] === 255) {
        this._continuedPacket = concatBuffers(
          this._continuedPacket,
          oggPageStore[segments].pop()
        );
      }
      if (this._previousAbsoluteGranulePosition !== null) {
        oggPage[samples] = Number(
          oggPage[absoluteGranulePosition] - this._previousAbsoluteGranulePosition
        );
      }
      this._previousAbsoluteGranulePosition = oggPage[absoluteGranulePosition];
      if (this._isSupported) {
        const frame2 = this._parser[parseOggPage](oggPage);
        this._codecParser[mapFrameStats](frame2);
        return frame2;
      } else {
        return oggPage;
      }
    }
  };
  var OggParser = class extends Parser {
    constructor(codecParser, headerCache, onCodec) {
      super(codecParser, headerCache);
      this._onCodec = onCodec;
      this.Frame = OggPage;
      this.Header = OggPageHeader;
      this._streams = /* @__PURE__ */ new Map();
      this._currentSerialNumber = null;
    }
    get [codec]() {
      const oggStream = this._streams.get(this._currentSerialNumber);
      return oggStream ? oggStream.codec : "";
    }
    *[parseFrame]() {
      const oggPage = yield* this[fixedLengthFrameSync](true);
      this._currentSerialNumber = oggPage[streamSerialNumber];
      let oggStream = this._streams.get(this._currentSerialNumber);
      if (!oggStream) {
        oggStream = new OggStream(
          this._codecParser,
          this._headerCache,
          this._onCodec
        );
        this._streams.set(this._currentSerialNumber, oggStream);
      }
      if (oggPage[isLastPage]) this._streams.delete(this._currentSerialNumber);
      return oggStream._parsePage(oggPage);
    }
  };
  var noOp = () => {
  };
  var CodecParser = class {
    constructor(mimeType2, {
      onCodec,
      onCodecHeader,
      onCodecUpdate,
      enableLogging = false,
      enableFrameCRC32 = true
    } = {}) {
      this._inputMimeType = mimeType2;
      this._onCodec = onCodec || noOp;
      this._onCodecHeader = onCodecHeader || noOp;
      this._onCodecUpdate = onCodecUpdate;
      this._enableLogging = enableLogging;
      this._crc32 = enableFrameCRC32 ? crc32Function : noOp;
      this[reset]();
    }
    /**
     * @public
     * @returns The detected codec
     */
    get [codec]() {
      return this._parser ? this._parser[codec] : "";
    }
    [reset]() {
      this._headerCache = new HeaderCache(
        this._onCodecHeader,
        this._onCodecUpdate
      );
      this._generator = this._getGenerator();
      this._generator.next();
    }
    /**
     * @public
     * @description Generator function that yields any buffered CodecFrames and resets the CodecParser
     * @returns {Iterable<CodecFrame|OggPage>} Iterator that operates over the codec data.
     * @yields {CodecFrame|OggPage} Parsed codec or ogg page data
     */
    *flush() {
      this._flushing = true;
      for (let i = this._generator.next(); i.value; i = this._generator.next()) {
        yield i.value;
      }
      this._flushing = false;
      this[reset]();
    }
    /**
     * @public
     * @description Generator function takes in a Uint8Array of data and returns a CodecFrame from the data for each iteration
     * @param {Uint8Array} chunk Next chunk of codec data to read
     * @returns {Iterable<CodecFrame|OggPage>} Iterator that operates over the codec data.
     * @yields {CodecFrame|OggPage} Parsed codec or ogg page data
     */
    *parseChunk(chunk) {
      for (let i = this._generator.next(chunk); i.value; i = this._generator.next()) {
        yield i.value;
      }
    }
    /**
     * @public
     * @description Parses an entire file and returns all of the contained frames.
     * @param {Uint8Array} fileData Coded data to read
     * @returns {Array<CodecFrame|OggPage>} CodecFrames
     */
    parseAll(fileData) {
      return [...this.parseChunk(fileData), ...this.flush()];
    }
    /**
     * @private
     */
    *_getGenerator() {
      if (this._inputMimeType.match(/aac/)) {
        this._parser = new AACParser(this, this._headerCache, this._onCodec);
      } else if (this._inputMimeType.match(/mpeg/)) {
        this._parser = new MPEGParser(this, this._headerCache, this._onCodec);
      } else if (this._inputMimeType.match(/flac/)) {
        this._parser = new FLACParser(this, this._headerCache, this._onCodec);
      } else if (this._inputMimeType.match(/ogg/)) {
        this._parser = new OggParser(this, this._headerCache, this._onCodec);
      } else {
        throw new Error(`Unsupported Codec ${mimeType}`);
      }
      this._frameNumber = 0;
      this._currentReadPosition = 0;
      this._totalBytesIn = 0;
      this._totalBytesOut = 0;
      this._totalSamples = 0;
      this._sampleRate = void 0;
      this._rawData = new Uint8Array(0);
      while (true) {
        const frame2 = yield* this._parser[parseFrame]();
        if (frame2) yield frame2;
      }
    }
    /**
     * @protected
     * @param {number} minSize Minimum bytes to have present in buffer
     * @returns {Uint8Array} rawData
     */
    *[readRawData](minSize = 0, readOffset = 0) {
      let rawData2;
      while (this._rawData[length] <= minSize + readOffset) {
        rawData2 = yield;
        if (this._flushing) return this._rawData[subarray](readOffset);
        if (rawData2) {
          this._totalBytesIn += rawData2[length];
          this._rawData = concatBuffers(this._rawData, rawData2);
        }
      }
      return this._rawData[subarray](readOffset);
    }
    /**
     * @protected
     * @param {number} increment Bytes to increment codec data
     */
    [incrementRawData](increment) {
      this._currentReadPosition += increment;
      this._rawData = this._rawData[subarray](increment);
    }
    /**
     * @protected
     */
    [mapCodecFrameStats](frame2) {
      this._sampleRate = frame2[header][sampleRate];
      frame2[header][bitrate] = frame2[duration] > 0 ? Math.round(frame2[data][length] / frame2[duration]) * 8 : 0;
      frame2[frameNumber] = this._frameNumber++;
      frame2[totalBytesOut] = this._totalBytesOut;
      frame2[totalSamples] = this._totalSamples;
      frame2[totalDuration] = this._totalSamples / this._sampleRate * 1e3;
      frame2[crc32] = this._crc32(frame2[data]);
      this._headerCache[checkCodecUpdate](
        frame2[header][bitrate],
        frame2[totalDuration]
      );
      this._totalBytesOut += frame2[data][length];
      this._totalSamples += frame2[samples];
    }
    /**
     * @protected
     */
    [mapFrameStats](frame2) {
      if (frame2[codecFrames]) {
        if (frame2[isLastPage]) {
          let absoluteGranulePositionSamples = frame2[samples];
          frame2[codecFrames].forEach((codecFrame) => {
            const untrimmedCodecSamples = codecFrame[samples];
            if (absoluteGranulePositionSamples < untrimmedCodecSamples) {
              codecFrame[samples] = absoluteGranulePositionSamples > 0 ? absoluteGranulePositionSamples : 0;
              codecFrame[duration] = codecFrame[samples] / codecFrame[header][sampleRate] * 1e3;
            }
            absoluteGranulePositionSamples -= untrimmedCodecSamples;
            this[mapCodecFrameStats](codecFrame);
          });
        } else {
          frame2[samples] = 0;
          frame2[codecFrames].forEach((codecFrame) => {
            frame2[samples] += codecFrame[samples];
            this[mapCodecFrameStats](codecFrame);
          });
        }
        frame2[duration] = frame2[samples] / this._sampleRate * 1e3 || 0;
        frame2[totalSamples] = this._totalSamples;
        frame2[totalDuration] = this._totalSamples / this._sampleRate * 1e3 || 0;
        frame2[totalBytesOut] = this._totalBytesOut;
      } else {
        this[mapCodecFrameStats](frame2);
      }
    }
    /**
     * @private
     */
    _log(logger, messages) {
      if (this._enableLogging) {
        const stats = [
          `${codec}:         ${this[codec]}`,
          `inputMimeType: ${this._inputMimeType}`,
          `readPosition:  ${this._currentReadPosition}`,
          `totalBytesIn:  ${this._totalBytesIn}`,
          `${totalBytesOut}: ${this._totalBytesOut}`
        ];
        const width = Math.max(...stats.map((s) => s[length]));
        messages.push(
          `--stats--${"-".repeat(width - 9)}`,
          ...stats,
          "-".repeat(width)
        );
        logger(
          "codec-parser",
          messages.reduce((acc, message) => acc + "\n  " + message, "")
        );
      }
    }
    /**
     * @protected
     */
    [logWarning](...messages) {
      this._log(console.warn, messages);
    }
    /**
     * @protected
     */
    [logError2](...messages) {
      this._log(console.error, messages);
    }
  };
  var codec_parser_default = CodecParser;
  var codecFrames2 = codecFrames;
  var data2 = data;
  var header2 = header;
  var isLastPage2 = isLastPage;
  var vorbisSetup2 = vorbisSetup;
  var totalSamples2 = totalSamples;
  function EmscriptenWASM(WASMAudioDecoderCommon2) {
    var Module = Module;
    function ready() {
    }
    Module = {};
    function abort(what) {
      throw what;
    }
    var HEAP8, HEAP16, HEAP32, HEAPU8, HEAPU16, HEAPU32, HEAPF32, HEAPF64, HEAP64, HEAPU64, wasmMemory;
    function updateMemoryViews() {
      var b = wasmMemory.buffer;
      HEAP8 = new Int8Array(b);
      HEAP16 = new Int16Array(b);
      HEAPU8 = new Uint8Array(b);
      HEAPU16 = new Uint16Array(b);
      HEAP32 = new Int32Array(b);
      HEAPU32 = new Uint32Array(b);
      HEAPF32 = new Float32Array(b);
      HEAPF64 = new Float64Array(b);
      HEAP64 = new BigInt64Array(b);
      HEAPU64 = new BigUint64Array(b);
    }
    var base64Decode = (b64) => {
      var b1, b2, i2 = 0, j = 0, bLength = b64.length;
      var output = new Uint8Array((bLength * 3 >> 2) - (b64[bLength - 2] == "=") - (b64[bLength - 1] == "="));
      for (; i2 < bLength; i2 += 4, j += 3) {
        b1 = base64ReverseLookup[b64.charCodeAt(i2 + 1)];
        b2 = base64ReverseLookup[b64.charCodeAt(i2 + 2)];
        output[j] = base64ReverseLookup[b64.charCodeAt(i2)] << 2 | b1 >> 4;
        output[j + 1] = b1 << 4 | b2 >> 2;
        output[j + 2] = b2 << 6 | base64ReverseLookup[b64.charCodeAt(i2 + 3)];
      }
      return output;
    };
    var __abort_js = () => abort("");
    var __emscripten_runtime_keepalive_clear = () => {
    };
    var timers = {};
    var callUserCallback = (func) => func();
    var _emscripten_get_now = () => performance.now();
    var __setitimer_js = (which, timeout_ms) => {
      if (timers[which]) {
        clearTimeout(timers[which].id);
        delete timers[which];
      }
      if (!timeout_ms) return 0;
      var id = setTimeout(() => {
        delete timers[which];
        callUserCallback(() => __emscripten_timeout(which, _emscripten_get_now()));
      }, timeout_ms);
      timers[which] = {
        id,
        timeout_ms
      };
      return 0;
    };
    var _emscripten_math_atan = Math.atan;
    var _emscripten_math_cos = Math.cos;
    var _emscripten_math_exp = Math.exp;
    var _emscripten_math_log = Math.log;
    var _emscripten_math_pow = Math.pow;
    var _emscripten_math_sin = Math.sin;
    var _emscripten_resize_heap = (requestedSize) => {
      var oldSize = HEAPU8.length;
      requestedSize >>>= 0;
      return false;
    };
    var _proc_exit = (code) => {
      throw `exit(${code})`;
    };
    for (var base64ReverseLookup = new Uint8Array(123), i = 25; i >= 0; --i) {
      base64ReverseLookup[48 + i] = 52 + i;
      base64ReverseLookup[65 + i] = i;
      base64ReverseLookup[97 + i] = 26 + i;
    }
    base64ReverseLookup[43] = 62;
    base64ReverseLookup[47] = 63;
    var wasmImports = {
      /** @export */
      "e": __abort_js,
      /** @export */
      "d": __emscripten_runtime_keepalive_clear,
      /** @export */
      "f": __setitimer_js,
      /** @export */
      "b": _emscripten_math_atan,
      /** @export */
      "a": _emscripten_math_cos,
      /** @export */
      "i": _emscripten_math_exp,
      /** @export */
      "h": _emscripten_math_log,
      /** @export */
      "g": _emscripten_math_pow,
      /** @export */
      "c": _emscripten_math_sin,
      /** @export */
      "k": _emscripten_resize_heap,
      /** @export */
      "j": _proc_exit
    };
    function assignWasmExports(wasmExports) {
      _create_decoder = wasmExports["n"];
      _malloc = wasmExports["o"];
      _send_setup = wasmExports["p"];
      _init_dsp = wasmExports["q"];
      _decode_packets = wasmExports["r"];
      _destroy_decoder = wasmExports["s"];
      _free = wasmExports["t"];
      __emscripten_timeout = wasmExports["v"];
    }
    var _create_decoder, _malloc, _send_setup, _init_dsp, _decode_packets, _destroy_decoder, _free, __emscripten_timeout;
    function initRuntime(wasmExports) {
      wasmExports["m"]();
    }
    if (!EmscriptenWASM.wasm) Object.defineProperty(EmscriptenWASM, "wasm", { get: () => String.raw`dynEncode012091253f87dì%nä= 4& ¿nÝØäÂLÚªã9ÚØ[äº\ ¼¡³R=}L]Èÿ2 ÿù¶J1jj¡é,zäV|i¸Qk¹= 
¨¨%ýv²±»oúâLa:ê±ÊäÌÓ.÷Øý×>àW>z¯°8¯ñ\Ñós9\§ôÊ@Ü (tÃø4° ¢7fqÓg²Jè6x[zç®&4=} p.(°tÍÞã¾>÷CõË"*k?¿~7~H2ÛÜâ.ÏQä;6{ÜãFÑá'DD¤±°HQ>MínÎÏÎöÊµÑÓÞÌP¼P¨Þ* X²E=MÂ¦qíxMÃ±=MÌë4/<gNO/¢	¢>a~Ï®ììììì0ìaç¬¡çëOÓÇM	Q9tùµyuéµµÞÏ/±Óõò}E{òÓJ¹Û|·ôfÒ c¬WêaûÿlÊ½p¹|)ÖEL¦	}ypÕSÏ¹I]¢ºãæ°ÿo¶7ÛRq¾ÔÅEßØ]æËwÚ{óçVwó1¾E­Øpàe"Æùû¡Áª Ààð´LõÎxEÓ¢N¦9ëùi&	Ò§Ø!ÇFçS=MbäO?ß·ç¸ª7ùa}5ðûÕtsUþ£KïgN¾)ø§\V0uSIö:ÌU4Ð¶¯´Õn9ÔèE£ZÆ¼{hµmÙ¾6ÆÑ+xñ´«þ¸=Mß¤·å®«ïÆGFÝì|H?ä E"þ!9«Æïpæ'][¯ù·£W÷O§&#ax$qf=}ø ô bÏ×W÷LôoÝWQÕÓ)u÷½èV|¥Gà¨Ö¸@ê|ÇK5ò	A·Â9CS2¸¼¿,äÝÑÝy!ÑR%ÆÝÎ0Âv§ qTcó±hØÉã=}Z=}Ælü­ën¯ð(-°ÜwVÏï.th¥í­S~SÏ»ZZÔZ 
3BÌÛ¬<éæO)ÎyÚ¯O*®uìÛ$öI¥Ý9ôø³\¤ò³Ù¹ÇP¸J×y@ÔyOÇmô½ü¾|S?2àú¤F?½ûoo3ô;<àáûÜ8ì²7ïë¨RäY¹|ÓºÌF,Ð-¸*\P!FJÒ8= o6HwLrúº¶ÐÛ\Ù¬o¢9IqÝ.ôf¶ÎÈ{Äª×N|Mfs¤ÉÝàâ§*+ã§­ô¯î¬7ç×§ä)!Z¨É,Äp~ý·wsSGóäsE\ýïé§Ö:Ò'Cç(_X$\¦½eÒ8$ XF|eíÙÓ¡¤Û<ØÞÛ¸9¿ðÃÎ#b~× 4éîÿÏq
 ód|0wU&®è·vh6¨{ÚçÚ18Ó(ÓY\0¦= çèíß)Ø=}[xü-v?N(Kkg 0}âÚ´ð¬ÕQNÍ¢usÑ³=}.	ëgû= ÍMBp'²¨ x4è@9t§eÝµ¾âð½ z?Z¹FH'Ì¯¿<K,üµ<{	¶JãývåàÆeù0Ð"F¥ÃÒÞþÔÉvCzl}ðN£	Í^P%²¸FX»WÎêô¶äÉJ^g×SÃã.Ät*'ªG«ÒB<ÜÓ¿ºp­\àuV¯£ÅÝ½áÞ ùß=}ÎÚ^ÿí>¥! ¨ â=M·?*/¤"å)â·ÿîÿî*(%*2[½"üríÔ4l½»a}¯CwpCÓèìGc-ã6®=M32k?Êg­!So-x>³G+ã@ò, ÁïáåN0þÙè.~È÷¡vTr¶­Ã[üB±º»ávëw¹{pÜºû"Aæ±9Æ^¹³òïRIAy5GÂwÉf4@Tù|qý7ðªwBL|Ôqv!ª°|]KiÐJVQ5¸åõ§å"H¼0e¬<óBîÚSÏUìHPÙA+çÉ'seÌNf°@ÈM,ð½egÖ¬x©û½2~«Ò1;Ö«¯°4&90èE»Ó×ºçÊ§J<Æ¿&~Nu¼ãÙµ¢.UÇä(qQô^ö·%!É
w¬= Îôª«Ù×ªJIS;õa rx×£.6¤°>5²Åà,õ°°h6ûUp©²v#}%é= R¢hõ@ëQiJÙ\Ûp»©[vsiÙLE UG*sGÄ%V­¸§;º_]cØp#¡:oZ{ãS5I¥]ÓaÎg+n×ýÿTxy]²ö°k¦kêju¼xÐTá©#h>Ù]u\EA+§í¤u¦üØlQPdëNòzyÞ¼XÐ]ÝøÝg¸BI¿BÕð_Ël¶Cuyºr|<¾¨Támo5êÿú>Æ[ã±G¨²)ü&áòüåBFou!Íí.jÖìß½8¥YëìáÈÁi)qÀ:ÎüÐÖ¤GÍ³ô>°ú¯øâ?R£k~&ÑãÞ~A¢;Ð'àÆUÀ»L­×)-!ÿkýíÙ
§Û\{¤ólW^næzk?G~?_5uÝñ7-ß«6YPðGßÚù\Êê -ûp¥èÓtM ×hKÈ¯ÒBAê"ïx×HÍ0Ôcè+èçÛÅf (§¢õ®%K£7éÞQ'MxãxÐúÑ2!8_6Ì¶Ì6ÌrûùS¥ZóAIüå6¿jÿ_°(ÿä9©CCÄ!bq5Öô×x{ÍbÆÚmÒ@«µ××~ÒD;*ü ùeÀÞ·xv¾;¤7¾[W\ýüb@'qãµÙâÉE¾}}tq-g=}Üs¢5Ó=}$Ä§£Ó~SFÎgÑnN>1§/¥¸G5àM8#Ò;2¢/K%xVÓ(XH>µ¬ü;_j~Æw<¾ô*»ô= fAËbM¼iÀIIp'c*:oY¡VÖ3ûIdû®4ÚûýÆð}ûN¥ûI
¥ÎÛK*]Ø=M>t×ý³MwEè®"Û4­]]ÓgØ×EÈ.pN°¡»¤ç/I.ÿ+6r@«Âz@§Bz@¯ÂIê-tíÜ«°·GföjÏÕì:gÕUÖ=}÷¦|§EõÌ$a*¸s¬´«£¯JÞàãËt$ GSÚ³Ë1¯©&|±c!\åvçÏ·Ñ¸ãßÃ±]á¸?ùää%6´= #e¬Â;IÚ¡õckCÀò*\ï0À¿<>ªÈåJA'ï´¾ME.@OüÐ0ex÷#2ÒùúµÇ½>o{«ó= Ôï;Ç½¶óÐ/ÔÍÜ¤±¢Êw>ÃâÐ¡¯®Üa£¹6Vý váÂhôàÍ8D!Æ!ÆI;¢áÜ!oÑÙ OÏKôò=}w <0rT= 5J_±3×Ì;ôYÐ<aÞê¹¾7ßz\Ë¼ÛÛ@>Â{å%K¯º'ÊmÚòÁjRÒ×úw@'(	=}­QU«ÐÁÑ,/?úYEyºQì¬ {ÇLÕæõNáð#f>_ò#Îv] /øÏ¾TUà/øÀA Ô'w]Ã]Ww]Ã] X­÷Þnð·TbAåÉ	r¨4?t²>1Ç[áüx $-ÒÂMÄ§·µwsú>üÂ&³÷.dgA¦h²*G×	öcG×µF5¸Êqª$ñ?¦vÿ<ã;ÿs­ÒiÇXòku®vUòõcuæÊ¦á«þ¸Í
ÑÊuã E"þ!6Ø Êæ­}}onË:W½¶«ÊFuÃÝUS-1ÀÕHòzµö?ov»®¦
CyÈçaÆ
pÛ¢&{µ¨«±1EXÆÂu.7÷²ÛJÊÂy[å²µ»bL?·×øèìCp:æÕé§·rUèésÜ[o²ÛòDòDÞ]ªä#çN;Ïð)â´ *z80Úèóª1çE¯´Rì,D4H(øË)gp=Mý«û»=Mþt8º-HxH}Æ3Rt?ïÉ¤C
§ßìéõmõ,;æðk=M6Ð¦uSÝ^è´®Ù6=}æóO«>
yÒîÐ7a'ûLUöø>ò  -6Y(¬ÀMZ¾ZHpu°c«à±[t*Ç*jwÇÍ$Áíqx©SwÑËR¥é®[XJÓ8=}üµnt9ÚÏ3z½¼¢[Q2Þ¸/=MP§Y&y=}ÚÛwëý¡àß¥Û§ÃþòýÁÝÈìûê(±¹4'ïÌ:Ûùk=}eªãä	ÒCKA¤Æy×nvÈ§mÿ;=M]¿ÕÕjÔª	sF>úÔ©áÄ:cÀÆ<$|ê'!×Sb¢V¿oÇåGð¢UÊ	u¤ZJýæÔÿÿ	2çì¯h£f¾QZãÁ	®	ì­Ç'ÎÅ[¸¨{?¢ÉhS5oU½c¢ÈÂÜ»JZmUí\áùµV6Bète~Ãw÷0Õà®ísÆk,{ý¦ûiK+xvÅåºñ	a[Sé»Û	Nõòý¬ßà¨= 7på^ÿÃW,¿*M½áR±Ì³FcË<üiÏ2|ö^vKÏHò¹uYbk¿mZ¡O^ÿç©~ïj°È7	l©¨ç_ó¼'½ßªåÏn\ O,wòi,Åª-¿?ð­}òÁá=MÍ®ÿÂ²EÍñÂ}¨³ô-ýÆ³úù56MÃ6ÓJz=}p³ûê9õàå«TM×Ve>G~Ù»Vü²öHByf<õ©+QWF+.ßAGÔ¦ÏèÚ½3âÏYÀ¿T¢¸6ÌéÉÐ*¸ÖªÏrÍëá=}6/U´Ã×ZþðóW.½ÞQ¼¾ÆqÅ½oâäB-ÓUJ¬má8øªK.y±>.Q¡a0Þ#!,¥BÞ¼­S?Ìr^¿_Ö.¹ó{=}/äÈAt}ÆèÌ¼4¡Ôîgl]ÌUEý{}|DÏä:°-Ñÿ°=}àØ éÕ}Êñøðº~¹¯4Yqm¹]!ºÿ=Mõ« :Nl"SÇps¸GåÈ§á+'M¿ÓîÁ.î¤=}mÅ8)¶rrHá"ÈøÂìËøÍí4ô72bbßºq¿2ô=}A5.YV¬ÑÚã«Þ[F
)ºhXûÇÓ>È?p¤ðoUÊÓ(³FpÊi¡Ð}SÚ~E !|ðí,Ç9½Ãë¸Üì!¤ÓÃX%DBãu&dÔËôg¥á¾l¿AÉ)Á±ÑßÈßý¹ód;|Â¤Z»#ñscµ|¡ÝOOe^ãÂxÝÍ]¯òbÏ£÷ð4½ïÖ³;û/ºsñÆðFØIn²q¢©*× kdO+Ã·åÒiÉÝ±îBr]LÜ|8~7vts÷9l|aë»EânÓ´GGò$ÍR,<e0i¿ª
±¾àsÓZJ¨?&%Æ~-Çµªö±;ól"=MLgÿt#
ü2 <Àn¬ÉäÍôÿ®É1SÄà= ôñZ¥-@z;¯üà¹ìJÍ=}ÊSe BÞ¯´~¢smÿ-¨CozÀ/;Çël&uñZÖPV«¤¼´ÀïYÒ~=}DrâgC	§ýçrÆ7âÃ$ÿ¤Ý~ÞÝo@°³Ùs;ozûÀ~R§ú"¶ü/ôcæ<°^Ôã/éow×ër¦_UgûÀøäâkHÈ{&ÏMëqÀYÈLÁÊGbÙé:·q]ä\PÔëÒ¤a£1è]á^Y[Sw¶å²¹gÒ0ód^ÈT.WÄÜ[ÕÙ*Hi®z¹µu}ýuý}#ú=}ÇÌRSûçMø=}¹¹>±ÿì¨áØ[R?ÿ^¦ñê¾xZRS^PSSSç1ù}ÝZá4fffdf¨ÕËw&eÜ$hä'{»Moöyg8¹ê¶@ìÛª0-ó¯:¹ e{%<ÎÖ}Þ¤vª6¡Àõ÷Gh8= FºKVñ.ºHÅ)<Ñ= xs¥BE;;áF¡·!¡-ÀYÔå^Ö'lÌ¯ßûç¥køÞ?[ë>" -9±/ÊÛGÇ	6OY4VÕ»º[öBÿ:B¡WÍ&½ÇÎç»Î= 0yæ§§5àÁFiAÍ²®Ê\¿<î!xÞ³E =M¬U/Ã¾ssæ¶µ·OÌ0§Gûúñò¯{^/~ä×«ÊB= ;4¤þû^Öï÷L÷ï_ñíx<õ;ó5ËÇ~¾V+äl¼Ñ°«Ôí¾)ÂfÅ¼o¼ÖùWa1køìFvûëûRQø]q | ï0gºúîy["FÐþ7^ÒRµÚèæøÔyÚ
«ãi Þ@U¾¸»* è#ò-ì¶HÛé¢ùL;}·O77ÅsLæþý8¿Óùñ£}.= 	<¾=M£ðQKTà^O|¸üggH «0³i£im¼_2ÿöúÕ¨LaO+&]L¤Þ+,k Þ¶Ñ~T¤ÂHì ÊèèÕÀíÒ³MÜô~J<¤0Yð¢´."»âèÄxqe%oÝyåæâ¹25UÐ/Þe.×´Øì_æ¯_zRÏíÑ@ÿôLc¥Íðy@YÎ¦}µZ:ÑÂgZÒÒ(©¢9ß	Y«¦:vÙëÎZJâÀVsOtUÖ Ò¬¹1ûÚG´OÃóG©)niÇí
Ô}½3:.k]ý²ÂB=M~	ùÚYp95½qýãë ÐÞ/¡(ä'§úºE/ê«Ì9ý%Ú!<ÏJP&|[,gzÄ¹±¡\o0Ôhûóþ¶[KêÍð= TjÃVñ¸D¼Ð_Ò
î£¥0Ø_1dPðt  ýtZ¾rù àJf^;Ô2éÐ=}Ã¨¤B~Dñ7ûÓÁ9³ýbA6ZØ´èÃg½ñóø.:~ï ]bªZì¿Ö²2QÄßo¥-¼Öá5uu/u³òD;gjÀêÃÇ|eÁ9¬u$*ÐÁ'ÓDelÀëäì¥Ò¤Zí6OÂ@âF0-J÷¤=}_Õß¬ÒlÚM½Çôó~ð76DEÖ'ds´ÙïÝßøaÊbÑ «^Í}&àØå?¾ÍF\2HD5òèÁÆdËdÈ·6ÙPÑ|¬Ôq*Ê>0¸Cì(ÛXYV²ýIpÑíM	kÖÅ¯}Íóôc7ÅbrñÐeQXæ© Æ¯ü_Û»ÂÝMþ©.ckg fq ôo@qRL°ÅYÎÈ»d'<±+±î,Z­-GG»ø$âGvÇû	µA~YF5"§)ðfßÐé¸oJRRÅ¿ôXÝaú.QMw1 1þøiSo¾®È²¸hÌ/Î })fBr.G1£º×cÎð¥°¹&WÈüAno#g ÃàLi²¥8ó=}dä¥$Å(³0h¢0OjfÀr¡6*#àæ"ãûQ?ñ±«²Xóä*hïx=}ÎÞ¬výÞV÷{u²cöê¡h¯QÏY aêL$¦ûÈçIGßþEýWöºýëÛßý×Ïði G´ì=M¦ßÁý'þºeâNÖ7Ï/Ñu·6rÛF¾¾aUÌÓiÜÃºÒ]¶éUY*= g[ 2-_	c:ðY)
¼9îK¨£8oSå¶K4U>+¯Ãî[H\wâRVê/÷~Ðnm¨s8CÏö©Ø%ÀaªS]ý¼§ r_¸k
ªµfÄéÒQæ2¹Ão¹&3Ç¢ u c5ë6}Í:B£´1uièÑfa&]ävCOx·"³LTè.I.ÊÍzB!:FÏëxS´Q{ÊõZ7Uh8yÝfDÎ	dÔX3QÂ±	½=MnØnÅc"@;f?ª¬nû0Lp´h,¸#Mà->+C= Ê¡±­^Ù= ®Â ¬QôÅùî
öqòbß=}±ÕAË/8RzT³ÃÌ/_îMvÛ«;7S	ìN4
ìo7è_¤ÀÜñÜ©è^U±A{Éö ìXtnÝÇvz
 ½½Ùo¨çaúâ?EHÄ»ë"±cÀÁEB]acgdck
ËÁEvÇÚM:¸2¼"ûc³Ï1mA]ø[à= Ý|«oÒ&¡® ¡K$ÚiPÚÛaº!ÊI#?3ÄLoxJò¹<$$»¢¸h.ÕY¡g Û30× ¶~ÃtéR0 ni6ôeìaz(¸9°Ù=}ocî#üR{¶ù*×<Ç\Èsa>#¿]¤(R F×X#¢¯mVRòºÃ 0ã51ïíDÅVst°YÎ=}ø´·ÇF ØÕÓ¡ð(B
YS= '0#×KB<rÔôþMz8ï³tíY­S\¿©æ s¢3~ÏcÉÜ[öÝ-y£îu(´{©ueØÝª	g×»c*5ì£¡Ð>¢9®ïîêzr{½¢j|W¯Cú²"Æ¼¦Xçt,òYCIVµX#¥_æ)3è "9ûã)e0ß¸ÛÍ¤³.¥>å*ÁpepQkîtÎÚ Å¶ïoÔ¸>³55Î= Á¿rà3S\ÌÒªs0 iæméQúR|ë²­FAè	Áç-ÚýFå3$qÏ3+wØ<üªUþvü£b)Ný¯j;0õ}áª[6k	WÇíH®	¨{2 Jþ!y+(-òÉýÎl  SÆ_¼òu8¼z¸Rîùq_fGHî?{vTgeÒU<S^£(îl=MéáDÛ¶­ùM·Ä7^õÿ
Ø£ $\ öv=M¦px6+ã*àÀìî{ølÊEy9² hÏ³!ÕÑjú¸ò5pG£¸fëp N_::û\RQ[â£®M¿L#8¢ÑPk5]ý«¢zg»güåÐÒöí<ôâ~ÂÔîtýXÙñµE®:¼VBÍ¼çtnHç­|Ï0[óoûM>h}ìAö":Vk=M©l\äÓröQR}8qeV<J"ÈFäíûI_Óã«DûëôzïåJNHeÛpµ×8æÆPI¦û-t£sp£i¼äsç)ç%0eq#ôFør\ÃÁs×CP÷ú½ÿqH²}EéÏtjTi.Òþ¡=M%ä¸ÕÙe½_ëÝ;+ÏÁ9ó+ä·9:×´irxb@åÄä*Ý
²íC­KÝ»@;ö4Päü
cãJ1«õãLPµêYàn12È¯ÙIr+= ¶/gýZ³#³}~å0´ú¾dÈwû{èÒY­uvëNôºô[í&öõ¼[9Ø6
>ßNçRÆÛeíu?ìýhWõM^8<ã*lkê@uú.FzFë=M-ûhêlT±ÏÌÚ®Eã¾d¹P±¨à<ÛÉÊ6åÉìÎ7Qv¬ÎÊýì$ºÑzØ'¨mÐØÒº´ZM°o9=}óÃQ·»¾LW·:+¯©p §àÕ<Ïí2gþá1é9|RówàutHý8ºï@¬^¢W¶©ê	]ð½6ÏOô¼<±GãQ~V§xâ­ü1éUM&CÞÍ|A<^ES¸34
Z!¡ÚÜa7Î0¤q1çÖ'©~É ÙWüã­)¼ðÁê1¡é)&n¬'eÚ!6¹¾P;<dm-T©ÂñPÿoà¿§Úì4¢Î³¬¬iTÑ9ËÀêIqþdiÉNì=MW­H&¨rÅ«q,ì9C6/¤t«ô= ªK5Â#f¿%Î)¦k Aù4jFv7üÃ*-Ð\éÌ:Ä²21 .¨½ü,= åÔ3VI¯¾¸þ¼¥ÂÆÏç^g°(QÿiÕ¬ª|ï
Êáu¹ÎÖ¥UUÁ­YE¸ã²öÌÐm®~wø%þzêÑ5\5oFn$»9³mi6zj1séGd¯ÉØå2(0¬>nE¥âVÇú°ÜéÕî£]þ´Ýs×7ãû<Þë§¶§V"íÙC'aÓX K£¯üYü­úl^~¦¡Rû!=MÜPa´_Cë.0£\}À±QP9woÙæQù§jKõ û@É+gI4wÖü.Û_é4GÆ·#ÛxEh6;L]¥2¥á5üP4ÃµuÅ	>çò-ç»ëé;]÷ÑÑY¶	v Pö%!Ì§8÷PÛ'rö§ÙßÏËí»kæ@æ{¨ËC4¬P¶ óÚÈsåÍý£Îx)ÜØNóÐ3õÜMüB¡Åø×½»#»Ã-á;Ì'Æz{ã­MòÆ0Ð²>v©Ø¯³û#iàBé]á¹F{srPZá:óöCÜ±ÀÃÊõp ^kñþv1_Lç9Î½dØ¶+u¥æÌ·ól~«Ùîû­µÕÔebyÞ«880L²5ìæôvZÉQ¦HV/ïF{8M*Áý¶ºÂØO~ü3|Øx¨>¹çûÖú;ê$hÌz~ç1Hún41eÆOXØ&É¡:h'¢yÓSvðxåÊ:µÆ-Ð)ì_ä;k@%"w¨s
ËØJÂ­V+á~àé4È'QØÇÝøÄ|^	Ç)"¥0Ç¤Ðñ kÂe\ 0¤|>ÿI÷äÒÝýÔ]¶;L	qìÅR¥-bE]ÂrÊý#8n°»ØÑGø,RmâAê_Ãpá%/BU#tÎq>ò*öú(Â$âeò|=M)!Ð'¼¹¼RÐzsÑx
ß+.¼¢7â%²0ÿPàiÝPñ¸MÏå:Lå-ügß=MÅ#MÚ+üfmi®= µ¬³ñ} $¨9<og"Ø[x«Æ¯+_Ð N×æjV¦­¥#Dw$¢ø"ÂK**¨N]EB®°ËßSâ^í%Í(æé¸ÞögÝ¢´Q{Ý»b§Õ× ±±hÙ^6«GàýQÃe]tÉ¡Q¯¡ñâ¸¸a·12À I¼Æ÷nZQ:bùh<c£5yÞ§è~xWÀÛý$õAXÁÓ4KóÝ×¼µ@ßºøz¶Ñ1s7=MÇ5ö¹k±R%×¶Hâð/
+Å»ºDó(=Mj$×JD	ò¡Æÿ¼"@ºqJº&ÏþIÑKÍPçüzDjIö
¼ììoìì¯íì÷;#¶º8l¾k#:âõØ÷¢ ü_WNì¹tjÏuÐÆ>I¿y Hø@u¬BÄÃ5Ûy:LU&ùð£RnÌµ5ZGù<§h¿ËhÙâ²zí¾¸?JàçªIx6ìÚËìV£áø¡h²'ºéÞXQÍÐSÝdÖ8ÙßM9S}À4To0ömeÎ¦\Ü³tQÖç'Ñ"Á©là¿ö&.ÓÚçï±í¥­£ds¿ý= ìZÔOäþr;Z©êÜÔÐó>B:½î-t®«d¶L­Ó¨$QèÔDÏ:!ì Ûq*sª4xã´®X&(\À¾ÊØXA¸¨Åe2PB*S{éÔce YÆB º©¦lÍX;O²:Àd¿fQCnMË-ÂÂðÇ£ï¶¡SÚÁdC,KÂÍõÞ=}=}ß 2y3R¤Ö3=}cÐ'Z®¦}±)\(YàP8?ÈÚÂÔºÇ¶ïiXEßÊè= êèÅDÐ&sÙ¦R÷_{Ù±4Ë2 	ÆzãT!gU¯CÀ@¼û7"ÌfÆúX«à-öRÄ êP$#¹oü³ãq¿«í³= sü§{ÿ«·=}ßÍ q?¡ÏÙ¨½Ãç×å?gÆôÝi,×¾Ö³G¾»= ÙM9jA¿¬R¶Æ'sÖæe4æ+6ªÀUùxGÂ+YbçÅÉM"äéÁZ]&ý¡9å(¡nn¶1Í^¡<ÞÍeæ:WæéÓ#4ÒªzBËÿ:°5G¬ÛÂÒ(âÄGÿö*ë¶.ï\¶l^Iì°ÔüZÖKXSý¨'	M¾b]±>0lùX(^^¼òçHÂSîÃçàó +!mû¤Âp= w¢·nHµÔHÅpÈXw]©5"1ü>
±XZ^Î9â¦gþ=}oäíçY÷Wé[~ÑÍ¾=Mãª¶&$óÅßah
ÂãtÛókÿ^Û7z¶#X@ùrÏ8FG"5ÄÐÄ~áUÒ8Ì­ËÌe3ÎñA´ºÌ=M¸óÆ~2Î,ô®dmÖ=}»u¸Æw:á!@- ¾ *ïr±F¿/Í;öMÅÂ1¨:4>&YÏ= ¬]ÜèÁ/4&øö0aMÞjR»5bãXq=}A%è9= i©¸¡l¥nô@ÃOPz»wÓÝlX
:ÎÛÝ(.TÉ¬|©Î¾²ð¬ðÉçiå_*&F×[	oô8B¦Brþ=M¼-ò»ËÍF?<@üønÍ|ãxÔr6hÚpÌöç#5íl÷.à@]ð{¹ø÷ì<Î<ÂuwNLO"_u7°Ïa ÿ\ÌrîÔdðó¶§Ô67¤p£"ªCËu@ïfcOò¯x¸3	²#lf1}U¬q±ýx¾jõ×»ó±ñ	ÀR³.ÙýåÐéIcÎÿ;F? ÛÝkØýóÎóø6¸'áû=}t8Ô]&ã°¿|%BÆ<þ·ÎÜ«ëÍ>YUÐgæE¡ã(Á
8ÔXÀ­vÏÊ¨¿6bnµ¤GÔÁ¹§\)é«®~î¿w"Þñ£à/o¯ëOïr(ÿ
õOá4¥àyáz¼}·æÌ²ìB#Ùø }JÏìN\]=}Înü4VáaÉlIA	Í<â:^&q/nõ×n5;=}Ù,ìâ­|0Bõ=}l;Á¶®äÓ=}a&¼½óß@ÂU¨¯ÜüHÝØ¯Cþ6ýjÒX_16¿X]~Y~;×*½ÿÊí²2
=MQ ·ämòjyÂbá]ÜÍl#à(Kð5ÅôÄ²ßqE|sª±×ÿe¼SÐo^[ØÞôXYá4ô@1³¢[#ïQ½,CèoJ	9Û«ÐKvnC&Â0 »¼°SäcÑ07 »4NòÚhr/#ÉReÊø?°Oíÿójà!c³hziÕ§nËGY³ÿòò,8ä¹àø¸¡µ¨X[|.ôóv3<÷£Û1²a<>G¦»=Mlf*-¨>9C1TQÂñ¬ì(*ø×d²¬p	?n=}ê{ÕÊd\ø\*·×RéÕR_Y>7Û!èc.¢V;$|òè¯+/UcMX? é9ÀÌéZm&,ôvõÓé¶ZÍ<VÓü°	Ti{êC§)ÐCU·RsV$gÖ¦îÁ ÖPö4fÃÑ>×¤kc1W\åÅ$Çp,%j1âÂ>¦¹Ð¨XþùïäRÜJ¿o{FúÐ¹ÝÚ³ó£ëî¸QE@mj6¹e¢Ñír»{Sg½ÍRâl¦í"C÷Ö]§@¸±ë:Â(íQó9È«Ëîqw±º{i"ÁjêévVÏ¿KÐ÷±ñ´ìp¦o.è<wÕÊ¾­Ø/iºdr2S£ú~&Oãè.¹
x*qT·gÀúÛx¢/Ã}ÜYñ-XlEìøöt¢Ù6À ùG
;%eU	àQ-ðÁÆô+wcq÷æÍ¸S©l¹¾!Û¬O ISüu9=MÊ-	!²;ÅUº¿v¶å±ØÆá¾ @ë]Lke1³,#o¸ òÄéÎ¾$ê¯3eI Nö+ãsQøÙöá9¬Çì<= 	!#\]ôÅvÉplñEÚt^ÍUMA Ï¼ÆüÓú}Sú",Ú}Î>P=M¡nOcùÀÑþQ{¹ËÂM{ppÝ5o;Úþ¨Wå7°S'1Ê= Eºg"¦^H m?P¾ æcà à°!£!f fT(Ø#ö%P!»3àc= ic   ðü3p £"Øä¨3ðE= "(	Íè±Sàçg>W 9Î¼5'¹ñ3!©Ý¬kD«êíSãEèí«òªý+Lo~EhÿÙ%á¸ÞÓ®©ÆPq²@¨Ø@ù£u/§>®\è¹'ÙÞ'ë>Ï°cLX«züèCõ­NÃöq«OëÞk^ÁÞO}a=}¼eaþ²ï.5pf°²/²Ú±Ë=}lZOÁÐÊSy5xLQSSOwø¹¹Aìì¸;ÔZ$O0\6kÃÎrÉÅÆlØ2²_(z¤&ìL¥âð¼[¬ºIPN¬¸/3ö¸4=}s¦Sgù0ÆíÛàÆ¹(â¬Ôÿ²ÍÒÁOøVSä®PþWì»9wx^Ôx<Ô¥KL¹ihx\ÜpÿÕ;<V³¨Ðòõ«çÛ®6¥ÃXF<ÿCà)Ss¼4n9ÁÆ¤%çÊe×X&¼1öÜe¯¢«.iXÉ¾Hù;%wìØJ|ûCàS-(Wú®{®û®Zñ¢0Zå¤Â,Yðu@­lð T*¨%­ëXæ¤%tÑMÌ¾¨ÒsH*sHµ= Í¨_T5t|Ìö¯ö" XöNV£mYöÇzÿqovÕÀþ.V	*z©æJ:ó4pÝH®qû§ÃE¬\Ú®T±*W¯2¦<Û¸àÄaxâPf<§PªQçhÐù*öÑXªìX»$vÐ
X©eL	Ø¤óa³ÝÆõLÕæÔº¬ôô»ÿ4)D=}¯)3ÈÃ¸d;=}ý­ÐNÀ"=}{Ó¬IC¬¼õâh@±óRF¢òZbs9°ö§¦1­³az8ì>+âTªH[Ql|¸ç6¶¥å@i§CË¾LêËGdÔð3Ö¤]äp2ºþW¾d¿µ(H&b3Õ;ë°9Ûeôó®jdúQÂÑTÆûd7.uo{Ø<Züºæ:'!î»Ø­:iÄ4ÓÂÀ,¬ôQÁ]v=}/·tæ5&06,ø$Ê¸t¶ØMõô[ªVÓÆ=}Éæ¨@A¬K¢§«Kä>N¬È]w5øÚ®dC{¼æs	ÿÛ3_ÆOSLMÔkí¦ú¿{¦YæÕ»QÿE­L$1îì4:6Æ=MrZ¾6Ày{øA<(Ål1 dbm7ÎN !¬Ûlî1_= ©néµÂåÅd¹¬Vk.d,4Þ3~LòôÞ1ú¦·½d=}q©7vzaY6én±Æó¯Ã=Mµ\^F>ÞªëàwÞ»ÏÂËþúækéy¡½ãyÝ÷¥³jp'ò°;c9¡Zs&×]Ñ]ÝUî« ­>_<(¬Ov Q×*xuòRN*k;*0ä«¦øÄüÐ©{ÖÔYå!1è;å&ÜÃFUfmü&r3ÄèÄQñb)2ãT#À·ÿ¼%TqËZs>cU´zuÏ	¸ÚuQ=}óÐ-G»ªM(e²ZVê¬½v¸ Í¦OT·S°{@R0MðaÀfÈµÌ_Òú|â<ñ¡îÐ¹AéÜb+!¡O#*¾ï3¨0âO"ÍxÔûÝ
ÃÝ'´Güír-|zþçWæ¯$×[ÙÉJuøAD!>'o0K¸5×=}þ\e8
?»þÆüÜ=M3íúPþræ	M×Öq&@ýÑWnBÓ>7ÜÉTùÜQ¿^®ñ-,å!'9ìsùÃ4?BTu&éçãÃ,?(&ój /¤£Eà'â£= R(/Â¤¼=}Íf÷I³HZépôSGÅQ¦+^@]ñïGXg¶ò¤ssÀ	­/µ¨/6ÊbÏ´%°/³~å¨5|e¦U9¢$BFp´¢cë±²êÒý´f]ð®ÆÆÓÎa.$ªó=}´Y_óì õ Xó¢Ëï|3;-%ÏS)÷ iTlWôáµa6m u¢Þ>q9 'I ±N}ÞC>hïGÒ*Æ·¸PØ¨)Åéø¯Ë¡yèZ?1^B\püõôÞç¹Ã Ôð4ÚIsmQÚÆû¡u°|î(®±Ø¬$©+=M­°8ggÒòCÆKâåþ6Ä¬Ú \Yý°-Ð´XÇÌíÁÚË2ñ=MdÑkhhÉÃd6ñ«Qt»|Z³ÜuÖUhÏ½çØÛ}½SýË}©)Û ÑÛÇwßC ¾ã't¡a.ÍJãpa/	ÁâÿTVÚ´­ý·ñ¬?{«<
M2I©O}³&ÿ¬øu®:º}ëßGnêtF@1«=MÉØ &Õeî%~ïNõI'Oöz:?*<á°TEÅ²{Ï¡xÔ©ä¬É®ò%}Iù$§	= s~;ÀíT/¢¤öìpg ££»¬údl°yçðÖïfÊ¶úÜÃï¸F÷ÌìÊÝ}}yÑ^Ö½Ì~Hí­ÒÈÙ¥¶kmzkk£%&¡ËmsÖ>ÀA}Ô?ºRË%]\:&DÂ¾[,¦Ñ$ÃÐÎìn´cÓ5ÆÑO [}=}áÖ(N¡ñígµâ9c&=}Ä®ÒÎ¾Q,öÔ?è³K'VL¡](ÂVÚCê0ø##{ºÿ3¡6®L(¡mÕ"ÕlÆzÉØÌÝ;Aª¸_ÛÕñXã0î|ò IUÂâwÄ¼Ãú®[,ÊZH«§/nPäõ]eÿõuóuqú´Å³n=}¸@Ö,ñ«À7¸£Å½ïoàõ .® <òò£àzÏq=}þõaé¼ù^Ò\¡Êáä®ù!MGÓ& adePõUáßá=M	tï¸
¿.Ç_ò$U+å¯
w§ÆËp;t'Q$2%$}­¬ ^(f%e_0^ Ò¯°j¸kª2{m4c@U4N-LCæª!3gâùã¾Fm¬EÇtîÏ6Þ¤ äxN8a©Y(O}=}­ÔWñµÖê= W¹5(¹~o»%V´¼ÒJÓ°ú:ÎÅ³§0V÷zî!°¦¡øðÃL!¦]èd< ÛN´= C¤(Æý>ñmÇs=}ïû&NK<ë'»é_È!ôâ[õ³"¸ÐNVìºª6­°Â*v=}7%ÇHßDÌ/2Þ= 5ßK9'ën"?¿lØdmçþ¼S3µ­¡BÁÞø|4ìX6!ôE¢z@ù}ï<|à@T¢#\âCËêéÙdUè®8ÂrãÚ·AÙvq¤A4ÌÈAäv¤ Ä,½ÛVq^ºÞéçÐ3'Á69÷[ÎxÈ»áTyþÎÍe úî<=}ÕØq¿ñ²9y×m²càSÀÌëxé c¢b9¤¡1c7ÈHD À!xÚÁáò-[xÚ¡xÚÁ¥Å;úxÚÁ¥Å;zxÚ¦Â:zÚÁ¥ÇëîAÓûäd¢í"äü;ö'¦&Úlvs¥æ~cQ±¡K¤ÐáXÕnIÆÛ!£à¿N;Ý&T,){lH:_}3 Ãø½óÿ{ÎÝxöD= eËjv)j-KtÚF7ÀÍãÃòeS³1Ð{!ëwH«1¬È¸Øýi¸0mOPüéyMmOXÂh¡º<¡!øÎÀ+ÓÿÀU!4¹nð?4¬²Ôj FØ»ãw;pÃøÐ"ËT'b[[Ý¹?°#O·Õ·O%·¹¾É³ä,}èÚöÝvýÝsÁÝÑ*z¼wôõÆãúÛ³~t±üOá±Ë2¸[
ÁÔ(û6ùé2oeÅê½úLÁVqR ÔI7ÐHh=M*àCY¬Ñ­p#¸ÞYvGà¹8	<co [³KiRGj&õÕu6:ÿ¹C;´ÕÝèÂËjÒOõ*W±[Åk¤íknXâ±vRa¢¯IC¶Ñh}£]ÆãZµ*StÂmÔkøòÖ¾Ö¯w<
­¥ñÍªÊw)*èÑ;fy>6z'ÚsFaãì(¶õêÁöcÔ@ni±c'ëA>QÐ¾ñBù$JCvb9|U3q³Ø 8:Lw(ô¾îMàaSåÁ®bGÎÎ²ÖÍÞ= 
<Ò!¯É."îRUéwºÌÊaq_Ë;e]¼.ã1ØÄ~qØ´¨
©pz½¬ÓsÐü¹Ø:2R%3§ü+ f=}?@Õ,zèz%øíaj*MôÈÍ$w§îyfhEáeD¬
ÿtáÐ¾ÁÚãÃ¨V¦eÖ>I[Bë+V(mÀ®TBã:ê{AÓà½WWºÎ.®yj{µ¶y/5kÙ×¹wð ¾ÒäÄ-¦ pþ*-+i} Ë}}ÈiÅa<ûceÒ¢]ùá¾vÿ¡+øtÂçm=}qI7hyPÄH±ÒlØ¸juOÔ×ûÊ86
%W=MñàÎ{_bØÓçõÓÿ%$|Dì£ZL3F8VãWu";¼×H°×kyPøÑâëp®=M1¿ëAp:U>2{íØíwK1-<êJÜÌùksöK&êB.3_g§%ÄÅBÆ_®Õ¡o8C@Ao= #±®Pïf|§áÓñØ)¿G4¦ÎïVYÿjMa9)õç[\Ã]= QßÃ\pn,ra7©ô35 õH¬mµ[ÁÏ¿¨îÂëqç¸ñïy>°ã¨áP4ú¬Pi;Ò_çÂø^büZ°d!j©^/i¼CpÏ b0üö¬FE´ôU$­iÀâ´v+)ñ×"¢:Ë=M¦.Ur{	å=MÕ
IÝFÆFÄÄãç©Tùýl=}<Azào.ûy2£xá3yhUuj½ù¹c-¦&í-tüßùo¹ÊËElßµÕx¬îfF­eþ|)¬æ«Ô¬æ=}f[8mí ÝÁ¡Þ¼]"dÃ>PÅß?F^ßÁVä¬Õ¾F ¶»,L±>4"=}8º¦ÁØØJ:Ø¹J%ã­JÙ/WuØ©*ã¥<^|M½©­S3<sd#ÖXæ<@ÍÃNÚÿõú^úÑ]þ¦ÀÿÓ³ÜÃBåç¥ð	òS,çT à@ àÖ d"r°¦öFUlëü9Æ[,óÒ=}¦ùîùÆªÌ(@zØ[«+ì=}æýûÔQ9iÅí)X&7­Ø%µ²´Ã_	@´ê>ìÎÝc {À·ÖÇ³C /zïç %ZzßÔ,NØ/Sw,¥¬$µ²*¬^S=}ÆØ ã:iÈ#eEÈ¬Íþ	õ{É;^c÷Ô§ìgÁ°^ºø»´ömìéÆxÿ%3&.·ÉÆ±l·Ó=}-p,Cóó£l[dNÆT¥R³=M¾¹5Ùýb6Ýr¸MéWB$Á/í1ðm¿ÁOñÔXLþ4¾kK½É¢PgsáäÜðSö¤ö9ÍKzotõ= ó}O,LàænÐ6®=M^5;{°fÚ['[Ö^Äýª¯Í´M"&¸´¥øM½&}þýç;ÇÈ¬vyÀÆV= mFyÖpc½o(±Òk.Óv%ÌôpÚvÜ¢®Â5?I].íý¹2RúHåÑ':ô¦	T°éåXñë(xj¬3B¦_×'~H>¶ãðy©'+XÅÜËXùêñ·w¹Ï-	¨	rF}tÐrJlxËã¶&¹Ð?Ðî±lqýànïm.^Î\RðÐÄÉ?ÒÔ]hûîqç¯WH÷CJvÞFñîBÙ®Ô|Z@ä}#Püt'-F:¿&¨8§F"¶Q+à-æU|ÎÍ£ùu+y£¶ý.Ø¢Z\:
-ï*°s .ç$áås¦.
Á89¦cRY4Uh©Ñj|:èÑô½9®MY<¥<ÝX®W·cm#ôU	»UDaI	²ùlZùqä¨RÍ³Î 'SA¹g(ò©bÕÿKáFÒm¸\Å?Ë¼â®E7g6ö3«úå6][éæLÁóöó]ct5Ëig×nò¦Ï	¦r·îêÆr= Ö´"6s´×QÙÇøñúõ^mÄDÏ)ûÈåRªÚFÅágéôIQ¨Ã æKÄ_¥Ì®ð¾=}y4äò-I¿= 9Õß»BrºÈùÁ=}ýôQ÷ÃKì|Õ0ó+öËÔq\@ªÕ§brZ"/O­b Xð iðÝQ53ï Ú>Úm¶= Ô­pî<S  e¨ö}ªJ=MEÖü|£gUáfÙY¤"kï|¯V{ôeøÃ~gøæhKw=}®G>Öâ±þZç7ÛÐ¹_õ'@bS(õzáh)f[9ï¤ ¨mH¦a^,Çxs®35ðúÃàí%*J6ÎdÆ2í<e<KìXãX<X©ö#®
\.«Ï<ÕÅ<SZ.3ç½6.ÃV®YYrtÊtúOêóð?H}ÿ[³´u>µ8[¶iä7Åï^¸iO¯°nØ²HõÒè·KÕ8øºB2RF;*gÚ(sW+ÿÒ(×½1ú9ý4W)¯_+g(¯ZÒe]yóÔAL÷XT«eEí±>ËxqÖ5¾Ü±¼Õt£jÂ¸ö ììYÒM©õþovÐ7¹ù^«Pâ·Òé¸¬Vó±~	jî]pz0%d¯À!Hù2	½n2åÅ²hþ"Ò¬SÄ÷ð¿4sÑyo&Zñå"/ú²oÏ¤òÍ;Hû+-ÊùnÎq1D»2c½þÆÜ	H[lc»¯q¿Û²_±ù%¼²= 
ýNóÈÒÄL¹"³óÈùà#Ú3¤íÁÄ-ï	»5I{ºÙ	CEj×B+Èo)U<ÉÀÇrb-9üÀKzhÿ~-§¼ú­g(½@¢n>ýàm3îýÑâÞGæzæhÞðV§ïT FÂaÐ<^$¯U¦AÐX<)íÚØTTµñR>NsFÛé8*F>1¦ý?]3_ÁùÝv?õÅhØL£9aö"H/ï¥¦!Ì>ï§Ú¥(Ò(kÀI|L¶Á÷ÓðKÑìJLÒ&¦®ÑIí(åz ¢aÑÆù,#L0Þì2ÞÁvÐZ­5/öã Ë-DÖð/o'8¤G=M¬gMî8}
¢ï|é-Bü¡×s]1û©ìû~ÐµC¶/·!ìº§w_àV  DG%Àª"Aî,düª@¸_sQ,æÝ¬¼¼E£9dýcðE@$WcÐfHêCcHB¦ÆP8¦áÉÏ<}mP]H§{Þ
ýc!éb%æ§J= *äÜs= o})ãIj48IQXd©îg´Ø³Â¤	{EJHÑs«ãT§Ý´CE§â®¶_çí<­ÛXfå,ªÈÚîNg3.<fXpá±sÌj{îÑßºuMçî.ïf®ÚF.Ý6®ùÍ<=MúX®ÊëÌjEgÅpÅfÅeÿ¯ÀIóýÆA³¹NH¯
'µ	wÅj;íDCºCDV3EZE=}ËiÌ	O½Ë0iÕ;jÛ<±¶^ùL=MKùK9oÕ	.ÃïøOòÀOUò¬ã¨~â[ñpA^Ü¾¾PÞ°Áßf¸¹C?6lûÓïAx¬PÁaâ)áG¢ð_ªp÷Em3pÈFûnXºcÖÖjÎýHLú¾}^ó¹ÅÎ÷Ën³&ÒB:î­ÅÉ3ùÂQóyv¢¸ùÎ!ËÓ°¥~æ~vÎ_õMxÊä®­¨}º¸õ69ûÂÝ¡Uö»ªÖÓ^%1LÖZ¦-
Ú·%«.Ò+®gùÉG¸¶¡Åüoëø5Öá-vºê~TýÝO^'½R¹ÑI3îÂW
ç¯lWöppäI:CQýU}lSótC÷!=}È^s½2WÁÍð@ÿ.ýéE×Gù<cKñ¤µ#ÉdT¤#¦óG=}ûPªþ:k_G°ÂRí3±¿ölºÌS»l%)µxPÞ.¨SÀÀ+p¯ÅtØY]þÞªÎÏÅ³m¨û¹3Î{qÞÆMmÀEyîÄIG¯ã~ùõ¯Ò¡´pCÃ^*å
fÚãW³åâÍôÑçÚ'¹½-Çú hrN¨ÆÒ[åNz±Ñ§.ÃÏ'êcU	(-÷Xf»ê¯3ï]a:·oòÇ	ÒLÅX¼ÇÉKNrwÂñ©ÈEúÿ*½µÊÞG§»ô6}Ý½jÁwóò« é^ehZQ¯IZ\³Ò×s|ªü¬z+:àÅR¿fWôâÿ±	æ/TGù¥f#C°gAÉNÆ/jÉ pY?ÏDÇ³õ´7ipbrMËGfZ½öl÷Õò'x¡:¾5Ö£üH	 Å=}Æl=}Ûë[aÓÂSuáªÎèJ¦^:xÆ©#Ezrô=}Û*À{oü+f?»^ÒOÒÕá¾£nf$Æ.à#<_(n-æ­ãcpÑH"×-ãÐ>¡÷CÁTö¡ãB}2¯âËÃR,ô[¯å§ºÑèV.õÙQ
ö$¾º¨7±³PGRòLÇ &s¼(KÔÆATÌê»®÷Þ¹(-¸¥UXV*UäzDæÞð[DaÂ¯4­+%/{íU£@ú+Zìaà¬Ù¸ý>îca#Õ»¯37 %Hj~¨Ãªe½Ó8½[LaEÞIZíUdËAþDOcÜÿ,¹Ø"ÞÏà#KñØ*¹ËPòÓy£ý÷
zàù(îÝ¬QHå8÷h3Øæ¹ v¸ÕIQTù<¯ÒìQýé"CõLÑÀEÖmÕb#KVÕ¦ÙUaã&§Ð¬M¶}ÖeÆä.¯SÐ©]6]Õgö'\ï É±C<<qÓê)}½±Sÿ¦Ûø%§3}Ðf÷5ÛâÆ«;²Xv¦¾æ³®Ó3]°Ý÷#{z\âî3÷>bTñ+ÃÜps	¥YëÝQAî;÷[ »½/NÇ¬ÖO,\ñMã7äõ/ÉHóç+Ý ¯zõ C"ð²7 #£#q;¨a"ñÅ\0	³£Ðø[(ÑiaèÊ*bÄ:,ÃSáH2,¡R¼Mã=}RØKcï:9Tæ¥Àþ\$Bc°[$ªê0L92ªÞkc]H4÷o¦H¢
c^B,^«ã0=}¦´po-£·PôÖ·äY7éBç¾=}´¾³ã±<Â"YæÔsàÈ"¹%5t êV%¤x%ütÝ¿J°|À= d³
ýc©Ã´¸DvbÈädE6H±Óq©¬ýj¬_ÅdçËjÌëpb¥ruß2ÓKµøüÄ¤®Ä^<§¾èñm¯ä<®üÅ<Û­X{t[d\-ØîY,ÖèÃYô?GYäYj3Xö~°E¸ÿix¨{6gàs®OYîôÜðÈê¹
Wu%ÊB®â2u¾R®ê*®ÔJ.÷¿<ßX<üÌÈÊðÈùàñÆÚ±h3çÒ®*5«JßªwKg¾êÄV®0µûJJ38ÉètËDÉüwésÊrÆkÅnÅiÅuÅ=MýMÎ§ö =M:ÓßÆïO-gåÉÁ!õìå=MB+ßE
»¾ì÷7fÊi&ø·D=M4iD9j~ý±äþL©QþK1]X(¢' Q¢H*ÕûVËûÖÖûÖûÖ[o2ÙÄrNgWÇ[¹)ý¿ï|íNoúáöN^ê4ìïQ[÷öÞ7Cê6ÆèRIÌ~h¯E=MSWWXÐO×]ùª°@ s,{K­ÝàöuÑÛÍÌ 3»= Æ±þYÔBÚÐ%MÜÔ®d´×°Nz@½~ìqoöIZ ±Z}ð¡äôX	YÍ®"RßrìÇßäÍ2ÄÉÜÔÇT ±ÇLEÁnÕ§!*»ð´R+Zû¶Æ[rKWúY
e&nÔ(<ªÄehÛO©6ÖÇ³.ïIÂÛ§êés-ZVrï;ßÁÂ´ajÖ9'3±êÆ 	óR3e9;R?¹«âIîÙÌ ÔÌ©{§y;+êW= ôýý´û§ñ'Ñq<Ýçaâ&¸[T*~½ceüe\5fNW÷=}ß¯Ã¬ßï°5^î§þ?ñKJwdw?ÌQáËÏ"YA"õyØ\L!¥IüÌ·¡nµ<~tJàÖz)ÿ;u úÅ¦UU;W¢¯QÁAöW¦Á®I"íqq)ÙVHX§ß=}ïö)%NÐx=M®¾­3Þ°X0 ax²>¢W»ãQaX2ýÙñXD.©Ú)Ð?jbÛt¼kkçð©LÛ ø¶¹4ª2ôO£êjìQÏ¦ZhW= |SbzÑ{'|FÍyOæ(¢' Ð"  ¢ùÖûÝ|ÓûÖûÖ[ûÖ=M(
(,ì*<ßc(<ÀMj÷\QÞ©C8hRÅ4®©ò<±aYI:Ìè¤j¬ösA³J)?Âaäm~ùÄ.ªòtÍôGÄâ )fnTÆÃ×I&ìØáÝ7¶Ø{sè&W7[Ò>ùsè7n$ÛÐÓKfÝýQl=MXOÜêÜ	×ü·×]:à5+ð9dn¿0úc¹ÒB<#ÅhìfÑ\ÄWù}ý/½!<Y°^Ã&3úQ¤õ§q7R¢ËÅCYTÜæÂ·W®çFÐî2*GtÄcÆÔ&Ïîâä<ÜQþN¨Û5Oûå¬9Ó¢ÞzË8¾Øºu§÷ðÚuVT3óæâ+ÓµÖqßµMiû8[×ï=M½DïøåýÛ1ü0ÏÛ73ñ´·=MãI_uÏ/@.ñÔP'F?|ßÃ8<cõXKtnðÏ$§Jn2¶ªÉ_ns,Ewï2<Ê{ï3Ö"¹sO²Q2!±·1Ù¢Ýýu¾;|²êåØ&çKò¼«g©×.?ò>ÊÓò#Bn^¡gû¸¿ÐsÒ_ó¬Lº¢ÛÃ~\5}Ã:¦á±gÍÔ|_ÐáCvV¿pÔ¬Ûé7n8åc;*zÿQráLµ¿´KÂèÖúEÑvB:'8åñ1­Ðh\ï¥b¥$ú2iiBÍG9ÁG¥ÞbJÏ¤TÂdR6éË6åÒF¾cªdNÊrl·îGnÆ á¥´ê7hÑ¸êEÊ¶òÌvf¾fY	z5trÅw¥ÄUöæU,TÍÝ=}¯LIÑàøÎ±q.m<·k+ýÍXÖQêÛ½Þ=}¼~7ï£Ú:òãõP¡ÏB)¢'àX4$ ¢Ñ{«øÑyûÞÊÛ­ûÖû¾Á¹*3]t±ÍpEôk­Kõø ÍnóT%:ì{Ã¡§p³eUQ0ÁöÓh»/íúØ¨¨ñAyÌkt«N.]¾WÑ|ÄofÓ^w¤&ÏUÀsèõ¦¨¬hydÒ·Q¢5æÜW	r3b}myªÆ³9)íÈÓSÇÖYÑv6¸á\skFyòïàªöÌøÏíÆy·ª-ãxõ&Ó!ÖÞÓÅÊ§=}Iïð²ùÓÎ]fU.4À±CÇ<èçG¼±°+µMN8ÙR±K¯üð»
æo]ï½¼?Ì	á7><±R¦Gvå~XåÄd¦æ_à§¶µ^Ü0Ê ZbÚ­0Ý°*1×ª¸tHfÐ¸âú gß¹òP¦ßgÕQ ´+!ÄÇ&Â×E°¢@®í-°PC§%	eP^UAx½,lH>MÁDú§_V¬ÖOµ¥bXû3C¨ÀêQ2æfsD¢ÆH"ngBJººµñ¬Q­Áx,ï?å@N¨åLg]¿8gàX~õa=M1810oî®g}¾à£³)/iüd¶ÉD1OküD7°¬fRãÞFSÔF%ÝI¬hÄ2Lµ©ùlkCùD½eÝóyN½Â ,zÆð^£ªÂlz÷ÒæT«¼~yì]µåDVÂÑù¼me.ï6 S'µª|ú°k§>ÃÚ	= >î¼;´oäÙ2e%Ü!IW*¨-I
Øb7CÒ¨mNÂ=Mq1cªQÅ8µçå®Ná)&/jx;~êÑÅ¼Úyjq= 9£ç´±Á¬6ïÖ,HgØ¼-ö5L·w0ÚÙ"¥vEñEµÔOË ûj¦råÙu<Ýze£wUtówUOðNÉÿÂ:<¿õ3rëÕÜ^tëZòë°LÎãi=}C9ZÀ>»½´ÈW0¼ñ= ä&n¿¢mCOÊ;ÞØ±Ñ/:YýäúNm({»èý¤À¤¾DyOá£¤ê0I³Ý´7Ä(´øk¦»¬ïØ(8ëLzJMYë=M4øµJ(¼Â %zjrµ\:ÌdØ~©é+?&ä!ªÍM¨Â;ÕûæÎû®qûÖûÖûV®¹´Ñ;zøÔ;ÉÞ¸¯¢?¥ØågæwSwÙÚüïæûªE.ðÆ ¼JàÔ!öý,ä/Þ°{°ñ¢\Z7A¦7*Åc¨sb$§xRäìô*÷(zî/¸_âäî1Ã(eøØTbÅ+16Å®H:déý]jÂ%q6½¨c´,Bµ-V&-¶­SÈÓõ£yºôéÒÜÞé6÷ä¹·ém®qC·¥ÌñâÐ^îÂàf«·MîÑè»êÆl»_zû¨>Vøÿ³¦mçß¸êAei§!í<6Ù.æ[DxðôO^h8ãÅ6·}fÕéMNvÙÔY
 ÞkÖÿ\RÇØqðÃM¯¡½]ü¾>¹F¬|Ñ	°çÌ{>u^L¯KX»eÐÉÔÀmcá¿ Oáå)¢^ë$Ï+ò}4DFX»Äbi²ÅEUiN´=McE	h.Î²4üK	~òÁDëéú8ªrIÒväcÑ×ÖÂ;åÀÐo¥:ÉèRsQ¥åûªSw5]¿HÞrtwóJÑÆfí¯º¡õðäÆÇÓÌÁQ-õ¿ÄIWo³µvm£ºGTùj]öÇÙc³=M( b) PûìÖïÖûGûÖûÖûíU<Þëúy /¡ø'Òe-Ä®?Ræ= ü¡Îe"Kê&Öu+ìË?üB= ¡k#¬(ä¸0f ü= ¡¿ö'º+Ìþ;ØDÅ= ß»¡/"¾Yï'ÂìWîoü?ÂùBa4Ñ[Æö©åiä§ÉdâB{±Y§¨¶wüIådÒòqo5qË¦8g@V1{¨qÍd÷nw±ÒÇ¸ùgU= 49L,ýCåºQQ²[u½A~ì=}SkLxDÂL5½¶«cKådÎ£ÝiøBâVq§hÓkÕgûKz7±.ª5§¼¨øôçå3³sÂø÷f¼\KÞ_O²0eOªº·dóëÂ5qÊHíßÞÿ0þ4[ÌÿM±Ö®x5ª¯©ñ¶ÞxY?¨}¶Áx©>Yþ^LÊûF©=MÛÇÂ¨-ÓûS±ïZú2Û_]7ÉÍ²ÑÖõNû§Oä¶ðÒziËMÍ§-ÓiV÷vøfû'¸½Ñ«õø=}Û/=M±]ÑÇÏ=MÍ÷ÝD(> ã¦âP îÖûkþíÖûVúÆÖûÖûÖýÛ¸q×y+¼©*üwÙ}Ûîî ?u[÷&L,§|§èGkØótN	@þl~pýä_[á-ê¯L1¿ýtl1û]ÊñÓúÎvþCXSÛ_¹)ßÓSöÐñR;ï£g>Z¶¬ã¶´ªSÍe*Ìs£½]èÄ/{QÛîìËê§y¦Ñb"®yLI[3pïìmÚøËAi4]Û_¡®½½fsíÁ©eP%u]}(ýjFO9ùgíS¯rüS4ÓRiÝeK*?²ý·ôù¡öÀQhQr¬þÅi²o³LÝ{Àdª÷ô®©6­óÃço¬u¡Y½c.´jËqé2:ò1lBY1HA¶L²³yZ½<µkV1]~nBqUôÙÚ©ÂTúÉfOxM:¦°Ö1°l9­nï¸^19úshZ
ìâ<«ÙÝ «È9,¶Î¢ñÅÕXFß!Ê)»AV[\N¨Ðé>xhgçA(®ÁÌDê_¼¥PBbõÎà-ìëØ­ÂqÑQØx
*vÿA
G¨Ì¦Ôßç8/ÛWÂ0þ(xa"ÊÿÅ0KF£X5Y¸K½¿2DRtûÆ&ÍyºXÝ{;qoQ~u?Sã,qþ¬{í°æ"½vèÖ¡DùÃ}äÊTì=M¦ô_>X»%9î7rzX^H(qïbPV],®fBöG:ÇÖçaæQ!²»³èU5Þè= 6êNbÕR?£6¼r¬H§éÕJõÔe]²NVâvèÖÛNÌ|ÿ+ÁÆ?#$á#5  = áûÖ=M·ûÓ=}^ÒÖûÖû±ÒæÍ7zS¾vÅ!$-áÚáÄ9.ääl[¼þÝgC8åÙñ$È¬påXKnråduFÄ*¢]#Ù×SÙ^Vk­0Ù>Û¢òbìÊ72ÎïxfÓDîÍdÛ5v÷ZÅÍGáfÆLøì®¸M0ÅáÞD=MÀN¶úã
êÝõÿ¯Å£¬9¸ñgØ8K/¿@èIg½áÓ\ß¾«SOò|©;®w:?oþ )ª;Dù1J­ÄÖLgèóÄBâÅêØ/rEÀd­OÁ:LÔð	çû8þÞë»bö?0Ø^5?>@A¡/>ñw¸Ùºo¸Ï´¡*ï(·®Êô+
E~~5E~C&	×8éÝc~	]£õ_gjå¿xSÛþ¡9Ã­0ó|a¸oFdwqçj¦ézw
¯N¢+\rög
©!Ó;äPdFºÂWñ<ñz+¶¿Ôämåª	ÌÙ£z¤MwK=M¸]â!u®ÌYä¡Sú}9 ªÙ;cç«GIr~ÝÆõõ§ðbtfsÒ] J¡|7äñèæ¥×B¬ù2h« D÷ÛÂ¸ØV&¥xåÑTM¾E2[²äÏ7é,o¯TN°î&&¥N¹hÔÙQ§aNöhsÒÓ°mï«X?~ìîqÅÔ¼OcÄ}nx%¥KË(7vC.ÌÁ=}ûÎöìÌ¡eM­dë6ô«zqÿðîÆw=}¤ÆRÒ» ,ba Ó{èV¶ëÖ]ûÖ=MºûÖÍÛ§i£¸=}\(£ÙW(.ácøHÛÆ,ãI8/¿.çö(æ¯= ýhÎM9åyÃxÄT:­~Q&ãÑù[.ÉÎxØ(¢@Ï$¥/4B=MÉP+eî6ásc4¡=}d¨q?R÷æãÄ)Üª¿ Ðdf»ä¥¶i(ÛnÖì4ÔÇnr
t´õÇAÒZ=M£Ð	,R¾ïDõL¶öîÂðVmRØXN+Òÿ>ñ_!YI+ØÇÓ°Óç6IÜ8©äåõz¢öñÅ¨«LR|·ô*þl|iöj\ív1UÛÎå:ÖÛÎãÍ{oh÷%¡fî?ødÙèBRWSÙ%»{Ü;Î=}ûø:Ø½¹ê@|¼êÉ2ä¶iPük2½Wr\ýÕ#G½Ìîý©ÀóNÖ»©]8)EHOû½Qå¶=M\ Åa«.æ0e?/(S¯Rð4·àX?Çú)ô÷½¨s¾büT³_¼aøyî³cÇTÚÑÓZ¯+øßhìkHÖ}ìLÍÏPõuÊ."90k³eðZGpFa;qA»Óu×1+ÙãDÛü¯¡I| ÑÃ>ÁA{">¡	t^éÇÌæláÈô\ô+öYÞÉKZ~3J¦ÔùyV=}±¥)oÂõ'ÖhûÊo\Ôäxñïd¬së¼ß0»%Á]K]«ÐQµÎ \G_êÑi>E9%²ó4øÞw±èª\{Î¤Øµ2kä´yÇÀìÅN¼É@rÈ¢)uDBt9Ñu­:/U:ÈCÈîÑ:ôeË&q×T²Ç©M.g»VºþúNð×¹.BÚ\vôm¿Nâo8}ÅçÌë<oóç !¢-ðùèocz;1d°¸QiJæ.Va
Õ)Ö­FìÜª¡I÷ï¸ÑJá¬ìOà¼;MØ¡ûbkdÍLñ¾åKÒg{å:Å>¾ùtcø-{æ4úsú®ü[?ÔgPü¾'LZÀÜö1ug6Z±=MäôîÜVÆnø¥·ÊNl:jGwl|â­mÙ®¥[÷\x²¡ºÔGcò\ñX
åªxOª2­ÂØ/OÃOÞÞ$ÌÃÿõ¯Ã«×PæÉIÿ9½(Ñ?¸ «àoþÊdOÌ1_W"?ÑW~uç?¾Ê>ãÜ?÷&ÐÁJ IW#1L+ddF¨eaÞ<ìëÜ¼/(Òcij/àÉPrsâØ\<Äb®d@7?ác±L¯­¡HæfgAÐOº	±ñú3ãõ8å²>:ë¼½Ü-©Ã= J¾CádkFLH¡©d^&FÒ= B©ì Dä³Y?°ìR4f&ÄpcJùriF­´³nß¤äSx?°¡¬FF!¹©QKP«g2ùd$Ó= R'ÕÀ<ÚE4¼kÍt>¯bþ±¯^508v b$C*ÛÇ¨Ç±eÌøwlctQk8sâ±£Åì«KÅp9Y[r®}Y:çJ¿|áã3µèÆvt5ò	lUSËÙB}ãÍ:¾¼ÏcM
7ÐèÏã]Á¥ÀÉØ¡QÒ­ìM¤;mhwTvSúuíØÿAÚÆ¥Í,ÍãVÖVÖ[¯ºûqú¡'_¾2ÿþiëNz[Û8Æ;ñ¾Üq/K_ÒÀ·-¿xWØ¿uyT 	#¯@ #  @xçÕÍøÓûÖûÖûåûÖWJà¯ßeVì¯ÇçÈ9ï©¸gS¤_¡A!ÔJ9àù±!n%Pj0è£r¡Øf'R@¥aê$ñl0§î$1H.Æù¦®-ù^ªcèN7bÕA,ì-¥dàÉ"¾®3 ¿G@nJd}~¨Ü0¤4³ªHv~dî1Ö\1É¸è¬3Kwì©¤éDT=}Gá¸KËxêÒrÚ¯µÂ]K¶hæèRRÔ¼]MÃÉP´OÅb9RJ4áÉpf¥¤wR¬ÎCâØ\¬aLI6î¯Á´Y:îT(Î4®@$E.eð$Ó*eÒÃDÙBÙS²'H>®ÎHn­Ó]ºiýÃÕM:çç¸øÿI¦Î;h3ã)LmûæLc¾å2È¨= XþL­Ã£XÖÆåC8oÕìØ9oa"F°UC!NEpUB±Úµ2ÉSA±ªÙ©ØeiD´jD?mÀR®¼>k¾rßEÓþ¶¢Ñ*ËVÅ0F¥¾ºt*zÅ²ØBµ/s¹²¶æüº³æÛË«j¾nhGZK$9K¾¡h&Ï.P&VFGÛrFG~qQÕe6o·Ø»e»äõìïô+ÒÙB¶ÞÄ¼£cL\HÇoYN§¢/}4LøÀàba~Ö²j­µ¼¸ÇdméÈh5·JÈ¨<ÃÂ5MÉqSØ§ºþ»õTÅFgÁaòdãù:~õ°<ÁsYMÖ±zö>ö2kk;Û®Í½Ü~ÃCÑ.Ê¾âÕ4ºÊg»Çg< F&Qp»¡wÏ-w8ûèhYfN~T²MUñÒ¤©ù#mýBÝ©Õ¹cmíL¾ÆëS¹¥'EL,>A·¥)LrzÉõøêÒùv¾×B4ùèLcóçfæ6;¢7VÅûytûnµé^¾ÒS¿½.'=M[ZXÙâa=}'ÅÂ½HèpGãX	þiuÅ«ô¦NlQD÷e| »NWÒnúÏÓ¶»ï1>²kÐ,ÿaòcpÚ·UÜ¬:eäëÏ~*cPëgå\?9*'àX  ¨íÖûÖÖûÖ}íÖûÖh¦Æoy³$²úEÐ"sOG0ë±hu2ÙôM±®Ë3K±XB¥aÙ1Z\ ¡e$u)(/4ðLyà×ç"v47²È5Ð°fÉbF_5Í¤¨üZ1Õ¦¨¶JÂs1%j¨ÙÇ1S°8aÒ¸¯ä«jhujèú¢Ã¤nD,K@¸djç¾rDËÅÞAEIÇ,e¢¬3=}T}Lò97RèûpnñÈ¼2S[JþwYëÊIPZ5\?ÃÀý.%÷~HÈwriwÕ²¥´ÄÍ»j¶tñÓÅªF=Mtü»ËÂ)5?ÞËuwÓáÁHU×ÊIdm©â:¨U¼
Ê2-uîhÿÕÕ¬YSfkÚzj]ñrÁ°®B=}OZ	xß= §Ä®WÿÔÏÂÒyoµA¢;¬ÜÉzV#;;7Rð²¡Ç[-,@{CÝ¤fîP²Î±g¬^8±·Qqkg/3ikl8o»Øí¤Æ²¹µSOºIÒòlÍR³ßÊ¥f+{ÑêâÁ6ºÒPÕªµK&K9yIÖâj±ÓvÓÊ¢­:;µúxßèf¹VÐÑÃÄ½ç2[ÿZøTóîÕÝv\Óê {'#c.~­@nPÆ£U9½Ï	Déj_GÎn¾Ò£³êE|l2ÚØÿúeééN2×ÚpüñRÓ»BÕü|WÙ9ñçmÑåÆ?=Mµ;ia/Ý»¸P¤§±\ØïHõãr~tBO~jm2jR	Ê·5ßÜLMÔì§Í½¯¼³ÌiqÚ¯%ßLÇÞì¯ÃÍ¿ød_¾_MÏiãïÆò!â §B!®.ð} í"¼? jÁ@§»&¹*:0D@³/$éXh\¨­õcüv§üAäÇiAE¥xQd¨¬eã¬6ÇS¬Ù¸ãú=}ô½P§¦yyNbg¤Á(û§fÑLâ£1^_¬pWs4sÅH>i4}Djq~M«R´º/ÃÌê0C¥8¬¡8Ë'åøØPæÜýQÚüªq¬Kåd»åÙ«óÒg¼óÄFX<À ê"@Ú»;'ùöíÖ^ûÖûÖûÖQ¾.¼Zó¡óÏZÐUÆãì.JX\ðÑß¾8ýû7§S©|îù|ý¨rÈëÝ¥Ná^·[×|ª	³ä>¯#õ]>ë&»±×çÅ>M_|¬³K»o*^«zÓÊï²-^ýn] ³F nÁ 
$,-#,)Ø\O æ® ·"Ý)5]Dæ°Yåbrö/	Gcî--©^_Dû®°b7cÒß*©5eQ­aaº¢å®@_¡¸FxÛn¸ ýÝFØ>ÒJÓäKE©÷hRoir-µ½CYÓy2ÔDëCi¡¿²)5ÒHÎµt¬ÀèA4{'JÒîp,ÇXd1ÖBge¶8ºô	Tÿuñ¸vºØ}T³gÂî÷ÔùÂyr¾ûíÑ,ó9îWlÉÈôâä:ôpã£¹¦ò,C/9}SüßaëÁì¶åMµy~×Õ
Zâò®íëëc¶ä÷L¹¦å!pÈH&ãùÖûûÖ­Ë£ûÖûÖûö»è=}çZ§%=}ºwþôÁ/§/#<n¸Ùô§¯G=}bÿöH·M|¼NI+ØË rÔ±ëÊîN±ÌkÍQNãÚÌxÒßëÆ+NÓ>Ú²G¼ç>FÝgø">a¯;]R¬>Ñºç²>sÖ^qºç·Ç>Sß« ÓZÞo²^^¿]^õiðúGsO¿¬®[ç¿ÎÛ½yýGíS¿~§-H8GÀgÊ ÉY"v6+x{Y~ã =M#ÊY!q&&97pnàÕµ!õ×'^20	r= õ!ÿ$ì9«Èx3oQKÕâïÁHst×¢}e	vª³ýbÖvÌ8Ê(Uiq¾âÎrLøÆøhÑ|¨¶âSeûoªl4×ÂFðäjÃ¹´}3ÁÐÆsyí:º­Uû
òÖº>ãTFJîñÄxÎÜqS¯Æíí«Aü=}í½º*?U+þfP­´ô0ÄW¬è8yøë8zvSýòÐÉÓÁÉF¦aã,ÁG8îT|xh×æðË^ãñ¦7,Ï:~^RüøåPÏÁdk¬x¶=}©Ls{¾ÖìÙ}ärÆ¬5ëZ¶¬mM-ûzwëDçRçz,Ö¬8	RùrÖEë±u6³EáNë
£¶GMOxrýÐ,ÚÙì²½Åõwëä_¶¤q¥[bZÑAµÐCÃPU§ð^ß°Å¸ÈÔPÎ²°ËÆÄÞpÝ¹Ú­pÂÓÐÄÇ0ê7ªP°¤¼°Ê°ÖpÁpÙpÍ°Ó0Ç¿Ð ¨ð´0¢ÐÊðÖ¡¿)ß~+]_*Wß)e(âGí>"åh£@ Ï5ûÖtûÖ=MåÖûÖGïÖíÚMæÍûì¦Ïß:ÆRÔk6ã¼¦K,¯*;¾µP\LØxéÐÃÚZ,Í:8ÒTUxþîpÝÓáÁÛr?ãO#È¯q&;¹^ýÐ¯¦ÐÙ¦«,³·9®ÎRx¨ùhßýp×Ác©ã¦ç-o;Bï9þ~R<Ü8ëp¾AÁàscû·Zxá°«È£Á´«ÀÛAÛ×¾¿áKðpOôÐ^â <H8³x#âWÇ´d®Tddl²µH±£èµ»M? |¸øq¬8y²Èt¦¨Lg¼ÌhÏbÄÉn¼ÏiÔ§¾ÍkìÀØæäÆdª6äüvô×/ñÛ]×C±Ï+QÕ;Ô'±ÅWñÃOÑÕ_À¦0µ§1]g0<Å¨óô$]_©U¥Ymì@Î;6Ñ.Q>ñ!q1ã2ryi|Íü¨å¨;(×­äÂídñÍäÝd×=}
Çúmß·¸×¯ Xh¤>ò¬gtHqXÑ$1²ºX¦¨[kT]oÌÙ= ÜhÝlÜÂùÏÊªßnÞiTÞe,ßmLÛc<ÚË¨/)Ï'däcB	13÷ÇäOïôçõ± 7¤kíªXºø¦ {Â[ÂæB'âwÎtíoºSq +Cçß2Cß1E<(/ùhÔòîä9	ÂÎä)f¤é:ÂÔ'pÊ¹eFi?åjuÊôó~Ê3ÇÅx Ñsò'JnâÄo0lJ%Ë'^¤8H/ÄpHQw<Å8ÑjÜÄfXÑb¼Ä$Qc>i¦hÂÛ5?I5e¬¶ó2LÂ©1p|D¬³em¢ELñ~ê9¶´ºaê2YC¿Ei*æ3mØL·|"De"qt:j?¹N¤\4g©°´©d^ÉLíÄÇ¬±YÒnëÙOämbDqrD1yÅÀ´±:òpzkw	OC¢ì°Òlöê6ùE'¸¼±«mëBOÕÜ·om¼äeüåsäo"Dh¢EtâDbBEjÂEfEn$Bh0aD'ÍO/PÅbßeIJÛr;¿zµOfË|¦Ra HV4e!Öûÿ]ÓûÖûÖûÖûl	$Ïúgýñ|yÙC¹áÝS¢wQ¿¯ñüáï^ç©í_Ì0·^tK2MKî»7ö®Ô4®¢1y«¹¹r¶Ô3[Ô½açùÒËl3öS¸CäêÅøÌêÐ©Vç¤É~Ò>LËã¿xdÒ
éuNûÖÉ¢ÑôFÖÿÛ·M<e¬FðôoóäãYô1ÏÀ Kïùm÷d©ö¾]bí[n³Þkþmú *gÞ@ÑÔí*Og{jdÈÅh¢VêpezëtI§F­-õEçÅf´Bf?g{³Ä¢]Mxb²]èfú·N'ñê-T,)®mÄÇ³óHeVÉ¿HÀ²_Å9peS:h{K¥wñËw#hè¼?#¥UìDdömaôÅì¢f|NàÂªå}&	%Ë°Mªþ ©ñLíÿ¦KÝÈ-Ü2\$ô<eôÝ³¸²&³= hé=}WÇüæ~§¨ß(«æ]ãªà·H4«ËG^bîw\É¡Þ¸_XL ­iâ¸0Kªðüª³dªTë¢Ëµ'÷Ï¨yÓt0Õy-×î@Í6æIÍ¯>¶u:À¾Q,ï¹ÍØYD£M1\â&	ç=M0B ¹Gü *Óhäê^xÇ §Qí!Ý9¬SAÁù>¡v³Hlz0«^µ¤ooâkµ44íkçnlüýº£¡øÍ0åG}¦¸-µ8ªÏæ´?~ñ(Û<0£%Zqþù­~¯^t>äPa 8$  = PûÖÓûÖýûÖûÖûÛkö;à¢Á£ØP_r¦@Ú8¦îhöê¬ÂÄT¿çRÕ<R¯Fp·S±ýWGQ*j÷ÇÁ»Y=}ÅÛSt\+~ïÁÞNR"¹RABÚ«èß¤EakÙYO
vr5·7Ï¥zjÎgÊ#Ó,WÁ+mõ{ùÃÒ½B}Õ+%-O·ÛQé >¯/î1s®RXïî¾dïÏ.Ë7V2kOµCÎ
FCüx=M=}~%þ»#~Þä³o8Ú9V£= ñk<£SîM7þgÄfwîÂE_©º»»ã2ÿ¯=}ùöBàéfaî÷+Ân¸ÍBlÎ7ÅÄa,«ÕkPÂg2aò:I£$y¶î´c±\¥4xÓc±§µpÝÀ¬]5BþÊ2w­YÌ-T0örØ63Ô)ôh]z6Ç!-7-Ùæ(g¬mø9êÓSdìq»©KÄ>znä¦ã6Ö¬ªÕCÀé¾7Ó<9ð)É·î,s£ÏKQ5ìºáÕc¾¨âhÿ;§?<&Áßù¿o#XÏ9è¤Ø@"¦¤H­?ã5nq$§gÁSºDõ8&GçÒr\;ODÐaA±©ionAJBºìkGiFw1¸í®Î</±J»ï¸ì"VLKðÇ®$´Ðb9s·s¡ÀJn}ÉÆøÜ¦÷]Õ4~ÌÈe#:#ºèÜþì(ç6¶®ãÓv&Pa7åÚQí*X[ïÞÞ¢ !Ð-   ûÖ´ÖûVûÖû<rûÖG ÃO¶ÿíÙÑ)ã¨/ñ}ö/Ãülqïð£#E8è)¡x\:äY£i;ì#A>8êö^ãX[¬÷ãÉzQ¢§CØV²¨ÃP¿ZºñâõæP xg®ÃL<Q[T¡ÕcGÒQBnÒ³PZ\¹CÆ°³X¥µJsZ]­u³Æ³·Q½¡fSPÝ]3×åÓørS«-ÓÑT'|j'ïã[>ýúÞÙ ÒÅ+qz¨ BVèLë¹EØîzªqrOC}YoÍÀöjÆöÌDü5¥Ë-·ÍÅÝM5XØ¾åOVfVoøäÓÒmlÿìMäþùjê6XZ;ûª××½Ê[(Ø³?â}Øm1Éaè»ØýÕ0Ã]ÚØ·û1\_êµ7 Y£\ä¹§Ù×(5ó®rø´9çx¼ÚG0²ïwnÑçä¿ÿÓÄ5¿ìYV[¼g}"×ÿ}äEN*Oñ5Æ®ÜêâËx}cSZ=MWhòØéÄ× V¢óPø7çåxS^«_= Ñ
!ó?:¨¯QTânµÇ¼,ñäá3O9AåÕÏ9_-â©é;®îÜÎïÝâ/äÆäX3EA¿Qb´ãwv½¦gW~?îãaÏ ?8é[ï¿hÎe²O®ÏíÿÔO1¾ÕX+E¸Aaý\iZlEùVw*o3I>ì±´©Tè°BãíÙÒLS³Yyè±Öp¾¿öüzÊà%wJæe±)µ8ÅäÖÍê¸%HC4ÊPYb¥%'u¼ÀjùiUehvçNo½!TðÊô ækmÖÂu«áÕ´õf¬.FúZtïò¥µNkw	Qík/Ñ½¸e	Ó¤!#ó-8ë°µ¦ßQÆà8ÁÔQ7æºÁâ²eÆ4Ù¸Bú¦@ú¬ËÇíìQG±%ÁM6ÒéHKæ
{qÛøºÞ¾ö<1ÓA^ù¦ÿ÷~«úG[Ê&ûeë>b'ÖX¯C=}û©ã­n¼=M¬X7f¸Û Óþ5(wüïÙñ×ì-É¯(§Ðúà£Ë\)9O¦´Q ³W»f#99=MëäK¼ÎCrü¿s"X8àÑ= Ìó"yL¨Ôá$$³ÓJ¤õ±A)Hãp¸3nÙX¿ndÐËL"d4iîq\X8íÆ¢Ö®x<Þ_®S|<¯á¤$æXG H1­dLDqYM¹Û~é¬[½bkm*ãñd±Ý¯·ýpðoF1W«¸Zµ!ò¸´æ§Ã	ÎjçoV#ÛE¹DfÒ a6î£Òµí­Yh¶°GµëóåÌ¨éîÃ.,KàìÞ Õç*ÌMÄlÅ¨Q«BJÆc)!ój-LE9;'´3}®±*^÷uÊ~iJÓËXËº=M«Ø=}£ÿëzoÊ= = =}í×
¹\Ä¡n-Ô¼äÅË1cÓF"/USÚÁ9-½6.+{ùpþê)µV,ÖÔSÃÀ½Dù.üö2³õé8éNvÓIÝ;ù}¢Ê:¢5¢>¦á!@,%!ÀÙûÖÍ·ûÖÍùÖ=MûÖû#O%¿Iè¢X$(Æ0\7BQp8ÏùßIlrÐ(í51¼ãdyÕ= ´ÀÂÜ©42Q6¼X&åùc<ñ´1L?ái1)òÓDÖv¢­r²¬I´ÄËD=}jrìÈ´~IôÕÅ	²ëQF¹è= ¯,B7ØGëqÒ\ÚM«¼·<QóN§È\7ée¾÷©*~Îà°ØB£ªøÊè5E¼
´¸d))3Je¹ÏîJ¼¾Èâ®GJ-vöButÞÉ²¿ÊæUéÊÖ|½¾
9ÀùÍ¡ô-´}T¾ÌiõmÖ¦XÀåBA|ÕÙÓu»!=}öÁ	¬.]ÚL<ÇëåçÚ¸¥
QÞo/IA6
3Õ}?M#¾Ô9¢!¼-1¾¨cfæ:Ù1ÅòæÎPé*ìm?¢	#3L£m)SÅuø¬}%=MQÚ¡Y&ºÓ¶Y]6äNÒàuà2Ç\kâyòÀåú_Ì°ÚeÛßUÿ7{Skè¦b;ùâø¶[ú¡MR$-ûQyò¾µô<×§Í#kGY°æ!§DgTVXÂÆ¤u§3é÷¼¸¦So6Y³BâÅ7/ÙÀêíÎêÂ;ëVØÑã½}ýfÀ'£>¬·äÂæ³ËÇ]yeïO
Þñ¶íþ<Ôa¢/uØ±"E{axÿ·òø·¬8_B÷±Èo×_«PT  !Ìu,äÃM°Ó÷#[P¨ð@,¢±.fP¶AÄ.¦P{F´w­Á~)Ê8Õ£è¦ÑI¼Ël*¨ü$Cùý:é÷;±¤§dÑ4¦JñLªF
~T"qQ<z;c¿vLó®îóxöFæ<¦æÔ­«ÛÓ3Ý_¡¹Ö©äïldo@)áD^¾nbàK9ýÞr¸þ²â«»I¦ÇmJúÈ·æù·LmoßÝ	ùÿì,$SY¹©¥l:ÒØßLÒtÒù»íÔGùdGÀÙK§ï¶Ù\»¾ë;¡\ÄÊÛ¸g= ^g¶Çqàð_%XßJ lA<LDüÉ(¥ehi5SÂÕ8Ûåå¶pßÕ¤MÅÈlK¡R¤Ëë¸Ù,°þÏI·~%çuP%³jJ	_{éQßJävt±ÀuíÊqõ8ÈÆÏÐ&¯óUüÆ¶YÏÅdÓ®ÀqXÈãÍÈ¾èSôUPÜÂ¡×ú­ä­çfêºXÁ©æ ì÷UòÐ¥c³{xKðêêúvÖÿ;Òûû¨ÓÇ[²r=}õñ¡³.ò[©[ü©¬çO¦ã!Þ*f¡¿½íÕïÖùÖÖ=MûÖûÖZ^IÔjàXJãÙ;/ßsµ½¹gäÙ	Onñ)æ¿° ¤Ì$úá2´kÐÕDE96hLw²
rü_Le«¤42rì°BÙThSýdºìLæèÀ,;å¸ Gc»,5ëéÙMkÆÑLyÒt¯± À<óDø	Oç.Yìvèsw¾%"~ê3S~¡%g5p´vÀWh¡Ç]*ô«I±Bc6ª6IÒÊ2¹Ç´0wtcÄ2cjrfÅR=}´1Ër|5¦OÉðÊÉbÂ*­ßËòÝkµ_^ËBÅêÎ6u>LucÖ:éF·Ëæù)
(¯ÉóMËî¹PÜ'ô1ýÈ¡+-æZÀ~Åá,1mÏÒgg³Ò4möãM
ß=MÏåÃÎ?l»_>sÅmÉVÖSðÛÀ£Ò¦.*©ZÈÁ«á>}<Þ
2	Ëk§NÎöC]~x	xÊgëlÖ|ôgis¿ªD =M^#F©;@?àï]&hÍU¿¦8ú9BvhÂ¨1ïÏ9Q}ÿ¨Ø,Cäç:ÓÈQßè9³<¬ø¸/{mØî¤=MFLVæRsFþsÆ7»Ò¦ í7$¼ö4Ry þÿbB/(	±4B6Bå 0Ïmæ¬ÎXUºr~þUÇðì¼3ådíÐe+ÔLX³aß¶XéykâMÙQé¸=MvdÐ»·5[ûÍÕU¯ÍÑÐÕkµUwdøý¦EæVlëÓßIÖö¶ßô9·ëß=Mxð®£òü-Ócø.´ÐÒ×]G[q5@É#<<v= bgd[BNÄÆè±SS½¨Øäv}GÜS¼øTþ¹ 3î<qÆ@î¹wØPß+N²N|(Ç7ü×Ù ÃK+|ÉåÍ;ØÑÿù­9­NGÞ[^v¸uØÃVï#é>R cá¯¾©äeot\QíäÜ7éGÝrÂ7{áA¬Ýi¯ìO^¼ü=M£?ª£xY£v_Òáç7ýN&÷µ?yÎ<CÅ_û¿3ï¾Z26'~ ­¶!hv$P{T°À;¡ü0$@~Ó¢ØU¨9¦a&Á^U¸ó7¢¹Ê3lfPî3b0_=}â%0ärb8SF´öÁK¥2:?ª(/¥ÁK7¦8Êß¥ÃÞO<=}É$X4aðÎ(òßgð0<á?ã1Lþ1éñO±Ü*¨äÔ_²ÄMq¬¨£4ïÂü8móûöeÉSºÈQl=}ã8¢ú¸ÒF¶÷Oé©skLÆËy<¼È¬
ªò?çüA¾¤®Mk@=M"·=M2ÈÈm ²d°¨ÎmBË2©}´äýi½¤}u2G7FóG9KëîuF¢4"ÇúB¥u5IT¨ÆKµÉHo~:WóðSkay:ûÅSZ-âjóÑ2é= f&/¥9¼LíÓhFÂWR9GìÔD³Ùyô|ïÂx°ei6¹Óiß¾m¦@»²*p]§Fa.EYI²ë;ÙL7ÒËT·kBÜÜ±§ÒP/ò\dØ±ïxÓö·~!ÒW+SKÀÄÌ QÂ¥Úuèbë+I1Mú=MBîz4ÁvqdòÛsìiëÔJ«é}pâ¼ÛEü×JáÍÊ¤Á¥Å<Ùwª¡IõÅ{|¦úRJêøz{¦²:>´àÎ<Úf·vq%A5ìÈ= EÕ¯KYx©EÓvvAÔª6ÇJÎVw1ÛÊº-ïËÑÉrUÒUÞÈÑ{-EU¼{{kâËzôÿqëÚXÝÉÑw=}6}¨Ìç}]S
QÉæ&,_TPóÏ!³Þ&dÖVÉ±å!­X,TBÖÝ)Om/BÈ©C[»iöìµ°JfºÒË¥6äãzvÔRoÊ5ç¨vVúfôÞVnëÔq<õæÿû	]ð®¬|[3ûQÓ£u§[(t 'G}j½hGRßN¤çÛxÍúep7gç³Ò»
ýÅCYÞ§Pñyf/^3ùÎ·t=M~Îr[Ù¯W78ñ=McAÇ¯ióQÝôï£|ùR ÐK#<V:@Õ «Ó&IÚVèM³aª&\¨¶-jPdé0d¦	ÞQìÓ?}Vì{ñ1ú­ü¤æª1O8ÅîHwÍféÌ:åoÛê÷¿ K! H8ûn~¬Í=MVû{ûÖûÖûÎûÖ=MY<1b1ÕÚ«¸R}äÑ=MBD7e4HÂ»mìúüö0IÆâlQcªùiìÓoÜ.)µj8rkâÖ~2ï²ùMÁ5)}Þhx´B¿´OÕÅdhÉTgj¿$IkÏjYuê·,!9ôµñÒÏ¬Ñl´º¬/ÿø\7´sÃ¾¼l½G²¼÷\N¯g¡Ë°¢5´	ÏÀñ%]²5¬ÙÁ/%»$E*IY{é½j~íw]y©Æ2ëoE~Ïªx|e&J-pq¡ªst4ÙÉÂo5EÜjäõ4ÀÆè U%ÅÈésm¦¿b~-îØ&}#-_ã£-7øcãFaëÜbzfö÷òÉß¶zÕä³Õ¤±ðäÃa=}
	8õogÓZ*G	~÷»®C]+*	rwoÑÞÌ\hðÓÊ¾¡´9PWÕÖ¡åÝ-T¿ ßý&¾~VÐÓ¡¶.CÜfõTRËÇ±jS­è:iØÄýgC¢íä|FtW1=MT3ÝÖ¹¾WÑ½©6Sª<vvQsÜ«¹[³íýææì
÷&+ÇÓx|ñâ.6oÐÀüê)+î766Ì$SzyvöjØÍµåÌ(Ìì\eäê¥­OQ;júØúâfÉ1VÖM×A<ÐQÞ­[5bV5ÑÃÇý[§6ù)Äù	ëî¿~'=}+YhÉ= õïaÕÙ.FXØåa«£6.GëXÙsã©Ç§³ó½¬ùD¼³w½mNêñÝ²«=}}» 7ª3NÂï}4uÛÉ¿þmòæÔSÄ»KüD>Þ»ó/·¢>ÎfC/÷'ØÒàã/çÏøíãV·àÒ"s)Ið¦= Ù=M"yï+8ÿ)ÜRY¶õëÒª~rÜ·àZOÏ®iØâgÙ¸/c)?º¸Tÿ·°±ëgÇ¿^"¢¿s%ÍGüûïñ¹úÃÛ ý[_Em!-ðÍ § Sæ%(Í-Ðh ¼¯#²%é?)ÒË°¼m¢Ì;4DØPè@òaÚ-ý1Â¾0KË§p+ñj¨]»bXo¥BdºZ¬^¸ÚÅâL1	ÐP¹¶¦ßGì
{(dH¿_bz1ö¨z¤{BîdHJb´~9ÂlL=}ëH{§gùÓTêÑ]qîþªg´k8åXySæ¡Qo­Ñ¬9Ç,1ë X Ð1àpÔÓÛÖîÓûÖûÖûÖûéW­sIðtDÈ_];9Òko;*ó\«¡U>#=Mê;Ð×U´¡K,tZ@3#;29Éyàh"¬LÊdtCýV;iñè¼fLmÑ¸¨6WÑÏ©)&¹øYÿ¤Ï©×lxVS?ÜÊwPÓËÍ¹üÃí}üqS¥?»	¼ðâ¡6rçLtÈrw+7GyhÛá¢öb×w6¶ÅÐi·Å= Kr?Kz	Öíê¸ëvÐÒZ½­v;ªûøÿäæþ¡VìÓÑ×­åWlÃ[m}j¶ÑGùP[6ùùÔÿîÀ[êÔ³SÛ£[~'ë[Èõæa¶±.nLð°#'[²óiÖ ³m5½´áHG=}·[ñ=}R¡³Ô½¬éBuðåÀjNÞÕñÔ«Kë}ä¯ØxàeâßN
ÓE FEWUúÙyRêí¼§ýÔÝåWè@uðÊ­§)C\z!/Oð°^»·\>OeêQÕïÁbOÙióëO~¾æ})?Ã»Ràg®¯t[|Ý?-òIkSÁ¾?Å·¿sìø§ÓÞóS ¬%#L®%v/ÐÇs | cK#¨g#0àGàÌ<a²¢ÔN7ë@öÁa&O(0@=}_%ù±NäO¨°6Âc0k¥ØRUd¢­A¬b´>ÂP¥¹4.ÓÐ¸U=Mâ:9ë²P;§yKìüÏæ¬ðí6ÁnÑ(T¬°Ëo¤¯óB<þ8ò¹(Õ¿gH¸Xê£Üq§ÂtÊ4EiûH;¦gÉÙHê¿]q"¿Â¼j;ÃÖIæSYfûZQþ«ñ¬ÇËô\6£8¾ÿQÆ«ý5ÇrÉXK»äõOn¹æ®	¼lO´j,âÚ@üÌ ÚöpHäcÅ½ðR+]s(MDð[FðÅÊ= «"Uf*H«%ì%r~7aw±ñ±:¢h¡:B¯Zªì?MrÉhºB[¨TD²\Íär£¤Hj|ÉAñÄ³äñ2}·jûGñ¦ä«¯2Uóè<õëX$¹õþ°qgél{L¯¬ºlRsJ\KÄ°[ÆpÒªbÇÖ*ó§I»Ï§â³«*~I²ÊDé¿a5}µïíu¾,pY_sëFµÉÇuZ\qIwEg­çn­µåUzUðPôØSqJ­è­'×U&ñè·ÎH{,eIJ4?£ eu0eñûÖ}kîlÖûÖûÖûÖ­ëÃ«õTÔ÷ØU|Ãú"­Ó[Tê~ôxrC,½n9î·ðé=MÌØ×nIZî:½gþñeGc£Ù-:ð×ÊáÖ&k¦:Ì¿Ð]ÐÉáÒß&ór»,LòlSñº¬éñEF¸ÈKFIþ¸¼©Q@Ãeñ²6W«^­LRÒø\ñb e=M;6þNÑñêøòUÕ	õçú»bË>ÒYóFég;_¾ãèÌ.êXÜ¼y§h?§ú³=}ÚÌ8ð
-§=}6æ¹·ùI·®k·fNÕÚdFØÄ}ÏëÞKNC~ÛQ\2ÇX~ôÃ×±ßÎçÅî>}gÄ|ÑÛ'\n^(|lY|öÇu¿ÙÍ,XãZ¿Dg
üyñü |y"·*8'0ß{= ôÑ!96'4ù9p Tà=}E/É°WÄDAùthü¶AO¥<¹2Ruhë#ÝA_~§¯N¿v°ÓÐ bea:¢=M=d{'+¼¹¢[$í®(~ÿ4ÔO2kr]£qiAmRÞ¶i¥Á²iÓD÷kÒ?µTÜE¹~V¶eîÂ*ÍÒÂmeª1£5³HÆÏul[Ä¸}Q­çÀX (µ= qWûÖ;ÿÖûÖûÖûª®q%´t"+ÄÊLv0øûj¡Ús$Î4XÜwÀE¡Ìï%n6½xD.±ùdU0ù
ª´	NÒÔhá%B+×¨DXIòÎèµ¯±zl©áEN5´hwuâ´D×®EÂm±HØbÂù>©î7Dæ^±xc}¹¹4·ùrkµNSË£ìðARMèô|C³ ìÇëR¿ë,MsC±b´*ûjJ$42º*;[JT8Ê¦b×U*q/H,ßÌ0Ùâ *¿3ÈXytn4wé{k¸ÆÛ½jÞaJ}ÇÊ|Á×jáJCµQuVåöØ¼na­HuT2):ÉzÄ	Í±¼f¥:V\_ÆÆæÊW:£ó1²
éÁÂ´îªZZ¾Á³Ê£îÑaZ=MÇ
DyÁÓ·nÓZ÷ø¿¾fWs9üíðÈÜáþ&&ù<£A½-/UH^ãJ£S,2½WÈP²Vø2ãJ³mÒµWIÿàÄÁÂR§¸$ól5FâN³l*üSiá}4«ÃéLÆÐjyÊlÕ¸ÿæÂ_«GxLqÓå³C6]ÏyäQ	ÇeªV³óûäMóÇÂífV|»U½,ÕqÆùL{§mÁsVÍûLÏíÏ¤.9R[´KðÔª£ÿôÁ£ðÍ._ýá{ðÇc¹s.	[=M¯ã¼$Nf·Ü¥|~tyðèÅ©ÏÃë²aNõFÛüò«k´ÃNCÏÚäR{FÆgt>WtH=MQÇ¶çwùÃk¯I]]­hWëc|Q·çîs>¯ä=M±×g¹^ò(ô±{÷ÇÉsÃÕoþ^	f½µïÚ}^oôÜ3µïé¿^#$4k3_àðò!Y%<°"ºU/ôMÀÐ ×s#zM-ØEÀé± Ý·#Ò^.8I v´°"ib.YtHDå°ª-bÚ:Akû¤¼=}th²yAv¦´ÿ1rh$£  )5eñûÖ=MZûVÞ±]xûÖûÖû\~5ù°ùÕéN³ßc¢~3|dÐ)áèb¢eaAC?áúf¢=}%ù&(n®3ºKmFÛk0n*ÝAÀñ7DÍþ³üÍD±{ÌÄÄ-é¤¿EoÄDÊ¥jWé}cEGkºL´ì}OÙØwö9iÁ{5eÓ75þw¬vQC×éìvwl«ªq)e¯ª&}4°B÷$å«4çwKFtD®KØÊØÏøóº|S@«FgAí¶:KU·÷D
ÔòýcÈÆòí¢%ºö:ö\ÁºF¿ó¦þTì7¦a%,ê:NöR\Ë³´AgcÑN¦#-5æ9êîV4yèÚõAã-ÓLøò%ëïzêkëâ¶_Jxþ³¶-ßy2ëËMLóÚxj,Ô;©ÓL7¶»MÇ{¿ÑÌßé ÃS®ûÿ´ôQgçÕÜ®¼Å<-ÊYZçõß=}?V´h:¸VáÑ®ï*çM®S'Ræ¦¾uoFß	Ñß]EþMÙpéScòßhSïÀn¾r\÷flßðÓ­Ç.ï©ã¾ÿîîÿ:áà¡"þ(ìXî¡fÙ"ª&ÞÉ8H"Ë)\½(´<õNPÏ °àk3"ù'ÊN+ÓQðoÀûà k¡Ad&]<	|Ä»±Ú¿d±ÂÙB?7­üsAÒÅv¬Ë&±ÓÍBãÚfÊ,¨\TZRÄ¢èÅu±ö{C>¨¬Y5RL.p= $!0íÖûÎ¿ûíÖûÖûÖ=MÚ§p/§34«Iø¶x°Y½.aâ¢$gÊ)²W4èö¢£}%±ÝÀú@áØQ¢ó$6(ÒÌ6ôûJÕPÄáÉÛ¢{ï%o_*~6Ü.G6cG±:éî²%D#kjºv¶ÍK)ÿ|Ù£¶,Ò^²äãD·æk¦î´y<÷h³D_@ùrrÒ=}iû²wE½j¾¦vT®ÊX=}oq@¥~fe¨üªFe4»ëHâusôÎÏ¸ýbÏÃBÉrôÃ8UtÑ¼eä¥ª¬Ë4ÅWK:=Mq^Ê4ÎK&\(ÅârÍ0vsRºF}mØ4º'9T{¦5òôJÅityÛÖf3m­ÖºPýT»ÌÆmè1º3T¥NLôÔ|Å×i<.l Ïzýõ|ÊInÓ»F(cÓ(¦ÍQ,12:
ÆTìë´ó°Ê°Áiãäª¦cU-::ÕR44ÄÁOã a¦éÃ,G9¶ìRL}xÔêP³Nc¿c¦Ç,µO9ÒþRdØòÐÃÁocåp¶±LzfDÔ4o¸áR_§Å!ë;LÃëyòwÓÍÉöôÛ­Åm7ë+	ðû°ÅHë	©¶¢SM+7xâÍ(VM×y+gM{ïx}Ö´Þ9èÒÅ'kæ?¶A<#â[¶f<­´äSÕCzg²|®%=}y«[ÒµÉ
hsç±ÐÑCKç.®{ý=}Í§9È\ú±²,çÆ.Ûì±Íçª}®æ'=}±oXÖ¼TÚ
ûQ±CkçÑ®ÿ<¯XZ§Ü¯	6óRÞÇeRïÅT¾²¹]Ë5È¾+Å]¹Jõ¼ÏiúôóÆÕç ÷ý³îºl8YPâ¼GtoÞù¾Z+]ý·¦ÎìøyÖóÓßqïîó!,&è!+@&ãùÖûûÖ=M{ÖûÖûÖCàª!])Pu ?"ô6@ÿ¿ bXþ§<­¸6óñRÞCrçt®M9<ýÒYR\H¸tìa9çëª®õ=}ù
ZîUÔûöQÞÓCoç ÏñÿÑ¨ÿgYv¬D¹
¸XëÞÃrçåu®|;<³×}®ò'<Ó®Z~½Ù õ¶C#gñÇ®àKçÚ®<±YT*E/Oì­B¨I¼¯G\nLjAkK¤éLdèAdìK¤KD$OFOEÜLO|ÏB<ÌIÌÈG¬LA´KD=MDF<	Ml2Áá ApéhXÁAî,ô<áM4òN3NÌ2Ï71Ö0Ê8'%[FdYMì^OÄÚBÌÚAÞKÌ¾))Qÿ+c^+¿Þ+-(§£IbKcãK¯BK%H3"E{rerJ§óJSIÓIãI'Iÿ+I9ªIkIãëI;JI÷ÊI_I
KÙ:KµºKí{K]ûK£[KÚKóKÓ½R×¿ÿ'P^j9TîçmóþL¿_o©×hÙtÙÞrùÔv9ÙqÜuéÚsÛgY= 9dÉb©fÙ~9yI}kyoÉh)lyrÉva¹eéãv:wþ§P§QBfPÆdV2fWåR²äSGTGUæÄP¢ÅQÚÇW>RJSVTU|!CoQi9C%¾8é9:;8;;yº;=M{9«ûÜ.fÄNfÍ·QÕÏÑw¬g¬p£¬tc­ÂC¬Ã­Î¬Á3­s¬Eó­-Ó¬½­+¬c«|<x~ÙÍWv×:Ã8;M9/:ù®8Q®;?o:î8Kï;#N9ÕÎ:8ÿ9g:>×çf¢æ½7æ¼÷fÝfì¯æ	ï^»±Ç×%Q= n!= Q0ÌûÖýnûÖ=MûÖûÖûÞëçSÒSl_ a­Gá­qÁ¬,­Ó­Ö±¬pq­ñ­¼Ñ¬³¬Ú­·)­i¬é¬I­¬Ñ	¬(9CdVÃ.NÃe~ÃAC~Qp)IÃyCEÃ5wUCmÃy{}Ç¡qÅ±QÇ©ÄÔÌÜÄ	T=Mì|$­<\</ÛC¬RÃ¬ö¬Á¬%3¬=}³¼ªÿ¹º$¹d¼ä¹DyÄzÄ{
^¶{	w;I÷:©ö;QWZÿ6V.ôNë>ïÛï9/XAÃô1CQïâ¼T¿VF½Uz½W}·­[wüãUÃû-Ã MÞýÇ­*/î3ìHâòxúöÝWO¿¬ø¬c½Û1	ÇÑ·q¯Ï÷*Bn&5­£«?Aä¸pBq8ÑAÌH4~¼©@f2/B«vqåÛÂ,YÆ6{ªCZæ3Ï«Æ)åÍdÂ2XÉè±|LmAÂÅ2jM~Ç1õò©ý	e²¬hF\ÓH¹uLëF¢0-ª=MÙdÄ\Â~ÑK¿¨pà+ªÕ¥ä1QÉÈ÷JF²¶0MkªõÅäûòByñÞ¼xu~\Ë@2w2ÕK«)uäñÊU±Î¦Èws¬ÎEö6oÝBñÐ¡8úðÿWæîûäWWíeÉ6îørEÆÖ6ú¨£åõîñþ0ÁZ©8½]w7±ÁËèùm4Nª0ª*ÝdÅþÂ?ýu_qÎßS-0¥mµèRpÄ:D/|cd°ÁÃ×'ãäÙ¤=}Iæ¯2]gÛ»QÂøx±¼(_þS[WaÌ»Hæl2ÍF4±Ê=MüT_}¹ÚÃy³×cÓåäYÿ|½GÞ[P¬| ¹7ªx«ä=}+6Û§EBåréROvÙ×KJ1ÕøÍç:ÍØZ%2/PÖ½! &ûÖ×ïÖûÖûÖûÖÑÖQÕ1³éf®ßT	×i3îY»Til»÷FmÁòDS¡ÿOTwfNÒO«­cEöØôÅêRÝüøÄy|:ÍÔ:éÛúÙp­óÍ6v³Ü°¬Ú#´÷F§ðÃÙ
³ÿ½ÞðJÏBýV§ìûÕÎù_¹
ÜiÛk;ì:ÜÕçÏÑÙ¿(ÁÜÎ0¹/s}ÿ\¸{TîYm½B~XÂF¼gýW~_ÆE¬bçý¾^~ªðÃhÀøI=MPûe7ýºCÜöÞª¯ï9«sÈ³ä1þôjW'oÆËÓ¬ûOã9g0|ÆùåZ
ÒlE¤ïÎìùà=}º
¼@¯Ë«Q¼3\ÃÑNé(®¤öÚP#øãýa¿ÌDºÕ÷u9ëq/VÔ>·ZôÝÂ]«ÙêsbKºâ=MAU9îvÂIâá±è±Qí8ï.BZê}Ç:xä)¨ö¢³­zAg¨9´ÁMyçY¨î®rÔH«Y= HäGÄ,í9ä<Ö¡D>«×ÁLm	ãv° lfÜcªp³Ö,JKùë%ÂÙCñ·TÃ\-è@FÑ¸í<2±üÌA¨7¿èiQÊð°$syäZ¬«¤²àÚ'¦÷°Ïéd>ªq¾ºTÂU}ëpæQ­L=}ûøëqî¹@Bi Æ4à\êóÜèÜëgá×@KÙèo1jr¶jtÃVlzó¾îÇW8äpfP¦lJS¸í|6Ð¸ÅÌ5yïfVÓ­=}/øïa.´¼ DÇóñ¿"·Øì5Î­$0h0áßã?Ý¿»¿äDG_©­¤ÿh­Ä_h;I±v n~> á;ò­=Móýå¯7¯Éý#{}   ·Zë´ÎÆNÏRÇ½ûV«A¹³ìÖûÖyíû¼9g:&@*!e*$£vËbáª;Vpc,ÈåEUV!4yø Ô#Û%î%i [óX ¢î¾Ù@àÀG!þ¨@ÝIÐNZ= Ýóá¤àYá /Vâ ÷6XH\Øü&ð8ûwâ6õ2@ý Êù.=M+ç-n¢ò|øM/<ýNÌSY¬Ý)z¿¥CoáÎã±	ÐÁïXÙ£!õÜd?¯xðì
Ái;ªäÀ%n= =M+W= ÓÖc[aS
FÁð]NôÝ'= qr(¶ù¤nü«òÿ¿d&ÿÈõT4Þ=}z|ö ¿OW×SMtdH.ÏãRX&§o3ØÜXÍ^ÊMí£W´iâ]NüOå£S£Å·ç÷­ Ý§½GÑUy¹¦ß§/6P0(Cúýb"þ¥°VÙÄá£ÓÙ@¾YýòD{òÃv?EP©=MBé­\Ä½YäýRò	øfâëEEf¼D+gC×úÇ±GÅÿ±Ç?TzÙ¡±ÏÁÕ¯¦ðvZmT}3xËz×cºrÑM=Mc-É©Ô7½wæc§Î»cû¾yfÙWòÆÝÔc¥³ôØf«Äñ·9ø%­g:y^+{U]¤þ[&fÓÏYë«Gªõ¹¦Öðþ¬moÛø?/ÛS.[S9ÛùC/û2²Y£ÎÑ%/sy ¢×ÌùJ­W6Oí\g0^JùêßÏ0í[Ü'ÏÔ>À-¿[ÔW?Y]±ØÙÃî<~ÎëR~Ìf¾Z/×¼_á¾Þê+îoÐñ{Þ\e3K%©¹§íB¹§(c=}ËÈ·SzÔnf§èx}o\9öf|%Ýå¥~©IÇüñY8}Ffú@Rú1éþ3÷ËótQøvû|³Îaá,Óé>BG6Òê}ÃJ|¶=} °öf6õk¶ÌºHgNjÒ{æ¾M;9·é§WèO±Ä3ÒËÒyt	;ù´à©a|Ó^!ÝøûÂÄ
(VV¸ÇÙcÏ>yoçzÃvòG{3Þ£½c×ôíÅé;°OÛGØ<wÜW>	rU]q­{û'ùÝír{*øï?t-ígùWÿ&§]m}×ût¥Ë~ß&>&Õv!b#ÅÌq¢µ|jÍüùÉ^Æ&ôþ~sIµ"]d)uâ´ºvk	Å\<Íÿ­öê½Â
ïBçÏ§mÙIólÜoëVb¦¯éWÇû3` });
    var imports = {
      "a": wasmImports
    };
    this.setModule = (data3) => {
      WASMAudioDecoderCommon2.setModule(EmscriptenWASM, data3);
    };
    this.getModule = () => WASMAudioDecoderCommon2.getModule(EmscriptenWASM);
    this.instantiate = () => {
      this.getModule().then((wasm) => WebAssembly.instantiate(wasm, imports)).then((instance) => {
        const wasmExports = instance.exports;
        assignWasmExports(wasmExports);
        wasmMemory = wasmExports["l"];
        updateMemoryViews();
        initRuntime(wasmExports);
        ready();
      });
      this.ready = new Promise((resolve) => {
        ready = resolve;
      }).then(() => {
        this.HEAP = wasmMemory.buffer;
        this.malloc = _malloc;
        this.free = _free;
        this.create_decoder = _create_decoder;
        this.send_setup = _send_setup;
        this.init_dsp = _init_dsp;
        this.decode_packets = _decode_packets;
        this.destroy_decoder = _destroy_decoder;
      });
      return this;
    };
  }
  function Decoder() {
    this._init = () => {
      return new this._WASMAudioDecoderCommon().instantiate(this._EmscriptenWASM, this._module).then((common) => {
        this._common = common;
        this._input = this._common.allocateTypedArray(
          this._inputSize,
          Uint8Array
        );
        this._firstPage = true;
        this._inputLen = this._common.allocateTypedArray(1, Uint32Array);
        this._outputBufferPtr = this._common.allocateTypedArray(1, Uint32Array);
        this._channels = this._common.allocateTypedArray(1, Uint32Array);
        this._sampleRate = this._common.allocateTypedArray(1, Uint32Array);
        this._samplesDecoded = this._common.allocateTypedArray(1, Uint32Array);
        const maxErrors = 128 * 2;
        this._errors = this._common.allocateTypedArray(maxErrors, Uint32Array);
        this._errorsLength = this._common.allocateTypedArray(1, Int32Array);
        this._frameNumber = 0;
        this._inputBytes = 0;
        this._outputSamples = 0;
        this._decoder = this._common.wasm.create_decoder(
          this._input.ptr,
          this._inputLen.ptr,
          this._outputBufferPtr.ptr,
          this._channels.ptr,
          this._sampleRate.ptr,
          this._samplesDecoded.ptr,
          this._errors.ptr,
          this._errorsLength.ptr,
          maxErrors
        );
      });
    };
    Object.defineProperty(this, "ready", {
      enumerable: true,
      get: () => this._ready
    });
    this.reset = () => {
      this.free();
      return this._init();
    };
    this.free = () => {
      this._common.wasm.destroy_decoder(this._decoder);
      this._common.free();
    };
    this.sendSetupHeader = (data3) => {
      this._input.buf.set(data3);
      this._inputLen.buf[0] = data3.length;
      this._common.wasm.send_setup(this._decoder, this._firstPage);
      this._firstPage = false;
    };
    this.initDsp = () => {
      this._common.wasm.init_dsp(this._decoder);
    };
    this.decodePackets = (packets) => {
      let outputBuffers = [], outputSamples = 0, errors = [];
      for (let packetIdx = 0; packetIdx < packets.length; packetIdx++) {
        const packet = packets[packetIdx];
        this._input.buf.set(packet);
        this._inputLen.buf[0] = packet.length;
        this._common.wasm.decode_packets(this._decoder);
        const samplesDecoded = this._samplesDecoded.buf[0];
        const channels2 = [];
        const outputBufferChannels = new Uint32Array(
          this._common.wasm.HEAP,
          this._outputBufferPtr.buf[0],
          this._channels.buf[0]
        );
        for (let channel2 = 0; channel2 < this._channels.buf[0]; channel2++) {
          const output = new Float32Array(samplesDecoded);
          if (samplesDecoded) {
            output.set(
              new Float32Array(
                this._common.wasm.HEAP,
                outputBufferChannels[channel2],
                samplesDecoded
              )
            );
          }
          channels2.push(output);
        }
        outputBuffers.push(channels2);
        outputSamples += samplesDecoded;
        this._frameNumber++;
        this._inputBytes += packet.length;
        this._outputSamples += samplesDecoded;
        for (let i = 0; i < this._errorsLength.buf; i += 2) {
          const errorDescription = this._common.codeToString(this._errors.buf[i]);
          const functionName = this._common.codeToString(this._errors.buf[i + 1]);
          errors.push({
            message: errorDescription + " vorbis_synthesis" + functionName,
            frameLength: packet.length,
            frameNumber: this._frameNumber,
            inputBytes: this._inputBytes,
            outputSamples: this._outputSamples
          });
        }
        this._errorsLength.buf[0] = 0;
      }
      return this._WASMAudioDecoderCommon.getDecodedAudioMultiChannel(
        errors,
        outputBuffers,
        this._channels.buf[0],
        outputSamples,
        this._sampleRate.buf[0],
        16
      );
    };
    this._isWebWorker = Decoder.isWebWorker;
    this._WASMAudioDecoderCommon = Decoder.WASMAudioDecoderCommon || WASMAudioDecoderCommon;
    this._EmscriptenWASM = Decoder.EmscriptenWASM || EmscriptenWASM;
    this._module = Decoder.module;
    this._inputSize = 128 * 1024;
    this._ready = this._init();
    return this;
  }
  var setDecoderClass = /* @__PURE__ */ Symbol();
  var OggVorbisDecoder = class {
    constructor() {
      this._onCodec = (codec2) => {
        if (codec2 !== "vorbis")
          throw new Error(
            "@wasm-audio-decoders/ogg-vorbis does not support this codec " + codec2
          );
      };
      new WASMAudioDecoderCommon();
      this._init();
      this._ready = this[setDecoderClass](Decoder);
    }
    _init() {
      this._vorbisSetupInProgress = true;
      this._totalSamplesDecoded = 0;
      this._codecParser = new codec_parser_default("audio/ogg", {
        onCodec: this._onCodec,
        enableFrameCRC32: false
      });
    }
    async [setDecoderClass](decoderClass) {
      if (this._decoder) {
        const oldDecoder = this._decoder;
        await oldDecoder.ready.then(() => oldDecoder.free());
      }
      this._decoder = new decoderClass();
      return this._decoder.ready;
    }
    get ready() {
      return this._ready;
    }
    async reset() {
      this._init();
      return this._decoder.reset();
    }
    free() {
      this._decoder.free();
    }
    async decodeOggPages(oggPages) {
      const packets = [];
      for (let i = 0; i < oggPages.length; i++) {
        const oggPage2 = oggPages[i];
        if (this._vorbisSetupInProgress) {
          if (oggPage2[data2][0] === 1) {
            this._decoder.sendSetupHeader(oggPage2[data2]);
          }
          if (oggPage2[codecFrames2].length) {
            const headerData = oggPage2[codecFrames2][0][header2];
            this._decoder.sendSetupHeader(headerData[vorbisSetup2]);
            this._decoder.initDsp();
            this._vorbisSetupInProgress = false;
          }
        }
        packets.push(...oggPage2[codecFrames2].map((f) => f[data2]));
      }
      const decoded = await this._decoder.decodePackets(packets);
      this._totalSamplesDecoded += decoded.samplesDecoded;
      const oggPage = oggPages[oggPages.length - 1];
      if (oggPage && oggPage[isLastPage2]) {
        const samplesToTrim = this._totalSamplesDecoded - oggPage[totalSamples2];
        if (samplesToTrim > 0) {
          for (let i = 0; i < decoded.channelData.length; i++)
            decoded.channelData[i] = decoded.channelData[i].subarray(
              0,
              decoded.samplesDecoded - samplesToTrim
            );
          decoded.samplesDecoded -= samplesToTrim;
          this._totalSamplesDecoded -= samplesToTrim;
        }
      }
      return decoded;
    }
    async decode(vorbisData) {
      return this.decodeOggPages([...this._codecParser.parseChunk(vorbisData)]);
    }
    async flush() {
      const decoded = await this.decodeOggPages([...this._codecParser.flush()]);
      await this.reset();
      return decoded;
    }
    async decodeFile(vorbisData) {
      const decoded = await this.decodeOggPages([
        ...this._codecParser.parseAll(vorbisData)
      ]);
      await this.reset();
      return decoded;
    }
  };
  var DecoderWorker = class extends WASMAudioDecoderWorker {
    constructor(options) {
      super(options, "ogg-vorbis-decoder", Decoder, EmscriptenWASM);
    }
    async sendSetupHeader(data3) {
      return this.postToDecoder("sendSetupHeader", data3);
    }
    async initDsp() {
      return this.postToDecoder("initDsp");
    }
    async decodePackets(packets) {
      return this.postToDecoder("decodePackets", packets);
    }
  };
  var OggVorbisDecoderWebWorker = class extends OggVorbisDecoder {
    constructor() {
      super();
      this._ready = super[setDecoderClass](DecoderWorker);
    }
    async free() {
      await this._decoder.free();
    }
    terminate() {
      this._decoder.terminate();
    }
  };
  assignNames(OggVorbisDecoder, "OggVorbisDecoder");
  assignNames(OggVorbisDecoderWebWorker, "OggVorbisDecoderWebWorker");
  var EMPTY2 = Object.freeze({ channelData: Object.freeze([]), sampleRate: 0 });
  async function decode2(src) {
    let buf = src instanceof Uint8Array ? src : new Uint8Array(src);
    let dec = await decoder2();
    try {
      let a = await dec.decode(buf);
      let b = dec.flush ? await dec.flush() : null;
      return b?.channelData?.length ? merge(a, b) : a;
    } finally {
      dec.free();
    }
  }
  async function decoder2() {
    let d = new OggVorbisDecoder();
    await d.ready;
    return d;
  }
  function merge(a, b) {
    if (!b?.channelData?.length) return a;
    if (!a?.channelData?.length) return b;
    return {
      channelData: a.channelData.map((ch, i) => {
        let bc = b.channelData[i] || b.channelData[0];
        let m = new Float32Array(ch.length + bc.length);
        m.set(ch);
        m.set(bc, ch.length);
        return m;
      }),
      sampleRate: a.sampleRate
    };
  }

  // node_modules/asyncglk/dist/common/file/browser.js
  async function parse_base64(data3) {
    if (Uint8Array.fromBase64) {
      return Uint8Array.fromBase64(data3);
    }
    const chunk_length = 3e7;
    if (data3.length < chunk_length) {
      return parse_base64_with_data_url(data3);
    }
    const chunks = [];
    let i = 0;
    while (i < data3.length) {
      chunks.push(await parse_base64_with_data_url(data3.substring(i, i += chunk_length)));
    }
    const blob = new Blob(chunks);
    return new Uint8Array(await blob.arrayBuffer());
  }
  async function parse_base64_with_data_url(data3) {
    const response = await fetch(`data:application/octet-stream;base64,${data3}`);
    if (!response.ok) {
      throw new Error(`Could not parse base64: ${response.status}`);
    }
    return new Uint8Array(await response.arrayBuffer());
  }

  // node_modules/asyncglk/dist/glkote/web/schannels.js
  var priming_mp3 = "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU3LjU2LjEwMQAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU3LjY0AAAAAAAAAAAAAAAAJAUHAAAAAAAAAYYoRBqpAAAAAAD/+xDEAAPAAAGkAAAAIAAANIAAAARMQU1FMy45OS41VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7EMQpg8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";
  var SoundChannelManager = class extends Map {
    context;
    glkote;
    constructor(glkote2) {
      super();
      this.glkote = glkote2;
      this.context = new AudioContext();
      this.prime();
    }
    async update(schannels) {
      const wanted_schannels = [];
      for (const schannel of schannels) {
        const { id, ops } = schannel;
        wanted_schannels.push(id);
        if (!this.has(id)) {
          this.set(id, new SoundChannel(this.glkote, this.context));
        }
        if (ops) {
          this.get(id).do_ops(ops);
        }
      }
      for (const [id, schannel] of this) {
        if (!wanted_schannels.includes(id)) {
          schannel.delete();
          this.delete(id);
        }
      }
    }
    async prime() {
      const context = this.context;
      const source = this.context.createBufferSource();
      const data3 = await parse_base64(priming_mp3);
      source.buffer = await context.decodeAudioData(data3.buffer);
      source.connect(context.destination);
      source.start();
      setTimeout(() => {
        source.disconnect();
        source.stop();
      }, 10);
    }
  };
  var SoundChannel = class {
    context;
    gain;
    glkote;
    paused = false;
    player = null;
    vol = 1;
    constructor(glkote2, context) {
      this.context = context;
      this.glkote = glkote2;
      this.gain = context.createGain();
      this.gain.connect(context.destination);
    }
    delete() {
      this.player?.delete();
      this.gain.disconnect();
    }
    async do_ops(ops) {
      for (const op of ops) {
        switch (op.op) {
          case "pause":
            this.paused = true;
            break;
          case "play": {
            if (this.player) {
              this.player.delete();
              this.player = null;
            }
            const chunk = this.glkote.Blorb.get_chunk("Snd ", op.snd);
            if (!chunk) {
              break;
            }
            if (chunk.url) {
              const elem = new Audio(chunk.url);
              this.player = new AudioElementPlayer(elem, this.paused, this.send_event, this.vol);
            } else {
              let buffer2;
              const createBuffer = (data3) => {
                const buffer3 = this.context.createBuffer(data3.channelData.length, data3.channelData[0].length, data3.sampleRate);
                for (const [i, channel2] of data3.channelData.entries()) {
                  buffer3.getChannelData(i).set(channel2);
                }
                return buffer3;
              };
              try {
                buffer2 = await this.context.decodeAudioData(chunk.data.slice().buffer);
              } catch {
                if (chunk.chunktype === "AIFF") {
                  const decoded = await decode(chunk.data);
                  buffer2 = createBuffer(decoded);
                } else if (chunk.chunktype === "OGGV") {
                  const decoded = await decode2(chunk.data);
                  buffer2 = createBuffer(decoded);
                } else {
                  break;
                }
              }
              this.player = new AudioBufferPlayer(buffer2, this.context, this.gain, this.paused, this.send_event);
            }
            break;
          }
          case "unpause":
            this.paused = false;
            break;
          case "volume":
            this.vol = op.vol;
            if (!this.player) {
              this.gain.gain.value = op.vol;
            }
            break;
        }
        this.player?.do_op(op);
        if (op.op === "stop") {
          this.player = null;
        }
      }
    }
    send_event = (ev) => {
      this.glkote.send_event(ev);
    };
  };
  var AudioBufferPlayer = class {
    buffer;
    context;
    gain;
    notify = 0;
    paused;
    paused_time = 0;
    repeats = 1;
    send_event;
    source = null;
    snd = 0;
    start_time = 0;
    vol_timer = 0;
    constructor(buffer2, context, gain, paused, send_event) {
      this.buffer = buffer2;
      this.context = context;
      this.gain = gain;
      this.paused = paused;
      this.send_event = send_event;
      const source = context.createBufferSource();
      this.source = source;
      source.addEventListener("ended", this.on_stop);
      source.buffer = this.buffer;
      source.connect(this.gain);
    }
    delete() {
      this.stop();
    }
    do_op(op) {
      switch (op.op) {
        case "pause":
          if (!this.paused) {
            this.paused = true;
            this.paused_time = this.context.currentTime - this.start_time;
            this.stop();
          }
          break;
        case "play":
          this.notify = op.notify || 0;
          this.repeats = op.repeats || 1;
          this.snd = op.snd;
          if (!this.paused) {
            this.play();
            this.repeats--;
          }
          break;
        case "stop":
          this.stop();
          break;
        case "unpause":
          if (this.paused) {
            this.play();
          }
          break;
        case "volume": {
          const currentTime = this.context.currentTime;
          const gain = this.gain.gain;
          const current_value = gain.value;
          gain.cancelScheduledValues(currentTime);
          gain.value = current_value;
          if (this.vol_timer) {
            clearTimeout(this.vol_timer);
            this.vol_timer = 0;
          }
          const notify = () => {
            this.send_event({
              type: "volume",
              notify: op.notify
            });
          };
          if (op.dur) {
            gain.setValueAtTime(current_value || 1e-4, currentTime);
            gain.exponentialRampToValueAtTime(op.vol || 1e-4, currentTime + op.dur / 1e3);
            if (op.notify) {
              this.vol_timer = setTimeout(notify, op.dur);
            }
          } else {
            gain.value = op.vol;
            if (op.notify) {
              notify();
            }
          }
          break;
        }
      }
    }
    on_stop = () => {
      this.stop();
      if (this.repeats > 0) {
        this.play();
        this.repeats--;
      } else if (this.notify) {
        this.send_event({
          type: "sound",
          notify: this.notify,
          snd: this.snd
        });
      }
    };
    play() {
      const source = this.context.createBufferSource();
      this.source = source;
      source.addEventListener("ended", this.on_stop);
      source.buffer = this.buffer;
      source.connect(this.gain);
      this.paused = false;
      this.start_time = this.context.currentTime - this.paused_time;
      this.paused_time = 0;
      source.start(0, this.paused_time);
    }
    stop() {
      const source = this.source;
      if (source) {
        source.removeEventListener("ended", this.on_stop);
        source.stop();
        source.disconnect();
        this.source = null;
      }
    }
  };
  var AudioElementPlayer = class {
    elem;
    notify = 0;
    paused;
    repeats = 1;
    send_event;
    snd = 0;
    vol_timer = 0;
    constructor(elem, paused, send_event, vol) {
      this.elem = elem;
      this.paused = paused;
      this.send_event = send_event;
      elem.addEventListener("ended", this.on_stop);
      elem.volume = vol;
    }
    delete() {
      this.elem.pause();
      this.elem.removeEventListener("ended", this.on_stop);
    }
    do_op(op) {
      const elem = this.elem;
      switch (op.op) {
        case "pause":
          elem.pause();
          break;
        case "play":
          this.notify = op.notify || 0;
          this.repeats = op.repeats || 1;
          this.snd = op.snd;
          if (!this.paused) {
            elem.play();
            this.repeats--;
          }
          break;
        case "stop":
          this.delete();
          break;
        case "unpause":
          elem.play();
          break;
        case "volume": {
          if (this.vol_timer) {
            clearTimeout(this.vol_timer);
            this.vol_timer = 0;
          }
          let vol = op.vol;
          if (vol > 1) {
            vol = 1;
          }
          const notify = () => {
            this.send_event({
              type: "volume",
              notify: op.notify
            });
          };
          if (op.dur) {
            let steps = Math.ceil(op.dur / 10);
            const vol_step = (vol - elem.volume) / steps;
            this.vol_timer = setInterval(() => {
              elem.volume += vol_step;
              steps--;
              if (!steps) {
                clearInterval(this.vol_timer);
                this.vol_timer = 0;
                elem.volume = vol;
                if (op.notify) {
                  notify();
                }
              }
            }, 10);
          } else {
            elem.volume = vol;
            if (op.notify) {
              notify();
            }
          }
          break;
        }
      }
    }
    on_stop = () => {
      if (this.repeats > 0) {
        this.elem.play();
        this.repeats--;
      } else if (this.notify) {
        this.send_event({
          type: "sound",
          notify: this.notify,
          snd: this.snd
        });
      }
    };
  };

  // node_modules/asyncglk/node_modules/body-scroll-lock/lib/bodyScrollLock.esm.js
  function _toConsumableArray(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
        arr2[i] = arr[i];
      }
      return arr2;
    } else {
      return Array.from(arr);
    }
  }
  var hasPassiveEvents = false;
  if (typeof window !== "undefined") {
    passiveTestOptions = {
      get passive() {
        hasPassiveEvents = true;
        return void 0;
      }
    };
    window.addEventListener("testPassive", null, passiveTestOptions);
    window.removeEventListener("testPassive", null, passiveTestOptions);
  }
  var passiveTestOptions;
  var isIosDevice = typeof window !== "undefined" && window.navigator && window.navigator.platform && (/iP(ad|hone|od)/.test(window.navigator.platform) || window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
  var locks = [];
  var documentListenerAdded = false;
  var initialClientY = -1;
  var previousBodyOverflowSetting = void 0;
  var previousBodyPosition = void 0;
  var previousBodyPaddingRight = void 0;
  var allowTouchMove = function allowTouchMove2(el) {
    return locks.some(function(lock) {
      if (lock.options.allowTouchMove && lock.options.allowTouchMove(el)) {
        return true;
      }
      return false;
    });
  };
  var preventDefault = function preventDefault2(rawEvent) {
    var e2 = rawEvent || window.event;
    if (allowTouchMove(e2.target)) {
      return true;
    }
    if (e2.touches.length > 1) return true;
    if (e2.preventDefault) e2.preventDefault();
    return false;
  };
  var setOverflowHidden = function setOverflowHidden2(options) {
    if (previousBodyPaddingRight === void 0) {
      var _reserveScrollBarGap = !!options && options.reserveScrollBarGap === true;
      var scrollBarGap = window.innerWidth - document.documentElement.clientWidth;
      if (_reserveScrollBarGap && scrollBarGap > 0) {
        var computedBodyPaddingRight = parseInt(window.getComputedStyle(document.body).getPropertyValue("padding-right"), 10);
        previousBodyPaddingRight = document.body.style.paddingRight;
        document.body.style.paddingRight = computedBodyPaddingRight + scrollBarGap + "px";
      }
    }
    if (previousBodyOverflowSetting === void 0) {
      previousBodyOverflowSetting = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
  };
  var restoreOverflowSetting = function restoreOverflowSetting2() {
    if (previousBodyPaddingRight !== void 0) {
      document.body.style.paddingRight = previousBodyPaddingRight;
      previousBodyPaddingRight = void 0;
    }
    if (previousBodyOverflowSetting !== void 0) {
      document.body.style.overflow = previousBodyOverflowSetting;
      previousBodyOverflowSetting = void 0;
    }
  };
  var setPositionFixed = function setPositionFixed2() {
    return window.requestAnimationFrame(function() {
      if (previousBodyPosition === void 0) {
        previousBodyPosition = {
          position: document.body.style.position,
          top: document.body.style.top,
          left: document.body.style.left
        };
        var _window = window, scrollY = _window.scrollY, scrollX = _window.scrollX, innerHeight = _window.innerHeight;
        document.body.style.position = "fixed";
        document.body.style.top = -scrollY;
        document.body.style.left = -scrollX;
        setTimeout(function() {
          return window.requestAnimationFrame(function() {
            var bottomBarHeight = innerHeight - window.innerHeight;
            if (bottomBarHeight && scrollY >= innerHeight) {
              document.body.style.top = -(scrollY + bottomBarHeight);
            }
          });
        }, 300);
      }
    });
  };
  var restorePositionSetting = function restorePositionSetting2() {
    if (previousBodyPosition !== void 0) {
      var y = -parseInt(document.body.style.top, 10);
      var x = -parseInt(document.body.style.left, 10);
      document.body.style.position = previousBodyPosition.position;
      document.body.style.top = previousBodyPosition.top;
      document.body.style.left = previousBodyPosition.left;
      window.scrollTo(x, y);
      previousBodyPosition = void 0;
    }
  };
  var isTargetElementTotallyScrolled = function isTargetElementTotallyScrolled2(targetElement) {
    return targetElement ? targetElement.scrollHeight - targetElement.scrollTop <= targetElement.clientHeight : false;
  };
  var handleScroll = function handleScroll2(event, targetElement) {
    var clientY = event.targetTouches[0].clientY - initialClientY;
    if (allowTouchMove(event.target)) {
      return false;
    }
    if (targetElement && targetElement.scrollTop === 0 && clientY > 0) {
      return preventDefault(event);
    }
    if (isTargetElementTotallyScrolled(targetElement) && clientY < 0) {
      return preventDefault(event);
    }
    event.stopPropagation();
    return true;
  };
  var disableBodyScroll = function disableBodyScroll2(targetElement, options) {
    if (!targetElement) {
      console.error("disableBodyScroll unsuccessful - targetElement must be provided when calling disableBodyScroll on IOS devices.");
      return;
    }
    if (locks.some(function(lock2) {
      return lock2.targetElement === targetElement;
    })) {
      return;
    }
    var lock = {
      targetElement,
      options: options || {}
    };
    locks = [].concat(_toConsumableArray(locks), [lock]);
    if (isIosDevice) {
      setPositionFixed();
    } else {
      setOverflowHidden(options);
    }
    if (isIosDevice) {
      targetElement.ontouchstart = function(event) {
        if (event.targetTouches.length === 1) {
          initialClientY = event.targetTouches[0].clientY;
        }
      };
      targetElement.ontouchmove = function(event) {
        if (event.targetTouches.length === 1) {
          handleScroll(event, targetElement);
        }
      };
      if (!documentListenerAdded) {
        document.addEventListener("touchmove", preventDefault, hasPassiveEvents ? { passive: false } : void 0);
        documentListenerAdded = true;
      }
    }
  };
  var enableBodyScroll = function enableBodyScroll2(targetElement) {
    if (!targetElement) {
      console.error("enableBodyScroll unsuccessful - targetElement must be provided when calling enableBodyScroll on IOS devices.");
      return;
    }
    locks = locks.filter(function(lock) {
      return lock.targetElement !== targetElement;
    });
    if (isIosDevice) {
      targetElement.ontouchstart = null;
      targetElement.ontouchmove = null;
      if (documentListenerAdded && locks.length === 0) {
        document.removeEventListener("touchmove", preventDefault, hasPassiveEvents ? { passive: false } : void 0);
        documentListenerAdded = false;
      }
    }
    if (isIosDevice) {
      restorePositionSetting();
    } else {
      restoreOverflowSetting();
    }
  };

  // node_modules/asyncglk/dist/glkote/web/input.js
  var MAX_HISTORY_LENGTH = 25;
  var TextInput = class {
    el;
    history_index = 0;
    is_line = false;
    /** Whether this input has been refocused since it was last reset */
    refocused = false;
    window;
    constructor(win) {
      this.window = win;
      this.el = $("<textarea>", {
        "aria-hidden": "true",
        autocapitalize: "off",
        class: "Input",
        data: {
          window: win
        },
        on: {
          blur: () => this.onblur(),
          focus: () => this.onfocus(),
          input: (ev) => this.oninput(ev),
          keydown: (ev) => this.onkeydown(ev),
          keypress: (ev) => this.onkeypress(ev)
        },
        rows: 1
      }).prop("disabled", true).appendTo(win.frameel);
    }
    destroy() {
      this.el.remove();
    }
    onblur() {
      if (is_iOS && !is_input_focused()) {
        this.set_gameport_height(true);
      }
    }
    onfocus() {
      if (this.window.type === "buffer" && !is_pinch_zoomed()) {
        this.window.scroll_to_bottom();
      }
      if (is_iOS) {
        this.set_gameport_height(false);
      }
    }
    /** The keydown and keypress inputs are unreliable in mobile browsers with virtual keyboards. This handler can handle character input for printable characters, but not function/arrow keys */
    oninput(ev) {
      if (!this.window.inputs?.type) {
        this.el.trigger("blur");
        return false;
      }
      if (this.window.inputs.type === "char") {
        const char = ev.target.value[0];
        this.submit_char(char);
        if (char === " ") {
          this.el.trigger("blur").trigger("focus");
        }
        return false;
      }
    }
    onkeydown(ev) {
      if (!this.window.inputs?.type) {
        this.el.trigger("blur");
        return false;
      }
      const keycode = ev.which;
      if (!keycode) {
        return;
      }
      if (this.is_line) {
        if (keycode === KEY_CODE_DOWN || keycode === KEY_CODE_UP) {
          const history = this.window.manager.history;
          let changed;
          if (keycode === KEY_CODE_DOWN && this.history_index > 0) {
            this.history_index--;
            changed = 1;
          } else if (keycode === KEY_CODE_UP && this.history_index < history.length) {
            this.history_index++;
            changed = 1;
          }
          if (changed) {
            this.el.val(this.history_index === 0 ? "" : history[this.history_index - 1]);
          }
          return false;
        } else if (this.window.inputs.terminators) {
          const terminator = KEY_CODES_TO_NAMES[keycode];
          if (this.window.inputs.terminators.includes(terminator)) {
            this.submit_line(ev.target.value, terminator);
            return false;
          }
        }
      } else {
        const code = KEY_CODES_TO_NAMES[keycode];
        if (code) {
          this.submit_char(code);
          return false;
        }
      }
      ev.stopPropagation();
    }
    onkeypress(ev) {
      if (!this.window.inputs?.type) {
        this.el.trigger("blur");
        return false;
      }
      const keycode = ev.which;
      if (!keycode) {
        return;
      }
      if (this.is_line) {
        if (keycode === KEY_CODE_RETURN) {
          this.submit_line(ev.target.value);
          return false;
        }
      } else {
        const code = keycode === KEY_CODE_RETURN ? "return" : String.fromCharCode(keycode);
        this.submit_char(code);
        return false;
      }
    }
    /** Refocus the input, if it wouldn't obscure part of the update */
    // On Android this forces the window to be scrolled down to the bottom, so only refocus if the virtual keyboard doesn't make the window too small for the full update text to be seen
    refocus() {
      if (this.refocused || document.activeElement === this.el[0]) {
        return;
      }
      this.refocused = true;
      if (this.window.type === "buffer") {
        const updateheight = this.window.innerel.outerHeight() - this.window.updatescrolltop;
        if (updateheight > this.window.height_above_keyboard) {
          if (is_iOS) {
            this.set_gameport_height(true);
          }
          return;
        }
      }
      this.el[0].focus({ preventScroll: true });
    }
    reset() {
      this.history_index = 0;
      this.refocused = false;
      this.el.attr({
        "aria-hidden": "true",
        class: "Input"
      }).css({
        "background-color": "",
        color: "",
        left: OFFSCREEN_OFFSET,
        top: "",
        width: ""
      }).val("");
      const inputparent = this.window.type === "buffer" ? this.window.innerel : this.window.frameel;
      if (!this.el.parent().is(inputparent)) {
        this.el.appendTo(inputparent);
      }
    }
    set_gameport_height = debounce_default((full_screen) => {
      this.window.manager.glkote.metrics_calculator.set_gameport_height(full_screen ? window.innerHeight : 0);
    }, 50);
    submit_char(val) {
      this.window.send_text_event({
        type: "char",
        value: val
      });
    }
    submit_line(val, terminator) {
      const history = this.window.manager.history;
      if (val && val !== history[0]) {
        history.unshift(val);
        if (history.length > MAX_HISTORY_LENGTH) {
          history.length = MAX_HISTORY_LENGTH;
        }
      }
      this.window.send_text_event({
        type: "line",
        terminator,
        value: val
      });
    }
    update() {
      this.reset();
      const update = this.window.inputs;
      if (update.type !== "char" && update.type !== "line") {
        return;
      }
      this.is_line = update.type === "line";
      this.el.attr({
        "aria-hidden": "false",
        maxlength: this.is_line ? update.maxlen : 1
      }).prop("disabled", false).val(update.initial || "");
      if (this.is_line) {
        if (this.window.type === "graphics") {
          throw new Error(`Cannot request line input in graphics window ${this.window.id}`);
        }
        this.el.addClass("LineInput");
      }
      switch (this.window.type) {
        case "buffer":
          (this.window.lastline || this.window.innerel).append(this.el);
          break;
        case "grid": {
          const metrics = this.window.metrics;
          this.el.css({
            left: update.xpos * metrics.gridcharwidth + metrics.gridmarginx / 2,
            top: update.ypos * metrics.gridcharheight + metrics.gridmarginy / 2,
            width: (update.maxlen || 1) * metrics.gridcharwidth
          });
          break;
        }
      }
      if (this.window.type !== "graphics") {
        const css_styles = this.window.last_run_styles;
        if (css_styles) {
          const reverse2 = !!css_styles.reverse;
          this.el.toggleClass("reverse", reverse2);
          apply_text_run_styles(css_styles, reverse2, this.el);
        }
      }
    }
  };

  // node_modules/asyncglk/dist/glkote/web/windows.js
  function no_text_selected() {
    return window.getSelection() + "" === "";
  }
  var WindowBase = class {
    blorb;
    desired = true;
    dom;
    frameel;
    id;
    inputs;
    manager;
    metrics;
    textinput;
    type;
    constructor(options) {
      this.blorb = options.blorb;
      this.dom = options.dom;
      this.id = options.id;
      this.manager = options.manager;
      this.metrics = options.metrics;
      this.type = options.type;
      this.frameel = this.dom.create("div", `window${options.id}`, {
        class: `WindowFrame ${window_types[this.type]} WindowRock_${options.rock}`,
        click: (ev) => this.onclick(ev)
      }).appendTo(this.dom.windowport());
      this.textinput = new TextInput(this);
    }
    destroy(remove_frame) {
      this.textinput.destroy();
      if (remove_frame) {
        this.frameel.remove();
      } else {
        this.inputs = void 0;
      }
    }
    // Dummy function which is only needed for buffer windows
    measure_height() {
    }
    onclick(ev) {
      if (this.inputs?.type && no_text_selected()) {
        this.textinput.el.trigger("focus");
        return false;
      }
    }
    send_text_event(ev) {
      this.measure_height();
      this.textinput.reset();
      this.inputs.type = void 0;
      this.manager.active_window = this;
      ev.window = this.id;
      this.manager.send_event(ev);
    }
  };
  function apply_text_run_styles(orig_styles, reverse2, el) {
    const styles = Object.assign({}, orig_styles);
    if (reverse2) {
      const bg = styles["background-color"];
      const fg = styles.color;
      if (bg) {
        styles.color = bg;
      } else {
        delete styles.color;
      }
      if (fg) {
        styles["background-color"] = fg;
      } else {
        delete styles["background-color"];
      }
      delete styles.reverse;
    }
    el.css(styles);
  }
  function split_after_spaces(text) {
    const res = [""];
    const whitespace = /\s/;
    let prev_whitespace = false;
    for (const c of text) {
      const is_whitespace = whitespace.test(c);
      if (!is_whitespace && prev_whitespace) {
        res.unshift("");
      }
      res[0] += c;
      prev_whitespace = is_whitespace;
    }
    res.reverse();
    return res;
  }
  var TextualWindow = class extends WindowBase {
    bg = null;
    fg = null;
    last_run_styles;
    styles;
    constructor(options) {
      super(options);
      const onlink = (target) => this.onlink(target);
      this.frameel.on("click", "a", function() {
        onlink(this);
      });
      if (options.styles) {
        this.styles = options.styles;
        this.add_stylehints();
      }
    }
    /** Format CSS rules and add to the window */
    add_stylehints() {
      const windowid = `#window${this.id}`;
      const styles = {};
      if (this.styles) {
        for (const [selector, original_styles] of Object.entries(this.styles)) {
          const full_selector = `${windowid} ${selector}`.trim();
          const css_styles = styles[full_selector] = Object.assign({}, original_styles);
          if (selector) {
            const bg2 = css_styles["background-color"];
            const fg2 = css_styles.color;
            if (bg2 || fg2) {
              const reverse_styles = styles[`${full_selector}.reverse`] = {};
              if (bg2) {
                reverse_styles.color = bg2;
              }
              if (fg2) {
                reverse_styles["background-color"] = fg2;
              }
            }
            delete css_styles.monospace;
            if (css_styles.reverse) {
              delete css_styles["background-color"];
              delete css_styles.color;
            }
            delete css_styles.reverse;
            if (Object.keys(css_styles).length === 0) {
              delete styles[full_selector];
            }
          }
        }
        if (styles[`${windowid} .Style_input`]) {
          styles[`${windowid} .LineInput`] = styles[`${windowid} .Style_input`];
        }
      }
      const normal_styles = styles[`${windowid} .Style_normal`];
      const bg = this.bg || normal_styles?.["background-color"];
      const fg = this.fg || normal_styles?.color;
      if (bg || fg) {
        if (!styles[windowid]) {
          styles[windowid] = {};
        }
        styles[windowid]["background-color"] = bg || `var(--glkote-${this.type}-bg)`;
        styles[`${windowid}.reverse`] = {
          "background-color": fg || `var(--glkote-${this.type}-reverse-bg)`
        };
      }
      if (Object.keys(styles).length) {
        this.frameel.children("style").remove();
        this.frameel.prepend(`<style>${Object.entries(styles).map((rule) => {
          const [selector, properties] = rule;
          return `${selector} {${Object.entries(properties).map((property) => {
            const [name, value] = property;
            return `${name}: ${value}`;
          }).join("; ")}}`;
        }).join("\n")}</style>`);
      }
    }
    create_text_run(run, split_words) {
      const run_style = run.style;
      const monospace_val = run.css_styles?.monospace ?? this.styles?.[`.Style_${run_style}`]?.monospace;
      let monospace_class = "";
      if (typeof monospace_val !== "undefined") {
        if (run_style === "preformatted") {
          if (!monospace_val) {
            monospace_class = " proportional";
          }
        } else if (monospace_val) {
          monospace_class = " monospace";
        }
      }
      const reverse2 = run.css_styles?.reverse ?? this.styles?.[`.Style_${run_style}`]?.reverse;
      const el = create("span", `Style_${run_style}${reverse2 ? " reverse" : ""}${monospace_class}`);
      if (run.css_styles) {
        apply_text_run_styles(run.css_styles, !!reverse2, el);
      }
      if (typeof split_words === "undefined") {
        split_words = !!monospace_val || run_style === "preformatted";
      }
      const els = split_words ? $(split_after_spaces(run.text).map((text) => el.clone().text(text)[0])) : el.text(run.text);
      if (run.hyperlink) {
        return $("<a>", {
          data: {
            glklink: run.hyperlink
          },
          href: "#"
        }).append(els);
      }
      return els;
    }
    onlink(target) {
      const linkval = $(target).data("glklink");
      if (linkval) {
        if (this.inputs?.hyperlink) {
          this.manager.send_event({
            type: "hyperlink",
            value: linkval,
            window: this.id
          });
        }
        return false;
      }
    }
    /** Refresh styles after a cleared window */
    refresh_styles(bg, fg) {
      let styles_need_refreshing;
      if (typeof bg !== "undefined" && bg !== this.bg) {
        this.bg = bg;
        styles_need_refreshing = 1;
      }
      if (typeof fg !== "undefined" && fg !== this.fg) {
        this.fg = fg;
        styles_need_refreshing = 1;
      }
      if (styles_need_refreshing) {
        this.add_stylehints();
      }
    }
  };
  var inline_alignment_classes = {
    inlinecenter: "ImageInlineCenter",
    inlinedown: "ImageInlineDown",
    inlineup: "ImageInlineUp",
    marginleft: "ImageMarginLeft",
    marginright: "ImageMarginRight"
  };
  var BufferWindow = class extends TextualWindow {
    type = "buffer";
    /** How much height is available with the keyboard active */
    height_above_keyboard;
    innerel;
    is_scrolled_down = true;
    lastline;
    updatescrolltop = 0;
    constructor(options) {
      super(options);
      this.frameel.attr({
        "aria-live": "polite",
        role: "log",
        tabindex: -1
      }).on("scroll", this.onscroll);
      if (is_iOS) {
        disableBodyScroll(this.frameel[0]);
      }
      this.innerel = create("div", "BufferWindowInner").append(this.textinput.el).appendTo(this.frameel);
      this.height_above_keyboard = this.frameel.height();
    }
    destroy(remove_frame) {
      if (is_iOS) {
        enableBodyScroll(this.frameel[0]);
      }
      super.destroy(remove_frame);
    }
    /** Measure the height of the window that is currently visible (excluding virtual keyboards for example) */
    measure_height() {
      this.height_above_keyboard = this.frameel.height();
    }
    onclick(_) {
      if (this.inputs?.type && no_text_selected()) {
        if (this.lastline && this.height_above_keyboard) {
          const rect = this.lastline[0].getBoundingClientRect();
          if (rect.bottom < 0 || rect.top > document.documentElement.clientHeight) {
            return false;
          }
        }
        this.textinput.el.trigger("focus");
        return false;
      }
    }
    // When the frame element is scrolled, update whether it's scrolled to the bottom
    onscroll = () => {
      const frameel = this.frameel[0];
      this.is_scrolled_down = frameel.scrollHeight - frameel.scrollTop - frameel.clientHeight < 1;
    };
    // Scroll to the bottom, unless `after_metrics_change` is set, in which case only scroll if we *should* be at the bottom (used after updating metrics)
    scroll_to_bottom(after_metrics_change) {
      if (!after_metrics_change || this.is_scrolled_down) {
        this.frameel.scrollTop(this.innerel.height());
        this.is_scrolled_down = true;
      }
    }
    update(data3) {
      if (data3.clear) {
        this.textinput.reset();
        this.innerel.children(".BufferLine").remove();
        this.is_scrolled_down = true;
        this.lastline = void 0;
        this.last_run_styles = void 0;
        this.refresh_styles(data3.bg, data3.fg);
      }
      if (!data3.text) {
        return;
      }
      this.frameel.attr("aria-busy", "true");
      this.updatescrolltop = Math.max(0, (this.lastline?.position().top || 0) - 20);
      let line_index = 0;
      while (line_index < data3.text.length) {
        const line = data3.text[line_index++];
        const content = line.content;
        let divel;
        let line_has_style;
        if (line.append && this.lastline) {
          divel = this.lastline;
          line_has_style = 1;
          if (divel.hasClass("BlankPara")) {
            divel.removeClass("BlankPara");
            divel.children(".BlankLineSpace").remove();
          }
        } else {
          divel = create("div", "BufferLine");
          this.innerel.append(divel);
          this.lastline = divel;
          if (!content?.length) {
            divel.addClass("BlankPara");
            divel.append(create("span", "BlankLineSpace").text(NBSP));
            continue;
          }
        }
        if (line.flowbreak) {
          divel.addClass("FlowBreak");
        }
        if (!content?.length) {
          continue;
        }
        for (let run_index = 0; run_index < content.length; run_index++) {
          let run;
          const instruction = content[run_index];
          if (typeof instruction === "string") {
            run = {
              style: content[run_index++],
              text: content[run_index]
            };
          } else if ("special" in instruction && instruction.special === "image") {
            const image_elem_props = {
              alt: instruction.alttext || `Image ${instruction.image}`,
              class: inline_alignment_classes[instruction.alignment || "inlineup"],
              src: this.blorb && this.blorb.get_image_url(instruction.image) || instruction.url,
              css: {}
            };
            if (instruction.widthratio) {
              image_elem_props.css.width = "" + instruction.widthratio * 100 + "%";
            } else {
              if (instruction.winmaxwidth === void 0) {
                instruction.winmaxwidth = 1;
              }
              if (instruction.winmaxwidth) {
                image_elem_props.css["max-width"] = "" + instruction.winmaxwidth * 100 + "%";
              }
              image_elem_props.width = instruction.width;
            }
            if (instruction.aspectwidth) {
              image_elem_props.css["aspect-ratio"] = "" + instruction.aspectwidth + "/" + instruction.aspectheight;
            } else {
              if (instruction.winmaxwidth && !instruction.widthratio) {
                image_elem_props.css["aspect-ratio"] = "" + instruction.width + "/" + instruction.height;
              } else {
                image_elem_props.height = instruction.height;
              }
            }
            const el = $("<img>", image_elem_props);
            if (instruction.hyperlink) {
              $("<a>", {
                data: {
                  glklink: instruction.hyperlink
                },
                href: "#"
              }).append(el).appendTo(divel);
              continue;
            }
            divel.append(el);
            continue;
          } else {
            run = instruction;
          }
          if (!line_has_style) {
            line_has_style = 1;
            divel.addClass(`Style_${run.style}_par`);
          }
          divel.append(this.create_text_run(run, line_index === data3.text.length ? true : void 0));
          this.last_run_styles = run.css_styles;
        }
      }
      if (!is_pinch_zoomed()) {
        this.frameel.scrollTop(this.updatescrolltop);
      }
      this.frameel.attr("aria-busy", "false");
    }
  };
  var GraphicsWindow = class extends WindowBase {
    type = "graphics";
    buffer;
    canvas;
    fillcolour = "";
    framequeue = [];
    /** Height in CSS pixels */
    height = 0;
    image_cache = /* @__PURE__ */ new Map();
    /** Width in CSS pixels */
    width = 0;
    constructor(options) {
      super(options);
      this.canvas = this.dom.create("canvas", `win${options.id}_canvas`, {
        data: {
          window: this
        }
      });
      this.frameel.append(this.canvas);
      this.manager.canvasResizeObserver?.observe(this.canvas[0]);
      this.buffer = this.dom.create("canvas", `win${options.id}_buffer`);
    }
    // Clear the image cache 5 seconds after the last frame, so that the cache can be useful for animations, but we don't waste memory for images which are only updated each turn
    clear_cache = debounce_default(() => {
      this.image_cache.clear();
    }, 5e3);
    // Decode and cache an image
    decode_image(key, url) {
      const image = new Image();
      image.src = url;
      return image.decode().then(() => {
        this.image_cache.set(key, image);
      }).catch(() => {
      });
    }
    destroy(remove_frame) {
      this.manager.canvasResizeObserver?.unobserve(this.canvas[0]);
      super.destroy(remove_frame);
    }
    onclick(ev) {
      if (this.inputs?.mouse && ev.button === 0) {
        this.inputs.mouse = false;
        this.manager.send_event({
          type: "mouse",
          window: this.id,
          x: Math.floor(ev.offsetX - this.metrics.graphicsmarginx / 2),
          y: Math.floor(ev.offsetY - this.metrics.graphicsmarginy / 2)
        });
        return false;
      }
      return super.onclick(ev);
    }
    set_dimensions(height, width) {
      this.canvas.css({ height, width });
      this.height = height;
      this.width = width;
      const dPR = devicePixelRatio;
      height = height * dPR;
      width = width * dPR;
      this.buffer.attr({ height, width });
      this.canvas.attr({ height, width });
    }
    // This function is async because images must be loaded asynchrounously, and each operation painted in sequence, but the rest of GlkOte doesn't need to await it
    async update() {
      const buffercontext = this.buffer[0].getContext("2d");
      for (let i = 0; i < this.framequeue.length; i++) {
        const frame2 = this.framequeue[i];
        if (!this.height || !this.width) {
          break;
        }
        if (!frame2.length) {
          continue;
        }
        const loading_images = [];
        for (const op of frame2) {
          if (op.special === "image") {
            const key = op.url || op.image;
            if (this.image_cache.has(key)) {
              continue;
            }
            const url = op.url || this.blorb && this.blorb.get_image_url(op.image);
            if (url) {
              loading_images.push(this.decode_image(key, url));
            }
          }
        }
        await Promise.all(loading_images);
        const dPR = devicePixelRatio;
        for (const op of frame2) {
          switch (op.special) {
            case "fill":
              buffercontext.fillStyle = op.color || this.fillcolour;
              if (Number.isFinite(op.x)) {
                buffercontext.fillRect(op.x * dPR, op.y * dPR, op.width * dPR, op.height * dPR);
              } else {
                buffercontext.fillRect(0, 0, parseInt(this.buffer.attr("width")), parseInt(this.buffer.attr("height")));
              }
              break;
            case "image": {
              const image = this.image_cache.get(op.url || op.image);
              if (image) {
                buffercontext.drawImage(image, op.x * dPR, op.y * dPR, op.width * dPR, op.height * dPR);
              }
              break;
            }
            case "setcolor":
              this.fillcolour = op.color;
              break;
          }
        }
      }
      if (this.height && this.width) {
        this.canvas[0].getContext("2d").drawImage(this.buffer[0], 0, 0);
      }
      this.framequeue.length = 0;
      this.clear_cache();
    }
  };
  var GridWindow = class extends TextualWindow {
    type = "grid";
    height = 0;
    lines = [];
    width = 0;
    constructor(options) {
      super(options);
      this.frameel.attr({
        "aria-atomic": "true",
        "aria-live": "off",
        role: "status"
      });
    }
    onclick(ev) {
      if (this.inputs?.mouse && ev.button === 0 && no_text_selected()) {
        this.inputs.mouse = false;
        this.manager.send_event({
          type: "mouse",
          window: this.id,
          x: Math.floor((ev.offsetX - this.metrics.gridmarginx / 2) / this.metrics.gridcharwidth),
          y: Math.floor((ev.offsetY - this.metrics.gridmarginy / 2) / this.metrics.gridcharheight)
        });
        return false;
      }
      return super.onclick(ev);
    }
    update(data3) {
      if (data3.clear) {
        this.last_run_styles = void 0;
        this.refresh_styles(data3.bg, data3.fg);
      }
      this.frameel.attr("aria-busy", "true");
      for (const line of data3.lines) {
        const lineel = this.lines[line.line];
        if (!lineel.length) {
          throw new Error(`Got content for nonexistent line ${line.line} of window ${this.id}`);
        }
        const content = line.content;
        if (!content || !content.length) {
          lineel.text(NBSP);
        } else {
          lineel.empty();
          for (let i = 0; i < content.length; i++) {
            let run;
            if (typeof content[i] === "string") {
              run = {
                style: content[i++],
                text: content[i]
              };
            } else {
              run = content[i];
            }
            lineel.append(this.create_text_run(run, false));
            this.last_run_styles = run.css_styles;
          }
        }
      }
      this.frameel.toggleClass("reverse", $(`#window${this.id} span:not(.reverse)`).length === 0).attr({
        "aria-busy": "false",
        "aria-live": this.lines.length > 3 ? "polite" : "off"
      });
    }
  };
  var window_classes = {
    buffer: BufferWindow,
    graphics: GraphicsWindow,
    grid: GridWindow
  };
  var window_types = {
    buffer: "BufferWindow",
    graphics: "GraphicsWindow",
    grid: "GridWindow"
  };
  var Windows = class extends Map {
    active_window;
    blorb;
    // Note will be set after this is constructed, in WebGlkOte.init
    canvasResizeObserver;
    // Will only be created if the browser's ResizeObserver supports devicePixelContentBoxSize
    dom;
    glkote;
    history = [];
    metrics;
    send_event;
    constructor(glkote2) {
      super();
      this.dom = glkote2.dom;
      this.glkote = glkote2;
      this.metrics = glkote2.current_metrics;
      if (window.ResizeObserver) {
        const testRO = new ResizeObserver((entries) => {
          if (typeof entries?.[0].devicePixelContentBoxSize?.[0].blockSize !== "undefined") {
            this.canvasResizeObserver = new ResizeObserver((entries2) => this.oncanvasresize(entries2));
          }
          testRO.disconnect();
        });
        testRO.observe(document.body);
      }
      this.send_event = (ev) => glkote2.send_event(ev);
      $(document).on("keydown", this.onkeydown);
      this.dom.gameport().on("click", () => this.onclick());
    }
    // Clean up after a GlkOte.exit() call, but don't empty the HTML
    destroy() {
      for (const win of this.values()) {
        win.destroy(false);
        this.delete(win.id);
      }
      $(document).off("keydown", this.onkeydown);
    }
    cancel_inputs(windows) {
      const newinputs = {};
      for (const window2 of windows) {
        newinputs[window2.id] = window2;
      }
      for (const win of this.values()) {
        const update = newinputs[win.id];
        if (!update && win.inputs) {
          if (win.textinput.el.is(":focus")) {
            this.active_window = win;
          }
          win.textinput.el.prop("disabled", true);
          delete win.inputs;
        }
      }
    }
    // Use a resize observer to set true pixel sizes on graphics windows
    oncanvasresize(entries) {
      for (const entry of entries) {
        const box = entry.devicePixelContentBoxSize[0];
        const height = box.blockSize;
        const width = box.inlineSize;
        const win = $(entry.target).data("window");
        win.buffer.attr({ height, width });
        win.canvas.attr({ height, width });
      }
      this.send_event({ type: "redraw" });
    }
    // If the gameport receives a click event, then find one window with active text input to focus
    onclick() {
      if (!this.glkote.disabled && no_text_selected()) {
        for (const window2 of this.values()) {
          if (window2.inputs?.type) {
            window2.frameel.trigger("click");
            break;
          }
        }
      }
    }
    // On document.keypress events, redirect to a window
    onkeydown = (ev) => {
      if (!this.glkote.disabled && ev.target.nodeName !== "INPUT" && ev.target.nodeName !== "TEXTAREA" && !(ev.target.nodeName === "DIV" && $(ev.target).is(".BufferWindow:focus"))) {
        const windows = [...this.values()];
        const window2 = windows.filter((win) => win.inputs?.type)[0] || windows.filter((win) => win.type === "buffer")[0];
        if (window2) {
          window2.frameel.trigger("click");
          if (window2.textinput.el.is(":focus")) {
            window2.textinput.el.trigger(ev);
          } else if (window2.type === "buffer") {
            window2.frameel.trigger("focus");
          }
        }
      }
    };
    update(windows) {
      for (const win of this.values()) {
        win.desired = false;
      }
      for (const update of windows) {
        const id = update.id;
        const type = update.type;
        let win = this.get(id);
        if (!win) {
          win = new window_classes[type]({
            blorb: this.blorb,
            dom: this.dom,
            id,
            manager: this,
            metrics: this.metrics,
            rock: update.rock,
            styles: update.styles,
            type
          });
          this.set(id, win);
        } else {
          if (win.type !== type) {
            throw new Error(`Window ${id} was created with type ${win.type}, but now is described as type ${type}`);
          }
        }
        win.desired = true;
        if (win.type === "graphics") {
          if (win.height !== update.graphheight || win.width !== update.graphwidth) {
            win.set_dimensions(update.graphheight, update.graphwidth);
          }
        }
        if (win.type === "grid") {
          if (update.gridheight > win.height) {
            for (let i = win.height; i < update.gridheight; i++) {
              const line = this.dom.create("div", `win${win.id}_ln${i}`, "GridLine");
              line.append(NBSP);
              win.frameel.append(line);
              win.lines[i] = line;
            }
          }
          if (update.gridheight < win.height) {
            for (let i = update.gridheight; i < win.height; i++) {
              this.dom.id(`win${win.id}_ln${i}`).remove();
            }
          }
          win.height = update.gridheight;
          win.lines.length = win.height;
          win.width = update.gridwidth;
        }
        win.frameel.css({
          height: update.height,
          left: update.left,
          top: update.top,
          width: update.width
        }).toggleClass("hidden", !!update.hidden);
        if (win.type === "buffer") {
          win.scroll_to_bottom(true);
        }
      }
      const windowstoclose = [];
      for (const win of this.values()) {
        if (!win.desired) {
          windowstoclose.push(win);
        }
      }
      for (const win of windowstoclose) {
        win.destroy(true);
        this.delete(win.id);
      }
    }
    update_content(content) {
      for (const update of content) {
        const win = this.get(update.id);
        if (!win) {
          throw new Error(`Got content update for window ${update.id}, which does not exist`);
        }
        switch (win.type) {
          case "buffer":
            win.update(update);
            break;
          case "graphics":
            win.framequeue.push(update.draw);
            if (win.framequeue.length === 1) {
              win.update();
            }
            break;
          case "grid":
            win.update(update);
            break;
        }
      }
    }
    update_inputs(windows) {
      for (const update of windows) {
        const win = this.get(update.id);
        if (!win) {
          throw new Error(`Got input update for window ${update.id}, which does not exist`);
        }
        const oldgen = win.inputs?.gen;
        win.inputs = update;
        if (update.type) {
          if (update.gen !== oldgen) {
            win.textinput.update();
          }
        }
      }
      if (this.active_window) {
        if (this.has(this.active_window.id) && this.active_window.inputs?.type) {
          this.active_window.textinput.refocus();
        } else {
          [...this.values()].filter((win) => win.inputs?.type)[0]?.textinput.refocus();
        }
      }
    }
  };

  // node_modules/asyncglk/dist/glkote/web/transcript-recorder.js
  var TranscriptRecorder = class {
    enabled = false;
    handler = (state) => this.web_handler(state);
    event;
    label = "";
    session = Date.now() + Math.ceil(Math.random() * 1e4).toString(16);
    timestamp;
    url = "";
    windows;
    constructor(options, windows) {
      this.windows = windows;
      if (options.recording_handler) {
        this.enabled = true;
        this.handler = options.recording_handler;
        this.url = "(custom handler)";
      }
      if (options.recording_url) {
        this.enabled = true;
        this.url = options.recording_url;
      }
      this.label = options.recording_label ?? "";
      if (this.enabled) {
        console.log(`Transcript recording active: session ${this.session} "${this.label}", destination ${this.url}`);
      }
    }
    // Store the event for later
    record_event(ev) {
      this.event = ev;
      this.timestamp = Date.now();
    }
    // Record an event-output pair
    record_update(state) {
      if (!state.content) {
        return;
      }
      const event = this.event;
      const eventtype = event.type;
      let input = "";
      if (eventtype === "char" || eventtype === "line") {
        input = event.value;
      } else if (!(!eventtype || eventtype === "external" || eventtype === "init" || eventtype === "specialresponse")) {
        return;
      }
      let output = "";
      for (const update of state.content) {
        const win = this.windows.get(update.id);
        if (!win || win.type !== "buffer") {
          continue;
        }
        const textdata = update.text || [];
        for (const data3 of textdata) {
          if (!data3.append) {
            output += "\n";
          }
          const content = data3.content;
          if (!content?.length) {
            continue;
          }
          for (let run_index = 0; run_index < content.length; run_index++) {
            const instruction = content[run_index];
            if (typeof instruction === "string") {
              output += content[++run_index];
            } else if ("text" in instruction) {
              output += instruction.text;
            }
          }
        }
      }
      this.handler({
        format: "simple",
        input,
        label: this.label,
        output,
        outtimestamp: Date.now(),
        sessionId: this.session,
        timestamp: this.timestamp
      });
    }
    async web_handler(state) {
      try {
        const response = await fetch(this.url, {
          body: JSON.stringify(state),
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST"
        });
        if (!response.ok) {
          throw new Error(`Could not submit transcript update, got ${response.status}`);
        }
      } catch (err) {
        this.enabled = false;
        console.log(`Transcript recording failed; disabling. Error: ${err}`);
      }
    }
  };

  // node_modules/asyncglk/dist/glkote/web/web.js
  var WebGlkOte = class extends GlkOteBase {
    dom = new DOM({
      context_element: void 0,
      errorcontent_id: "errorcontent",
      errorpane_id: "errorpane",
      gameport_id: "gameport",
      loadingpane_id: "loadingpane",
      prefix: "",
      windowport_id: "windowport"
    });
    metrics_calculator;
    schannels;
    showing_error = false;
    showing_loading = true;
    transcript_recorder;
    windows;
    constructor() {
      super();
      this.metrics_calculator = new Metrics(this);
      this.windows = new Windows(this);
    }
    async init(options) {
      try {
        if (!options) {
          throw new Error("no options provided");
        }
        if (typeof jQuery === "undefined") {
          throw new Error("jQuery is not loaded");
        }
        if (options.dom_prefix) {
          this.dom.prefix = options.dom_prefix;
        }
        if (options.errorcontent) {
          this.dom.errorcontent_id = options.errorcontent;
        }
        if (options.errorpane) {
          this.dom.errorpane_id = options.errorpane;
        }
        if (options.gameport) {
          this.dom.gameport_id = options.gameport;
        }
        if (options.loadingpane) {
          this.dom.loadingpane_id = options.loadingpane;
        }
        if (options.windowport) {
          this.dom.windowport_id = options.windowport;
        }
        if (options.Blorb) {
          this.windows.blorb = options.Blorb;
        }
        const windowport = this.dom.windowport();
        if (!windowport.length) {
          throw new Error(`Cannot find windowport element #${this.dom.windowport_id}`);
        }
        windowport.empty();
        let viewport_meta_tag_content = "initial-scale=1,interactive-widget=resizes-content,minimum-scale=1,width=device-width";
        if (is_iOS) {
          viewport_meta_tag_content += ",maximum-scale=1";
        }
        document.head.querySelector('meta[name="viewport"]').content = viewport_meta_tag_content;
        await this.metrics_calculator.measure();
        if (options.recording_url || options.recording_handler) {
          if (options.recording_format && options.recording_format !== "simple") {
            console.warn('GlkOte: only the "simple" recording_format is supported');
          } else {
            const query_feedback = new URLSearchParams(document.location.search).get("feedback");
            const cookie_name = options.recording_cookie || "transcript_recording_opt_out";
            if (query_feedback && query_feedback !== "1" || document.cookie.includes(`${cookie_name}=1`)) {
              console.log("User has opted out of transcript recording.");
            } else {
              this.transcript_recorder = new TranscriptRecorder(options, this.windows);
            }
          }
        }
        if (typeof AudioContext !== "undefined") {
          this.schannels = new SoundChannelManager(this);
        }
        return super.init(options);
      } catch (err) {
        this.error(err);
      }
    }
    autorestore(data3) {
      if (Array.isArray(data3.history)) {
        this.windows.history = data3.history;
      }
      for (const win of this.windows.values()) {
        if (win.type === "buffer") {
          win.scroll_to_bottom();
        }
      }
      if (data3.graphics_bg) {
        for (const [winid, colour] of data3.graphics_bg) {
          this.windows.get(winid).fillcolour = colour;
        }
      }
      if (data3.transcript_recorder_session && this.transcript_recorder) {
        this.transcript_recorder.session = data3.transcript_recorder_session;
        console.log(`Resuming autosaved transcript recording session: ${data3.transcript_recorder_session}`);
      }
      setTimeout(() => this.send_event({ type: "arrange" }), 0);
    }
    cancel_inputs(windows) {
      this.windows.cancel_inputs(windows);
    }
    capabilities() {
      const capabilities = [
        "garglktext",
        "graphics",
        "graphicsext",
        "graphicswin",
        "hyperlinks",
        "timer"
      ];
      if (typeof AudioContext !== "undefined") {
        capabilities.push("sounds");
      }
      return capabilities;
    }
    disable(disable) {
      for (const win of this.windows.values()) {
        win.textinput.el.prop("disabled", disable || !win.inputs?.type);
      }
      this.disabled = disable;
    }
    embellish_error() {
      if (typeof $ === "undefined") {
        return;
      }
      const errorpane = $(`#${this.dom.errorpane_id}`);
      if (!errorpane.find("#errorclose").length) {
        $("<button>", {
          "aria-label": "Close",
          click: () => {
            errorpane.hide();
            return false;
          },
          id: "errorclose",
          text: "\u2716",
          type: "button"
        }).appendTo(errorpane);
      }
      if (this.autorestoring && !this.Dialog?.async && this.Dialog?.autosave_clear) {
        const link = $("<a>", {
          click: async () => {
            if (!this.Dialog.async) {
              await this.Dialog.autosave_clear();
            }
            location.reload();
          },
          text: "Clear autosave and restart"
        });
        $("<div>").append(link).appendTo(errorpane);
      }
    }
    error(error) {
      error ??= "???";
      let msg;
      if (typeof error === "string") {
        msg = error;
        error = new Error(error);
      } else {
        msg = error.toString();
      }
      const errorcontent = document.getElementById(this.dom.errorcontent_id);
      if (!errorcontent) {
        throw new Error(msg);
      }
      errorcontent.innerHTML = msg;
      const errorpane = document.getElementById(this.dom.errorpane_id);
      if (errorpane.className === "WarningPane") {
        errorpane.className = "";
      }
      this.embellish_error();
      errorpane.style.display = "";
      this.showing_error = true;
      this.hide_loading();
      console.error(error);
    }
    exit() {
      this.metrics_calculator.destroy();
      this.windows.destroy();
    }
    getdomcontext() {
      return this.dom.context_element;
    }
    getdomid(name) {
      switch (name) {
        case "errorcontent":
          return this.dom.errorcontent_id;
        case "errorpane":
          return this.dom.errorpane_id;
        case "gameport":
          return this.dom.gameport_id;
        case "loadingpane":
          return this.dom.loadingpane_id;
        case "windowport":
          return this.dom.windowport_id;
        default:
          return name;
      }
    }
    hide_loading() {
      if (!this.showing_loading) {
        return;
      }
      this.showing_loading = false;
      const loadingpane = document.getElementById(this.dom.loadingpane_id);
      if (loadingpane) {
        loadingpane.style.display = "none";
      }
    }
    save_allstate() {
      const graphics_bg = [];
      for (const win of this.windows.values()) {
        if (win.type === "graphics") {
          graphics_bg.push([win.id, win.fillcolour]);
        }
      }
      return {
        graphics_bg,
        history: this.windows.history,
        transcript_recorder_session: this.transcript_recorder?.session
      };
    }
    // Send partial line input values
    send_event(ev) {
      if (ev.type !== "init" && ev.type !== "refresh" && ev.type !== "specialresponse") {
        for (const win of this.windows.values()) {
          if (win.inputs?.type) {
            const val = win.textinput.el.val();
            if (val) {
              if (!ev.partial) {
                ev.partial = {};
              }
              ev.partial[win.id] = val;
            }
          }
        }
      }
      if (this.transcript_recorder?.enabled) {
        this.transcript_recorder.record_event(ev);
      }
      super.send_event(ev);
    }
    setdomcontext(val) {
      this.dom.context_element = val;
    }
    set_page_bg(colour) {
      $("body").css("background-color", colour || "");
    }
    update(data3) {
      if (this.showing_loading) {
        this.hide_loading();
      }
      super.update(data3);
      if (this.transcript_recorder?.enabled && data3.type === "update" && !data3.autorestore) {
        this.transcript_recorder.record_update(data3);
      }
    }
    update_content(content) {
      this.windows.update_content(content);
    }
    update_inputs(windows) {
      this.windows.update_inputs(windows);
    }
    update_schannels(schannels) {
      this.schannels?.update(schannels);
    }
    update_windows(windows) {
      this.windows.update(windows);
    }
    warning(msg) {
      if (this.showing_error) {
        return;
      }
      const errorpane = $(`#${this.dom.errorpane_id}`);
      if (!msg) {
        errorpane.hide();
        return;
      }
      const errorcontent = document.getElementById(this.dom.errorcontent_id);
      if (!errorcontent) {
        console.warn(msg);
        return;
      }
      errorcontent.innerHTML = msg;
      this.embellish_error();
      errorpane.addClass("WarningPane");
      errorpane.show();
      this.hide_loading();
    }
  };

  // src/asyncglk-client/play.ts
  var glkote = null;
  var websocket = null;
  var slash_chat_enabled = true;
  var SLASH_CHAT_KEY = "flutterbug.slashChat";
  var TYPING_STOP_DELAY = 3e3;
  var typing_timers = {
    chat: null,
    command: null
  };
  var FONT_SCALE_KEY = "flutterbug.gameFontScale";
  var FONT_SCALE_MIN = 0.7;
  var FONT_SCALE_MAX = 2;
  var FONT_SCALE_STEP = 0.125;
  var LARGE_STATUS_KEY = "flutterbug.largeStatus";
  var LARGE_STATUS_GRID_MULT = 1.5;
  var ASYNCGLK_BUFFER_BASE_PX = 15;
  var ASYNCGLK_GRID_BASE_PX = 14;
  var ASYNCGLK_GRID_LINE_HEIGHT_BASE_PX = 18;
  function read_px_var(name, fallback) {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const val = parseFloat(raw);
    return isNaN(val) ? fallback : val;
  }
  function accept(arg) {
    websocket?.send(JSON.stringify(arg));
  }
  function open_websocket() {
    try {
      const wsproto = window.location.protocol === "https:" ? "wss://" : "ws://";
      const url = wsproto + window.location.host + "/websocket?name=" + encodeURIComponent(multiplayer_playername);
      glkote.log("Creating websocket: " + url);
      websocket = new WebSocket(url);
    } catch (ex) {
      glkote.error("Unable to open websocket: " + ex);
      return;
    }
    websocket.onopen = callback_websocket_open;
    websocket.onclose = callback_websocket_close;
    websocket.onmessage = callback_websocket_message;
  }
  var EXTENSION_TO_USAGE = {
    glksave: "save",
    txt: "transcript"
    /* approximation; namedialog only treats
        'save' specially anyway, so the others all
        collapse to a plain input field. */
  };
  var FlutterbugDialog = {
    async: true,
    prompt(extension, is_write) {
      const ext = extension.replace(/^\./, "");
      const usage = EXTENSION_TO_USAGE[ext] ?? null;
      return new Promise((resolve) => {
        Dialog.open(is_write, usage, null, (filename) => {
          resolve(filename);
        });
      });
    }
  };
  function callback_websocket_open() {
    glkote.init({
      accept,
      Dialog: FlutterbugDialog
    });
  }
  function callback_websocket_close(ev) {
    websocket = null;
    glkote.error("Websocket has closed: (" + ev.code + "," + ev.reason + ")");
  }
  function callback_websocket_message(ev) {
    const obj = JSON.parse(ev.data);
    switch (obj.multiplayer) {
      case "players":
        update_player_list(obj.players || []);
        return;
      case "chat":
        append_chat(obj.player, obj.color_class, obj.text);
        return;
      case "status":
        update_status(obj.message || "");
        return;
      case "command":
        append_command(obj.player, obj.command);
        return;
      case "typing":
        update_typing(obj.player, obj.mode || null);
        return;
      case "layout":
        apply_gameport_layout(obj.width, obj.height);
        return;
      case "error":
      case "info":
        append_system_message(obj.message || "Server message.");
        if (obj.multiplayer === "error")
          glkote.error(obj.message || "Server error.");
        return;
    }
    const chat_input = document.getElementById("chat-input");
    const chat_was_focused = document.activeElement === chat_input;
    glkote.update(obj);
    if (chat_was_focused && chat_input) chat_input.focus();
    suppress_harmless_glkote_errors();
  }
  function suppress_harmless_glkote_errors() {
    const pane = document.getElementById("errorpane");
    const content = document.getElementById("errorcontent");
    if (!pane || !content || pane.style.display === "none") return;
    const msg = content.textContent || "";
    if (msg.indexOf("awaiting line input") !== -1) pane.style.display = "none";
  }
  function update_player_list(players) {
    const list = $("#players-list");
    if (!list.length) return;
    list.empty();
    for (const player of players) {
      const name = player.name || "Player " + player.id;
      const item = $("<span></span>");
      item.text(name);
      if (player.color_class) item.addClass(player.color_class);
      if (name === multiplayer_playername) item.addClass("me");
      list.append(item);
    }
  }
  function update_typing(player, mode2) {
    $("#players-list span").each(function() {
      if ($(this).text() === player) {
        $(this).removeClass("typing-chat typing-command");
        if (mode2) $(this).addClass("typing-" + mode2);
      }
    });
  }
  function send_typing(mode2) {
    if (!websocket) return;
    const existing = typing_timers[mode2];
    if (existing !== null) clearTimeout(existing);
    websocket.send(JSON.stringify({ type: "typing", mode: mode2 }));
    typing_timers[mode2] = window.setTimeout(() => {
      typing_timers[mode2] = null;
      websocket?.send(JSON.stringify({ type: "typing", mode: null }));
    }, TYPING_STOP_DELAY);
  }
  function append_command(player, command) {
    const feed = $("#command-feed");
    if (!feed.length) return;
    const line = $('<div class="feed-line"></div>');
    line.append(document.createTextNode((player || "Player") + ": "));
    const cmd = $('<span class="cmd-text"></span>');
    cmd.text(command || "");
    line.append(cmd);
    feed.append(line);
    while (feed.children().length > 2e3) feed.children().first().remove();
    feed.scrollTop(feed[0].scrollHeight);
  }
  function append_chat(player, color_class, text) {
    const feed = $("#chat-messages");
    if (!feed.length) return;
    const line = $('<div class="feed-line"></div>');
    const author = $('<strong class="chat-author"></strong>');
    author.text((player || "Player") + ": ");
    if (color_class) author.addClass(color_class);
    line.append(author);
    line.append(document.createTextNode(text || ""));
    feed.append(line);
    while (feed.children().length > 2e3) feed.children().first().remove();
    feed.scrollTop(feed[0].scrollHeight);
  }
  function send_chat() {
    const input = $("#chat-input");
    const text = (input.val() || "").trim();
    if (!text || !websocket) return;
    websocket.send(JSON.stringify({ type: "chat", text }));
    input.val("");
  }
  function append_system_message(message) {
    append_log_line("[system] " + message);
  }
  function append_log_line(text) {
    const feed = $("#command-feed");
    if (!feed.length) return;
    const line = $('<div class="feed-line"></div>');
    line.text(text);
    feed.append(line);
    while (feed.children().length > 2e3) feed.children().first().remove();
    feed.scrollTop(feed[0].scrollHeight);
  }
  function apply_font_scale(scale) {
    if (isNaN(scale)) scale = 1;
    scale = Math.max(FONT_SCALE_MIN, Math.min(FONT_SCALE_MAX, scale));
    scale = Math.round(scale / FONT_SCALE_STEP) * FONT_SCALE_STEP;
    const root2 = document.documentElement;
    root2.style.setProperty("--fb-game-font-scale", String(scale));
    const buffer_base = read_px_var("--glkote-buffer-base-size", ASYNCGLK_BUFFER_BASE_PX);
    const grid_base = read_px_var("--glkote-grid-base-size", ASYNCGLK_GRID_BASE_PX);
    const grid_lh_base = read_px_var("--glkote-grid-base-line-height", ASYNCGLK_GRID_LINE_HEIGHT_BASE_PX);
    const grid_bonus = document.body.classList.contains("large-status") ? LARGE_STATUS_GRID_MULT : 1;
    root2.style.setProperty("--glkote-buffer-size", buffer_base * scale + "px");
    root2.style.setProperty("--glkote-grid-size", grid_base * scale * grid_bonus + "px");
    root2.style.setProperty("--glkote-grid-line-height", grid_lh_base * scale * grid_bonus + "px");
    const label = document.getElementById("font-size-reset");
    if (label) label.textContent = Math.round(scale * 100) + "%";
    try {
      window.localStorage.setItem(FONT_SCALE_KEY, String(scale));
    } catch (ex) {
    }
    window.dispatchEvent(new Event("resize"));
    return scale;
  }
  function current_font_scale() {
    const raw = getComputedStyle(document.documentElement).getPropertyValue("--fb-game-font-scale");
    const val = parseFloat(raw);
    return isNaN(val) ? 1 : val;
  }
  function apply_gameport_layout(width, height) {
    const gp = document.getElementById("gameport");
    if (!gp) return;
    if (typeof width === "number") {
      gp.style.width = width + "px";
      gp.style.right = "auto";
    }
    if (typeof height === "number") gp.style.height = height + "px";
    window.dispatchEvent(new Event("resize"));
  }
  function download_text(filename, text) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1e3);
  }
  function timestamp_suffix() {
    const d = /* @__PURE__ */ new Date();
    const pad = (n) => n < 10 ? "0" + n : "" + n;
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "-" + pad(d.getHours()) + pad(d.getMinutes());
  }
  function download_commands() {
    const lines = [];
    $("#command-feed .feed-line").each(function() {
      const cmd = $(this).find(".cmd-text");
      if (cmd.length) lines.push(cmd.text());
    });
    download_text(
      "flutterbug-commands-" + timestamp_suffix() + ".txt",
      lines.join("\n") + (lines.length ? "\n" : "")
    );
  }
  function download_chat() {
    const lines = [];
    $("#chat-messages .feed-line").each(function() {
      lines.push($(this).text());
    });
    download_text(
      "flutterbug-chat-" + timestamp_suffix() + ".txt",
      lines.join("\n") + (lines.length ? "\n" : "")
    );
  }
  function update_status(message) {
    const el = $("#shared-status");
    if (!el.length) return;
    if (!message) {
      el.text("");
      el.hide();
      return;
    }
    el.text(message);
    el.show();
  }
  function active_game_input() {
    const el = $("#windowport textarea:not([disabled]), #windowport input[type=text]:not([disabled])").first();
    return el.length ? el[0] : null;
  }
  function focus_game_input() {
    const el = active_game_input();
    if (el) el.focus();
  }
  $(document).ready(() => {
    glkote = new WebGlkOte();
    open_websocket();
    try {
      const stored = window.localStorage.getItem(SLASH_CHAT_KEY);
      if (stored === "0") slash_chat_enabled = false;
    } catch (ex) {
    }
    $("#slash-chat-toggle").prop("checked", slash_chat_enabled);
    $("#slash-chat-toggle").on("change", function() {
      slash_chat_enabled = this.checked;
      try {
        window.localStorage.setItem(SLASH_CHAT_KEY, slash_chat_enabled ? "1" : "0");
      } catch (ex) {
      }
    });
    let large_status = false;
    try {
      large_status = window.localStorage.getItem(LARGE_STATUS_KEY) === "1";
    } catch (ex) {
    }
    document.body.classList.toggle("large-status", large_status);
    $("#large-status-toggle").prop("checked", large_status);
    $("#large-status-toggle").on("change", function() {
      const checked = this.checked;
      document.body.classList.toggle("large-status", checked);
      try {
        window.localStorage.setItem(LARGE_STATUS_KEY, checked ? "1" : "0");
      } catch (ex) {
      }
      apply_font_scale(current_font_scale());
    });
    let initial_scale = 1;
    try {
      const stored_scale = parseFloat(window.localStorage.getItem(FONT_SCALE_KEY) || "");
      if (!isNaN(stored_scale)) initial_scale = stored_scale;
    } catch (ex) {
    }
    apply_font_scale(initial_scale);
    $("#font-size-down").on("click", () => apply_font_scale(current_font_scale() - FONT_SCALE_STEP));
    $("#font-size-up").on("click", () => apply_font_scale(current_font_scale() + FONT_SCALE_STEP));
    $("#font-size-reset").on("click", () => apply_font_scale(1));
    $("#download-commands").on("click", download_commands);
    $("#download-chat").on("click", download_chat);
    $("#sidebar-toggle").on("click", () => {
      const open = document.body.classList.toggle("sidebar-open");
      const btn = document.getElementById("sidebar-toggle");
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "Hide sidebar" : "Show sidebar");
      btn.textContent = open ? "\u2715" : "\u2630";
    });
    $("#chat-input").on("keydown", function(ev) {
      if (ev.key === "Enter" && !ev.shiftKey) {
        ev.preventDefault();
        send_chat();
      } else if (ev.key === "Escape") {
        focus_game_input();
      } else if (ev.key !== "Backspace" && ev.key !== "Delete") {
        send_typing("chat");
      }
    });
    document.addEventListener(
      "keydown",
      (ev) => {
        const target = ev.target;
        const windowport = document.getElementById("windowport");
        if (!target || !windowport || !windowport.contains(target)) return;
        const tag = target.tagName;
        const is_text = tag === "INPUT" && target.type === "text" || tag === "TEXTAREA";
        if (!is_text) return;
        const value = target.value || "";
        if (slash_chat_enabled && ev.key === "/" && value === "") {
          ev.preventDefault();
          ev.stopPropagation();
          document.getElementById("chat-input")?.focus();
        } else if (ev.key !== "Enter" && ev.key !== "Backspace" && ev.key !== "Delete") {
          send_typing("command");
        }
      },
      /* useCapture = */
      true
    );
    void focus_game_input;
    document.addEventListener(
      "keydown",
      (ev) => {
        if (ev.key !== "Tab" || ev.altKey || ev.ctrlKey || ev.metaKey) return;
        const chat = document.getElementById("chat-input");
        const game = active_game_input();
        if (!chat || !game) return;
        const active = document.activeElement;
        if (active === chat) {
          ev.preventDefault();
          ev.stopPropagation();
          game.focus();
        } else if (active === game) {
          ev.preventDefault();
          ev.stopPropagation();
          chat.focus();
        }
      },
      /* useCapture = */
      true
    );
  });
})();
/*! Bundled license information:

lodash-es/lodash.js:
  (**
   * @license
   * Lodash (Custom Build) <https://lodash.com/>
   * Build: `lodash modularize exports="es" --repo lodash/lodash#4.18.1 -o ./`
   * Copyright OpenJS Foundation and other contributors <https://openjsf.org/>
   * Released under MIT license <https://lodash.com/license>
   * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
   * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
   *)
*/
