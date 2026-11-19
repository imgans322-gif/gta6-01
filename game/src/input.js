// Keyboard input: WASD/arrows to move and drive, E to enter/exit cars, Shift to run, Enter to start.
export function createInput() {
  const keys = new Set();
  const pressed = new Set();
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (!keys.has(e.code)) pressed.add(e.code);
    keys.add(e.code);
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());
  return {
    keys,
    down: (code) => keys.has(code),
    justPressed: (code) => pressed.has(code),
    axisX() { return (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0); },
    axisY() { return (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0); },
    endFrame() { pressed.clear(); },
  };
}
