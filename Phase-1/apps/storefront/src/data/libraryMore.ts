type PhotoKind = "memory" | "screenshot" | "document";

interface LibraryPhoto {
  id: string;
  src: string;
  alt: string;
  dateLabel: string;
  takenAt: string;
  album: string;
  kind: PhotoKind;
  caption: string;
  cues: string[];
  people?: string[];
  locationLabel?: string;
}

const u = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=720&q=80&fm=jpg`;

function extra(
  id: string,
  unsplash: string,
  alt: string,
  dateLabel: string,
  takenAt: string,
  album: string,
  kind: PhotoKind,
  caption: string,
  cues: string[],
  more?: Pick<LibraryPhoto, "people" | "locationLabel">
): LibraryPhoto {
  return { id, src: u(unsplash), alt, dateLabel, takenAt, album, kind, caption, cues, ...more };
}

/** Near-misses so keyword “cafe” / “trip” cannot isolate the vague-memory target. */
export const MORE: LibraryPhoto[] = [
  extra("p-goa-hotel-1", "photo-1566073771259-6a8506099945", "Hotel pool on the trip", "Sat, 14 Dec 2024", "2024-12-14", "Goa trip", "memory", "The hotel pool — not the cafe", ["hotel", "pool", "goa", "trip"]),
  extra("p-goa-hotel-2", "photo-1571896349842-33c89424de2d", "Resort building and palms", "Fri, 13 Dec 2024", "2024-12-13", "Goa trip", "memory", "Resort we stayed at on the trip", ["hotel", "resort", "goa", "trip"]),
  extra("p-goa-pool-1", "photo-1576013551627-0cc20b96c2a7", "Swimming pool with loungers", "Sat, 14 Dec 2024", "2024-12-14", "Goa trip", "memory", "Pool morning before we found the cafe", ["pool", "goa", "trip", "holiday"]),
  extra("p-goa-room-1", "photo-1520250497591-112f2f40a3f4", "Hotel room with a balcony", "Thu, 12 Dec 2024", "2024-12-12", "Goa trip", "memory", "The room — still not the small cafe", ["hotel", "room", "goa", "trip"]),
  extra("p-goa-chairs-1", "photo-1520454974749-611b7248ffdb", "Yellow chairs on sand", "Sat, 14 Dec 2024", "2024-12-14", "Goa trip", "memory", "Yellow chairs outside that tiny beach cafe", ["cafe", "yellow", "beach", "goa", "trip"], { locationLabel: "small beach cafe" }),
  extra("p-goa-coffee-1", "photo-1511920170033-f8396924c348", "Coffee cup in a tiny shop", "Sat, 14 Dec 2024", "2024-12-14", "Goa trip", "memory", "Coffee at the small cafe after the swim", ["cafe", "coffee", "goa", "trip", "beach"], { locationLabel: "small beach cafe" }),
  extra("p-goa-night-1", "photo-1519046904884-53103b34b206", "Night beach with lights", "Sat, 14 Dec 2024", "2024-12-14", "Goa trip", "memory", "Night on the same beach as the cafe", ["night", "beach", "goa", "trip"]),
  extra("p-goa-rain-1", "photo-1515694346937-94d85e41e6f0", "Rain over palms", "Thu, 12 Dec 2024", "2024-12-12", "Goa trip", "memory", "Rain day — we ducked into the cafe", ["rain", "goa", "trip", "holiday"]),
  extra("p-goa-thali-1", "photo-1504674900247-0877df9cc836", "Thali spread on a table", "Sat, 14 Dec 2024", "2024-12-14", "Goa trip", "memory", "Lunch next to the small cafe", ["food", "goa", "trip", "cafe"]),
  extra("p-goa-boat-1", "photo-1544551763-46a013bb70d5", "Boat near a tropical shore", "Fri, 13 Dec 2024", "2024-12-13", "Goa trip", "memory", "Boat ride the day before the cafe", ["boat", "goa", "trip", "holiday"]),
  extra("p-goa-friends-2", "photo-1522202176988-66273c2fd55f", "Friends on a trip", "Fri, 13 Dec 2024", "2024-12-13", "Goa trip", "memory", "The people from that trip — faces, not search names", ["people", "friends", "trip", "goa", "face"], { people: ["friend"] }),
  extra("p-goa-street-1", "photo-1477959858617-67f85cf4f1df", "Street at night", "Thu, 12 Dec 2024", "2024-12-12", "Goa trip", "memory", "Street we walked looking for that cafe", ["street", "food", "goa", "trip", "night"]),
  extra("p-goa-coconut-1", "photo-1587049352846-4a222e784d38", "Coconut on a beach table", "Fri, 13 Dec 2024", "2024-12-13", "Goa trip", "memory", "Coconut stand — near the cafe, not it", ["beach", "goa", "trip", "food"]),
  extra("p-goa-palm-1", "photo-1472214103451-9374bd1c798e", "Palm trees over sand", "Fri, 13 Dec 2024", "2024-12-13", "Goa trip", "memory", "The beach stretch, not the cafe interior", ["beach", "palm", "goa", "trip"]),
  extra("p-eu-espresso-1", "photo-1509042239860-f550ce710b93", "Espresso on a marble bar", "Jun 2023", "2023-06-11", "Europe", "memory", "City espresso bar — cafe-shaped, not the beach one", ["cafe", "coffee", "espresso", "europe", "city"], { locationLabel: "city espresso bar" }),
  extra("p-eu-trattoria-1", "photo-1517248135467-4c7edcad34c4", "Busy trattoria interior", "Jun 2023", "2023-06-11", "Europe", "memory", "A restaurant on the Europe trip, not Goa", ["restaurant", "dinner", "europe", "trip"], { locationLabel: "city restaurant" }),
  extra("p-eu-breakfast-1", "photo-1495214783159-3503fd1b572d", "Hotel breakfast table", "Jun 2023", "2023-06-10", "Europe", "memory", "Hotel breakfast — another small place, another trip", ["breakfast", "hotel", "europe", "trip", "cafe"]),
  extra("p-eu-gelato-1", "photo-1563805042-7684c019e1cb", "Gelato counter", "Jun 2023", "2023-06-12", "Europe", "memory", "Gelato stop on the Europe holiday", ["food", "gelato", "europe", "holiday"]),
  extra("p-eu-canal-2", "photo-1514890547357-a9ee288728e0", "Canal at dusk", "Jun 2023", "2023-06-11", "Europe", "memory", "Water and boats — easy miss if you only remember a trip", ["canal", "water", "europe", "trip", "holiday"]),
  extra("p-eu-plaza-1", "photo-1467269204594-9661b134dd2b", "Old town plaza", "Jun 2023", "2023-06-12", "Europe", "memory", "Plaza coffee — city cafe, not beach cafe", ["plaza", "cafe", "europe", "city", "trip"], { locationLabel: "city espresso bar" }),
  extra("p-eu-museum-1", "photo-1554907984-15263bfd63bd", "Museum hall", "Jun 2023", "2023-06-10", "Europe", "memory", "Museum day on the Europe trip", ["museum", "europe", "trip", "holiday"]),
  extra("p-eu-train-1", "photo-1474487548417-781cb71495f3", "Train window on a trip", "Jun 2023", "2023-06-10", "Europe", "memory", "Train between towns — date forgotten", ["train", "europe", "trip", "travel"]),
  extra("p-eu-church-1", "photo-1552832230-c0197dd311b5", "Historic church square", "Jun 2023", "2023-06-12", "Europe", "memory", "Square we walked after coffee", ["church", "europe", "trip", "city"]),
  extra("p-eu-night-1", "photo-1480714378408-67cf0d13bc1b", "City lights at night", "Jun 2023", "2023-06-11", "Europe", "memory", "Night walk — not the Goa cafe", ["night", "city", "europe", "trip"]),
  extra("p-jai-1", "photo-1564507592333-c60657eea523", "Palace facade", "Oct 2022", "2022-10-08", "Jaipur trip", "memory", "Palace on a different trip — vibe is fort, not cafe", ["palace", "fort", "jaipur", "trip", "holiday"], { locationLabel: "palace courtyard" }),
  extra("p-jai-2", "photo-1487956382158-bb926046304a", "Marble monument", "Oct 2022", "2022-10-08", "Jaipur trip", "memory", "Monument day — another trip without a date", ["monument", "jaipur", "trip", "india"]),
  extra("p-jai-3", "photo-1528909514045-2fa4ac7a08ba", "Pink city street", "Oct 2022", "2022-10-09", "Jaipur trip", "memory", "Pink streets — place remembered, town name fuzzy", ["street", "jaipur", "trip", "holiday"], { locationLabel: "pink city street" }),
  extra("p-jai-4", "photo-1598091383021-15ddea10925d", "Fort wall at sunset", "Oct 2022", "2022-10-09", "Jaipur trip", "memory", "Fort sunset on the Jaipur trip", ["fort", "sunset", "jaipur", "trip"]),
  extra("p-jai-5", "photo-1505253758473-96b7015fcd40", "Market spices", "Oct 2022", "2022-10-08", "Jaipur trip", "memory", "Spice market — not a beach cafe", ["market", "food", "jaipur", "trip"]),
  extra("p-jai-6", "photo-1587474260584-136574528ed5", "India Gate crowd", "Oct 2022", "2022-10-10", "Jaipur trip", "memory", "A stop on the same India loop", ["crowd", "india", "trip", "holiday"]),
  extra("p-jai-7", "photo-1477587458883-47145ed94245", "Courtyard arches", "Oct 2022", "2022-10-08", "Jaipur trip", "memory", "Courtyard — palace vibe, not cafe vibe", ["courtyard", "palace", "jaipur", "trip"]),
  extra("p-jai-8", "photo-1546069901-ba9599a7e63c", "Thali on a metal plate", "Oct 2022", "2022-10-09", "Jaipur trip", "memory", "Dinner on the Jaipur trip", ["food", "dinner", "jaipur", "trip"]),
  extra("p-ker-1", "photo-1602216056096-3b40cc0c9944", "Houseboat on backwaters", "Aug 2023", "2023-08-14", "Kerala trip", "memory", "Houseboat — a trip, water, still not Goa cafe", ["boat", "kerala", "trip", "holiday", "water"], { locationLabel: "backwaters" }),
  extra("p-ker-2", "photo-1418065460487-3e41a6c84dc5", "Palm backwaters", "Aug 2023", "2023-08-14", "Kerala trip", "memory", "Backwaters the week of the houseboat", ["palm", "kerala", "trip", "water"]),
  extra("p-ker-3", "photo-1439066615861-d1af74d74000", "Village canoe", "Aug 2023", "2023-08-15", "Kerala trip", "memory", "Canoe morning on the Kerala trip", ["canoe", "kerala", "trip", "holiday", "water"]),
  extra("p-ker-4", "photo-1506905925346-21bda4d32df4", "Hills after rain", "Aug 2023", "2023-08-16", "Kerala trip", "memory", "Hill station after the boat", ["hills", "kerala", "trip", "rain"]),
  extra("p-ker-5", "photo-1464822759023-fed622ff2c3b", "Mountain ridge", "Aug 2023", "2023-08-16", "Kerala trip", "memory", "Ridge walk — different trip, same forgotten dates", ["mountains", "kerala", "trip", "holiday"]),
  extra("p-ker-6", "photo-1470071459604-3b5ec3a7fe05", "Mist over trees", "Aug 2023", "2023-08-15", "Kerala trip", "memory", "Misty morning tea — not a cafe on a beach", ["mist", "tea", "kerala", "trip"]),
  extra("p-wed-2", "photo-1523438885200-e635ba2c371e", "Wedding ceremony aisle", "Sun, 3 Nov 2024", "2024-11-03", "Wedding dinner", "memory", "Aisle — venue name still gone", ["wedding", "ceremony", "event"], { people: ["family"] }),
  extra("p-wed-3", "photo-1465495976277-4387d4b0b4c6", "Wedding flowers", "Sun, 3 Nov 2024", "2024-11-03", "Wedding dinner", "memory", "Flowers from the dinner", ["wedding", "flowers", "event"]),
  extra("p-wed-4", "photo-1464366400600-7168b8af9bc3", "First dance lights", "Sun, 3 Nov 2024", "2024-11-03", "Wedding dinner", "memory", "Dance floor — I remember the lights", ["wedding", "dance", "lights", "event"]),
  extra("p-wed-5", "photo-1519225421980-715cb0215aed", "Cake table", "Sun, 3 Nov 2024", "2024-11-03", "Wedding dinner", "memory", "Cake table at the dinner", ["wedding", "cake", "dinner", "event"]),
  extra("p-night-3", "photo-1514525253161-7a46d19cd819", "Stage from the crowd", "Sat, 21 Sep 2024", "2024-09-21", "Nights out", "memory", "Stage lights — venue still unnamed", ["concert", "stage", "lights", "music", "event"], { locationLabel: "dark venue" }),
  extra("p-night-4", "photo-1483412033650-1015ddeb83d1", "Concert from above", "Sat, 21 Sep 2024", "2024-09-21", "Nights out", "memory", "Same gig, still no venue token", ["concert", "crowd", "music", "event"]),
  extra("p-night-5", "photo-1540039155733-5bb30b53aa14", "Hands and lights", "Sat, 21 Sep 2024", "2024-09-21", "Nights out", "memory", "The night I remember by lights, not a search word", ["concert", "night", "lights", "event"]),
  extra("p-night-6", "photo-1501281668745-f7f57925c3b4", "Outdoor festival", "Sat, 21 Sep 2024", "2024-09-21", "Nights out", "memory", "Festival edge of that night", ["festival", "music", "night", "event"]),
  extra("p-dog-2", "photo-1552053831-71594a27632d", "Golden dog outdoors", "Sun, 4 Aug 2024", "2024-08-04", "Pets", "memory", "The other dog in the park", ["dog", "pets", "park", "animals"]),
  extra("p-dog-3", "photo-1583511655857-d19b40a7a54e", "Puppy on a sofa", "Sun, 4 Aug 2024", "2024-08-04", "Pets", "memory", "Puppy at home", ["dog", "puppy", "pets", "home"]),
  extra("p-cat-2", "photo-1574158622682-e40e69881006", "Grey cat on a windowsill", "Sun, 4 Aug 2024", "2024-08-04", "Pets", "memory", "The cat in the window", ["cat", "pets", "home", "animals"]),
  extra("p-cat-3", "photo-1518791841217-8f162f1e1131", "Tabby cat close up", "Sun, 4 Aug 2024", "2024-08-04", "Pets", "memory", "Another cat photo from home", ["cat", "pets", "animals"]),
  extra("p-home-2", "photo-1556912173-46c336c7fd55", "Kitchen at night", "Mon, 2 Jun 2025", "2025-06-02", "Home", "memory", "Kitchen the week I was sick — still not the medicine", ["home", "kitchen", "night"]),
  extra("p-home-3", "photo-1555041469-a586c61ea9bc", "Living room sofa", "Mon, 2 Jun 2025", "2025-06-01", "Home", "memory", "The sofa I lay on when I was sick", ["home", "sofa", "sick"], { locationLabel: "home sofa" }),
  extra("p-home-4", "photo-1560448204-e02f11c3d0e2", "Bedroom window light", "Tue, 3 Jun 2025", "2025-06-03", "Home", "memory", "Bedroom the same week", ["home", "bedroom", "house"]),
  extra("p-home-5", "photo-1556911220-e15b29be8c8f", "Someone cooking", "Mon, 2 Jun 2025", "2025-06-02", "Home", "memory", "Someone made soup — episode, not a filename", ["home", "kitchen", "food", "sick"]),
  extra("p-home-6", "photo-1416879595882-3373a0480b5b", "Garden plants", "Sat, 11 May 2024", "2024-05-11", "Home", "memory", "Garden in spring near home", ["garden", "home", "plants"]),
  extra("p-home-7", "photo-1426604966848-d7adac402bff", "Hills on a local walk", "Sat, 11 May 2024", "2024-05-11", "Home", "memory", "Weekend walk, not a holiday trip", ["walk", "hills", "home"]),
  extra("p-med-3", "photo-1576671081837-49000212a370", "Pharmacy shelf", "Last year · Mar 2025", "2025-03-18", "Camera", "document", "Pharmacy run when I was sick", ["medicine", "pharmacy", "sick"]),
  extra("p-med-4", "photo-1576602976047-174e57a47881", "Pills in a hand", "Last year · Mar 2025", "2025-03-19", "Camera", "document", "The pack I photographed for the name", ["medicine", "pills", "sick", "prescription"]),
  extra("p-med-5", "photo-1576091160399-112ba8d25d1d", "Thermometer on a table", "Last year · Mar 2025", "2025-03-18", "Camera", "document", "Thermometer from the same sick week", ["sick", "thermometer", "home"]),
  extra("p-med-6", "photo-1579684385127-1ef15d508118", "Hospital corridor", "Last year · Mar 2025", "2025-03-17", "Camera", "memory", "The visit — I remember being sick, not the date", ["sick", "hospital", "last year"]),
  extra("p-med-7", "photo-1576091160550-2173dba999ef", "Bottles lined on a shelf", "Last year · Mar 2025", "2025-03-19", "Camera", "document", "Shelf of bottles — near miss for the blister pack", ["medicine", "bottle", "sick"]),
  extra("p-ss-2", "photo-1450101499163-c8848c66ca85", "Stack of papers", "Last year · Jan 2025", "2025-01-09", "Screenshots", "document", "Scan of papers I need later", ["document", "scan", "papers"]),
  extra("p-ss-3", "photo-1454165804606-c3d57bc86b40", "Laptop with a spreadsheet", "Last year · Jan 2025", "2025-01-10", "Screenshots", "screenshot", "Screenshot of the invoice sheet", ["screenshot", "invoice", "document"]),
  extra("p-ss-4", "photo-1586281380349-632531db7ed4", "Notebook and printed form", "Last year · Jan 2025", "2025-01-09", "Screenshots", "document", "Form I photographed instead of filing", ["document", "form", "scan"]),
  extra("p-ss-5", "photo-1517479149777-5f3b1511d5ad", "Airplane wing", "Last year · Jan 2025", "2025-01-08", "Screenshots", "memory", "The flight the boarding pass belongs to", ["travel", "plane", "ticket", "trip"]),
  extra("p-ss-6", "photo-1446776811953-b23d57bd21aa", "Window seat clouds", "Last year · Jan 2025", "2025-01-08", "Screenshots", "memory", "Window seat — I remember the flight, not the album", ["travel", "plane", "window"]),
  extra("p-ss-7", "photo-1441986300917-64674bd600d8", "Shop counter", "Last year · Jan 2025", "2025-01-09", "Screenshots", "screenshot", "The shop from the receipt screenshot", ["receipt", "shop", "screenshot"]),
  extra("p-ss-8", "photo-1556740758-90de374c12ad", "Store aisle", "Last year · Jan 2025", "2025-01-09", "Screenshots", "memory", "Aisle where I bought what the receipt is for", ["shop", "store", "receipt"]),
  extra("p-ss-9", "photo-1516321318423-f06f85e504b3", "Laptop on a desk", "Last year · Jan 2025", "2025-01-10", "Screenshots", "screenshot", "Screenshot of a chat with the booking", ["screenshot", "chat", "booking"]),
  extra("p-ss-10", "photo-1551650975-87deedd944c3", "Phone showing a map", "Last year · Jan 2025", "2025-01-08", "Screenshots", "screenshot", "Map pin I screenshot and then lost", ["screenshot", "map", "pin"]),
  extra("p-roof-1", "photo-1470337458703-46ad1756a187", "Rooftop with string lights", "Sat, 31 Dec 2024", "2024-12-31", "Rooftop nights", "memory", "String lights on a rooftop — I remember the vibe, not the venue", ["rooftop", "lights", "night", "string", "event"], { locationLabel: "rooftop string lights" }),
  extra("p-roof-2", "photo-1449824913935-59a10b8d2000", "City rooftop at night", "Sat, 31 Dec 2024", "2024-12-31", "Rooftop nights", "memory", "Same rooftop night — skyline, still no venue name", ["rooftop", "night", "city", "lights", "event"], { locationLabel: "rooftop string lights" }),
  extra("p-roof-3", "photo-1514933651103-005eec06c04b", "Bar on a rooftop", "Sat, 31 Dec 2024", "2024-12-31", "Rooftop nights", "memory", "Drinks under the lights that night", ["rooftop", "bar", "night", "lights", "event"]),
  extra("p-fw-1", "photo-1467810563316-b5476525c0f9", "Fireworks over water", "Sat, 31 Dec 2024", "2024-12-31", "New Year", "memory", "Fireworks that night — I remember the sky, not the date label", ["fireworks", "night", "new year", "event"], { locationLabel: "fireworks sky" }),
  extra("p-fw-2", "photo-1519677100203-a0e668c92439", "Crowd watching fireworks", "Sat, 31 Dec 2024", "2024-12-31", "New Year", "memory", "We watched fireworks from the rooftop", ["fireworks", "crowd", "night", "new year", "event", "rooftop"]),
  extra("p-gig-1", "photo-1516450137517-162bfbeb8dba", "Purple concert lights", "Sat, 21 Sep 2024", "2024-09-21", "Nights out", "memory", "The gig with the purple lights — venue name gone", ["concert", "gig", "purple", "lights", "music", "event"], { locationLabel: "dark venue lights" }),
  extra("p-gig-2", "photo-1533174072545-7a4b6ad7a6c3", "Packed concert floor", "Sat, 21 Sep 2024", "2024-09-21", "Nights out", "memory", "Same night, still no artist I could type", ["concert", "crowd", "lights", "music", "event", "gig"]),
  extra("p-gig-3", "photo-1511671782779-c97d3d27a1d4", "Singer under spotlights", "Sat, 21 Sep 2024", "2024-09-21", "Nights out", "memory", "The person on stage — a face, not a search name", ["concert", "stage", "lights", "music", "event", "face"], { people: ["friend"] }),
  extra("p-auto-1", "photo-1532664189809-02133fee698d", "Yellow auto on a busy street", "Thu, 12 Dec 2024", "2024-12-12", "Goa trip", "memory", "The yellow auto we took looking for that cafe", ["rickshaw", "auto", "yellow", "goa", "trip", "street"], { locationLabel: "yellow auto" }),
  extra("p-auto-2", "photo-1570168007204-dfb528c6958f", "City street from a ride", "Thu, 12 Dec 2024", "2024-12-12", "Goa trip", "memory", "Ride through town — I remember the auto, not the pin", ["rickshaw", "auto", "street", "goa", "trip"]),
  extra("p-scoot-2", "photo-1558981359-219d6364c9c8", "Motorcycle on a coastal road", "Fri, 13 Dec 2024", "2024-12-13", "Goa trip", "memory", "Scooter day — activity remembered, date forgotten", ["scooter", "bike", "goa", "trip", "holiday"]),
  extra("p-rain-2", "photo-1503435980610-a51f3ddfee50", "Rain on a street at night", "Thu, 12 Dec 2024", "2024-12-12", "Goa trip", "memory", "Monsoon night we ducked under an awning", ["rain", "monsoon", "night", "goa", "trip"], { locationLabel: "rain street" }),
  extra("p-dog-beach-1", "photo-1530281700549-e82e7bf110d6", "Dog running on a beach", "Fri, 13 Dec 2024", "2024-12-13", "Goa trip", "memory", "The dog on the beach that trip", ["dog", "beach", "pets", "goa", "trip", "animals"], { people: ["friend"] }),
  extra("p-ker-7", "photo-1447752875215-b2761acb3c5d", "Houseboat deck at dusk", "Aug 2023", "2023-08-14", "Kerala trip", "memory", "On the houseboat — backwaters, not a beach cafe", ["houseboat", "boat", "kerala", "trip", "water", "dusk"], { locationLabel: "backwaters" }),
  extra("p-ker-8", "photo-1500534314209-a25ddb2bd429", "Lake from a boat", "Aug 2023", "2023-08-15", "Kerala trip", "memory", "Water all week — I remember the boat, not the village name", ["boat", "water", "kerala", "trip", "houseboat"]),
  extra("p-diya-1", "photo-1524231757912-21f4fe3a7200", "Lamps in a courtyard", "Thu, 31 Oct 2024", "2024-10-31", "Festival", "memory", "Diwali lamps — I remember the glow, not whose house", ["diwali", "lamps", "diya", "lights", "festival", "event"], { locationLabel: "courtyard lamps" }),
  extra("p-diya-2", "photo-1513151233558-d860c5398176", "Festival lights on a street", "Thu, 31 Oct 2024", "2024-10-31", "Festival", "memory", "Street lit for Diwali", ["diwali", "lights", "festival", "night", "event"]),
  extra("p-qr-1", "photo-1606092195730-5d7b9af1efc5", "QR code on a table tent", "Last year · Jan 2025", "2025-01-09", "Screenshots", "screenshot", "QR of the menu — I remember the cafe table, not the file", ["qr", "menu", "screenshot", "cafe", "code"]),
  extra("p-menu-1", "photo-1551218808-94e220e084d2", "Paper menu on a table", "Last year · Jan 2025", "2025-01-09", "Screenshots", "screenshot", "Photo of the menu before I lost the QR", ["menu", "screenshot", "food", "cafe"]),
  extra("p-horse-1", "photo-1553284965-83fd3e82fa5a", "Horses in a field", "Sun, 4 Aug 2024", "2024-08-04", "Pets", "memory", "Horses in the field — I remember the animals, not the date", ["horse", "horses", "pony", "animals", "pets", "field"], { locationLabel: "horse field" }),
  extra("p-horse-2", "photo-1589726053835-d19c17f79bcc", "Brown horse running", "Sun, 4 Aug 2024", "2024-08-04", "Pets", "memory", "The horse running that afternoon", ["horse", "horses", "animals", "pets", "running"]),
  extra("p-horse-3", "photo-1598974357801-cbca100e65d3", "Brown horse in a field", "Sun, 4 Aug 2024", "2024-08-04", "Pets", "memory", "Close-up of the horse I wanted to find", ["horse", "pony", "animals", "pets"]),
  extra("p-horse-beach-1", "photo-1627414878889-faddbe46bdba", "Horses on a beach", "Fri, 13 Dec 2024", "2024-12-13", "Goa trip", "memory", "Horses we saw on that trip", ["horse", "horses", "goa", "trip", "animals", "beach"], { locationLabel: "beach horse" }),
  extra("p-horse-4", "photo-1562163170-4a023d7c99e7", "Brown horse in golden light", "Sun, 4 Aug 2024", "2024-08-04", "Pets", "memory", "The horse in evening light", ["horse", "horses", "animals", "pets"]),
];
