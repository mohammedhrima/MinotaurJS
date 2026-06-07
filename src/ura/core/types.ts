import { Type } from "./utils.js";

export type Tag = string | Function;
export type Props = { [key: string]: any };

export type Frame = {
  func: Function;
  states: any[];
  index: number;
  props?: Props;
  children?: any;
  rendered?: VDOM[];
  node?: VDOM;
  parentDom?: any;
};

export type VDOM = {
  type: Type;
  tag?: Tag;
  props?: Props | any;
  value?: string | number;
  dom?: any;
  key?: string | number;
  children?: any;
  call?: Function;
  comp?: Frame;
};

declare global {
  namespace JSX {
    type Element = any;
    interface IntrinsicElements {
      [name: string]: any;
    }
    interface ElementChildrenAttribute {
      children: {};
    }
  }
}
