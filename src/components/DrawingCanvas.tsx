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
  isResizeMode?: boolean;
  onResizeModeChange?: (isResizeMode: boolean) => void;
}

export default function DrawingCanvas({ onDrawingChange, availableColors = [], overlayImageUrl, onClearCanvas, permanentTemplate = false, templateImageUrl, drawingData, isResizeMode = false, onResizeModeChange }: DrawingCanvasProps) {
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const userDrawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const userDrawingCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const resizeCanvasRef = useRef<HTMLCanvasElement>(null);
  const resizeCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const templateImageRef = useRef<HTMLImageElement | null>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });

  // Resize mode state
  const [templateTransform, setTemplateTransform] = useState({ scale: 1.0, positionX: 0, positionY: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, scale: 1.0 });
  const [showInstructions, setShowInstructions] = useState(true);
  
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

  // Available line thickness options
  const thicknessOptions = [
    { name: 'Thin', value: 1 },
    { name: 'Medium', value: 3 },
    { name: 'Thick', value: 6 },
    { name: 'Extra Thick', value: 10 },
    { name: 'Bold', value: 15 }
  ];

  // Resize constraints
  const MIN_SCALE = 0.4;
  const MAX_SCALE = 2.0;
  const RESIZE_HANDLE_SIZE = 20;

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
    const resizeCanvas = resizeCanvasRef.current;

    if (!overlayCanvas || !userDrawingCanvas || !resizeCanvas) return;

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

    // Initialize resize canvas
    const resizeCtx = resizeCanvas.getContext('2d');
    if (resizeCtx) {
      resizeCtxRef.current = resizeCtx;
      resizeCanvas.width = overlayCanvas.width;
      resizeCanvas.height = overlayCanvas.height;
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

  // Render overlay function with transform support
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
      try {
        const img = templateImageRef.current || new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          templateImageRef.current = img;

          // Save context state
          overlayCtx.save();

          // Account for padding
          const padding = 16;
          const effectiveCanvasWidth = overlayCanvas.width - (padding * 2);
          const effectiveCanvasHeight = overlayCanvas.height - (padding * 2);

          // Calculate base scale to fit image
          const scaleX = effectiveCanvasWidth / img.width;
          const scaleY = effectiveCanvasHeight / img.height;
          const baseScale = Math.min(scaleX, scaleY);

          // Apply user's scale transform
          const finalScale = baseScale * templateTransform.scale;

          const drawWidth = img.width * finalScale;
          const drawHeight = img.height * finalScale;

          // Calculate center position
          const centerX = overlayCanvas.width / 2;
          const centerY = overlayCanvas.height / 2;

          // Apply user's position offset
          const offsetX = centerX - drawWidth / 2 + templateTransform.positionX;
          const offsetY = centerY - drawHeight / 2 + templateTransform.positionY;

          // For permanent templates, use full opacity, otherwise use transparency
          overlayCtx.globalAlpha = permanentTemplate ? 1.0 : 0.3;
          overlayCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
          overlayCtx.globalAlpha = 1.0;

          // Restore context state
          overlayCtx.restore();
        };

        img.onerror = (error) => {
          console.error('Failed to load overlay image:', imageUrl, error);
          overlayCtx.fillStyle = '#ff0000';
          overlayCtx.font = '16px Arial';
          overlayCtx.fillText('Failed to load template image', 20, 40);
        };

        if (!templateImageRef.current) {
          img.src = imageUrl;
        }
      } catch (error) {
        console.error('Error loading overlay image:', error);
      }
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

  // Render resize canvas overlay
  const renderResizeCanvas = useCallback(() => {
    const resizeCanvas = resizeCanvasRef.current;
    const resizeCtx = resizeCtxRef.current;
    const overlayCanvas = overlayCanvasRef.current;

    if (!resizeCanvas || !resizeCtx || !overlayCanvas || !templateImageRef.current) {
      return;
    }

    const img = templateImageRef.current;

    // Clear resize canvas
    resizeCtx.clearRect(0, 0, resizeCanvas.width, resizeCanvas.height);

    // Calculate template bounds
    const padding = 16;
    const effectiveCanvasWidth = overlayCanvas.width - (padding * 2);
    const effectiveCanvasHeight = overlayCanvas.height - (padding * 2);

    const scaleX = effectiveCanvasWidth / img.width;
    const scaleY = effectiveCanvasHeight / img.height;
    const baseScale = Math.min(scaleX, scaleY);

    const finalScale = baseScale * templateTransform.scale;
    const drawWidth = img.width * finalScale;
    const drawHeight = img.height * finalScale;

    const centerX = overlayCanvas.width / 2;
    const centerY = overlayCanvas.height / 2;

    const boxX = centerX - drawWidth / 2 + templateTransform.positionX;
    const boxY = centerY - drawHeight / 2 + templateTransform.positionY;

    // Draw bounding box
    resizeCtx.strokeStyle = '#3b82f6';
    resizeCtx.lineWidth = 3;
    resizeCtx.setLineDash([8, 4]);
    resizeCtx.strokeRect(boxX, boxY, drawWidth, drawHeight);
    resizeCtx.setLineDash([]);

    // Draw resize handle at bottom-right corner
    const handleX = boxX + drawWidth - RESIZE_HANDLE_SIZE / 2;
    const handleY = boxY + drawHeight - RESIZE_HANDLE_SIZE / 2;

    resizeCtx.fillStyle = '#3b82f6';
    resizeCtx.fillRect(handleX, handleY, RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE);

    resizeCtx.strokeStyle = '#ffffff';
    resizeCtx.lineWidth = 2;
    resizeCtx.strokeRect(handleX, handleY, RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE);

    // Draw resize icon in handle
    resizeCtx.strokeStyle = '#ffffff';
    resizeCtx.lineWidth = 2;
    resizeCtx.beginPath();
    resizeCtx.moveTo(handleX + 5, handleY + RESIZE_HANDLE_SIZE - 5);
    resizeCtx.lineTo(handleX + RESIZE_HANDLE_SIZE - 5, handleY + 5);
    resizeCtx.stroke();
  }, [templateTransform, RESIZE_HANDLE_SIZE]);

  // Update resize canvas when in resize mode
  useEffect(() => {
    if (isResizeMode && templateImageRef.current) {
      renderResizeCanvas();
    }
  }, [isResizeMode, templateTransform, renderResizeCanvas]);

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

  // Get template bounds
  const getTemplateBounds = useCallback(() => {
    const overlayCanvas = overlayCanvasRef.current;
    const img = templateImageRef.current;

    if (!overlayCanvas || !img) {
      return null;
    }

    const padding = 16;
    const effectiveCanvasWidth = overlayCanvas.width - (padding * 2);
    const effectiveCanvasHeight = overlayCanvas.height - (padding * 2);

    const scaleX = effectiveCanvasWidth / img.width;
    const scaleY = effectiveCanvasHeight / img.height;
    const baseScale = Math.min(scaleX, scaleY);

    const finalScale = baseScale * templateTransform.scale;
    const drawWidth = img.width * finalScale;
    const drawHeight = img.height * finalScale;

    const centerX = overlayCanvas.width / 2;
    const centerY = overlayCanvas.height / 2;

    const boxX = centerX - drawWidth / 2 + templateTransform.positionX;
    const boxY = centerY - drawHeight / 2 + templateTransform.positionY;

    return { x: boxX, y: boxY, width: drawWidth, height: drawHeight };
  }, [templateTransform]);

  // Check if point is in resize handle
  const isInResizeHandle = useCallback((x: number, y: number) => {
    const bounds = getTemplateBounds();
    if (!bounds) return false;

    const handleX = bounds.x + bounds.width - RESIZE_HANDLE_SIZE / 2;
    const handleY = bounds.y + bounds.height - RESIZE_HANDLE_SIZE / 2;

    return x >= handleX && x <= handleX + RESIZE_HANDLE_SIZE &&
           y >= handleY && y <= handleY + RESIZE_HANDLE_SIZE;
  }, [getTemplateBounds, RESIZE_HANDLE_SIZE]);

  // Check if point is in bounding box
  const isInBoundingBox = useCallback((x: number, y: number) => {
    const bounds = getTemplateBounds();
    if (!bounds) return false;

    return x >= bounds.x && x <= bounds.x + bounds.width &&
           y >= bounds.y && y <= bounds.y + bounds.height;
  }, [getTemplateBounds]);

  // Handle resize mode interactions
  const handleResizeMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isResizeMode) return;

    e.preventDefault();
    const position = getCanvasPosition(e);

    if (isInResizeHandle(position.x, position.y)) {
      setIsResizing(true);
      setResizeStart({ x: position.x, y: position.y, scale: templateTransform.scale });
      setShowInstructions(false);
    } else if (isInBoundingBox(position.x, position.y)) {
      setIsDragging(true);
      setDragStart({ x: position.x - templateTransform.positionX, y: position.y - templateTransform.positionY });
      setShowInstructions(false);
    }
  }, [isResizeMode, templateTransform, isInResizeHandle, isInBoundingBox, getCanvasPosition]);

  const handleResizeMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isResizeMode) return;

    e.preventDefault();
    const position = getCanvasPosition(e);

    if (isResizing) {
      const bounds = getTemplateBounds();
      if (!bounds) return;

      const centerX = bounds.x + bounds.width / 2;
      const centerY = bounds.y + bounds.height / 2;

      const startDist = Math.sqrt(
        Math.pow(resizeStart.x - centerX, 2) + Math.pow(resizeStart.y - centerY, 2)
      );
      const currentDist = Math.sqrt(
        Math.pow(position.x - centerX, 2) + Math.pow(position.y - centerY, 2)
      );

      const scaleDelta = currentDist / startDist;
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, resizeStart.scale * scaleDelta));

      setTemplateTransform(prev => ({ ...prev, scale: newScale }));
    } else if (isDragging) {
      const newX = position.x - dragStart.x;
      const newY = position.y - dragStart.y;

      const overlayCanvas = overlayCanvasRef.current;
      if (!overlayCanvas) return;

      const bounds = getTemplateBounds();
      if (!bounds) return;

      const maxX = overlayCanvas.width / 2;
      const maxY = overlayCanvas.height / 2;
      const minX = -overlayCanvas.width / 2;
      const minY = -overlayCanvas.height / 2;

      const clampedX = Math.max(minX, Math.min(maxX, newX));
      const clampedY = Math.max(minY, Math.min(maxY, newY));

      setTemplateTransform(prev => ({ ...prev, positionX: clampedX, positionY: clampedY }));
    }
  }, [isResizeMode, isResizing, isDragging, resizeStart, dragStart, getTemplateBounds, getCanvasPosition, MIN_SCALE, MAX_SCALE]);

  const handleResizeMouseUp = useCallback(() => {
    setIsResizing(false);
    setIsDragging(false);
  }, []);

  // Auto-hide instructions after 3 seconds
  useEffect(() => {
    if (isResizeMode && showInstructions) {
      const timer = setTimeout(() => {
        setShowInstructions(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isResizeMode, showInstructions]);

  // Show instructions when entering resize mode
  useEffect(() => {
    if (isResizeMode) {
      setShowInstructions(true);
    }
  }, [isResizeMode]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isResizeMode) return;

    e.preventDefault();
    setIsPaletteExpanded(false);
    setIsDrawing(true);
    const position = getCanvasPosition(e);
    setLastPosition(position);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isResizeMode) return;

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
          className={`absolute inset-0 w-full h-full touch-none ${isResizeMode ? 'pointer-events-none' : 'cursor-crosshair'}`}
          style={{ zIndex: 2 }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {/* Resize Canvas (for bounding box and resize handle) */}
        {isResizeMode && (
          <canvas
            ref={resizeCanvasRef}
            className="absolute inset-0 w-full h-full cursor-move touch-none"
            style={{ zIndex: 3 }}
            onMouseDown={handleResizeMouseDown}
            onMouseMove={handleResizeMouseMove}
            onMouseUp={handleResizeMouseUp}
            onMouseLeave={handleResizeMouseUp}
            onTouchStart={handleResizeMouseDown}
            onTouchMove={handleResizeMouseMove}
            onTouchEnd={handleResizeMouseUp}
          />
        )}

        {/* Instructions overlay for resize mode */}
        {isResizeMode && showInstructions && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium" style={{ zIndex: 4 }}>
            Drag box to move, use corner handle to resize
          </div>
        )}

        {/* Mode indicator overlay */}
        {isResizeMode && (
          <div className="absolute inset-0 bg-blue-50 bg-opacity-10 pointer-events-none rounded-lg" style={{ zIndex: 0 }} />
        )}
        
        {/* Combined Drawing Controls */}
        {!isResizeMode && (
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
        )}

        {/* Clear Canvas button */}
        {!isResizeMode && (
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
        )}
    </div>
  );
}