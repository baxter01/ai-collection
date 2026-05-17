/**
 * PurpleCase - Logika frontendu
 *
 * Funkcje:
 * - System pieniędzy (localStorage), start 100zł
 * - Otwieranie skrzynki kosztuje (blokada gdy brak środków)
 * - Doładowanie +50zł co 15 minut (cooldown)
 * - Filtrowanie skrzynek po kategoriach
 * - Sekcja Upgrade
 * - Prawdziwe obrazki skinów ze Steam CDN
 */

// ==========================================================================
// SYSTEM PIENIĘDZY
// ==========================================================================
const MONEY_KEY = 'purplecase_money';
const COOLDOWN_KEY = 'purplecase_topup_cooldown';
const INVENTORY_KEY = 'purplecase_inventory';
const STARTING_MONEY = 100.00;
const TOPUP_AMOUNT = 50.00;
const TOPUP_COOLDOWN_MS = 15 * 60 * 1000; // 15 minut

function getMoney() {
    const stored = localStorage.getItem(MONEY_KEY);
    if (stored === null) {
        // Pierwsze odwiedziny - daj 100zł
        setMoney(STARTING_MONEY);
        return STARTING_MONEY;
    }
    return parseFloat(stored) || 0;
}

function setMoney(amount) {
    const safe = Math.max(0, parseFloat(amount.toFixed(2)));
    localStorage.setItem(MONEY_KEY, safe.toString());
    updateBalanceUI();
}

function addMoney(amount) {
    setMoney(getMoney() + amount);
}

function subtractMoney(amount) {
    setMoney(getMoney() - amount);
}

function canAfford(amount) {
    return getMoney() >= amount;
}

function updateBalanceUI() {
    const el = document.querySelector('.balance-amount');
    if (el) el.textContent = getMoney().toFixed(2);
}

// === COOLDOWN DOŁADOWANIA ===
function getLastTopupTime() {
    const stored = localStorage.getItem(COOLDOWN_KEY);
    return stored ? parseInt(stored, 10) : 0;
}

function setLastTopupTime(timestamp) {
    localStorage.setItem(COOLDOWN_KEY, timestamp.toString());
}

function getTopupCooldownRemaining() {
    const last = getLastTopupTime();
    const elapsed = Date.now() - last;
    return Math.max(0, TOPUP_COOLDOWN_MS - elapsed);
}

function canClaimTopup() {
    return getTopupCooldownRemaining() === 0;
}

function formatCooldown(ms) {
    const totalSec = Math.ceil(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
}

// === INVENTORY (przedmioty zatrzymane) ===
function getInventory() {
    try {
        return JSON.parse(localStorage.getItem(INVENTORY_KEY) || '[]');
    } catch {
        return [];
    }
}

function addToInventory(item) {
    const inv = getInventory();
    inv.push({ ...item, addedAt: Date.now() });
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inv));
}

function removeFromInventory(index) {
    const inv = getInventory();
    inv.splice(index, 1);
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inv));
}

// ==========================================================================
// HELPER: render obrazka skina (img z fallbackiem na emoji)
// ==========================================================================
function renderItemImage(item) {
    if (item && item.image) {
        // Escape pojedynczych cudzysłowów w nazwie aby nie zepsuć HTML-a w onerror
        const safeIcon = (item.icon || '🔫').replace(/'/g, "\\'");
        const safeName = (item.name || '').replace(/'/g, "\\'");
        return `<img src="${item.image}" alt="${safeName}" loading="lazy"
                     onerror="this.outerHTML='<span class=&quot;item-emoji-fallback&quot;>${safeIcon}</span>'">`;
    }
    return `<span class="item-emoji-fallback">${(item && item.icon) || '🔫'}</span>`;
}

// ==========================================================================
// SEKCJA: KATEGORIE I FILTROWANIE SKRZYNEK
// ==========================================================================
let activeCategory = 'popular';

function getFilteredCases() {
    if (activeCategory === 'all') return CASES;
    return CASES.filter(c => Array.isArray(c.categories) && c.categories.includes(activeCategory));
}

function renderCases() {
    const grid = document.getElementById('casesGrid');
    if (!grid) return;

    const filtered = getFilteredCases();

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
                Brak skrzynek w tej kategorii
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(c => {
        const imageHtml = c.image
            ? `<img src="${c.image}" alt="${c.name}" loading="lazy"
                    onerror="this.outerHTML='<span class=&quot;case-image-fallback&quot; style=&quot;font-size:80px&quot;>${c.emoji}</span>'">`
            : `<span class="case-image-fallback" style="font-size:80px">${c.emoji}</span>`;

        return `
            <div class="case-card" data-case-id="${c.id}">
                <div class="case-card-glow"></div>
                ${c.badge ? `<div class="case-badge">${c.badge}</div>` : ''}
                <div class="case-image-wrapper">
                    <div class="case-image" style="background: ${c.gradient}">
                        ${imageHtml}
                    </div>
                </div>
                <h3 class="case-name">${c.name}</h3>
                <div class="case-items-count">${c.items} przedmiotów</div>
                <div class="case-price">
                    <span class="case-price-amount">${c.price.toFixed(2)} zł</span>
                </div>
            </div>
        `;
    }).join('');

    grid.querySelectorAll('.case-card').forEach(card => {
        card.addEventListener('click', () => {
            const caseId = card.dataset.caseId;
            const caseData = CASES.find(c => c.id === caseId);
            if (caseData) openCaseModal(caseData);
        });
    });
}

function initCategoryTabs() {
    const tabs = document.querySelectorAll('.cat-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeCategory = tab.dataset.category || 'popular';
            renderCases();
        });
    });
}

