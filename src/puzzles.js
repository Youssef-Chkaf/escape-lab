import gsap from 'gsap'

/**
 * SYSTÈME D'ÉNIGMES - ESCAPE LAB
 * 
 * Énigme 1: La Balance (poids)
 * Énigme 2: Le Tableau (masse molaire)
 * Énigme 3: Le Coffre-fort (code secret)
 */

// État des énigmes
let currentPuzzle = 1;
let difficulty = 'easy';

// Configuration des énigmes par difficulté
export const PUZZLES = {
    // ============================================
    // ÉNIGME 2: LE TABLEAU - MASSE MOLAIRE
    // ============================================
    tableau: {
        easy: {
            question: "Quelle est la masse molaire de H₂O ?",
            answer: "18",
            hint: "H = 1 g/mol, O = 16 g/mol",
            formula: "H₂O",
            explanation: "2×1 + 16 = 18 g/mol"
        },
        medium: {
            question: "Quelle est la masse molaire de CO₂ ?",
            answer: "44",
            hint: "C = 12 g/mol, O = 16 g/mol",
            formula: "CO₂",
            explanation: "12 + 2×16 = 44 g/mol"
        },
        hard: {
            question: "Quelle est la masse molaire de H₂SO₄ ?",
            answer: "98",
            hint: "H = 1, S = 32, O = 16",
            formula: "H₂SO₄",
            explanation: "2×1 + 32 + 4×16 = 98 g/mol"
        }
    },
    
    // ============================================
    // ÉNIGME 3: LE COFFRE-FORT - CODE SECRET
    // ============================================
    // Le code est basé sur des indices dans le labo
    coffre: {
        easy: {
            question: "Quel est le code du coffre ?",
            answer: "1234",
            digits: 4,
            // Indices très explicites
            hints: [
                "💡 Indice 1: Le premier chiffre est le nombre de bol sur la table",
                "💡 Indice 2: Dans l'indice",
                "💡 Indice 3: Tu as ouvert trois indice à la SUITE !"
            ],
            clueInScene: "Le code est: 1234"
        },
        medium: {
            question: "Entrez le code du coffre-fort",
            answer: "1806",
            digits: 4,
            // Indices liés aux énigmes précédentes
            hints: [
                "💡 Indice 1: Les deux premiers chiffres = masse molaire de H₂O",
                "💡 Indice 2: Les deux derniers = nombre d'atomes dans CO₂ × 2",
                "💡 Indice final: H₂O = 18, CO₂ a 3 atomes → 3×2 = 6 → Code: 1806"
            ],
            clueInScene: "Un calcul est griffonné: 'H₂O + (atomes×2) = ???'"
        },
        hard: {
            question: "Code d'accès requis",
            answer: "9832",
            digits: 4,
            // Indices cryptiques basés sur la chimie
            hints: [
                "💡 Indice 1: Premier chiffre = nombre de lettres dans 'Soufre' ÷ 2 + 6",
                "💡 Indice 2: Deuxième = H₂SO₄ a combien de types d'atomes différents ?",
                "💡 Indice 3: Les deux derniers = masse atomique du Soufre"
            ],
            clueInScene: "Une équation mystérieuse: (S÷2+6)(types)(S) où S=soufre=32"
        }
    }
};

/**
 * Initialise le système de puzzles
 */
export function initPuzzles(selectedDifficulty) {
    difficulty = selectedDifficulty;
    currentPuzzle = 1;
    console.log(`Puzzles initialisés en mode ${difficulty}`);
}

/**
 * Retourne la config du puzzle actuel
 */
export function getCurrentPuzzleConfig(puzzleType) {
    return PUZZLES[puzzleType]?.[difficulty];
}

/**
 * Crée l'interface pour l'énigme du tableau
 */
