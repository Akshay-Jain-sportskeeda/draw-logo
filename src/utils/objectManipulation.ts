import { DrawableObject, Point, TransformHandles, HandleType } from '@/types/drawableObject';

export function generateObjectId(): string {
  return `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getObjectBounds(obj: DrawableObject): { x: number; y: number; width: number; height: number } {
  return {
    x: obj.x,
    y: obj.y,
    width: obj.width,
    height: obj.height,
  };
}

export function isPointInObject(point: Point, obj: DrawableObject): boolean {
  const bounds = getObjectBounds(obj);
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

export function getTransformHandles(obj: DrawableObject, canvasHeight: number = 400): TransformHandles {
  const { x, y, width, height } = obj;
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const handleOffset = 30;

  const rotationAbove = y - handleOffset;
  const rotationBelow = y + height + handleOffset;
  const useBottomPosition = rotationAbove < 0 || (rotationBelow <= canvasHeight && y < handleOffset * 2);

  return {
    topLeft: { x, y },
    topRight: { x: x + width, y },
    bottomLeft: { x, y: y + height },
    bottomRight: { x: x + width, y: y + height },
    top: { x: centerX, y },
    right: { x: x + width, y: centerY },
    bottom: { x: centerX, y: y + height },
    left: { x, y: centerY },
    rotation: { x: centerX, y: useBottomPosition ? rotationBelow : rotationAbove },
  };
}

export function getHandleAtPoint(point: Point, obj: DrawableObject, handleSize: number = 12, canvasHeight: number = 400): HandleType {
  const handles = getTransformHandles(obj, canvasHeight);
  const strokeWidth = 2;
  const shadowOffset = 2;
  const touchTolerance = 8;
  const hitRadius = (handleSize / 2) + strokeWidth + shadowOffset + touchTolerance;

  const handleEntries: [HandleType, Point][] = [
    ['rotation', handles.rotation],
    ['topLeft', handles.topLeft],
  ];

  for (const [type, handlePoint] of handleEntries) {
    const distance = Math.sqrt(
      Math.pow(point.x - handlePoint.x, 2) + Math.pow(point.y - handlePoint.y, 2)
    );

    if (distance <= hitRadius) {
      console.log('Handle detected:', type, 'at distance:', distance, 'from point:', point, 'handle pos:', handlePoint);
      return type as HandleType;
    }
  }

  return null;
}

export function rotateObject(
  obj: DrawableObject,
  currentPoint: Point,
  centerPoint: Point
): DrawableObject {
  const angle = Math.atan2(currentPoint.y - centerPoint.y, currentPoint.x - centerPoint.x);
  const rotation = (angle * 180) / Math.PI + 90;
  return { ...obj, rotation };
}

export function resizeObject(
  obj: DrawableObject,
  handle: HandleType,
  newPoint: Point,
  maintainAspect: boolean = false
): DrawableObject {
  console.log('resizeObject called with handle:', handle, 'newPoint:', newPoint, 'maintainAspect:', maintainAspect);
  if (!handle) return obj;
  if (handle === 'rotation') return obj;

  let { x, y, width, height } = obj;
  const originalAspect = width / height;
  console.log('Original object:', { x, y, width, height });

  switch (handle) {
    case 'topLeft':
      const deltaXTL = newPoint.x - x;
      const deltaYTL = newPoint.y - y;
      if (maintainAspect) {
        const avgDelta = (deltaXTL + deltaYTL) / 2;
        x += avgDelta;
        y += avgDelta;
        width -= avgDelta;
        height -= avgDelta;
      } else {
        x = newPoint.x;
        y = newPoint.y;
        width -= deltaXTL;
        height -= deltaYTL;
      }
      break;

    case 'topRight':
      const deltaYTR = newPoint.y - y;
      if (maintainAspect) {
        const newWidth = newPoint.x - x;
        const newHeight = newWidth / originalAspect;
        y += height - newHeight;
        width = newWidth;
        height = newHeight;
      } else {
        y = newPoint.y;
        width = newPoint.x - x;
        height -= deltaYTR;
      }
      break;

    case 'bottomLeft':
      const deltaXBL = newPoint.x - x;
      if (maintainAspect) {
        const newHeight = newPoint.y - y;
        const newWidth = newHeight * originalAspect;
        x += width - newWidth;
        width = newWidth;
        height = newHeight;
      } else {
        x = newPoint.x;
        width -= deltaXBL;
        height = newPoint.y - y;
      }
      break;

    case 'bottomRight':
      if (maintainAspect) {
        const newWidth = newPoint.x - x;
        const newHeight = newWidth / originalAspect;
        width = newWidth;
        height = newHeight;
      } else {
        width = newPoint.x - x;
        height = newPoint.y - y;
      }
      break;

    case 'top':
      const deltaYT = newPoint.y - y;
      y = newPoint.y;
      height -= deltaYT;
      break;

    case 'bottom':
      height = newPoint.y - y;
      break;

    case 'left':
      const deltaXL = newPoint.x - x;
      x = newPoint.x;
      width -= deltaXL;
      break;

    case 'right':
      width = newPoint.x - x;
      break;
  }

  if (width < 10) width = 10;
  if (height < 10) height = 10;

  return { ...obj, x, y, width, height };
}

export function moveObject(obj: DrawableObject, deltaX: number, deltaY: number): DrawableObject {
  return {
    ...obj,
    x: obj.x + deltaX,
    y: obj.y + deltaY,
  };
}

export function drawObject(ctx: CanvasRenderingContext2D, obj: DrawableObject): void {
  if (!obj.visible) return;

  ctx.save();

  const centerX = obj.x + obj.width / 2;
  const centerY = obj.y + obj.height / 2;

  if (obj.rotation !== 0) {
    ctx.translate(centerX, centerY);
    ctx.rotate((obj.rotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);
  }

  ctx.strokeStyle = obj.color;
  ctx.fillStyle = obj.color;
  ctx.lineWidth = obj.thickness;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (obj.type) {
    case 'rectangle':
      ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
      break;

    case 'circle':
      const radius = Math.min(obj.width, obj.height) / 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();
      break;

    case 'ellipse':
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, obj.width / 2, obj.height / 2, 0, 0, 2 * Math.PI);
      ctx.stroke();
      break;

    case 'line':
      ctx.beginPath();
      ctx.moveTo(obj.x, obj.y);
      ctx.lineTo(obj.x + obj.width, obj.y + obj.height);
      ctx.stroke();
      break;

    case 'freehand':
      if (obj.points && obj.points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(obj.points[0].x + obj.x, obj.points[0].y + obj.y);
        for (let i = 1; i < obj.points.length; i++) {
          ctx.lineTo(obj.points[i].x + obj.x, obj.points[i].y + obj.y);
        }
        ctx.stroke();
      }
      break;

    case 'image':
      if (obj.imageData) {
        const img = new Image();
        img.src = obj.imageData;
        ctx.drawImage(img, obj.x, obj.y, obj.width, obj.height);
      }
      break;
  }

  ctx.restore();
}

export function drawSelectionBorder(ctx: CanvasRenderingContext2D, obj: DrawableObject): void {
  ctx.save();
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
  ctx.setLineDash([]);
  ctx.restore();
}

export function drawTransformHandles(ctx: CanvasRenderingContext2D, obj: DrawableObject, canvasHeight: number = 400): void {
  const handles = getTransformHandles(obj, canvasHeight);
  const handleSize = 14;

  ctx.save();

  Object.entries(handles).forEach(([key, point]) => {
    if (key === 'rotation') {
      ctx.fillStyle = '#2563eb';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 1;

      ctx.beginPath();
      ctx.arc(point.x, point.y, handleSize / 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.beginPath();
      const isBelow = point.y > obj.y + obj.height;
      const connectPoint = isBelow ? handles.bottom : handles.top;
      ctx.moveTo(connectPoint.x, connectPoint.y);
      ctx.lineTo(point.x, point.y);
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (key === 'topLeft') {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 1;
      ctx.fillStyle = '#2563eb';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;

      ctx.fillRect(point.x - handleSize / 2, point.y - handleSize / 2, handleSize, handleSize);
      ctx.strokeRect(point.x - handleSize / 2, point.y - handleSize / 2, handleSize, handleSize);
    }
  });

  ctx.restore();
}
