/**
 * PurpleCase - Dane skrzynek i przedmiotów
 *
 * Strategia ładowania obrazków skinów:
 * 1) Próbujemy pobrać `crates.json` z ByMykel CSGO-API (mniejszy ~2MB plik
 *    który zawiera listę skrzynek WRAZ z obrazkami skinów wewnątrz `contains`)
 * 2) Jeśli się nie uda - używamy fallback emoji
 *
 * Endpoint: https://bymykel.github.io/CSGO-API/api/en/crates.json
 * Struktura każdej skrzynki: { id, name, image, contains: [{id, name, image, rarity}] }
 */

// ==========================================================================
// KONFIGURACJA SKRZYNEK
// Mapuje nazwy "biznesowe" (które chcemy pokazać) do nazw z gry CS
// + ustawia ceny, kategorie, gradienty
// ==========================================================================
const CASES_CONFIG = [
    {
        id: 'dragon_hoard',
        displayName: 'Dragon Hoard',
        gameNames: ['Operation Bravo Case', 'eSports 2014 Summer Case'],
        emoji: '🐉',
        gradient: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
        price: 89.99,
        badge: 'HOT',
        categories: ['popular', 'premium']
    },
    {
        id: 'phoenix_blaze',
        displayName: 'Phoenix Blaze',
        gameNames: ['Operation Phoenix Weapon Case'],
        emoji: '🔥',
        gradient: 'linear-gradient(135deg, #f97316 0%, #eab308 100%)',
        price: 49.99,
        badge: 'NEW',
        categories: ['popular', 'new']
    },
    {
        id: 'cosmic_vault',
        displayName: 'Cosmic Vault',
        gameNames: ['Huntsman Weapon Case', 'Operation Vanguard Weapon Case'],
        emoji: '🌌',
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        price: 79.99,
        badge: 'TOP',
        categories: ['popular', 'premium']
    },
    {
        id: 'shadow_realm',
        displayName: 'Shadow Realm',
        gameNames: ['Shadow Case', 'Falchion Case'],
        emoji: '👻',
        gradient: 'linear-gradient(135deg, #1e1b4b 0%, #581c87 100%)',
        price: 14.99,
        categories: ['cheap', 'new']
    },
    {
        id: 'royal_treasury',
        displayName: 'Royal Treasury',
        gameNames: ['Chroma Case', 'Chroma 2 Case', 'Chroma 3 Case'],
        emoji: '👑',
        gradient: 'linear-gradient(135deg, #eab308 0%, #f59e0b 100%)',
        price: 149.99,
        badge: 'VIP',
        categories: ['premium']
    },
    {
        id: 'neon_dreams',
        displayName: 'Neon Dreams',
        gameNames: ['Spectrum Case', 'Spectrum 2 Case'],
        emoji: '💜',
        gradient: 'linear-gradient(135deg, #d946ef 0%, #ec4899 100%)',
        price: 9.99,
        categories: ['cheap', 'popular']
    },
    {
        id: 'ice_storm',
        displayName: 'Ice Storm',
        gameNames: ['Operation Hydra Case', 'Glove Case'],
        emoji: '❄️',
        gradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
        price: 39.99,
        categories: ['popular', 'gloves']
    },
    {
        id: 'glove_box',
        displayName: 'Glove Box',
        gameNames: ['Glove Case', 'Clutch Case'],
        emoji: '🧤',
        gradient: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
        price: 99.99,
        badge: 'RARE',
        categories: ['gloves', 'premium']
    },
    {
        id: 'demon_lord',
        displayName: 'Demon Lord',
        gameNames: ['Operation Riptide Case', 'Snakebite Case'],
        emoji: '😈',
        gradient: 'linear-gradient(135deg, #dc2626 0%, #7c2d12 100%)',
        price: 199.99,
        badge: 'LEGEND',
        categories: ['premium']
    },
    {
        id: 'knife_chest',
        displayName: 'Knife Chest',
        gameNames: ['Operation Broken Fang Case', 'Recoil Case'],
        emoji: '🔪',
        gradient: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
        price: 129.99,
        badge: 'NEW',
        categories: ['knives', 'new', 'premium']
    },
    {
        id: 'starter_pack',
        displayName: 'Starter Pack',
        gameNames: ['CS:GO Weapon Case', 'CS20 Case'],
        emoji: '🎁',
        gradient: 'linear-gradient(135deg, #facc15 0%, #a855f7 100%)',
        price: 4.99,
        badge: 'CHEAP',
        categories: ['cheap', 'new']
    },
    {
        id: 'galaxy_edge',
        displayName: 'Galaxy Edge',
        gameNames: ['Prisma Case', 'Prisma 2 Case'],
        emoji: '🚀',
        gradient: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
        price: 59.99,
        categories: ['popular']
    },
    {
        id: 'thunder_strike',
        displayName: 'Thunder Strike',
        gameNames: ['Revolution Case', 'Recoil Case'],
        emoji: '⚡',
        gradient: 'linear-gradient(135deg, #facc15 0%, #f97316 100%)',
        price: 69.99,
        badge: 'HOT',
        categories: ['popular', 'new']
    },
    {
        id: 'midnight_rose',
        displayName: 'Midnight Rose',
        gameNames: ['Fracture Case', 'Dreams & Nightmares Case'],
        emoji: '🌹',
        gradient: 'linear-gradient(135deg, #be123c 0%, #831843 100%)',
        price: 89.99,
        badge: 'RARE',
        categories: ['premium']
    },
    {
        id: 'mystic_forest',
        displayName: 'Mystic Forest',
        gameNames: ['Gamma Case', 'Gamma 2 Case'],
        emoji: '🌿',
        gradient: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
        price: 24.99,
        categories: ['cheap', 'popular']
    },
    {
        id: 'arcade_madness',
        displayName: 'Arcade Madness',
        gameNames: ['Spectrum Case', 'Horizon Case'],
        emoji: '🎮',
        gradient: 'linear-gradient(135deg, #ec4899 0%, #06b6d4 100%)',
        price: 19.99,
        badge: 'NEW',
        categories: ['cheap', 'new']
    },
    {
        id: 'samurai_legacy',
        displayName: 'Samurai Legacy',
        gameNames: ['Shattered Web Case', 'Operation Hydra Case'],
        emoji: '⚔️',
        gradient: 'linear-gradient(135deg, #dc2626 0%, #18102e 100%)',
        price: 109.99,
        categories: ['knives', 'premium']
    },
    {
        id: 'crystal_palace',
        displayName: 'Crystal Palace',
        gameNames: ['Chroma 3 Case', 'Gamma Case'],
        emoji: '💎',
        gradient: 'linear-gradient(135deg, #06b6d4 0%, #c084fc 100%)',
        price: 159.99,
        badge: 'VIP',
        categories: ['premium']
    },
    {
        id: 'ghost_rider',
        displayName: 'Ghost Rider',
        gameNames: ['Spectrum 2 Case', 'Shadow Case'],
        emoji: '👻',
        gradient: 'linear-gradient(135deg, #7c3aed 0%, #18102e 100%)',
        price: 29.99,
        categories: ['cheap']
    },
    {
        id: 'pyro_vault',
        displayName: 'Pyro Vault',
        gameNames: ['Operation Phoenix Weapon Case', 'Falchion Case'],
        emoji: '🔥',
        gradient: 'linear-gradient(135deg, #ef4444 0%, #facc15 100%)',
        price: 44.99,
        categories: ['popular', 'cheap']
    }
];

