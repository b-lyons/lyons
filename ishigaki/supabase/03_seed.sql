-- Ishigaki guide — seed places
--
-- A starting set to edit down, nothing more. This used to open with
-- "delete from places", which would wipe real work on any project where
-- someone had started editing; it appends now, so re-running it duplicates
-- rows rather than destroying them. On a fresh project the table is empty
-- anyway.

insert into places (name, name_ja, category, area, blurb, notes, lat, lng, must_do, booking, best_time) values

-- ── Sights & nature ──────────────────────────────────────────────────────────
('Kabira Bay', '川平湾', 'sights', 'Kabira',
 'The postcard view of the island: jade water over white sand, studded with little forested islets and black pearl rafts.',
 'Swimming is banned here and the currents are genuinely dangerous. Take a glass-bottom boat instead, and walk up to the viewpoint behind the car park.',
 24.4539, 124.1459, true, null, 'Late morning, once the sun is high enough to light the sand'),

('Hirakubozaki Lighthouse', '平久保崎灯台', 'sights', 'North',
 'The northern tip of the island — a white lighthouse on a grassy headland with ocean on three sides.',
 'About an hour from town up a beautiful, empty road. Windy almost always. Pair it with Sunset Beach on the way back.',
 24.5966, 124.3077, true, null, 'Clear days — the colour of the water is the whole point'),

('Tamatorizaki Observatory', '玉取崎展望台', 'sights', 'East coast',
 'A short hibiscus-lined path up to a lookout over the narrowest part of the island, with reef on both sides.',
 'Free, five minutes off the main road, and the best single stop if you are driving north.',
 24.4718, 124.2555, false, null, null),

('Cape Ugan', '御神崎', 'sights', 'West coast',
 'A lighthouse on a cliff at the western cape, with the sea breaking on the rocks below.',
 'The island sunset spot. Get there about 40 minutes before sundown.',
 24.4290, 124.0876, false, null, 'Sunset'),

('Banna Park Emerald Viewpoint', 'バンナ公園 エメラルドの海を見る展望台', 'sights', 'Ishigaki City',
 'A forested hill just behind town with a lookout over the harbour, the city and the islands beyond.',
 'You can drive right to the top. Good for orienting yourself on day one.',
 24.3884, 124.1567, false, null, null),

('Mt. Omoto', '於茂登岳', 'sights', 'Central',
 'At 526 m the highest mountain in Okinawa Prefecture — a humid, jungly two-hour return climb.',
 'Muddy, rooty and hot. Long sleeves, water and proper shoes. The summit view is half-blocked by trees; the walk is the reward.',
 24.4261, 124.1836, false, null, 'Early morning, before the heat'),

('Torinji Temple', '桃林寺', 'sights', 'Ishigaki City',
 'Founded in 1614, the oldest temple in the Yaeyamas, with a pair of weathered wooden guardian kings in the gate.',
 'Ten minutes on foot from the port. Quiet and small — worth twenty minutes.',
 24.3376, 124.1519, false, null, null),

('Miyara Dunchi', '宮良殿内', 'sights', 'Ishigaki City',
 'An 1819 samurai-style residence with a dry coral-rock garden, the only one of its kind left in Okinawa.',
 'The garden is the highlight; the house itself is viewed from outside.',
 24.3410, 124.1601, false, null, null),

('Yaeyama Palm Grove', '米原のヤエヤマヤシ群落', 'sights', 'Yonehara',
 'A dense stand of Yaeyama palms — a species found nowhere else on earth — with a short boardwalk through the middle.',
 'Five minutes of walking, right by the road above Yonehara Beach. Take repellent.',
 24.4457, 124.1926, false, null, null),

('Nagura Amparu', '名蔵アンパル', 'sights', 'West coast',
 'A Ramsar-listed mangrove estuary full of mudskippers, fiddler crabs and waders.',
 'Best seen by kayak on a tour, but there is a decent view from the bridge on Route 79.',
 24.4013, 124.1236, false, null, 'Low tide'),

('Ishigaki Island Limestone Cave', '石垣島鍾乳洞', 'sights', 'Ishigaki City',
 'A 660 m walkable stretch of a much larger cave system, hung with stalactites formed out of ancient coral reef.',
 'Touristy and over-lit, but genuinely good and the best rainy-day option on the island.',
 24.3543, 124.1444, false, null, 'Rainy afternoons'),

-- ── Beaches ──────────────────────────────────────────────────────────────────
('Yonehara Beach', '米原ビーチ', 'sights', 'Yonehara',
 'The best shore snorkelling on the island — living coral and fish start a few metres off the sand.',
 'Take this seriously: there is a strong current past the reef edge and no lifeguard. Stay inside the reef, wear a rash guard against the sun, and watch for stonefish — reef shoes help.',
 24.4616, 124.1878, true, null, 'High tide on a calm morning'),

