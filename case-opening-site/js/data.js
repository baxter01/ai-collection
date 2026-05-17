/**
 * PurpleCase - Dane skrzynek i przedmiotów
 *
 * OBRAZKI SKINÓW:
 * Używamy darmowego API ByMykel CSGO-API, które dostarcza obrazki ze Steam CDN.
 * - API: https://bymykel.github.io/CSGO-API/api/en/skins.json (darmowe, statyczne JSON)
 * - Obrazy: https://community.cloudflare.steamstatic.com/economy/image/{hash}
 *
 * Dane są pobierane dynamicznie przy starcie aplikacji (po stronie przeglądarki).
 * W razie braku połączenia, używamy emoji jako fallback.
 */

// Endpointy API
const API = {
    skins: 'https://bymykel.github.io/CSGO-API/api/en/skins.json',
    crates: 'https://bymykel.github.io/CSGO-API/api/en/crates.json'
};

// Konfiguracja skrzynek (kuratorowane - 12 najpopularniejszych)
// Pasują do skrzynek dostępnych w API ByMykel
const CASES_CONFIG = [
    {
        id: 'crate-4001',
        name: 'Dragon Lore',
        apiName: 'Operation Bravo Case',
        emoji: '🐉',
        price: 249.99,
        items: 47,
        badge: 'HOT',
        gradient: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)'
    },
    {
        id: 'crate-4904',
        name: 'Phoenix Rising',
        apiName: 'Operation Phoenix Weapon Case',
        emoji: '🔥',
        price: 89.99,
        items: 32,
        badge: 'NEW',
        gradient: 'linear-gradient(135deg, #f97316 0%, #eab308 100%)'
    },
    {
        id: 'crate-4906',
        name: 'Cosmic Vault',
        apiName: 'Huntsman Weapon Case',
        emoji: '🌌',
        price: 149.99,
        items: 41,
        badge: 'TOP',
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
    },
    {
        id: 'crate-4035',
        name: 'Shadow Realm',
        apiName: 'Shadow Case',
        emoji: '👻',
        price: 59.99,
        items: 28,
        gradient: 'linear-gradient(135deg, #1e1b4b 0%, #581c87 100%)'
    },
    {
        id: 'crate-4669',
        name: 'Royal Treasury',
        apiName: 'Chroma Case',
        emoji: '👑',
        price: 199.99,
        items: 38,
        badge: 'VIP',
        gradient: 'linear-gradient(135deg, #eab308 0%, #f59e0b 100%)'
    },
    {
        id: 'crate-4670',
        name: 'Neon Dreams',
        apiName: 'Chroma 2 Case',
        emoji: '💜',
        price: 39.99,
        items: 25,
        gradient: 'linear-gradient(135deg, #d946ef 0%, #ec4899 100%)'
    },
    {
        id: 'crate-4675',
        name: 'Ice Storm',
        apiName: 'Glove Case',
        emoji: '❄️',
        price: 79.99,
        items: 30,
        gradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)'
    },
    {
        id: 'crate-4678',
        name: 'Mystic Forest',
        apiName: 'Spectrum Case',
        emoji: '🌿',
        price: 49.99,
        items: 26,
        gradient: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)'
    },
    {
        id: 'crate-4684',
        name: 'Demon Lord',
        apiName: 'Clutch Case',
        emoji: '😈',
        price: 299.99,
        items: 50,
        badge: 'LEGEND',
        gradient: 'linear-gradient(135deg, #dc2626 0%, #7c2d12 100%)'
    },
    {
        id: 'crate-4694',
        name: 'Galaxy Edge',
        apiName: 'Prisma Case',
        emoji: '🚀',
        price: 119.99,
        items: 35,
        gradient: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)'
    },
    {
        id: 'crate-4697',
        name: 'Thunder Strike',
        apiName: 'CS20 Case',
        emoji: '⚡',
        price: 69.99,
        items: 29,
        gradient: 'linear-gradient(135deg, #facc15 0%, #a855f7 100%)'
    },
    {
        id: 'crate-4700',
        name: 'Midnight Rose',
        apiName: 'Fracture Case',
        emoji: '🌹',
        price: 99.99,
        items: 33,
        badge: 'RARE',
        gradient: 'linear-gradient(135deg, #be123c 0%, #831843 100%)'
    }
];

