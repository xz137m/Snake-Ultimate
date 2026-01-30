// c:\Users\Welcome\OneDrive\سطح المكتب\Snake Ultimate\js\input.js

function handleKeyPress(e) {
    if (e.repeat) return;
    
    // منع زر المسافة من تفعيل أزرار القوائم (مثل Play/Reset)
    if (e.code === 'Space') e.preventDefault();

    switch(e.code) {
        case 'ArrowUp': case 'KeyW': if (velocity.y !== 1) nextVelocity = { x: 0, y: -1 }; break;
        case 'ArrowDown': case 'KeyS': if (velocity.y !== -1) nextVelocity = { x: 0, y: 1 }; break;
        case 'ArrowLeft': case 'KeyA': if (velocity.x !== 1) nextVelocity = { x: -1, y: 0 }; break;
        case 'ArrowRight': case 'KeyD': if (velocity.x !== -1) nextVelocity = { x: 1, y: 0 }; break;
        case 'Space': if (!isGameOver) window.togglePause(); break;
    }
}

function handleSwipe(startX, startY, endX, endY) {
    const diffX = endX - startX;
    const diffY = endY - startY;
    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0 && velocity.x !== -1) nextVelocity = { x: 1, y: 0 };
        else if (diffX < 0 && velocity.x !== 1) nextVelocity = { x: -1, y: 0 };
    } else {
        if (diffY > 0 && velocity.y !== -1) nextVelocity = { x: 0, y: 1 };
        else if (diffY < 0 && velocity.y !== 1) nextVelocity = { x: 0, y: -1 };
    }
}

// إضافة مستمعي الأحداث العامة
window.addEventListener('keydown', handleKeyPress);
window.addEventListener('keyup', (e) => {
    if (e.key === 'Shift') {
        isSprinting = false;
    }
});
window.addEventListener('keydown', (e) => {
    if (e.repeat) return; // منع تكرار الحدث عند التعليق على الزر
    if (e.key === 'Shift') {
        isSprinting = true;
    }
});

// دعم اللمس
document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, {passive: false});

document.addEventListener('touchend', e => {
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;
    handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
}, {passive: false});

document.body.addEventListener('touchmove', function(e) { e.preventDefault(); }, { passive: false });