// ==========================================================================
// SEKCJA: NAJPOPULARNIEJSZE PRZEDMIOTY
// ==========================================================================
function renderItems() {
    const grid = document.getElementById('featuredGrid');
    if (!grid) return;

    grid.innerHTML = ITEMS.map(item => `
        <div class="item-card rarity-${item.rarity}">
            <div class="item-image">${renderItemImage(item)}</div>
            <div class="item-rarity">${RARITY_NAMES[item.rarity] || item.rarity}</div>
            <div class="item-name">${item.name}</div>
            <div class="item-price">${item.price.toFixed(2)} zł</div>
        </div>
    `).join('');
}

// ==========================================================================
// MODAL OTWIERANIA SKRZYNKI - Z BLOKADĄ KASY
// ==========================================================================
function openCaseModal(caseData) {
    let modal = document.getElementById('caseModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'caseModal';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }

    const affordable = canAfford(caseData.price);
    const myMoney = getMoney();

    modal.innerHTML = `
        <div class="modal">
            <button class="modal-close" id="modalClose">×</button>
            <h2 class="modal-title">${caseData.name}</h2>
            <p class="modal-subtitle">
                Cena: <strong>${caseData.price.toFixed(2)} zł</strong>
                · Saldo: <strong style="color: ${affordable ? 'var(--purple-light)' : '#ef4444'}">${myMoney.toFixed(2)} zł</strong>
            </p>

            <div id="rollerView">
                <div class="roller-container">
                    <div class="roller-pointer"></div>
                    <div class="roller-fade roller-fade-left"></div>
                    <div class="roller-fade roller-fade-right"></div>
                    <div class="roller-track" id="rollerTrack"></div>
                </div>

                ${!affordable ? `
                    <div class="warning-box">
                        ⚠️ Brak środków! Potrzebujesz <strong>${(caseData.price - myMoney).toFixed(2)} zł</strong> więcej.
                        <br><small>Kliknij "Doładuj" aby otrzymać darmowe 50 zł co 15 minut.</small>
                    </div>
                ` : ''}

                <div class="modal-actions">
                    <button class="btn-secondary" id="cancelBtn">Anuluj</button>
                    ${affordable ? `
                        <button class="btn-primary" id="spinBtn">
                            <span>🎁 Otwórz za ${caseData.price.toFixed(2)} zł</span>
                        </button>
                    ` : `
                        <button class="btn-primary" id="topupRedirectBtn">
                            <span>💳 Doładuj konto</span>
                        </button>
                    `}
                </div>
            </div>

            <div class="result-container" id="resultView">
                <div class="result-label">🎉 Wygrałeś!</div>
                <div class="result-icon" id="resultIcon">🔫</div>
                <div class="result-name" id="resultName">-</div>
                <div class="result-rarity" id="resultRarity">-</div>
                <div class="result-price" id="resultPrice">-</div>
                <div class="modal-actions">
                    <button class="btn-secondary" id="sellBtn">💰 Sprzedaj</button>
                    <button class="btn-primary" id="keepBtn">
                        <span>📦 Zatrzymaj</span>
                    </button>
                </div>
            </div>
        </div>
    `;

    setTimeout(() => modal.classList.add('active'), 10);

    fillRoller(caseData);

    document.getElementById('modalClose').onclick = closeModal;
    document.getElementById('cancelBtn').onclick = closeModal;

    if (affordable) {
        document.getElementById('spinBtn').onclick = () => {
            // Pobierz pieniądze ZANIM zacznie się animacja
            subtractMoney(caseData.price);
            spinRoller(caseData);
        };
    } else {
        document.getElementById('topupRedirectBtn').onclick = () => {
            closeModal();
            setTimeout(() => openTopupModal(), 300);
        };
    }

    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };
}

