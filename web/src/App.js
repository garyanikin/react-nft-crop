import logo from "./logo.svg";
import "./App.css";

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

function getBounds(scale) {
  // based on scale
  return () => {
    // получить соотношение полигона к изображернию
    const _scale = scale.get();
    const size = 100 * scale.get();
    console.log("size", size, _scale);
    return { left: -size, right: size, top: -size, bottom: size };
  };
}

function getScaleBounds() {
  return { min: 0.5, max: 2 };
}

function App() {
  useEffect(() => {
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
    bounds: getBounds(style.scale),
    scaleBounds: getScaleBounds(),
    rubberband: true, // для реалистичности
    filterTaps: true,
  };

  useGesture(
    {
      onDrag: ({ pinching, cancel, event, offset: [x, y] }) => {
        if (pinching) return cancel();

        event.preventDefault();
        api.start({ x, y });
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

        api.start({ scale: s, rotateZ: a, x, y });
        return memo;
      },
    },
    {
      target: ref,
      drag: options,
      pinch: { scaleBounds: { min: 0.5, max: 2 }, rubberband: true },
    }
  );

  // Bind it to a component
  return (
    <div className="App container">
      {/* touch-action: none */}
      <animated.div
        ref={ref}
        // src={photoSrc}
        // draggable={false}
        style={style}
        className="photo"
      />
      <div className="preview">
        {/* <animated.div style={getPreviewPosition({ x, y })} className="image" /> */}
        {/* <img className="overlay" src={polygonSrc} /> */}
        {/* to DIV */}
        <img src={polygonSrc} />
      </div>
    </div>
  );
}

function getPreviewPosition({ x, y }) {
  const width = window.innerWidth * 0.675;
  const height = window.innerHeight * 0.675;

  console.log(x.to, x.to([0, 1], [0, 100]));

  return {};

  console.log(x, y, width, {
    backgroundPositionX: x - width / 2,
    backgroundPositionY: y - height / 2,
  });

  return {
    backgroundPositionX: x - width / 2,
    backgroundPositionY: y - height / 2,
  };
}

export default App;
