/**
 * Utility to wrap generated React component code into a full, self-contained HTML document
 * with Tailwind CSS, React, and Babel standalone for runtime transpilation.
 */

export function preprocessCode(code: string): string {
  // 1. Remove all import statements (including multi-line ones and namespace imports)
  let processed = code.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*/gm, '')
  processed = processed.replace(/import\s+['"][^'"]+['"];?\s*/gm, '')

  // 2. Handle default export to ensure we have a 'GeneratedPage' component to mount
  const defaultFnMatch = processed.match(/export\s+default\s+function\s+([a-zA-Z0-9_$]+)/);
  const defaultAnonMatch = processed.match(/export\s+default\s+function\s*\(/);
  const defaultArrowMatch = processed.match(/export\s+default\s+([a-zA-Z0-9_$]+)/);

  if (defaultFnMatch) {
    const fnName = defaultFnMatch[1];
    processed = processed.replace(/export\s+default\s+function\s+[a-zA-Z0-9_$]+/g, `function ${fnName}`);
    if (fnName !== 'GeneratedPage') {
      processed += `\nvar GeneratedPage = ${fnName};`;
    }
  } else if (defaultAnonMatch) {
    processed = processed.replace(/export\s+default\s+function\s*\(/, 'function GeneratedPage(');
  } else if (defaultArrowMatch) {
    const varName = defaultArrowMatch[1];
    if (varName !== 'GeneratedPage') {
      processed = processed.replace(/export\s+default\s+[a-zA-Z0-9_$]+/g, '');
      processed += `\nvar GeneratedPage = ${varName};`;
    } else {
      processed = processed.replace(/export\s+default\s+[a-zA-Z0-9_$]+/g, '');
    }
  } else {
    processed = processed.replace(/export\s+default\s+/g, 'var GeneratedPage = ');
  }

  // 3. Remove other export keywords
  processed = processed.replace(/export\s+(function|const|class|let|var)\s+/g, '$1 ')
  processed = processed.replace(/export\s+{[^}]*};?\s*/gm, '')

  return processed.trim()
}

