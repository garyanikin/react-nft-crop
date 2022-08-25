import logo from "./logo.svg";
import "./App.css";

import Sketch from "react-p5";

import { clamp } from "lodash";
import React, { useEffect } from "react";
import photoSrc from "./photo.jpg";
import { useSpring, animated } from "@react-spring/web";

// TODO use Tree shake
import { createUseGesture, dragAction, pinchAction } from "@use-gesture/react";
const useGesture = createUseGesture([dragAction, pinchAction]);

function getPosition({ x, y }) {
  // current position
  return () => [x.get(), y.get()];
}

function getBounds(getImageSize, scale) {
  // based on scale
  return () => {
    const imageSize = getImageSize();
    if (imageSize === null) return {};

    // получить соотношение полигона к изображернию
    /* bonds to .preview width */
    const ploygonSize = getPolygonSize();
    const _scale = scale.get();
    const width = (imageSize.width * _scale - ploygonSize) / 2;
    const height = (imageSize.height * _scale - ploygonSize) / 2;
    return { left: -width, right: width, top: -height, bottom: height };
  };
}

function getPolygonSize() {
  const isMobile = window.innerWidth < 500;
  const size = getComputedStyle(document.documentElement).getPropertyValue(
    isMobile ? "--polygon-size" : "--polygon-size-desktop"
  );

  // Supports vw and px
  let parsedSize;
  if (size.indexOf("px") !== -1) {
    parsedSize = parseInt(size);
  } else {
    parsedSize = window.innerWidth * (parseInt(size) / 100);
  }

  return parsedSize;
}

function getScaleBounds(imageSize) {
  if (imageSize === null) return null;

  const ploygonSize = getPolygonSize();
  const min = ploygonSize / Math.min(...Object.values(imageSize));
  const max = Math.min(...Object.values(imageSize)) / ploygonSize;
  return { min: Math.max(0.5, min), max: Math.max(2, max) };
}

// TODO Random NFT on every load
function App() {
  // const image_src =
  //   "https://lh3.googleusercontent.com/6gieADFCW9EDIAYHakPkao9vpHs0v3By0E9dJMhM9KN9OQtSrLzD7-8H75b6AXwxU4d2dL5m7ciAuxz1sjL2QeMQ7xz6orupcpQQ_f0=s0";
  const image_src = photoSrc;
  const [imageSize, setImage] = React.useState(null);

  useEffect(() => {
    getImageSize(image_src).then(setImage);

    // TODO refactor to default gesture preventer
    const handler = (e) => e.preventDefault();
    document.addEventListener("gesturestart", handler);
    document.addEventListener("gesturechange", handler);
    document.addEventListener("gestureend", handler);
    return () => {
      document.removeEventListener("gesturestart", handler);
      document.removeEventListener("gesturechange", handler);
      document.removeEventListener("gestureend", handler);
    };
  }, []);

  // const [{ x, y }, api] = useSpring(() => ({ x: 0, y: 0 }));

  // document.addEventListener('gesturestart', (e) => e.preventDefault())
  // document.addEventListener('gesturechange', (e) => e.preventDefault())

  // Set the drag hook and define component movement based on gesture data
  // const bind = useDrag(({ down, movement: [mx, my] }) => {
  //   api.start({ x: down ? mx : 0, y: down ? my : 0, immediate: down });
  // });

  // const bind = usePinch(state => {
  //   const {
  //     da,            // [d,a] absolute distance and angle of the two pointers
  //     origin,        // coordinates of the center between the two touch event
  //     offset,        // [scale, angle] offsets (starts withs scale=1)
  //   } = state
  // })

  const ref = React.useRef(null);
  const [style, api] = useSpring(() => ({
    x: 0,
    y: 0,
    scale: 1,
    rotateZ: 0,
  }));

  const options = {
    from: getPosition(style),
    // const [{ x }, api] = useSpring(() => ({ x: 0 }))
    // const bind = useDrag(
    //   ({ down, offset: [ox] }) => api.start({ x: down ? ox : 0, immediate: down, config: { duration: 3000 } }),
    //   { from: () => [x.get(), 0] }
    // )
    bounds: getBounds(() => imageSize, style.scale),
    rubberband: true, // для реалистичности
    filterTaps: true,
  };

  useGesture(
    {
      onDrag: function pan({ pinching, cancel, event, offset: [x, y] }) {
        if (pinching) return cancel();

        event.preventDefault();
        api.start({ x, y });
      },
      onPinch: function pinch({
        origin: [ox, oy],
        first,
        movement: [ms],
        offset: [s, a],
        memo,
      }) {
        if (first) {
          const { width, height, x, y } = ref.current.getBoundingClientRect();
          const tx = ox - (x + width / 2);
          const ty = oy - (y + height / 2);
          memo = [style.x.get(), style.y.get(), tx, ty];
        }

        let x = memo[0] - (ms - 1) * memo[2];
        let y = memo[1] - (ms - 1) * memo[3];

        // IN bound on scale and rotate
        const bounds = getBounds(() => imageSize, { get: () => s })();
        if (!isNaN(bounds.left)) {
          x = clamp(x, bounds.left, bounds.right);
          y = clamp(y, bounds.top, bounds.bottom);
        }

        api.start({ scale: s, x, y });

        return memo;
      },
    },
    {
      target: ref,
      drag: options,
      pinch: { scaleBounds: getScaleBounds(imageSize), rubberband: true },
    }
  );

  const animatedStyles = Object.assign(style, {
    backgroundImage: `url(${image_src})`,
    width: imageSize?.width || 0,
    height: imageSize?.height || 0,
  });

  // Bind it to a component
  return (
    <div className="App container">
      {/* touch-action: none */}
      <animated.div
        ref={ref}
        // src={photoSrc}
        // draggable={false}
        style={animatedStyles}
        className="photo"
      />
      <div className="photo_overlay" />
      <div className="mini">
        <div className="minipreview">
          <Preview
            x={style.x}
            y={style.y}
            scale={style.scale}
            imageSize={imageSize}
            image_src={image_src}
            resizeTo={45}
            key="mini"
          />
        </div>
        <div className="profile">
          <div className="name">Маргарита Пшеничнова</div>
          <small>пример миниатюры</small>
        </div>
      </div>
      <div className="preview">
        <Preview
          x={style.x}
          y={style.y}
          scale={style.scale}
          imageSize={imageSize}
          image_src={image_src}
          key="preview"
          resizeTo={null}
        />
      </div>
    </div>
  );
}

