// Keyboard and mouse input, read once per step and then cleared.
// Jump: Space, ArrowUp, W, or a mouse click/tap on the canvas.
// Duck/hide: ArrowDown or S (hold to stay ducked, tap near a haystack to hide).
// Dash: Shift. Pause: P or Escape. Mute: M. Start/restart: Space, Enter or R.
export function createInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  let pointerJump = false;

  function isJumpKey(code) {
    return code === 'Space' || code === 'ArrowUp' || code === 'KeyW' || code === 'Enter' || code === 'KeyR';
  }
  function isDuckKey(code) {
    return code === 'ArrowDown' || code === 'KeyS';
  }

  function onKeyDown(event) {
    if (event.repeat) return;
    if (isJumpKey(event.code) || isDuckKey(event.code) || event.code === 'ShiftLeft' || event.code === 'ShiftRight' || event.code === 'KeyP' || event.code === 'Escape' || event.code === 'KeyM') {
      event.preventDefault();
    }
    held.add(event.code);
    pressed.add(event.code);
  }
  function onKeyUp(event) {
    held.delete(event.code);
  }
  function onPointerDown(event) {
    event.preventDefault();
    pointerJump = true;
    canvas.focus();
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);

  return {
    get jumpPressed() {
      return pointerJump || [...pressed].some(isJumpKey);
    },
    get duckHeld() {
      return [...held].some(isDuckKey);
    },
    get dashPressed() {
      return pressed.has('ShiftLeft') || pressed.has('ShiftRight');
    },
    get pausePressed() {
      return pressed.has('KeyP') || pressed.has('Escape');
    },
    get mutePressed() {
      return pressed.has('KeyM');
    },
    /** Call at the end of each step so a press is only seen once. */
    endStep() {
      pressed.clear();
      pointerJump = false;
    },
  };
}
