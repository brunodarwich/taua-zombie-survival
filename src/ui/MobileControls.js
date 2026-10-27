export class MobileControls {
  constructor(inputState) {
    this.inputState = inputState;
    this.container = document.getElementById('mobile-controls');
    if (!navigator.maxTouchPoints) { this.container?.classList.add('hidden'); return; }
    this.joy = document.getElementById('joystick-base');
    this.thumb = document.getElementById('joystick-thumb');
    this.fire = document.getElementById('fire-button');
    this.bind(this.joy, (e) => this.move(e), () => this.resetMovement());
    this.bind(this.fire, () => {
      inputState.isMouseDown = true;
      this.fire.classList.add('active');
    }, () => {
      inputState.isMouseDown = false;
      this.fire.classList.remove('active');
    });
    const reset = () => {
      this.resetMovement();
      inputState.isMouseDown = false;
      this.fire.classList.remove('active');
    };
    const viewport = () => {
      reset();
      const view = window.visualViewport;
      document.documentElement.style.setProperty('--game-height', `${view?.height || innerHeight}px`);
      document.documentElement.style.setProperty('--game-width', `${view?.width || innerWidth}px`);
      document.documentElement.style.setProperty('--view-top', `${view?.offsetTop || 0}px`);
      document.documentElement.style.setProperty('--view-left', `${view?.offsetLeft || 0}px`);
    };
    window.addEventListener('blur', reset);
    document.addEventListener('visibilitychange', reset);
    window.addEventListener('resize', viewport);
    window.visualViewport?.addEventListener('resize', viewport);
    window.visualViewport?.addEventListener('scroll', viewport);
    viewport();
  }

  bind(element, update, release) {
    let pointer = null;
    const cancel = () => {
      const previous = pointer;
      pointer = null;
      if (previous !== null && element.hasPointerCapture(previous)) element.releasePointerCapture(previous);
      release();
    };
    window.addEventListener('blur', cancel);
    window.addEventListener('resize', cancel);
    document.addEventListener('visibilitychange', cancel);
    element.addEventListener('pointerdown', e => {
      if (pointer !== null) return;
      e.preventDefault();
      pointer = e.pointerId;
      element.setPointerCapture(pointer);
      update(e);
    });
    element.addEventListener('pointermove', e => {
      if (e.pointerId === pointer) { e.preventDefault(); update(e); }
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      element.addEventListener(type, e => {
        if (e.pointerId !== pointer) return;
        pointer = null;
        release();
      });
    }
  }

  move(e) {
    const rect = this.joy.getBoundingClientRect();
    const radius = (rect.width - this.thumb.offsetWidth) / 2 - 3;
    let dx = e.clientX - rect.left - rect.width / 2;
    let dy = e.clientY - rect.top - rect.height / 2;
    const distance = Math.hypot(dx, dy);
    const factor = distance > radius ? radius / distance : 1;
    dx *= factor; dy *= factor;
    this.thumb.style.transform = `translate(${dx}px, ${dy}px)`;
    const strength = Math.max(0, Math.min(1, (distance / radius - 0.15) / 0.85));
    this.inputState.moveX = distance ? dx / Math.hypot(dx, dy) * strength : 0;
    this.inputState.moveZ = distance ? dy / Math.hypot(dx, dy) * strength : 0;
  }

  resetMovement() {
    this.inputState.moveX = this.inputState.moveZ = 0;
    this.thumb.style.transform = 'translate(0px, 0px)';
  }
}