function closeModal() {
    const modal = document.getElementById('caseModal');
    if (modal) modal.classList.remove('active');
}

function fillRoller(caseData) {
    const track = document.getElementById('rollerTrack');
    if (!track) return;

    const pool = (caseData && caseData.pool && caseData.pool.length > 0) ? caseData.pool : ITEMS;
    let html = '';
    for (let i = 0; i < 60; i++) {
        const item = pool[Math.floor(Math.random() * pool.length)];
        html += `
            <div class="roller-item rarity-${item.rarity}" data-index="${i}">
                <div class="roller-item-icon">${renderItemImage(item)}</div>
                <div class="roller-item-name">${item.name}</div>
            </div>
        `;
    }
    track.innerHTML = html;
    track.style.transform = 'translateX(0)';
    track.style.transition = 'none';
}

function spinRoller(caseData) {
    const track = document.getElementById('rollerTrack');
    const spinBtn = document.getElementById('spinBtn');
    if (!track) return;

    if (spinBtn) {
        spinBtn.disabled = true;
        spinBtn.style.opacity = '0.5';
        spinBtn.innerHTML = '<span>⏳ Otwieranie...</span>';
    }

    const pool = (caseData && caseData.pool && caseData.pool.length > 0) ? caseData.pool : ITEMS;
    const winningItem = pickWeightedItem(pool);

    const winningIndex = 50;
    const itemWidth = 188;
    const containerWidth = track.parentElement.offsetWidth;

    const items = track.querySelectorAll('.roller-item');
    if (items[winningIndex]) {
        items[winningIndex].className = `roller-item rarity-${winningItem.rarity}`;
        items[winningIndex].innerHTML = `
            <div class="roller-item-icon">${renderItemImage(winningItem)}</div>
            <div class="roller-item-name">${winningItem.name}</div>
        `;
    }

    const randomOffset = (Math.random() - 0.5) * 100;
    const targetX = -(winningIndex * itemWidth) + (containerWidth / 2) - (180 / 2) + randomOffset;

    requestAnimationFrame(() => {
        track.style.transition = 'transform 6s cubic-bezier(0.05, 0.7, 0.1, 1)';
        track.style.transform = `translateX(${targetX}px)`;
    });

    setTimeout(() => showResult(winningItem), 6200);
}

function pickWeightedItem(pool) {
    const weights = {
        'consumer': 100,
        'industrial': 80,
        'milspec': 60,
        'restricted': 40,
        'classified': 20,
        'covert': 8,
        'knife': 2
    };

    const weighted = [];
    pool.forEach(item => {
        const w = weights[item.rarity] || 1;
        for (let i = 0; i < w; i++) weighted.push(item);
    });

    return weighted[Math.floor(Math.random() * weighted.length)] || pool[0];
}

function showResult(item) {
    document.getElementById('rollerView').style.display = 'none';

    const resultView = document.getElementById('resultView');
    resultView.classList.add('show');

    document.getElementById('resultIcon').innerHTML = renderItemImage(item);
    document.getElementById('resultName').textContent = item.name;

    const rarityEl = document.getElementById('resultRarity');
    rarityEl.textContent = RARITY_NAMES[item.rarity] || item.rarity;
    const rarityColors = {
        'restricted': 'var(--rarity-restricted)',
        'classified': 'var(--rarity-classified)',
        'covert': 'var(--rarity-covert)',
        'knife': 'var(--rarity-knife)'
    };
    rarityEl.style.color = rarityColors[item.rarity] || 'var(--purple)';

    document.getElementById('resultPrice').textContent = `${item.price.toFixed(2)} zł`;

    document.getElementById('sellBtn').onclick = () => {
        addMoney(item.price);
        showToast(`💰 Sprzedano za ${item.price.toFixed(2)} zł! Saldo: ${getMoney().toFixed(2)} zł`);
        closeModal();
    };
    document.getElementById('keepBtn').onclick = () => {
        addToInventory(item);
        showToast(`📦 ${item.name} dodany do ekwipunku!`);
        closeModal();
    };
}

