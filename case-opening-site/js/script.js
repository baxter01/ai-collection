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

    // Stan modalu (per-otwarcie)
    let quantity = 1;        // 1..5
    let jesterMode = false;  // true = równe szanse ale +50% ceny

    function totalCost() {
        const multi = jesterMode ? 1.5 : 1;
        return +(caseData.price * quantity * multi).toFixed(2);
    }

    function renderModalBody() {
        const cost = totalCost();
        const myMoney = getMoney();
        const affordable = myMoney >= cost;

        modal.innerHTML = `
            <div class="modal modal-case">
                <button class="modal-close" id="modalClose">×</button>
                <h2 class="modal-title">${caseData.name}</h2>
                <p class="modal-subtitle">
                    Cena: <strong>${cost.toFixed(2)} zł</strong>
                    · Saldo: <strong style="color: ${affordable ? 'var(--purple-light)' : '#ef4444'}">${myMoney.toFixed(2)} zł</strong>
                </p>

                <div id="rollerView">
                    <div class="case-options">
                        <div class="case-option-group">
                            <div class="case-option-label">Ilość skrzynek</div>
                            <div class="qty-selector" id="qtySelector">
                                ${[1, 2, 3, 4, 5].map(q => `
                                    <button class="qty-btn ${q === quantity ? 'active' : ''}" data-qty="${q}">x${q}</button>
                                `).join('')}
                            </div>
                        </div>
                        <div class="case-option-group">
                            <div class="case-option-label">
                                <span title="Jester: każdy skin ma tę samą szansę. Skrzynka kosztuje +50%.">
                                    🃏 Tryb Jester
                                </span>
                            </div>
                            <button class="jester-toggle ${jesterMode ? 'active' : ''}" id="jesterToggle">
                                <span class="jester-knob"></span>
                                <span class="jester-label">${jesterMode ? 'WŁĄCZONY' : 'WYŁĄCZONY'}</span>
                            </button>
                            ${jesterMode ? '<small style="color: var(--purple-light); font-size: 11px;">Równe szanse · +50% ceny</small>' : ''}
                        </div>
                    </div>

                    <div class="rollers-container" id="rollersContainer">
                        ${Array.from({ length: quantity }, (_, i) => `
                            <div class="roller-container" data-roller="${i}">
                                <div class="roller-pointer"></div>
                                <div class="roller-fade roller-fade-left"></div>
                                <div class="roller-fade roller-fade-right"></div>
                                <div class="roller-track" data-track="${i}"></div>
                            </div>
                        `).join('')}
                    </div>

                    ${!affordable ? `
                        <div class="warning-box">
                            ⚠️ Brak środków! Potrzebujesz <strong>${(cost - myMoney).toFixed(2)} zł</strong> więcej.
                            <br><small>Kliknij "Doładuj" aby otrzymać darmowe 50 zł co 15 minut.</small>
                        </div>
                    ` : ''}

                    <div class="modal-actions">
                        <button class="btn-secondary" id="cancelBtn">Anuluj</button>
                        ${affordable ? `
                            <button class="btn-primary" id="spinBtn">
                                <span>🎁 Otwórz ${quantity > 1 ? `${quantity}x ` : ''}za ${cost.toFixed(2)} zł</span>
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
                    <div class="results-grid" id="resultsGrid"></div>
                    <div class="result-summary" id="resultSummary"></div>
                    <div class="modal-actions">
                        <button class="btn-secondary" id="sellAllBtn">💰 Sprzedaj wszystko</button>
                        <button class="btn-primary" id="keepAllBtn">
                            <span>📦 Zatrzymaj wszystko</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        fillAllRollers(caseData, quantity);
        bindModalEvents();
    }

    function bindModalEvents() {
        document.getElementById('modalClose').onclick = closeModal;
        document.getElementById('cancelBtn').onclick = closeModal;

        // Selector ilości
        const qtySelector = document.getElementById('qtySelector');
        if (qtySelector) {
            qtySelector.querySelectorAll('.qty-btn').forEach(btn => {
                btn.onclick = () => {
                    quantity = parseInt(btn.dataset.qty, 10);
                    renderModalBody();
                };
            });
        }

        // Toggle Jester
        const jesterBtn = document.getElementById('jesterToggle');
        if (jesterBtn) {
            jesterBtn.onclick = () => {
                jesterMode = !jesterMode;
                renderModalBody();
            };
        }

        // Spin
        const spinBtn = document.getElementById('spinBtn');
        if (spinBtn) {
            spinBtn.onclick = () => {
                const cost = totalCost();
                if (!canAfford(cost)) {
                    showToast('Brak środków!');
                    return;
                }
                subtractMoney(cost);
                spinAllRollers(caseData, quantity, jesterMode);
            };
        }

        // Topup redirect
        const topupBtn = document.getElementById('topupRedirectBtn');
        if (topupBtn) {
            topupBtn.onclick = () => {
                closeModal();
                setTimeout(() => openTopupModal(), 300);
            };
        }
    }

    renderModalBody();
    setTimeout(() => modal.classList.add('active'), 10);

    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };
}

