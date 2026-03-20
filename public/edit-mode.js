/**
 * Edit Mode Runtime — injected into the preview iframe when Edit Mode is active.
 * Makes text elements contenteditable and images clickable for replacement.
 * Communicates changes back to the parent via postMessage.
 */
(function () {
  'use strict'

  // Resolve the parent origin for secure postMessage communication
  var parentOrigin = '*'
  try { parentOrigin = window.parent.location.origin } catch (e) { /* cross-origin */ }

  // Wait for preview-runtime to boot React before activating
  var bootCheck = setInterval(function () {
    var root = document.getElementById('root')
    if (root && root.children.length > 0) {
      clearInterval(bootCheck)
      // Small delay to let React finish rendering
      setTimeout(initEditMode, 300)
    }
  }, 150)

  // Give up after 15s
  setTimeout(function () { clearInterval(bootCheck) }, 15000)

  function initEditMode() {
    var changes = []

    // ---- Inject edit-mode styles ----
    var style = document.createElement('style')
    style.textContent = [
      '/* Edit-mode text highlights */',
      '[data-edit-text] { transition: outline 0.15s, background 0.15s; cursor: text !important; }',
      '[data-edit-text]:hover { outline: 2px solid rgba(99,102,241,0.5) !important; outline-offset: 2px; }',
      '[data-edit-text]:focus { outline: 2px solid rgba(99,102,241,0.8) !important; outline-offset: 2px; background: rgba(99,102,241,0.04) !important; }',
      '/* Edit-mode image highlights */',
      '[data-edit-img] { cursor: pointer !important; transition: outline 0.15s; }',
      '[data-edit-img]:hover { outline: 2px solid rgba(234,88,12,0.6) !important; outline-offset: 2px; }',
      '.edit-img-badge { position:absolute; bottom:8px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.75); color:#fff; font-size:11px; font-weight:600; padding:4px 14px; border-radius:8px; pointer-events:none; opacity:0; transition:opacity 0.2s; white-space:nowrap; z-index:99; }',
      '.edit-img-wrapper:hover .edit-img-badge { opacity:1; }',
      '/* Prevent layout shifts during editing */',
      '[contenteditable] { min-width: 1em; }',
      '/* Selected element indicator */',
      '[data-edit-selected] { outline: 2px dashed rgba(99,102,241,0.9) !important; outline-offset: 3px; }',
    ].join('\n')
    document.head.appendChild(style)

    // ---- Disable ALL interactive behaviors + Element selection ----
    // These are merged into one capture-phase handler because stopImmediatePropagation
    // in the blocker would kill any separate selection handler.

    var selectedEditId = null

    function isEditableTarget(target) {
      return target.closest && target.closest('[contenteditable="true"]')
    }

    function isInteractive(target) {
      if (!target.closest) return false
      return target.closest('a[href], button, [role="button"], input, select, textarea, details, summary')
    }

    // Resolve click target to a selectable element (handles SVGs, icons, nested spans)
    function resolveSelectableElement(target) {
      var el = target
      // SVG elements: walk up to the parent HTML element
      if (el instanceof SVGElement || (el.closest && el.closest('svg'))) {
        var svg = (el instanceof SVGElement) ? el : el.closest('svg')
        el = svg ? svg.parentElement : el
        if (!el || el === document.body) return null
      }
      // Check for decorated editable elements
      if (el.closest) {
        var editable = el.closest('[data-edit-text], [data-edit-img]')
        if (editable) return editable
      }
      // For non-decorated elements (icons in buttons, etc.), try the parent chain
      // to find something meaningful we can show colors for
      var candidate = el
      while (candidate && candidate !== document.body) {
        if (candidate.dataset && candidate.dataset.editId) return candidate
        // Stop at section-level containers
        if (candidate.tagName && /^(SECTION|MAIN|HEADER|FOOTER|NAV|ARTICLE)$/i.test(candidate.tagName)) break
        candidate = candidate.parentElement
      }
      // Fallback: use the element itself if it's a meaningful HTML element
      if (el.tagName && /^(SPAN|DIV|P|H[1-6]|A|BUTTON|LI|LABEL|TD|TH)$/i.test(el.tagName)) {
        return el
      }
      return null
    }

    function handleSelection(target) {
      // Clear previous selection
      var prev = document.querySelector('[data-edit-selected]')
      if (prev) prev.removeAttribute('data-edit-selected')

      var selectable = resolveSelectableElement(target)

      if (selectable) {
        var editId = selectable.dataset ? selectable.dataset.editId : null
        if (!editId) {
          // Generate a temporary edit ID for non-decorated elements (icons, etc.)
          editId = 'sel-' + Date.now()
          selectable.setAttribute('data-edit-id', editId)
        }
        selectedEditId = editId
        selectable.setAttribute('data-edit-selected', '')

        // Extract colors from computed styles — including child elements
        var computed = getComputedStyle(selectable)
        var elementColors = []
        var colorsSeen = {}

        // Helper to add a color if not already seen
        function addColor(prop, hex, label) {
          var key = prop + ':' + hex
          if (!colorsSeen[key]) {
            colorsSeen[key] = true
            elementColors.push({ property: prop, value: hex, label: label })
          }
        }

        var selColorProps = [
          { css: 'color', label: 'Text' },
          { css: 'background-color', label: 'Background' },
          { css: 'border-color', label: 'Border' },
        ]

        // Colors from the element itself
        selColorProps.forEach(function (p) {
          var val = computed.getPropertyValue(p.css).trim()
          if (!val || val === 'rgba(0, 0, 0, 0)' || val === 'transparent') return
          var hex = rgbToHex(val)
          if (hex) addColor(p.css, hex, p.label)
        })

        // Also scan immediate children for different text colors (e.g., colored spans inside a heading)
        var children = selectable.querySelectorAll('*')
        for (var ci = 0; ci < Math.min(children.length, 30); ci++) {
          var childComputed = getComputedStyle(children[ci])
          var childColor = rgbToHex(childComputed.color)
          var childBg = rgbToHex(childComputed.backgroundColor)
          if (childColor) addColor('color', childColor, 'Text')
          if (childBg && childComputed.backgroundColor !== 'rgba(0, 0, 0, 0)' && childComputed.backgroundColor !== 'transparent') {
            addColor('background-color', childBg, 'Background')
          }
        }

        window.parent.postMessage({
          type: 'element-selected',
          editId: selectedEditId,
          tagName: selectable.tagName ? selectable.tagName.toLowerCase() : 'element',
          colors: elementColors,
          classes: selectable.className || '',
        }, parentOrigin)
      } else {
        selectedEditId = null
        window.parent.postMessage({ type: 'element-deselected' }, parentOrigin)
      }
    }

    // Click handler: run selection FIRST, then block interactive behaviors
    window.addEventListener('click', function (e) {
      // Always run selection logic (before blocking)
      handleSelection(e.target)

      // Block interactive elements from triggering navigation/modals
      if (isEditableTarget(e.target)) return
      if (isInteractive(e.target)) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
      }
    }, true) // capture phase

    // Block mousedown/pointerdown on interactive elements (no selection needed)
    ;['mousedown', 'mouseup', 'pointerdown', 'pointerup', 'touchstart'].forEach(function (evt) {
      window.addEventListener(evt, function (e) {
        if (isEditableTarget(e.target)) return
        if (isInteractive(e.target)) {
          e.preventDefault()
          e.stopPropagation()
          e.stopImmediatePropagation()
        }
      }, true)
    })

    // Layer 2: Block on #root for React 18 delegated handlers
    var reactRoot = document.getElementById('root')
    if (reactRoot) {
      ;['click', 'mousedown', 'mouseup', 'pointerdown', 'pointerup'].forEach(function (evt) {
        reactRoot.addEventListener(evt, function (e) {
          if (isEditableTarget(e.target)) return
          if (isInteractive(e.target)) {
            e.stopImmediatePropagation()
          }
        }, true)
      })
    }

    // Layer 3: Neuter React onClick props directly on DOM elements
    function neutralizeReactHandlers() {
      document.querySelectorAll('button, a[href], [role="button"]').forEach(function (el) {
        if (el.hasAttribute('contenteditable')) return
        var keys = Object.keys(el)
        keys.forEach(function (key) {
          if (key.startsWith('__reactProps$')) {
            var props = el[key]
            if (props) {
              if (props.onClick) props.onClick = function (e) { e.preventDefault() }
              if (props.onMouseDown) props.onMouseDown = function (e) { e.preventDefault() }
              if (props.onPointerDown) props.onPointerDown = function (e) { e.preventDefault() }
            }
          }
        })
        el.onclick = null
      })
    }
    neutralizeReactHandlers()
    setTimeout(neutralizeReactHandlers, 500)
    setTimeout(neutralizeReactHandlers, 1500)

    // Block hash, scroll, onclick attributes
    window.addEventListener('hashchange', function (e) { e.preventDefault() }, true)
    document.querySelectorAll('[onclick]').forEach(function (el) { el.removeAttribute('onclick') })
    window.scrollTo = function () { /* blocked */ }
    window.scrollBy = function () { /* blocked */ }
    Element.prototype.scrollIntoView = function () { /* blocked */ }

    // ---- Decorate text elements ----
    // Include button in selectors — CTAs need to be editable
    var TEXT_SELECTORS = 'h1,h2,h3,h4,h5,h6,p,span,a,li,td,th,label,button,blockquote,figcaption'

    function decorateTextElements() {
      var textEls = document.querySelectorAll(TEXT_SELECTORS)
      var count = 0

      textEls.forEach(function (el, i) {
        // Skip already-decorated elements
        if (el.hasAttribute('data-edit-text')) return

        // Check for meaningful text content — use innerText for leaf elements
        // (buttons/CTAs often wrap text in child spans, not direct text nodes)
        var visibleText = (el.innerText || el.textContent || '').trim()
        if (visibleText.length < 2) return

        // For container elements with many children, only allow if there's direct text
        var childElementCount = el.children.length
        if (childElementCount > 3) {
          // This is likely a container, not a leaf text element — skip
          var directText = ''
          for (var n = 0; n < el.childNodes.length; n++) {
            if (el.childNodes[n].nodeType === 3) directText += el.childNodes[n].textContent
          }
          if (directText.trim().length < 2) return
        }

        // Skip nested editable elements (don't double-decorate)
        if (el.closest('[data-edit-text]')) return

        var editId = 'text-' + Date.now() + '-' + i
        el.setAttribute('data-edit-text', '')
        el.setAttribute('data-edit-id', editId)
        el.setAttribute('contenteditable', 'true')
        el.setAttribute('spellcheck', 'false')
        count++

        el.addEventListener('focus', function () {
          el.dataset.editOriginal = el.textContent
        })

        el.addEventListener('blur', function () {
          var newText = el.textContent.trim()
          var oldText = (el.dataset.editOriginal || '').trim()
          if (newText === oldText) return

          upsertChange({
            type: 'text',
            editId: editId,
            oldValue: oldText,
            newValue: newText,
          })
        })

        // Enter commits; Shift+Enter inserts newline in <p>
        el.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            el.blur()
          }
          // Escape cancels edit
          if (e.key === 'Escape') {
            el.textContent = el.dataset.editOriginal || ''
            el.blur()
          }
        })
      })

      return count
    }

    // ---- Decorate images ----
    function decorateImages() {
      var imgEls = document.querySelectorAll('img')
      var count = 0

      imgEls.forEach(function (img, i) {
        // Skip already-decorated images
        if (img.hasAttribute('data-edit-img')) return
        // Skip tiny icons / decorative images
        if (img.naturalWidth > 0 && img.naturalWidth < 24) return

        var editId = 'img-' + Date.now() + '-' + i
        img.setAttribute('data-edit-img', '')
        img.setAttribute('data-edit-id', editId)
        count++

        // Wrap in relative container for badge positioning
        var parent = img.parentElement
        if (parent) {
          var computed = window.getComputedStyle(parent)
          if (computed.position === 'static') parent.style.position = 'relative'
          parent.classList.add('edit-img-wrapper')

          var badge = document.createElement('div')
          badge.className = 'edit-img-badge'
          badge.textContent = 'Click to replace'
          parent.appendChild(badge)
        }

        img.addEventListener('click', function (e) {
          e.preventDefault()
          e.stopPropagation()
          window.parent.postMessage({
            type: 'image-clicked',
            editId: editId,
            currentSrc: img.src,
          }, parentOrigin)
        })
      })

      return count
    }

    var textCount = decorateTextElements()
    var imgCount = decorateImages()

    // Watch for dynamically added elements (lazy-loaded sections, etc.)
    var observer = new MutationObserver(function () {
      decorateTextElements()
      var newImgs = decorateImages()
      if (newImgs > 0) sendImageCatalog()
    })
    observer.observe(document.getElementById('root') || document.body, {
      childList: true,
      subtree: true,
    })

    // ---- Image catalog for side panel ----
    function sendImageCatalog() {
      var imgs = document.querySelectorAll('[data-edit-img]')
      var catalog = []
      imgs.forEach(function (img) {
        // Find nearest heading or section for context label
        var hint = ''
        var section = img.closest('section, [class*="hero"], [class*="about"], [class*="footer"], [class*="gallery"], [class*="team"], [class*="contact"], header, footer, main, nav')
        if (section) {
          var heading = section.querySelector('h1,h2,h3,h4')
          if (heading) hint = heading.textContent.trim().slice(0, 40)
        }
        if (!hint) {
          // Try alt text
          hint = (img.alt || '').trim().slice(0, 40)
        }
        if (!hint) hint = 'Image'

        catalog.push({
          editId: img.dataset.editId,
          src: img.src,
          alt: img.alt || '',
          sectionHint: hint,
        })
      })
      window.parent.postMessage({
        type: 'image-catalog',
        images: catalog,
      }, parentOrigin)
    }

    // ---- Change tracking ----
    function upsertChange(change) {
      var idx = -1
      for (var c = 0; c < changes.length; c++) {
        if (changes[c].editId === change.editId) { idx = c; break }
      }
      if (idx >= 0) {
        // Update the newValue; keep the original oldValue
        changes[idx].newValue = change.newValue
      } else {
        changes.push(change)
      }

      // Remove changes that have been reverted to the original value
      changes = changes.filter(function (c) { return c.oldValue !== c.newValue })

      window.parent.postMessage({
        type: 'edit-change',
        changes: changes,
        latestChange: change,
      }, parentOrigin)
    }

    // ---- Listen for parent commands ----
    window.addEventListener('message', function (e) {
      // Validate origin — accept parent origin or 'null' (srcdoc iframes)
      if (parentOrigin !== '*' && e.origin !== parentOrigin && e.origin !== 'null') return

      var data = e.data
      if (!data || !data.type) return

      if (data.type === 'undo-text') {
        // Revert a text element to its previous value
        if (typeof data.editId === 'string') {
          var textEl = document.querySelector('[data-edit-id="' + data.editId + '"]')
          if (textEl) {
            textEl.textContent = data.originalText
            textEl.dataset.editOriginal = data.originalText
            // Remove this change from the changes array
            changes = changes.filter(function (c) { return c.editId !== data.editId })
            window.parent.postMessage({
              type: 'edit-change',
              changes: changes,
              latestChange: null,
            }, parentOrigin)
          }
        }
      }

      if (data.type === 'replace-image') {
        // Validate editId format to prevent selector injection
        if (typeof data.editId !== 'string' || !/^img-\d+-\d+$/.test(data.editId)) return
        // Validate newSrc is a proper URL
        if (typeof data.newSrc !== 'string' || !data.newSrc.match(/^https?:\/\//)) return

        var img = document.querySelector('[data-edit-id="' + data.editId + '"]')
        if (img) {
          var oldSrc = img.src
          img.src = data.newSrc
          upsertChange({
            type: 'image',
            editId: data.editId,
            oldValue: oldSrc,
            newValue: data.newSrc,
          })
          // Refresh catalog so panel thumbnail updates
          sendImageCatalog()
        }
      }

      if (data.type === 'get-changes') {
        window.parent.postMessage({ type: 'edit-changes-response', changes: changes }, parentOrigin)
      }
    })

    // ======== DESIGN DATA EXTRACTION (Properties Panel) ========

    function rgbToHex(rgb) {
      if (!rgb || rgb === 'transparent') return null
      // Handle hex pass-through
      if (rgb.charAt(0) === '#') return rgb.toLowerCase()
      var match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
      if (!match) return null
      var r = parseInt(match[1]), g = parseInt(match[2]), b = parseInt(match[3])
      return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
    }

    function extractTokens() {
      var tokens = []
      var seen = {}
      for (var s = 0; s < document.styleSheets.length; s++) {
        try {
          var rules = document.styleSheets[s].cssRules
          if (!rules) continue
          for (var r = 0; r < rules.length; r++) {
            var sel = (rules[r].selectorText || '').trim()
            if (sel === ':root' || sel === 'html' || sel === '*') {
              var st = rules[r].style
              for (var p = 0; p < st.length; p++) {
                var name = st[p]
                if (name.startsWith('--') && !seen[name]) {
                  seen[name] = true
                  var val = st.getPropertyValue(name).trim()
                  var cat = 'other'
                  if (name.match(/color|bg|background|fill|stroke/i)) cat = 'color'
                  else if (name.match(/spacing|gap|margin|padding/i)) cat = 'spacing'
                  else if (name.match(/radius|rounded/i)) cat = 'radius'
                  else if (name.match(/font|text|letter|line/i)) cat = 'font'
                  tokens.push({ name: name, value: val, category: cat })
                }
              }
            }
          }
        } catch (e) { /* cross-origin stylesheet */ }
      }
      return tokens
    }

    function extractFonts() {
      var fontMap = {}
      var allEls = document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,a,li,button,label,div,section,header,footer,nav,main,blockquote')
      allEls.forEach(function (el) {
        var computed = getComputedStyle(el)
        var rawFamily = computed.fontFamily
        if (!rawFamily) return
        var family = rawFamily.split(',')[0].trim().replace(/["']/g, '')
        if (!family || family === 'inherit' || family === 'initial') return
        if (!fontMap[family]) fontMap[family] = { count: 0, weights: {} }
        fontMap[family].count++
        fontMap[family].weights[computed.fontWeight] = true
      })
      return Object.keys(fontMap).map(function (f) {
        return {
          family: f,
          usageCount: fontMap[f].count,
          weights: Object.keys(fontMap[f].weights).sort(),
        }
      }).sort(function (a, b) { return b.usageCount - a.usageCount })
    }

    function extractColors() {
      var colorMap = {}
      var COLOR_PROPS = ['color', 'background-color', 'border-color', 'border-top-color', 'border-bottom-color', 'border-left-color', 'border-right-color']
      var allEls = document.querySelectorAll('*')
      allEls.forEach(function (el) {
        var computed = getComputedStyle(el)
        COLOR_PROPS.forEach(function (prop) {
          var val = computed.getPropertyValue(prop).trim()
          if (!val || val === 'rgba(0, 0, 0, 0)' || val === 'transparent' || val === 'inherit') return
          var hex = rgbToHex(val)
          if (!hex) return
          // Skip pure black/white as they're too common to be useful
          if (!colorMap[hex]) colorMap[hex] = { count: 0, properties: {} }
          colorMap[hex].count++
          colorMap[hex].properties[prop] = true
        })
      })
      return Object.keys(colorMap).map(function (hex) {
        return {
          color: hex,
          usageCount: colorMap[hex].count,
          properties: Object.keys(colorMap[hex].properties),
        }
      }).sort(function (a, b) { return b.usageCount - a.usageCount })
    }

    function sendDesignData() {
      window.parent.postMessage({
        type: 'design-data',
        tokens: extractTokens(),
        fonts: extractFonts(),
        colors: extractColors(),
      }, parentOrigin)
    }

    // ======== DESIGN DATA APPLICATION (inbound commands) ========

    // Extend message handler for design operations
    window.addEventListener('message', function (e) {
      if (parentOrigin !== '*' && e.origin !== parentOrigin && e.origin !== 'null') return
      var data = e.data
      if (!data || !data.type) return

      if (data.type === 'update-token') {
        if (typeof data.name === 'string' && data.name.startsWith('--')) {
          document.documentElement.style.setProperty(data.name, data.value)
        }
      }

      if (data.type === 'update-font') {
        // Inject Google Font stylesheet if needed
        if (data.stylesheetUrl && !document.querySelector('link[href="' + data.stylesheetUrl + '"]')) {
          var link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = data.stylesheetUrl
          document.head.appendChild(link)
        }
        // Walk elements and swap font-family
        var old = data.oldFamily
        var neu = data.newFamily
        document.querySelectorAll('*').forEach(function (el) {
          var current = getComputedStyle(el).fontFamily
          if (current.indexOf(old) >= 0) {
            el.style.fontFamily = current.replace(new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '"' + neu + '"')
          }
        })
        // Resend design data to reflect changes
        setTimeout(sendDesignData, 100)
      }

      if (data.type === 'update-color') {
        var oldHex = data.oldColor.toLowerCase()
        var newHex = data.newColor
        // Map JS property names to CSS property names for setProperty
        var COLOR_PROP_MAP = {
          color: 'color', backgroundColor: 'background-color', borderColor: 'border-color',
          borderTopColor: 'border-top-color', borderBottomColor: 'border-bottom-color',
          borderLeftColor: 'border-left-color', borderRightColor: 'border-right-color'
        }
        document.querySelectorAll('*').forEach(function (el) {
          Object.keys(COLOR_PROP_MAP).forEach(function (jsProp) {
            var computed = getComputedStyle(el)[jsProp]
            if (computed) {
              var hex = rgbToHex(computed)
              if (hex === oldHex) {
                el.style.setProperty(COLOR_PROP_MAP[jsProp], newHex, 'important')
              }
            }
          })
        })
        // Resend design data to reflect changes
        setTimeout(sendDesignData, 100)
      }

      if (data.type === 'update-element-color') {
        // Per-element color change (not global find-replace)
        if (typeof data.editId === 'string' && typeof data.property === 'string') {
          var targetEl = document.querySelector('[data-edit-id="' + data.editId + '"]')
          if (targetEl) {
            // Use setProperty with !important to override Tailwind utility classes
            targetEl.style.setProperty(data.property, data.newColor, 'important')
            // Re-extract and send selection colors
            var comp = getComputedStyle(targetEl)
            var selColors = []
            ;[{ css: 'color', label: 'Text' }, { css: 'background-color', label: 'Background' }, { css: 'border-color', label: 'Border' }].forEach(function (p) {
              var v = comp.getPropertyValue(p.css).trim()
              if (v && v !== 'rgba(0, 0, 0, 0)' && v !== 'transparent') {
                var h = rgbToHex(v)
                if (h) selColors.push({ property: p.css, value: h, label: p.label })
              }
            })
            window.parent.postMessage({
              type: 'element-selected',
              editId: data.editId,
              tagName: targetEl.tagName.toLowerCase(),
              colors: selColors,
              classes: targetEl.className || '',
            }, parentOrigin)
          }
        }
      }

      if (data.type === 'get-design-data') {
        sendDesignData()
      }
    })

    // ---- Cmd+Z undo: forward to parent overlay ----
    document.addEventListener('keydown', function (e) {
      if (e.key === 'z' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault()
        window.parent.postMessage({ type: 'request-undo' }, parentOrigin)
      }
    })

    // Notify parent that edit mode is ready
    window.parent.postMessage({
      type: 'edit-mode-ready',
      textCount: textCount,
      imgCount: imgCount,
    }, parentOrigin)

    // Send initial image catalog and design data
    sendImageCatalog()
    sendDesignData()
  }
})()