// ==========================================================================
// MODAL DOŁADOWANIA - +50zł co 15 minut
// ==========================================================================
let topupCountdownInterval = null;

function openTopupModal() {
    let modal = document.getElementById('topupModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'topupModal';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }

    renderTopupModal(modal);
    setTimeout(() => modal.classList.add('active'), 10);

    modal.onclick = (e) => {
        if (e.target === modal) closeTopupModal();
    };
}

function renderTopupModal(modal) {
    const remaining = getTopupCooldownRemaining();
    const canClaim = remaining === 0;
    const myMoney = getMoney();

    modal.innerHTML = `
        <div class="modal" style="max-width: 480px;">
            <button class="modal-close" id="topupClose">×</button>
            <h2 class="modal-title">💎 Doładowanie konta</h2>
            <p class="modal-subtitle">Aktualne saldo: <strong style="color: var(--purple-light)">${myMoney.toFixed(2)} zł</strong></p>

            <div class="topup-card">
                <div class="topup-icon">🎁</div>
                <div class="topup-title">Darmowe ${TOPUP_AMOUNT.toFixed(0)} zł</div>
                <div class="topup-desc">Co 15 minut możesz otrzymać darmowe środki na otwieranie skrzynek</div>

                ${canClaim ? `
                    <button class="btn-primary topup-claim-btn" id="claimTopupBtn">
                        <span>✨ Odbierz +${TOPUP_AMOUNT.toFixed(2)} zł</span>
                    </button>
                ` : `
                    <div class="topup-cooldown">
                        <div class="topup-cooldown-label">Następne doładowanie za:</div>
                        <div class="topup-cooldown-time" id="cooldownTime">${formatCooldown(remaining)}</div>
                    </div>
                    <button class="btn-primary topup-claim-btn" disabled style="opacity: 0.5; cursor: not-allowed;">
                        <span>⏳ Czekaj...</span>
                    </button>
                `}
            </div>

            <div class="topup-info">
                💡 <strong>Wskazówka:</strong> Sprzedając wygrane skiny otrzymujesz pełną wartość rynkową — dobry sposób na powiększenie salda!
            </div>
        </div>
    `;

    document.getElementById('topupClose').onclick = closeTopupModal;

    if (canClaim) {
        document.getElementById('claimTopupBtn').onclick = () => {
            addMoney(TOPUP_AMOUNT);
            setLastTopupTime(Date.now());
            showToast(`✨ Otrzymałeś +${TOPUP_AMOUNT.toFixed(2)} zł! Saldo: ${getMoney().toFixed(2)} zł`);
            renderTopupModal(modal); // Odśwież widok modalu
            startCooldownTimer();
        };
    } else {
        startCooldownTimer();
    }
}

function startCooldownTimer() {
    stopCooldownTimer();
    topupCountdownInterval = setInterval(() => {
        const remaining = getTopupCooldownRemaining();
        const timeEl = document.getElementById('cooldownTime');
        const modal = document.getElementById('topupModal');

        if (remaining === 0 && modal && modal.classList.contains('active')) {
            // Cooldown skończony - przerysuj modal aby pokazać przycisk
            renderTopupModal(modal);
            stopCooldownTimer();
        } else if (timeEl) {
            timeEl.textContent = formatCooldown(remaining);
        }
    }, 1000);
}

function stopCooldownTimer() {
    if (topupCountdownInterval) {
        clearInterval(topupCountdownInterval);
        topupCountdownInterval = null;
    }
}

function closeTopupModal() {
    const modal = document.getElementById('topupModal');
    if (modal) modal.classList.remove('active');
    stopCooldownTimer();
}

// ==========================================================================
// SEKCJA UPGRADE
// ==========================================================================
let upgradeFromItem = null; // Wybrany przedmiot z ekwipunku
let upgradeToItem = null;   // Cel upgrade'u

function renderUpgradeSection() {
    const grid = document.getElementById('upgradeFromList');
    if (!grid) return;

    const inventory = getInventory();

    if (inventory.length === 0) {
        grid.innerHTML = `
            <div class="upgrade-empty">
                <div style="font-size: 48px; margin-bottom: 12px;">📦</div>
                <div>Twój ekwipunek jest pusty</div>
                <small>Otwieraj skrzynki i zatrzymuj skiny aby je ulepszać</small>
            </div>
        `;
        return;
    }

    grid.innerHTML = inventory.map((item, idx) => `
        <div class="upgrade-mini-card rarity-${item.rarity}" data-inv-idx="${idx}">
            <div class="upgrade-mini-image">${renderItemImage(item)}</div>
            <div class="upgrade-mini-name">${item.name}</div>
            <div class="upgrade-mini-price">${item.price.toFixed(2)} zł</div>
        </div>
    `).join('');

    grid.querySelectorAll('.upgrade-mini-card').forEach(card => {
        card.addEventListener('click', () => {
            grid.querySelectorAll('.upgrade-mini-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            const idx = parseInt(card.dataset.invIdx, 10);
            upgradeFromItem = { ...inventory[idx], _invIdx: idx };
            renderUpgradeTargets();
            updateUpgradeUI();
        });
    });
}

function renderUpgradeTargets() {
    const grid = document.getElementById('upgradeToList');
    if (!grid) return;

    if (!upgradeFromItem) {
        grid.innerHTML = `<div class="upgrade-empty"><small>Najpierw wybierz przedmiot z ekwipunku po lewej</small></div>`;
        return;
    }

    // Cele upgrade: przedmioty droższe od źródła (do 5x cena)
    const allPoolItems = CASES.flatMap(c => c.pool);
    const seen = new Set();
    const targets = allPoolItems.filter(item => {
        if (seen.has(item.name)) return false;
        seen.add(item.name);
        return item.price > upgradeFromItem.price * 1.3 && item.price < upgradeFromItem.price * 8;
    }).sort((a, b) => a.price - b.price).slice(0, 8);

    if (targets.length === 0) {
        grid.innerHTML = `<div class="upgrade-empty"><small>Brak dostępnych celów upgrade dla tego przedmiotu</small></div>`;
        return;
    }

    grid.innerHTML = targets.map((item, idx) => `
        <div class="upgrade-mini-card rarity-${item.rarity}" data-target-idx="${idx}">
            <div class="upgrade-mini-image">${renderItemImage(item)}</div>
            <div class="upgrade-mini-name">${item.name}</div>
            <div class="upgrade-mini-price">${item.price.toFixed(2)} zł</div>
        </div>
    `).join('');

    grid.querySelectorAll('.upgrade-mini-card').forEach(card => {
        card.addEventListener('click', () => {
            grid.querySelectorAll('.upgrade-mini-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            const idx = parseInt(card.dataset.targetIdx, 10);
            upgradeToItem = targets[idx];
            updateUpgradeUI();
        });
    });
}

function calculateUpgradeChance() {
    if (!upgradeFromItem || !upgradeToItem) return 0;
    // Szansa proporcjonalna do stosunku cen, z lekkim przewagą domu (-7%)
    const ratio = upgradeFromItem.price / upgradeToItem.price;
    const chance = Math.max(5, Math.min(90, ratio * 93));
    return chance;
}

function updateUpgradeUI() {
    const fromBox = document.getElementById('upgradeFromBox');
    const toBox = document.getElementById('upgradeToBox');
    const chanceEl = document.getElementById('upgradeChance');
    const btn = document.getElementById('upgradeBtn');

    if (fromBox) {
        if (upgradeFromItem) {
            fromBox.innerHTML = `
                <div class="upgrade-display rarity-${upgradeFromItem.rarity}">
                    <div class="upgrade-display-img">${renderItemImage(upgradeFromItem)}</div>
                    <div class="upgrade-display-name">${upgradeFromItem.name}</div>
                    <div class="upgrade-display-price">${upgradeFromItem.price.toFixed(2)} zł</div>
                </div>
            `;
        } else {
            fromBox.innerHTML = `<div class="upgrade-placeholder">Wybierz przedmiot z ekwipunku</div>`;
        }
    }

    if (toBox) {
        if (upgradeToItem) {
            toBox.innerHTML = `
                <div class="upgrade-display rarity-${upgradeToItem.rarity}">
                    <div class="upgrade-display-img">${renderItemImage(upgradeToItem)}</div>
                    <div class="upgrade-display-name">${upgradeToItem.name}</div>
                    <div class="upgrade-display-price">${upgradeToItem.price.toFixed(2)} zł</div>
                </div>
            `;
        } else {
            toBox.innerHTML = `<div class="upgrade-placeholder">Wybierz cel upgrade</div>`;
        }
    }

    const chance = calculateUpgradeChance();
    if (chanceEl) {
        chanceEl.textContent = `${chance.toFixed(1)}%`;
        chanceEl.style.color = chance > 50 ? '#10b981' : chance > 25 ? '#facc15' : '#ef4444';
    }

    if (btn) {
        const ready = upgradeFromItem && upgradeToItem;
        btn.disabled = !ready;
        btn.style.opacity = ready ? '1' : '0.5';
        btn.style.cursor = ready ? 'pointer' : 'not-allowed';
    }
}

function performUpgrade() {
    if (!upgradeFromItem || !upgradeToItem) return;

    const chance = calculateUpgradeChance();
    const roll = Math.random() * 100;
    const success = roll < chance;

    // Animacja: pokaż wynik po krótkim opóźnieniu
    const btn = document.getElementById('upgradeBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span>🎲 Losowanie...</span>';
    }

    setTimeout(() => {
        // Usuń przedmiot źródłowy z ekwipunku
        removeFromInventory(upgradeFromItem._invIdx);

        if (success) {
            // Sukces: dodaj nowy przedmiot do ekwipunku
            addToInventory(upgradeToItem);
            showToast(`✨ UPGRADE SUKCES! Otrzymałeś ${upgradeToItem.name}!`);
        } else {
            showToast(`💀 Upgrade nieudany! Straciłeś ${upgradeFromItem.name}`);
        }

        // Reset
        upgradeFromItem = null;
        upgradeToItem = null;
        renderUpgradeSection();
        renderUpgradeTargets();
        updateUpgradeUI();
    }, 1500);
}

function initUpgradeSection() {
    const btn = document.getElementById('upgradeBtn');
    if (btn) btn.onclick = performUpgrade;

    renderUpgradeSection();
    renderUpgradeTargets();
    updateUpgradeUI();
}

// ==========================================================================
// TOAST NOTIFICATIONS
// ==========================================================================
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==========================================================================
// LOADER
// ==========================================================================
function hideLoader() {
    const loader = document.getElementById('loaderOverlay');
    if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => {
            if (loader.classList.contains('hidden')) loader.style.display = 'none';
        }, 500);
    }
}

// ==========================================================================
// HERO CTA + DROPS
// ==========================================================================
function initHeroCTA() {
    const btn = document.querySelector('.hero-buttons .btn-primary');
    if (btn) {
        btn.addEventListener('click', () => {
            document.getElementById('cases').scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Przycisk "Doładuj" w navbarze
    const depositBtn = document.querySelector('.btn-deposit');
    if (depositBtn) {
        depositBtn.addEventListener('click', openTopupModal);
    }

    // Klik na balans też otwiera modal doładowania
    const balance = document.querySelector('.balance');
    if (balance) {
        balance.style.cursor = 'pointer';
        balance.addEventListener('click', openTopupModal);
    }
}

function setupInfiniteDrops() {
    const track = document.querySelector('.drops-track');
    if (track) {
        track.innerHTML += track.innerHTML;
    }
}

// ==========================================================================
// INIT
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
    // Inicjalizacja salda (pierwsze odwiedziny → 100 zł)
    updateBalanceUI();

    try {
        await loadGameData();
    } catch (err) {
        console.error('[PurpleCase] Critical error:', err);
        if (!Array.isArray(CASES) || CASES.length === 0) {
            useFallbackData();
        }
    }

    try {
        renderCases();
        renderItems();
        initCategoryTabs();
        initHeroCTA();
        setupInfiniteDrops();
        initUpgradeSection();
    } catch (err) {
        console.error('[PurpleCase] Render error:', err);
    } finally {
        hideLoader();
    }
});

// Bezpiecznik: zawsze schowaj loader po 15s
setTimeout(() => {
    const loader = document.getElementById('loaderOverlay');
    if (loader && !loader.classList.contains('hidden')) {
        console.warn('[PurpleCase] Loader timeout - wymuszam schowanie po 15s');
        if (typeof useFallbackData === 'function' && (!Array.isArray(CASES) || CASES.length === 0)) {
            useFallbackData();
            try {
                renderCases();
                renderItems();
                initCategoryTabs();
                initUpgradeSection();
            } catch (e) {}
        }
        hideLoader();
    }
}, 15000);
