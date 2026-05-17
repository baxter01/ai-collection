/**
 * PurpleCase - Logika frontendu
 */

// ==========================================================================
// Renderowanie skrzynek
// ==========================================================================
function renderCases() {
    const grid = document.getElementById('casesGrid');
    if (!grid) return;

    grid.innerHTML = CASES.map(c => `
        <div class="case-card" data-case-id="${c.id}">
            <div class="case-card-glow"></div>
            ${c.badge ? `<div class="case-badge">${c.badge}</div>` : ''}
            <div class="case-image-wrapper">
                <div class="case-image" style="background: ${c.gradient}">
                    <span style="position: relative; z-index: 2;">${c.emoji}</span>
                </div>
            </div>
            <h3 class="case-name">${c.name}</h3>
            <div class="case-items-count">${c.items} przedmiotów</div>
            <div class="case-price">
                <span class="case-price-amount">${c.price.toFixed(2)} zł</span>
            </div>
        </div>
    `).join('');

    // Dodaj event listeners
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
            <div class="item-image">${item.icon}</div>
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
    // Stwórz modal jeśli nie istnieje
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

    // Pokaż modal
    setTimeout(() => modal.classList.add('active'), 10);

    // Wypełnij rolkę
    fillRoller();

    // Event listeners
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

// Wypełnij rolkę losowymi przedmiotami
function fillRoller() {
    const track = document.getElementById('rollerTrack');
    if (!track) return;

    const itemsCount = 60; // Dużo przedmiotów dla efektu
    let html = '';
    for (let i = 0; i < itemsCount; i++) {
        const item = ITEMS[Math.floor(Math.random() * ITEMS.length)];
        html += `
            <div class="roller-item rarity-${item.rarity}" data-index="${i}">
                <div class="roller-item-icon">${item.icon}</div>
                <div class="roller-item-name">${item.name}</div>
            </div>
        `;
    }
    track.innerHTML = html;
    track.style.transform = 'translateX(0)';
    track.style.transition = 'none';
}

// Uruchom animację rolki
function spinRoller(caseData) {
    const track = document.getElementById('rollerTrack');
    const spinBtn = document.getElementById('spinBtn');
    if (!track || !spinBtn) return;

    spinBtn.disabled = true;
    spinBtn.style.opacity = '0.5';
    spinBtn.innerHTML = '<span>⏳ Otwieranie...</span>';

    // Wybierz losowy przedmiot wygranej (z odważoną szansą)
    const winningItem = pickWeightedItem();

    // Ustaw zwycięski przedmiot na pozycji ~50
    const winningIndex = 50;
    const itemWidth = 188; // 180 + 8 gap
    const containerWidth = track.parentElement.offsetWidth;

    // Zaktualizuj zwycięski item w trackingu
    const items = track.querySelectorAll('.roller-item');
    if (items[winningIndex]) {
        items[winningIndex].className = `roller-item rarity-${winningItem.rarity}`;
        items[winningIndex].innerHTML = `
            <div class="roller-item-icon">${winningItem.icon}</div>
            <div class="roller-item-name">${winningItem.name}</div>
        `;
    }

    // Oblicz pozycję końcową (z lekkim losowym offsetem dla naturalności)
    const randomOffset = (Math.random() - 0.5) * 100; // ±50px
    const targetX = -(winningIndex * itemWidth) + (containerWidth / 2) - (180 / 2) + randomOffset;

    // Animacja
    requestAnimationFrame(() => {
        track.style.transition = 'transform 6s cubic-bezier(0.05, 0.7, 0.1, 1)';
        track.style.transform = `translateX(${targetX}px)`;
    });

    // Pokaż wynik po animacji
    setTimeout(() => {
        showResult(winningItem);
    }, 6200);
}

// Wybierz przedmiot z wagą (rzadsze są mniej prawdopodobne)
function pickWeightedItem() {
    const weights = {
        'restricted': 50,
        'classified': 30,
        'covert': 15,
        'knife': 5
    };

    const weighted = [];
    ITEMS.forEach(item => {
        const w = weights[item.rarity] || 1;
        for (let i = 0; i < w; i++) weighted.push(item);
    });

    return weighted[Math.floor(Math.random() * weighted.length)];
}

// Pokaż wynik
function showResult(item) {
    document.getElementById('rollerView').style.display = 'none';

    const resultView = document.getElementById('resultView');
    resultView.classList.add('show');

    document.getElementById('resultIcon').textContent = item.icon;
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
// Init
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    renderCases();
    renderItems();
    initCategoryTabs();
    initHeroCTA();
    setupInfiniteDrops();
});
