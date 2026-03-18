/**
 * Preview Runtime — shadcn/ui mocks, icon fallbacks, and React bootstrap for
 * rendering AI-generated code in a sandboxed iframe.
 *
 * This file is loaded as a static script in the preview iframe instead of being
 * inlined on every render, saving ~12KB of repeated HTML per preview.
 */
(function() {
  // Global error handler
  window.onerror = function(message, source, lineno, colno, error) {
    console.error("Runtime error:", message, error);
    var rootEl = document.getElementById('root');
    if (rootEl && rootEl.innerHTML === '') {
      rootEl.innerHTML = '<div class="error-container"><b>Runtime Error:</b><br/>' + String(message) + (lineno ? ' (line ' + lineno + ')' : '') + '</div>';
    }
    try { window.parent.postMessage({ type: 'preview-error', message: String(message) }, '*'); } catch(e) {}
  };
  window.addEventListener('unhandledrejection', function(e) {
    var msg = e.reason ? (e.reason.message || String(e.reason)) : 'Unhandled promise rejection';
    var rootEl = document.getElementById('root');
    if (rootEl && rootEl.innerHTML === '') {
      rootEl.innerHTML = '<div class="error-container"><b>Async Error:</b><br/>' + msg + '</div>';
    }
    try { window.parent.postMessage({ type: 'preview-error', message: msg }, '*'); } catch(e) {}
  });

  // Convert PascalCase to kebab-case for Phosphor CSS class lookup
  function toKebab(name) {
    return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z])([A-Z][a-z])/g, '$1-$2').toLowerCase();
  }

  // Map common Lucide-style names to Phosphor equivalents
  var phosphorAliases = {
    'arrow-right': 'arrow-right', 'arrow-left': 'arrow-left', 'arrow-up': 'arrow-up', 'arrow-down': 'arrow-down',
    'chevron-right': 'caret-right', 'chevron-left': 'caret-left', 'chevron-down': 'caret-down', 'chevron-up': 'caret-up',
    'check': 'check', 'x': 'x', 'plus': 'plus', 'minus': 'minus', 'search': 'magnifying-glass', 'menu': 'list',
    'send': 'paper-plane-tilt', 'download': 'download-simple', 'upload': 'upload-simple', 'share2': 'share-network',
    'copy': 'copy', 'pencil': 'pencil-simple', 'trash2': 'trash', 'external-link': 'arrow-square-out',
    'star': 'star', 'heart': 'heart', 'bookmark': 'bookmark-simple', 'bell': 'bell', 'settings': 'gear',
    'info': 'info', 'alert-circle': 'warning-circle', 'help-circle': 'question', 'eye': 'eye', 'eye-off': 'eye-slash',
    'lock': 'lock', 'unlock': 'lock-open', 'play': 'play', 'pause': 'pause', 'volume2': 'speaker-high',
    'camera': 'camera', 'mic': 'microphone', 'phone': 'phone', 'mail': 'envelope', 'map-pin': 'map-pin',
    'clock': 'clock', 'calendar': 'calendar-blank', 'globe': 'globe', 'users': 'users-three', 'user': 'user',
    'building2': 'buildings', 'briefcase': 'briefcase', 'zap': 'lightning', 'shield': 'shield-check',
    'award': 'trophy', 'trending-up': 'trend-up', 'check-circle': 'check-circle',
    'utensils-crossed': 'fork-knife', 'utensils': 'fork-knife', 'wine': 'wine',
    'scissors': 'scissors', 'sparkles': 'sparkle', 'flame': 'fire',
    'coffee': 'coffee', 'music': 'music-notes', 'gift': 'gift', 'home': 'house',
    'shopping-cart': 'shopping-cart', 'credit-card': 'credit-card', 'truck': 'truck',
    'wifi': 'wifi-high', 'cloud': 'cloud', 'sun': 'sun', 'moon': 'moon',
    'droplet': 'drop', 'leaf': 'leaf', 'flower': 'flower-lotus',
    'dumbbell': 'barbell', 'activity': 'heartbeat', 'stethoscope': 'stethoscope',
    'graduation-cap': 'graduation-cap', 'book': 'book-open', 'palette': 'palette',
    'car': 'car', 'wrench': 'wrench', 'hammer': 'hammer',
  };

  // Fallback icon factory — uses Phosphor web font via CSS class
  function makeIcon(name) {
    return function IconComponent(props) {
      props = props || {};
      var cn = props.className || '';
      var color = props.color || 'currentColor';
      var isFilled = cn.indexOf('fill-current') !== -1 || cn.indexOf('fill-') !== -1;
      var kebab = toKebab(name);
      var phosphorName = phosphorAliases[kebab] || kebab;
      var iconClass = isFilled ? ('ph-fill ph-' + phosphorName) : ('ph ph-' + phosphorName);
      var sizeMatch = cn.match(/h-(\d+)/);
      var fontSize = sizeMatch ? (parseInt(sizeMatch[1]) * 4) : (props.size || 20);
      return React.createElement('i', {
        className: iconClass + ' ' + cn,
        style: { fontSize: fontSize + 'px', lineHeight: '1', color: color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
        'aria-hidden': 'true'
      });
    };
  }

  // JS/browser globals that must NEVER be overwritten
  var reserved = [
    'Map','Set','WeakMap','WeakSet','Object','Array','Function','Symbol',
    'Number','String','Boolean','Date','Error','Promise','Proxy','Reflect',
    'Image','File','Blob','URL','URLSearchParams','FormData',
    'Navigator','Screen','Window','Document','Node','Event',
    'Location','History','Storage','Math','JSON','RegExp',
    'Infinity','NaN','undefined','null','true','false',
    'console','alert','confirm','prompt','setTimeout','setInterval',
    'clearTimeout','clearInterval','fetch','XMLHttpRequest',
    'React','ReactDOM','Babel','LucideReact'
  ];

  // ── shadcn/ui mocks ──

  window.Button = function(props) {
    var children = props.children;
    var className = props.className || '';
    var variant = props.variant || 'default';
    var size = props.size || 'default';
    var base = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:opacity-50 cursor-pointer';
    var v = {
      default: 'bg-zinc-900 text-white hover:bg-zinc-800',
      outline: 'border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100',
      secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200',
      ghost: 'hover:bg-zinc-100 text-zinc-900',
      link: 'text-zinc-900 underline-offset-4 hover:underline',
      destructive: 'bg-red-500 text-white hover:bg-red-600'
    };
    var s = { default: 'h-10 px-4 py-2 text-sm', sm: 'h-9 px-3 text-xs', lg: 'h-11 px-8 text-base', icon: 'h-10 w-10' };
    var variantClasses = (v[variant] || v.default);
    if (className) {
      var hasBg = className.indexOf('bg-') !== -1;
      var hasText = (className.match(/text-(white|black|zinc|slate|gray|neutral|red|orange|amber|yellow|green|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|emerald|lime|stone|current|transparent|inherit)/) || className.indexOf('text-[') !== -1);
      var hasBorder = (className.indexOf('border-2') !== -1 || className.indexOf('border-[') !== -1 || className.indexOf('border-white') !== -1);
      if (hasBg) variantClasses = variantClasses.split(' ').filter(function(c) { return c.indexOf('bg-') !== 0 && c.indexOf('hover:bg-') !== 0; }).join(' ');
      if (hasText) variantClasses = variantClasses.split(' ').filter(function(c) { return c.indexOf('text-') !== 0; }).join(' ');
      if (hasBorder) variantClasses = variantClasses.split(' ').filter(function(c) { return c !== 'border' && c.indexOf('border-') !== 0; }).join(' ');
    }
    var newProps = {};
    for (var k in props) {
      if (k !== 'children' && k !== 'variant' && k !== 'size' && k !== 'className' && k !== 'asChild') newProps[k] = props[k];
    }
    newProps.className = base + ' ' + variantClasses + ' ' + (s[size] || s.default) + ' ' + className;
    return React.createElement('button', newProps, children);
  };

  window.Card = function(p) { return React.createElement('div', { className: 'rounded-lg border bg-white shadow-sm ' + (p.className||'') }, p.children); };
  window.CardHeader = function(p) { return React.createElement('div', { className: 'flex flex-col space-y-1.5 p-6 ' + (p.className||'') }, p.children); };
  window.CardTitle = function(p) { return React.createElement('h3', { className: 'text-2xl font-semibold leading-none tracking-tight ' + (p.className||'') }, p.children); };
  window.CardDescription = function(p) { return React.createElement('p', { className: 'text-sm text-zinc-500 ' + (p.className||'') }, p.children); };
  window.CardContent = function(p) { return React.createElement('div', { className: 'p-6 pt-0 ' + (p.className||'') }, p.children); };
  window.CardFooter = function(p) { return React.createElement('div', { className: 'flex items-center p-6 pt-0 ' + (p.className||'') }, p.children); };

  window.Badge = function(p) {
    var v = { default: 'bg-zinc-900 text-white', secondary: 'bg-zinc-100 text-zinc-900', outline: 'border border-zinc-200 text-zinc-800', destructive: 'bg-red-500 text-white' };
    return React.createElement('div', { className: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ' + (v[p.variant] || v.default) + ' ' + (p.className||'') }, p.children);
  };

  window.Input = function(p) {
    var newProps = {};
    for (var k in p) { if (k !== 'className') newProps[k] = p[k]; }
    newProps.className = 'flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-50 ' + (p.className||'');
    return React.createElement('input', newProps);
  };
  window.Textarea = function(p) {
    var newProps = {};
    for (var k in p) { if (k !== 'className') newProps[k] = p[k]; }
    newProps.className = 'flex min-h-[80px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 ' + (p.className||'');
    return React.createElement('textarea', newProps);
  };

  window.Select = function(p) { return React.createElement('div', { className: p.className || '' }, p.children); };
  window.SelectTrigger = function(p) { return React.createElement('button', { className: 'flex h-10 w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ' + (p.className||'') }, p.children); };
  window.SelectValue = function(p) { return React.createElement('span', { className: 'text-sm text-zinc-500' }, p.placeholder || ''); };
  window.SelectContent = function() { return React.createElement('div', { className: 'hidden' }); };
  window.SelectItem = function() { return React.createElement('div', { className: 'hidden' }); };

  window.Separator = function(p) {
    var o = p.orientation || 'horizontal';
    return React.createElement('div', { role: 'separator', className: 'shrink-0 bg-zinc-200 ' + (o === 'horizontal' ? 'h-[1px] w-full my-2' : 'h-full w-[1px] mx-2') + ' ' + (p.className||'') });
  };

  window.Tabs = function(p) {
    var _ts = React.useState(p.defaultValue || '');
    var active = _ts[0]; var setActive = _ts[1];
    return React.createElement('div', { className: p.className || '' },
      React.Children.map(p.children, function(child) {
        if (!child) return null;
        return React.cloneElement(child, { _activeTab: active, _setActiveTab: setActive });
      })
    );
  };
  window.TabsList = function(p) { return React.createElement('div', { role: 'tablist', className: 'inline-flex h-10 items-center justify-center rounded-md bg-zinc-100 p-1 ' + (p.className||'') }, p.children); };
  window.TabsTrigger = function(p) {
    var isActive = p._activeTab === p.value;
    return React.createElement('button', {
      role: 'tab', 'aria-selected': isActive,
      onClick: function() { if (p._setActiveTab) p._setActiveTab(p.value); },
      className: 'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ' + (isActive ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700') + ' ' + (p.className||'')
    }, p.children);
  };
  window.TabsContent = function(p) {
    if (p._activeTab !== undefined && p._activeTab !== p.value) return null;
    return React.createElement('div', { role: 'tabpanel', className: 'mt-2 ' + (p.className||'') }, p.children);
  };

  window.Avatar = function(p) { return React.createElement('span', { className: 'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ' + (p.className||'') }, p.children); };
  window.AvatarImage = function(p) { return React.createElement('img', { src: p.src, alt: p.alt || '', className: 'aspect-square h-full w-full object-cover ' + (p.className||'') }); };
  window.AvatarFallback = function(p) { return React.createElement('span', { className: 'flex h-full w-full items-center justify-center rounded-full bg-zinc-100 text-zinc-600 text-sm font-medium ' + (p.className||'') }, p.children); };

  window.Label = function(p) {
    var newProps = {};
    for (var k in p) { if (k !== 'className') newProps[k] = p[k]; }
    newProps.className = 'text-sm font-medium leading-none ' + (p.className||'');
    return React.createElement('label', newProps, p.children);
  };

  window.Progress = function(p) {
    return React.createElement('div', { className: 'relative h-2 w-full overflow-hidden rounded-full bg-zinc-100 ' + (p.className||'') },
      React.createElement('div', { className: 'h-full bg-zinc-900 transition-all', style: { width: (p.value || 0) + '%' } })
    );
  };

  window.Accordion = function(p) {
    var _as = React.useState(p.defaultValue || null);
    var openItem = _as[0]; var setOpenItem = _as[1];
    return React.createElement('div', { className: p.className || '' },
      React.Children.map(p.children, function(child) {
        if (!child) return null;
        return React.cloneElement(child, { _openItem: openItem, _setOpenItem: setOpenItem });
      })
    );
  };
  window.AccordionItem = function(p) {
    return React.createElement('div', { className: 'border-b ' + (p.className||'') },
      React.Children.map(p.children, function(child) {
        if (!child) return null;
        return React.cloneElement(child, { _value: p.value, _openItem: p._openItem, _setOpenItem: p._setOpenItem });
      })
    );
  };
  window.AccordionTrigger = function(p) {
    var isOpen = p._openItem === p._value;
    return React.createElement('button', {
      className: 'flex w-full items-center justify-between py-4 font-medium text-left transition-all hover:underline ' + (p.className||''),
      onClick: function() { if (p._setOpenItem) p._setOpenItem(isOpen ? null : p._value); }
    },
      React.createElement('span', { className: 'flex-1 text-left' }, p.children),
      React.createElement('svg', {
        xmlns: 'http://www.w3.org/2000/svg', width: '16', height: '16', viewBox: '0 0 24 24',
        fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round',
        className: 'shrink-0 text-zinc-400 transition-transform duration-200' + (isOpen ? ' rotate-180' : ''),
      }, React.createElement('polyline', { points: '6 9 12 15 18 9' }))
    );
  };
  window.AccordionContent = function(p) {
    var isOpen = p._openItem === p._value;
    if (!isOpen) return null;
    return React.createElement('div', { className: 'pb-4 pt-0 text-sm text-zinc-600 animate-in slide-in-from-top-1 ' + (p.className||'') }, p.children);
  };

  window.Dialog = function(p) {
    if (p.open === false || p.open === undefined || p.open === null) return null;
    var handleBackdropClick = function(e) { if (e.target === e.currentTarget && p.onOpenChange) p.onOpenChange(false); };
    return React.createElement('div', {
      className: 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm',
      onClick: handleBackdropClick, style: { animation: 'fadeIn 150ms ease-out' }
    }, p.children);
  };
  window.DialogContent = function(p) {
    return React.createElement('div', {
      className: 'bg-white rounded-xl p-6 shadow-2xl max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto relative ' + (p.className||''),
      style: { animation: 'scaleIn 150ms ease-out' },
      onClick: function(e) { e.stopPropagation(); }
    }, p.children);
  };
  window.DialogHeader = function(p) { return React.createElement('div', { className: 'flex flex-col space-y-1.5 mb-4 ' + (p.className||'') }, p.children); };
  window.DialogTitle = function(p) { return React.createElement('h2', { className: 'text-lg font-semibold tracking-tight ' + (p.className||'') }, p.children); };
  window.DialogDescription = function(p) { return React.createElement('p', { className: 'text-sm text-zinc-500 ' + (p.className||'') }, p.children); };
  window.DialogFooter = function(p) { return React.createElement('div', { className: 'flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-100 ' + (p.className||'') }, p.children); };
  window.DialogTrigger = function(p) { return React.createElement('span', { onClick: p.onClick, className: 'cursor-pointer' }, p.children); };

  window.Sheet = function(p) {
    if (p.open === false || p.open === undefined || p.open === null) return null;
    var handleBackdrop = function(e) { if (e.target === e.currentTarget && p.onOpenChange) p.onOpenChange(false); };
    return React.createElement('div', { className: 'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm', onClick: handleBackdrop }, p.children);
  };
  window.SheetContent = function(p) {
    return React.createElement('div', {
      className: 'fixed right-0 top-0 h-full w-80 bg-white shadow-2xl p-6 z-50 overflow-y-auto ' + (p.className||''),
      onClick: function(e) { e.stopPropagation(); }
    }, p.children);
  };
  window.SheetHeader = window.DialogHeader;
  window.SheetTitle = window.DialogTitle;
  window.SheetDescription = window.DialogDescription;
  window.SheetFooter = window.DialogFooter;
  window.SheetTrigger = window.DialogTrigger;

  window.Tooltip = function(p) { return React.createElement('span', null, p.children); };
  window.TooltipTrigger = function(p) { return React.createElement('span', { className: p.asChild ? '' : 'cursor-default' }, p.children); };
  window.TooltipContent = function() { return null; };
  window.TooltipProvider = function(p) { return React.createElement('span', null, p.children); };

  window.DropdownMenu = function(p) { return React.createElement('div', { className: 'relative inline-block ' + (p.className||'') }, p.children); };
  window.DropdownMenuTrigger = function(p) { return React.createElement('span', null, p.children); };
  window.DropdownMenuContent = function() { return null; };
  window.DropdownMenuItem = function() { return null; };
  window.DropdownMenuLabel = function() { return null; };
  window.DropdownMenuSeparator = function() { return null; };

  window.ScrollArea = function(p) { return React.createElement('div', { className: 'overflow-auto ' + (p.className||'') }, p.children); };
  window.ScrollBar = function() { return null; };

  window.cn = function() { return Array.prototype.slice.call(arguments).filter(Boolean).join(' '); };

  // ── Bootstrap ──

  window.__previewRuntime = {
    makeIcon: makeIcon,
    reserved: reserved,

    boot: function() {
      if (typeof Babel === 'undefined' || typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
        setTimeout(window.__previewRuntime.boot, 50);
        return;
      }

      // Expose React hooks globally
      window.useState = React.useState;
      window.useEffect = React.useEffect;
      window.useRef = React.useRef;
      window.useCallback = React.useCallback;
      window.useMemo = React.useMemo;
      window.useReducer = React.useReducer;
      window.useContext = React.useContext;
      window.useLayoutEffect = React.useLayoutEffect;
      window.createContext = React.createContext;
      window.forwardRef = React.forwardRef;
      window.Fragment = React.Fragment;
      // React 19 hooks
      if (React.useActionState) window.useActionState = React.useActionState;
      if (React.useOptimistic) window.useOptimistic = React.useOptimistic;

      // Safety-restore native built-ins
      window.Map = Map; window.Set = Set; window.WeakMap = WeakMap;
      window.WeakSet = WeakSet; window.Array = Array; window.Promise = Promise;

      try {
        var codeDataEl = document.getElementById('user-code-data');
        var userCode = JSON.parse(codeDataEl.textContent);

        // Scan for uppercase identifiers → populate window globals
        var identPattern = /[<{\\s,(]([A-Z][a-zA-Z0-9]*)/g;
        var match; var seen = {};
        while ((match = identPattern.exec(userCode)) !== null) {
          var name = match[1];
          if (!name || seen[name]) continue;
          seen[name] = true;
          if (reserved.indexOf(name) !== -1) continue;
          if (typeof window[name] !== 'undefined') continue;
          var lucideIcon = (typeof window.LucideReact !== 'undefined') ? window.LucideReact[name] : undefined;
          if (lucideIcon) { window[name] = lucideIcon; }
          else { window[name] = makeIcon(name); }
        }

        // Re-restore built-ins after the scan
        window.Map = Map; window.Set = Set; window.WeakMap = WeakMap;

        var mountCode = ';(function mount(){' +
          'var target = typeof GeneratedPage !== "undefined" ? GeneratedPage' +
          '  : (typeof App !== "undefined" ? App : null);' +
          'if (target) {' +
          '  ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(target));' +
          '} else {' +
          '  document.getElementById("root").innerHTML = "<div class=\\"error-container\\"><b>Error:</b> No GeneratedPage component found in generated code.</div>";' +
          '}' +
          '})();';

        var fullCode = userCode + mountCode;

        var result = Babel.transform(fullCode, {
          presets: [
            ['env', { targets: { esmodules: true }, modules: false, bugfixes: true }],
            ['react', { runtime: 'classic' }],
            ['typescript', { isTSX: true, allExtensions: true }]
          ],
          filename: 'generated.tsx',
          configFile: false,
          babelrc: false
        });

        var fn = new Function(result.code);
        fn();
      } catch (err) {
        console.error('Preview build error:', err);
        var msg = err.message || String(err);
        document.getElementById('root').innerHTML =
          '<div class="error-container"><b>Build Error:</b><br/>' + msg + '</div>';
        try { window.parent.postMessage({ type: 'preview-error', message: msg }, '*'); } catch(e2) {}
      }
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.__previewRuntime.boot);
  } else {
    window.__previewRuntime.boot();
  }
})();
