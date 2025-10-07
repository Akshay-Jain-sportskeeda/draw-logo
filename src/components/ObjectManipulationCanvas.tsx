'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DrawableObject, DrawableObjectType, Point, HandleType } from '@/types/drawableObject';
import {
  generateObjectId,
  isPointInObject,
  getHandleAtPoint,
  resizeObject,
  moveObject,
  drawObject,
  drawSelectionBorder,
  drawTransformHandles,
} from '@/utils/objectManipulation';

interface ObjectManipulationCanvasProps {
  onDrawingChange: (dataUrl: string) => void;
  availableColors?: string[];
  templateImageUrl?: string;
}

type Tool = DrawableObjectType | 'select';

export default function ObjectManipulationCanvas({
  onDrawingChange,
  availableColors = [],
  templateImageUrl,
}: ObjectManipulationCanvasProps) {
  const templateCanvasRef = useRef<HTMLCanvasElement>(null);
  const objectCanvasRef = useRef<HTMLCanvasElement>(null);
  const compositeCanvasRef = useRef<HTMLCanvasElement>(null);

  const [objects, setObjects] = useState<DrawableObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [currentTool, setCurrentTool] = useState<Tool>('select');
  const [selectedColor, setSelectedColor] = useState(availableColors[0] || '#000000');
  const [lineThickness, setLineThickness] = useState(3);

  const [isDrawing, setIsDrawing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStartPoint, setDragStartPoint] = useState<Point | null>(null);
  const [resizeHandle, setResizeHandle] = useState<HandleType>(null);
  const [tempPoints, setTempPoints] = useState<Point[]>([]);
  const [tempObject, setTempObject] = useState<DrawableObject | null>(null);

  const isInitializedRef = useRef(false);

  const defaultColors = [
    '#000000',
    '#ffffff',
    '#dc2626',
    '#ea580c',
    '#f59e0b',
    '#16a34a',
    '#0284c7',
    '#4f46e5',
    '#9333ea',
    '#ec4899',
  ];

  const colors = availableColors.length > 0 ? availableColors : defaultColors;

  const thicknessOptions = [
    { name: 'Thin', value: 1 },
    { name: 'Medium', value: 3 },
    { name: 'Thick', value: 6 },
    { name: 'Extra Thick', value: 10 },
  ];

  useEffect(() => {
    if (isInitializedRef.current) return;

    const templateCanvas = templateCanvasRef.current;
    const objectCanvas = objectCanvasRef.current;
    const compositeCanvas = compositeCanvasRef.current;

    if (!templateCanvas || !objectCanvas || !compositeCanvas) return;

    const width = 400;
    const height = 400;

    templateCanvas.width = width;
    templateCanvas.height = height;
    objectCanvas.width = width;
    objectCanvas.height = height;
    compositeCanvas.width = width;
    compositeCanvas.height = height;

    const templateCtx = templateCanvas.getContext('2d');
    if (templateCtx) {
      templateCtx.fillStyle = '#ffffff';
      templateCtx.fillRect(0, 0, width, height);
    }

    isInitializedRef.current = true;
  }, []);

  useEffect(() => {
    if (!isInitializedRef.current || !templateImageUrl) return;

    const templateCanvas = templateCanvasRef.current;
    const templateCtx = templateCanvas?.getContext('2d');

    if (!templateCanvas || !templateCtx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      templateCtx.fillStyle = '#ffffff';
      templateCtx.fillRect(0, 0, templateCanvas.width, templateCanvas.height);

      const padding = 16;
      const effectiveWidth = templateCanvas.width - padding * 2;
      const effectiveHeight = templateCanvas.height - padding * 2;

      const scale = Math.min(effectiveWidth / img.width, effectiveHeight / img.height);
      const drawWidth = img.width * scale;
      const drawHeight = img.height * scale;

      const offsetX = (templateCanvas.width - drawWidth) / 2;
      const offsetY = (templateCanvas.height - drawHeight) / 2;

      templateCtx.globalAlpha = 0.4;
      templateCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      templateCtx.globalAlpha = 1.0;

      renderComposite();
    };

    img.src = templateImageUrl;
  }, [templateImageUrl]);

  const renderObjects = useCallback(() => {
    const objectCanvas = objectCanvasRef.current;
    const ctx = objectCanvas?.getContext('2d');

    if (!objectCanvas || !ctx) return;

    ctx.clearRect(0, 0, objectCanvas.width, objectCanvas.height);

    objects.forEach((obj) => {
      drawObject(ctx, obj);
    });

    if (tempObject) {
      drawObject(ctx, tempObject);
    }

    const selectedObject = objects.find((obj) => obj.id === selectedObjectId);
    if (selectedObject) {
      drawSelectionBorder(ctx, selectedObject);
      drawTransformHandles(ctx, selectedObject);
    }
  }, [objects, selectedObjectId, tempObject]);

  const renderComposite = useCallback(() => {
    const templateCanvas = templateCanvasRef.current;
    const objectCanvas = objectCanvasRef.current;
    const compositeCanvas = compositeCanvasRef.current;
    const ctx = compositeCanvas?.getContext('2d');

    if (!templateCanvas || !objectCanvas || !compositeCanvas || !ctx) return;

    ctx.clearRect(0, 0, compositeCanvas.width, compositeCanvas.height);
    ctx.drawImage(templateCanvas, 0, 0);
    ctx.drawImage(objectCanvas, 0, 0);

    const dataUrl = compositeCanvas.toDataURL('image/png');
    onDrawingChange(dataUrl);
  }, [onDrawingChange]);

  useEffect(() => {
    renderObjects();
    renderComposite();
  }, [objects, selectedObjectId, tempObject, renderObjects, renderComposite]);

  const getCanvasPosition = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point => {
    const canvas = objectCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const point = getCanvasPosition(e);

    if (currentTool === 'select') {
      const selectedObject = objects.find((obj) => obj.id === selectedObjectId);

      if (selectedObject) {
        const handle = getHandleAtPoint(point, selectedObject);
        if (handle) {
          setIsResizing(true);
          setResizeHandle(handle);
          setDragStartPoint(point);
          return;
        }
      }

      const clickedObject = [...objects].reverse().find((obj) => isPointInObject(point, obj));

      if (clickedObject) {
        setSelectedObjectId(clickedObject.id);
        setIsDragging(true);
        setDragStartPoint(point);
      } else {
        setSelectedObjectId(null);
      }
    } else if (currentTool === 'freehand') {
      setIsDrawing(true);
      setTempPoints([point]);
    } else {
      setIsDrawing(true);
      setDragStartPoint(point);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const point = getCanvasPosition(e);

    if (isResizing && resizeHandle && dragStartPoint) {
      const selectedObject = objects.find((obj) => obj.id === selectedObjectId);
      if (selectedObject) {
        const maintainAspect = e.shiftKey || ('touches' in e && e.touches.length > 1);
        const resized = resizeObject(selectedObject, resizeHandle, point, maintainAspect);
        setObjects(objects.map((obj) => (obj.id === selectedObjectId ? resized : obj)));
      }
    } else if (isDragging && dragStartPoint && selectedObjectId) {
      const deltaX = point.x - dragStartPoint.x;
      const deltaY = point.y - dragStartPoint.y;

      setObjects(
        objects.map((obj) => (obj.id === selectedObjectId ? moveObject(obj, deltaX, deltaY) : obj))
      );
      setDragStartPoint(point);
    } else if (isDrawing && dragStartPoint) {
      if (currentTool === 'freehand') {
        setTempPoints([...tempPoints, point]);
        const minX = Math.min(...tempPoints.map((p) => p.x));
        const minY = Math.min(...tempPoints.map((p) => p.y));
        const maxX = Math.max(...tempPoints.map((p) => p.x));
        const maxY = Math.max(...tempPoints.map((p) => p.y));

        const normalizedPoints = tempPoints.map((p) => ({
          x: p.x - minX,
          y: p.y - minY,
        }));

        setTempObject({
          id: 'temp',
          type: 'freehand',
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
          rotation: 0,
          color: selectedColor,
          thickness: lineThickness,
          locked: false,
          visible: true,
          points: normalizedPoints,
        });
      } else {
        const x = Math.min(dragStartPoint.x, point.x);
        const y = Math.min(dragStartPoint.y, point.y);
        const width = Math.abs(point.x - dragStartPoint.x);
        const height = Math.abs(point.y - dragStartPoint.y);

        setTempObject({
          id: 'temp',
          type: currentTool as DrawableObjectType,
          x,
          y,
          width: Math.max(width, 1),
          height: Math.max(height, 1),
          rotation: 0,
          color: selectedColor,
          thickness: lineThickness,
          locked: false,
          visible: true,
        });
      }
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && tempObject) {
      const newObject = { ...tempObject, id: generateObjectId() };
      setObjects([...objects, newObject]);
      setTempObject(null);
      setTempPoints([]);
    }

    setIsDrawing(false);
    setIsDragging(false);
    setIsResizing(false);
    setDragStartPoint(null);
    setResizeHandle(null);
  };

  const handleDeleteSelected = () => {
    if (selectedObjectId) {
      setObjects(objects.filter((obj) => obj.id !== selectedObjectId));
      setSelectedObjectId(null);
    }
  };

  const handleClear = () => {
    setObjects([]);
    setSelectedObjectId(null);
    setTempObject(null);
  };

  return (
    <div className="relative w-full max-w-[400px] h-[400px] mx-auto">
      <canvas ref={templateCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }} />
      <canvas
        ref={objectCanvasRef}
        className="absolute inset-0 w-full h-full border-2 border-gray-300 rounded-lg touch-none cursor-crosshair"
        style={{ zIndex: 2 }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      />
      <canvas ref={compositeCanvasRef} className="hidden" />

      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 p-2" style={{ zIndex: 10 }}>
        <div className="flex flex-col gap-2">
          <div className="text-xs font-semibold text-gray-600 mb-1">Tools</div>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => setCurrentTool('select')}
              className={`p-2 rounded transition-colors ${
                currentTool === 'select' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              title="Select"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentTool('freehand')}
              className={`p-2 rounded transition-colors ${
                currentTool === 'freehand' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              title="Freehand"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentTool('rectangle')}
              className={`p-2 rounded transition-colors ${
                currentTool === 'rectangle' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              title="Rectangle"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentTool('circle')}
              className={`p-2 rounded transition-colors ${
                currentTool === 'circle' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              title="Circle"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentTool('ellipse')}
              className={`p-2 rounded transition-colors ${
                currentTool === 'ellipse' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              title="Ellipse"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <ellipse cx="12" cy="12" rx="10" ry="6" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentTool('line')}
              className={`p-2 rounded transition-colors ${
                currentTool === 'line' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              title="Line"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="19" x2="19" y2="5" />
              </svg>
            </button>
          </div>

          <div className="border-t border-gray-200 pt-2 mt-1">
            <div className="text-xs font-semibold text-gray-600 mb-1">Color</div>
            <div className="grid grid-cols-5 gap-1">
              {colors.slice(0, 10).map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    selectedColor === color ? 'border-blue-500 scale-110' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-2 mt-1">
            <div className="text-xs font-semibold text-gray-600 mb-1">Thickness</div>
            <div className="grid grid-cols-4 gap-1">
              {thicknessOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setLineThickness(option.value)}
                  className={`p-1 rounded text-xs transition-colors ${
                    lineThickness === option.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  title={option.name}
                >
                  {option.value}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 flex gap-2" style={{ zIndex: 10 }}>
        {selectedObjectId && (
          <button
            onClick={handleDeleteSelected}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            Delete
          </button>
        )}
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
        >
          Clear All
        </button>
      </div>
    </div>
  );
}
