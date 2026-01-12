import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import gsap from 'gsap'

// Modules separes
import { createTableBody, createBalanceBody, createDynamicBody, createWallBody, updatePhysics } from './physics.js'
import { initInteraction, setRoomBounds } from './interaction.js'
import { interactables, isInteractable, createDropZone, checkVictory, BALANCE_POSITION, setTargetWeight, getWeightOnBalance } from './game.js'
import { createStartScreen, createInventoryUI, updateInventoryUI, getDifficultyConfig, DIFFICULTIES } from './ui.js'
import { initPuzzles, createTableauPuzzleUI, createCoffrePuzzleUI, showVictoryScreen } from './puzzles.js'

// Import du modèle 3D
import laboModel from '/assets/labo.glb?url'

// État du jeu
let currentPuzzle = 1; // 1 = balance, 2 = tableau, 3 = coffre, 4 = clé, 5 = cadenas
let selectedDifficulty = 'easy';
let hasKey = false; // Le joueur a-t-il la clé ?

// Liste des noms d'objets qui doivent avoir une collision (murs, obstacles)
const WALL_NAMES = [
    'posimaker', 'box001', 'box002', 'plane001', 'plane008',
    'pared 005', 'pared 006', 'pared 004', 'paredcita',
    'object_2', 'mesa 001', 'deco_tronco 007', 'base 1'
];

// Objets 3D importants pour les énigmes
let tableauMesh = null;      // Pour énigme 2
let coffreMesh = null;       // Porte_coffre_fort
let keyMesh = null;          // Object_2.001 (la clé dans le coffre)
let cadenasMesh = null;      // ouverture_cadenas

function isWallOrObstacle(name) {
    const lowerName = name.toLowerCase();
    return WALL_NAMES.some(wallName => lowerName.includes(wallName) || lowerName === wallName);
}

// --- INITIALISATION DE LA SCENE ---
const canvas = document.querySelector('canvas.webgl');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#1a1a1a');

const sizes = { width: window.innerWidth, height: window.innerHeight };
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 200);

// Position de spawn de la caméra - face à la balance
const SPAWN_POSITION = { x: 24.1, y: 14.4, z: 5.2 };
camera.position.set(SPAWN_POSITION.x, SPAWN_POSITION.y, SPAWN_POSITION.z);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

// Lumieres
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 20, 10);
dirLight.castShadow = true;
scene.add(dirLight);

// OrbitControls avec limites pour ne pas traverser les murs
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Limites de la caméra - ajustées pour la pièce
// Ces valeurs seront mises à jour automatiquement selon les murs PARED
const ROOM_BOUNDS = {
    minX: -25,
    maxX: 30,   // Spawn à x=24
    minY: 8,    // Ne pas descendre sous le sol
    maxY: 20,   // Spawn à y=14.4
    minZ: -15,
    maxZ: 30
};

// Limiter le zoom
controls.minDistance = 2;
controls.maxDistance = 25;

// Limiter l'angle vertical (pas regarder à travers le sol/plafond)
controls.maxPolarAngle = Math.PI * 0.85; // Pas tout en bas
controls.minPolarAngle = Math.PI * 0.1;  // Pas tout en haut

// Point de focus (vers la pièce)
controls.target.set(-0.7, 11.7, 4.7);

// Variables globales pour l'UI
let inventoryUI = null;
let dropZoneMesh = null;

// === DÉPLACEMENT AVEC LES FLÈCHES ===
const moveSpeed = 0.15;
const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };

window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
        e.preventDefault(); // Empêcher le scroll de la page
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
    }
});

/**
 * Met à jour la position de la caméra selon les touches pressées
 */
function updateMovement() {
    // Direction de la caméra (sans la composante Y pour rester au même niveau)
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();
    
    // Direction latérale
    const right = new THREE.Vector3();
    right.crossVectors(direction, new THREE.Vector3(0, 1, 0));
    
    // Appliquer le mouvement avec les flèches
    if (keys.ArrowUp) {
        camera.position.addScaledVector(direction, moveSpeed);
        controls.target.addScaledVector(direction, moveSpeed);
    }
    if (keys.ArrowDown) {
        camera.position.addScaledVector(direction, -moveSpeed);
        controls.target.addScaledVector(direction, -moveSpeed);
    }
    if (keys.ArrowLeft) {
        camera.position.addScaledVector(right, -moveSpeed);
        controls.target.addScaledVector(right, -moveSpeed);
    }
    if (keys.ArrowRight) {
        camera.position.addScaledVector(right, moveSpeed);
        controls.target.addScaledVector(right, moveSpeed);
    }
}

