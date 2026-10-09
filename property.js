/* WanderStay — property detail page (house1–8.html).
   Each page is a shell: <main data-property="houseN">. Everything is rendered from
   the matching listing in listings.js by the components below. Depends on the
   shared helpers that script.js exposes as window.WanderStay. */
(function () {
    "use strict";

    const W = window.WanderStay;
    const root = document.querySelector("main[data-property]");
    if (!W || !root) return;

    const { $, $$, escapeHtml, icon, peso, plural, toISODate, parseISODate, nightsBetween, formatDay, linkDateInputs } = W;
    const listing = W.listings.find(l => l.id === root.dataset.property);

    if (!listing || !listing.details) {
        root.innerHTML = `
            <div class="empty-state property-missing">
                <div class="feature-icon">${icon("home")}</div>
                <h1>We couldn't find this stay</h1>
                <p>It may have been removed. Explore the stays we currently have instead.</p>
                <a class="btn btn-primary" href="index.html#stays">Browse stays</a>
            </div>`;
        return;
    }

    const details = listing.details;
    const photos = details.photos || [];
    const amenities = details.amenities || [];
    const maxGuests = details.maxGuests || 1;
    const fullLocation = `${listing.location}, Philippines`;

    /* ---------- Amenity → icon/category mapping (first match wins) ---------- */
    const AMENITY_RULES = [
        [/wi-?fi|internet/i, "wifi", "Internet and entertainment"],
        [/\btv\b|netflix/i, "tv", "Internet and entertainment"],
        [/game/i, "gamepad", "Building facilities"],
        [/fitness|gym|function room/i, "dumbbell", "Building facilities"],
        [/pool/i, "waves", "Pool and wellness"],
        [/nespresso|coffee|mini ?bar/i, "coffee", "Kitchen and dining"],
        [/caf[eé]|restaurant|kitchen|dining/i, "utensils", "Kitchen and dining"],
        [/heater|blanket/i, "flame", "Heating and cooling"],
        [/air ?condition/i, "snowflake", "Heating and cooling"],
        [/bbq|grill/i, "flame", "Outdoor"],
        [/balcony|terrace|view/i, "sunset", "Outdoor"],
        [/bathtub|\bbath\b/i, "bath", "Bathroom"],
        [/shower/i, "droplets", "Bathroom"],
        [/parking/i, "car", "Parking"],
        [/housekeeping|cleaning|spa|wellness/i, "sparkle", "Services"]
    ];
    function amenityInfo(name) {
        const rule = AMENITY_RULES.find(([pattern]) => pattern.test(name));
        return rule ? { icon: rule[1], category: rule[2] } : { icon: "check", category: "Other" };
    }
    const AMENITY_PREVIEW = 6;

    /* ---------- Dialog helper: focus return + backdrop click ---------- */
    // Cleanup watches the `open` attribute rather than the async "close" event, so it
    // runs immediately however the dialog was closed (Esc, button, backdrop, code).
    function setupDialog(dialog, onClose) {
        let opener = null;
        dialog.addEventListener("click", e => { if (e.target === dialog) dialog.close(); });
        new MutationObserver(() => {
            if (dialog.open) return;
            document.documentElement.classList.remove("has-dialog");
            if (onClose) onClose();
            if (opener && document.contains(opener)) opener.focus();
            opener = null;
        }).observe(dialog, { attributes: true, attributeFilter: ["open"] });
        $$("[data-dialog-close]", dialog).forEach(btn => btn.addEventListener("click", () => dialog.close()));
        return {
            open() {
                opener = document.activeElement;
                document.documentElement.classList.add("has-dialog");
                dialog.showModal();
            }
        };
    }

    /* ==========================================================================
       Components (each returns markup; wiring happens after render)
       ========================================================================== */
    function PropertyHeader() {
        let back = "";
        try {
            const ref = document.referrer ? new URL(document.referrer) : null;
            if (ref && ref.origin === location.origin && ref.pathname.endsWith("/search-results.html")) {
                back = `<a class="back-link" href="${escapeHtml(ref.href)}">${icon("chevron")}Back to results</a>`;
            }
        } catch (_) { /* malformed referrer */ }

        const rating = typeof listing.rating === "number" && listing.reviews
            ? `<span class="property-rating">${icon("star")}<strong>${listing.rating.toFixed(2).replace(/0$/, "")}</strong><span class="dot" aria-hidden="true">·</span>${plural(listing.reviews, "review")}</span><span class="dot" aria-hidden="true">·</span>`
            : "";

        return `
            <header class="property-header">
                ${back}
                <div class="property-title-row">
                    <div class="property-title">
                        <h1>${escapeHtml(listing.name)}</h1>
                        <p class="property-meta">
                            ${rating}
                            <span class="property-location">${icon("pin")}${escapeHtml(fullLocation)}</span>
                        </p>
                    </div>
                    <div class="property-actions">
                        <button type="button" class="btn btn-ghost property-share" id="share-button">
                            ${icon("share")}<span class="share-label">Share</span>
                        </button>
                    </div>
                </div>
            </header>`;
    }

    function PhotoGallery() {
        if (!photos.length) {
            return `<div class="gallery gallery-empty">${icon("image")}<span>Photos coming soon</span></div>`;
        }
        // Every photo is a tile so the mobile carousel can swipe through all of them;
        // on desktop CSS shows at most five in the grid.
        const tiles = photos.map((photo, i) => `
            <button type="button" class="gallery-tile" data-photo="${i}" aria-label="Open photo ${i + 1} of ${photos.length}: ${escapeHtml(photo.alt)}">
                <img src="${escapeHtml(photo.src)}" alt="${escapeHtml(photo.alt)}" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">
                <span class="gallery-fallback" aria-hidden="true">${icon("image")}</span>
            </button>`).join("");
        return `
            <section class="gallery gallery-count-${Math.min(photos.length, 5)}" aria-label="Photos of ${escapeHtml(listing.name)}">
                <div class="gallery-track" id="gallery-track">${tiles}</div>
                ${photos.length > 1 ? `
                    <button type="button" class="gallery-all" data-photo="0">${icon("grid")}Show all photos</button>
                    <span class="gallery-counter" id="gallery-counter" aria-hidden="true">1 / ${photos.length}</span>` : ""}
            </section>`;
    }

    function PropertyOverview() {
        const facts = [...(details.rooms || []), `Up to ${plural(maxGuests, "guest")}`];
        return `
            <section class="property-section property-overview">
                <h2>${escapeHtml(details.type || listing.type)} in ${escapeHtml(listing.location)}</h2>
                <ul class="property-facts">${facts.map(f => `<li>${escapeHtml(f)}</li>`).join("")}</ul>
            </section>`;
    }

    function PropertyDescription() {
        if (!details.description) return "";
        return `
            <section class="property-section" aria-labelledby="about-title">
                <h2 id="about-title">About this place</h2>
                <p class="property-description" id="property-description">${escapeHtml(details.description)}</p>
                <button type="button" class="text-button" id="description-toggle" aria-controls="property-description" aria-expanded="false" hidden>Show more</button>
            </section>`;
    }

    function amenityItem(name) {
        return `<li class="amenity">${icon(amenityInfo(name).icon)}<span>${escapeHtml(name)}</span></li>`;
    }

    function AmenitiesList() {
        if (!amenities.length) return "";
        const more = amenities.length > AMENITY_PREVIEW;
        return `
            <section class="property-section" aria-labelledby="amenities-title">
                <h2 id="amenities-title">What this place offers</h2>
                <ul class="amenities-grid">${amenities.slice(0, AMENITY_PREVIEW).map(amenityItem).join("")}</ul>
                ${more ? `<button type="button" class="btn btn-outline amenities-all" id="amenities-open">Show all ${amenities.length} amenities</button>` : ""}
            </section>`;
    }

    function AmenitiesDialog() {
        if (amenities.length <= AMENITY_PREVIEW) return "";
        const groups = new Map();
        amenities.forEach(name => {
            const { category } = amenityInfo(name);
            if (!groups.has(category)) groups.set(category, []);
            groups.get(category).push(name);
        });
        const body = [...groups].map(([category, names]) => `
            <section class="amenity-group">
                <h3>${escapeHtml(category)}</h3>
                <ul>${names.map(amenityItem).join("")}</ul>
            </section>`).join("");
        return `
            <dialog class="modal-dialog" id="amenities-dialog" aria-labelledby="amenities-dialog-title">
                <div class="modal-dialog-head">
                    <h2 id="amenities-dialog-title">What this place offers</h2>
                    <button type="button" class="icon-btn" data-dialog-close aria-label="Close amenities">${icon("x")}</button>
                </div>
                <div class="modal-dialog-body">${body}</div>
            </dialog>`;
    }

    function LocationMap() {
        if (!details.map) return "";
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(details.map.place)}`;
        return `
            <section class="property-section" aria-labelledby="location-title">
                <h2 id="location-title">Where you'll be</h2>
                <div class="map-frame">
                    <iframe src="${escapeHtml(details.map.embed)}" title="Map showing ${escapeHtml(details.map.place)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
                </div>
                <div class="map-meta">
                    <p><strong>${escapeHtml(fullLocation)}</strong></p>
                    <a class="link-arrow" href="${escapeHtml(mapsUrl)}" target="_blank" rel="noopener">Open in Google Maps ${icon("external")}<span class="visually-hidden">(opens in a new tab)</span></a>
                </div>
            </section>`;
    }

    function stepper(id, label) {
        return `
            <div class="guest-row" role="group" aria-labelledby="${id}-label">
                <span class="guest-label" id="${id}-label">${label}</span>
                <div class="stepper">
                    <button type="button" class="stepper-btn" data-step="${id}" data-delta="-1" aria-label="Fewer ${label.toLowerCase()}">${icon("minus")}</button>
                    <output class="stepper-value" id="${id}-count" aria-live="polite">0</output>
                    <button type="button" class="stepper-btn" data-step="${id}" data-delta="1" aria-label="More ${label.toLowerCase()}">${icon("plus")}</button>
                </div>
            </div>`;
    }

    function BookingCard() {
        return `
            <div class="booking-card" id="booking-card">
                <p class="booking-price"><strong>${peso.format(listing.pricePerNight)}</strong> <span>/ night</span></p>
                <form id="booking-form" class="booking-form" novalidate>
                    <div class="field-row">
                        <div class="field">
                            <label for="checkin">Check-in</label>
                            <div class="input-wrap">
                                ${icon("calendar")}
                                <input type="date" id="checkin" name="checkin" required aria-describedby="checkin-error">
                            </div>
                            <p class="field-error" id="checkin-error" aria-live="polite"></p>
                        </div>
                        <div class="field">
                            <label for="checkout">Check-out</label>
                            <div class="input-wrap">
                                ${icon("calendar")}
                                <input type="date" id="checkout" name="checkout" required aria-describedby="checkout-error">
                            </div>
                            <p class="field-error" id="checkout-error" aria-live="polite"></p>
                        </div>
                    </div>

                    <fieldset class="guest-picker">
                        <legend>Guests</legend>
                        ${stepper("adults", "Adults")}
                        ${stepper("children", "Children")}
                        <p class="guest-limit" id="guest-limit">This place allows up to ${plural(maxGuests, "guest")}.</p>
                    </fieldset>

                    <button type="submit" class="booking-submit">
                        <span class="spinner" aria-hidden="true"></span>
                        <span class="btn-label">Reserve</span>
                    </button>
                </form>

                <div class="price-breakdown" id="price-breakdown" aria-live="polite" hidden></div>
            </div>`;
    }

    function MobileBookingBar() {
        return `
            <div class="booking-bar" id="booking-bar">
                <div class="booking-bar-info">
                    <strong id="bar-price">${peso.format(listing.pricePerNight)}</strong> <span id="bar-unit">/ night</span>
                    <span class="booking-bar-dates" id="bar-dates">Add dates</span>
                </div>
                <button type="button" class="btn btn-primary" id="booking-bar-open">Reserve</button>
            </div>
            <dialog class="booking-sheet" id="booking-sheet" aria-labelledby="booking-sheet-title">
                <div class="modal-dialog-head">
                    <h2 id="booking-sheet-title">Book your stay</h2>
                    <button type="button" class="icon-btn" data-dialog-close aria-label="Close booking">${icon("x")}</button>
                </div>
                <div class="booking-sheet-body" id="booking-sheet-body"></div>
            </dialog>`;
    }

    function Lightbox() {
        if (!photos.length) return "";
        return `
            <dialog class="lightbox" id="lightbox" aria-label="Photos of ${escapeHtml(listing.name)}">
                <div class="lightbox-top">
                    <span class="lightbox-counter" id="lightbox-counter" aria-live="polite"></span>
                    <button type="button" class="icon-btn lightbox-close" data-dialog-close aria-label="Close photos">${icon("x")}</button>
                </div>
                <div class="lightbox-stage" id="lightbox-stage">
                    <button type="button" class="lightbox-nav is-prev" id="lightbox-prev" aria-label="Previous photo">${icon("chevron")}</button>
                    <figure class="lightbox-figure">
                        <img id="lightbox-image" alt="">
                        <figcaption id="lightbox-caption"></figcaption>
                    </figure>
                    <button type="button" class="lightbox-nav is-next" id="lightbox-next" aria-label="Next photo">${icon("chevron")}</button>
                </div>
            </dialog>`;
    }

    /* ==========================================================================
       Render
       ========================================================================== */
    document.title = `${listing.name} | WanderStay`;
    root.classList.add("property-page");
    root.innerHTML = `
        <div class="container">
            ${PropertyHeader()}
            ${PhotoGallery()}
            <div class="property-layout">
                <div class="property-content">
                    ${PropertyOverview()}
                    ${PropertyDescription()}
                    ${AmenitiesList()}
                    ${LocationMap()}
                </div>
                <aside class="booking-column" id="booking-column" aria-label="Book this stay">
                    ${BookingCard()}
                </aside>
            </div>
        </div>
        ${MobileBookingBar()}
        ${Lightbox()}
        ${AmenitiesDialog()}`;

    /* ---------- Gallery: loading states, carousel counter ---------- */
    $$(".gallery-tile img").forEach(img => {
        const tile = img.closest(".gallery-tile");
        const done = () => tile.classList.add("is-loaded");
        const fail = () => tile.classList.add("is-broken");
        if (img.complete) (img.naturalWidth ? done : fail)();
        else {
            img.addEventListener("load", done, { once: true });
            img.addEventListener("error", fail, { once: true });
        }
    });

    const track = $("#gallery-track");
    const counter = $("#gallery-counter");
    if (track && counter) {
        // On mobile the gallery is a swipeable strip; keep the "1 / n" counter in sync.
        track.addEventListener("scroll", () => {
            const index = Math.round(track.scrollLeft / track.clientWidth);
            counter.textContent = `${Math.min(index + 1, photos.length)} / ${photos.length}`;
        }, { passive: true });
    }

    /* ---------- Lightbox ---------- */
    const lightboxEl = $("#lightbox");
    if (lightboxEl) {
        const lightbox = setupDialog(lightboxEl);
        const img = $("#lightbox-image");
        const caption = $("#lightbox-caption");
        const count = $("#lightbox-counter");
        const figure = $(".lightbox-figure", lightboxEl);
        let current = 0;

        const show = index => {
            current = (index + photos.length) % photos.length;
            const photo = photos[current];
            figure.classList.remove("is-loaded", "is-broken");
            img.onload = () => figure.classList.add("is-loaded");
            img.onerror = () => figure.classList.add("is-broken");
            img.src = photo.src;
            img.alt = photo.alt;
            caption.textContent = photo.alt;
            count.textContent = `${current + 1} / ${photos.length}`;
            // Warm the next image so arrowing through feels instant.
            new Image().src = photos[(current + 1) % photos.length].src;
        };

        $$("[data-photo]").forEach(btn => btn.addEventListener("click", () => {
            show(Number(btn.dataset.photo));
            lightbox.open();
            $(".lightbox-close", lightboxEl).focus();
        }));
        $("#lightbox-prev").addEventListener("click", () => show(current - 1));
        $("#lightbox-next").addEventListener("click", () => show(current + 1));
        const single = photos.length < 2;
        $("#lightbox-prev").hidden = single;
        $("#lightbox-next").hidden = single;

        lightboxEl.addEventListener("keydown", e => {
            if (e.key === "ArrowLeft") { e.preventDefault(); show(current - 1); }
            if (e.key === "ArrowRight") { e.preventDefault(); show(current + 1); }
        });

        // Swipe on touch screens.
        let startX = null;
        const stage = $("#lightbox-stage");
        stage.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") startX = e.clientX; });
        stage.addEventListener("pointerup", e => {
            if (startX === null) return;
            const dx = e.clientX - startX;
            startX = null;
            if (Math.abs(dx) > 40) show(current + (dx < 0 ? 1 : -1));
        });
        stage.addEventListener("pointercancel", () => { startX = null; });
    }

    /* ---------- Share (Web Share API, copy-link fallback) ---------- */
    const shareBtn = $("#share-button");
    if (shareBtn) {
        const label = $(".share-label", shareBtn);
        const flash = text => {
            label.textContent = text;
            setTimeout(() => { label.textContent = "Share"; }, 2000);
        };
        shareBtn.addEventListener("click", async () => {
            const url = `${location.origin}${location.pathname}`;
            if (navigator.share) {
                try { await navigator.share({ title: listing.name, url }); } catch (_) { /* dismissed */ }
                return;
            }
            try {
                await navigator.clipboard.writeText(url);
                flash("Link copied");
            } catch (_) {
                flash("Couldn't copy link");
            }
        });
    }

    /* ---------- Description "Show more" ---------- */
    const desc = $("#property-description");
    const descToggle = $("#description-toggle");
    if (desc && descToggle) {
        const measure = () => {
            desc.classList.add("is-clamped");
            const overflowing = desc.scrollHeight > desc.clientHeight + 1;
            if (descToggle.getAttribute("aria-expanded") === "true") desc.classList.remove("is-clamped");
            descToggle.hidden = !overflowing && descToggle.getAttribute("aria-expanded") !== "true";
        };
        descToggle.addEventListener("click", () => {
            const expanded = descToggle.getAttribute("aria-expanded") === "true";
            descToggle.setAttribute("aria-expanded", String(!expanded));
            descToggle.textContent = expanded ? "Show more" : "Show less";
            desc.classList.toggle("is-clamped", expanded);
        });
        measure();
        window.addEventListener("resize", measure, { passive: true });
    }

    /* ---------- Amenities dialog ---------- */
    const amenitiesDialog = $("#amenities-dialog");
    if (amenitiesDialog) {
        const dialog = setupDialog(amenitiesDialog);
        $("#amenities-open").addEventListener("click", () => dialog.open());
    }

    /* ==========================================================================
       Booking
       ========================================================================== */
    const form = $("#booking-form");
    const checkin = $("#checkin", form);
    const checkout = $("#checkout", form);
    const breakdown = $("#price-breakdown");
    const submit = $(".booking-submit", form);
    const guestLimit = $("#guest-limit");
    const guests = { adults: 1, children: 0 };

    // Pre-fill from the search (URL parameters), ignoring anything invalid.
    const params = new URLSearchParams(location.search);
    const today = toISODate(new Date());
    const startParam = parseISODate(params.get("checkin"));
    const endParam = parseISODate(params.get("checkout"));
    if (startParam && params.get("checkin") >= today) checkin.value = params.get("checkin");
    if (endParam && checkin.value && params.get("checkout") > checkin.value) checkout.value = params.get("checkout");
    linkDateInputs(checkin, checkout);

    let clamped = false;
    const wantAdults = parseInt(params.get("adults"), 10);
    const wantChildren = parseInt(params.get("children"), 10);
    if (wantAdults > 0) {
        guests.adults = Math.min(wantAdults, maxGuests);
        clamped = wantAdults > maxGuests;
    }
    if (wantChildren > 0) {
        guests.children = Math.min(wantChildren, maxGuests - guests.adults);
        clamped = clamped || wantChildren > guests.children;
    }

    function renderGuests() {
        $("#adults-count").textContent = guests.adults;
        $("#children-count").textContent = guests.children;
        const total = guests.adults + guests.children;
        $$(".stepper-btn", form).forEach(btn => {
            const key = btn.dataset.step;
            const delta = Number(btn.dataset.delta);
            const min = key === "adults" ? 1 : 0;
            btn.disabled = delta < 0 ? guests[key] <= min : total >= maxGuests;
        });
        guestLimit.classList.toggle("is-warning", clamped);
        guestLimit.textContent = clamped
            ? `This place allows up to ${plural(maxGuests, "guest")}, so we've adjusted your party size.`
            : `This place allows up to ${plural(maxGuests, "guest")}.`;
    }
    form.addEventListener("click", e => {
        const btn = e.target.closest(".stepper-btn");
        if (!btn || btn.disabled) return;
        guests[btn.dataset.step] += Number(btn.dataset.delta);
        clamped = false;
        renderGuests();
        syncUrl();
    });

    function currentNights() {
        const start = parseISODate(checkin.value);
        const end = parseISODate(checkout.value);
        return start && end && end > start ? { start, end, nights: nightsBetween(start, end) } : null;
    }

    function renderPrice() {
        const stay = currentNights();
        const barDates = $("#bar-dates");
        if (!stay) {
            breakdown.hidden = true;
            barDates.textContent = "Add dates";
            $("#bar-price").textContent = peso.format(listing.pricePerNight);
            $("#bar-unit").textContent = "/ night";
            return;
        }
        // No cleaning or service fees exist in the data, so the total is nights × rate.
        const total = listing.pricePerNight * stay.nights;
        breakdown.hidden = false;
        breakdown.innerHTML = `
            <div class="breakdown-row">
                <span>${peso.format(listing.pricePerNight)} × ${plural(stay.nights, "night")}</span>
                <span>${peso.format(total)}</span>
            </div>
            <div class="breakdown-row breakdown-total">
                <span>Total</span>
                <span>${peso.format(total)}</span>
            </div>`;
        barDates.textContent = `${formatDay(stay.start)} – ${formatDay(stay.end)}`;
        $("#bar-price").textContent = peso.format(total);
        $("#bar-unit").textContent = "total";
    }

    // Keep the URL in step so a refresh or "back" keeps the selection.
    function syncUrl() {
        const next = new URLSearchParams();
        if (checkin.value) next.set("checkin", checkin.value);
        if (checkout.value) next.set("checkout", checkout.value);
        next.set("adults", guests.adults);
        if (guests.children) next.set("children", guests.children);
        history.replaceState(null, "", `${location.pathname}?${next}`);
    }

    function setError(input, message) {
        const error = $(`#${input.id}-error`, form);
        input.setAttribute("aria-invalid", message ? "true" : "false");
        error.innerHTML = message ? `${icon("alert")}<span>${escapeHtml(message)}</span>` : "";
    }

    [checkin, checkout].forEach(input => input.addEventListener("change", () => {
        if (input.value) setError(input, "");
        if (checkout.value) setError(checkout, "");
        renderPrice();
        syncUrl();
    }));

    function validate() {
        const start = parseISODate(checkin.value);
        const end = parseISODate(checkout.value);
        const todayDate = parseISODate(today);
        let inMsg = "";
        let outMsg = "";
        if (!start) inMsg = "Select a check-in date.";
        else if (start < todayDate) inMsg = "Check-in can't be in the past.";
        if (!end) outMsg = "Select a check-out date.";
        else if (start && end <= start) outMsg = "Check-out must be after check-in.";
        setError(checkin, inMsg);
        setError(checkout, outMsg);
        if (inMsg) checkin.focus();
        else if (outMsg) checkout.focus();
        return !inMsg && !outMsg;
    }

    const setLoading = loading => {
        submit.disabled = loading;
        submit.classList.toggle("is-loading", loading);
        $(".btn-label", submit).textContent = loading ? "Reserving…" : "Reserve";
    };
    window.addEventListener("pageshow", () => setLoading(false));

    // Reserve continues to the existing payment page with the trip details.
    form.addEventListener("submit", e => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        const next = new URLSearchParams({
            property: listing.id,
            checkin: checkin.value,
            checkout: checkout.value,
            adults: guests.adults,
            children: guests.children
        });
        window.location.href = `payment.html?${next}`;
    });

    renderGuests();
    renderPrice();

    /* ---------- Mobile: bottom bar opens the booking card in a sheet ---------- */
    const sheetEl = $("#booking-sheet");
    const card = $("#booking-card");
    const column = $("#booking-column");
    const sheet = setupDialog(sheetEl, () => column.appendChild(card));
    const sheetBody = $("#booking-sheet-body");
    const desktop = window.matchMedia("(min-width: 961px)");

    $("#booking-bar-open").addEventListener("click", () => {
        sheetBody.appendChild(card);
        sheet.open();
        (checkin.value ? $(".booking-submit", card) : checkin).focus();
    });
    desktop.addEventListener("change", e => { if (e.matches && sheetEl.open) sheetEl.close(); });
})();
