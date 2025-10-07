'use client';

import React, { useRef, useEffect, useState } from 'react';

interface DrawingCanvasProps {
  onDrawingChange: (dataUrl: string) => void;
  availableColors?: string[];
  overlayImageUrl?: string | null;
  onClearCanvas?: () => void;
  permanentTemplate?: boolean;
  templateImageUrl?: string;
  drawingData?: string;
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

  // Initialize both canvases once on mount
  useEffect(() => {
    const overlayCanvas = overlayCanvasRef.current;
    const userDrawingCanvas = userDrawingCanvasRef.current;

    if (!overlayCanvas || !userDrawingCanvas) return;

    // Initialize overlay canvas
    const overlayCtx = overlayCanvas.getContext('2d');
    if (overlayCtx) {
      overlayCtxRef.current = overlayCtx;
      // Set canvas size based on current display size
      const rect = overlayCanvas.getBoundingClientRect();

      // Ensure we have valid dimensions
      const width = rect.width > 0 ? rect.width : 400;
      const height = rect.height > 0 ? rect.height : 400;

      overlayCanvas.width = width;
      overlayCanvas.height = height;

      console.log('Overlay canvas initialized:', { width, height });

      // Fill with white background
      overlayCtx.fillStyle = '#ffffff';
      overlayCtx.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    }

    // Initialize user drawing canvas
    const userDrawingCtx = userDrawingCanvas.getContext('2d');
    if (userDrawingCtx) {
      userDrawingCtxRef.current = userDrawingCtx;
      // Set canvas size to match overlay canvas
      userDrawingCanvas.width = overlayCanvas.width;
      userDrawingCanvas.height = overlayCanvas.height;

      console.log('User drawing canvas initialized:', { width: userDrawingCanvas.width, height: userDrawingCanvas.height });

      // Set drawing styles
      userDrawingCtx.lineWidth = 3;
      userDrawingCtx.lineCap = 'round';
      userDrawingCtx.lineJoin = 'round';
      userDrawingCtx.strokeStyle = internalSelectedColor;

      // Clear to transparent (no background fill for drawing layer)
      userDrawingCtx.clearRect(0, 0, userDrawingCanvas.width, userDrawingCanvas.height);

      // Restore drawing data if it exists
      if (drawingData && drawingData !== '') {
        const img = new Image();
        img.onload = () => {
          userDrawingCtx.clearRect(0, 0, userDrawingCanvas.width, userDrawingCanvas.height);
          userDrawingCtx.drawImage(img, 0, 0);
        };
        img.src = drawingData;
      } else {
        // Initialize with empty drawing
        const initialDataUrl = userDrawingCanvas.toDataURL('image/png');
        onDrawingChange(initialDataUrl);
      }
    }
  }, [drawingData, internalSelectedColor, onDrawingChange]);

  // Render overlay function
  const renderOverlay = async (imageUrl: string | null) => {
    const overlayCanvas = overlayCanvasRef.current;
    const overlayCtx = overlayCtxRef.current;

    console.log('renderOverlay called:', {
      imageUrl,
      hasCanvas: !!overlayCanvas,
      hasCtx: !!overlayCtx,
      canvasWidth: overlayCanvas?.width,
      canvasHeight: overlayCanvas?.height
    });

    if (!overlayCanvas || !overlayCtx) {
      console.warn('Canvas or context not available for rendering overlay');
      return;
    }

    // Ensure canvas has valid dimensions
    if (overlayCanvas.width === 0 || overlayCanvas.height === 0) {
      console.warn('Canvas has zero dimensions, cannot render overlay');
      return;
    }

    // Clear and fill with white background
    overlayCtx.fillStyle = '#ffffff';
    overlayCtx.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    if (imageUrl) {
      try {
        console.log('Loading template image from:', imageUrl);
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          console.log('Template image loaded successfully:', {
            imageWidth: img.width,
            imageHeight: img.height,
            canvasWidth: overlayCanvas.width,
            canvasHeight: overlayCanvas.height
          });

          // Account for padding to match logo container (p-4 = 16px padding)
          const padding = 16;
          const effectiveCanvasWidth = overlayCanvas.width - (padding * 2);
          const effectiveCanvasHeight = overlayCanvas.height - (padding * 2);

          // Calculate scale to fit entire image within effective area (object-contain behavior)
          const scaleX = effectiveCanvasWidth / img.width;
          const scaleY = effectiveCanvasHeight / img.height;
          const scale = Math.min(scaleX, scaleY);

          const drawWidth = img.width * scale;
          const drawHeight = img.height * scale;
          const offsetX = padding + (effectiveCanvasWidth - drawWidth) / 2;
          const offsetY = padding + (effectiveCanvasHeight - drawHeight) / 2;

          console.log('Drawing template at:', { offsetX, offsetY, drawWidth, drawHeight, scale });

          // For permanent templates, use full opacity, otherwise use transparency
          overlayCtx.globalAlpha = permanentTemplate ? 1.0 : 0.3;
          overlayCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
          overlayCtx.globalAlpha = 1.0;

          console.log('Template image rendered successfully with opacity:', permanentTemplate ? 1.0 : 0.3);
        };

        img.onerror = (error) => {
          console.error('Failed to load overlay image:', imageUrl, error);
          // Draw error message on canvas
          overlayCtx.fillStyle = '#ff0000';
          overlayCtx.font = '16px Arial';
          overlayCtx.fillText('Failed to load template image', 20, 40);
        };

        img.src = imageUrl;
      } catch (error) {
        console.error('Error loading overlay image:', error);
      }
    } else {
      console.log('No image URL provided, showing white background only');
    }
  };

  // Handle overlay image changes or permanent template
  useEffect(() => {
    console.log('Overlay useEffect triggered:', {
      permanentTemplate,
      templateImageUrl,
      overlayImageUrl,
      hasOverlayCanvas: !!overlayCanvasRef.current,
      hasOverlayCtx: !!overlayCtxRef.current
    });

    // Wait a tick to ensure canvas is fully initialized
    const timeoutId = setTimeout(() => {
      if (permanentTemplate && templateImageUrl) {
        console.log('Rendering permanent template:', templateImageUrl);
        renderOverlay(templateImageUrl);
      } else if (overlayImageUrl) {
        console.log('Rendering overlay image:', overlayImageUrl);
        renderOverlay(overlayImageUrl);
      } else {
        console.log('Rendering empty overlay (white background)');
        renderOverlay(null);
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [overlayImageUrl, permanentTemplate, templateImageUrl]);

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
      // Touch event
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      // Mouse event
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    // Close the palette when starting to draw
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

    // Emit only the user's drawing data
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
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
          style={{ zIndex: 2 }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        
        {/* Combined Drawing Controls */}
        <div className="absolute bottom-4 left-4">
          {/* Main pencil icon button */}
          <button
            onClick={() => setIsPaletteExpanded(!isPaletteExpanded)}
            className="w-10 h-10 rounded-full border-2 border-gray-800 bg-white shadow-lg hover:scale-110 transition-all duration-200 z-10 relative flex items-center justify-center"
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
        
        {/* Clear Canvas button */}
        <div className="absolute bottom-4 right-4">
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
    </div>
  );
}