function closeModal() {
    const modal = document.getElementById('caseModal');
    if (modal) modal.classList.remove('active');
}

// Wypełnij wszystkie rolki przedmiotami z puli
function fillAllRollers(caseData, count) {
    const pool = (caseData && caseData.pool && caseData.pool.length > 0) ? caseData.pool : ITEMS;
    for (let r = 0; r < count; r++) {
        const track = document.querySelector(`[data-track="${r}"]`);
        if (!track) continue;
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
}

// Uruchom wszystkie rolki, każda z innym przedmiotem zwycięzcy
function spinAllRollers(caseData, count, jesterMode) {
    const pool = (caseData && caseData.pool && caseData.pool.length > 0) ? caseData.pool : ITEMS;
    const spinBtn = document.getElementById('spinBtn');
    if (spinBtn) {
        spinBtn.disabled = true;
        spinBtn.style.opacity = '0.5';
        spinBtn.innerHTML = '<span>⏳ Otwieranie...</span>';
    }

    const winners = [];
    for (let r = 0; r < count; r++) {
        const track = document.querySelector(`[data-track="${r}"]`);
        if (!track) continue;

        const winningItem = pickWeightedItem(pool, jesterMode);
        winners.push(winningItem);

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

        // Każda rolka startuje z lekkim opóźnieniem
        const delay = r * 100;
        setTimeout(() => {
            track.style.transition = 'transform 6s cubic-bezier(0.05, 0.7, 0.1, 1)';
            track.style.transform = `translateX(${targetX}px)`;
        }, delay);
    }

    // Po zakończeniu animacji wszystkich rolek (6s + max delay)
    setTimeout(() => showMultiResult(winners), 6300 + count * 100);
}

function pickWeightedItem(pool, jesterMode) {
    if (jesterMode) {
        // Każdy ma równą szansę (sprawiedliwy tryb)
        return pool[Math.floor(Math.random() * pool.length)] || pool[0];
    }

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

function showMultiResult(items) {
    const rollerView = document.getElementById('rollerView');
    if (rollerView) rollerView.style.display = 'none';

    const resultView = document.getElementById('resultView');
    resultView.classList.add('show');

    const grid = document.getElementById('resultsGrid');
    grid.innerHTML = items.map(item => `
        <div class="result-card rarity-${item.rarity}">
            <div class="result-card-img">${renderItemImage(item)}</div>
            <div class="result-card-name">${item.name}</div>
            <div class="result-card-rarity" style="color: ${rarityColor(item.rarity)};">
                ${RARITY_NAMES[item.rarity] || item.rarity}
            </div>
            <div class="result-card-price">${item.price.toFixed(2)} zł</div>
        </div>
    `).join('');

    const totalValue = items.reduce((sum, i) => sum + i.price, 0);
    const summaryEl = document.getElementById('resultSummary');
    if (summaryEl) {
        summaryEl.innerHTML = `
            <div class="result-summary-row">
                <span>Łącznie ${items.length} ${items.length === 1 ? 'przedmiot' : items.length < 5 ? 'przedmioty' : 'przedmiotów'}:</span>
                <strong>${totalValue.toFixed(2)} zł</strong>
            </div>
        `;
    }

    document.getElementById('sellAllBtn').onclick = () => {
        addMoney(totalValue);
        showToast(`💰 Sprzedano za ${totalValue.toFixed(2)} zł! Saldo: ${getMoney().toFixed(2)} zł`);
        closeModal();
    };
    document.getElementById('keepAllBtn').onclick = () => {
        items.forEach(item => addToInventory(item));
        showToast(`📦 ${items.length} ${items.length === 1 ? 'przedmiot dodany' : 'przedmiotów dodanych'} do ekwipunku!`);
        closeModal();
    };
}

function rarityColor(rarity) {
    const colors = {
        'restricted': 'var(--rarity-restricted)',
        'classified': 'var(--rarity-classified)',
        'covert': 'var(--rarity-covert)',
        'knife': 'var(--rarity-knife)'
    };
    return colors[rarity] || 'var(--purple)';
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
    const track = document.getElementById('liveDropsTrack');
    if (!track) return;

    const drops = generateLiveDrops(16);
    if (drops.length === 0) {
        track.innerHTML = '';
        return;
    }

    const renderDrop = (drop) => {
        const { item, user } = drop;
        const imgHtml = item.image
            ? `<img src="${item.image}" alt="${(item.name || '').replace(/"/g, '&quot;')}" loading="lazy"
                    onerror="this.outerHTML='<span class=&quot;drop-emoji&quot;>${item.icon || '🔫'}</span>'">`
            : `<span class="drop-emoji">${item.icon || '🔫'}</span>`;
        return `
            <div class="drop-card rarity-${item.rarity}">
                <div class="drop-img">${imgHtml}</div>
                <div class="drop-info">
                    <div class="drop-name">${item.name}</div>
                    <div class="drop-user">@${user}</div>
                </div>
            </div>
        `;
    };

    // Renderuj listę 2 razy aby animacja przewijania była nieskończona
    const html = drops.map(renderDrop).join('');
    track.innerHTML = html + html;

    // Co 8 sekund odśwież bezpiecznie (tylko gdy zakładka jest widoczna)
    if (window._liveDropsInterval) clearInterval(window._liveDropsInterval);
    window._liveDropsInterval = setInterval(() => {
        if (document.hidden) return;
        const fresh = generateLiveDrops(16);
        if (fresh.length > 0) {
            const fh = fresh.map(renderDrop).join('');
            track.innerHTML = fh + fh;
        }
    }, 8000);
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
        initBattles();
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
                initBattles();
            } catch (e) {}
        }
        hideLoader();
    }
}, 15000);