/**
 * Met à jour les limites de la pièce à partir des murs PARED détectés
 */
function updateRoomBoundsFromWalls(walls) {
    if (walls.length === 0) {
        console.log('Aucun mur PARED trouvé, limites par défaut utilisées');
        return;
    }
    
    console.log('Murs PARED trouvés:', walls.map(w => w.name).join(', '));
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    
    walls.forEach(wall => {
        const box = new THREE.Box3().setFromObject(wall);
        console.log(`  ${wall.name}: X[${box.min.x.toFixed(1)} → ${box.max.x.toFixed(1)}] Y[${box.min.y.toFixed(1)} → ${box.max.y.toFixed(1)}] Z[${box.min.z.toFixed(1)} → ${box.max.z.toFixed(1)}]`);
        minX = Math.min(minX, box.min.x);
        maxX = Math.max(maxX, box.max.x);
        minY = Math.min(minY, box.min.y);
        maxY = Math.max(maxY, box.max.y);
        minZ = Math.min(minZ, box.min.z);
        maxZ = Math.max(maxZ, box.max.z);
    });
    
    // Appliquer une marge pour ne pas coller aux murs
    const margin = 2;
    ROOM_BOUNDS.minX = minX + margin;
    ROOM_BOUNDS.maxX = maxX - margin;
    ROOM_BOUNDS.minY = minY + 1; // Un peu au-dessus du sol
    ROOM_BOUNDS.maxY = maxY - 1;
    ROOM_BOUNDS.minZ = minZ + margin;
    ROOM_BOUNDS.maxZ = maxZ - margin;
    
    console.log('=== NOUVELLES LIMITES ROOM_BOUNDS ===');
    console.log(`X: ${ROOM_BOUNDS.minX.toFixed(1)} → ${ROOM_BOUNDS.maxX.toFixed(1)}`);
    console.log(`Y: ${ROOM_BOUNDS.minY.toFixed(1)} → ${ROOM_BOUNDS.maxY.toFixed(1)}`);
    console.log(`Z: ${ROOM_BOUNDS.minZ.toFixed(1)} → ${ROOM_BOUNDS.maxZ.toFixed(1)}`);
    console.log(`Position spawn: x=${camera.position.x.toFixed(1)}, y=${camera.position.y.toFixed(1)}, z=${camera.position.z.toFixed(1)}`);
}

/**
 * Attribue un poids à un objet selon la difficulté
 */
function assignWeight(obj, config) {
    const name = obj.name.toLowerCase();
    let weightConfig = null;
    // Trouver la config de poids correspondante
    if (name.includes('petite_fiolle') || name.includes('petite_fiole')) {
        weightConfig = config.weights['petite_fiolle'];
    } else if (name.includes('fiolle_triangle') || name.includes('fiole_triangle')) {
        weightConfig = config.weights['fiolle_triangle'];
    } else if (name.includes('fiolle_longue') || name.includes('fiole_longue')) {
        weightConfig = config.weights['fiolle_longue'];
    } else if (name.includes('fiolle') || name.includes('fiole')) {
        weightConfig = config.weights['fiolle'];
    } else if (name.includes('livre')) {
        weightConfig = config.weights['livre'];
    }
    
    // Calculer le poids
    if (Array.isArray(weightConfig)) {
        // Poids aléatoire parmi les valeurs possibles
        obj.userData.weight = weightConfig[Math.floor(Math.random() * weightConfig.length)];
    } else {
        obj.userData.weight = weightConfig || 1;
    }
    
    // Afficher ou non le poids selon la difficulté
    obj.userData.showWeight = config.showWeights;
    
    console.log(`${obj.name}: ${obj.userData.weight}g ${config.showWeights ? '' : '(caché)'}`);
}

/**
 * Met à jour l'inventaire UI et vérifie si l'énigme 1 est résolue
 */
