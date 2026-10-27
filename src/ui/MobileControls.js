export class MobileControls {
  constructor(inputState) {
    this.inputState = inputState;
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.container = document.getElementById('mobile-controls');

    if (!this.isTouchDevice) {
      if (this.container) this.container.classList.add('hidden');
      return;
    }

    if (this.container) this.container.classList.remove('hidden');
    this.initJoystick();
    this.initFireButton();
  }

  initJoystick() {
    const joyBase = document.getElementById('joystick-base');
    const joyThumb = document.getElementById('joystick-thumb');
    if (!joyBase || !joyThumb) return;

    let touchId = null;
    let baseRect = null;
    const maxDist = 45;

    joyBase.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      touchId = touch.identifier;
      baseRect = joyBase.getBoundingClientRect();
      this.updateJoystick(touch.clientX, touch.clientY, baseRect, maxDist, joyThumb);
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (touchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchId) {
          this.updateJoystick(touch.clientX, touch.clientY, baseRect, maxDist, joyThumb);
          break;
        }
      }
    }, { passive: false });

    const endHandler = (e) => {
      if (touchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          touchId = null;
          joyThumb.style.transform = `translate(0px, 0px)`;
          this.inputState.forward = false;
          this.inputState.backward = false;
          this.inputState.left = false;
          this.inputState.right = false;
          break;
        }
      }
    };

    window.addEventListener('touchend', endHandler);
    window.addEventListener('touchcancel', endHandler);
  }

  updateJoystick(clientX, clientY, baseRect, maxDist, thumb) {
    const centerX = baseRect.left + baseRect.width / 2;
    const centerY = baseRect.top + baseRect.height / 2;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist > maxDist) {
      dx = (dx / dist) * maxDist;
      dy = (dy / dist) * maxDist;
    }

    thumb.style.transform = `translate(${dx}px, ${dy}px)`;

    const threshold = 12;
    this.inputState.left = dx < -threshold;
    this.inputState.right = dx > threshold;
    this.inputState.forward = dy < -threshold;
    this.inputState.backward = dy > threshold;
  }

  initFireButton() {
    const fireBtn = document.getElementById('fire-button');
    if (!fireBtn) return;

    fireBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.inputState.isMouseDown = true;
      fireBtn.classList.add('active');
    }, { passive: false });

    const endFire = (e) => {
      this.inputState.isMouseDown = false;
      fireBtn.classList.remove('active');
    };

    fireBtn.addEventListener('touchend', endFire);
    fireBtn.addEventListener('touchcancel', endFire);
  }
}
