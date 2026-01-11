import * as THREE from 'three'
import gsap from 'gsap'
import { BALANCE_POSITION } from './game.js'

// === VARIABLES ===
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let balanceSlot = 0;
let onUpdateCallback = null;

export function setRoomBounds(walls) {}

// === RETIRER UN OBJET DE LA BALANCE ===
export function removeFromBalance(obj) {
    if (!obj || !obj.userData.onBalance) return;
    
    gsap.to(obj.position, {
        x: obj.userData.originalPosition.x,
        y: obj.userData.originalPosition.y,
        z: obj.userData.originalPosition.z,
        duration: 0.5,
        ease: "power2.out",
        onComplete: () => {
            obj.userData.onBalance = false;
            if (onUpdateCallback) onUpdateCallback();
        }
    });
}

// === INITIALISATION DES INTERACTIONS ===
export function initInteraction(camera, sizes, interactables, controls, onUpdate) {
    onUpdateCallback = onUpdate;
    
    function updateMouse(event) {
        mouse.x = (event.clientX / sizes.width) * 2 - 1;
        mouse.y = -(event.clientY / sizes.height) * 2 + 1;
    }

    function getIntersectedObject(event) {
        updateMouse(event);
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(interactables, true);
        if (intersects.length > 0) {
            let obj = intersects[0].object;
            while (obj && !interactables.includes(obj)) obj = obj.parent;
            return obj;
        }
        return null;
    }

    window.addEventListener('click', (event) => {
        const clickedObject = getIntersectedObject(event);
        if (clickedObject) {
            if (!clickedObject.userData.originalPosition) {
                clickedObject.userData.originalPosition = clickedObject.position.clone();
            }
            
            if (clickedObject.userData.onBalance) {
                removeFromBalance(clickedObject);
            } else {
                const box = new THREE.Box3().setFromObject(clickedObject);
                const objectCenter = new THREE.Vector3();
                box.getCenter(objectCenter);
                
                const xOffset = clickedObject.position.x - objectCenter.x;
                const yOffset = clickedObject.position.y - box.min.y;
                const zOffset = clickedObject.position.z - objectCenter.z;
                
                const slotOffsetX = (balanceSlot % 3 - 1) * 0.2;
                const slotOffsetZ = (Math.floor(balanceSlot / 3) - 1) * 0.2;
                balanceSlot = (balanceSlot + 1) % 9;
                
                gsap.to(clickedObject.position, {
                    x: BALANCE_POSITION.x + xOffset + slotOffsetX,
                    y: BALANCE_POSITION.y + yOffset + 0.1,
                    z: BALANCE_POSITION.z + zOffset + slotOffsetZ,
                    duration: 0.5,
                    ease: "power2.out",
                    onComplete: () => {
                        clickedObject.userData.onBalance = true;
                        if (onUpdateCallback) onUpdateCallback();
                    }
                });
            }
        }
    });

    window.addEventListener('mousemove', (event) => {
        const hovered = getIntersectedObject(event);
        document.body.style.cursor = hovered ? 'pointer' : 'default';
    });
}

export const initDragAndDrop = initInteraction;