// Mapowanie nazw rzadkości API → nasze klasy CSS
const RARITY_MAP = {
    'Consumer Grade': 'consumer',
    'Industrial Grade': 'industrial',
    'Mil-Spec Grade': 'milspec',
    'Restricted': 'restricted',
    'Classified': 'classified',
    'Covert': 'covert',
    'Extraordinary': 'knife',
    'Contraband': 'covert'
};

// Realistyczne ceny dla rzadkości (PLN)
const PRICE_RANGES = {
    'consumer': [0.5, 5],
    'industrial': [2, 15],
    'milspec': [5, 50],
    'restricted': [15, 200],
    'classified': [50, 800],
    'covert': [200, 5000],
    'knife': [500, 20000]
};

// Globalne dane wypełniane dynamicznie
let CASES = [];
let ITEMS = [];

const RARITY_NAMES = {
    'consumer': 'Consumer',
    'industrial': 'Industrial',
    'milspec': 'Mil-Spec',
    'restricted': 'Restricted',
    'classified': 'Classified',
    'covert': 'Covert',
    'knife': 'Exceedingly Rare ★'
};

// ==========================================================================
// FALLBACK - emoji + nazwy (gdy API niedostępne)
// ==========================================================================
const FALLBACK_ITEMS_TEMPLATE = [
    { name: 'AWP | Dragon Lore', icon: '🎯', rarity: 'covert', basePrice: 4500 },
    { name: '★ Karambit | Doppler', icon: '🔪', rarity: 'knife', basePrice: 1850 },
    { name: 'AK-47 | Fire Serpent', icon: '🔫', rarity: 'covert', basePrice: 980 },
    { name: 'M4A4 | Howl', icon: '🔫', rarity: 'covert', basePrice: 2150 },
    { name: '★ Butterfly Knife | Fade', icon: '🔪', rarity: 'knife', basePrice: 1620 },
    { name: 'AWP | Asiimov', icon: '🎯', rarity: 'classified', basePrice: 145 },
    { name: '★ Bayonet | Tiger Tooth', icon: '🔪', rarity: 'knife', basePrice: 890 },
    { name: 'Glock-18 | Fade', icon: '🔫', rarity: 'restricted', basePrice: 320 },
    { name: 'AK-47 | Vulcan', icon: '🔫', rarity: 'classified', basePrice: 425 },
    { name: 'USP-S | Kill Confirmed', icon: '🔫', rarity: 'classified', basePrice: 89 },
    { name: 'Desert Eagle | Blaze', icon: '🔫', rarity: 'restricted', basePrice: 230 },
    { name: 'M4A1-S | Hyper Beast', icon: '🔫', rarity: 'classified', basePrice: 75 }
];