function refreshInventory() {
    const objectsOnBalance = interactables.filter(obj => obj.userData.onBalance);
    const totalWeight = objectsOnBalance.reduce((sum, obj) => sum + (obj.userData.weight || 0), 0);
    const config = getDifficultyConfig();
    
    updateInventoryUI(objectsOnBalance, totalWeight, config.targetWeight, (objToRemove) => {
        if (objToRemove && objToRemove.userData.onBalance) {
            import('./interaction.js').then(module => {
                module.removeFromBalance(objToRemove);
                refreshInventory();
                checkVictoryAndProgress();
            });
        }
    });
    
    checkVictoryAndProgress();
}

/**
 * Vérifie la victoire et passe à l'énigme suivante
 */
function checkVictoryAndProgress() {
    const config = getDifficultyConfig();
    const totalWeight = getWeightOnBalance();
    
    // Vérifier si énigme 1 (balance) est résolue
    if (currentPuzzle === 1 && totalWeight === config.targetWeight) {
        // Balance résolue ! Passer à l'énigme 2
        checkVictory(dropZoneMesh); // Met le cercle en vert
        
        // Afficher le bouton pour l'énigme suivante (un seul bouton)
        if (!document.getElementById('next-puzzle-btn')) {
            const btn = document.createElement('button');
            btn.id = 'next-puzzle-btn';
            btn.textContent = '✅ Balance équilibrée ! → Énigme suivante';
            btn.style.cssText = `
                position: fixed;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(180deg, #5a4a3a 0%, #3a3025 100%);
                color: #d4c4a8;
                border: 2px solid #c9a227;
                padding: 15px 40px;
                font-size: 1.1rem;
                font-weight: bold;
                border-radius: 5px;
                cursor: pointer;
                z-index: 1001;
                font-family: 'Courier Prime', monospace;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
                transition: all 0.3s ease;
            `;
            
            btn.onmouseover = () => {
                btn.style.background = 'linear-gradient(180deg, #6a5a4a 0%, #4a3f30 100%)';
                btn.style.transform = 'translateX(-50%) translateY(-2px)';
            };
            btn.onmouseout = () => {
                btn.style.background = 'linear-gradient(180deg, #5a4a3a 0%, #3a3025 100%)';
                btn.style.transform = 'translateX(-50%)';
            };
            
            btn.onclick = () => {
                currentPuzzle = 2;
                btn.remove();
                
                // Supprimer aussi le bouton victory-btn de game.js s'il existe
                const victoryBtn = document.getElementById('victory-btn');
                if (victoryBtn) victoryBtn.remove();
                
                // Cacher l'inventaire UI
                hideInventoryUI();
                
                // Remettre toutes les fioles à leur place
                resetAllObjectsToOriginalPosition();
                
                // Cacher la zone de dépôt
                if (dropZoneMesh) {
                    dropZoneMesh.visible = false;
                }
                
                showPuzzleInstruction('Examinez le TABLEAU au mur pour trouver la réponse !', () => {
                    enableTableauClick();
                });
            };
            document.body.appendChild(btn);
        }
    } else {
        // Pas encore résolu, retirer le bouton si présent
        const existingBtn = document.getElementById('next-puzzle-btn');
        if (existingBtn && currentPuzzle === 1) existingBtn.remove();
        checkVictory(dropZoneMesh);
    }
}

/**
 * Cache l'inventaire UI
 */
function hideInventoryUI() {
    const inventory = document.getElementById('inventory-ui');
    if (inventory) {
        inventory.style.display = 'none';
    }
}

/**
 * Remet tous les objets à leur position d'origine
 */
function resetAllObjectsToOriginalPosition() {
    interactables.forEach(obj => {
        if (obj.userData.onBalance && obj.userData.originalPosition) {
            // Animation pour remettre l'objet
            import('gsap').then(({ default: gsap }) => {
                gsap.to(obj.position, {
                    x: obj.userData.originalPosition.x,
                    y: obj.userData.originalPosition.y,
                    z: obj.userData.originalPosition.z,
                    duration: 0.5,
                    ease: "power2.out"
                });
            });
            obj.userData.onBalance = false;
        }
    });
}

/**
 * Affiche une instruction pour le joueur
 */
