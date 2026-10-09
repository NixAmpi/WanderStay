/*
 * WanderStay listing data — single source for the homepage, search results and
 * property pages (house1–8.html render from the matching `id`).
 *
 * Values come from the original property pages: name, location, rating, review
 * count, description, amenities, map, nightly price (the old "Reserve" button) and
 * guest limit (the old Guests dropdown). There is no backend yet; when one exists,
 * replace this file with an API call that returns the same shape.
 *
 * Property fields:
 *   type        – kind of stay, shown in the summary line
 *   rooms       – bedroom / bathroom facts, shown in the summary line
 *   maxGuests   – booking limit (adults + children)
 *   photos      – unique gallery photos, first one is the cover
 *   amenities   – plain text; icons come from the mapping in property.js
 *   map         – Google Maps embed URL and the place name it points to
 */
window.WANDERSTAY_LISTINGS = [
    {
        id: "house1",
        name: "Riverside Cabin near Cambugahay Falls",
        type: "Cabin",
        location: "Lazi, Siquijor",
        image: "img/stay-1.jpg",
        rating: 4.89,
        reviews: 223,
        pricePerNight: 5340,
        highlights: ["Entire cabin", "2 bedrooms", "Pool access"],
        url: "house1.html",
        details: {
            type: "Entire cabin",
            rooms: ["2 bedrooms", "1 bathroom"],
            maxGuests: 4,
            description: "Escape to this cozy riverside cabin near Cambugahay Falls. Featuring stunning views, modern amenities, and a peaceful ambiance, it's perfect for a relaxing getaway.",
            photos: [
                { src: "img/house1-1.jpg", alt: "Infinity pool with a walkway leading out toward the sea" },
                { src: "img/house1-2.jpg", alt: "Bright blue pool beside white poolside buildings" },
                { src: "img/house1-3.jpg", alt: "Pool lined with palm trees and thatched cabanas at sunset" }
            ],
            amenities: ["Fully equipped kitchen", "Free WiFi", "Pool access", "Outdoor BBQ area"],
            map: {
                embed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3922.3806721132655!2d123.5838238147233!3d9.132624693650667!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33abfbd37b2a0e1b%3A0x4a24c2c14d2c4901!2sCambugahay%20Falls!5e0!3m2!1sen!2sph!4v1619256590893!5m2!1sen!2sph",
                place: "Cambugahay Falls, Lazi, Siquijor"
            }
        }
    },
    {
        id: "house2",
        name: "The Bayleaf Cavite",
        type: "Hotel",
        location: "General Trias, Cavite",
        image: "img/stay-2.jpg",
        rating: 4.89,
        reviews: 223,
        pricePerNight: 5340,
        highlights: ["Hotel room", "Outdoor pool", "Free parking"],
        url: "house2.html",
        details: {
            type: "Hotel room with city or pool view",
            rooms: ["1 bedroom", "En-suite bathroom"],
            maxGuests: 4,
            description: "Nestled in General Trias, Cavite, The Bayleaf Cavite offers a blend of sophistication and comfort. Ideal for business travelers and vacationers alike, this hotel features elegant rooms, stunning views, modern conference facilities, and easy access to nearby attractions. A perfect staycation spot near Metro Manila.",
            photos: [
                { src: "img/house2-1.jpg", alt: "Exterior of The Bayleaf Cavite hotel surrounded by palm trees" },
                { src: "img/house2-2.jpg", alt: "Hotel room with two beds and a window view" },
                { src: "img/house2-3.jpg", alt: "Aerial view of the outdoor swimming pools" },
                { src: "img/house2-4.jpg", alt: "Bathroom vanity with twin sinks" }
            ],
            amenities: ["On-site restaurants & café", "Complimentary high-speed WiFi", "Outdoor swimming pool", "Fitness center & function rooms", "Free parking"],
            map: {
                embed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3879.678165156759!2d120.87997357508237!3d14.34765578636774!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33bd821c3c5a0c95%3A0x1b4d57b419c7c465!2sThe%20Bayleaf%20Hotel%20Cavite!5e0!3m2!1sen!2sph!4v1714991000000",
                place: "The Bayleaf Hotel Cavite, General Trias"
            }
        }
    },
    {
        id: "house3",
        name: "SMDC Wind Residences Tagaytay",
        type: "Condo",
        location: "Tagaytay, Cavite",
        image: "img/stay-3.jpg",
        rating: 4.85,
        reviews: 150,
        pricePerNight: 4500,
        highlights: ["Entire condo", "Pool access", "Game room"],
        url: "house3.html",
        details: {
            type: "Entire condo unit",
            rooms: ["1 bedroom", "1 bathroom"],
            maxGuests: 4,
            description: "Escape to the cool breeze and serene views of Tagaytay at SMDC Wind Residences. This cozy and fully furnished condo unit offers a relaxing stay with a picturesque view of Taal Lake. Ideal for couples or small families, it’s your perfect weekend retreat just a few hours from Metro Manila.",
            photos: [
                { src: "img/house3-1.jpg", alt: "Pool area with a pine tree and the Wind Residences towers behind" },
                { src: "img/house3-2.jpg", alt: "Balcony table set with fruit and a view over Tagaytay" },
                { src: "img/house3-3.jpg", alt: "Living and dining area with a wall-mounted TV" }
            ],
            amenities: ["Smart TV with Netflix", "High-speed WiFi", "Dining area & kitchenette", "Access to indoor and outdoor pools", "Game room & recreational area", "Secure basement parking"],
            map: {
                embed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3877.9204322546936!2d120.93298127504859!3d14.108592290131398!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33bd7993b78cb7af%3A0x8d72e73c8ce67ea9!2sSMDC%20Wind%20Residences%2C%20Tagaytay!5e0!3m2!1sen!2sph!4v1714992900000",
                place: "SMDC Wind Residences, Tagaytay"
            }
        }
    },
    {
        id: "house4",
        name: "La Kasa Jardin – Garden Suite",
        type: "Garden suite",
        location: "Lucban, Quezon",
        image: "img/stay-4.jpg",
        rating: 4.89,
        reviews: 223,
        pricePerNight: 5340,
        highlights: ["2 bedrooms", "Full kitchen", "BBQ area"],
        url: "house4.html",
        details: {
            type: "Entire garden suite",
            rooms: ["2 bedrooms", "1 bathroom"],
            maxGuests: 4,
            description: "Nestled in the heart of Lucban, La Kasa Jardin - Garden Suite offers a serene and nature-inspired retreat. Surrounded by lush greenery and traditional charm, it’s the perfect spot for guests seeking relaxation, fresh air, and a peaceful garden escape.",
            photos: [
                { src: "img/house4-2.jpg", alt: "White balcony overlooking a leafy garden and the town" },
                { src: "img/house4-3.jpg", alt: "Bedroom with a double bed and wooden floor" },
                { src: "img/house4-4.jpg", alt: "Bedroom with two single beds" },
                { src: "img/house4-1.jpg", alt: "La Kasa Jardin garden suite entrance with a stone garden" }
            ],
            amenities: ["Fully equipped kitchen", "Free WiFi", "Pool access", "Outdoor BBQ area"],
            map: {
                embed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3875.753103951084!2d121.5584!3d14.1144!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33bd51d46ff7526b%3A0x4d58a0f9a3f2c3a4!2sLucban%2C%20Quezon!5e0!3m2!1sen!2sph!4v1715000000000",
                place: "Lucban, Quezon"
            }
        }
    },
    {
        id: "house5",
        name: "La Bella Boutique Hotel",
        type: "Boutique hotel",
        location: "Tagaytay, Cavite",
        image: "img/stay-5.jpg",
        rating: 4.7,
        reviews: 180,
        pricePerNight: 1996,
        highlights: ["Infinity pool", "Bathtub", "Café & spa"],
        url: "house5.html",
        details: {
            type: "Boutique hotel suite",
            rooms: ["1 bedroom", "1 bathroom"],
            maxGuests: 4,
            description: "Discover a peaceful European-inspired escape at La Bella Boutique Hotel in Tagaytay. With charming interiors, cozy rooms, a wellness spa, and scenic surroundings, it's the ideal spot for a relaxing retreat in nature's embrace.",
            photos: [
                { src: "img/house5-1.jpg", alt: "White hotel buildings among palm trees under a blue sky" },
                { src: "img/house5-2.jpg", alt: "Infinity pool in front of the white hotel building" },
                { src: "img/house5-3.jpg", alt: "View down onto a curved pool between the hotel wings" },
                { src: "img/house5-4.jpg", alt: "Suite interior with a TV and kitchenette" }
            ],
            amenities: ["Bathtub & hot shower", "Free WiFi", "Infinity pool access", "On-site café & wellness spa"],
            map: {
                embed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3875.217290476482!2d120.91958271523093!3d14.107877990823908!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33bd7e23cd2fc22b%3A0xa78a0a99ffb4414e!2sLa%20Bella%20Boutique%20Hotel!5e0!3m2!1sen!2sph!4v1714987100000",
                place: "La Bella Boutique Hotel, Tagaytay"
            }
        }
    },
    {
        id: "house6",
        name: "Beachfront Penthouse Flat",
        type: "Penthouse",
        location: "Station 1, Boracay",
        image: "img/stay-6.jpg",
        rating: 4.93,
        reviews: 312,
        pricePerNight: 6200,
        highlights: ["Sea-view balcony", "2 bedrooms", "Daily housekeeping"],
        url: "house6.html",
        details: {
            type: "Entire penthouse flat",
            rooms: ["2 bedrooms", "2 bathrooms"],
            maxGuests: 4,
            description: "Experience luxury island living in this stunning beachfront penthouse flat located at Station 1, Boracay. With panoramic sea views, elegant interiors, and direct beach access, it’s the perfect hideaway for travelers seeking both comfort and tropical beauty in one of the world’s best island destinations.",
            photos: [
                { src: "img/house6-1.jpg", alt: "View over White Beach and palm trees from the penthouse" },
                { src: "img/house6-2.jpg", alt: "White terrace with seating and a sea view" },
                { src: "img/house6-3.jpg", alt: "Bathroom with a wood-panelled wall and white tiles" },
                { src: "img/house6-4.jpg", alt: "Bedroom with a colorful painting above the bed" }
            ],
            amenities: ["Private balcony with sea view", "High-speed WiFi", "Full kitchen with island counter", "Daily housekeeping service"],
            map: {
                embed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3921.098197338226!2d121.92441221472464!3d11.96801649151245!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33a53a69e57638d1%3A0xb2c7c973226ea3e7!2sWhite%20Beach%2C%20Boracay!5e0!3m2!1sen!2sph!4v1714988500000",
                place: "White Beach, Boracay"
            }
        }
    },
    {
        id: "house7",
        name: "Condo in the Heart of Baguio City",
        type: "Condo",
        location: "Baguio City, Benguet",
        image: "img/stay-7.jpg",
        rating: 4.8,
        reviews: 205,
        pricePerNight: 2350,
        highlights: ["Entire condo", "Heater", "Netflix"],
        url: "house7.html",
        details: {
            type: "Entire condo unit",
            rooms: ["1 bedroom", "1 bathroom"],
            maxGuests: 3,
            description: "Enjoy a cool mountain escape in this stylish condo unit located right in the heart of Baguio City. Close to Session Road, Burnham Park, and cafés, this cozy stay is ideal for couples or small families who want the convenience of city living with a touch of tranquility.",
            photos: [
                { src: "img/house7-1.jpg", alt: "Exterior of the condominium tower" },
                { src: "img/house7-2.jpg", alt: "Bedroom with a sofa and warm lamps" },
                { src: "img/house7-3.jpg", alt: "Lobby lounge with sofas and large windows" },
                { src: "img/house7-4.jpg", alt: "Small balcony with a table and chairs facing greenery" }
            ],
            amenities: ["Heater and warm blankets", "Free WiFi & Netflix", "Compact kitchen with dining nook", "Parking available"],
            map: {
                embed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3856.264376957159!2d120.59102807483137!3d16.413468884307264!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3391a1670326c42d%3A0x3cd0e89d35ae83a4!2sSession%20Road!5e0!3m2!1sen!2sph!4v1714990000000",
                place: "Session Road, Baguio City"
            }
        }
    },
    {
        id: "house8",
        name: "Casa Ellyse Beach Villa – Modern Industrial Loft",
        type: "Villa",
        location: "San Juan, La Union",
        image: "img/stay-8.jpg",
        rating: 4.92,
        reviews: 318,
        pricePerNight: 6200,
        highlights: ["Oceanfront balcony", "Outdoor shower", "BBQ grill"],
        url: "house8.html",
        details: {
            type: "Entire beachfront villa",
            rooms: ["1 loft bedroom", "1 bathroom"],
            maxGuests: 4,
            description: "Nestled along the coastline of San Juan, La Union, Casa Ellyse is a modern industrial loft with a rustic charm and oceanfront views. Perfect for surf enthusiasts and beach lovers, the villa offers a peaceful yet stylish retreat with high ceilings, open spaces, and premium amenities for a perfect tropical escape.",
            photos: [
                { src: "img/house8-1.jpg", alt: "Loft living area seen from the mezzanine stairs" },
                { src: "img/house8-2.jpg", alt: "Loft bedroom with rattan pendant lights" },
                { src: "img/house8-3.jpg", alt: "Lounge with a daybed, surfboard and rattan chairs" },
                { src: "img/house8-4.jpg", alt: "Bar counter with stools lit up at night" }
            ],
            amenities: ["Oceanfront balcony with seating", "Free high-speed WiFi", "Mini bar & Nespresso machine", "Air conditioning", "Outdoor shower", "BBQ grill area", "Free on-site parking"],
            map: {
                embed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3874.6700438880126!2d120.30931581482694!3d16.67327138848251!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x338e64114ebd1b15%3A0xc3b83a6d52ff1d9b!2sSan%20Juan%2C%20La%20Union!5e0!3m2!1sen!2sph!4v1714994900000",
                place: "San Juan, La Union"
            }
        }
    }
];

