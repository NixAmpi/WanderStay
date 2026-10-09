# WanderStay

WanderStay is a travel accommodation booking website. Guests can search for places to stay by location, dates, and number of guests, browse property details, and book and pay online using GCash, Maya, or a credit or debit card.

> **Status:** In active development. The UI is being redesigned into a modern, responsive travel booking experience.

---

## Features

- **Accommodation search:** Search by location, check-in and check-out dates, adults, and children, with date validation.
- **Destination discovery:** Browse destinations and featured stays from the homepage.
- **Property details:** Photo gallery, description, amenities, location map, and a booking card with a price breakdown.
- **Booking and payment:** Booking summary and checkout with GCash, Maya, and card payments through a secure payment gateway.
- **User accounts:** Sign up, log in, profile page, and an account menu (Home, Profile, Settings, Help, Logout).
- **Responsive design:** Works on desktop, tablet, and mobile.
- **Accessibility:** Semantic HTML, form labels, keyboard navigation, and visible focus states.

## Pages

| Page | Description |
| --- | --- |
| Home | Hero section with the accommodation search form, benefits, and destination discovery |
| Property Details | Gallery, description, amenities, map, and booking card |
| Payment | Booking summary and payment method selection |
| Main Menu | Account hub with links to Profile, Settings, Help, and Logout |
| Profile | The signed-in user's details and Edit Profile |
| Log in / Sign up | Account authentication |

## Tech Stack

<!-- TODO: Replace with the actual stack used in this project. -->

- **Frontend:** _e.g. React / Next.js / Vue / HTML, CSS, JavaScript_
- **Styling:** _e.g. Tailwind CSS / CSS Modules / plain CSS_
- **Backend / Database:** _e.g. Supabase / Firebase / Node.js_
- **Authentication:** _e.g. Supabase Auth_
- **Payments:** _e.g. PayMongo / Maya / Xendit_ (GCash, Maya, and card payments)
- **Maps:** _e.g. Google Maps / Leaflet / OpenStreetMap_

## Getting Started

### Prerequisites

<!-- TODO: Adjust to match the project. -->

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) (LTS version) and npm, if the project uses Node

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/<your-username>/<your-repo>.git
   cd <your-repo>
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create your environment file by copying the example:

   ```bash
   # macOS / Linux
   cp .env.example .env

   # Windows (PowerShell)
   Copy-Item .env.example .env
   ```

4. Fill in the values in `.env` (see [Environment Variables](#environment-variables)).

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open the local URL shown in the terminal in your browser.

### Available Scripts

<!-- TODO: Update to match package.json. -->

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build the project for production |
| `npm run lint` | Run the linter |
| `npm test` | Run tests |

## Environment Variables

All environment variables are listed in `.env.example`. Copy it to `.env` and fill in your own values.

<!-- TODO: Update the names to match the project. -->

| Variable | Description |
| --- | --- |
| `DATABASE_URL` or `SUPABASE_URL` | Database or backend project URL |
| `SUPABASE_ANON_KEY` | Public (anon) key for the frontend |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key. Never expose in frontend code |
| `PAYMENT_PUBLIC_KEY` | Payment gateway public key |
| `PAYMENT_SECRET_KEY` | Payment gateway secret key. Server only |
| `PAYMENT_WEBHOOK_SECRET` | Used to verify payment webhooks |
| `MAPS_API_KEY` | Maps API key, if required |

> **Never commit your `.env` file.** It is listed in `.gitignore`. If a secret key is ever committed, rotate it in the provider's dashboard immediately.

## Payments

WanderStay supports **GCash**, **Maya**, and **credit or debit card** payments.

- Card details are collected through the payment gateway's secure fields, so raw card numbers never reach WanderStay's servers.
- Payment status is confirmed on the server through webhooks or verification before a booking is marked as paid.
- Use the gateway's **test or sandbox mode** during development. Never test with real cards or accounts.

## Project Structure

<!-- TODO: Replace with the actual folder structure. -->

```
wanderstay/
├── public/            # Static assets (images, icons)
├── src/
│   ├── components/    # Reusable UI components
│   ├── pages/         # Home, Property, Payment, Menu, Profile, Auth
│   ├── services/      # API, auth, and payment logic
│   └── styles/        # Global styles and design tokens
├── .env.example
├── .gitignore
└── README.md
```

## Design

- **Primary color:** WanderStay pink `#FF385C`
- **Neutrals:** White, soft gray, charcoal, and warm neutrals
- **Corners:** 12px to 24px rounded cards and inputs
- **Icons:** One consistent line icon set, no emojis in the UI

## Contributing

1. Create a new branch: `git checkout -b feature/your-feature`
2. Commit using [Conventional Commits](https://www.conventionalcommits.org/), for example `feat(search): add guest selector`
3. Push the branch and open a pull request.

## License

<!-- TODO: Choose a license, or state that the project is private. -->

This project is currently private. All rights reserved.