// Fallback dane (gdy API nie odpowie)
const FALLBACK_ITEMS = [
    { name: 'AWP | Dragon Lore', icon: '🔫', image: null, rarity: 'covert', price: 4500.00 },
    { name: 'Karambit | Doppler', icon: '🔪', image: null, rarity: 'knife', price: 1850.00 },
    { name: 'AK-47 | Fire Serpent', icon: '🔫', image: null, rarity: 'covert', price: 980.50 },
    { name: 'M4A4 | Howl', icon: '🔫', image: null, rarity: 'covert', price: 2150.00 },
    { name: 'Butterfly Knife | Fade', icon: '🗡️', image: null, rarity: 'knife', price: 1620.00 },
    { name: 'AWP | Asiimov', icon: '🔫', image: null, rarity: 'classified', price: 145.99 },
    { name: 'Bayonet | Tiger Tooth', icon: '🔪', image: null, rarity: 'knife', price: 890.00 },
    { name: 'Glock-18 | Fade', icon: '🔫', image: null, rarity: 'restricted', price: 320.00 },
    { name: 'AK-47 | Vulcan', icon: '🔫', image: null, rarity: 'classified', price: 425.00 },
    { name: 'USP-S | Kill Confirmed', icon: '🔫', image: null, rarity: 'classified', price: 89.99 },
    { name: 'Desert Eagle | Blaze', icon: '🔫', image: null, rarity: 'restricted', price: 230.00 },
    { name: 'M4A1-S | Hyper Beast', icon: '🔫', image: null, rarity: 'classified', price: 75.50 }
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
    'Contraband': 'covert',
    '★': 'knife'
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

// Globalne dane - wypełniane dynamicznie
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
// Pobieranie danych z API
// ==========================================================================

/**
 * Mapuje skin z API na nasz format
 */
function mapApiSkin(apiSkin) {
    const rarityName = apiSkin.rarity?.name || apiSkin.rarity || '';
    const rarity = RARITY_MAP[rarityName] || 'milspec';

    // Generuj realistyczną cenę na bazie rzadkości
    const range = PRICE_RANGES[rarity] || [10, 100];
    const price = +(range[0] + Math.random() * (range[1] - range[0])).toFixed(2);

    return {
        id: apiSkin.id,
        name: apiSkin.name || 'Unknown Skin',
        image: apiSkin.image, // URL ze Steam CDN
        rarity,
        price,
        icon: getEmojiForWeapon(apiSkin.weapon?.name || apiSkin.name)
    };
}

/**
 * Zwraca emoji jako fallback dla broni
 */
function getEmojiForWeapon(weaponName) {
    const name = (weaponName || '').toLowerCase();
    if (name.includes('knife') || name.includes('bayonet') || name.includes('karambit')) return '🔪';
    if (name.includes('butterfly') || name.includes('huntsman')) return '🗡️';
    if (name.includes('awp') || name.includes('ssg')) return '🎯';
    if (name.includes('glove')) return '🧤';
    if (name.includes('grenade') || name.includes('molotov')) return '💣';
    return '🔫';
}

/**
 * Fetch z timeoutem - jeśli API nie odpowie w X sekund, rzuca błąd
 */
async function fetchWithTimeout(url, timeoutMs = 8000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        return res;
    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
            throw new Error(`Timeout po ${timeoutMs}ms: ${url}`);
        }
        throw err;
    }
}

/**
 * Używa fallback danych
 */
function useFallbackData() {
    ITEMS = FALLBACK_ITEMS;
    CASES = CASES_CONFIG.map(c => ({ ...c, pool: ITEMS }));
}

/**
 * Ładuje dane z API ByMykel - zawsze zwraca w ograniczonym czasie
 */
