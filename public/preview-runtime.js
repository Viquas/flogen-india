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
    // Arrows & navigation
    'arrow-right': 'arrow-right', 'arrow-left': 'arrow-left', 'arrow-up': 'arrow-up', 'arrow-down': 'arrow-down',
    'chevron-right': 'caret-right', 'chevron-left': 'caret-left', 'chevron-down': 'caret-down', 'chevron-up': 'caret-up',
    // Actions
    'check': 'check', 'x': 'x', 'plus': 'plus', 'minus': 'minus', 'search': 'magnifying-glass', 'menu': 'list',
    'send': 'paper-plane-tilt', 'download': 'download-simple', 'upload': 'upload-simple', 'share2': 'share-network',
    'copy': 'copy', 'pencil': 'pencil-simple', 'trash2': 'trash', 'external-link': 'arrow-square-out',
    // UI
    'star': 'star', 'heart': 'heart', 'bookmark': 'bookmark-simple', 'bell': 'bell', 'settings': 'gear',
    'info': 'info', 'alert-circle': 'warning-circle', 'help-circle': 'question', 'eye': 'eye', 'eye-off': 'eye-slash',
    'lock': 'lock', 'unlock': 'lock-open', 'play': 'play', 'pause': 'pause', 'volume2': 'speaker-high',
    'camera': 'camera', 'mic': 'microphone', 'phone': 'phone', 'mail': 'envelope', 'map-pin': 'map-pin',
    'clock': 'clock', 'calendar': 'calendar-blank', 'globe': 'globe', 'users': 'users-three', 'user': 'user',
    'building2': 'buildings', 'briefcase': 'briefcase', 'zap': 'lightning', 'shield': 'shield-check',
    'award': 'trophy', 'trending-up': 'trend-up', 'check-circle': 'check-circle',
    // Food & dining
    'utensils-crossed': 'fork-knife', 'utensils': 'fork-knife', 'wine': 'wine',
    'beef': 'steak', 'cake-slice': 'cake', 'cookie': 'cookie', 'ice-cream-cone': 'ice-cream',
    // Beauty & salon
    'scissors': 'scissors', 'sparkles': 'sparkle', 'sparkle': 'sparkle', 'flame': 'fire',
    'brush': 'paint-brush', 'gem': 'diamond', 'crown': 'crown', 'bath': 'bathtub',
    'spray-can': 'spray-bottle', 'hand': 'hand', 'flower2': 'flower-lotus',
    // Nature & weather
    'coffee': 'coffee', 'music': 'music-notes', 'gift': 'gift', 'home': 'house',
    'shopping-cart': 'shopping-cart', 'credit-card': 'credit-card', 'truck': 'truck',
    'wifi': 'wifi-high', 'cloud': 'cloud', 'sun': 'sun', 'moon': 'moon',
    'droplet': 'drop', 'leaf': 'leaf', 'flower': 'flower-lotus', 'tree-pine': 'tree',
    'wind': 'wind',
    // Fitness & health
    'dumbbell': 'barbell', 'activity': 'heartbeat', 'stethoscope': 'stethoscope',
    'smile': 'smiley', 'circle-dot': 'circle',
    // Education
    'graduation-cap': 'graduation-cap', 'book': 'book-open', 'palette': 'palette', 'book-open': 'book-open-text',
    // Auto & construction
    'car': 'car', 'wrench': 'wrench', 'hammer': 'hammer', 'hard-hat': 'hard-hat', 'drill': 'wrench',
    // Legal & finance
    'scale': 'scales', 'gavel': 'gavel', 'file-check': 'file-text', 'shield-check': 'shield-check',
    'wallet': 'wallet', 'piggy-bank': 'piggy-bank', 'receipt': 'receipt', 'calculator': 'calculator',
    // Travel & navigation
    'plane': 'airplane', 'ship': 'boat', 'luggage': 'suitcase', 'map-pinned': 'map-pin',
    'compass': 'compass', 'navigation': 'navigation-arrow',
    // Photography & media
    'aperture': 'aperture', 'focus': 'crosshair', 'image-plus': 'image',
    'headphones': 'headphones', 'radio': 'radio', 'mic-vocal': 'microphone-stage',
    // Pets
    'paw-print': 'paw-print', 'dog': 'dog', 'cat': 'cat',
    // Social & communication
    'message-circle': 'chat-circle', 'thumbs-up': 'thumbs-up', 'quote': 'quotes',
    'facebook': 'facebook-logo', 'instagram': 'instagram-logo', 'twitter': 'twitter-logo',
    'linkedin': 'linkedin-logo', 'youtube': 'youtube-logo',
    // Data & charts
    'bar-chart': 'chart-bar', 'pie-chart': 'chart-pie', 'line-chart': 'chart-line',
    'dollar-sign': 'currency-dollar', 'percent': 'percent',
    // Misc
    'timer': 'timer', 'boxes': 'package', 'layers': 'stack', 'grid': 'grid-four',
    'target': 'target', 'flag': 'flag', 'tag': 'tag',
  };

  // Fallback icon factory — uses Phosphor web font via CSS class,
  // with a visible letter-circle fallback when Phosphor doesn't match
  function makeIcon(name) {
    return function IconComponent(props) {
      props = props || {};
      var cn = props.className || '';
      var color = props.color || 'currentColor';
      var isFilled = cn.indexOf('fill-current') !== -1 || cn.indexOf('fill-') !== -1;
      var kebab = toKebab(name);
      var phosphorName = phosphorAliases[kebab] || kebab;
      var hasAlias = !!phosphorAliases[kebab];
      var iconClass = isFilled ? ('ph-fill ph-' + phosphorName) : ('ph ph-' + phosphorName);
      var sizeMatch = cn.match(/h-(\d+)/);
      var fontSize = sizeMatch ? (parseInt(sizeMatch[1]) * 4) : (props.size || 20);

      // If we have a known Phosphor alias, use it. Otherwise render a visible placeholder.
      if (hasAlias) {
        return React.createElement('i', {
          className: iconClass + ' ' + cn,
          style: { fontSize: fontSize + 'px', lineHeight: '1', color: color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
          'aria-hidden': 'true'
        });
      }

      // Try the Phosphor class anyway (many kebab names work directly)
      // but also render the icon letter as invisible text fallback via :empty CSS
      return React.createElement('i', {
        className: iconClass + ' ' + cn,
        style: { fontSize: fontSize + 'px', lineHeight: '1', color: color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: fontSize + 'px', minHeight: fontSize + 'px' },
        'aria-hidden': 'true'
      });
    };
  }

  // Pre-register ALL commonly used icons so they're always available
  // (the regex scan can miss icons in certain code patterns)
  var commonIcons = [
    // Arrows & navigation
    'ArrowRight','ArrowLeft','ArrowUp','ArrowDown','ChevronRight','ChevronLeft','ChevronDown','ChevronUp',
    // Actions
    'Check','X','Plus','Minus','Search','Menu','Send','Download','Upload','Share2','Copy','Pencil','Trash2','ExternalLink',
    // UI essentials
    'Star','Heart','Bookmark','Bell','Settings','Info','AlertCircle','HelpCircle','Eye','EyeOff','Lock','Unlock',
    'Play','Pause','Volume2','Camera','Mic',
    // Business & contact
    'Phone','Mail','MapPin','Clock','Calendar','Globe','Users','User','Building2','Briefcase','Zap','Shield','Award','TrendingUp','CheckCircle',
    // Food & dining
    'Coffee','Wine','UtensilsCrossed','Utensils','Flame','Beef','CakeSlice','Cookie','IceCreamCone',
    // Beauty & salon
    'Scissors','Sparkles','Sparkle','Droplet','Flower','Brush','Gem','Crown','Bath','SprayCan','Hand','Flower2',
    // Nature & weather
    'Leaf','Sun','Moon','Cloud','Wind','TreePine',
    // Fitness & health
    'Dumbbell','Activity','Stethoscope','Smile','CircleDot',
    // Education
    'GraduationCap','Book','BookOpen','Palette',
    // Auto & construction
    'Car','Wrench','Hammer','HardHat','Drill',
    // Home & real estate
    'Home','Key','Ruler',
    // Shopping & commerce
    'ShoppingCart','CreditCard','Gift','Truck','Wifi','Music',
    // Legal & finance
    'Scale','Gavel','FileCheck','ShieldCheck','Wallet','PiggyBank','Receipt','Calculator',
    // Travel
    'Plane','Ship','Luggage',
    // Photography & media
    'Aperture','Focus','ImagePlus','Headphones','Radio','MicVocal',
    // Pets
    'PawPrint','Dog','Cat',
    // Social & communication
    'Link2','Quote','MessageCircle','ThumbsUp','Facebook','Instagram','Twitter','Linkedin','Youtube',
    // UI controls
    'CircleCheck','CircleX','Loader2','MoreHorizontal','MoreVertical','Filter','SortAsc','SortDesc',
    // Files & documents
    'Image','Video','FileText','Folder','Archive','Printer','Save','RefreshCw','RotateCcw',
    // Layout
    'Maximize2','Minimize2','Move','Crosshair','Target','Flag','Tag','Layers','Grid','List',
    // Data & charts
    'BarChart','PieChart','LineChart','DollarSign','Percent','Hash','AtSign','Terminal','Code',
    // Maps
    'MapPinned','Navigation','Compass','Map',
    // Generic / misc
    'Timer','Boxes','SquareStack','CircleDashed','Sparkle'
  ];
  commonIcons.forEach(function(name) {
    if (typeof window[name] === 'undefined') {
      window[name] = makeIcon(name);
    }
  });

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

  window.Card = function(p) { var c = p.className||''; var hasBg = /bg-/.test(c); return React.createElement('div', { className: 'rounded-lg border shadow-sm ' + (hasBg ? '' : 'bg-white ') + c }, p.children); };
  window.CardHeader = function(p) { return React.createElement('div', { className: 'flex flex-col space-y-1.5 p-6 ' + (p.className||'') }, p.children); };
  window.CardTitle = function(p) { var c = p.className||''; var hasColor = /text-/.test(c); return React.createElement('h3', { className: 'text-2xl font-semibold leading-none tracking-tight ' + c }, p.children); };
  window.CardDescription = function(p) { var c = p.className||''; var hasColor = /text-/.test(c); return React.createElement('p', { className: 'text-sm ' + (hasColor ? '' : 'text-zinc-500 ') + c }, p.children); };
  window.CardContent = function(p) { return React.createElement('div', { className: 'p-6 pt-0 ' + (p.className||'') }, p.children); };
  window.CardFooter = function(p) { return React.createElement('div', { className: 'flex items-center p-6 pt-0 ' + (p.className||'') }, p.children); };

  window.Badge = function(p) {
    var c = p.className||'';
    var hasBg = /bg-/.test(c); var hasText = /text-/.test(c); var hasBorder = /border-/.test(c);
    var v = { default: [(hasBg?'':'bg-zinc-900'), (hasText?'':'text-white')].join(' '), secondary: [(hasBg?'':'bg-zinc-100'), (hasText?'':'text-zinc-900')].join(' '), outline: [(hasBorder?'':'border border-zinc-200'), (hasText?'':'text-zinc-800')].join(' '), destructive: [(hasBg?'':'bg-red-500'), (hasText?'':'text-white')].join(' ') };
    return React.createElement('div', { className: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ' + (v[p.variant] || v.default) + ' ' + c }, p.children);
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

  // ImageWithFallback: a resilient <img> the generator commonly emits. Without this
  // shim the transpiled code throws "ImageWithFallback is not defined" and the whole
  // preview iframe renders blank. Renders the image and swaps to a placeholder on error.
  window.ImageWithFallback = function(p) {
    var fallback = p.fallbackSrc || p.fallback || 'https://placehold.co/800x600/e4e4e7/71717a?text=Image';
    return React.createElement('img', {
      src: p.src || fallback,
      alt: p.alt || '',
      className: p.className || '',
      style: p.style,
      loading: p.loading || 'lazy',
      onError: function(e) { if (e && e.target && e.target.src !== fallback) { e.target.src = fallback; } }
    });
  };

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

  // =========================================================================
  // PREMIUM SCROLL ANIMATION SYSTEM
  // Auto-animates sections and their children with staggered fade+slide reveals.
  // No per-site code needed — works globally on all generated pages.
  // =========================================================================
  function initScrollAnimations() {
    var root = document.getElementById('root');
    if (!root) return;

    // Inject animation styles
    var style = document.createElement('style');
    style.textContent = [
      // Base hidden state for animatable elements
      '.sa-hidden { opacity: 0; transform: translateY(24px); }',
      // Revealed state
      '.sa-visible { opacity: 1; transform: translateY(0); transition: opacity 0.8s cubic-bezier(0.165, 0.84, 0.44, 1), transform 0.8s cubic-bezier(0.165, 0.84, 0.44, 1); }',
      // Stagger delays for children (up to 8)
      '.sa-delay-1 { transition-delay: 0.08s; }',
      '.sa-delay-2 { transition-delay: 0.16s; }',
      '.sa-delay-3 { transition-delay: 0.24s; }',
      '.sa-delay-4 { transition-delay: 0.32s; }',
      '.sa-delay-5 { transition-delay: 0.40s; }',
      '.sa-delay-6 { transition-delay: 0.48s; }',
      '.sa-delay-7 { transition-delay: 0.56s; }',
      '.sa-delay-8 { transition-delay: 0.64s; }',
      // Smooth nav transition on scroll
      '.nav-scrolled { box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04); }',
    ].join('\n');
    document.head.appendChild(style);

    // Wait for React to finish rendering
    requestAnimationFrame(function() {
      setTimeout(function() {
        var sections = root.querySelectorAll('section');
        if (sections.length === 0) return;

        // Mark direct children of each section for animation
        sections.forEach(function(section, sIdx) {
          // Skip the first section (hero) — it should be visible immediately
          if (sIdx === 0) return;

          // Find animatable children: direct divs, cards, headings, paragraphs, grid items
          var children = section.querySelectorAll(':scope > div, :scope > h1, :scope > h2, :scope > h3, :scope > p, :scope > a');
          // Also get children of the first container div (common pattern: section > div.max-w > children)
          var container = section.querySelector(':scope > div');
          if (container) {
            var innerChildren = container.querySelectorAll(':scope > div, :scope > h1, :scope > h2, :scope > h3, :scope > p, :scope > a, :scope > ul, :scope > form');
            if (innerChildren.length > children.length) {
              children = innerChildren;
            }
          }

          children.forEach(function(child, cIdx) {
            if (cIdx > 8) return; // Cap stagger at 8 children
            child.classList.add('sa-hidden');
            child.classList.add('sa-delay-' + Math.min(cIdx + 1, 8));
          });
        });

        // Intersection Observer for revealing
        if ('IntersectionObserver' in window) {
          var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
              if (entry.isIntersecting) {
                entry.target.classList.remove('sa-hidden');
                entry.target.classList.add('sa-visible');
                observer.unobserve(entry.target);
              }
            });
          }, {
            threshold: 0.15,
            rootMargin: '0px 0px -60px 0px'
          });

          root.querySelectorAll('.sa-hidden').forEach(function(el) {
            observer.observe(el);
          });
        }

        // Nav scroll shadow effect
        var nav = root.querySelector('nav');
        if (nav) {
          var lastScroll = 0;
          (nav.closest('[style*="overflow"]') || window).addEventListener('scroll', function() {
            var scrollY = window.scrollY || document.documentElement.scrollTop;
            if (scrollY > 20) {
              nav.classList.add('nav-scrolled');
            } else {
              nav.classList.remove('nav-scrolled');
            }
            lastScroll = scrollY;
          }, { passive: true });
        }
      }, 100); // Small delay to let React fully mount
    });
  }

  // Hook into the boot process — run animations after React renders
  var originalBoot = window.__previewRuntime.boot;
  window.__previewRuntime.boot = function() {
    originalBoot();
    // Run animations after a short delay to let React render
    setTimeout(initScrollAnimations, 500);
  };
})();
