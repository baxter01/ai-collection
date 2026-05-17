/**
 * PurpleCase - Dane skrzynek i przedmiotów
 */

const CASES = [
    {
        id: 'dragon-lore',
        name: 'Dragon Lore',
        emoji: '🐉',
        price: 249.99,
        items: 47,
        badge: 'HOT',
        gradient: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)'
    },
    {
        id: 'phoenix-rising',
        name: 'Phoenix Rising',
        emoji: '🔥',
        price: 89.99,
        items: 32,
        badge: 'NEW',
        gradient: 'linear-gradient(135deg, #f97316 0%, #eab308 100%)'
    },
    {
        id: 'cosmic-vault',
        name: 'Cosmic Vault',
        emoji: '🌌',
        price: 149.99,
        items: 41,
        badge: 'TOP',
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
    },
    {
        id: 'shadow-realm',
        name: 'Shadow Realm',
        emoji: '👻',
        price: 59.99,
        items: 28,
        gradient: 'linear-gradient(135deg, #1e1b4b 0%, #581c87 100%)'
    },
    {
        id: 'royal-treasury',
        name: 'Royal Treasury',
        emoji: '👑',
        price: 199.99,
        items: 38,
        badge: 'VIP',
        gradient: 'linear-gradient(135deg, #eab308 0%, #f59e0b 100%)'
    },
    {
        id: 'neon-dreams',
        name: 'Neon Dreams',
        emoji: '💜',
        price: 39.99,
        items: 25,
        gradient: 'linear-gradient(135deg, #d946ef 0%, #ec4899 100%)'
    },
    {
        id: 'ice-storm',
        name: 'Ice Storm',
        emoji: '❄️',
        price: 79.99,
        items: 30,
        gradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)'
    },
    {
        id: 'mystic-forest',
        name: 'Mystic Forest',
        emoji: '🌿',
        price: 49.99,
        items: 26,
        gradient: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)'
    },
    {
        id: 'demon-lord',
        name: 'Demon Lord',
        emoji: '😈',
        price: 299.99,
        items: 50,
        badge: 'LEGEND',
        gradient: 'linear-gradient(135deg, #dc2626 0%, #7c2d12 100%)'
    },
    {
        id: 'galaxy-edge',
        name: 'Galaxy Edge',
        emoji: '🚀',
        price: 119.99,
        items: 35,
        gradient: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)'
    },
    {
        id: 'thunder-strike',
        name: 'Thunder Strike',
        emoji: '⚡',
        price: 69.99,
        items: 29,
        gradient: 'linear-gradient(135deg, #facc15 0%, #a855f7 100%)'
    },
    {
        id: 'midnight-rose',
        name: 'Midnight Rose',
        emoji: '🌹',
        price: 99.99,
        items: 33,
        badge: 'RARE',
        gradient: 'linear-gradient(135deg, #be123c 0%, #831843 100%)'
    }
];

const ITEMS = [
    { name: 'AWP | Dragon Lore', icon: '🔫', rarity: 'covert', price: 4500.00 },
    { name: 'Karambit | Doppler', icon: '🔪', rarity: 'knife', price: 1850.00 },
    { name: 'AK-47 | Fire Serpent', icon: '🔫', rarity: 'covert', price: 980.50 },
    { name: 'M4A4 | Howl', icon: '🔫', rarity: 'covert', price: 2150.00 },
    { name: 'Butterfly Knife | Fade', icon: '🗡️', rarity: 'knife', price: 1620.00 },
    { name: 'AWP | Asiimov', icon: '🔫', rarity: 'classified', price: 145.99 },
    { name: 'Bayonet | Tiger Tooth', icon: '🔪', rarity: 'knife', price: 890.00 },
    { name: 'Glock-18 | Fade', icon: '🔫', rarity: 'restricted', price: 320.00 },
    { name: 'AK-47 | Vulcan', icon: '🔫', rarity: 'classified', price: 425.00 },
    { name: 'USP-S | Kill Confirmed', icon: '🔫', rarity: 'classified', price: 89.99 },
    { name: 'Desert Eagle | Blaze', icon: '🔫', rarity: 'restricted', price: 230.00 },
    { name: 'M4A1-S | Hyper Beast', icon: '🔫', rarity: 'classified', price: 75.50 }
];

const RARITY_NAMES = {
    'consumer': 'Consumer',
    'industrial': 'Industrial',
    'milspec': 'Mil-Spec',
    'restricted': 'Restricted',
    'classified': 'Classified',
    'covert': 'Covert',
    'knife': 'Exceedingly Rare ★'
};
