/**
 * PurpleCase - Logika frontendu
 *
 * Obrazki skinów pochodzą ze Steam CDN (community.cloudflare.steamstatic.com)
 * przez darmowe API ByMykel CSGO-API.
 */

// ==========================================================================
// Helper: render obrazka skina (img z fallbackiem na emoji)
// ==========================================================================
function renderItemImage(item, size = 'normal') {
    if (item.image) {
        // Obrazek ze Steam CDN. onerror -> pokaż emoji jeśli nie załaduje się.
        return `<img src="${item.image}" alt="${item.name}" loading="lazy"
                     onerror="this.outerHTML='<span class=\\'item-emoji-fallback\\'>${item.icon}</span>'">`;
    }
    return `<span class="item-emoji-fallback">${item.icon}</span>`;
}

// ==========================================================================
// Renderowanie skrzynek
// ==========================================================================
function renderCases() {
    const grid = document.getElementById('casesGrid');
    if (!grid) return;

    grid.innerHTML = CASES.map(c => {
        // Jeśli skrzynka ma obrazek z API → użyj go, w przeciwnym razie emoji
        const imageHtml = c.image
            ? `<img src="${c.image}" alt="${c.name}" loading="lazy"
                    onerror="this.outerHTML='<span class=\\'case-image-fallback\\' style=\\'font-size:80px\\'>${c.emoji}</span>'">`
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
                <div class="case-items-count">${c.pool ? c.pool.length : c.items} przedmiotów</div>
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

// ==========================================================================
// Renderowanie popularnych przedmiotów
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
// Modal - otwieranie skrzynki
// ==========================================================================
function openCaseModal(caseData) {
    let modal = document.getElementById('caseModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'caseModal';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="modal">
            <button class="modal-close" id="modalClose">×</button>
            <h2 class="modal-title">${caseData.name}</h2>
            <p class="modal-subtitle">Otwierasz skrzynkę za ${caseData.price.toFixed(2)} zł</p>

            <div id="rollerView">
                <div class="roller-container">
                    <div class="roller-pointer"></div>
                    <div class="roller-fade roller-fade-left"></div>
                    <div class="roller-fade roller-fade-right"></div>
                    <div class="roller-track" id="rollerTrack"></div>
                </div>

                <div class="modal-actions">
                    <button class="btn-secondary" id="cancelBtn">Anuluj</button>
                    <button class="btn-primary" id="spinBtn">
                        <span>🎁 Otwórz skrzynkę</span>
                    </button>
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
    document.getElementById('spinBtn').onclick = () => spinRoller(caseData);

    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };
}

function closeModal() {
    const modal = document.getElementById('caseModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Wypełnij rolkę przedmiotami z puli skrzynki
function fillRoller(caseData) {
    const track = document.getElementById('rollerTrack');
    if (!track) return;

    const pool = (caseData && caseData.pool && caseData.pool.length > 0) ? caseData.pool : ITEMS;
    const itemsCount = 60;
    let html = '';
    for (let i = 0; i < itemsCount; i++) {
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

// Animacja rolki
function spinRoller(caseData) {
    const track = document.getElementById('rollerTrack');
    const spinBtn = document.getElementById('spinBtn');
    if (!track || !spinBtn) return;

    spinBtn.disabled = true;
    spinBtn.style.opacity = '0.5';
    spinBtn.innerHTML = '<span>⏳ Otwieranie...</span>';

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

    setTimeout(() => {
        showResult(winningItem);
    }, 6200);
}

// Wybierz przedmiot z wagą (rzadsze są mniej prawdopodobne)
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

// Pokaż wynik
function showResult(item) {
    document.getElementById('rollerView').style.display = 'none';

    const resultView = document.getElementById('resultView');
    resultView.classList.add('show');

    const resultIcon = document.getElementById('resultIcon');
    resultIcon.innerHTML = renderItemImage(item);

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
        showToast(`Sprzedano za ${item.price.toFixed(2)} zł!`);
        closeModal();
    };
    document.getElementById('keepBtn').onclick = () => {
        showToast(`${item.name} dodany do ekwipunku!`);
        closeModal();
    };
}

// ==========================================================================
// Toast notifications
// ==========================================================================
function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: var(--gradient-main);
        color: white;
        padding: 16px 28px;
        border-radius: 12px;
        font-weight: 700;
        z-index: 2000;
        box-shadow: 0 10px 40px rgba(168, 85, 247, 0.5);
        transition: transform 0.3s ease;
        font-family: 'Rajdhani', sans-serif;
        font-size: 16px;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(100px)';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// ==========================================================================
// Loader
// ==========================================================================
function showLoader() {
    let loader = document.getElementById('loaderOverlay');
    if (loader) {
        loader.classList.remove('hidden');
        return;
    }
    // Tworzy loader gdyby go nie było w HTML
    loader = document.createElement('div');
    loader.id = 'loaderOverlay';
    loader.className = 'loader-overlay';
    loader.innerHTML = `
        <div class="loader-spinner"></div>
        <div class="loader-text">Ładowanie skinów...</div>
        <div class="loader-subtext">Pobieram dane ze Steam CDN</div>
    `;
    document.body.appendChild(loader);
}

function hideLoader() {
    const loader = document.getElementById('loaderOverlay');
    if (loader) {
        loader.classList.add('hidden');
        // Nie usuwamy z DOM, mogą być potrzebne reuse
        setTimeout(() => {
            if (loader.classList.contains('hidden')) loader.style.display = 'none';
        }, 500);
    }
}

// ==========================================================================
// Category tabs
// ==========================================================================
function initCategoryTabs() {
    const tabs = document.querySelectorAll('.cat-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });
}

// ==========================================================================
// Hero CTA
// ==========================================================================
function initHeroCTA() {
    const btn = document.querySelector('.hero-buttons .btn-primary');
    if (btn) {
        btn.addEventListener('click', () => {
            document.getElementById('cases').scrollIntoView({ behavior: 'smooth' });
        });
    }
}

// ==========================================================================
// Duplikuj listę dropów dla nieskończonej animacji
// ==========================================================================
function setupInfiniteDrops() {
    const track = document.querySelector('.drops-track');
    if (track) {
        track.innerHTML += track.innerHTML;
    }
}

// ==========================================================================
// Init - pobierz dane z API i wyrenderuj stronę
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
    showLoader();

    // Pobierz dane z ByMykel CSGO-API (Steam CDN images)
    await loadGameData();

    // Wyrenderuj stronę z prawdziwymi obrazkami
    renderCases();
    renderItems();
    initCategoryTabs();
    initHeroCTA();
    setupInfiniteDrops();

    hideLoader();
});
