import * as THREE from 'three'
import gsap from 'gsap'

// === CONFIGURATION ===
export const BALANCE_POSITION = new THREE.Vector3(-13.77, 11.66, 17.08);
let targetWeight = 12;
export const interactables = [];

export function setTargetWeight(weight) { targetWeight = weight; }
export function getTargetWeight() { return targetWeight; }

// === DETECTION DES OBJETS ===
export function isVial(name) {
    const lowerName = name.toLowerCase();
    return lowerName.includes('fiolle') || lowerName.includes('fiole');
}

export function isBook(name) { return name.toLowerCase().includes('livre'); }
export function isInteractable(name) { return isVial(name) || isBook(name); }

// === CALCUL DU POIDS SUR LA BALANCE ===
export function getWeightOnBalance() {
    let weight = 0;
    interactables.forEach(obj => {
        if (obj.userData.onBalance) weight += obj.userData.weight || 0;
    });
    return weight;
}

// === ZONE DE DEPOT ===
export function createDropZone(scene) {
    const geometry = new THREE.CylinderGeometry(0.8, 0.8, 0.05, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true, opacity: 0.7, transparent: true });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(BALANCE_POSITION);
    mesh.position.y += 0.1;
    scene.add(mesh);
    return mesh;
}

// === VERIFICATION VICTOIRE ===
export function checkVictory(dropZoneMesh) {
    const currentWeight = getWeightOnBalance();
    if (currentWeight === targetWeight) {
        gsap.to(dropZoneMesh.material.color, { r: 0, g: 1, b: 0, duration: 0.5 });
    } else {
        gsap.to(dropZoneMesh.material.color, { r: 1, g: 0, b: 0, duration: 0.5 });
    }
}