// ==========================================================================
// ⚔️ BITWY (BATTLES)
// ==========================================================================
//
// Tryby:
//  - normal   : wygrywa gracz z NAJWYŻSZĄ łączną wartością wygranych skinów
//  - underdog : wygrywa gracz z NAJNIŻSZĄ łączną wartością (chyba że jest 1 - dummy)
//
// Stan bitew trzymany w pamięci sesji (nie persistowany - bitwy są efemeryczne).
// ==========================================================================

const BATTLES = []; // tablica obiektów { id, mode, cases, players, status, winner, ... }
let battleFilter = 'all';

function generateBattleId() {
    return 'b' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
}

function fakeUser() {
    return FAKE_USERNAMES[Math.floor(Math.random() * FAKE_USERNAMES.length)];
}

function getBattleCost(battle) {
    return battle.cases.reduce((sum, c) => sum + c.price, 0);
}

function initBattles() {
    const createBtn = document.getElementById('createBattleBtn');
    if (createBtn) createBtn.onclick = openBattleCreator;

    document.querySelectorAll('.battle-filter-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.battle-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            battleFilter = btn.dataset.bf;
            renderBattlesList();
        };
    });

    // Załaduj kilka demo-bitew aby lista nie była pusta
    seedDemoBattles();
    renderBattlesList();
}

