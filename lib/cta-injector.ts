/**
 * CTA Bar Injector
 *
 * Injects a style-isolated sticky bottom bar into generated website HTML.
 * The bar shows the business name, a countdown timer, and a "Claim This Website" button.
 * When the claim window expires, the bar switches to an expired state.
 *
 * All styles are inline to avoid conflicts with the generated site's CSS.
 * All element IDs are prefixed with `sumosite-cta-` to avoid collisions.
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
<!-- Sumosite CTA Bar -->
<style>
@keyframes sumosite-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(175, 146, 255, 0.4); }
    50% { box-shadow: 0 0 16px 4px rgba(175, 146, 255, 0.3); }
}
#sumosite-cta-button {
    background-size: 100% 200% !important;
    background-image: linear-gradient(180deg, #C4B0FF 0%, #8B6FE0 50%, #C4B0FF 100%) !important;
    background-position: 0% 0%;
    transition: background-position 0.2s ease, transform 0.2s ease !important;
}
#sumosite-cta-button:hover {
    background-position: 0% 100% !important;
    transform: scale(1.05);
}
</style>
<div id="sumosite-cta-root" style="
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2147483647;
    background: rgba(24, 24, 27, 0.95);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    padding: 10px 10px 10px 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-sizing: border-box;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    max-width: 90vw;
">
    <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
        <span id="sumosite-cta-name" style="
            color: #ffffff;
            font-size: 13px;
            font-weight: 500;
            white-space: nowrap;
            line-height: 1;
        ">Make this website yours</span>
        <span style="color: rgba(255,255,255,0.15); font-size: 14px;">|</span>
        <span id="sumosite-cta-countdown" style="
            color: rgba(255, 255, 255, 0.4);
            font-size: 12px;
            white-space: nowrap;
            line-height: 1;
        "></span>
    </div>
    <a id="sumosite-cta-button" href="${safeUrl}" style="
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 0.01em;
        padding: 10px 24px;
        border-radius: 999px;
        text-decoration: none;
        white-space: nowrap;
        cursor: pointer;
        transition: background 0.15s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        flex-shrink: 0;
        animation: sumosite-pulse 2s ease-in-out infinite;
    ">Claim This Website</a>
</div>
<script>
(function() {
    // Add bottom padding to body so page content is not hidden behind the floating bar
    document.body.style.paddingBottom = "80px";

    var expiresAt = new Date("${safeExpires}").getTime();
    var countdownEl = document.getElementById("sumosite-cta-countdown");
    var buttonEl = document.getElementById("sumosite-cta-button");
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
                buttonEl.style.background = "rgba(255,255,255,0.15)";
                buttonEl.style.color = "#ffffff";
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
        var btnHref = document.getElementById("sumosite-cta-button").href;
        if (btnHref && btnHref.indexOf("http") === 0) {
            analyticsUrl = btnHref.split("/claim")[0];
        }
    } catch(e) {}
    if (!analyticsUrl) {
        try { analyticsUrl = window.location.origin; } catch(e) {}
    }

    function sumositeTrack(evtType) {
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

    sumositeTrack("preview_view");

    var ctaBtn = document.getElementById("sumosite-cta-button");
    if (ctaBtn) {
        ctaBtn.addEventListener("click", function() {
            sumositeTrack("cta_click");
        });
    }
})();
</script>
<!-- /Sumosite CTA Bar -->
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
