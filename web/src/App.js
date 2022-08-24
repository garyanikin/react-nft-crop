import logo from "./logo.svg";
import "./App.css";

import React, { useEffect } from "react";
import photoSrc from "./photo.jpg";
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

function getPosition() {
  // current position
  return [0, 0];
}

function getBounds() {
  // based on scale
  return { left: -100, right: 100, top: -50, bottom: 50 };
}

function getScaleBounds() {
  // based on image size and max avatar size
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

  const options = {
    from: getPosition(),
    // const [{ x }, api] = useSpring(() => ({ x: 0 }))
    // const bind = useDrag(
    //   ({ down, offset: [ox] }) => api.start({ x: down ? ox : 0, immediate: down, config: { duration: 3000 } }),
    //   { from: () => [x.get(), 0] }
    // )
    bounds: getBounds(),
    scaleBounds: getScaleBounds(),
    rubberband: true, // для реалистичности
    filterTaps: true,
    preventScroll: true,
  };

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
  const [{ x, y }, api] = useSpring(() => ({ x: 0, y: 0 }));
  useGesture(
    {
      onDrag: ({ event, offset: [x, y] }) => {
        event.preventDefault();
        api.start({ x, y });
      },
      onPinch: () => {},
    },
    {
      target: ref,
      drag: options,
    }
  );

  // Bind it to a component
  return (
    <div className="App">
      {/* touch-action: none */}
      <animated.img
        ref={ref}
        src={photoSrc}
        draggable={false}
        style={{ x, y }}
        className="photo"
      />
    </div>
  );
}

export default App;
