import gsap from 'gsap'

// === CONFIGURATION DES DIFFICULTES ===
export const DIFFICULTIES = {
    easy: {
        name: 'Facile',
        targetWeight: 12,
        description: 'Poids identiques par type de fiole',
        weights: { 'fiolle': 10, 'fiolle_triangle': 7, 'fiolle_longue': 5, 'petite_fiolle': 2, 'livre': 8 },
        showWeights: true,
        hint: 'Astuce: petite_fiolle (2g) + fiolle (10g) = 12g'
    },
    medium: {
        name: 'Normal',
        targetWeight: 15,
        description: 'Poids legerement variables',
        weights: { 'fiolle': [8, 10, 12], 'fiolle_triangle': [5, 7, 9], 'fiolle_longue': [3, 5, 7], 'petite_fiolle': [1, 2, 3], 'livre': [6, 8, 10] },
        showWeights: true,
        hint: 'Les poids varient legerement'
    },
    hard: {
        name: 'Difficile',
        targetWeight: 20,
        description: 'Poids completement aleatoires',
        weights: { 'fiolle': [5, 8, 11, 14], 'fiolle_triangle': [3, 6, 9, 12], 'fiolle_longue': [2, 5, 8, 11], 'petite_fiolle': [1, 3, 5, 7], 'livre': [4, 7, 10, 13] },
        showWeights: false,
        hint: 'Aucun indice en mode difficile'
    }
};

let currentDifficulty = null;
let onStartCallback = null;

