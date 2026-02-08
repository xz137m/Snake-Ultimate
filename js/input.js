/**
 * Handles keyboard input for movement and game controls.
 * Merges movement logic and sprinting toggles.
 * @param {KeyboardEvent} e 
 */
const handleKeyPress = (e) => {
    if (e.repeat) return;
    
    // Prevent default scrolling or button activation for game controls
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
    }

    switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
            if (velocity.y !== 1) nextVelocity = { x: 0, y: -1 };
            break;
        case 'ArrowDown':
        case 'KeyS':
            if (velocity.y !== -1) nextVelocity = { x: 0, y: 1 };
            break;
        case 'ArrowLeft':
        case 'KeyA':
            if (velocity.x !== 1) nextVelocity = { x: -1, y: 0 };
            break;
        case 'ArrowRight':
        case 'KeyD':
            if (velocity.x !== -1) nextVelocity = { x: 1, y: 0 };
            break;
        case 'Space':
            if (!isGameOver && typeof window.togglePause === 'function') window.togglePause();
            break;
        case 'ShiftLeft':
        case 'ShiftRight':
            isSprinting = true;
            break;
    }
};

/**
 * Handles touch swipe gestures for mobile movement.
 * @param {number} startX 
 * @param {number} startY 
 * @param {number} endX 
 * @param {number} endY 
 */
const handleSwipe = (startX, startY, endX, endY) => {
    const diffX = endX - startX;
    const diffY = endY - startY;

    // Minimum swipe distance threshold to avoid accidental inputs
    if (Math.abs(diffX) < 10 && Math.abs(diffY) < 10) return;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal
        if (diffX > 0 && velocity.x !== -1) nextVelocity = { x: 1, y: 0 };
        else if (diffX < 0 && velocity.x !== 1) nextVelocity = { x: -1, y: 0 };
    } else {
        // Vertical
        if (diffY > 0 && velocity.y !== -1) nextVelocity = { x: 0, y: 1 };
        else if (diffY < 0 && velocity.y !== 1) nextVelocity = { x: 0, y: -1 };
    }
};

// --- Event Listeners ---

// Keyboard Events
window.addEventListener('keydown', handleKeyPress);
window.addEventListener('keyup', (e) => {
    if (e.key === 'Shift') isSprinting = false;
});

// Touch Events (Mobile)
document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, { passive: false });

document.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;
    handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
}, { passive: false });

// Prevent default touch scrolling to ensure smooth gameplay
document.body.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