/*
 * Destinations shown in "Explore places worth staying for". Each one links to a
 * search for `query`; the stay count is computed from the listings above.
 */
window.WANDERSTAY_DESTINATIONS = [
    { name: "Boracay", region: "Aklan", query: "Boracay", image: "img/stay-6.jpg",
      blurb: "Powdery white sand and some of the country's most famous sunsets." },
    { name: "Tagaytay", region: "Cavite", query: "Tagaytay", image: "img/stay-5.jpg",
      blurb: "Cool ridge air and views over Taal Lake, an easy drive from Manila." },
    { name: "La Union", region: "Ilocos", query: "La Union", image: "img/dest-launion.jpg",
      blurb: "Laid-back surf town energy, beach cafés and long golden evenings." },
    { name: "Siquijor", region: "Central Visayas", query: "Siquijor", image: "img/stay-1.jpg",
      blurb: "Turquoise waterfalls and quiet coastlines on a storied island." },
    { name: "Baguio", region: "Benguet", query: "Baguio", image: "img/dest-baguio.jpg",
      blurb: "Pine-scented mountain air and a lively city in the Cordilleras." },
    { name: "Lucban", region: "Quezon", query: "Lucban", image: "img/stay-4.jpg",
      blurb: "Colorful heritage streets at the foot of Mount Banahaw." }
];
