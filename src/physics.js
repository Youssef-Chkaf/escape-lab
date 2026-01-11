import * as THREE from 'three'

// Tableau pour synchronisation (si on en a besoin plus tard)
export const objectsToUpdate = [];

/**
 * Prépare un objet dynamique pour la manipulation
 * (Sans physique Cannon.js - manipulation directe du mesh)
 */
export function createDynamicBody(mesh, scene) {
    // Récupérer la position/rotation MONDE avant de détacher
    const worldPos = new THREE.Vector3();
    const worldQuat = new THREE.Quaternion();
    const worldScale = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);
    mesh.getWorldQuaternion(worldQuat);
    mesh.getWorldScale(worldScale);
    
    // Détacher l'objet de son parent pour le mettre à la racine
    scene.attach(mesh);
    
    // Appliquer explicitement la position monde
    mesh.position.copy(worldPos);
    mesh.quaternion.copy(worldQuat);
    mesh.scale.copy(worldScale);
    
    // Stocker la position d'origine pour pouvoir reset si besoin
    mesh.userData.originalPosition = worldPos.clone();
    
    console.log(`Objet préparé : ${mesh.name} à (${worldPos.x.toFixed(2)}, ${worldPos.y.toFixed(2)}, ${worldPos.z.toFixed(2)})`);
    
    return mesh;
}

/**
 * Pas de mise à jour physique nécessaire avec cette approche simplifiée
 */
export function updatePhysics(deltaTime) {
    // Rien à faire - les objets sont manipulés directement
}

// Fonctions gardées pour compatibilité mais ne font rien de critique
export function createTableBody(mesh) {
    console.log(`Table détectée : ${mesh.name}`);
}

export function createBalanceBody(mesh) {
    console.log(`Balance détectée : ${mesh.name}`);
}

export function createWallBody(mesh) {
    console.log(`Mur/Obstacle détecté : ${mesh.name}`);
}