let photoImage;
const Preview = animated(
  ({ x, y, image_src, imageSize, scale, key, resizeTo = null }) => {
    const _size = resizeTo || getPolygonSize();

    const bounds = getBounds(() => imageSize, { get: () => scale })();
    const isRubber =
      x < bounds.left ||
      x > bounds.right ||
      y < bounds.top ||
      y > bounds.bottom;
    const size = getPolygonSize();
    const setup = (p5, canvasParentRef) => {
      console.log("SETUP P5JS RENDERER CANVAS!!!!");
      // use parent to render the canvas in this ref
      // (without that p5 will render the canvas outside of your component)
      p5.createCanvas(_size, _size).parent(canvasParentRef);
    };

    const preload = (p5) => {
      photoImage = p5.loadImage(image_src);
    };

    const draw = (p5) => {
      const stroke = 0;

      // only on rubberband effect
      if (isRubber) {
        p5.clear();
      }

      p5.drawingContext.save();
      // draw mask
      p5.strokeWeight(stroke);
      p5.stroke("white");
      p5.fill(p5.color("rgba(255, 255, 255, 0)"));
      const half = _size / 2;
      if (resizeTo) {
        polygon(half, half + 1, half - 1, 7, 3, 3, p5.PI / 2.8);
      } else {
        polygon(half, half, half * 0.95, 7, 20, 5, p5.PI / 2.8);
      }
      p5.drawingContext.clip();
      // draw photo
      const pos = {
        x: -(imageSize.width * scale - size) / 2 + x,
        y: -(imageSize.height * scale - size) / 2 + y,
      };
      if (resizeTo) {
        const factor = resizeTo / size;
        // console.log(x, factor, x * factor);
        p5.image(
          photoImage,
          -(imageSize.width * scale * factor - resizeTo) / 2 + x * factor,
          -(imageSize.height * scale * factor - resizeTo) / 2 + y * factor,
          imageSize.width * scale * factor,
          imageSize.height * scale * factor
        );
      } else {
        p5.image(
          photoImage,
          pos.x,
          pos.y,
          imageSize.width * scale,
          imageSize.height * scale
        );
      }
      p5.drawingContext.restore();

      p5.strokeWeight(resizeTo ? 1 : 3);
      p5.stroke("white");
      if (resizeTo) {
        polygon(half, half + 1, half - 1, 7, 3, 3, p5.PI / 2.8);
      } else {
        polygon(half, half, half * 0.95, 7, 20, 5, p5.PI / 2.8);
      }

      /** A primitive function for rounded polygonal shape
       * Polygon is circumscribed in a circle of radius 'size'
       * Round corners radius is speci
       * similar to circle(x,y,s) with an extra parameters
       * @param x - x center of polygon
       * @param y - y center of polygon
       * @param size - size of polygon (radius of circumscribed circle)
       * @param sides - number of polygon sides
       * @param radius - radius of rounded corners
       * @param res - angular resolution of each corner in points (default 5)
       * @param rot - global rotation applied to shape (default 0)
       * @author Gilles Gonon - http://gilles.gonon.free.fr
       * @license GPL
       */
      function polygon(x, y, size, sides = 3, radius = 0, res = 5, rot = 0) {
        // Polygon is drawned inside a circle
        // Angle of 1 corner of polygon
        let apoly = (sides > 2 ? (sides - 2) * p5.PI : p5.TWO_PI) / sides;
        // Radius angle
        let aradius = sides > 2 ? p5.PI - apoly : p5.PI;
        // distance between vertex and radius center
        let r = 2 * radius * p5.sin(p5.HALF_PI - 0.5 * apoly);
        p5.push();
        // debug log
        // console.log('Polygon : sides '+sides+', apoly:'+degrees(apoly).toPrecision(4)+', aradius:'+degrees(aradius).toPrecision(4)+',distance from vertex for radius:'+rproj.toPrecision(4))

        // Start drawing
        p5.push();
        p5.translate(x, y);
        p5.rotate(rot);
        p5.beginShape();
        for (let a = 0; a < sides; a++) {
          // Rotation for polygon vertex
          let rot = (a * p5.TWO_PI) / sides;
          if (radius) {
            // Vertex coordinates
            let cx = (size - r) * p5.cos(rot);
            let cy = (size - r) * p5.sin(rot);
            for (let i = 0; i < res; i++) {
              let rotrad = rot + (i * aradius) / (res - 1) - 0.5 * aradius;
              let px = radius * p5.cos(rotrad);
              let py = radius * p5.sin(rotrad);
              p5.vertex(cx + px, cy + py);
              // circle(cx + px, cy + py, 0.15*i+2)
            }
            // circle(cx, cy, 0.15*a+2)
          } else {
            let dx = size * p5.cos(rot);
            let dy = size * p5.sin(rot);
            p5.vertex(dx, dy);
            // circle(dx,dy, 0.15*a+2);
          }
        }
        p5.endShape(p5.CLOSE);
        p5.pop();
      }
    };

    return <Sketch key={key} preload={preload} setup={setup} draw={draw} />;
  }
);

function setMiniPreviewScale(size) {
  return {
    transform: `scale(${size / getPolygonSize()})`,
  };
}

// function getPreviewPosition({ x, y }) {
//   const width = window.innerWidth * 0.675;
//   const height = window.innerHeight * 0.675;

//   console.log({
//     backgroundPositionX: x.get() - width / 2,
//     backgroundPositionY: y.get() - height / 2,
//   });

//   return {
//     backgroundPositionX: x.get(),
//     backgroundPositionY: y.get(),
//   };
// }

const map = (value, x1, y1, x2, y2) =>
  ((value - x1) * (y2 - x2)) / (y1 - x1) + x2;

function renderPreview({ x, y }) {
  // 100 - 0
  // -100 - 100
  return {
    backgroundPositionX: `${map(x, 100, -100, 0, 100)}%`,
    backgroundPositionY: `${map(y, 100, -100, 0, 100)}%`,
  };
}

function getImageSize(src) {
  return new Promise((res, rej) => {
    var img = new Image();

    img.onload = function resolve() {
      var height = img.height;
      var width = img.width;

      // TODO scale to window size
      res({ width, height });
    };

    img.onerror = function reject() {
      rej(null);
    };

    img.src = src;
  });
}

export default App;
