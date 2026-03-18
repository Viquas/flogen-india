/**
 * CTA Bar Injector
 *
 * Injects a style-isolated sticky bottom bar into generated website HTML.
 * The bar shows the business name, a countdown timer, and a "Claim This Website" button.
 * When the claim window expires, the bar switches to an expired state.
 *
 * All styles are inline to avoid conflicts with the generated site's CSS.
 * All element IDs are prefixed with `flogen-cta-` to avoid collisions.
 */

export interface CtaConfig {
    businessName: string
    claimUrl: string
    expiresAt: string // ISO 8601 timestamp
    siteSlug: string  // project ID for analytics tracking
}

/**
 * Escape a string for safe HTML embedding.
 * Replaces &, <, >, and " with their HTML entity equivalents.
 */
function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

/**
 * Build the complete CTA bar HTML string (div + script).
 */
function buildCtaBarHtml(config: CtaConfig): string {
    const safeName = escapeHtml(config.businessName)
    const safeUrl = escapeHtml(config.claimUrl)
    const safeExpires = escapeHtml(config.expiresAt)
    const safeSlug = escapeHtml(config.siteSlug)

    return `
<!-- Flogen CTA Bar -->
<div id="flogen-cta-root" style="
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 2147483647;
    background: rgba(17, 17, 17, 0.95);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    padding: 12px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-sizing: border-box;
    min-height: 56px;
">
    <div style="display: flex; flex-direction: column; min-width: 0; flex: 1; margin-right: 16px;">
        <span id="flogen-cta-name" style="
            color: #ffffff;
            font-size: 14px;
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.3;
        ">Made for ${safeName}</span>
        <span id="flogen-cta-countdown" style="
            color: #a1a1aa;
            font-size: 12px;
            line-height: 1.3;
            margin-top: 2px;
        "></span>
    </div>
    <a id="flogen-cta-button" href="${safeUrl}" style="
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: #2563eb;
        color: #ffffff;
        font-size: 14px;
        font-weight: 600;
        padding: 8px 20px;
        border-radius: 6px;
        text-decoration: none;
        white-space: nowrap;
        cursor: pointer;
        transition: background 0.15s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        flex-shrink: 0;
    ">Claim This Website</a>
</div>
<script>
(function() {
    // Add bottom padding to body so page content is not hidden behind the bar
    document.body.style.paddingBottom = "64px";

    var expiresAt = new Date("${safeExpires}").getTime();
    var countdownEl = document.getElementById("flogen-cta-countdown");
    var buttonEl = document.getElementById("flogen-cta-button");
    var intervalId = null;

    function updateCountdown() {
        var now = Date.now();
        var diff = expiresAt - now;

        if (diff <= 0) {
            // Expired state
            if (countdownEl) {
                countdownEl.textContent = "This offer has expired";
                countdownEl.style.color = "#f87171";
            }
            if (buttonEl) {
                buttonEl.textContent = "Request a New Website";
                buttonEl.style.background = "#6b7280";
                buttonEl.href = "${safeUrl}?expired=true";
            }
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
            return;
        }

        var days = Math.floor(diff / 86400000);
        var hours = Math.floor((diff % 86400000) / 3600000);
        var minutes = Math.floor((diff % 3600000) / 60000);

        if (countdownEl) {
            countdownEl.textContent = days + "d " + hours + "h " + minutes + "m left to claim";
        }
    }

    // Run immediately, then every 60 seconds
    updateCountdown();
    intervalId = setInterval(updateCountdown, 60000);

    // --- Analytics beacon ---
    var slug = "${safeSlug}";
    var analyticsUrl = "";
    try {
        var btnHref = document.getElementById("flogen-cta-button").href;
        if (btnHref && btnHref.indexOf("http") === 0) {
            analyticsUrl = btnHref.split("/claim")[0];
        }
    } catch(e) {}
    if (!analyticsUrl) {
        try { analyticsUrl = window.location.origin; } catch(e) {}
    }

    function flogenTrack(evtType) {
        if (!analyticsUrl || !slug) return;
        var url = analyticsUrl + "/api/analytics/claim-event?slug=" + encodeURIComponent(slug) + "&event=" + encodeURIComponent(evtType);
        try {
            if (typeof navigator !== "undefined" && navigator.sendBeacon) {
                navigator.sendBeacon(url);
            } else {
                new Image().src = url;
            }
        } catch(e) {}
    }

    flogenTrack("preview_view");

    var ctaBtn = document.getElementById("flogen-cta-button");
    if (ctaBtn) {
        ctaBtn.addEventListener("click", function() {
            flogenTrack("cta_click");
        });
    }
})();
</script>
<!-- /Flogen CTA Bar -->
`
}

/**
 * Inject the CTA bar into an HTML document produced by constructHtmlBoilerplate().
 * The CTA HTML is inserted immediately before the closing </body> tag.
 */
export function injectCtaBar(html: string, config: CtaConfig): string {
    const ctaHtml = buildCtaBarHtml(config)
    return html.replace(/<\/body>/i, ctaHtml + '\n</body>')
}