function buildFallbackItems() {
    return FALLBACK_ITEMS_TEMPLATE.map((item, idx) => ({
        id: `fallback_${idx}`,
        name: item.name,
        icon: item.icon,
        image: null,
        rarity: item.rarity,
        price: +(item.basePrice * (0.9 + Math.random() * 0.2)).toFixed(2)
    }));
}

// ==========================================================================
// HELPERY
// ==========================================================================
function getEmojiForWeapon(weaponName) {
    const name = (weaponName || '').toLowerCase();
    if (name.includes('knife') || name.includes('bayonet') || name.includes('karambit') ||
        name.includes('butterfly') || name.includes('huntsman') || name.includes('talon') ||
        name.includes('m9') || name.includes('navaja') || name.includes('falchion') ||
        name.includes('shadow') || name.includes('stiletto') || name.includes('ursus') ||
        name.includes('paracord') || name.includes('survival')) return '🔪';
    if (name.includes('glove')) return '🧤';
    if (name.includes('awp') || name.includes('ssg')) return '🎯';
    if (name.includes('grenade') || name.includes('molotov') || name.includes('flashbang')) return '💣';
    return '🔫';
}

function fetchWithTimeout(url, timeoutMs = 12000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { signal: controller.signal })
        .then(res => {
            clearTimeout(timeoutId);
            return res;
        })
        .catch(err => {
            clearTimeout(timeoutId);
            throw err;
        });
}

/**
 * Mapuje skin z API na nasz format
 */
function mapApiSkin(apiItem) {
    const rarityName = (apiItem.rarity && apiItem.rarity.name) || apiItem.rarity || '';
    const rarity = RARITY_MAP[rarityName] || 'milspec';
    const range = PRICE_RANGES[rarity] || [10, 100];
    const price = +(range[0] + Math.random() * (range[1] - range[0])).toFixed(2);

    return {
        id: apiItem.id || apiItem.name,
        name: apiItem.name || 'Unknown Skin',
        image: apiItem.image || null,
        rarity,
        price,
        icon: getEmojiForWeapon(apiItem.name)
    };
}