async function loadGameData() {
    try {
        console.log('[PurpleCase] 🔄 Pobieranie skinów z API...');
        const startTime = Date.now();

        // Pobierz skiny i skrzynki równolegle z timeoutem
        const [skinsRes, cratesRes] = await Promise.all([
            fetchWithTimeout(API.skins, 10000),
            fetchWithTimeout(API.crates, 10000)
        ]);

        console.log(`[PurpleCase] HTTP: skins=${skinsRes.status}, crates=${cratesRes.status} (${Date.now() - startTime}ms)`);

        if (!skinsRes.ok || !cratesRes.ok) {
            throw new Error(`HTTP error: skins=${skinsRes.status}, crates=${cratesRes.status}`);
        }

        const allSkins = await skinsRes.json();
        const allCrates = await cratesRes.json();

        console.log(`[PurpleCase] ✅ Pobrano ${allSkins.length} skinów i ${allCrates.length} skrzynek (${Date.now() - startTime}ms)`);

        // Filtruj tylko skiny z obrazkami (oszczędność RAM)
        const skinsWithImages = allSkins.filter(s => s && s.image);

        // ITEMS - 12 popularnych skinów
        const popularSkins = pickPopularItems(skinsWithImages);
        ITEMS = popularSkins.map(mapApiSkin);

        // CASES - dopasuj konfiguracje do prawdziwych skrzynek
        CASES = CASES_CONFIG.map(config => {
            const apiCrate = allCrates.find(c => c.name === config.apiName);
            return {
                ...config,
                image: apiCrate?.image || null,
                pool: getPoolForCrate(apiCrate, allSkins) || ITEMS
            };
        });

        console.log(`[PurpleCase] ✨ Gotowe (${Date.now() - startTime}ms)`);
        return true;
    } catch (err) {
        console.warn('[PurpleCase] ⚠️ Nie udało się pobrać danych z API, używam fallback:', err.message);
        useFallbackData();
        return false;
    }
}

/**
 * Wybiera 16 reprezentatywnych skinów do sekcji "Najpopularniejsze"
 */
function pickPopularItems(skins) {
    const targets = [
        'AWP | Dragon Lore',
        'AWP | Asiimov',
        'AK-47 | Fire Serpent',
        'AK-47 | Vulcan',
        'AK-47 | Redline',
        'M4A4 | Howl',
        'M4A4 | Asiimov',
        'M4A1-S | Hyper Beast',
        'USP-S | Kill Confirmed',
        'Desert Eagle | Blaze',
        'Glock-18 | Fade',
        '★ Karambit | Doppler',
        '★ Butterfly Knife | Fade',
        '★ Bayonet | Tiger Tooth',
        '★ M9 Bayonet | Marble Fade',
        '★ Talon Knife | Slaughter'
    ];

    const found = [];
    for (const target of targets) {
        const skin = skins.find(s =>
            s.name && s.name.toLowerCase().includes(target.toLowerCase().split('|')[1]?.trim() || '') &&
            s.name.toLowerCase().includes(target.toLowerCase().split('|')[0]?.trim().replace('★', '').trim() || '')
        );
        if (skin && !found.find(f => f.id === skin.id)) found.push(skin);
    }

    // Dopełnij losowymi covert/classified jeśli mało
    if (found.length < 12) {
        const coverts = skins.filter(s =>
            s.rarity?.name === 'Covert' || s.rarity?.name === 'Classified'
        );
        while (found.length < 12 && coverts.length > 0) {
            const idx = Math.floor(Math.random() * coverts.length);
            const skin = coverts.splice(idx, 1)[0];
            if (!found.find(f => f.id === skin.id)) found.push(skin);
        }
    }

    return found.slice(0, 12);
}

/**
 * Pobiera pulę przedmiotów dla danej skrzynki
 */
function getPoolForCrate(apiCrate, allSkins) {
    if (!apiCrate || !apiCrate.contains || apiCrate.contains.length === 0) return null;

    return apiCrate.contains
        .map(item => allSkins.find(s => s.id === item.id))
        .filter(Boolean)
        .map(mapApiSkin);
}
