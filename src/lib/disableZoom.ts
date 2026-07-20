// Make the installed/standalone experience feel like a native app by turning
// off browser zoom. The viewport meta (maximum-scale=1, user-scalable=no)
// handles this fully in home-screen/standalone mode, but iOS Safari
// deliberately ignores that tag in a normal browser tab - so we also cancel
// the pinch gestures it fires there. Double-tap-to-zoom is handled separately
// by `touch-action: manipulation` in index.css.
export function disableZoomGestures() {
  // Safari emits these three during a pinch; cancelling them blocks the zoom.
  for (const type of ["gesturestart", "gesturechange", "gestureend"]) {
    document.addEventListener(type, (e) => e.preventDefault(), { passive: false });
  }
  // Belt-and-suspenders: a two-finger touchmove is a pinch - cancel it before
  // it scales. Single-finger scrolling never enters this branch, so normal
  // scrolling is untouched.
  document.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length > 1) e.preventDefault();
    },
    { passive: false }
  );
}
