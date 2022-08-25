import logo from "./logo.svg";
import "./App.css";

import { omit, pick } from "lodash";
import React, { useEffect } from "react";
import photoSrc from "./photo.jpg";
import polygonSrc from "./polygon.svg";
import { useSpring, animated } from "@react-spring/web";
// import { useDrag } from "@use-gesture/react";

// TODO use Tree shake
import { createUseGesture, dragAction, pinchAction } from "@use-gesture/react";
const useGesture = createUseGesture([dragAction, pinchAction]);
// const bind = useGesture(
//   {
//     onDrag: (state) => doSomethingWith(state),
//     onDragStart: (state) => doSomethingWith(state),
//     onDragEnd: (state) => doSomethingWith(state),
//     onPinch: (state) => doSomethingWith(state),
//     onPinchStart: (state) => doSomethingWith(state),
//     onPinchEnd: (state) => doSomethingWith(state)
//   },
//   { drag: dragConfig, pinch: pinchConfig }
// )

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
  const size = getComputedStyle(document.documentElement).getPropertyValue(
    "--polygon-size"
  );
  return window.innerWidth * (parseInt(size) / 100);
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
    getImageSize(image_src).then((imageSize) => {
      console.log("image size", imageSize);
      setImage(imageSize);
    });

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
      onDrag: ({ pinching, cancel, event, offset: [x, y] }) => {
        if (pinching) return cancel();

        event.preventDefault();
        api.start({ x, y, ...renderPreview({ x, y }) });
      },
      onPinch: ({
        origin: [ox, oy],
        first,
        movement: [ms],
        offset: [s, a],
        memo,
      }) => {
        if (first) {
          const { width, height, x, y } = ref.current.getBoundingClientRect();
          const tx = ox - (x + width / 2);
          const ty = oy - (y + height / 2);
          memo = [style.x.get(), style.y.get(), tx, ty];
        }

        const x = memo[0] - (ms - 1) * memo[2];
        const y = memo[1] - (ms - 1) * memo[3];

        // IN bound on scale and rotate
        // https://use-gesture.netlify.app/docs/utilities/

        // api.start({ scale: s, rotateZ: a, x, y, ...renderPreview({ x, y }) });
        api.start({ scale: s, x, y, ...renderPreview({ x, y }) });
        return memo;
      },
    },
    {
      target: ref,
      drag: options,
      pinch: { scaleBounds: getScaleBounds(imageSize), rubberband: true },
    }
  );

  const previewStyles = ["backgroundPositionX", "backgroundPositionY"];

  // Bind it to a component
  return (
    <div className="App container">
      {/* touch-action: none */}
      <animated.div
        ref={ref}
        // src={photoSrc}
        // draggable={false}
        style={{
          ...omit(style, previewStyles),
          backgroundImage: `url(${image_src})`,
          width: imageSize?.width || 0,
          height: imageSize?.height || 0,
        }}
        className="photo"
      />
      <div className="photo_overlay" />
      <div className="mini">
        <div className="minipreview">
          <div className="preview" style={setMiniPreviewScale(45)}>
            <div className="image">
              <div className="image-container">
                <animated.div
                  style={{
                    ...omit(style, previewStyles),
                    backgroundImage: `url(${image_src})`,
                    width: imageSize?.width || 0,
                    height: imageSize?.height || 0,
                  }}
                  className="image-content"
                />
              </div>
            </div>
          </div>
          <div className="overlay" />
        </div>
        <div className="profile">
          <div className="name">Маргарита Пшеничнова</div>
          <small>пример миниатюры</small>
        </div>
      </div>
      <div className="preview">
        <div className="image">
          <div className="image-container">
            <animated.div
              style={{
                ...omit(style, previewStyles),
                backgroundImage: `url(${image_src})`,
                width: imageSize?.width || 0,
                height: imageSize?.height || 0,
              }}
              className="image-content"
            />
          </div>
        </div>
        <div className="overlay" />
      </div>
    </div>
  );
}

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

function renderPreview({ x, y }) {
  const map = (value, x1, y1, x2, y2) =>
    ((value - x1) * (y2 - x2)) / (y1 - x1) + x2;
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