export function createTableauPuzzleUI(onSuccess) {
    const config = PUZZLES.tableau[difficulty];
    
    const overlay = document.createElement('div');
    overlay.id = 'tableau-puzzle';
    overlay.innerHTML = `
        <div class="puzzle-container">
            <button class="close-btn">✕</button>
            <h2>📋 Le Tableau</h2>
            <p class="puzzle-question">${config.question}</p>
            
            <div class="puzzle-input-group">
                <input type="text" id="tableau-answer" placeholder="Votre réponse..." maxlength="10">
                <button id="tableau-submit">Valider</button>
            </div>
            
            <p class="puzzle-hint" id="tableau-hint" style="display: none;">
                💡 ${config.hint}
            </p>
            
            <button class="hint-btn" id="show-hint">Besoin d'un indice ?</button>
            
            <p class="puzzle-error" id="tableau-error" style="display: none;">
                ❌ Mauvaise réponse, réessayez !
            </p>
        </div>
    `;
    
    addPuzzleStyles();
    document.body.appendChild(overlay);
    
    // Fermer
    overlay.querySelector('.close-btn').onclick = () => {
        gsap.to(overlay, { opacity: 0, duration: 0.3, onComplete: () => overlay.remove() });
    };
    
    // Indice
    overlay.querySelector('#show-hint').onclick = () => {
        document.getElementById('tableau-hint').style.display = 'block';
        overlay.querySelector('#show-hint').style.display = 'none';
    };
    
    // Validation
    const submit = () => {
        const answer = document.getElementById('tableau-answer').value.trim();
        const error = document.getElementById('tableau-error');
        
        if (answer === config.answer) {
            // Succès !
            gsap.to(overlay, { 
                opacity: 0, 
                duration: 0.5, 
                onComplete: () => {
                    overlay.remove();
                    showSuccessMessage('Tableau résolu !', onSuccess);
                }
            });
        } else {
            error.style.display = 'block';
            gsap.fromTo(error, { x: -10 }, { x: 10, duration: 0.1, repeat: 5, yoyo: true });
            setTimeout(() => error.style.display = 'none', 2000);
        }
    };
    
    overlay.querySelector('#tableau-submit').onclick = submit;
    document.getElementById('tableau-answer').onkeypress = (e) => {
        if (e.key === 'Enter') submit();
    };
    
    // Animation d'entrée
    gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.3 });
}

/**
 * Affiche un message de succès
 */
