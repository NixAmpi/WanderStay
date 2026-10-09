/* WanderStay — shared page behaviour. Every feature checks for its elements first,
   so this file is safe to include on any page. */
(function () {
    "use strict";

    const LISTINGS = window.WANDERSTAY_LISTINGS || [];
    const DESTINATIONS = window.WANDERSTAY_DESTINATIONS || [];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- Helpers ---------- */
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, ch => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        })[ch]);
    }

    function icon(name, extraClass = "") {
        return `<svg class="icon ${extraClass}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
    }

    const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });

    // Dates are handled as local calendar days in YYYY-MM-DD form (the <input type="date"> format).
    function toISODate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }
    function parseISODate(value) {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
        if (!match) return null;
        const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
        return isNaN(date) ? null : date;
    }
    function addDays(date, days) {
        const next = new Date(date);
        next.setDate(next.getDate() + days);
        return next;
    }
    function nightsBetween(start, end) {
        return Math.round((end - start) / 86400000);
    }
    function formatDay(date) {
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    function plural(count, word) {
        return `${count} ${word}${count === 1 ? "" : "s"}`;
    }

    /* ---------- Footer year ---------- */
    $$("[data-year]").forEach(el => { el.textContent = new Date().getFullYear(); });

    /* ---------- Auth (integration point) ----------
       There is no authentication backend yet, so getUser() returns null and every
       visitor is treated as signed out. To connect real auth, replace getUser() and
       signOut() (or set window.WANDERSTAY_USER before this script loads) — the navbar,
       account page and profile page then switch to the signed-in state.
       User shape (every field optional except one of name/email):
       { name, email, phone, avatar, createdAt }   // createdAt: ISO date string */
    const Auth = window.WanderStayAuth = {
        getUser() {
            return window.WANDERSTAY_USER || null;
        },
        // Async version used by the profile page; replace with an API call when one exists.
        // Resolve with null when signed out; reject when the profile can't be loaded.
        loadUser() {
            return Promise.resolve(this.getUser());
        },
        // Page where users edit their details. There is none yet, so the Edit profile
        // button and "Add a …" prompts stay hidden until this is set.
        editProfileUrl: null,
        isSignedIn() {
            return Boolean(this.getUser());
        },
        // Should end the session server-side; resolves when done.
        signOut() {
            window.WANDERSTAY_USER = null;
            return Promise.resolve();
        },
        // Where to go after logging out.
        afterSignOutUrl: "index.html",
        refresh() {
            applyAuthState();
            renderAccountPage();
            loadProfilePage();
        }
    };

    function initials(name) {
        return String(name).trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
    }

    // Navbar: hide Log in / Sign up for signed-in users and show their initials on the account button.
    function applyAuthState(user = Auth.getUser()) {
        $$('[data-auth="guest"]').forEach(el => { el.hidden = Boolean(user); });
        $$(".nav-account").forEach(link => {
            link.classList.toggle("is-signed-in", Boolean(user));
            link.innerHTML = user
                ? `<span class="nav-avatar" aria-hidden="true">${escapeHtml(initials(user.name || user.email || "?"))}</span>`
                : icon("user");
            link.setAttribute("aria-label", user ? `Account menu for ${user.name || user.email}` : "Account menu");
        });
    }
    applyAuthState();

    /* ---------- Account page (menu.html) ---------- */
    // Keep this list in sync with real pages; `auth: "user"` items only render when signed in.
    const ACCOUNT_MENU = [
        { group: null, items: [
            { label: "Home", description: "Search and discover places to stay.", href: "index.html", icon: "home", primary: true }
        ] },
        { group: "Account", items: [
            { label: "Profile", description: "Manage your personal details.", href: "profile.html", icon: "user" },
            { label: "Settings", description: "Language and currency preferences.", href: "lang.html", icon: "settings" }
        ] },
        { group: "Support", items: [
            { label: "Help", description: "Answers to common questions.", href: "help.html", icon: "help" }
        ] }
    ];

    function renderAccountPage() {
        const userBox = $("#account-user");
        const menu = $("#account-menu");
        if (!userBox || !menu) return;
        const user = Auth.getUser();

        if (user) {
            const avatar = user.avatar
                ? `<img class="account-avatar" src="${escapeHtml(user.avatar)}" alt="">`
                : `<span class="account-avatar" aria-hidden="true">${escapeHtml(initials(user.name || user.email || "?"))}</span>`;
            userBox.innerHTML = `
                <a class="account-user-link" href="profile.html">
                    ${avatar}
                    <span class="account-user-text">
                        <strong>${escapeHtml(user.name || "Your account")}</strong>
                        ${user.email ? `<span>${escapeHtml(user.email)}</span>` : ""}
                    </span>
                    <span class="account-user-cta">View profile ${icon("chevron")}</span>
                </a>`;
        } else {
            userBox.innerHTML = `
                <div class="account-user-guest">
                    <span class="account-avatar is-guest" aria-hidden="true">${icon("user")}</span>
                    <span class="account-user-text">
                        <strong>Welcome to WanderStay</strong>
                        <span>Log in or sign up to manage your account.</span>
                    </span>
                    <span class="account-user-actions">
                        <a href="signup.html" class="btn btn-outline">Log in</a>
                        <a href="signup.html" class="btn btn-primary">Sign up</a>
                    </span>
                </div>`;
        }

        const itemHtml = item => `
            <li>
                <a class="account-item${item.primary ? " is-primary" : ""}" href="${escapeHtml(item.href)}">
                    <span class="account-item-icon">${icon(item.icon)}</span>
                    <span class="account-item-text">
                        <span class="account-item-label">${escapeHtml(item.label)}</span>
                        <span class="account-item-desc">${escapeHtml(item.description)}</span>
                    </span>
                    ${icon("chevron", "account-item-chevron")}
                </a>
            </li>`;

        menu.innerHTML = ACCOUNT_MENU.map((section, i) => {
            const items = section.items.filter(item => item.auth !== "user" || user);
            if (!items.length) return "";
            const headingId = `account-group-${i}`;
            return `
                <section class="account-group reveal"${section.group ? ` aria-labelledby="${headingId}"` : ""}>
                    ${section.group ? `<h2 class="account-group-title" id="${headingId}">${escapeHtml(section.group)}</h2>` : ""}
                    <ul class="account-list">${items.map(itemHtml).join("")}</ul>
                </section>`;
        }).join("") + (user ? `
            <div class="account-signout">
                <button type="button" class="account-logout" id="logout-open">
                    ${icon("logout")}<span>Log out</span>
                </button>
            </div>` : "");

        const openBtn = $("#logout-open");
        if (openBtn) openBtn.addEventListener("click", openLogoutDialog);

        $$(".reveal", menu).forEach(el => el.classList.add("is-visible"));
    }

    function openLogoutDialog() {
        const dialog = $("#logout-dialog");
        if (!dialog || typeof dialog.showModal !== "function") {
            // No <dialog> support: fall back to signing out directly.
            signOutAndRedirect();
            return;
        }
        dialog.showModal();
    }

    async function signOutAndRedirect(button) {
        if (button) {
            button.disabled = true;
            button.classList.add("is-loading");
            $(".btn-label", button).textContent = "Logging out…";
        }
        try {
            await Auth.signOut();
            window.location.href = Auth.afterSignOutUrl;
        } catch (err) {
            if (button) {
                button.disabled = false;
                button.classList.remove("is-loading");
                $(".btn-label", button).textContent = "Try again";
            }
        }
    }

    const logoutConfirm = $("#logout-confirm");
    if (logoutConfirm) {
        logoutConfirm.addEventListener("click", () => signOutAndRedirect(logoutConfirm));
        const dialog = $("#logout-dialog");
        // Close when clicking the backdrop.
        dialog.addEventListener("click", e => { if (e.target === dialog && !logoutConfirm.disabled) dialog.close(); });
        dialog.addEventListener("cancel", e => { if (logoutConfirm.disabled) e.preventDefault(); });
        $$("[data-dialog-close]", dialog).forEach(btn => btn.addEventListener("click", () => dialog.close()));
    }

    renderAccountPage();

    /* ---------- Profile page (profile.html) ---------- */
    const profileCard = $("#profile-card");
    const profileSkeleton = profileCard ? profileCard.innerHTML : "";
    let profileRequest = 0;

    // Treat missing, blank or stringified-null values as "not provided".
    function clean(value) {
        if (value === null || value === undefined) return "";
        const text = String(value).trim();
        return /^(null|undefined)$/i.test(text) ? "" : text;
    }

    function memberSince(value) {
        const date = value ? new Date(value) : null;
        if (!date || isNaN(date)) return "";
        return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(date);
    }

    function profileAvatar(name, email, avatar) {
        if (avatar) {
            return `<img class="profile-avatar" src="${escapeHtml(avatar)}" alt="Profile photo of ${escapeHtml(name || email)}">`;
        }
        if (name) return `<span class="profile-avatar" aria-hidden="true">${escapeHtml(initials(name))}</span>`;
        return `<span class="profile-avatar is-generic" aria-hidden="true">${icon("user")}</span>`;
    }

    function detailRow(iconName, label, value, missingText) {
        let content;
        if (value) {
            content = escapeHtml(value);
        } else if (missingText && Auth.editProfileUrl) {
            content = `<a class="profile-add" href="${escapeHtml(Auth.editProfileUrl)}">${escapeHtml(missingText)}</a>`;
        } else if (missingText) {
            content = `<span class="profile-missing">Not added</span>`;
        } else {
            return "";
        }
        return `
            <div class="profile-row">
                <dt><span class="profile-row-icon">${icon(iconName)}</span>${escapeHtml(label)}</dt>
                <dd>${content}</dd>
            </div>`;
    }

    function renderProfile(user) {
        const name = clean(user.name);
        const email = clean(user.email);
        const phone = clean(user.phone);
        const since = memberSince(clean(user.createdAt));

        profileCard.innerHTML = `
            <div class="profile-header">
                ${profileAvatar(name, email, clean(user.avatar))}
                <h2 class="profile-name${name ? "" : " is-email"}">${escapeHtml(name || email || "Your profile")}</h2>
                ${name && email ? `<p class="profile-email">${escapeHtml(email)}</p>` : ""}
            </div>
            <dl class="profile-details">
                ${name && !email ? detailRow("mail", "Email", "", "Add an email address") : ""}
                ${detailRow("phone", "Phone", phone, "Add a phone number")}
                ${detailRow("calendar", "Member since", since)}
            </dl>
            <div class="profile-actions">
                ${Auth.editProfileUrl ? `<a class="btn btn-primary" href="${escapeHtml(Auth.editProfileUrl)}">Edit profile</a>` : ""}
                <a class="btn btn-outline" href="menu.html">Back to your account</a>
            </div>`;

        // A broken photo URL falls back to initials / the generic icon.
        const img = $("img.profile-avatar", profileCard);
        if (img) {
            img.addEventListener("error", () => {
                img.outerHTML = profileAvatar(name, email, "");
            }, { once: true });
        }
    }

    function renderProfileMessage({ iconName, title, text, actions, tone = "" }) {
        profileCard.innerHTML = `
            <div class="profile-message ${tone}">
                <span class="profile-avatar is-generic" aria-hidden="true">${icon(iconName)}</span>
                <h2 class="profile-name">${escapeHtml(title)}</h2>
                <p>${escapeHtml(text)}</p>
                <div class="profile-actions">${actions}</div>
            </div>`;
    }

    async function loadProfilePage() {
        if (!profileCard) return;
        const request = ++profileRequest;
        profileCard.innerHTML = profileSkeleton;
        profileCard.setAttribute("aria-busy", "true");
        try {
            const user = await Auth.loadUser();
            if (request !== profileRequest) return;
            applyAuthState(user);
            if (user) {
                renderProfile(user);
            } else {
                renderProfileMessage({
                    iconName: "user",
                    title: "You're not logged in",
                    text: "Log in to see the details on your WanderStay account.",
                    actions: `<a class="btn btn-primary" href="signup.html">Log in</a>
                              <a class="btn btn-outline" href="signup.html">Sign up</a>`
                });
            }
        } catch (err) {
            if (request !== profileRequest) return;
            renderProfileMessage({
                iconName: "alert",
                tone: "is-error",
                title: "We couldn't load your profile",
                text: "Check your connection and try again.",
                actions: `<button type="button" class="btn btn-primary" data-profile-retry>${icon("refresh")}Retry</button>`
            });
            $("[data-profile-retry]", profileCard).addEventListener("click", loadProfilePage);
        } finally {
            if (request === profileRequest) profileCard.setAttribute("aria-busy", "false");
        }
    }

    if (profileCard) {
        loadProfilePage();
        // Coming back from editing (including via the back button) shows fresh data.
        window.addEventListener("pageshow", e => { if (e.persisted) loadProfilePage(); });
    }

    const planDestinations = $("#plan-destinations");
    if (planDestinations) {
        planDestinations.innerHTML = DESTINATIONS.map(d =>
            `<a class="chip" href="search-results.html?${escapeHtml(new URLSearchParams({ location: d.query }).toString())}">${escapeHtml(d.name)}</a>`
        ).join("");
    }

    /* ---------- Header: sticky shadow + mobile menu ---------- */
    const header = $(".site-header");
    if (header) {
        const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
    }

    const navToggle = $(".nav-toggle");
    const navMenu = $("#nav-menu");
    if (navToggle && navMenu) {
        const setOpen = open => {
            navToggle.setAttribute("aria-expanded", String(open));
            navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
            navMenu.classList.toggle("is-open", open);
        };
        navToggle.addEventListener("click", () => setOpen(navToggle.getAttribute("aria-expanded") !== "true"));
        navMenu.addEventListener("click", e => { if (e.target.closest("a")) setOpen(false); });
        document.addEventListener("keydown", e => {
            if (e.key === "Escape" && navMenu.classList.contains("is-open")) {
                setOpen(false);
                navToggle.focus();
            }
        });
        document.addEventListener("click", e => {
            if (!e.target.closest(".navbar")) setOpen(false);
        });
        window.matchMedia("(min-width: 861px)").addEventListener("change", e => { if (e.matches) setOpen(false); });
    }

    /* ---------- Hero background rotation ---------- */
    const heroImages = $$(".hero-media img");
    if (heroImages.length > 1 && !reduceMotion) {
        let current = 0;
        const load = img => new Promise(resolve => {
            if (img.dataset.src) {
                img.srcset = img.dataset.srcset || "";
                img.src = img.dataset.src;
                delete img.dataset.src;
                delete img.dataset.srcset;
            }
            if (img.complete && img.naturalWidth) resolve();
            else {
                img.addEventListener("load", resolve, { once: true });
                img.addEventListener("error", resolve, { once: true });
            }
        });
        setInterval(async () => {
            if (document.hidden) return;
            const next = (current + 1) % heroImages.length;
            await load(heroImages[next]);
            heroImages[current].classList.remove("is-active");
            heroImages[next].classList.add("is-active");
            current = next;
        }, 8000);
    }

    /* ---------- Check-in / check-out pairing (search + booking forms) ---------- */
    function linkDateInputs(checkin, checkout) {
        if (!checkin || !checkout) return;
        const today = toISODate(new Date());
        checkin.min = today;

        const sync = () => {
            const start = parseISODate(checkin.value);
            const minOut = toISODate(addDays(start || new Date(), 1));
            checkout.min = minOut;
            // Keep check-out strictly after check-in.
            if (start && checkout.value && checkout.value <= checkin.value) {
                checkout.value = minOut;
            }
        };
        checkin.addEventListener("change", () => {
            sync();
            // Opening the check-out picker straight away keeps the flow quick.
            if (checkin.value && !checkout.value && typeof checkout.showPicker === "function") {
                try { checkout.showPicker(); } catch (_) { /* needs user activation */ }
            }
        });
        sync();
    }

    /* ---------- Search form ---------- */
    const searchForm = $("#search-form");
    if (searchForm) {
        const fields = {
            location: $("#location", searchForm),
            checkin: $("#checkin", searchForm),
            checkout: $("#checkout", searchForm),
            adults: $("#adults", searchForm),
            children: $("#children", searchForm)
        };
        const submitBtn = $(".search-submit", searchForm);
        const submitLabel = $(".search-label", searchForm);

        // Destination suggestions from the listing data.
        const datalist = $("#destination-list");
        if (datalist) {
            const suggestions = new Set();
            DESTINATIONS.forEach(d => suggestions.add(`${d.name}, ${d.region}`));
            LISTINGS.forEach(l => suggestions.add(l.location));
            datalist.innerHTML = Array.from(suggestions).sort()
                .map(s => `<option value="${escapeHtml(s)}"></option>`).join("");
        }

        // Prefill from the URL (results page "edit search").
        const params = new URLSearchParams(window.location.search);
        ["location", "checkin", "checkout"].forEach(key => {
            if (params.get(key)) fields[key].value = params.get(key);
        });
        ["adults", "children"].forEach(key => {
            const value = params.get(key);
            if (value && $$("option", fields[key]).some(o => o.value === value)) fields[key].value = value;
        });

        linkDateInputs(fields.checkin, fields.checkout);

        const setError = (input, message) => {
            const error = $(`#${input.id}-error`);
            input.setAttribute("aria-invalid", message ? "true" : "false");
            if (error) error.innerHTML = message ? `${icon("alert")}<span>${escapeHtml(message)}</span>` : "";
        };

        const validate = () => {
            const errors = [];
            const today = parseISODate(toISODate(new Date()));
            const start = parseISODate(fields.checkin.value);
            const end = parseISODate(fields.checkout.value);

            const location = fields.location.value.trim();
            errors.push([fields.location, location ? "" : "Enter a destination to search."]);

            let checkinMsg = "";
            if (!start) checkinMsg = "Add a check-in date.";
            else if (start < today) checkinMsg = "Check-in can't be in the past.";
            errors.push([fields.checkin, checkinMsg]);

            let checkoutMsg = "";
            if (!end) checkoutMsg = "Add a check-out date.";
            else if (start && end <= start) checkoutMsg = "Check-out must be after check-in.";
            errors.push([fields.checkout, checkoutMsg]);

            errors.forEach(([input, msg]) => setError(input, msg));
            const firstInvalid = errors.find(([, msg]) => msg);
            if (firstInvalid) firstInvalid[0].focus();
            return !firstInvalid;
        };

        // Clear a field's error as soon as the user fixes it.
        [fields.location, fields.checkin, fields.checkout].forEach(input => {
            const clear = () => { if (input.getAttribute("aria-invalid") === "true" && input.value.trim()) setError(input, ""); };
            input.addEventListener("input", clear);
            input.addEventListener("change", clear);
        });

        const setLoading = loading => {
            searchForm.classList.toggle("is-loading", loading);
            submitBtn.disabled = loading;
            submitLabel.textContent = loading ? "Searching…" : "Search stays";
        };
        // Reset the button if the user comes back via the browser's back button.
        window.addEventListener("pageshow", () => setLoading(false));

        searchForm.addEventListener("submit", event => {
            event.preventDefault();
            if (!validate()) return;
            setLoading(true);

            const query = new URLSearchParams({
                location: fields.location.value.trim(),
                checkin: fields.checkin.value,
                checkout: fields.checkout.value,
                adults: fields.adults.value,
                children: fields.children.value
            });
            window.location.href = `search-results.html?${query.toString()}`;
        });
    }

    /* ---------- Cards ---------- */
    function listingCard(listing, nights, tripQuery = "") {
        const href = tripQuery ? `${listing.url}?${tripQuery}` : listing.url;
        const price = nights > 0
            ? `<strong>${peso.format(listing.pricePerNight * nights)}</strong> <span>for ${plural(nights, "night")} · ${peso.format(listing.pricePerNight)}/night</span>`
            : `<strong>${peso.format(listing.pricePerNight)}</strong> <span>/ night</span>`;
        return `
            <article class="listing reveal">
                <div class="listing-media">
                    <img src="${escapeHtml(listing.image)}" alt="${escapeHtml(listing.name)}" loading="lazy" decoding="async">
                    <span class="listing-type">${escapeHtml(listing.type)}</span>
                </div>
                <div class="listing-top">
                    <h3><a href="${escapeHtml(href)}">${escapeHtml(listing.name)}</a></h3>
                    <span class="rating" aria-label="Rated ${listing.rating} out of 5 from ${listing.reviews} reviews">
                        ${icon("star")}${listing.rating.toFixed(2).replace(/0$/, "")}
                        <span class="rating-count">(${listing.reviews})</span>
                    </span>
                </div>
                <p class="listing-location">${icon("pin")}${escapeHtml(listing.location)}</p>
                <p class="listing-highlights">${listing.highlights.map(escapeHtml).join(" · ")}</p>
                <p class="listing-price">${price}</p>
            </article>`;
    }

    function matchesQuery(listing, query) {
        const tokens = query.toLowerCase().split(/[\s,]+/).filter(Boolean);
        const haystack = `${listing.name} ${listing.type} ${listing.location} Philippines`.toLowerCase();
        return tokens.every(token => haystack.includes(token));
    }

    // Homepage: destinations
    const destinationGrid = $("#destination-grid");
    if (destinationGrid) {
        destinationGrid.innerHTML = DESTINATIONS.map(dest => {
            const count = LISTINGS.filter(l => matchesQuery(l, dest.query)).length;
            const href = `search-results.html?${new URLSearchParams({ location: dest.query })}`;
            return `
                <a class="destination reveal" href="${escapeHtml(href)}">
                    <img src="${escapeHtml(dest.image)}" alt="" loading="lazy" decoding="async">
                    <div class="destination-body">
                        <span class="destination-region">${icon("pin")}${escapeHtml(dest.region)}</span>
                        <h3>${escapeHtml(dest.name)}</h3>
                        <p>${escapeHtml(dest.blurb)}</p>
                        <span class="destination-count">${plural(count, "stay")} ${icon("arrow")}</span>
                    </div>
                </a>`;
        }).join("");
    }

    // Homepage: featured stays
    const featured = $("#featured-stays");
    if (featured) {
        featured.innerHTML = LISTINGS.map(l => listingCard(l, 0)).join("");
    }

    // Results page
    const results = $("#results");
    if (results) {
        const params = new URLSearchParams(window.location.search);
        const location = (params.get("location") || "").trim();
        const start = parseISODate(params.get("checkin"));
        const end = parseISODate(params.get("checkout"));
        const nights = start && end && end > start ? nightsBetween(start, end) : 0;
        const adults = parseInt(params.get("adults"), 10) || 1;
        const children = parseInt(params.get("children"), 10) || 0;

        const matches = location ? LISTINGS.filter(l => matchesQuery(l, location)) : LISTINGS;

        const title = $("#results-title");
        title.textContent = location ? `Stays in ${location}` : "All stays";
        document.title = `${title.textContent} | WanderStay`;

        const summary = $("#search-summary");
        const parts = [];
        if (nights) parts.push(["calendar", `${formatDay(start)} – ${formatDay(end)} · ${plural(nights, "night")}`]);
        parts.push(["users", `${plural(adults, "adult")}${children ? `, ${children} ${children === 1 ? "child" : "children"}` : ""}`]);
        summary.innerHTML = parts.map(([name, text]) => `<span>${icon(name)}${escapeHtml(text)}</span>`).join("");

        $("#results-count").textContent = matches.length
            ? `${plural(matches.length, "stay")} found`
            : "";

        if (matches.length) {
            const trip = new URLSearchParams();
            ["checkin", "checkout", "adults", "children"].forEach(key => { if (params.get(key)) trip.set(key, params.get(key)); });
            results.innerHTML = matches.map(l => listingCard(l, nights, trip.toString())).join("");
        } else {
            const chips = DESTINATIONS.map(d => {
                const next = new URLSearchParams(params);
                next.set("location", d.query);
                return `<a class="chip" href="search-results.html?${escapeHtml(next.toString())}">${escapeHtml(d.name)}</a>`;
            }).join("");
            results.innerHTML = `
                <div class="empty-state">
                    <div class="feature-icon">${icon("search")}</div>
                    <h2>No stays match “${escapeHtml(location)}” yet</h2>
                    <p>Try a different spelling, or explore one of the destinations we currently have stays in.</p>
                    <div class="chip-list">${chips}</div>
                </div>`;
        }
    }

    // Shared helpers for page-specific scripts (property.js).
    window.WanderStay = {
        $, $$, escapeHtml, icon, peso, plural, initials,
        toISODate, parseISODate, addDays, nightsBetween, formatDay, linkDateInputs,
        listings: LISTINGS
    };

    /* ---------- Entrance animations ---------- */
    const revealEls = $$(".reveal");
    if (!("IntersectionObserver" in window) || reduceMotion) {
        revealEls.forEach(el => el.classList.add("is-visible"));
    } else {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        }, { rootMargin: "0px 0px -40px 0px", threshold: 0.08 });
        revealEls.forEach((el, i) => {
            el.style.transitionDelay = `${(i % 4) * 60}ms`;
            observer.observe(el);
        });
    }
})();
