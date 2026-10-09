/* WanderStay — checkout (payment.html).
   Booking details arrive as URL parameters from a property page's Reserve button:
   ?property=houseN&checkin=YYYY-MM-DD&checkout=YYYY-MM-DD&adults=N&children=N
   Depends on listings.js and the shared helpers from script.js (window.WanderStay). */
(function () {
    "use strict";

    const W = window.WanderStay;
    const root = document.querySelector("main[data-checkout]");
    if (!W || !root) return;

    const { $, $$, escapeHtml, icon, peso, plural, toISODate, parseISODate, nightsBetween } = W;

    /* ==========================================================================
       Payment gateway (integration point)
       --------------------------------------------------------------------------
       No payment provider is connected yet, so pay() and verify() reject with
       "not_configured" and nobody can be charged. To connect one (for example a
       provider that supports GCash, Maya and cards in the Philippines), define
       window.WanderStayPayments before this script loads, or assign to it and call
       WanderStayPayments.refresh():

         name        – provider name shown in "Payments are processed securely by …"
         configured  – true once connected
         methods     – subset of ["gcash", "maya", "card"] the provider supports
         pay({ method, booking, amount, currency, idempotencyKey, returnUrl, cancelUrl })
             → { status: "redirect", url }      wallet or 3-D Secure redirect
             → { status: "paid", reference }    ONLY after your server verified it
             → { status: "pending", reference }
             or rejects with { code }: card_declined, expired_card, insufficient_funds,
             unavailable, payment_failed, network, not_configured
         verify(reference) → { status: "paid" | "pending" | "failed", reference, code? }
             must ask YOUR server, which confirms with the provider (webhook or API).

       Security rules for the real integration:
         • Card details must be collected by the provider's hosted fields/elements,
           mounted in place of the placeholder inputs in CardForm(). Raw card numbers
           and CVCs must never reach WanderStay's server, logs or storage.
         • Secret keys stay on the server; only publishable keys belong in this file.
         • The server must compute the amount from its own booking data and check the
           dates are still available before charging — never trust `amount` from here.
       ========================================================================== */
    const Gateway = window.WanderStayPayments = Object.assign({
        name: null,
        configured: false,
        methods: ["gcash", "maya", "card"],
        pay() { return Promise.reject({ code: "not_configured" }); },
        verify() { return Promise.reject({ code: "not_configured" }); }
    }, window.WanderStayPayments || {});
    Gateway.refresh = () => init();

    const METHODS = {
        gcash: {
            label: "GCash",
            logo: "img/pay-gcash.png",
            short: "You'll be redirected to GCash to complete payment.",
            redirect: true
        },
        maya: {
            label: "Maya",
            logo: "img/pay-maya.png",
            short: "You'll be redirected to Maya to complete payment.",
            redirect: true
        },
        card: {
            label: "Credit or debit card",
            short: "Visa, Mastercard and other major cards.",
            redirect: false
        }
    };

    const ERRORS = {
        card_declined: "Your card was declined. Try another card or payment method.",
        expired_card: "Your card has expired. Check the expiry date or use another card.",
        insufficient_funds: "There aren't enough funds for this payment. Try another card or payment method.",
        payment_failed: "The payment didn't go through and you haven't been charged. Try again or choose another payment method.",
        network: "We couldn't reach the payment service. Check your connection and try again — you haven't been charged.",
        not_configured: "Online payment isn't connected yet, so this booking can't be paid for here. You haven't been charged.",
        unavailable: "Sorry, these dates are no longer available. You haven't been charged."
    };
    const errorMessage = err => ERRORS[err && err.code] || "Something went wrong and you haven't been charged. Please try again.";

    /* ---------- Booking from the URL ---------- */
    function readBooking() {
        const params = new URLSearchParams(location.search);
        const listing = W.listings.find(l => l.id === params.get("property"));
        const start = parseISODate(params.get("checkin"));
        const end = parseISODate(params.get("checkout"));
        if (!listing || !start || !end || end <= start) return { error: "missing" };

        const adults = Math.max(1, parseInt(params.get("adults"), 10) || 1);
        const children = Math.max(0, parseInt(params.get("children"), 10) || 0);
        const nights = nightsBetween(start, end);
        const trip = { checkin: params.get("checkin"), checkout: params.get("checkout"), adults, children };
        const editUrl = `${listing.url}?${new URLSearchParams(trip)}`;
        const booking = {
            listing, start, end, nights, adults, children, editUrl,
            propertyId: listing.id,
            ...trip,
            subtotal: listing.pricePerNight * nights,
            // No cleaning or service fees exist in the data, so the total is nights × rate.
            total: listing.pricePerNight * nights
        };

        const maxGuests = listing.details && listing.details.maxGuests;
        if (start < parseISODate(toISODate(new Date()))) return { error: "past", booking };
        if (maxGuests && adults + children > maxGuests) return { error: "guests", booking, maxGuests };
        return { booking };
    }

    const longDate = date => date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    const guestText = b => `${plural(b.adults, "adult")}${b.children ? `, ${b.children} ${b.children === 1 ? "child" : "children"}` : ""}`;

    /* ---------- Idempotency key: one per booking attempt, reused across retries ---------- */
    function idempotencyKey(b) {
        const storageKey = `ws-pay:${b.propertyId}:${b.checkin}:${b.checkout}:${b.adults}:${b.children}`;
        const make = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
        try {
            let key = sessionStorage.getItem(storageKey);
            if (!key) { key = make(); sessionStorage.setItem(storageKey, key); }
            return { value: key, clear: () => { try { sessionStorage.removeItem(storageKey); } catch (_) {} } };
        } catch (_) {
            const key = make();
            return { value: key, clear() {} };
        }
    }

    /* ==========================================================================
       Components
       ========================================================================== */
    function Steps(current) {
        const steps = ["Trip details", "Confirm and pay", "Booking confirmed"];
        return `
            <ol class="checkout-steps" aria-label="Booking progress">
                ${steps.map((label, i) => {
                    const state = i < current ? "is-done" : i === current ? "is-current" : "";
                    return `<li class="${state}"${i === current ? ' aria-current="step"' : ""}>
                        <span class="step-dot" aria-hidden="true">${i < current ? icon("check") : i + 1}</span>
                        <span class="step-label">${label}</span>
                    </li>`;
                }).join("")}
            </ol>`;
    }

    function BookingSummary(b, { collapsible = true, paid = false } = {}) {
        const { listing } = b;
        const body = `
            <div class="summary-stay">
                <img src="${escapeHtml(listing.image)}" alt="" width="96" height="80">
                <div>
                    <p class="summary-type">${escapeHtml(listing.details ? listing.details.type : listing.type)}</p>
                    <h3>${escapeHtml(listing.name)}</h3>
                    <p class="summary-location">${icon("pin")}${escapeHtml(listing.location)}</p>
                </div>
            </div>
            <div class="summary-section">
                <div class="summary-section-head">
                    <h3>Your trip</h3>
                    ${paid ? "" : `<a class="summary-edit" href="${escapeHtml(b.editUrl)}">Edit<span class="visually-hidden"> trip details</span></a>`}
                </div>
                <dl class="summary-list">
                    <div><dt>Check-in</dt><dd>${escapeHtml(longDate(b.start))}</dd></div>
                    <div><dt>Check-out</dt><dd>${escapeHtml(longDate(b.end))}</dd></div>
                    <div><dt>Guests</dt><dd>${escapeHtml(guestText(b))}</dd></div>
                </dl>
            </div>
            <div class="summary-section">
                <h3>Price details</h3>
                <dl class="summary-list">
                    <div><dt>${peso.format(listing.pricePerNight)} × ${plural(b.nights, "night")}</dt><dd>${peso.format(b.subtotal)}</dd></div>
                    <div class="summary-total"><dt>${paid ? "Total paid" : "Total"} (PHP)</dt><dd>${peso.format(b.total)}</dd></div>
                </dl>
            </div>`;
        return `
            <section class="summary-card${collapsible ? " is-collapsible" : ""}" aria-labelledby="summary-heading">
                <h2 class="summary-heading" id="summary-heading">Booking summary</h2>
                ${collapsible ? `
                    <button type="button" class="summary-toggle" aria-expanded="false" aria-controls="summary-body">
                        <span>${icon("card")}Booking summary</span>
                        <span class="summary-toggle-total">${peso.format(b.total)}${icon("chevron")}</span>
                    </button>` : ""}
                <div class="summary-body" id="summary-body">${body}</div>
            </section>`;
    }

    function PaymentMethodSelector(selected) {
        const options = Gateway.methods.filter(m => METHODS[m]).map(key => {
            const m = METHODS[key];
            const logo = m.logo
                ? `<img class="method-logo" src="${m.logo}" alt="" width="40" height="40">`
                : `<span class="method-logo is-icon">${icon("card")}</span>`;
            return `
                <label class="method-option">
                    <input type="radio" name="payment-method" value="${key}"${key === selected ? " checked" : ""}>
                    ${logo}
                    <span class="method-text">
                        <span class="method-name">${escapeHtml(m.label)}</span>
                        <span class="method-desc">${escapeHtml(m.short)}</span>
                    </span>
                    <span class="method-check" aria-hidden="true">${icon("check")}</span>
                </label>`;
        }).join("");
        return `
            <fieldset class="method-group">
                <legend><h2>Pay with</h2></legend>
                <div class="method-list">${options}</div>
            </fieldset>`;
    }

    /* Placeholder card fields. They have no `name`, are never submitted, logged or
       stored, and are never passed to the gateway. Replace them with the provider's
       hosted fields when one is connected (keep the labels and layout). */
    function CardForm() {
        return `
            <div class="card-form">
                <div class="field">
                    <label for="card-name">Name on card</label>
                    <input type="text" id="card-name" autocomplete="cc-name" autocapitalize="words" spellcheck="false" aria-describedby="card-name-error">
                    <p class="field-error" id="card-name-error" aria-live="polite"></p>
                </div>
                <div class="field">
                    <label for="card-number">Card number</label>
                    <div class="input-wrap card-number-wrap">
                        ${icon("card")}
                        <input type="text" id="card-number" inputmode="numeric" autocomplete="cc-number" placeholder="1234 1234 1234 1234" maxlength="23" aria-describedby="card-number-error card-brand">
                        <span class="card-brand" id="card-brand" aria-live="polite"></span>
                    </div>
                    <p class="field-error" id="card-number-error" aria-live="polite"></p>
                </div>
                <div class="field-row">
                    <div class="field">
                        <label for="card-expiry">Expiry date</label>
                        <input type="text" id="card-expiry" inputmode="numeric" autocomplete="cc-exp" placeholder="MM / YY" maxlength="7" aria-describedby="card-expiry-error">
                        <p class="field-error" id="card-expiry-error" aria-live="polite"></p>
                    </div>
                    <div class="field">
                        <div class="label-row">
                            <label for="card-cvc">Security code</label>
                            <button type="button" class="info-button" id="cvc-info" aria-expanded="false" aria-controls="cvc-help" aria-label="Where to find the security code">${icon("info")}</button>
                        </div>
                        <input type="text" id="card-cvc" inputmode="numeric" autocomplete="cc-csc" placeholder="CVC" maxlength="4" aria-describedby="card-cvc-error">
                        <p class="toggletip" id="cvc-help" hidden>The 3-digit code on the back of your card. American Express cards have a 4-digit code on the front.</p>
                        <p class="field-error" id="card-cvc-error" aria-live="polite"></p>
                    </div>
                </div>
            </div>`;
    }

    function WalletInfo(key, total) {
        const m = METHODS[key];
        return `
            <div class="wallet-info">
                <span class="wallet-info-icon">${icon("smartphone")}</span>
                <p>After you select <strong>Pay</strong>, you'll go to ${escapeHtml(m.label)} to log in and approve
                <strong>${peso.format(total)}</strong>. You'll come back here when it's done.</p>
            </div>`;
    }

    function PayButton() {
        const trust = Gateway.configured && Gateway.name
            ? `Payments are processed securely by ${escapeHtml(Gateway.name)}.`
            : "Online payment isn't connected yet. Nothing you enter on this page is sent or stored.";
        return `
            <div class="pay-area">
                <button type="submit" class="pay-button" id="pay-button">
                    <span class="spinner" aria-hidden="true"></span>
                    <span class="btn-label" id="pay-label">Pay</span>
                </button>
                <p class="pay-trust">${icon("lock")}<span>${trust}</span></p>
            </div>`;
    }

    function StatusBanner(kind, html) {
        const iconName = kind === "error" ? "alert" : kind === "pending" ? "clock" : "info";
        return `<div class="status-banner is-${kind}" role="${kind === "error" ? "alert" : "status"}">${icon(iconName)}<div>${html}</div></div>`;
    }

    function Confirmation(b, reference) {
        return `
            <div class="container checkout-container">
                <div class="checkout-head">${Steps(2)}</div>
                <section class="confirmation" aria-labelledby="confirm-title">
                    <span class="confirmation-icon">${icon("circle-check")}</span>
                    <h1 id="confirm-title" tabindex="-1">Your booking is confirmed</h1>
                    <p>Booking reference <strong class="confirmation-ref">${escapeHtml(reference || "—")}</strong></p>
                    ${BookingSummary(b, { collapsible: false, paid: true })}
                    <div class="confirmation-actions">
                        <a class="btn btn-primary" href="index.html">Back to home</a>
                        <a class="btn btn-outline" href="menu.html">Your account</a>
                    </div>
                </section>
            </div>`;
    }

    function TripProblem(result) {
        const b = result.booking;
        const copy = {
            missing: ["There's no trip to pay for yet", "Choose a stay and your dates, then select Reserve to continue to payment.", "index.html#stays", "Browse stays"],
            past: ["These dates have already passed", "Choose new dates for your stay to continue.", b && b.editUrl, "Choose new dates"],
            guests: ["Too many guests for this stay", `This stay allows up to ${plural(result.maxGuests || 1, "guest")}. Update your trip to continue.`, b && b.editUrl, "Update your trip"]
        }[result.error];
        return `
            <div class="container checkout-container">
                <div class="empty-state checkout-empty">
                    <div class="feature-icon">${icon("card")}</div>
                    <h1>${copy[0]}</h1>
                    <p>${copy[1]}</p>
                    <a class="btn btn-primary" href="${escapeHtml(copy[2])}">${copy[3]}</a>
                </div>
            </div>`;
    }

    /* ==========================================================================
       Card field formatting + validation (placeholder fields only)
       ========================================================================== */
    const digitsOf = value => value.replace(/\D/g, "");

    function cardBrand(digits) {
        if (/^4/.test(digits)) return { name: "Visa", lengths: [13, 16, 19], cvc: 3, groups: [4, 4, 4, 4, 3] };
        if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(digits)) return { name: "Mastercard", lengths: [16], cvc: 3, groups: [4, 4, 4, 4] };
        if (/^3[47]/.test(digits)) return { name: "American Express", lengths: [15], cvc: 4, groups: [4, 6, 5] };
        if (/^35/.test(digits)) return { name: "JCB", lengths: [16, 19], cvc: 3, groups: [4, 4, 4, 4, 3] };
        return { name: "", lengths: [16, 19], cvc: 3, groups: [4, 4, 4, 4, 3] };
    }

    function luhn(digits) {
        let sum = 0;
        for (let i = 0; i < digits.length; i++) {
            let d = Number(digits[digits.length - 1 - i]);
            if (i % 2) { d *= 2; if (d > 9) d -= 9; }
            sum += d;
        }
        return sum % 10 === 0;
    }

    // Reformat while keeping the caret after the same number of digits.
    function reformat(input, format) {
        const caretDigits = digitsOf(input.value.slice(0, input.selectionStart || 0)).length;
        const formatted = format(digitsOf(input.value));
        input.value = formatted;
        let pos = 0;
        let seen = 0;
        while (pos < formatted.length && seen < caretDigits) {
            if (/\d/.test(formatted[pos])) seen++;
            pos++;
        }
        if (document.activeElement === input) input.setSelectionRange(pos, pos);
    }

    function formatCardNumber(digits) {
        const brand = cardBrand(digits);
        const max = Math.max(...brand.lengths);
        digits = digits.slice(0, max);
        const parts = [];
        let i = 0;
        for (const size of brand.groups) {
            if (i >= digits.length) break;
            parts.push(digits.slice(i, i + size));
            i += size;
        }
        return parts.join(" ");
    }

    function formatExpiry(digits) {
        if (digits.length === 1 && Number(digits) > 1) digits = `0${digits}`;
        digits = digits.slice(0, 4);
        return digits.length > 2 ? `${digits.slice(0, 2)} / ${digits.slice(2)}` : digits;
    }

    const CARD_RULES = {
        "card-name": value => value.trim() ? "" : "Enter the name on your card.",
        "card-number": value => {
            const digits = digitsOf(value);
            if (!digits) return "Enter your card number.";
            const brand = cardBrand(digits);
            if (digits.length < Math.min(...brand.lengths)) return "Card number is incomplete.";
            if (!brand.lengths.includes(digits.length) || !luhn(digits)) return "Card number isn't valid. Check it and try again.";
            return "";
        },
        "card-expiry": value => {
            const digits = digitsOf(value);
            if (!digits) return "Enter the expiry date.";
            if (digits.length < 4) return "Expiry date is incomplete.";
            const month = Number(digits.slice(0, 2));
            const year = 2000 + Number(digits.slice(2, 4));
            if (month < 1 || month > 12) return "Expiry month isn't valid.";
            const now = new Date();
            if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) return "Card has expired.";
            return "";
        },
        "card-cvc": value => {
            const digits = digitsOf(value);
            const needed = cardBrand(digitsOf($("#card-number").value)).cvc;
            if (!digits) return "Enter the security code.";
            if (digits.length < needed) return "Security code is incomplete.";
            return "";
        }
    };

    /* ==========================================================================
       Page controller
       ========================================================================== */
    let pollTimer = null;

    function init() {
        clearTimeout(pollTimer);
        const result = readBooking();
        if (result.error) {
            root.innerHTML = TripProblem(result);
            return;
        }
        const booking = result.booking;
        const params = new URLSearchParams(location.search);
        const returnStatus = params.get("payment_status");
        const reference = params.get("reference");

        if (returnStatus === "success" || returnStatus === "pending") {
            confirmReturn(booking, reference);
            return;
        }
        renderCheckout(booking, params);
    }

    function renderCheckout(booking, params) {
        let method = params.get("method");
        if (!Gateway.methods.includes(method)) method = Gateway.methods[0];

        root.innerHTML = `
            <div class="container checkout-container">
                <div class="checkout-head">
                    <a class="back-link" href="${escapeHtml(booking.editUrl)}">${icon("chevron")}Back to ${escapeHtml(booking.listing.name)}</a>
                    ${Steps(1)}
                    <h1>Confirm and pay</h1>
                </div>
                <div class="checkout-layout">
                    <aside class="checkout-summary">${BookingSummary(booking)}</aside>
                    <div class="checkout-main">
                        <div class="checkout-status" id="checkout-status"></div>
                        <form id="checkout-form" class="checkout-form" novalidate>
                            ${PaymentMethodSelector(method)}
                            <div class="method-panel" id="method-panel" aria-live="polite"></div>
                            ${PayButton()}
                        </form>
                    </div>
                </div>
            </div>`;

        const status = $("#checkout-status");
        const form = $("#checkout-form");
        const panel = $("#method-panel");
        const payButton = $("#pay-button");
        const payLabel = $("#pay-label");
        const idem = idempotencyKey(booking);
        let processing = false;

        const showStatus = (kind, html) => { status.innerHTML = html ? StatusBanner(kind, html) : ""; };

        if (!Gateway.configured) {
            showStatus("info", "<strong>Online payment isn't available yet.</strong> You can review your trip, but bookings can't be paid for on WanderStay right now.");
        }

        // Messages after returning from a wallet or a failed redirect.
        const returnStatus = params.get("payment_status");
        if (returnStatus === "cancelled") {
            const label = METHODS[method] ? METHODS[method].label : "the payment app";
            showStatus("info", `You cancelled the payment in ${escapeHtml(label)}. You haven't been charged — try again or choose another way to pay.`);
        } else if (returnStatus === "failed") {
            showStatus("error", escapeHtml(errorMessage({ code: params.get("payment_error") })));
        }
        if (returnStatus) {
            const clean = new URLSearchParams(params);
            ["payment_status", "payment_error", "reference"].forEach(k => clean.delete(k));
            history.replaceState(null, "", `${location.pathname}?${clean}`);
        }

        // Mobile: the summary collapses above the form.
        const toggle = $(".summary-toggle");
        if (toggle) {
            toggle.addEventListener("click", () => {
                const open = toggle.getAttribute("aria-expanded") !== "true";
                toggle.setAttribute("aria-expanded", String(open));
                toggle.closest(".summary-card").classList.toggle("is-open", open);
            });
        }

        const cardValid = () => Object.keys(CARD_RULES).every(id => !CARD_RULES[id]($(`#${id}`).value));

        function updatePayButton() {
            const m = METHODS[method];
            const amount = peso.format(booking.total);
            if (!processing) payLabel.textContent = m.redirect ? `Pay ${amount} with ${m.label}` : `Pay ${amount}`;
            payButton.disabled = processing || (method === "card" && !cardValid());
        }

        function setFieldError(input, message) {
            const error = $(`#${input.id}-error`);
            input.setAttribute("aria-invalid", message ? "true" : "false");
            error.innerHTML = message ? `${icon("alert")}<span>${escapeHtml(message)}</span>` : "";
        }

        function wireCardForm() {
            const touched = new Set();
            const check = (input, force) => {
                if (!force && !touched.has(input.id)) return;
                setFieldError(input, CARD_RULES[input.id](input.value));
            };
            const number = $("#card-number");
            const expiry = $("#card-expiry");
            const cvc = $("#card-cvc");
            const brandEl = $("#card-brand");

            number.addEventListener("input", () => {
                reformat(number, formatCardNumber);
                const brand = cardBrand(digitsOf(number.value));
                brandEl.textContent = brand.name;
                brandEl.hidden = !brand.name;
                cvc.maxLength = brand.cvc;
            });
            expiry.addEventListener("input", e => {
                // Let backspace remove the " / " separator naturally.
                if (e.inputType === "deleteContentBackward" && /\s\/\s?$/.test(expiry.value)) {
                    expiry.value = expiry.value.replace(/\s\/\s?$/, "");
                }
                reformat(expiry, formatExpiry);
            });
            cvc.addEventListener("input", () => { cvc.value = digitsOf(cvc.value).slice(0, cvc.maxLength); });

            Object.keys(CARD_RULES).forEach(id => {
                const input = $(`#${id}`);
                input.addEventListener("blur", () => { if (input.value) touched.add(id); check(input); });
                input.addEventListener("input", () => { check(input); updatePayButton(); });
            });
            $("#card-brand").hidden = true;

            // CVC toggletip
            const info = $("#cvc-info");
            const help = $("#cvc-help");
            const setTip = open => { info.setAttribute("aria-expanded", String(open)); help.hidden = !open; };
            info.addEventListener("click", () => setTip(help.hidden));
            info.addEventListener("keydown", e => { if (e.key === "Escape") setTip(false); });
            document.addEventListener("click", e => { if (!e.target.closest("#cvc-info")) setTip(false); });

            return { touchAll: () => Object.keys(CARD_RULES).forEach(id => { touched.add(id); check($(`#${id}`), true); }) };
        }

        let card = null;
        function renderPanel(animate) {
            panel.innerHTML = method === "card" ? CardForm() : WalletInfo(method, booking.total);
            panel.classList.toggle("is-entering", Boolean(animate));
            card = method === "card" ? wireCardForm() : null;
            updatePayButton();
        }

        form.addEventListener("change", e => {
            if (e.target.name !== "payment-method" || processing) return;
            method = e.target.value;
            const next = new URLSearchParams(location.search);
            next.set("method", method);
            history.replaceState(null, "", `${location.pathname}?${next}`);
            renderPanel(true);
        });

        function setProcessing(on) {
            processing = on;
            payButton.classList.toggle("is-loading", on);
            form.setAttribute("aria-busy", String(on));
            $$("input[name=payment-method]", form).forEach(r => { r.disabled = on; });
            payLabel.textContent = on ? "Processing…" : "";
            updatePayButton();
        }

        form.addEventListener("submit", async e => {
            e.preventDefault();
            if (processing) return; // never start a second charge
            if (method === "card" && !cardValid()) {
                card.touchAll();
                const firstBad = $$(".card-form input", form).find(i => i.getAttribute("aria-invalid") === "true");
                if (firstBad) firstBad.focus();
                return;
            }
            showStatus("", "");
            setProcessing(true);

            const here = new URL(location.href);
            here.searchParams.set("method", method);
            const returnUrl = new URL(here);
            returnUrl.searchParams.set("payment_status", "pending");
            const cancelUrl = new URL(here);
            cancelUrl.searchParams.set("payment_status", "cancelled");

            try {
                const outcome = await Gateway.pay({
                    method,
                    booking: {
                        propertyId: booking.propertyId,
                        checkin: booking.checkin,
                        checkout: booking.checkout,
                        adults: booking.adults,
                        children: booking.children
                    },
                    amount: booking.total,
                    currency: "PHP",
                    idempotencyKey: idem.value,
                    returnUrl: returnUrl.href,
                    cancelUrl: cancelUrl.href
                });
                if (outcome && outcome.status === "redirect" && outcome.url) {
                    payLabel.textContent = `Opening ${METHODS[method].label}…`;
                    window.location.assign(outcome.url);
                    return;
                }
                if (outcome && outcome.status === "paid") {
                    idem.clear();
                    showConfirmation(booking, outcome.reference);
                    return;
                }
                if (outcome && outcome.status === "pending") {
                    confirmReturn(booking, outcome.reference);
                    return;
                }
                throw { code: "payment_failed" };
            } catch (err) {
                setProcessing(false);
                const extra = err && err.code === "unavailable"
                    ? ` <a href="${escapeHtml(booking.editUrl)}">Choose different dates</a>`
                    : "";
                showStatus("error", escapeHtml(errorMessage(err)) + extra);
                status.scrollIntoView({ block: "nearest", behavior: "smooth" });
            }
        });

        renderPanel(false);
    }

    function showConfirmation(booking, reference) {
        const params = new URLSearchParams(location.search);
        ["method", "payment_error"].forEach(k => params.delete(k));
        params.set("payment_status", "success");
        if (reference) params.set("reference", reference);
        // A refresh re-verifies with the server instead of showing the pay form again.
        history.replaceState(null, "", `${location.pathname}?${params}`);
        root.innerHTML = Confirmation(booking, reference);
        $("#confirm-title").focus();
    }

    // After a redirect (or a pending result) the booking is only confirmed once the
    // server says so; the redirect itself proves nothing.
    function confirmReturn(booking, reference) {
        root.innerHTML = `
            <div class="container checkout-container">
                <div class="checkout-head">${Steps(1)}</div>
                <section class="confirming" aria-live="polite" aria-busy="true">
                    <span class="spinner is-dark" aria-hidden="true"></span>
                    <h1>Confirming your payment</h1>
                    <p>This usually takes a few seconds. Please don't close this page or pay again.</p>
                </section>
            </div>`;

        let attempts = 0;
        const back = () => {
            const params = new URLSearchParams(location.search);
            ["payment_status", "reference"].forEach(k => params.delete(k));
            return params;
        };
        const fail = code => {
            const params = back();
            params.set("payment_status", "failed");
            if (code) params.set("payment_error", code);
            history.replaceState(null, "", `${location.pathname}?${params}`);
            init();
        };
        const check = async () => {
            attempts++;
            try {
                const res = await Gateway.verify(reference);
                if (res && res.status === "paid") { idempotencyKey(booking).clear(); showConfirmation(booking, res.reference || reference); return; }
                if (res && res.status === "failed") { fail(res.code || "payment_failed"); return; }
            } catch (err) {
                if (err && err.code === "not_configured") { fail("not_configured"); return; }
                // Network hiccup: keep trying below.
            }
            if (attempts < 10) {
                pollTimer = setTimeout(check, 3000);
            } else {
                const section = $(".confirming");
                section.setAttribute("aria-busy", "false");
                section.innerHTML = `
                    <span class="confirming-icon">${icon("clock")}</span>
                    <h1>We're still confirming your payment</h1>
                    <p>This can take a few minutes. Please don't pay again — check back shortly.</p>
                    <button type="button" class="btn btn-primary" id="check-again">Check again</button>`;
                $("#check-again").addEventListener("click", () => confirmReturn(booking, reference));
            }
        };
        if (!reference) { fail("payment_failed"); return; }
        check();
    }

    init();
})();