('Sukuji Beach', '底地ビーチ', 'sights', 'Kabira',
 'A long, shallow, calm crescent just around the headland from Kabira — the easy swimming beach.',
 'Showers and toilets in season. Not much coral, but safe and very pretty.',
 24.4589, 124.1337, false, null, null),

('Fusaki Beach', 'フサキビーチ', 'sights', 'West coast',
 'West-facing resort beach with a long wooden pier pointing straight at the sunset over Taketomi.',
 'The pier is open to non-guests and is one of the nicest places on the island at dusk.',
 24.3734, 124.1237, false, null, 'Sunset'),

('Maezato Beach', '真栄里ビーチ', 'sights', 'Ishigaki City',
 'The closest swimmable beach to town, about ten minutes by car.',
 'Netted swimming area in season. Convenient rather than spectacular.',
 24.3355, 124.1731, false, null, null),

('Sunset Beach', 'サンセットビーチ', 'sights', 'North',
 'White sand and very clear, shallow water near the top of the island.',
 'Worth the detour if you are already driving to Hirakubozaki. Facilities are seasonal.',
 24.5576, 124.2822, false, null, 'Late afternoon'),

('Shiraho Reef', '白保海岸', 'sights', 'East coast',
 'The village beach at Shiraho, fronting the largest blue coral colony in the northern hemisphere.',
 'The coral is offshore, so you need a boat — local operators in the village run short snorkel trips. The beach itself is for looking, not swimming.',
 24.3594, 124.2281, false, 'Book a village snorkel boat a day ahead', 'Calm mornings'),

-- ── On the water ─────────────────────────────────────────────────────────────
('Manta Scramble', 'マンタスクランブル', 'daytrip', 'Kabira',
 'A cleaning station off Kabira Ishizaki where reef mantas queue up over the coral heads.',
 'Boat access only, from Kabira. Dive and snorkel operators both run trips, and it is the single best thing in the water here.',
 24.4790, 124.1290, true, 'Book ahead in summer — boats fill up', 'June to November, best odds in autumn'),

('Blue Cave', '青の洞窟', 'daytrip', 'Yonehara',
 'A limestone sea cave near Yonehara that glows blue when the light comes in off the water.',
 'Usually sold as a combined kayak, cave and snorkel half-day.',
 24.4660, 124.1800, false, 'Tour only', 'Mid-morning light'),

('Kabira Bay glass-bottom boats', '川平湾グラスボート', 'daytrip', 'Kabira',
 'Half-hour loops over the coral and giant clams in the bay, in boats with a window in the floor.',
 'Several operators share the jetty and you can just turn up. The only way to actually get out onto the bay.',
 24.4530, 124.1465, false, null, null),

('Nagura Bay mangrove kayak', '名蔵湾カヤック', 'daytrip', 'West coast',
 'Paddling up into the mangrove channels on the west coast, usually around slack tide.',
 'Calm, shaded and forgiving. Several operators run half-days.',
 24.4020, 124.1250, false, 'Book a day or two ahead', null),

('Phantom Island sandbar', '幻の島(浜島)', 'daytrip', 'Off-island',
 'A crescent of bare white sand that surfaces out of open sea at low tide and then disappears again.',
 'Boat trips run from Ishigaki port, usually combined with snorkelling off Kohama.',
 24.3210, 124.0180, true, 'Tour only, and tide-dependent', 'Low tide'),

-- ── Day trips ────────────────────────────────────────────────────────────────
('Taketomi Island', '竹富島', 'daytrip', 'Off-island',
 'Fifteen minutes by ferry: one village of red-tiled roofs, coral walls and white sand lanes, with water buffalo carts and no traffic.',
 'Go on the first ferry or stay the night — it empties out beautifully after the last boat. Rent a bike at the port. Kondoi Beach on the west side is the best swimming in the Yaeyamas.',
 24.3313, 124.0870, true, null, 'First ferry, or late afternoon'),

('Iriomote Island', '西表島', 'daytrip', 'Off-island',
 'The wild one: ninety per cent jungle, mangrove rivers, waterfalls, and the almost-never-seen Iriomote cat.',
 'Forty minutes by ferry. Doable as a long day trip — Urauchi River cruise plus the walk to Mariyudu Falls — but much better overnight.',
 24.3300, 123.8100, false, 'Book the river cruise ahead in season', null),

('Kohama Island', '小浜島', 'daytrip', 'Off-island',
 'Sugar cane hills and a single ridge road with views out across the whole Yaeyama group.',
 'An easy half-day: ferry over, rent a bike, ride up Shuga-michi.',
 24.3430, 123.9740, false, null, null),