// === ECRAN DE DEMARRAGE ===
export function createStartScreen(onStart) {
    onStartCallback = onStart;
    
    const overlay = document.createElement('div');
    overlay.id = 'start-screen';
    overlay.innerHTML = `
        + '<div class="scanlines"></div>'
        + '<div class="noise"></div>'
        + '<div class="vignette"></div>'
        + '<div class="start-container">'
        + '    <div class="logo-container">'
        + '        <div class="biohazard-icon"></div>'
        + '        <h1>ESCAPE LAB</h1>'
        + '        <p class="lab-subtitle">Laboratoire de recherche abandonne - Secteur 7</p>'
        + '    </div>'
        + '    <div class="warning-tape">'
        + '        <span>ZONE INTERDITE - ZONE INTERDITE - ZONE INTERDITE</span>'
        + '    </div>'
        + '    <div class="difficulty-section">'
        + '        <h2>Choisissez votre niveau de difficulte</h2>'
        + '        <div class="difficulty-cards">'
        + '            <div class="difficulty-card" data-difficulty="easy">'
        + '                <div class="card-label">FACILE</div>'
        + '                <div class="card-icon"></div>'
        + '                <h3>Apprenti</h3>'
        + '                <p class="card-desc">Poids affiches sur les objets</p>'
        + '                <p class="target">Objectif: 12g</p>'
        + '            </div>'
        + '            <div class="difficulty-card" data-difficulty="medium">'
        + '                <div class="card-label">NORMAL</div>'
        + '                <div class="card-icon"></div>'
        + '                <h3>Chercheur</h3>'
        + '                <p class="card-desc">Poids variables</p>'
        + '                <p class="target">Objectif: 15g</p>'
        + '            </div>'
        + '            <div class="difficulty-card" data-difficulty="hard">'
        + '                <div class="card-label">DIFFICILE</div>'
        + '                <div class="card-icon"></div>'
        + '                <h3>Expert</h3>'
        + '                <p class="card-desc">Poids caches</p>'
        + '                <p class="target">Objectif: 20g</p>'
        + '            </div>'
        + '        </div>'
        + '    </div>'
        + '    <button id="start-btn" disabled>Selectionnez un niveau</button>'
        + '    <div class="footer-note">Derniere inspection: 12/03/1987 - Personnel evacue</div>'
        + '</div>';
    
    addStartStyles();
    document.body.appendChild(overlay);
    
    const cards = overlay.querySelectorAll('.difficulty-card');
    const startBtn = overlay.querySelector('#start-btn');
    
    cards.forEach(card => {
        card.addEventListener('click', () => {
            cards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            currentDifficulty = card.dataset.difficulty;
            startBtn.disabled = false;
            const levelNames = { easy: 'Facile', medium: 'Normal', hard: 'Difficile' };
            startBtn.textContent = 'Commencer - Mode ' + levelNames[currentDifficulty];
        });
    });
    
    startBtn.addEventListener('click', () => {
        if (currentDifficulty && onStartCallback) {
            gsap.to(overlay, {
                opacity: 0,
                duration: 0.5,
                onComplete: () => {
                    overlay.remove();
                    onStartCallback(currentDifficulty);
                }
            });
        }
    });
}

function addStartStyles() {
    if (document.getElementById('start-styles')) return;
    const style = document.createElement('style');
    style.id = 'start-styles';
    style.textContent = `
        + '@import url("https://fonts.googleapis.com/css2?family=Special+Elite&family=Courier+Prime:wght@400;700&display=swap");'
        + '#start-screen { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(ellipse at center, rgba(30, 25, 20, 0.95) 0%, rgba(15, 12, 10, 1) 100%); display: flex; justify-content: center; align-items: center; z-index: 10000; font-family: "Courier Prime", monospace; overflow: hidden; }'
        + '.scanlines { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.05) 0px, rgba(0, 0, 0, 0.05) 1px, transparent 1px, transparent 4px); pointer-events: none; z-index: 10; }'
        + '.noise { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; opacity: 0.6; z-index: 11; }'
        + '.vignette { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%); pointer-events: none; z-index: 12; }'
        + '.start-container { text-align: center; color: #b8a88a; max-width: 900px; padding: 40px; position: relative; z-index: 100; }'
        + '.logo-container { position: relative; margin-bottom: 30px; }'
        + '.biohazard-icon { font-size: 4rem; color: #c9a227; margin-bottom: 15px; }'
        + '.start-container h1 { font-family: "Special Elite", cursive; font-size: 3.5rem; margin-bottom: 10px; color: #d4c4a8; letter-spacing: 8px; text-transform: uppercase; }'
        + '.lab-subtitle { font-size: 1rem; color: #8b7355; letter-spacing: 3px; margin-top: 10px; font-style: italic; }'
        + '.warning-tape { background: repeating-linear-gradient(45deg, #c9a227, #c9a227 10px, #1a1a1a 10px, #1a1a1a 20px); padding: 8px 0; margin: 25px -40px; overflow: hidden; }'
        + '.warning-tape span { display: block; background: #1a1a1a; color: #c9a227; padding: 5px 20px; font-size: 0.75rem; letter-spacing: 4px; font-weight: bold; }'
        + '.difficulty-section h2 { font-size: 1.1rem; margin: 35px 0 25px; color: #8b7355; letter-spacing: 2px; font-weight: normal; }'
        + '.difficulty-cards { display: flex; gap: 20px; justify-content: center; margin-bottom: 40px; }'
        + '.difficulty-card { background: linear-gradient(180deg, rgba(50, 45, 35, 0.95) 0%, rgba(35, 30, 25, 0.98) 100%); border: 2px solid #5a4a3a; border-radius: 5px; padding: 25px; cursor: pointer; transition: all 0.3s ease; min-width: 180px; }'
        + '.difficulty-card:hover { border-color: #8b7355; transform: translateY(-5px); }'
        + '.difficulty-card.selected { border-color: #c9a227; }'
        + '.card-label { font-size: 0.65rem; letter-spacing: 3px; margin-bottom: 12px; padding: 3px 10px; border-radius: 2px; display: inline-block; }'
        + '.difficulty-card[data-difficulty="easy"] .card-label { background: rgba(76, 175, 80, 0.2); color: #81c784; border: 1px solid rgba(76, 175, 80, 0.3); }'
        + '.difficulty-card[data-difficulty="medium"] .card-label { background: rgba(255, 152, 0, 0.2); color: #ffb74d; border: 1px solid rgba(255, 152, 0, 0.3); }'
        + '.difficulty-card[data-difficulty="hard"] .card-label { background: rgba(244, 67, 54, 0.2); color: #e57373; border: 1px solid rgba(244, 67, 54, 0.3); }'
        + '.card-icon { font-size: 2.5rem; margin-bottom: 12px; }'
        + '.difficulty-card h3 { font-family: "Special Elite", cursive; font-size: 1.2rem; margin-bottom: 8px; color: #d4c4a8; letter-spacing: 2px; }'
        + '.card-desc { font-size: 0.8rem; color: #8b7355; margin: 8px 0; }'
        + '.difficulty-card .target { color: #c9a227; font-weight: bold; margin-top: 12px; font-size: 0.9rem; }'
        + '#start-btn { background: linear-gradient(180deg, #5a4a3a 0%, #3a3025 100%); color: #6b5b4b; border: 2px solid #5a4a3a; padding: 15px 45px; font-size: 1rem; font-family: "Special Elite", cursive; border-radius: 5px; cursor: pointer; transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 2px; }'
        + '#start-btn:disabled { opacity: 0.5; cursor: not-allowed; }'
        + '#start-btn:not(:disabled) { color: #d4c4a8; border-color: #c9a227; }'
        + '#start-btn:not(:disabled):hover { transform: translateY(-2px); }'
        + '.footer-note { margin-top: 40px; font-size: 0.75rem; color: #5a4a3a; letter-spacing: 1px; font-style: italic; }';
    document.head.appendChild(style);
}

