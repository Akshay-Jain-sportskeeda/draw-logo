export type DrawableObjectType = 'freehand' | 'rectangle' | 'circle' | 'ellipse' | 'line' | 'image';

export interface Point {
  x: number;
  y: number;
}

export interface DrawableObject {
  id: string;
  type: DrawableObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  thickness: number;
  locked: boolean;
  visible: boolean;
  points?: Point[];
  imageData?: string;
}

export interface TransformHandles {
  topLeft: Point;
  topRight: Point;
  bottomLeft: Point;
  bottomRight: Point;
  top: Point;
  right: Point;
  bottom: Point;
  left: Point;
  rotation: Point;
}

export type HandleType =
  | 'topLeft'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomRight'
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'rotation'
  | null;