-- ── Food ─────────────────────────────────────────────────────────────────────
('Hitoshi (Sekkanto branch)', 'ひとし 石敢當店', 'food', 'Ishigaki City',
 'The most famous izakaya on the island, and deservedly so — the fatty tuna and the sea grape salad are what people plan trips around.',
 'Reservations are essential and open roughly a month ahead, then vanish in minutes. If you cannot get in, try the other branch, or turn up early and wait.',
 24.3411, 124.1585, true, 'Reserve about a month ahead — not an exaggeration', null),

('Yakiniku Kitauchi Bokujo', '焼肉きたうち牧場', 'food', 'Ishigaki City',
 'Ishigaki beef grilled over charcoal, from a restaurant owned by the farm that raises the cattle.',
 'Order an assortment so you can taste the difference between cuts. Book at weekends.',
 24.3392, 124.1553, true, 'Book at weekends', null),

('Akaishi Shokudo', '明石食堂', 'food', 'North',
 'A plain roadside canteen in the north that people drive an hour for: Yaeyama soba and soki, stewed pork ribs, done properly.',
 'Short hours, closes irregularly, and there is a queue before it opens. Check it is actually open before committing to the drive.',
 24.5120, 124.2870, false, 'No bookings — join the queue', 'Get there before it opens'),

('Kunatsuyu', '来夏世', 'food', 'Ishigaki City',
 'Yaeyama soba in an old tiled house with a garden: thin round noodles, clear pork broth, no fuss.',
 'Lunch only, and often sold out by early afternoon.',
 24.3556, 124.1636, false, null, 'Early lunch'),

('Funakura no Sato', '舟蔵の里', 'food', 'Ishigaki City',
 'Okinawan and Yaeyama home cooking in a relocated traditional house, with live sanshin in the evenings.',
 'Touristy in the good way — a nice place for a first night.',
 24.3448, 124.1489, false, 'Book for dinner', null),

('Ishigaki Public Market', '石垣市公設市場', 'food', 'Ishigaki City',
 'Two floors of island produce, fish, chilli oil, sea salt and Ishigaki beef, with craft stalls upstairs.',
 'Good for snacks, and for working out what is in season before you order it in a restaurant.',
 24.3401, 124.1554, false, null, 'Mornings'),

-- ── Drink ────────────────────────────────────────────────────────────────────
('Misaki-cho', '美崎町', 'drink', 'Ishigaki City',
 'The island nightlife, packed into a few blocks behind the port: izakaya, snack bars, live sanshin houses and awamori until late.',
 'Wander rather than plan. Many places have no English sign; the ones with a cloth curtain over the door are usually worth trying.',
 24.3382, 124.1566, true, null, 'After 8pm'),

('Takamine Awamori Distillery', '高嶺酒造所', 'drink', 'Kabira',
 'A small family distillery near Kabira making Omoto awamori, with a free walk-through of the mash room and a tasting at the end.',
 'Ten minutes, free, and they will pour you the 43 per cent if you ask. Someone else drives.',
 24.4429, 124.1490, false, null, null),

('Seifuku Awamori Distillery', '請福酒造', 'drink', 'Ishigaki City',
 'The biggest awamori maker on the island, with a proper tour and a tasting counter of thirty-odd bottlings.',
 'The shop is the best place to buy a bottle to take home.',
 24.3698, 124.1600, false, null, null),

('Fusaki Beach sunset bar', 'フサキビーチ サンセットバー', 'drink', 'West coast',
 'Drinks on the sand facing west, with Taketomi on the horizon and the pier in silhouette.',
 'Open to non-guests. Seasonal, so check it is running in winter.',
 24.3736, 124.1240, false, null, 'Sunset'),

-- ── Practical ────────────────────────────────────────────────────────────────
('New Ishigaki Airport', '南ぬ島石垣空港', 'practical', 'East coast',
 'The island airport, about thirty minutes east of town, with direct flights from Naha, Tokyo and Osaka.',
 'Pick the rental car up here rather than in town. The airport bus into the city takes about forty minutes.',
 24.3964, 124.2450, false, null, null),

('Ishigaki Port Ferry Terminal', '石垣港離島ターミナル', 'practical', 'Ishigaki City',
 'Every ferry to every other Yaeyama island leaves from here: Taketomi, Iriomote, Kohama, Hateruma.',
 'Two operators run near-identical schedules and you buy on the day at the counter. Hateruma boats cancel often in wind.',
 24.3364, 124.1553, true, null, null),

('Euglena Mall', 'ユーグレナモール', 'shop', 'Ishigaki City',
 'The covered shopping arcade in the middle of town — souvenirs, Ishigaki salt, chilli oil, T-shirts and a supermarket.',
 'Where to buy things to take home on the last afternoon.',
 24.3399, 124.1560, false, null, null),

('Yaeyama Hospital', '県立八重山病院', 'practical', 'Ishigaki City',
 'The main hospital, and the only emergency department in the Yaeyama islands.',
 'Worth knowing where it is. The emergency number in Japan is 119 for an ambulance.',
 24.3527, 124.1752, false, null, null);