function showPuzzleInstruction(message, callback) {
    const instruction = document.createElement('div');
    instruction.className = 'puzzle-instruction';
    instruction.innerHTML = `
        <div class="instruction-content">
            <p>${message}</p>
            <button>Compris !</button>
        </div>
    `;
    instruction.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        .instruction-content {
            background: linear-gradient(180deg, rgba(50, 45, 35, 0.98) 0%, rgba(35, 30, 25, 0.98) 100%);
            padding: 40px;
            border-radius: 10px;
            text-align: center;
            color: #d4c4a8;
            border: 2px solid #5a4a3a;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            font-family: 'Courier Prime', monospace;
        }
        .instruction-content p {
            font-size: 1.3rem;
            margin-bottom: 25px;
            line-height: 1.6;
        }
        .instruction-content button {
            background: linear-gradient(180deg, #5a4a3a 0%, #3a3025 100%);
            color: #d4c4a8;
            border: 2px solid #c9a227;
            padding: 12px 30px;
            font-size: 1rem;
            font-weight: bold;
            border-radius: 5px;
            cursor: pointer;
            font-family: 'Courier Prime', monospace;
            transition: all 0.3s ease;
        }
        .instruction-content button:hover {
            background: linear-gradient(180deg, #6a5a4a 0%, #4a3f30 100%);
            transform: translateY(-2px);
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(instruction);
    
    instruction.querySelector('button').onclick = () => {
        instruction.remove();
        if (callback) callback();
    };
}

/**
 * Active le clic sur le tableau
 */
function enableTableauClick() {
    if (!tableauMesh) {
        console.warn('Tableau non trouvé dans la scène !');
        // Créer un bouton temporaire pour tester
        createPuzzleButton('tableau');
        return;
    }
    
    const onClick = (event) => {
        const mouse = new THREE.Vector2(
            (event.clientX / sizes.width) * 2 - 1,
            -(event.clientY / sizes.height) * 2 + 1
        );
        
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(tableauMesh, true);
        
        if (intersects.length > 0) {
            createTableauPuzzleUI(() => {
                // Succès ! Passer à l'énigme 3 (coffre)
                window.removeEventListener('click', onClick);
                currentPuzzle = 3;
                showPuzzleInstruction('🔒 Trouvez le code du COFFRE-FORT pour l\'ouvrir !', () => {
                    enableCoffreClick();
                });
            });
        }
    };
    
    window.addEventListener('click', onClick);
}

/**
 * Active le clic sur le coffre-fort
 */
function enableCoffreClick() {
    // Si pas de mesh coffre, créer un bouton
    if (!coffreMesh) {
        console.warn('Coffre non trouvé dans la scène !');
        createCoffreButton();
        return;
    }
    
    const onClick = (event) => {
        const mouse = new THREE.Vector2(
            (event.clientX / sizes.width) * 2 - 1,
            -(event.clientY / sizes.height) * 2 + 1
        );
        
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(coffreMesh, true);
        
        if (intersects.length > 0) {
            createCoffrePuzzleUI(() => {
                // Coffre déverrouillé ! Ouvrir la porte
                window.removeEventListener('click', onClick);
                openCoffreDoor();
            });
        }
    };
    
    window.addEventListener('click', onClick);
}

/**
 * Bouton pour le coffre si le mesh n'est pas trouvé
 */
function createCoffreButton() {
    const existingBtn = document.getElementById('puzzle-action-btn');
    if (existingBtn) existingBtn.remove();
    
    const btn = document.createElement('button');
    btn.id = 'puzzle-action-btn';
    btn.textContent = '🔒 Examiner le Coffre-Fort';
    btn.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(180deg, #5a4a3a 0%, #3a3025 100%);
        color: #d4c4a8;
        border: 2px solid #c9a227;
        padding: 15px 30px;
        font-size: 1rem;
        font-weight: bold;
        border-radius: 5px;
        cursor: pointer;
        z-index: 1001;
        font-family: 'Courier Prime', monospace;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
        transition: all 0.3s ease;
    `;
    
    btn.onclick = () => {
        createCoffrePuzzleUI(() => {
            btn.remove();
            openCoffreDoor();
        });
    };
    
    document.body.appendChild(btn);
}

/**
 * Animation d'ouverture de la porte du coffre
 */
function openCoffreDoor() {
    currentPuzzle = 4;
    
    if (coffreMesh) {
        // Animation de rotation de la porte vers la gauche (ouverture)
        gsap.to(coffreMesh.rotation, {
            y: coffreMesh.rotation.y - Math.PI / 2, // 90° vers la gauche
            duration: 1.5,
            ease: "power2.inOut",
            onComplete: () => {
                showKeyPickupUI();
            }
        });
    } else {
        // Si pas de mesh, passer directement
        showKeyPickupUI();
    }
}

/**
 * Interface pour récupérer la clé
 */
function showKeyPickupUI() {
    // Rendre la clé visible et brillante
    if (keyMesh) {
        keyMesh.visible = true;
        // Faire briller la clé
        gsap.to(keyMesh.scale, {
            x: 1.2, y: 1.2, z: 1.2,
            duration: 0.5,
            yoyo: true,
            repeat: -1,
            ease: "power1.inOut"
        });
    }
    
    showPuzzleInstruction('🔑 Une CLÉ ! Cliquez dessus pour la récupérer !', () => {
        enableKeyClick();
    });
}

/**
 * Active le clic sur la clé
 */
function enableKeyClick() {
    if (!keyMesh) {
        console.warn('Clé non trouvée !');
        createKeyButton();
        return;
    }
    
    const onClick = (event) => {
        const mouse = new THREE.Vector2(
            (event.clientX / sizes.width) * 2 - 1,
            -(event.clientY / sizes.height) * 2 + 1
        );
        
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(keyMesh, true);
        
        if (intersects.length > 0) {
            pickupKey();
            window.removeEventListener('click', onClick);
        }
    };
    
    window.addEventListener('click', onClick);
}

/**
 * Bouton pour la clé si non trouvée
 */
function createKeyButton() {
    const existingBtn = document.getElementById('puzzle-action-btn');
    if (existingBtn) existingBtn.remove();
    
    const btn = document.createElement('button');
    btn.id = 'puzzle-action-btn';
    btn.textContent = '🔑 Prendre la Clé';
    btn.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(180deg, #c9a227 0%, #8b7355 100%);
        color: #1a1a1a;
        border: 2px solid #d4c4a8;
        padding: 15px 30px;
        font-size: 1rem;
        font-weight: bold;
        border-radius: 5px;
        cursor: pointer;
        z-index: 1001;
        font-family: 'Courier Prime', monospace;
        box-shadow: 0 4px 15px rgba(201, 162, 39, 0.4);
        transition: all 0.3s ease;
    `;
    
    btn.onclick = () => {
        btn.remove();
        pickupKey();
    };
    
    document.body.appendChild(btn);
}

/**
 * Ramasser la clé
 */
function pickupKey() {
    hasKey = true;
    currentPuzzle = 5;
    
    // Cacher la clé de la scène
    if (keyMesh) {
        gsap.killTweensOf(keyMesh.scale);
        gsap.to(keyMesh.position, {
            y: keyMesh.position.y + 2,
            duration: 0.5,
            ease: "power2.in"
        });
        gsap.to(keyMesh.scale, {
            x: 0, y: 0, z: 0,
            duration: 0.5,
            onComplete: () => {
                keyMesh.visible = false;
            }
        });
    }
    
    // Afficher l'indicateur de clé
    showKeyIndicator();
    
    // Instruction pour aller au cadenas
    setTimeout(() => {
        showPuzzleInstruction('🚪 Trouvez la PORTE avec le CADENAS et utilisez la clé pour l\'ouvrir !', () => {
            enableCadenasClick();
        });
    }, 600);
}

/**
 * Affiche l'indicateur que le joueur a la clé
 */
function showKeyIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'key-indicator';
    indicator.innerHTML = '🔑 Clé';
    indicator.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        background: linear-gradient(180deg, #c9a227 0%, #8b7355 100%);
        color: #1a1a1a;
        padding: 10px 20px;
        border-radius: 5px;
        font-family: 'Courier Prime', monospace;
        font-weight: bold;
        font-size: 1rem;
        z-index: 1000;
        box-shadow: 0 4px 15px rgba(201, 162, 39, 0.4);
        animation: pulse 2s infinite;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(indicator);
}

/**
 * Active le clic sur le cadenas
 */
function enableCadenasClick() {
    if (!cadenasMesh) {
        console.warn('Cadenas non trouvé !');
        createCadenasButton();
        return;
    }
    
    const onClick = (event) => {
        const mouse = new THREE.Vector2(
            (event.clientX / sizes.width) * 2 - 1,
            -(event.clientY / sizes.height) * 2 + 1
        );
        
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(cadenasMesh, true);
        
        if (intersects.length > 0) {
            if (hasKey) {
                window.removeEventListener('click', onClick);
                openCadenas();
            } else {
                showMessage("Vous avez besoin d'une clé !");
            }
        }
    };
    
    window.addEventListener('click', onClick);
}

/**
 * Bouton pour le cadenas si non trouvé
 */
function createCadenasButton() {
    const existingBtn = document.getElementById('puzzle-action-btn');
    if (existingBtn) existingBtn.remove();
    
    const btn = document.createElement('button');
    btn.id = 'puzzle-action-btn';
    btn.textContent = '🚪 Ouvrir le Cadenas';
    btn.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(180deg, #5a4a3a 0%, #3a3025 100%);
        color: #d4c4a8;
        border: 2px solid #81c784;
        padding: 15px 30px;
        font-size: 1rem;
        font-weight: bold;
        border-radius: 5px;
        cursor: pointer;
        z-index: 1001;
        font-family: 'Courier Prime', monospace;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
        transition: all 0.3s ease;
    `;
    
    btn.onclick = () => {
        if (hasKey) {
            btn.remove();
            openCadenas();
        } else {
            showMessage("Vous avez besoin d'une clé !");
        }
    };
    
    document.body.appendChild(btn);
}

/**
 * Affiche un message temporaire
 */
function showMessage(text) {
    const msg = document.createElement('div');
    msg.textContent = text;
    msg.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        color: #e57373;
        padding: 20px 40px;
        border-radius: 10px;
        font-family: 'Courier Prime', monospace;
        font-size: 1.2rem;
        z-index: 10000;
        border: 2px solid #e57373;
    `;
    document.body.appendChild(msg);
    
    gsap.fromTo(msg, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.3 });
    setTimeout(() => {
        gsap.to(msg, { opacity: 0, duration: 0.3, onComplete: () => msg.remove() });
    }, 2000);
}

/**
 * Ouvre le cadenas et déclenche la victoire
 */
function openCadenas() {
    // Retirer l'indicateur de clé
    const keyIndicator = document.getElementById('key-indicator');
    if (keyIndicator) keyIndicator.remove();
    
    if (cadenasMesh) {
        // Animation de rotation du cadenas vers le haut (ouverture)
        gsap.to(cadenasMesh.rotation, {
            x: cadenasMesh.rotation.x - Math.PI / 2, // 90° vers le haut
            duration: 1,
            ease: "power2.inOut",
            onComplete: () => {
                // Victoire finale !
                setTimeout(() => {
                    showVictoryScreen();
                }, 500);
            }
        });
    } else {
        // Victoire directe
        showVictoryScreen();
    }
}

/**
 * Crée un bouton pour accéder à l'énigme du tableau
 */
function createPuzzleButton(type) {
    // Supprimer tout bouton existant
    const existingBtn = document.getElementById('puzzle-action-btn');
    if (existingBtn) existingBtn.remove();
    
    const btn = document.createElement('button');
    btn.id = 'puzzle-action-btn';
    btn.textContent = '📋 Examiner le Tableau';
    btn.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(180deg, #5a4a3a 0%, #3a3025 100%);
        color: #d4c4a8;
        border: 2px solid #c9a227;
        padding: 15px 30px;
        font-size: 1rem;
        font-weight: bold;
        border-radius: 5px;
        cursor: pointer;
        z-index: 1001;
        font-family: 'Courier Prime', monospace;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
        transition: all 0.3s ease;
    `;
    
    btn.onmouseover = () => {
        btn.style.background = 'linear-gradient(180deg, #6a5a4a 0%, #4a3f30 100%)';
        btn.style.transform = 'translateX(-50%) translateY(-2px)';
    };
    btn.onmouseout = () => {
        btn.style.background = 'linear-gradient(180deg, #5a4a3a 0%, #3a3025 100%)';
        btn.style.transform = 'translateX(-50%)';
    };
    
    btn.onclick = () => {
        createTableauPuzzleUI(() => {
            btn.remove();
            // Victoire finale !
            showVictoryScreen();
        });
    };
    
    document.body.appendChild(btn);
}

/**
 * Démarre le jeu avec la difficulté choisie
 */
function startGame(difficulty) {
    selectedDifficulty = difficulty;
    const config = DIFFICULTIES[difficulty];
    console.log(`=== Démarrage en mode ${config.name} ===`);
    console.log(`Objectif énigme 1: ${config.targetWeight}g`);
    
    // Initialiser les puzzles
    initPuzzles(difficulty);
    
    // Définir le poids cible
    setTargetWeight(config.targetWeight);
    
    // Créer l'inventaire UI
    inventoryUI = createInventoryUI();
    
    // Créer la zone de dépôt
    dropZoneMesh = createDropZone(scene);
    
    // Attribuer les poids selon la difficulté
    interactables.forEach(obj => {
        assignWeight(obj, config);
    });
    
    // Initialiser les interactions
    initInteraction(camera, sizes, interactables, controls, refreshInventory);
    
    // Afficher l'instruction de départ
    showPuzzleInstruction(`🧪 ÉNIGME 1: Placez exactement ${config.targetWeight}g sur la balance !`, null);
}

// --- CHARGEMENT DU MODELE ---
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

loader.load(laboModel, (gltf) => {
    const fullScene = gltf.scene;
    scene.add(fullScene);

    // Listes temporaires pour eviter de modifier l'arbre pendant le traverse
    const tablesToSetup = [];
    const balancesToSetup = [];
    const wallsToSetup = [];
    const objectsToSetup = [];

    fullScene.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            const name = child.name.toLowerCase();
            const originalName = child.name;

            // Tables (statiques)
            if (name.includes('table')) {
                tablesToSetup.push(child);
            }
            
            // Balance (statique)
            if (name === 'balance' || name.includes('balance')) {
                balancesToSetup.push(child);
            }
            
            // Tableau (pour énigme 2)
            if (name.includes('tableau') || name.includes('board') || name.includes('blackboard')) {
                tableauMesh = child;
                console.log('Tableau trouvé:', child.name);
            }
            
            // Porte du coffre-fort (pour énigme 3)
            if (originalName === 'Porte_coffre_fort' || name.includes('porte_coffre') || name.includes('coffre_fort')) {
                coffreMesh = child;
                console.log('Coffre-fort trouvé:', child.name);
            }
            
            // Clé dans le coffre (Object_2.001)
            if (originalName === 'Object_2.001' || (name.includes('cle') || name.includes('key'))) {
                keyMesh = child;
                // Cacher la clé au départ
                child.visible = false;
                console.log('Clé trouvée:', child.name);
            }
            
            // Cadenas de la porte de sortie
            if (originalName === 'ouverture_cadenas' || name.includes('cadenas') || name.includes('padlock')) {
                cadenasMesh = child;
                console.log('Cadenas trouvé:', child.name);
            }
            
            // Murs et obstacles (statiques)
            if (isWallOrObstacle(child.name)) {
                wallsToSetup.push(child);
            }

            // Objets interactables (fioles & livres)
            if (isInteractable(child.name)) {
                objectsToSetup.push(child);
            }
        }
    });

    // Creation des corps physiques APRES le traverse
    tablesToSetup.forEach(mesh => {
        createTableBody(mesh);
    });

    balancesToSetup.forEach(mesh => {
        createBalanceBody(mesh);
    });
    
    wallsToSetup.forEach(mesh => {
        createWallBody(mesh);
    });
    
    // Configurer les limites de la pièce basées sur les murs PARED
    const paredWalls = wallsToSetup.filter(w => w.name.toLowerCase().includes('pared'));
    if (paredWalls.length > 0) {
        setRoomBounds(paredWalls);
        
        // Calculer automatiquement les limites de la caméra à partir des murs
        updateRoomBoundsFromWalls(paredWalls);
    }

    objectsToSetup.forEach(child => {
        createDynamicBody(child, scene);
        interactables.push(child);
    });

    console.log('Total objets interactables : ' + interactables.length);
    console.log('=== OBJETS SPÉCIAUX DÉTECTÉS ===');
    console.log('Tableau:', tableauMesh ? tableauMesh.name : 'NON TROUVÉ');
    console.log('Coffre:', coffreMesh ? coffreMesh.name : 'NON TROUVÉ');
    console.log('Clé:', keyMesh ? keyMesh.name : 'NON TROUVÉ');
    console.log('Cadenas:', cadenasMesh ? cadenasMesh.name : 'NON TROUVÉ');
    console.log('=== LIMITES DE LA PIÈCE ===');
    console.log('X:', ROOM_BOUNDS.minX, 'à', ROOM_BOUNDS.maxX);
    console.log('Y:', ROOM_BOUNDS.minY, 'à', ROOM_BOUNDS.maxY);
    console.log('Z:', ROOM_BOUNDS.minZ, 'à', ROOM_BOUNDS.maxZ);
    
    // Afficher l'écran de démarrage
    createStartScreen(startGame);
});

// --- ANIMATION LOOP ---
const clock = new THREE.Clock();
let oldElapsedTime = 0;

/**
 * Limite la position de la caméra pour ne pas traverser les murs
 */
function clampCameraPosition() {
    camera.position.x = Math.max(ROOM_BOUNDS.minX, Math.min(ROOM_BOUNDS.maxX, camera.position.x));
    camera.position.y = Math.max(ROOM_BOUNDS.minY, Math.min(ROOM_BOUNDS.maxY, camera.position.y));
    camera.position.z = Math.max(ROOM_BOUNDS.minZ, Math.min(ROOM_BOUNDS.maxZ, camera.position.z));
    
    // Aussi limiter le target des contrôles
    controls.target.x = Math.max(ROOM_BOUNDS.minX + 1, Math.min(ROOM_BOUNDS.maxX - 1, controls.target.x));
    controls.target.y = Math.max(0.5, Math.min(ROOM_BOUNDS.maxY - 1, controls.target.y));
    controls.target.z = Math.max(ROOM_BOUNDS.minZ + 1, Math.min(ROOM_BOUNDS.maxZ - 1, controls.target.z));
}

const tick = () => {
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - oldElapsedTime;
    oldElapsedTime = elapsedTime;

    updatePhysics(deltaTime);
    
    // Déplacement WASD
    updateMovement();
    
    controls.update();
    
    // Limites désactivées - tu peux te déplacer librement
    // clampCameraPosition();
    
    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
};
tick();

// Redimensionnement
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
});

// === OUTIL DEBUG - Appuie sur P pour voir ta position ===
window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'p') {
        const pos = camera.position;
        console.log('=== POSITION ACTUELLE ===');
        console.log(`SPAWN_POSITION = { x: ${pos.x.toFixed(1)}, y: ${pos.y.toFixed(1)}, z: ${pos.z.toFixed(1)} }`);
        console.log(`Target: { x: ${controls.target.x.toFixed(1)}, y: ${controls.target.y.toFixed(1)}, z: ${controls.target.z.toFixed(1)} }`);
        
        // Afficher aussi à l'écran
        showPositionOnScreen(pos);
    }
});

function showPositionOnScreen(pos) {
    let posDisplay = document.getElementById('pos-debug');
    if (!posDisplay) {
        posDisplay = document.createElement('div');
        posDisplay.id = 'pos-debug';
        posDisplay.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 20px;
            background: rgba(0,0,0,0.8);
            color: #81c784;
            padding: 15px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 14px;
            z-index: 9999;
            border: 1px solid #81c784;
        `;
        document.body.appendChild(posDisplay);
    }
    posDisplay.innerHTML = `
        <strong>📍 Position (touche P)</strong><br>
        x: ${pos.x.toFixed(1)}<br>
        y: ${pos.y.toFixed(1)}<br>
        z: ${pos.z.toFixed(1)}<br>
        <small style="color:#aaa">Copie ces valeurs dans SPAWN_POSITION</small>
    `;
    
    // Cacher après 5 secondes
    setTimeout(() => {
        if (posDisplay) posDisplay.remove();
    }, 5000);
}