// === INVENTAIRE UI ===
export function createInventoryUI() {
    const inventory = document.createElement('div');
    inventory.id = 'inventory-ui';
    inventory.innerHTML = '<div class="inventory-header"><span class="inventory-title">Objets sur la balance</span><span class="inventory-weight">0g / <span id="target-weight">12</span>g</span></div><div class="inventory-slots" id="inventory-slots"></div>';
    
    addInventoryStyles();
    document.body.appendChild(inventory);
    return inventory;
}

function addInventoryStyles() {
    if (document.getElementById('inventory-styles')) return;
    const style = document.createElement('style');
    style.id = 'inventory-styles';
    style.textContent = '#inventory-ui { position: fixed; top: 20px; right: 20px; background: linear-gradient(180deg, rgba(50, 45, 35, 0.95) 0%, rgba(35, 30, 25, 0.98) 100%); border: 2px solid #5a4a3a; border-radius: 8px; padding: 15px 18px; z-index: 1000; min-width: 280px; max-width: 320px; font-family: "Courier Prime", monospace; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5); }'
        + '.inventory-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid #5a4a3a; }'
        + '.inventory-title { color: #d4c4a8; font-weight: bold; font-size: 0.9rem; }'
        + '.inventory-weight { color: #c9a227; font-weight: bold; font-size: 1rem; }'
        + '.inventory-weight.victory { color: #81c784; animation: pulse 0.5s ease-in-out infinite alternate; }'
        + '@keyframes pulse { from { transform: scale(1); } to { transform: scale(1.1); } }'
        + '.inventory-slots { display: flex; flex-direction: column; gap: 6px; max-height: 300px; overflow-y: auto; }'
        + '.inventory-slot { background: rgba(90, 74, 58, 0.5); border: 1px solid #5a4a3a; border-radius: 5px; padding: 8px 12px; color: #d4c4a8; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 8px; font-size: 0.85rem; }'
        + '.inventory-slot:hover { background: rgba(139, 69, 69, 0.4); border-color: #a05050; }'
        + '.inventory-slot .slot-name { flex: 1; }'
        + '.inventory-slot .slot-weight { color: #c9a227; font-weight: bold; }'
        + '.inventory-slot .slot-remove { color: #a05050; margin-left: 5px; font-weight: bold; }'
        + '.inventory-empty { color: #8b7355; font-style: italic; padding: 10px; text-align: center; font-size: 0.85rem; }';
    document.head.appendChild(style);
}

// === MISE A JOUR INVENTAIRE ===
export function updateInventoryUI(objectsOnBalance, totalWeight, targetWeight, onRemoveCallback) {
    const slots = document.getElementById('inventory-slots');
    const weightDisplay = document.querySelector('.inventory-weight');
    const targetDisplay = document.getElementById('target-weight');
    
    if (!slots) return;
    if (targetDisplay) targetDisplay.textContent = targetWeight;
    
    if (weightDisplay) {
        weightDisplay.innerHTML = totalWeight + 'g / <span id="target-weight">' + targetWeight + '</span>g';
        if (totalWeight === targetWeight) weightDisplay.classList.add('victory');
        else weightDisplay.classList.remove('victory');
    }
    
    slots.innerHTML = '';
    
    if (objectsOnBalance.length === 0) {
        slots.innerHTML = '<div class="inventory-empty">Cliquez sur un objet pour le placer sur la balance</div>';
        return;
    }
    
    objectsOnBalance.forEach(obj => {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        const weight = obj.userData.weight || 0;
        const displayName = obj.name.replace(/_/g, ' ').replace(/\d+$/, '').trim();
        slot.innerHTML = '<span class="slot-name">' + displayName + '</span><span class="slot-weight">' + weight + 'g</span><span class="slot-remove">X</span>';
        slot.addEventListener('click', () => { if (onRemoveCallback) onRemoveCallback(obj); });
        slots.appendChild(slot);
    });
}

export function getCurrentDifficulty() { return currentDifficulty; }
export function getDifficultyConfig() { return DIFFICULTIES[currentDifficulty] || DIFFICULTIES.easy; }