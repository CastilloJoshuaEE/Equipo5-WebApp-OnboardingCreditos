// frontend/src/shared/types/global.d.ts
import React from "react";

declare global {
  namespace JSX {
    type Element = React.ReactElement;
    type ElementClass = React.Component;
    interface IntrinsicElements {
      [elemName: string]: unknown;
    }
  }
}

export {};