export function constructHtmlBoilerplate(code: string): string {
  const processedCode = preprocessCode(code)
  // Use JSON.stringify to safely escape all special characters
  const safeCodeJson = JSON.stringify(processedCode)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <style>
    body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: #fff; }
    #root { min-height: 100vh; }
    .error-container { 
      padding: 20px; 
      background: #fef2f2; 
      color: #dc2626; 
      font-family: monospace;
      white-space: pre-wrap;
      border: 1px solid #fee2e2;
      margin: 20px;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script id="user-code-data" type="application/json">${safeCodeJson}<\/script>
  <script>
    (function() {
      // Global error handler
      window.onerror = function(message, source, lineno, colno, error) {
        console.error("Runtime error:", message, error);
        var rootEl = document.getElementById('root');
        if (rootEl && rootEl.innerHTML === '') {
          rootEl.innerHTML = '<div class="error-container"><b>Runtime Error:</b><br/>' + String(message) + '</div>';
        }
      };

      // Simple icon factory - creates a placeholder icon component
      function makeIcon(name) {
        return function IconComponent(props) {
          props = props || {};
          var cn = 'w-5 h-5';
          if (props.className) cn = cn + ' ' + props.className;
          return React.createElement('svg', {
            className: cn,
            fill: 'none',
            stroke: 'currentColor',
            viewBox: '0 0 24 24',
            strokeWidth: '2',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            'aria-label': name
          }, 
            React.createElement('circle', { cx: '12', cy: '12', r: '10' }),
            React.createElement('text', { x: '12', y: '16', textAnchor: 'middle', fontSize: '10', fill: 'currentColor' }, name.charAt(0))
          );
        };
      }

      // Define all common icons that AI might use (comprehensive list with variants)
      // IMPORTANT: Exclude JS reserved globals (Map, Set, Object, Array, etc.)
      var iconList = [
        // Communication
        'Mail','Phone','MapPin','Globe','MessageCircle','MessageSquare','Send','Bell','AtSign','Inbox','Forward','Reply','ReplyAll',
        // Navigation & UI
        'Menu','X','ChevronRight','ChevronLeft','ChevronDown','ChevronUp','ChevronsRight','ChevronsLeft','ChevronsDown','ChevronsUp',
        'ArrowRight','ArrowLeft','ArrowUp','ArrowDown','ArrowUpRight','ArrowDownRight','ArrowUpLeft','ArrowDownLeft',
        'Home','Search','Filter','SortAsc','SortDesc','MoreHorizontal','MoreVertical','ExternalLink','Link','Link2',
        // Actions
        'Check','Plus','Minus','Edit','Edit2','Edit3','Trash','Trash2','Copy','Clipboard','ClipboardCopy','ClipboardPaste',
        'Download','Upload','Share','Share2','Save','Undo','Redo','RefreshCw','RefreshCcw','RotateCw','RotateCcw',
        'Move','MoveHorizontal','MoveVertical','Maximize','Maximize2','Minimize','Minimize2',
        // Status & Indicators
        'CheckCircle','CheckCircle2','CheckSquare','XCircle','XSquare','AlertCircle','AlertOctagon','AlertTriangle',
        'Info','HelpCircle','Clock','Clock1','Clock2','Clock3','Clock4','Clock5','Clock6','Clock7','Clock8','Clock9','Clock10','Clock11','Clock12',
        'Timer','TimerOff','TimerReset','Hourglass','Loader','Loader2',
        // Users & Social
        'User','Users','UserPlus','UserMinus','UserCheck','UserX','UserCircle','UserCircle2','Contact','Contact2',
        'Heart','HeartHandshake','ThumbsUp','ThumbsDown','Smile','Frown','Meh',
        // Stars & Ratings
        'Star','StarHalf','StarOff','Stars',
        // Media
        'ImageIcon','ImagePlus','ImageMinus','ImageOff','Video','VideoOff','Music','Music2','Music3','Music4',
        'Play','PlayCircle','Pause','PauseCircle','Square','StopCircle','SkipForward','SkipBack',
        'Camera','CameraOff','Mic','MicOff','Film','Tv','Tv2','Radio',
        // Volume
        'Volume','Volume1','Volume2','VolumeX','VolumeOff',
        // Files & Folders
        'FileIcon','FileText','FileCode','FileCode2','FileJson','FileImage','FileVideo','FileAudio',
        'FilePlus','FilePlus2','FileMinus','FileCheck','FileX','FileSearch','FileQuestion','FileWarning',
        'Folder','FolderOpen','FolderPlus','FolderMinus','FolderCheck','FolderX','FolderSearch',
        'Archive','ArchiveRestore','Package','Box',
        // Tech & AI
        'Brain','BrainCircuit','BrainCog','CircuitBoard','Cpu','Chip','Server','Database','HardDrive',
        'Cloud','CloudUpload','CloudDownload','CloudOff','CloudRain','CloudSnow','CloudSun','CloudMoon','CloudLightning','CloudFog',
        'Wifi','WifiOff','Signal','SignalHigh','SignalLow','SignalMedium','SignalZero',
        'Bluetooth','BluetoothOff','BluetoothConnected','Router','Network',
        'Terminal','TerminalSquare','Code','Code2','Braces','Binary','Hash','QrCode',
        'Bot','Sparkles','Sparkle','Wand','Wand2','Lightbulb','LightbulbOff','Zap','ZapOff','Atom','Orbit','Dna','Fingerprint',
        // Business & Finance
        'Briefcase','Building','Building2','Factory','Landmark','Hotel','Hospital','School',
        'Store','ShoppingCart','ShoppingBag','CreditCard','Wallet','Wallet2',
        'DollarSign','Euro','PoundSterling','IndianRupee','JapaneseYen','Bitcoin',
        'Coins','Banknote','Receipt','Calculator','Percent',
        'TrendingUp','TrendingDown','BarChart','BarChart2','BarChart3','BarChart4','BarChartHorizontal',
        'PieChart','LineChart','AreaChart','Activity','Signal',
        'Target','Crosshair','Award','Trophy','Medal','Crown','Gem','Diamond',
        // Security
        'Lock','LockOpen','Unlock','Key','KeyRound','KeySquare',
        'Shield','ShieldCheck','ShieldAlert','ShieldOff','ShieldQuestion','ShieldPlus','ShieldMinus',
        'Eye','EyeOff','Scan','ScanLine','ScanFace','ScanBarcode',
        // Calendar & Time
        'Calendar','CalendarDays','CalendarCheck','CalendarPlus','CalendarMinus','CalendarX','CalendarRange','CalendarClock',
        'AlarmClock','AlarmClockOff','TimerReset','History','Watch','Stopwatch',
        // Devices
        'Laptop','Laptop2','Smartphone','Tablet','Monitor','MonitorOff','MonitorSmartphone','Desktop',
        'Printer','PrinterCheck','Keyboard','MouseIcon','MousePointer','MousePointer2',
        'Headphones','HeadphoneOff','Speaker','Gamepad','Gamepad2','Joystick',
        // Nature & Weather
        'Sun','Moon','SunMoon','Sunrise','Sunset','Stars','Cloud','Thermometer','ThermometerSun','ThermometerSnowflake',
        'Droplet','Droplets','Snowflake','Rainbow','Flame','Fire','Leaf','TreeDeciduous','TreePine','Trees',
        'Sprout','Flower','Flower2','Mountain','MountainSnow','Waves','Wind','Umbrella','UmbrellaOff',
        // Transport & Location
        'Car','CarFront','Bus','Train','Tram','Plane','PlaneTakeoff','PlaneLanding','Ship','Anchor','Rocket',
        'Bike','Truck','Ambulance','Forklift','Tractor',
        'Navigation','Navigation2','Compass','MapPinned','MapPinOff','MapIcon','Route','Signpost','Milestone','ParkingCircle','Fuel',
        // Food & Drink
        'Coffee','CoffeeIcon','Wine','GlassWater','Beer','Milk','IceCream','Cookie','Pizza','Beef','Egg','Apple','Banana','Cherry','Grape','Carrot',
        'UtensilsCrossed','Utensils','CookingPot','ChefHat',
        // Objects & Misc
        'Gift','Cake','Candy','PartyPopper','Confetti',
        'Book','BookOpen','BookCopy','BookMarked','Bookmark','BookmarkPlus','BookmarkMinus','BookmarkCheck','BookmarkX',
        'GraduationCap','Library','Newspaper','ScrollText',
        'Pen','Pencil','PenTool','Highlighter','Paintbrush','Palette','Eraser','Ruler','Scissors','Paperclip',
        'Pin','PinOff','Magnet','Link2Off',
        // Shapes & Abstract
        'Circle','Square','Triangle','Pentagon','Hexagon','Octagon','Asterisk','Slash',
        'Grip','GripVertical','GripHorizontal',
        'LayoutGrid','LayoutList','LayoutDashboard','Layout','LayoutTemplate','LayoutPanelLeft','LayoutPanelTop',
        'Layers','Layers2','Layers3','Grid','Grid2X2','Grid3X3','Rows','Columns','Table','Table2',
        'AlignLeft','AlignCenter','AlignRight','AlignJustify','AlignHorizontalDistributeCenter','AlignVerticalDistributeCenter',
        // Hand & Gestures
        'Hand','HandMetal','Pointer','PointerOff','Grab','Move3d','MoveDiagonal','MoveDiagonal2',
        // Settings & Tools
        'Settings','Settings2','SlidersHorizontal','SlidersVertical','Wrench','Hammer','Axe','Pickaxe','Shovel',
        'Construction','HardHat','Cog','CogRound',
        // Arrows & Directions
        'Undo2','Redo2','CornerDownLeft','CornerDownRight','CornerUpLeft','CornerUpRight','CornerLeftDown','CornerRightDown',
        'MoveUp','MoveDown','MoveLeft','MoveRight',
        // Misc
        'Flag','FlagOff','Tag','Tags','Quote','BadgeCheck','BadgeInfo','BadgeAlert','BadgeX','BadgePlus','BadgeMinus','BadgePercent','BadgeDollarSign',
        'Siren','CircleDot','CircleDashed','Infinity','Hash',
        // More commonly used
        'Check','Globe2','Verified','ShieldHalf','BellRing','BellOff','Megaphone','Radio','Podcast','Rss',
        'Toggle','ToggleLeft','ToggleRight','Power','PowerOff','LogIn','LogOut','UserCog','Glasses',
        'Accessibility','Languages','Globe2','Earth'
      ];
      
      // Reserved JS globals that must not be overwritten
      var reserved = ['Map','Set','Object','Array','Function','Symbol','Number','String','Boolean','Date','Error','Promise','Proxy','Reflect','Image','File','Navigator','Screen','Window','Document','Node','Event','Location','History','Storage','Math','JSON','RegExp','Infinity','NaN','undefined','console','alert','confirm','prompt'];
      
      // Create all icons
      iconList.forEach(function(name) {
        if (reserved.indexOf(name) === -1 && typeof window[name] === 'undefined') {
          window[name] = makeIcon(name);
        }
      });
      


      // Mock shadcn/ui Button
      window.Button = function(props) {
        var children = props.children;
        var className = props.className || '';
        var variant = props.variant || 'default';
        var size = props.size || 'default';
        
        var base = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:opacity-50 cursor-pointer';
        var v = {
          default: 'bg-zinc-900 text-white hover:bg-zinc-800',
          outline: 'border border-zinc-200 bg-white hover:bg-zinc-100',
          secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200',
          ghost: 'hover:bg-zinc-100',
          link: 'text-zinc-900 underline-offset-4 hover:underline',
          destructive: 'bg-red-500 text-white hover:bg-red-600'
        };
        var s = { default: 'h-10 px-4 py-2', sm: 'h-9 px-3', lg: 'h-11 px-8', icon: 'h-10 w-10' };
        
        var newProps = {};
        for (var k in props) {
          if (k !== 'children' && k !== 'variant' && k !== 'size' && k !== 'className') {
            newProps[k] = props[k];
          }
        }
        newProps.className = base + ' ' + (v[variant] || v.default) + ' ' + (s[size] || s.default) + ' ' + className;
        
        return React.createElement('button', newProps, children);
      };

      // Card components
      window.Card = function(p) { return React.createElement('div', { className: 'rounded-lg border bg-white shadow-sm ' + (p.className||'') }, p.children); };
      window.CardHeader = function(p) { return React.createElement('div', { className: 'flex flex-col space-y-1.5 p-6 ' + (p.className||'') }, p.children); };
      window.CardTitle = function(p) { return React.createElement('h3', { className: 'text-2xl font-semibold ' + (p.className||'') }, p.children); };
      window.CardDescription = function(p) { return React.createElement('p', { className: 'text-sm text-zinc-500 ' + (p.className||'') }, p.children); };
      window.CardContent = function(p) { return React.createElement('div', { className: 'p-6 pt-0 ' + (p.className||'') }, p.children); };
      window.CardFooter = function(p) { return React.createElement('div', { className: 'flex items-center p-6 pt-0 ' + (p.className||'') }, p.children); };

      // Badge
      window.Badge = function(p) {
        var v = { default: 'bg-zinc-900 text-white', secondary: 'bg-zinc-100 text-zinc-900', outline: 'border border-zinc-200', destructive: 'bg-red-500 text-white' };
        return React.createElement('div', { className: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ' + (v[p.variant] || v.default) + ' ' + (p.className||'') }, p.children);
      };

      // Input & Textarea
      window.Input = function(p) {
        var newProps = {};
        for (var k in p) { if (k !== 'className') newProps[k] = p[k]; }
        newProps.className = 'flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 ' + (p.className||'');
        return React.createElement('input', newProps);
      };
      window.Textarea = function(p) {
        var newProps = {};
        for (var k in p) { if (k !== 'className') newProps[k] = p[k]; }
        newProps.className = 'flex min-h-[80px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 ' + (p.className||'');
        return React.createElement('textarea', newProps);
      };

      // Separator
      window.Separator = function(p) {
        var o = p.orientation || 'horizontal';
        return React.createElement('div', { className: 'shrink-0 bg-zinc-200 ' + (o === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]') + ' ' + (p.className||'') });
      };

      // Tabs - simplified static version
      window.Tabs = function(p) { return React.createElement('div', { className: p.className || '' }, p.children); };
      window.TabsList = function(p) { return React.createElement('div', { className: 'inline-flex h-10 items-center justify-center rounded-md bg-zinc-100 p-1 ' + (p.className||'') }, p.children); };
      window.TabsTrigger = function(p) { return React.createElement('button', { className: 'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ' + (p.className||'') }, p.children); };
      window.TabsContent = function(p) { return React.createElement('div', { className: 'mt-2 ' + (p.className||'') }, p.children); };

      // Wait for Babel to be fully loaded
      function runWhenReady() {
        if (typeof Babel === 'undefined' || typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
          setTimeout(runWhenReady, 50);
          return;
        }
        
        try {
          var codeDataEl = document.getElementById('user-code-data');
          var userCode = JSON.parse(codeDataEl.textContent);
          
          // IMPORTANT: Scan code for undefined identifiers that look like icons
          // Pattern: <IconName or {IconName} where IconName starts with uppercase
          var iconPattern = /[<{\s,]([A-Z][a-zA-Z0-9]*)/g;
          var match;
          var foundIcons = [];
          while ((match = iconPattern.exec(userCode)) !== null) {
            var iconName = match[1];
            if (iconName && typeof window[iconName] === 'undefined' && reserved.indexOf(iconName) === -1) {
              foundIcons.push(iconName);
            }
          }
          // Create any missing icons before execution
          foundIcons.forEach(function(name) {
            if (typeof window[name] === 'undefined') {
              console.log('Auto-creating icon:', name);
              window[name] = makeIcon(name);
            }
          });
          
          // Append mount code
          var mountCode = ';(function mount(){var target=typeof GeneratedPage!=="undefined"?GeneratedPage:(typeof App!=="undefined"?App:null);if(target){ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(target));}else{document.getElementById("root").innerHTML="<div class=\\\\"error-container\\\\"><b>Error:</b> No GeneratedPage component found.</div>";}})();';
          
          var fullCode = userCode + mountCode;
          
          // Transform with Babel
          var result = Babel.transform(fullCode, { presets: ['react'] });
          
          // Create and run the script
          var fn = new Function(result.code);
          fn();
        } catch (err) {
          console.error('Build Error:', err);
          document.getElementById('root').innerHTML = '<div class="error-container"><b>Build Error:</b><br/>' + String(err.message || err) + '</div>';
        }
      }
      
      // Start when DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runWhenReady);
      } else {
        runWhenReady();
      }
    })();
  <\/script>
</body>
</html>`
}