function seedDemoBattles() {
    if (BATTLES.length > 0) return;
    if (!Array.isArray(CASES) || CASES.length === 0) return;

    // Demo 1: oczekująca bitwa 1v1 normal
    const c1 = CASES[Math.floor(Math.random() * CASES.length)];
    BATTLES.push({
        id: generateBattleId(),
        mode: 'normal',
        cases: [c1, c1],
        players: [{ name: fakeUser(), bot: false, isMe: false, items: [] }],
        maxPlayers: 2,
        status: 'waiting',
        createdAt: Date.now()
    });

    // Demo 2: oczekująca bitwa 1v1v1 underdog
    const c2 = CASES[Math.floor(Math.random() * CASES.length)];
    BATTLES.push({
        id: generateBattleId(),
        mode: 'underdog',
        cases: [c2, c2, c2],
        players: [{ name: fakeUser(), bot: false, isMe: false, items: [] }],
        maxPlayers: 3,
        status: 'waiting',
        createdAt: Date.now()
    });
}

function getFilteredBattles() {
    if (battleFilter === 'all') return BATTLES;
    return BATTLES.filter(b => b.status === battleFilter);
}

function renderBattlesList() {
    const list = document.getElementById('battlesList');
    if (!list) return;

    const filtered = getFilteredBattles();
    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="battles-empty">
                <div style="font-size:48px;margin-bottom:8px;">⚔️</div>
                <div>Brak bitew w tej kategorii</div>
                <small>Stwórz nową bitwę i zaproś botów lub poczekaj na graczy</small>
            </div>
        `;
        return;
    }

    list.innerHTML = filtered.map(battle => renderBattleCard(battle)).join('');

    list.querySelectorAll('[data-battle-action]').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const action = btn.dataset.battleAction;
            const id = btn.dataset.battleId;
            const battle = BATTLES.find(b => b.id === id);
            if (!battle) return;
            if (action === 'join') joinBattle(battle);
            else if (action === 'addBot') addBotToBattle(battle);
            else if (action === 'view') openBattleViewer(battle);
            else if (action === 'start') startBattle(battle);
        };
    });
}

function renderBattleCard(battle) {
    const totalCost = getBattleCost(battle);
    const playerCount = battle.players.length;
    const me = battle.players.find(p => p.isMe);
    const slotsLeft = battle.maxPlayers - playerCount;

    let actionsHtml = '';
    if (battle.status === 'waiting') {
        const actions = [];
        if (slotsLeft > 0) {
            if (!me) {
                actions.push(`<button class="btn-secondary battle-action" data-battle-action="join" data-battle-id="${battle.id}">⚡ Dołącz (${totalCost.toFixed(2)} zł)</button>`);
            }
            actions.push(`<button class="btn-secondary battle-action" data-battle-action="addBot" data-battle-id="${battle.id}">🤖 Dodaj bota</button>`);
        }
        if (me && playerCount === battle.maxPlayers) {
            actions.push(`<button class="btn-primary battle-action" data-battle-action="start" data-battle-id="${battle.id}">▶ Rozpocznij</button>`);
        } else if (me) {
            actions.push(`<button class="btn-primary battle-action" data-battle-action="start" data-battle-id="${battle.id}">▶ Rozpocznij teraz</button>`);
        }
        actionsHtml = actions.join('');
    } else if (battle.status === 'finished') {
        actionsHtml = `<button class="btn-secondary battle-action" data-battle-action="view" data-battle-id="${battle.id}">👁️ Zobacz wynik</button>`;
    } else {
        actionsHtml = `<button class="btn-primary battle-action" data-battle-action="view" data-battle-id="${battle.id}">▶ Oglądaj</button>`;
    }

    const playerSlots = [];
    for (let i = 0; i < battle.maxPlayers; i++) {
        const p = battle.players[i];
        if (p) {
            playerSlots.push(`
                <div class="battle-slot ${p.isMe ? 'me' : ''} ${p.bot ? 'bot' : ''}">
                    <div class="battle-slot-avatar">${p.bot ? '🤖' : (p.isMe ? '👤' : '🎮')}</div>
                    <div class="battle-slot-name">${p.name}</div>
                </div>
            `);
        } else {
            playerSlots.push(`<div class="battle-slot empty"><div class="battle-slot-avatar">?</div><div class="battle-slot-name">Wolne</div></div>`);
        }
    }

    const modeBadge = battle.mode === 'underdog'
        ? '<span class="battle-mode-badge underdog">🎲 UNDERDOG</span>'
        : '<span class="battle-mode-badge normal">🏆 NORMAL</span>';

    const casesPreview = battle.cases.slice(0, 5).map(c =>
        `<span class="battle-mini-case" title="${c.name}">${c.emoji}</span>`
    ).join('');

    return `
        <div class="battle-card status-${battle.status}">
            <div class="battle-card-header">
                ${modeBadge}
                <div class="battle-card-cost">${totalCost.toFixed(2)} zł</div>
            </div>
            <div class="battle-card-cases">
                <span class="battle-cases-label">${battle.cases.length} skrzynek:</span>
                ${casesPreview}
                ${battle.cases.length > 5 ? `<span class="battle-mini-case">+${battle.cases.length - 5}</span>` : ''}
            </div>
            <div class="battle-card-slots">
                ${playerSlots.join('')}
            </div>
            <div class="battle-card-actions">
                ${actionsHtml}
            </div>
            ${battle.status === 'finished' && battle.winner ? `
                <div class="battle-winner">
                    🏆 Wygrał: <strong>${battle.winner.name}</strong> (${battle.winner.total.toFixed(2)} zł)
                </div>
            ` : ''}
        </div>
    `;
}

// ==========================================================================
// Tworzenie bitwy
// ==========================================================================
function openBattleCreator() {
    let modal = document.getElementById('battleCreatorModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'battleCreatorModal';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }

    let selectedCases = []; // tablica skrzynek (mogą się powtarzać)
    let mode = 'normal';
    let maxPlayers = 2;

    function totalCost() {
        return selectedCases.reduce((sum, c) => sum + c.price, 0);
    }

    function render() {
        const cost = totalCost();
        modal.innerHTML = `
            <div class="modal modal-battle-creator">
                <button class="modal-close" id="bcClose">×</button>
                <h2 class="modal-title">⚔️ Utwórz bitwę</h2>
                <p class="modal-subtitle">Skonfiguruj rozgrywkę i zaproś przeciwników</p>

                <div class="bc-section">
                    <div class="bc-section-title">Tryb gry</div>
                    <div class="bc-mode-tabs">
                        <button class="bc-mode-tab ${mode === 'normal' ? 'active' : ''}" data-mode="normal">
                            🏆 Normal
                            <small>Wygrywa NAJWYŻSZA suma wygranych</small>
                        </button>
                        <button class="bc-mode-tab ${mode === 'underdog' ? 'active' : ''}" data-mode="underdog">
                            🎲 Underdog
                            <small>Wygrywa NAJNIŻSZA suma wygranych</small>
                        </button>
                    </div>
                </div>

                <div class="bc-section">
                    <div class="bc-section-title">Liczba graczy</div>
                    <div class="qty-selector">
                        ${[2, 3, 4].map(n => `
                            <button class="qty-btn ${n === maxPlayers ? 'active' : ''}" data-players="${n}">${n} graczy</button>
                        `).join('')}
                    </div>
                </div>

                <div class="bc-section">
                    <div class="bc-section-title">
                        Wybrane skrzynki (${selectedCases.length}) — Łącznie: <strong>${cost.toFixed(2)} zł</strong>
                    </div>
                    <div class="bc-selected" id="bcSelected">
                        ${selectedCases.length === 0
                            ? '<div class="bc-empty">Kliknij skrzynki poniżej aby je dodać do bitwy</div>'
                            : selectedCases.map((c, idx) => `
                                <div class="bc-selected-item" data-remove-idx="${idx}" title="${c.name} - kliknij aby usunąć">
                                    <span style="font-size: 24px;">${c.emoji}</span>
                                    <span class="bc-selected-price">${c.price.toFixed(2)} zł</span>
                                </div>
                            `).join('')}
                    </div>
                </div>

                <div class="bc-section">
                    <div class="bc-section-title">Wybierz skrzynki (klikaj aby dodawać):</div>
                    <div class="bc-cases-grid">
                        ${CASES.map(c => `
                            <div class="bc-case-card" data-case-id="${c.id}">
                                <div class="bc-case-emoji">${c.emoji}</div>
                                <div class="bc-case-name">${c.name}</div>
                                <div class="bc-case-price">${c.price.toFixed(2)} zł</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="btn-secondary" id="bcCancel">Anuluj</button>
                    <button class="btn-primary" id="bcCreate" ${selectedCases.length === 0 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>
                        <span>⚔️ Utwórz bitwę (${cost.toFixed(2)} zł)</span>
                    </button>
                </div>
            </div>
        `;

        bind();
    }

    function bind() {
        document.getElementById('bcClose').onclick = close;
        document.getElementById('bcCancel').onclick = close;

        modal.querySelectorAll('.bc-mode-tab').forEach(t => {
            t.onclick = () => { mode = t.dataset.mode; render(); };
        });
        modal.querySelectorAll('[data-players]').forEach(t => {
            t.onclick = () => { maxPlayers = parseInt(t.dataset.players, 10); render(); };
        });
        modal.querySelectorAll('.bc-case-card').forEach(card => {
            card.onclick = () => {
                if (selectedCases.length >= 20) {
                    showToast('Max 20 skrzynek na bitwę');
                    return;
                }
                const c = CASES.find(x => x.id === card.dataset.caseId);
                if (c) {
                    selectedCases.push(c);
                    render();
                }
            };
        });
        modal.querySelectorAll('[data-remove-idx]').forEach(el => {
            el.onclick = () => {
                const idx = parseInt(el.dataset.removeIdx, 10);
                selectedCases.splice(idx, 1);
                render();
            };
        });

        const createBtn = document.getElementById('bcCreate');
        if (createBtn && !createBtn.disabled) {
            createBtn.onclick = () => {
                if (selectedCases.length === 0) return;
                const cost = totalCost();
                if (!canAfford(cost)) {
                    showToast(`Brak środków! Potrzeba ${cost.toFixed(2)} zł`);
                    return;
                }
                subtractMoney(cost);

                const newBattle = {
                    id: generateBattleId(),
                    mode,
                    cases: [...selectedCases],
                    players: [{ name: 'Ty', bot: false, isMe: true, items: [] }],
                    maxPlayers,
                    status: 'waiting',
                    createdAt: Date.now()
                };
                BATTLES.unshift(newBattle);
                close();
                renderBattlesList();
                showToast(`⚔️ Bitwa utworzona! Czekaj na graczy lub dodaj boty.`);
                document.getElementById('battles').scrollIntoView({ behavior: 'smooth' });
            };
        }
    }

    function close() {
        modal.classList.remove('active');
    }

    render();
    setTimeout(() => modal.classList.add('active'), 10);
    modal.onclick = (e) => { if (e.target === modal) close(); };
}

// ==========================================================================
// Akcje na bitwie
// ==========================================================================
function joinBattle(battle) {
    if (battle.status !== 'waiting') return;
    if (battle.players.length >= battle.maxPlayers) return;
    if (battle.players.some(p => p.isMe)) {
        showToast('Już jesteś w tej bitwie');
        return;
    }

    const cost = getBattleCost(battle);
    if (!canAfford(cost)) {
        showToast(`Brak środków! Potrzeba ${cost.toFixed(2)} zł`);
        return;
    }
    subtractMoney(cost);

    battle.players.push({ name: 'Ty', bot: false, isMe: true, items: [] });
    showToast(`✅ Dołączyłeś do bitwy! (-${cost.toFixed(2)} zł)`);
    renderBattlesList();
}

function addBotToBattle(battle) {
    if (battle.status !== 'waiting') return;
    if (battle.players.length >= battle.maxPlayers) return;
    battle.players.push({ name: '🤖 ' + fakeUser(), bot: true, isMe: false, items: [] });
    renderBattlesList();
}

function startBattle(battle) {
    if (battle.status !== 'waiting') return;
    if (battle.players.length < 2) {
        showToast('Bitwa potrzebuje minimum 2 graczy');
        return;
    }
    // Wypełnij brakujące sloty botami
    while (battle.players.length < battle.maxPlayers) {
        battle.players.push({ name: '🤖 ' + fakeUser(), bot: true, isMe: false, items: [] });
    }
    battle.status = 'running';
    renderBattlesList();
    openBattleViewer(battle);
}

// ==========================================================================
// Viewer bitwy - rozgrywka i wyniki
// ==========================================================================
function openBattleViewer(battle) {
    let modal = document.getElementById('battleViewerModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'battleViewerModal';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }

    function close() {
        modal.classList.remove('active');
    }

    function render() {
        const totalCost = getBattleCost(battle);
        const modeText = battle.mode === 'underdog'
            ? '🎲 UNDERDOG — wygrywa NAJNIŻSZA suma'
            : '🏆 NORMAL — wygrywa NAJWYŻSZA suma';

        modal.innerHTML = `
            <div class="modal modal-battle-viewer">
                <button class="modal-close" id="bvClose">×</button>
                <div class="bv-header">
                    <h2 class="modal-title">⚔️ Bitwa</h2>
                    <p class="modal-subtitle">${modeText} · ${battle.cases.length} skrzynek · pula ${totalCost.toFixed(2)} zł</p>
                </div>

                <div class="bv-board" id="bvBoard">
                    ${battle.players.map((p, idx) => `
                        <div class="bv-player ${p.isMe ? 'me' : ''}" data-player="${idx}">
                            <div class="bv-player-name">
                                ${p.bot ? '🤖' : p.isMe ? '👤' : '🎮'} ${p.name}
                            </div>
                            <div class="bv-player-items" data-items-for="${idx}">
                                <!-- wypełniane dynamicznie -->
                            </div>
                            <div class="bv-player-total" data-total-for="${idx}">
                                <span>Suma:</span>
                                <strong data-total-value="${idx}">0.00 zł</strong>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="bv-status" id="bvStatus">${battle.status === 'finished' ? 'Bitwa zakończona' : 'Otwieranie skrzynek...'}</div>

                <div class="modal-actions" id="bvActions"></div>
            </div>
        `;

        document.getElementById('bvClose').onclick = close;

        // Jeśli bitwa już zakończona - pokaż wyniki od razu
        if (battle.status === 'finished') {
            // Wypełnij wszystkie items
            battle.players.forEach((p, idx) => {
                const itemsBox = modal.querySelector(`[data-items-for="${idx}"]`);
                if (itemsBox && p.items) {
                    itemsBox.innerHTML = p.items.map(it => `
                        <div class="bv-item rarity-${it.rarity}" title="${it.name} (${it.price.toFixed(2)} zł)">
                            <div class="bv-item-img">${renderItemImage(it)}</div>
                            <div class="bv-item-price">${it.price.toFixed(2)}</div>
                        </div>
                    `).join('');
                }
                const totalEl = modal.querySelector(`[data-total-value="${idx}"]`);
                if (totalEl) totalEl.textContent = (p.total || 0).toFixed(2) + ' zł';
            });
            renderFinishedActions();
        } else {
            // running → uruchom rozgrywkę
            runBattleSimulation(battle, render);
        }
    }

    function renderFinishedActions() {
        const actions = document.getElementById('bvActions');
        const status = document.getElementById('bvStatus');
        if (!actions) return;

        if (battle.winner) {
            const won = battle.winner.isMe;
            const winnerLabel = battle.mode === 'underdog' ? 'najmniejszą' : 'największą';

            if (status) {
                status.innerHTML = won
                    ? `🏆 <strong>WYGRAŁEŚ!</strong> Twoja suma była ${winnerLabel} (${battle.winner.total.toFixed(2)} zł)`
                    : `🏆 Wygrał <strong>${battle.winner.name}</strong> z sumą ${battle.winner.total.toFixed(2)} zł (${winnerLabel} suma)`;
            }
            actions.innerHTML = won
                ? `<button class="btn-primary" id="bvClaim">💰 Odbierz wszystkie skiny przeciwników</button>
                   <button class="btn-secondary" id="bvCloseBtn">Zamknij</button>`
                : `<button class="btn-secondary" id="bvCloseBtn">Zamknij</button>`;

            const claim = document.getElementById('bvClaim');
            if (claim) {
                claim.onclick = () => {
                    if (battle._claimed) {
                        showToast('Już odebrałeś nagrody');
                        return;
                    }
                    let totalGain = 0;
                    battle.players.forEach(p => {
                        if (!p.isMe) {
                            (p.items || []).forEach(it => totalGain += it.price);
                        }
                    });
                    addMoney(totalGain);
                    battle._claimed = true;
                    showToast(`💰 Odebrałeś ${totalGain.toFixed(2)} zł od przeciwników!`);
                    close();
                };
            }
            const closeBtn = document.getElementById('bvCloseBtn');
            if (closeBtn) closeBtn.onclick = close;
        }
    }

    render();
    setTimeout(() => modal.classList.add('active'), 10);
    modal.onclick = (e) => { if (e.target === modal) close(); };
}

// ==========================================================================
// Symulacja rozgrywki bitwy - otwieraj skrzynki kolejno z animacją
// ==========================================================================
function runBattleSimulation(battle, refreshView) {
    let caseIdx = 0;

    function processNextCase() {
        if (caseIdx >= battle.cases.length) {
            // Wszystkie skrzynki otwarte → wyłoń zwycięzcę
            finishBattle(battle);
            // Refresh view
            const status = document.getElementById('bvStatus');
            if (status) status.textContent = 'Bitwa zakończona!';
            const modal = document.getElementById('battleViewerModal');
            if (modal && modal.classList.contains('active')) {
                refreshView();
            }
            renderBattlesList();
            return;
        }

        const currentCase = battle.cases[caseIdx];
        const status = document.getElementById('bvStatus');
        if (status) {
            status.textContent = `Skrzynka ${caseIdx + 1} / ${battle.cases.length}: ${currentCase.name}`;
        }

        // Każdy gracz losuje przedmiot z tej skrzynki
        battle.players.forEach((player, pIdx) => {
            const pool = currentCase.pool && currentCase.pool.length > 0 ? currentCase.pool : ITEMS;
            const item = pickWeightedItem(pool, false);
            player.items = player.items || [];
            player.items.push(item);

            // Animacja - dodaj nowy item card z efektem pop
            const itemsBox = document.querySelector(`[data-items-for="${pIdx}"]`);
            if (itemsBox) {
                const card = document.createElement('div');
                card.className = `bv-item rarity-${item.rarity} bv-item-new`;
                card.title = `${item.name} (${item.price.toFixed(2)} zł)`;
                card.innerHTML = `
                    <div class="bv-item-img">${renderItemImage(item)}</div>
                    <div class="bv-item-price">${item.price.toFixed(2)}</div>
                `;
                itemsBox.appendChild(card);
                // Auto-scroll w prawo
                itemsBox.scrollLeft = itemsBox.scrollWidth;
            }

            // Aktualizacja totala
            const totalEl = document.querySelector(`[data-total-value="${pIdx}"]`);
            if (totalEl) {
                const total = (player.items || []).reduce((s, it) => s + it.price, 0);
                totalEl.textContent = total.toFixed(2) + ' zł';
            }
        });

        caseIdx++;
        setTimeout(processNextCase, 800);
    }

    // Uruchamiamy z lekkim opóźnieniem żeby UI się ustabilizował
    setTimeout(processNextCase, 500);
}

function finishBattle(battle) {
    // Policz totale
    battle.players.forEach(p => {
        p.total = (p.items || []).reduce((sum, it) => sum + it.price, 0);
    });

    // Wybierz zwycięzcę zgodnie z trybem
    let winner;
    if (battle.mode === 'underdog') {
        winner = battle.players.reduce((min, p) => p.total < min.total ? p : min, battle.players[0]);
    } else {
        winner = battle.players.reduce((max, p) => p.total > max.total ? p : max, battle.players[0]);
    }

    battle.winner = { name: winner.name, total: winner.total, isMe: winner.isMe };
    battle.status = 'finished';

    // Auto-claim dla niezalogowanych zwycięzców (boty/inni gracze) - nic nie dajemy
    // Dla "Ty" - claim przyciskiem ręcznie
}
