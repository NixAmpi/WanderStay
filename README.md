# WanderStay

WanderStay is a travel accommodation website for finding and booking stays across the Philippines: cabins, condos, boutique hotels and beach villas in places like Boracay, Tagaytay, La Union, Siquijor and Baguio.

This repository is the front end. Listing data lives in a JavaScript file, and login and online payments are not connected yet (see [Integration status](#integration-status)).

## Tech stack

- Plain HTML, CSS and JavaScript (no framework, no build step, no dependencies)
- [Inter](https://fonts.google.com/specimen/Inter) from Google Fonts
- Line icons in an inline SVG sprite on each page
- Google Maps embeds on the property pages

## Run it locally

Any static file server works. With Python installed:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>.

You can also use an editor extension such as VS Code's Live Server. Opening `index.html` straight from disk mostly works, but a local server is closer to how the site will be hosted.

## Environment variables

None yet. The site has no backend, so there is no `.env` file. When authentication or a payment provider is added, keep secret keys on the server and in environment variables. `.gitignore` already excludes `.env` files.

## Pages and features

| Page | What it does |
| --- | --- |
| `index.html` | Homepage: search by destination, dates and guests; benefits; destinations; featured stays |
| `search-results.html` | Stays that match the destination, with totals for the chosen nights |
| `house1.html` – `house8.html` | Property details: photo gallery and lightbox, amenities, map, booking card with price breakdown |
| `payment.html` | Checkout: booking summary, GCash / Maya / card selection, payment states |
| `menu.html` | Account hub |
| `profile.html` | Profile details with loading, empty and error states |
| `help.html` | Answers to common questions |
| `signup.html` | Log in or sign up |
| `lang.html` | Language and currency settings |

### Project structure

```
index.html, *.html   Pages (property pages are shells filled by property.js)
style.css            Design tokens and all styles
script.js            Navigation, search, cards, account and profile pages, shared helpers
listings.js          Listing, property and destination data
property.js          Property page components
payment.js           Checkout components and the payment gateway hook
img/                 Optimized images
```

## Integration status

- **Data:** listings come from `listings.js`. Replace it with an API that returns the same shape when a backend exists.
- **Authentication:** none yet, so every visitor is signed out. Connect a provider through `WanderStayAuth` in `script.js`; the navbar, account hub and profile page then show the signed-in state.
- **Payments:** no gateway is connected, and the checkout says so. Connect one through `WanderStayPayments` in `payment.js` (the contract is documented at the top of the file). Card details must come from the provider's hosted fields, and payment must be confirmed by your server before a booking is marked paid.