// ==========================================================================
// GŁÓWNE: Załaduj dane z API (z fallback)
// ==========================================================================
async function loadGameData() {
    const startTime = Date.now();

    // Lista źródeł - próbujemy po kolei aż któreś zadziała
    const sources = [
        'https://bymykel.github.io/CSGO-API/api/en/crates.json',
        'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/crates.json'
    ];

    let allCrates = null;
    let lastErr = null;

    for (const url of sources) {
        try {
            console.log(`[PurpleCase] 🔄 Próbuję: ${url}`);
            const res = await fetchWithTimeout(url, 10000);
            if (!res.ok) {
                lastErr = new Error(`HTTP ${res.status}`);
                continue;
            }
            allCrates = await res.json();
            console.log(`[PurpleCase] ✅ Pobrano ${allCrates.length} skrzynek (${Date.now() - startTime}ms)`);
            break;
        } catch (err) {
            lastErr = err;
            console.warn(`[PurpleCase] Źródło niedostępne: ${err.message}`);
        }
    }

    if (!allCrates) {
        console.warn('[PurpleCase] ⚠️ Wszystkie źródła API niedostępne, używam fallback:', lastErr && lastErr.message);
        useFallbackData();
        return false;
    }

    try {
        // Buduj nasze CASES z konfiguracji + danych API
        CASES = CASES_CONFIG.map(config => {
            // Znajdź pierwszą pasującą skrzynkę z API
            let apiCrate = null;
            for (const gameName of config.gameNames) {
                apiCrate = allCrates.find(c => c.name === gameName);
                if (apiCrate) break;
            }

            // Buduj pulę przedmiotów
            let pool = [];
            if (apiCrate && apiCrate.contains && apiCrate.contains.length > 0) {
                pool = apiCrate.contains.map(mapApiSkin);
            }
            // Dodaj rare items (knives/gloves) z API jeśli istnieją
            if (apiCrate && apiCrate.contains_rare && apiCrate.contains_rare.length > 0) {
                pool = pool.concat(apiCrate.contains_rare.map(item => ({
                    ...mapApiSkin(item),
                    rarity: 'knife' // Wszystkie rare to nóż lub rękawica
                })));
            }

            // Jeśli pula jest pusta - dodaj fallback
            if (pool.length === 0) {
                pool = buildFallbackItems();
            }

            return {
                id: config.id,
                name: config.displayName,
                emoji: config.emoji,
                image: (apiCrate && apiCrate.image) || null,
                gradient: config.gradient,
                price: config.price,
                badge: config.badge,
                categories: config.categories,
                items: pool.length,
                pool
            };
        });

        // Buduj listę najpopularniejszych przedmiotów (16 sztuk)
        // Bierzemy najlepsze covert/classified/knife z różnych skrzynek
        const allItemsFromCases = CASES.flatMap(c => c.pool);
        const seenNames = new Set();
        const popular = [];

        // Priorytet: knife → covert → classified
        for (const rarity of ['knife', 'covert', 'classified', 'restricted']) {
            for (const item of allItemsFromCases) {
                if (popular.length >= 12) break;
                if (item.rarity !== rarity) continue;
                if (seenNames.has(item.name)) continue;
                seenNames.add(item.name);
                popular.push(item);
            }
            if (popular.length >= 12) break;
        }

        ITEMS = popular.length > 0 ? popular : buildFallbackItems();

        console.log(`[PurpleCase] ✨ Gotowe: ${CASES.length} skrzynek, ${ITEMS.length} przedmiotów (${Date.now() - startTime}ms)`);
        console.log(`[PurpleCase] Przykładowy obrazek:`, ITEMS[0] && ITEMS[0].image);

        return true;
    } catch (err) {
        console.warn('[PurpleCase] ⚠️ API niedostępne, używam fallback:', err.message);
        useFallbackData();
        return false;
    }
}

/**
 * Awaryjne dane gdy API nie odpowiada - emoji ale działa zawsze
 */
function useFallbackData() {
    ITEMS = buildFallbackItems();
    CASES = CASES_CONFIG.map(config => ({
        id: config.id,
        name: config.displayName,
        emoji: config.emoji,
        image: null,
        gradient: config.gradient,
        price: config.price,
        badge: config.badge,
        categories: config.categories,
        items: ITEMS.length,
        pool: buildFallbackItems()
    }));
}



// ==========================================================================
// LIVE DROPS - generuje fake "ostatnie wygrane" z prawdziwych skinów
// ==========================================================================
const FAKE_USERNAMES = [
    'xKillerPL', 'SnipeMaster', 'ProGamer', 'LuckyOne', 'RichBoy',
    'HeadshotKing', 'BladeRunner', 'FireShot', 'NightOwl', 'CyberWolf',
    'PolskiKozak', 'GhostHunter', 'PixelGod', 'NeonRider', 'ShadowFox',
    'KingPin', 'ToxicAvenger', 'WildCard', 'IceQueen', 'DarkSoul'
];

function generateLiveDrops(count = 16) {
    const drops = [];
    // Bierzemy tylko rzadkie/cenne skiny (covert/classified/knife) jeśli są
    const allItems = CASES.flatMap(c => c.pool || []);
    const rareItems = allItems.filter(i =>
        ['covert', 'classified', 'knife', 'restricted'].includes(i.rarity)
    );
    const pool = rareItems.length >= 5 ? rareItems : allItems;
    if (pool.length === 0) return [];

    for (let i = 0; i < count; i++) {
        const item = pool[Math.floor(Math.random() * pool.length)];
        const user = FAKE_USERNAMES[Math.floor(Math.random() * FAKE_USERNAMES.length)];
        drops.push({ item, user });
    }
    return drops;
}