function showSuccessMessage(message, callback) {
    const success = document.createElement('div');
    success.className = 'success-overlay';
    success.innerHTML = `
        <div class="success-content">
            <div class="success-icon">✅</div>
            <h2>${message}</h2>
            <p>Passez à l'étape suivante...</p>
        </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        .success-overlay {
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(30, 45, 30, 0.95);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 20000;
            font-family: 'Courier Prime', monospace;
        }
        .success-content {
            text-align: center;
            color: #d4c4a8;
        }
        .success-icon {
            font-size: 80px;
            animation: pop 0.5s ease;
        }
        .success-content h2 {
            font-family: 'Special Elite', cursive;
            font-size: 2rem;
            margin: 20px 0;
            color: #81c784;
        }
        .success-content p {
            color: #8b9a7b;
        }
        @keyframes pop {
            0% { transform: scale(0); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(success);
    
    setTimeout(() => {
        gsap.to(success, {
            opacity: 0,
            duration: 0.5,
            onComplete: () => {
                success.remove();
                if (callback) callback();
            }
        });
    }, 1500);
}

/**
 * Crée l'interface pour l'énigme du coffre-fort (code à 4 chiffres)
 */
export function createCoffrePuzzleUI(onSuccess) {
    const config = PUZZLES.coffre[difficulty];
    let currentHintIndex = 0;
    
    const overlay = document.createElement('div');
    overlay.id = 'coffre-puzzle';
    overlay.innerHTML = `
        <div class="puzzle-container coffre-container">
            <button class="close-btn">✕</button>
            <h2>🔒 Le Coffre-Fort</h2>
            <p class="puzzle-question">${config.question}</p>
            
            <div class="difficulty-badge ${difficulty}">${difficulty === 'easy' ? '🟢 Facile' : difficulty === 'medium' ? '🟡 Moyen' : '🔴 Difficile'}</div>
            
            <div class="code-input-group">
                <input type="text" class="code-digit" maxlength="1" data-index="0">
                <input type="text" class="code-digit" maxlength="1" data-index="1">
                <input type="text" class="code-digit" maxlength="1" data-index="2">
                <input type="text" class="code-digit" maxlength="1" data-index="3">
            </div>
            
            <button id="coffre-submit" class="coffre-btn">Déverrouiller</button>
            
            <div class="hints-container" id="hints-container">
                <p class="hints-title">📜 Indices disponibles:</p>
                <div id="hints-list"></div>
            </div>
            
            <button class="hint-btn" id="show-next-hint">
                💡 Révéler un indice (${config.hints.length} disponibles)
            </button>
            
            <p class="puzzle-error" id="coffre-error" style="display: none;">
                ❌ Code incorrect ! Cherchez les indices dans le laboratoire...
            </p>
            
            <p class="scene-clue" id="scene-clue" style="display: none;">
                🔍 ${config.clueInScene}
            </p>
        </div>
    `;
    
    addPuzzleStyles();
    addCoffreStyles();
    document.body.appendChild(overlay);
    
    // Auto-focus et navigation entre les chiffres
    const digits = overlay.querySelectorAll('.code-digit');
    digits[0].focus();
    
    digits.forEach((digit, index) => {
        digit.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
            if (e.target.value && index < digits.length - 1) {
                digits[index + 1].focus();
            }
        });
        
        digit.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                digits[index - 1].focus();
            }
            if (e.key === 'Enter') {
                submitCode();
            }
        });
    });
    
    // Fermer
    overlay.querySelector('.close-btn').onclick = () => {
        gsap.to(overlay, { opacity: 0, duration: 0.3, onComplete: () => overlay.remove() });
    };
    
    // Système d'indices progressifs
    const hintsList = document.getElementById('hints-list');
    const hintBtn = overlay.querySelector('#show-next-hint');
    
    hintBtn.onclick = () => {
        if (currentHintIndex < config.hints.length) {
            const hintDiv = document.createElement('div');
            hintDiv.className = 'hint-item';
            hintDiv.innerHTML = config.hints[currentHintIndex];
            hintsList.appendChild(hintDiv);
            
            // Animation
            gsap.fromTo(hintDiv, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.3 });
            
            currentHintIndex++;
            
            // Mettre à jour le bouton
            const remaining = config.hints.length - currentHintIndex;
            if (remaining > 0) {
                hintBtn.textContent = `💡 Révéler un indice (${remaining} restant${remaining > 1 ? 's' : ''})`;
            } else {
                hintBtn.textContent = '✅ Tous les indices révélés';
                hintBtn.disabled = true;
                hintBtn.style.opacity = '0.5';
                
                // Afficher l'indice final de la scène
                document.getElementById('scene-clue').style.display = 'block';
                gsap.fromTo('#scene-clue', { opacity: 0 }, { opacity: 1, duration: 0.5 });
            }
        }
    };
    
    // Validation
    const submitCode = () => {
        const code = Array.from(digits).map(d => d.value).join('');
        const error = document.getElementById('coffre-error');
        
        if (code === config.answer) {
            // Succès !
            gsap.to(overlay, { 
                opacity: 0, 
                duration: 0.5, 
                onComplete: () => {
                    overlay.remove();
                    showSuccessMessage('Coffre déverrouillé !', onSuccess);
                }
            });
        } else {
            error.style.display = 'block';
            gsap.fromTo(error, { x: -10 }, { x: 10, duration: 0.1, repeat: 5, yoyo: true });
            // Shake les inputs aussi
            digits.forEach(d => {
                gsap.fromTo(d, { x: -5 }, { x: 5, duration: 0.1, repeat: 3, yoyo: true });
                d.value = '';
            });
            digits[0].focus();
            setTimeout(() => error.style.display = 'none', 2000);
        }
    };
    
    overlay.querySelector('#coffre-submit').onclick = submitCode;
    
    // Animation d'entrée
    gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.3 });
}

/**
 * Styles spécifiques au coffre
 */
function addCoffreStyles() {
    if (document.getElementById('coffre-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'coffre-styles';
    style.textContent = `
        #coffre-puzzle {
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(15, 12, 10, 0.95);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 15000;
            font-family: 'Courier Prime', monospace;
        }
        
        .coffre-container {
            background: linear-gradient(180deg, rgba(60, 55, 45, 0.98) 0%, rgba(40, 35, 30, 0.98) 100%) !important;
            border: 3px solid #8b7355 !important;
        }
        
        .coffre-btn {
            padding: 12px 30px;
            font-size: 1rem;
            background: linear-gradient(180deg, #6a5a4a 0%, #4a3f30 100%);
            color: #d4c4a8;
            border: 2px solid #c9a227;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            font-family: 'Courier Prime', monospace;
            transition: all 0.2s;
            margin-bottom: 20px;
        }
        
        .coffre-btn:hover {
            background: linear-gradient(180deg, #7a6a5a 0%, #5a4f40 100%);
            transform: translateY(-2px);
        }
        
        .difficulty-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 15px;
            font-size: 0.85rem;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .difficulty-badge.easy {
            background: rgba(129, 199, 132, 0.2);
            color: #81c784;
            border: 1px solid #81c784;
        }
        .difficulty-badge.medium {
            background: rgba(255, 183, 77, 0.2);
            color: #ffb74d;
            border: 1px solid #ffb74d;
        }
        .difficulty-badge.hard {
            background: rgba(229, 115, 115, 0.2);
            color: #e57373;
            border: 1px solid #e57373;
        }
        
        .hints-container {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
            text-align: left;
            max-height: 150px;
            overflow-y: auto;
        }
        
        .hints-title {
            color: #c9a227;
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 0.9rem;
        }
        
        .hint-item {
            background: rgba(201, 162, 39, 0.1);
            border-left: 3px solid #c9a227;
            padding: 8px 12px;
            margin: 8px 0;
            font-size: 0.9rem;
            color: #d4c4a8;
            border-radius: 0 5px 5px 0;
        }
        
        .scene-clue {
            background: rgba(129, 199, 132, 0.15);
            border: 1px solid #81c784;
            padding: 12px;
            border-radius: 5px;
            color: #81c784;
            font-size: 0.95rem;
            margin-top: 15px;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Ajoute les styles CSS pour les puzzles
 */
function addPuzzleStyles() {
    if (document.getElementById('puzzle-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'puzzle-styles';
    style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Special+Elite&family=Courier+Prime:wght@400;700&display=swap');
        
        #tableau-puzzle {
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(15, 12, 10, 0.95);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 15000;
            font-family: 'Courier Prime', monospace;
        }
        
        .puzzle-container {
            background: linear-gradient(180deg, rgba(50, 45, 35, 0.98) 0%, rgba(35, 30, 25, 0.98) 100%);
            padding: 40px 50px;
            border-radius: 10px;
            text-align: center;
            color: #d4c4a8;
            position: relative;
            min-width: 400px;
            border: 2px solid #5a4a3a;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
        }
        
        .puzzle-container h2 {
            font-family: 'Special Elite', cursive;
            font-size: 1.8rem;
            margin-bottom: 20px;
            color: #c9a227;
        }
        
        .puzzle-question {
            font-size: 1.1rem;
            margin-bottom: 30px;
            color: #b8a88a;
            line-height: 1.5;
        }
        
        .close-btn {
            position: absolute;
            top: 15px; right: 15px;
            background: none;
            border: none;
            color: #8b7355;
            font-size: 1.5rem;
            cursor: pointer;
            transition: color 0.2s;
        }
        .close-btn:hover { color: #d4c4a8; }
        
        .puzzle-input-group {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-bottom: 20px;
        }
        
        .puzzle-input-group input {
            padding: 12px 20px;
            font-size: 1.2rem;
            border: 2px solid #5a4a3a;
            border-radius: 5px;
            background: rgba(30, 25, 20, 0.8);
            color: #d4c4a8;
            width: 150px;
            text-align: center;
            font-family: 'Courier Prime', monospace;
        }
        
        .puzzle-input-group input:focus {
            border-color: #c9a227;
            outline: none;
        }
        
        .puzzle-input-group button {
            padding: 12px 25px;
            font-size: 1rem;
            background: linear-gradient(180deg, #5a4a3a 0%, #3a3025 100%);
            color: #d4c4a8;
            border: 2px solid #c9a227;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            font-family: 'Courier Prime', monospace;
            transition: all 0.2s;
        }
        
        .puzzle-input-group button:hover {
            background: linear-gradient(180deg, #6a5a4a 0%, #4a3f30 100%);
            transform: translateY(-2px);
        }
        
        .code-input-group {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin-bottom: 25px;
        }
        
        .code-digit {
            width: 60px;
            height: 70px;
            font-size: 2rem;
            text-align: center;
            border: 2px solid #5a4a3a;
            border-radius: 5px;
            background: rgba(30, 25, 20, 0.8);
            color: #c9a227;
            font-weight: bold;
            font-family: 'Special Elite', cursive;
        }
        
        .code-digit:focus {
            border-color: #c9a227;
            outline: none;
            box-shadow: 0 0 10px rgba(201, 162, 39, 0.3);
        }
        
        .puzzle-hint {
            background: rgba(201, 162, 39, 0.1);
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            color: #c9a227;
            border: 1px solid rgba(201, 162, 39, 0.3);
        }
        
        .hint-btn {
            background: none;
            border: 1px solid #5a4a3a;
            color: #8b7355;
            padding: 8px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.9rem;
            font-family: 'Courier Prime', monospace;
            transition: all 0.2s;
        }
        
        .hint-btn:hover {
            border-color: #c9a227;
            color: #c9a227;
        }
        
        .puzzle-error {
            color: #e57373;
            font-weight: bold;
            margin-top: 15px;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Affiche le récapitulatif final - VICTOIRE !
 */
export function showVictoryScreen() {
    const overlay = document.createElement('div');
    overlay.innerHTML = `
        <div class="victory-container">
            <h1>🎉 VOUS ÊTES LIBRE ! 🎉</h1>
            <p>Vous avez résolu toutes les énigmes et vous êtes échappé du laboratoire abandonné !</p>
            
            <div class="victory-stats">
                <div class="stat">
                    <span class="stat-icon">⚖️</span>
                    <span>Balance équilibrée</span>
                </div>
                <div class="stat">
                    <span class="stat-icon">🧪</span>
                    <span>Masse molaire trouvée</span>
                </div>
                <div class="stat">
                    <span class="stat-icon">🔒</span>
                    <span>Coffre déverrouillé</span>
                </div>
                <div class="stat">
                    <span class="stat-icon">🔑</span>
                    <span>Clé récupérée</span>
                </div>
                <div class="stat">
                    <span class="stat-icon">🚪</span>
                    <span>Porte ouverte</span>
                </div>
            </div>
            
            <button onclick="location.reload()">Rejouer</button>
        </div>
    `;
    
    overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: linear-gradient(180deg, rgba(40, 50, 35, 0.98) 0%, rgba(30, 40, 25, 0.98) 100%);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 30000;
        font-family: 'Courier Prime', monospace;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        .victory-container {
            text-align: center;
            color: #d4c4a8;
        }
        .victory-container h1 {
            font-family: 'Special Elite', cursive;
            font-size: 3rem;
            margin-bottom: 20px;
            color: #81c784;
        }
        .victory-container p {
            font-size: 1.2rem;
            margin-bottom: 40px;
            color: #a8c49a;
        }
        .victory-stats {
            display: flex;
            gap: 25px;
            justify-content: center;
            margin-bottom: 40px;
        }
        .stat {
            background: rgba(90, 74, 58, 0.5);
            padding: 20px 25px;
            border-radius: 8px;
            border: 1px solid #5a4a3a;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .stat-icon { font-size: 2rem; }
        .victory-container button {
            background: linear-gradient(180deg, #5a6a4a 0%, #4a5a3a 100%);
            color: #d4c4a8;
            border: 2px solid #81c784;
            padding: 15px 50px;
            font-size: 1.1rem;
            font-weight: bold;
            border-radius: 5px;
            cursor: pointer;
            font-family: 'Courier Prime', monospace;
            transition: all 0.2s;
        }
        .victory-container button:hover {
            background: linear-gradient(180deg, #6a7a5a 0%, #5a6a4a 100%);
            transform: translateY(-2px);
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(overlay);
    
    gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 1 });
}
