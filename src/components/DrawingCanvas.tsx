'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

interface DrawingCanvasProps {
  onDrawingChange: (dataUrl: string) => void;
  availableColors?: string[];
  overlayImageUrl?: string | null;
  onClearCanvas?: () => void;
  permanentTemplate?: boolean;
  templateImageUrl?: string;
  drawingData?: string;
}

interface TemplateTransform {
  x: number;
  y: number;
  scale: number;
  width: number;
  height: number;
}

export default function DrawingCanvas({ onDrawingChange, availableColors = [], overlayImageUrl, onClearCanvas, permanentTemplate = false, templateImageUrl, drawingData }: DrawingCanvasProps) {
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const userDrawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const userDrawingCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });

  // Helper function to get a non-white default color
  const getDefaultColor = (colors: string[]): string => {
    // Find the first non-white color
    const nonWhiteColor = colors.find(color =>
      color.toLowerCase() !== '#ffffff' &&
      color.toLowerCase() !== '#fff' &&
      color.toLowerCase() !== 'white'
    );

    // Return the first non-white color, or black if none found
    return nonWhiteColor || '#000000';
  };

  const [internalSelectedColor, setInternalSelectedColor] = useState(getDefaultColor(availableColors));
  const [isPaletteExpanded, setIsPaletteExpanded] = useState(false);
  const [lineThickness, setLineThickness] = useState(3);
  const [isErasing, setIsErasing] = useState(false);
  const isInitializedRef = useRef(false);

  const [isResizeMode, setIsResizeMode] = useState(false);
  const [templateTransform, setTemplateTransform] = useState<TemplateTransform>({
    x: 0,
    y: 0,
    scale: 1,
    width: 0,
    height: 0
  });
  const [isDraggingTemplate, setIsDraggingTemplate] = useState(false);
  const [isResizingTemplate, setIsResizingTemplate] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [dragStartTransform, setDragStartTransform] = useState<TemplateTransform | null>(null);
  const templateImageRef = useRef<HTMLImageElement | null>(null);

  // Available line thickness options
  const thicknessOptions = [
    { name: 'Thin', value: 1 },
    { name: 'Medium', value: 3 },
    { name: 'Thick', value: 6 },
    { name: 'Extra Thick', value: 10 },
    { name: 'Bold', value: 15 }
  ];

  // Update selected color when available colors change
  useEffect(() => {
    if (availableColors.length > 0 && !availableColors.includes(internalSelectedColor)) {
      setInternalSelectedColor(getDefaultColor(availableColors));
    }
  }, [availableColors, internalSelectedColor]);

  // Convert hex colors to color options with names
  const colorOptions = availableColors.map((color, index) => ({
    name: `Color ${index + 1}`,
    value: color
  }));

  // Initialize all canvases once on mount
  useEffect(() => {
    if (isInitializedRef.current) return;

    const overlayCanvas = overlayCanvasRef.current;
    const userDrawingCanvas = userDrawingCanvasRef.current;

    if (!overlayCanvas || !userDrawingCanvas) return;

    // Initialize overlay canvas
    const overlayCtx = overlayCanvas.getContext('2d');
    if (overlayCtx) {
      overlayCtxRef.current = overlayCtx;
      const rect = overlayCanvas.getBoundingClientRect();

      const width = rect.width > 0 ? rect.width : 400;
      const height = rect.height > 0 ? rect.height : 400;

      overlayCanvas.width = width;
      overlayCanvas.height = height;

      overlayCtx.fillStyle = '#ffffff';
      overlayCtx.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    }

    // Initialize user drawing canvas
    const userDrawingCtx = userDrawingCanvas.getContext('2d');
    if (userDrawingCtx) {
      userDrawingCtxRef.current = userDrawingCtx;
      userDrawingCanvas.width = overlayCanvas.width;
      userDrawingCanvas.height = overlayCanvas.height;

      userDrawingCtx.lineWidth = 3;
      userDrawingCtx.lineCap = 'round';
      userDrawingCtx.lineJoin = 'round';
      userDrawingCtx.strokeStyle = internalSelectedColor;

      userDrawingCtx.clearRect(0, 0, userDrawingCanvas.width, userDrawingCanvas.height);

      isInitializedRef.current = true;

      const initialDataUrl = userDrawingCanvas.toDataURL('image/png');
      onDrawingChange(initialDataUrl);
    }
  }, [onDrawingChange, internalSelectedColor]);

  // Separate effect for restoring drawing data
  useEffect(() => {
    if (!isInitializedRef.current) return;
    if (!drawingData || drawingData === '') return;

    const userDrawingCanvas = userDrawingCanvasRef.current;
    const userDrawingCtx = userDrawingCtxRef.current;

    if (!userDrawingCanvas || !userDrawingCtx) return;

    const img = new Image();
    img.onload = () => {
      userDrawingCtx.clearRect(0, 0, userDrawingCanvas.width, userDrawingCanvas.height);
      userDrawingCtx.drawImage(img, 0, 0);
    };
    img.src = drawingData;
  }, [drawingData]);

  // Render overlay function
  const renderOverlay = useCallback((imageUrl: string | null) => {
    const overlayCanvas = overlayCanvasRef.current;
    const overlayCtx = overlayCtxRef.current;

    if (!overlayCanvas || !overlayCtx) {
      return;
    }

    if (overlayCanvas.width === 0 || overlayCanvas.height === 0) {
      return;
    }

    // Clear and fill with white background
    overlayCtx.fillStyle = '#ffffff';
    overlayCtx.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    if (imageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        templateImageRef.current = img;

        if (permanentTemplate && templateTransform.scale > 0) {
          const drawWidth = templateTransform.width;
          const drawHeight = templateTransform.height;
          const offsetX = templateTransform.x;
          const offsetY = templateTransform.y;

          overlayCtx.globalAlpha = 1.0;
          overlayCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        } else {
          const padding = 16;
          const effectiveCanvasWidth = overlayCanvas.width - (padding * 2);
          const effectiveCanvasHeight = overlayCanvas.height - (padding * 2);

          const scaleX = effectiveCanvasWidth / img.width;
          const scaleY = effectiveCanvasHeight / img.height;
          const scale = Math.min(scaleX, scaleY);

          const drawWidth = img.width * scale;
          const drawHeight = img.height * scale;

          const centerX = overlayCanvas.width / 2;
          const centerY = overlayCanvas.height / 2;

          const offsetX = centerX - drawWidth / 2;
          const offsetY = centerY - drawHeight / 2;

          if (permanentTemplate && templateTransform.width === 0) {
            setTemplateTransform({
              x: offsetX,
              y: offsetY,
              scale: 1,
              width: drawWidth,
              height: drawHeight
            });
          }

          overlayCtx.globalAlpha = permanentTemplate ? 1.0 : 0.3;
          overlayCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
          overlayCtx.globalAlpha = 1.0;
        }
      };

      img.onerror = (error) => {
        console.error('Failed to load overlay image:', imageUrl, error);
      };

      img.src = imageUrl;
    }
  }, [permanentTemplate, templateTransform]);

  // Handle overlay image changes or permanent template
  useEffect(() => {
    if (!isInitializedRef.current) {
      return;
    }

    const overlayCanvas = overlayCanvasRef.current;
    const overlayCtx = overlayCtxRef.current;

    if (!overlayCanvas || !overlayCtx || overlayCanvas.width === 0 || overlayCanvas.height === 0) {
      const timeoutId = setTimeout(() => {
        if (permanentTemplate && templateImageUrl) {
          renderOverlay(templateImageUrl);
        } else if (overlayImageUrl) {
          renderOverlay(overlayImageUrl);
        } else {
          renderOverlay(null);
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }

    if (permanentTemplate && templateImageUrl) {
      renderOverlay(templateImageUrl);
    } else if (overlayImageUrl) {
      renderOverlay(overlayImageUrl);
    } else {
      renderOverlay(null);
    }
  }, [overlayImageUrl, permanentTemplate, templateImageUrl, renderOverlay]);

  // Update stroke color when color changes
  useEffect(() => {
    const ctx = userDrawingCtxRef.current;
    if (ctx) {
      if (isErasing) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = '#000000'; // Color doesn't matter when erasing
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = internalSelectedColor;
      }
    }
  }, [internalSelectedColor, isErasing]);

  // Update line thickness when thickness changes
  useEffect(() => {
    const ctx = userDrawingCtxRef.current;
    if (ctx) {
      ctx.lineWidth = lineThickness;
    }
  }, [lineThickness]);

  const getCanvasPosition = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = userDrawingCanvasRef.current;
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

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isResizeMode) return;
    e.preventDefault();
    setIsPaletteExpanded(false);
    setIsDrawing(true);
    const position = getCanvasPosition(e);
    setLastPosition(position);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = userDrawingCanvasRef.current;
    const ctx = userDrawingCtxRef.current;
    if (!canvas || !ctx) return;

    const currentPosition = getCanvasPosition(e);

    ctx.beginPath();
    if (isErasing) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = '#000000';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = internalSelectedColor;
    }
    ctx.lineWidth = lineThickness;
    ctx.moveTo(lastPosition.x, lastPosition.y);
    ctx.lineTo(currentPosition.x, currentPosition.y);
    ctx.stroke();

    setLastPosition(currentPosition);

    const dataUrl = canvas.toDataURL('image/png');
    onDrawingChange(dataUrl);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = userDrawingCanvasRef.current;
    const ctx = userDrawingCtxRef.current;
    if (!canvas || !ctx) return;

    // Clear only the user drawing layer
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Emit empty drawing
    const dataUrl = canvas.toDataURL('image/png');
    onDrawingChange(dataUrl);
  };

  const handleColorSelect = (color: string) => {
    setInternalSelectedColor(color);
    setIsErasing(false);
    setIsPaletteExpanded(false);
  };

  const handleEraserSelect = () => {
    setIsErasing(true);
    setIsPaletteExpanded(false);
  };

  const handleThicknessSelect = (thickness: number) => {
    setLineThickness(thickness);
    setIsPaletteExpanded(false);
  };

  const isPointInTemplate = (x: number, y: number): boolean => {
    if (!templateTransform.width || !templateTransform.height) return false;
    return (
      x >= templateTransform.x &&
      x <= templateTransform.x + templateTransform.width &&
      y >= templateTransform.y &&
      y <= templateTransform.y + templateTransform.height
    );
  };

  const isPointInResizeHandle = (x: number, y: number): boolean => {
    if (!templateTransform.width || !templateTransform.height) return false;
    const handleX = templateTransform.x + templateTransform.width;
    const handleY = templateTransform.y + templateTransform.height;
    const handleSize = 12;
    return (
      x >= handleX - handleSize &&
      x <= handleX + handleSize &&
      y >= handleY - handleSize &&
      y <= handleY + handleSize
    );
  };

  const handleTemplateInteractionStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isResizeMode) return;
    e.preventDefault();

    const position = getCanvasPosition(e);

    if (isPointInResizeHandle(position.x, position.y)) {
      setIsResizingTemplate(true);
      setDragStartPos(position);
      setDragStartTransform({ ...templateTransform });
    } else if (isPointInTemplate(position.x, position.y)) {
      setIsDraggingTemplate(true);
      setDragStartPos(position);
      setDragStartTransform({ ...templateTransform });
    }
  };

  const handleTemplateInteractionMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isResizeMode || (!isDraggingTemplate && !isResizingTemplate)) return;
    e.preventDefault();

    const canvas = overlayCanvasRef.current;
    if (!canvas || !dragStartTransform) return;

    const position = getCanvasPosition(e);
    const deltaX = position.x - dragStartPos.x;
    const deltaY = position.y - dragStartPos.y;

    if (isResizingTemplate) {
      const diagonal = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const direction = (deltaX + deltaY) > 0 ? 1 : -1;
      const scaleChange = (diagonal * direction) / 200;
      let newScale = Math.max(0.2, dragStartTransform.scale + scaleChange);

      const newWidth = (dragStartTransform.width / dragStartTransform.scale) * newScale;
      const newHeight = (dragStartTransform.height / dragStartTransform.scale) * newScale;

      if (dragStartTransform.x + newWidth > canvas.width) {
        newScale = (canvas.width - dragStartTransform.x) / (dragStartTransform.width / dragStartTransform.scale);
      }
      if (dragStartTransform.y + newHeight > canvas.height) {
        newScale = Math.min(newScale, (canvas.height - dragStartTransform.y) / (dragStartTransform.height / dragStartTransform.scale));
      }

      setTemplateTransform({
        ...dragStartTransform,
        scale: newScale,
        width: (dragStartTransform.width / dragStartTransform.scale) * newScale,
        height: (dragStartTransform.height / dragStartTransform.scale) * newScale
      });
    } else if (isDraggingTemplate) {
      let newX = dragStartTransform.x + deltaX;
      let newY = dragStartTransform.y + deltaY;

      newX = Math.max(0, Math.min(newX, canvas.width - dragStartTransform.width));
      newY = Math.max(0, Math.min(newY, canvas.height - dragStartTransform.height));

      setTemplateTransform({
        ...dragStartTransform,
        x: newX,
        y: newY
      });
    }
  };

  const handleTemplateInteractionEnd = () => {
    setIsDraggingTemplate(false);
    setIsResizingTemplate(false);
    setDragStartTransform(null);
  };

  return (
    <div className="relative w-full max-w-[400px] h-[300px] sm:h-[400px] mx-auto">
        {/* Background/Overlay Canvas */}
        <canvas
          ref={overlayCanvasRef}
          className="absolute inset-0 w-full h-full border-2 border-gray-300 rounded-lg pointer-events-none"
          style={{ zIndex: 1 }}
        />

        {/* User Drawing Canvas (transparent, on top) */}
        <canvas
          ref={userDrawingCanvasRef}
          className={`absolute inset-0 w-full h-full touch-none ${isResizeMode ? 'cursor-move' : 'cursor-crosshair'}`}
          style={{ zIndex: 2 }}
          onMouseDown={(e) => {
            if (isResizeMode) {
              handleTemplateInteractionStart(e);
            } else {
              startDrawing(e);
            }
          }}
          onMouseMove={(e) => {
            if (isResizeMode) {
              handleTemplateInteractionMove(e);
            } else {
              draw(e);
            }
          }}
          onMouseUp={() => {
            if (isResizeMode) {
              handleTemplateInteractionEnd();
            } else {
              stopDrawing();
            }
          }}
          onMouseLeave={() => {
            if (isResizeMode) {
              handleTemplateInteractionEnd();
            } else {
              stopDrawing();
            }
          }}
          onTouchStart={(e) => {
            if (isResizeMode) {
              handleTemplateInteractionStart(e);
            } else {
              startDrawing(e);
            }
          }}
          onTouchMove={(e) => {
            if (isResizeMode) {
              handleTemplateInteractionMove(e);
            } else {
              draw(e);
            }
          }}
          onTouchEnd={() => {
            if (isResizeMode) {
              handleTemplateInteractionEnd();
            } else {
              stopDrawing();
            }
          }}
        />

        {/* Combined Drawing Controls */}
        <div className="absolute bottom-4 left-4" style={{ zIndex: 10 }}>
          {/* Main pencil icon button */}
          <button
            onClick={() => setIsPaletteExpanded(!isPaletteExpanded)}
            className="w-10 h-10 rounded-full border-2 border-gray-800 bg-white shadow-lg hover:scale-110 transition-all duration-200 relative flex items-center justify-center"
            title="Drawing Tools"
          >
          {/* Pencil icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
            <path d="M15 5l4 4"/>
          </svg>
          {/* Color indicator */}
          <div
            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border border-gray-600"
            style={{ backgroundColor: internalSelectedColor }}
          />
        </button>

        {/* Expanded controls */}
        {isPaletteExpanded && (
          <div className="absolute bottom-12 left-0 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
            {/* Colors section */}
            <div className="mb-3">
              <h4 className="text-xs font-medium text-gray-600 mb-2">Colors</h4>
              <div className="flex flex-wrap gap-1 max-w-[120px]">
                {colorOptions.map((color, index) => (
                  <button
                    key={color.value}
                    onClick={() => handleColorSelect(color.value)}
                    className={`w-6 h-6 rounded-full border transition-all duration-200 hover:scale-110 ${
                      internalSelectedColor === color.value && !isErasing
                        ? 'border-2 border-gray-800'
                        : 'border border-gray-400 hover:border-gray-600'
                    } ${color.value === '#FFFFFF' ? 'border-gray-400' : ''}`}
                    style={{
                      backgroundColor: color.value,
                      animationDelay: `${index * 30}ms`
                    }}
                    title={color.name}
                  />
                ))}

                {/* Eraser button */}
                <button
                  onClick={handleEraserSelect}
                  className={`w-6 h-6 rounded-full border transition-all duration-200 hover:scale-110 flex items-center justify-center ${
                    isErasing
                      ? 'border-2 border-gray-800 bg-gray-100'
                      : 'border border-gray-400 hover:border-gray-600 bg-white'
                  }`}
                  title="Eraser"
                >
                  {/* Eraser icon */}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/>
                    <path d="M22 21H7"/>
                    <path d="m5 11 9 9"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Thickness section */}
            <div>
              <h4 className="text-xs font-medium text-gray-600 mb-2">Thickness</h4>
              <div className="flex flex-wrap gap-1 max-w-[120px]">
                {thicknessOptions.map((thickness, index) => (
                  <button
                    key={thickness.value}
                    onClick={() => handleThicknessSelect(thickness.value)}
                    className={`w-6 h-6 rounded-full border bg-white transition-all duration-200 hover:scale-110 flex items-center justify-center ${
                      lineThickness === thickness.value
                        ? 'border-2 border-gray-800'
                        : 'border border-gray-400 hover:border-gray-600'
                    }`}
                    style={{
                      animationDelay: `${index * 30}ms`
                    }}
                    title={thickness.name}
                  >
                    <div
                      className="bg-gray-800 rounded-full"
                      style={{
                        width: `${Math.min(thickness.value * 1.2 + 2, 16)}px`,
                        height: `${Math.min(thickness.value * 1.2 + 2, 16)}px`
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Resize/Done button (only for permanent template) */}
        {permanentTemplate && (
          <div className="absolute top-4 right-4" style={{ zIndex: 10 }}>
            <button
              onClick={() => setIsResizeMode(!isResizeMode)}
              className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                isResizeMode
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isResizeMode ? 'Done' : 'Resize'}
            </button>
          </div>
        )}

        {/* Clear Canvas button */}
        <div className="absolute bottom-4 right-4" style={{ zIndex: 10 }}>
          <button
            onClick={() => {
              clearCanvas();
              onClearCanvas?.();
            }}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            Clear
          </button>
        </div>

        {/* Template resize overlay - only shown in resize mode */}
        {isResizeMode && permanentTemplate && templateTransform.width > 0 && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${(templateTransform.x / (overlayCanvasRef.current?.width || 1)) * 100}%`,
              top: `${(templateTransform.y / (overlayCanvasRef.current?.height || 1)) * 100}%`,
              width: `${(templateTransform.width / (overlayCanvasRef.current?.width || 1)) * 100}%`,
              height: `${(templateTransform.height / (overlayCanvasRef.current?.height || 1)) * 100}%`,
              zIndex: 5,
              border: '2px dashed #3b82f6',
              boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.1)',
            }}
          >
            {/* Resize handle at bottom-right corner */}
            <div
              className="absolute pointer-events-auto cursor-nwse-resize"
              style={{
                right: '-6px',
                bottom: '-6px',
                width: '12px',
                height: '12px',
                backgroundColor: '#3b82f6',
                border: '2px solid white',
                borderRadius: '50%',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            />
          </div>
        )}
    </div>
  );
}
