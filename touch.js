const container = document.getElementById("touch");

// interact(container).draggable({
//   listeners: {
//     move(event) {
//       pan(container, event, 0.5);
//     },
//   },
// });

var hammertime = new Hammer(container);
hammertime.get("pan").set({ direction: Hammer.DIRECTION_ALL });
hammertime.on("pan", function (ev) {
  console.log(ev);
  pan(container, ev);
});

const POS = {
  x: 0,
  y: 0,
};

function pan(container = null, delta, crop = 0.5) {
  const { deltaX, deltaY } = delta;
  const maxDelta = getMaxDelta(container, crop);
  offsetBackground(maxDelta, { dx: deltaX, dy: deltaY });
}

function getMaxDelta(container, crop) {
  const width = container?.clientWidth;
  const cropWidth = width * crop;
  const maxDeltaX = cropWidth / 2;
  return maxDeltaX;
}

function offsetBackground(maxDelta, delta) {
  //   updatePOS(maxDelta, delta);
  updateCss(maxDelta, delta);
}

function updatePOS(maxDelta, { dx, dy }) {
  POS.x += dx;
  POS.x = applyOffsetBounds(maxDelta, POS.x);

  POS.y += dy;
  POS.y = applyOffsetBounds(maxDelta, POS.y);
}

function applyOffsetBounds(maxDelta, value) {
  return Math.min(Math.max(-maxDelta, value), maxDelta);
}

function updateCss(maxDelta, { dx, dy }) {
  // function updateCss({ x, y }) {
  let root = document.documentElement;
  root.style.setProperty("--bg-x", x + "px");
  root.style.setProperty("--bg-y", y + "px");
}

// hammertime.get('pinch').set({ enable: true });
// hammertime.get('rotate').set({ enable: true });
