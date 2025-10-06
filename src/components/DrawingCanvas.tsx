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

export default function DrawingCanvas({ onDrawingChange, availableColors = [], overlayImageUrl, onClearCanvas, permanentTemplate = false, templateImageUrl, drawingData }: DrawingCanvasProps) {
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const userDrawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const userDrawingCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const [isOverlayReady, setIsOverlayReady] = useState(false);
  
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

  // Function to get combined drawing data URL (template + user drawing)
  const getCombinedDrawingDataUrl = useCallback(() => {
    const overlayCanvas = overlayCanvasRef.current;
    const userDrawingCanvas = userDrawingCanvasRef.current;
    
    // If not permanent template or overlay not ready, just return user drawing
    if (!permanentTemplate || !isOverlayReady || !overlayCanvas || !userDrawingCanvas) {
      return userDrawingCanvas?.toDataURL('image/png') || '';
    }
    
    // Create temporary canvas for combining
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = overlayCanvas.width;
    tempCanvas.height = overlayCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) {
      return userDrawingCanvas.toDataURL('image/png');
    }
    
    // Draw template first (background)
    tempCtx.drawImage(overlayCanvas, 0, 0);
    
    // Draw user drawing on top
    tempCtx.drawImage(userDrawingCanvas, 0, 0);
    
    return tempCanvas.toDataURL('image/png');
  }, [permanentTemplate, isOverlayReady]);

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
      overlayCanvas.width = rect.width;
      overlayCanvas.height = rect.height;
      
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
      
      // Set drawing styles
      userDrawingCtx.lineWidth = 3;
      userDrawingCtx.lineCap = 'round';
      userDrawingCtx.lineJoin = 'round';
      userDrawingCtx.strokeStyle = internalSelectedColor;
      
      // Clear to transparent (no background fill for drawing layer)
      userDrawingCtx.clearRect(0, 0, userDrawingCanvas.width, userDrawingCanvas.height);
      
      // Restore drawing data if it exists
      if (drawingData && drawingData !== '') {
        console.log('Restoring drawing data');
        const img = new Image();
        img.onload = () => {
          userDrawingCtx.clearRect(0, 0, userDrawingCanvas.width, userDrawingCanvas.height);
          userDrawingCtx.drawImage(img, 0, 0);
          
          // Wait for overlay to be ready before emitting
          setTimeout(() => {
            if (permanentTemplate && isOverlayReady) {
              const combinedDataUrl = getCombinedDrawingDataUrl();
              onDrawingChange(combinedDataUrl);
            } else {
              const dataUrl = userDrawingCanvas.toDataURL('image/png');
              onDrawingChange(dataUrl);
            }
          }, 100);
        };
        img.src = drawingData;
      } else {
        console.log('No drawing data to restore');
        // Initial data will be emitted when overlay becomes ready
      }
    }
  }, [internalSelectedColor, drawingData, permanentTemplate, isOverlayReady, getCombinedDrawingDataUrl, onDrawingChange]);

  // Render overlay function
  const renderOverlay = async (imageUrl: string | null) => {
    const overlayCanvas = overlayCanvasRef.current;
    const overlayCtx = overlayCtxRef.current;
    if (!overlayCanvas || !overlayCtx) return;

    // Clear and fill with white background
    overlayCtx.fillStyle = '#ffffff';
    overlayCtx.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    if (imageUrl) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
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

          // For permanent templates, use full opacity, otherwise use transparency
          overlayCtx.globalAlpha = permanentTemplate ? 1.0 : 0.3;
          overlayCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
          overlayCtx.globalAlpha = 1.0;
          
          // Mark overlay as ready
          setIsOverlayReady(true);
          
          // Emit initial combined data for permanent templates
          if (permanentTemplate) {
            const combinedDataUrl = getCombinedDrawingDataUrl();
            onDrawingChange(combinedDataUrl);
          }
        };
        img.onerror = () => {
          console.error('Failed to load overlay image:', imageUrl);
          setIsOverlayReady(true); // Still mark as ready even if image fails
        };
        img.src = imageUrl;
      } catch (error) {
        console.error('Error loading overlay image:', error);
        setIsOverlayReady(true); // Still mark as ready even if error occurs
      }
    } else {
      // No image to load, mark as ready
      setIsOverlayReady(true);
    }
  };

  // Handle overlay image changes or permanent template
  useEffect(() => {
    console.log('Overlay effect triggered:', { permanentTemplate, templateImageUrl, overlayImageUrl });
    if (permanentTemplate && templateImageUrl) {
      console.log('Rendering permanent template:', templateImageUrl);
      renderOverlay(templateImageUrl);
    } else {
      console.log('Rendering overlay image:', overlayImageUrl);
      renderOverlay(overlayImageUrl || null);
    }
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
    <>
      <div className="relative w-full max-w-[400px] h-[300px] sm:h-[400px] mx-auto">
        {/* Background/Overlay Canvas */}
        <canvas
          ref={overlayCanvasRef}
          className="w-full h-full border-2 border-gray-300 rounded-lg"
        />
        
        {/* User Drawing Canvas (transparent, on top) */}
        <canvas
          ref={userDrawingCanvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
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
    </>
  );
}