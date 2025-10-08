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
  rotation: number;
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
    height: 0,
    rotation: 0
  });
  const [isDraggingTemplate, setIsDraggingTemplate] = useState(false);
  const [isResizingTemplate, setIsResizingTemplate] = useState(false);
  const [isRotatingTemplate, setIsRotatingTemplate] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [dragStartTransform, setDragStartTransform] = useState<TemplateTransform | null>(null);
  const templateImageRef = useRef<HTMLImageElement | null>(null);
  const templateInitializedRef = useRef(false);
  const currentTransformRef = useRef<TemplateTransform>(templateTransform);
  const canvasDimensionsRef = useRef({ width: 0, height: 0 });
  const [templateInitRetry, setTemplateInitRetry] = useState(0);
  const scrollPositionRef = useRef({ x: 0, y: 0 });
  const documentMouseMoveHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);
  const documentMouseUpHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);

  // Scroll lock utilities
  const lockScroll = useCallback(() => {
    scrollPositionRef.current = {
      x: window.scrollX || window.pageXOffset,
      y: window.scrollY || window.pageYOffset
    };

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPositionRef.current.y}px`;
    document.body.style.left = `-${scrollPositionRef.current.x}px`;
    document.body.style.width = '100%';
    document.body.style.height = '100%';
  }, []);

  const unlockScroll = useCallback(() => {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.width = '';
    document.body.style.height = '';

    window.scrollTo(scrollPositionRef.current.x, scrollPositionRef.current.y);
  }, []);

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

    // Use requestAnimationFrame to ensure DOM layout is complete
    requestAnimationFrame(() => {
      // Initialize overlay canvas
      const overlayCtx = overlayCanvas.getContext('2d');
      if (overlayCtx) {
        overlayCtxRef.current = overlayCtx;
        const rect = overlayCanvas.getBoundingClientRect();

        const width = rect.width > 0 ? rect.width : 400;
        const height = rect.height > 0 ? rect.height : 400;

        console.log('=== Canvas initialization ===', {
          rectWidth: rect.width,
          rectHeight: rect.height,
          finalWidth: width,
          finalHeight: height
        });

        overlayCanvas.width = width;
        overlayCanvas.height = height;
        canvasDimensionsRef.current = { width, height };

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
    });
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

  // Keep transform ref in sync with state
  useEffect(() => {
    currentTransformRef.current = templateTransform;
  }, [templateTransform]);

  // Reset template initialization when template changes
  useEffect(() => {
    if (permanentTemplate && templateImageUrl) {
      console.log('=== Template URL changed, resetting initialization ===');
      templateInitializedRef.current = false;
      setTemplateInitRetry(0);
    }
  }, [permanentTemplate, templateImageUrl]);

  // Initialize template dimensions when image first loads
  useEffect(() => {
    if (!permanentTemplate || !templateImageUrl) {
      return;
    }

    // If template is already initialized and URL hasn't changed, skip
    if (templateInitializedRef.current) {
      return;
    }

    if (!isInitializedRef.current) {
      console.log('=== Waiting for canvas initialization ===');
      // Schedule a retry
      const retryTimer = setTimeout(() => {
        if (isInitializedRef.current && !templateInitializedRef.current) {
          console.log('=== Retrying template initialization after canvas ready ===');
          setTemplateInitRetry(prev => prev + 1);
        }
      }, 100);
      return () => clearTimeout(retryTimer);
    }

    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas || overlayCanvas.width === 0 || overlayCanvas.height === 0) {
      console.log('=== Canvas not ready, dimensions:', {
        exists: !!overlayCanvas,
        width: overlayCanvas?.width,
        height: overlayCanvas?.height
      });
      // Schedule a retry
      const retryTimer = setTimeout(() => {
        if (!templateInitializedRef.current && templateInitRetry < 10) {
          console.log('=== Retrying template initialization after delay ===');
          setTemplateInitRetry(prev => prev + 1);
        }
      }, 100);
      return () => clearTimeout(retryTimer);
    }

    console.log('=== Starting template initialization ===', {
      canvasWidth: overlayCanvas.width,
      canvasHeight: overlayCanvas.height,
      templateUrl: templateImageUrl
    });

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // Use requestAnimationFrame to ensure we have the latest canvas dimensions
      requestAnimationFrame(() => {
        const currentCanvas = overlayCanvasRef.current;
        if (!currentCanvas || currentCanvas.width === 0 || currentCanvas.height === 0) {
          console.error('=== Canvas lost dimensions after image load ===');
          return;
        }

        console.log('=== Template image loaded for initialization ===', {
          imageWidth: img.width,
          imageHeight: img.height,
          canvasWidth: currentCanvas.width,
          canvasHeight: currentCanvas.height
        });

        templateImageRef.current = img;

        const padding = 16;
        const effectiveCanvasWidth = currentCanvas.width - (padding * 2);
        const effectiveCanvasHeight = currentCanvas.height - (padding * 2);

        const scaleX = effectiveCanvasWidth / img.width;
        const scaleY = effectiveCanvasHeight / img.height;
        const scale = Math.min(scaleX, scaleY);

        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;

        const centerX = currentCanvas.width / 2;
        const centerY = currentCanvas.height / 2;

        const offsetX = centerX - drawWidth / 2;
        const offsetY = centerY - drawHeight / 2;

        console.log('=== Calculated template transform ===', {
          centerX,
          centerY,
          drawWidth,
          drawHeight,
          offsetX,
          offsetY,
          scale: 1
        });

        // Validation: ensure offsets are reasonable
        if (offsetX < 0 || offsetY < 0 || offsetX > currentCanvas.width || offsetY > currentCanvas.height) {
          console.error('=== Invalid template offsets calculated ===', { offsetX, offsetY });
          return;
        }

        setTemplateTransform({
          x: offsetX,
          y: offsetY,
          scale: 1,
          width: drawWidth,
          height: drawHeight,
          rotation: 0
        });

        templateInitializedRef.current = true;
        console.log('=== Template initialization complete ===');
      });
    };

    img.onerror = (error) => {
      console.error('Failed to load template image for initialization:', templateImageUrl, error);
    };

    img.src = templateImageUrl;
  }, [permanentTemplate, templateImageUrl, templateInitRetry]);

  // Render overlay function - simplified to only draw, no state updates
  const renderOverlay = useCallback((imageUrl: string | null) => {
    const overlayCanvas = overlayCanvasRef.current;
    const overlayCtx = overlayCtxRef.current;

    if (!overlayCanvas || !overlayCtx) {
      console.log('=== renderOverlay: Canvas or context not available ===');
      return;
    }

    if (overlayCanvas.width === 0 || overlayCanvas.height === 0) {
      console.log('=== renderOverlay: Canvas dimensions are zero ===');
      return;
    }

    // Clear and fill with white background
    overlayCtx.fillStyle = '#ffffff';
    overlayCtx.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    if (imageUrl) {
      const img = templateImageRef.current;

      // If we already have the image loaded, use it
      if (img && img.complete && img.src === imageUrl) {
        const transform = currentTransformRef.current;
        console.log('=== Drawing template from cache ===', transform);

        if (permanentTemplate && transform.width > 0 && transform.height > 0) {
          overlayCtx.globalAlpha = 1.0;
          overlayCtx.save();
          const centerX = transform.x + transform.width / 2;
          const centerY = transform.y + transform.height / 2;
          overlayCtx.translate(centerX, centerY);
          overlayCtx.rotate((transform.rotation * Math.PI) / 180);
          overlayCtx.translate(-centerX, -centerY);
          overlayCtx.drawImage(img, transform.x, transform.y, transform.width, transform.height);
          overlayCtx.restore();
          console.log('=== Template drawn successfully ===');
        } else if (!permanentTemplate) {
          // For non-permanent templates (draw-memory mode)
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

          overlayCtx.globalAlpha = 0.3;
          overlayCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
          overlayCtx.globalAlpha = 1.0;
        }
      } else {
        // Load the image if not already loaded
        console.log('=== Loading template image ===', imageUrl);
        const newImg = new Image();
        newImg.crossOrigin = 'anonymous';

        newImg.onload = () => {
          console.log('=== Template image loaded in renderOverlay ===');
          templateImageRef.current = newImg;
          const transform = currentTransformRef.current;

          if (permanentTemplate && transform.width > 0 && transform.height > 0) {
            overlayCtx.globalAlpha = 1.0;
            overlayCtx.save();
            const centerX = transform.x + transform.width / 2;
            const centerY = transform.y + transform.height / 2;
            overlayCtx.translate(centerX, centerY);
            overlayCtx.rotate((transform.rotation * Math.PI) / 180);
            overlayCtx.translate(-centerX, -centerY);
            overlayCtx.drawImage(newImg, transform.x, transform.y, transform.width, transform.height);
            overlayCtx.restore();
            console.log('=== Template drawn after load ===');
          } else if (!permanentTemplate) {
            const padding = 16;
            const effectiveCanvasWidth = overlayCanvas.width - (padding * 2);
            const effectiveCanvasHeight = overlayCanvas.height - (padding * 2);

            const scaleX = effectiveCanvasWidth / newImg.width;
            const scaleY = effectiveCanvasHeight / newImg.height;
            const scale = Math.min(scaleX, scaleY);

            const drawWidth = newImg.width * scale;
            const drawHeight = newImg.height * scale;

            const centerX = overlayCanvas.width / 2;
            const centerY = overlayCanvas.height / 2;

            const offsetX = centerX - drawWidth / 2;
            const offsetY = centerY - drawHeight / 2;

            overlayCtx.globalAlpha = 0.3;
            overlayCtx.drawImage(newImg, offsetX, offsetY, drawWidth, drawHeight);
            overlayCtx.globalAlpha = 1.0;
          }
        };

        newImg.onerror = (error) => {
          console.error('Failed to load overlay image:', imageUrl, error);
        };

        newImg.src = imageUrl;
      }
    }
  }, [permanentTemplate]);

  // Handle overlay image changes or permanent template
  useEffect(() => {
    if (!isInitializedRef.current) {
      console.log('=== Overlay effect: Canvas not initialized yet ===');
      return;
    }

    const overlayCanvas = overlayCanvasRef.current;
    const overlayCtx = overlayCtxRef.current;

    if (!overlayCanvas || !overlayCtx || overlayCanvas.width === 0 || overlayCanvas.height === 0) {
      console.log('=== Overlay effect: Canvas not ready, setting timeout ===');
      const timeoutId = setTimeout(() => {
        if (permanentTemplate && templateImageUrl) {
          console.log('=== Rendering permanent template after timeout ===', templateImageUrl);
          renderOverlay(templateImageUrl);
        } else if (overlayImageUrl) {
          console.log('=== Rendering overlay image after timeout ===', overlayImageUrl);
          renderOverlay(overlayImageUrl);
        } else {
          renderOverlay(null);
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }

    if (permanentTemplate && templateImageUrl) {
      console.log('=== Rendering permanent template ===', templateImageUrl);
      renderOverlay(templateImageUrl);
    } else if (overlayImageUrl) {
      console.log('=== Rendering overlay image ===', overlayImageUrl);
      renderOverlay(overlayImageUrl);
    } else {
      renderOverlay(null);
    }
  }, [overlayImageUrl, permanentTemplate, templateImageUrl, renderOverlay]);

  // Re-render overlay when template transform changes (for resize/drag)
  useEffect(() => {
    if (!permanentTemplate || !templateImageUrl || !templateInitializedRef.current) {
      return;
    }

    console.log('=== Template transform changed, re-rendering ===', templateTransform);
    renderOverlay(templateImageUrl);
  }, [templateTransform, permanentTemplate, templateImageUrl, renderOverlay]);

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

  // Cleanup scroll lock on unmount or when any interaction ends
  useEffect(() => {
    return () => {
      unlockScroll();
    };
  }, [unlockScroll]);

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
    const handleX = templateTransform.x;
    const handleY = templateTransform.y;
    const handleSize = 20;
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
    e.stopPropagation();

    lockScroll();

    const position = getCanvasPosition(e);

    if (isPointInResizeHandle(position.x, position.y)) {
      console.log('=== Resize handle clicked ===', {
        position,
        currentTransform: templateTransform
      });
      setIsResizingTemplate(true);
      setDragStartPos(position);
      setDragStartTransform({ ...templateTransform });
    } else if (isPointInTemplate(position.x, position.y)) {
      console.log('=== Template body clicked ===', {
        position,
        currentTransform: templateTransform
      });
      setIsDraggingTemplate(true);
      setDragStartPos(position);
      setDragStartTransform({ ...templateTransform });
    }
  };

  const handleTemplateInteractionMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isResizeMode || (!isDraggingTemplate && !isResizingTemplate && !isRotatingTemplate)) return;
    e.preventDefault();
    e.stopPropagation();

    const canvas = overlayCanvasRef.current;
    if (!canvas || !dragStartTransform) return;

    const position = getCanvasPosition(e);
    const deltaX = position.x - dragStartPos.x;
    const deltaY = position.y - dragStartPos.y;

    if (isRotatingTemplate) {
      const centerX = dragStartTransform.x + dragStartTransform.width / 2;
      const centerY = dragStartTransform.y + dragStartTransform.height / 2;

      const startAngle = Math.atan2(dragStartPos.y - centerY, dragStartPos.x - centerX);
      const currentAngle = Math.atan2(position.y - centerY, position.x - centerX);

      const angleDiff = (currentAngle - startAngle) * (180 / Math.PI);
      const newRotation = dragStartTransform.rotation + angleDiff;

      setTemplateTransform({
        ...dragStartTransform,
        rotation: newRotation
      });
    } else if (isResizingTemplate) {
      const diagonal = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const direction = (deltaX + deltaY) < 0 ? 1 : -1;
      const scaleChange = (diagonal * direction) / 200;
      let newScale = Math.max(0.2, dragStartTransform.scale + scaleChange);

      const baseWidth = dragStartTransform.width / dragStartTransform.scale;
      const baseHeight = dragStartTransform.height / dragStartTransform.scale;

      const newWidth = baseWidth * newScale;
      const newHeight = baseHeight * newScale;

      const widthDiff = newWidth - dragStartTransform.width;
      const heightDiff = newHeight - dragStartTransform.height;

      let newX = dragStartTransform.x - widthDiff;
      let newY = dragStartTransform.y - heightDiff;

      if (newX < 0) {
        newScale = dragStartTransform.x / baseWidth + dragStartTransform.scale;
        newX = 0;
      }
      if (newY < 0) {
        newScale = Math.min(newScale, dragStartTransform.y / baseHeight + dragStartTransform.scale);
        newY = 0;
      }
      if (newX + newWidth > canvas.width) {
        newScale = Math.min(newScale, (canvas.width - newX) / baseWidth);
      }
      if (newY + newHeight > canvas.height) {
        newScale = Math.min(newScale, (canvas.height - newY) / baseHeight);
      }

      const finalWidth = baseWidth * newScale;
      const finalHeight = baseHeight * newScale;
      const finalWidthDiff = finalWidth - dragStartTransform.width;
      const finalHeightDiff = finalHeight - dragStartTransform.height;

      setTemplateTransform({
        x: dragStartTransform.x - finalWidthDiff,
        y: dragStartTransform.y - finalHeightDiff,
        scale: newScale,
        width: finalWidth,
        height: finalHeight,
        rotation: dragStartTransform.rotation
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

  const handleTemplateInteractionEnd = useCallback(() => {
    unlockScroll();
    setIsDraggingTemplate(false);
    setIsResizingTemplate(false);
    setIsRotatingTemplate(false);
    setDragStartTransform(null);

    if (documentMouseMoveHandlerRef.current) {
      document.removeEventListener('mousemove', documentMouseMoveHandlerRef.current);
      documentMouseMoveHandlerRef.current = null;
    }
    if (documentMouseUpHandlerRef.current) {
      document.removeEventListener('mouseup', documentMouseUpHandlerRef.current);
      documentMouseUpHandlerRef.current = null;
    }
  }, [unlockScroll]);

  // Unlock scroll when resize mode is disabled
  useEffect(() => {
    if (!isResizeMode) {
      unlockScroll();
      handleTemplateInteractionEnd();
    }
  }, [isResizeMode, unlockScroll, handleTemplateInteractionEnd]);

  return (
    <div
      className="relative w-full max-w-[400px] h-[300px] sm:h-[400px] mx-auto"
      style={{
        touchAction: isResizeMode ? 'none' : 'auto'
      }}
    >
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
          style={{
            zIndex: isResizeMode ? 1 : 2,
            touchAction: isResizeMode ? 'none' : 'none'
          }}
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
        <div
          className="absolute bottom-4 left-4"
          style={{
            zIndex: 10,
            pointerEvents: (isDraggingTemplate || isResizingTemplate || isRotatingTemplate || isDrawing) ? 'none' : 'auto',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none'
          }}
        >
          {/* Main pencil icon button */}
          <button
            onClick={() => setIsPaletteExpanded(!isPaletteExpanded)}
            className="w-10 h-10 rounded-full border-2 border-gray-800 bg-white shadow-lg hover:scale-110 transition-all duration-200 relative flex items-center justify-center"
            title="Drawing Tools"
            style={{
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none'
            }}
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
          <div
            className="absolute top-4 right-4"
            style={{
              zIndex: 10,
              pointerEvents: (isDraggingTemplate || isResizingTemplate || isRotatingTemplate || isDrawing) ? 'none' : 'auto',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none'
            }}
          >
            <button
              onClick={() => setIsResizeMode(!isResizeMode)}
              className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                isResizeMode
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
              style={{
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none'
              }}
            >
              {isResizeMode ? 'Done' : 'Resize'}
            </button>
          </div>
        )}

        {/* Clear Canvas button */}
        <div
          className="absolute bottom-4 right-4"
          style={{
            zIndex: 10,
            pointerEvents: (isDraggingTemplate || isResizingTemplate || isRotatingTemplate || isDrawing) ? 'none' : 'auto',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none'
          }}
        >
          <button
            onClick={() => {
              clearCanvas();
              onClearCanvas?.();
            }}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
            style={{
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none'
            }}
          >
            Clear
          </button>
        </div>

        {/* Template resize overlay - only shown in resize mode */}
        {isResizeMode && permanentTemplate && templateTransform.width > 0 && (
          <div
            className="absolute"
            style={{
              left: `${(templateTransform.x / (overlayCanvasRef.current?.width || 1)) * 100}%`,
              top: `${(templateTransform.y / (overlayCanvasRef.current?.height || 1)) * 100}%`,
              width: `${(templateTransform.width / (overlayCanvasRef.current?.width || 1)) * 100}%`,
              height: `${(templateTransform.height / (overlayCanvasRef.current?.height || 1)) * 100}%`,
              zIndex: 5,
              border: '2px dashed #3b82f6',
              boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.1)',
              pointerEvents: 'none',
              transform: `rotate(${templateTransform.rotation}deg)`,
              transformOrigin: 'center center',
              touchAction: 'none',
            }}
          >
            {/* Resize handle at top-left corner */}
            <div
              className="absolute cursor-nwse-resize"
              style={{
                left: '-8px',
                top: '-8px',
                width: '20px',
                height: '20px',
                backgroundColor: '#3b82f6',
                border: '2px solid white',
                borderRadius: '2px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                pointerEvents: 'auto',
                touchAction: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                lockScroll();
                const rect = overlayCanvasRef.current?.getBoundingClientRect();
                if (!rect) return;
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const canvasX = (x / rect.width) * (overlayCanvasRef.current?.width || 1);
                const canvasY = (y / rect.height) * (overlayCanvasRef.current?.height || 1);
                setIsResizingTemplate(true);
                setDragStartPos({ x: canvasX, y: canvasY });
                setDragStartTransform({ ...templateTransform });

                const handleMouseMove = (moveEvent: MouseEvent) => {
                  moveEvent.preventDefault();
                  const canvas = overlayCanvasRef.current;
                  if (!canvas) return;
                  const currentRect = canvas.getBoundingClientRect();
                  if (!currentRect) return;

                  const moveX = moveEvent.clientX - currentRect.left;
                  const moveY = moveEvent.clientY - currentRect.top;
                  const moveCanvasX = (moveX / currentRect.width) * canvas.width;
                  const moveCanvasY = (moveY / currentRect.height) * canvas.height;

                  const startTransform = dragStartTransform || templateTransform;
                  const deltaX = moveCanvasX - canvasX;
                  const deltaY = moveCanvasY - canvasY;

                  const diagonal = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                  const direction = (deltaX + deltaY) < 0 ? 1 : -1;
                  const scaleChange = (diagonal * direction) / 200;
                  let newScale = Math.max(0.2, startTransform.scale + scaleChange);

                  const baseWidth = startTransform.width / startTransform.scale;
                  const baseHeight = startTransform.height / startTransform.scale;

                  const newWidth = baseWidth * newScale;
                  const newHeight = baseHeight * newScale;

                  const widthDiff = newWidth - startTransform.width;
                  const heightDiff = newHeight - startTransform.height;

                  let newX = startTransform.x - widthDiff;
                  let newY = startTransform.y - heightDiff;

                  if (newX < 0) {
                    newScale = startTransform.x / baseWidth + startTransform.scale;
                    newX = 0;
                  }
                  if (newY < 0) {
                    newScale = Math.min(newScale, startTransform.y / baseHeight + startTransform.scale);
                    newY = 0;
                  }
                  if (newX + newWidth > canvas.width) {
                    newScale = Math.min(newScale, (canvas.width - newX) / baseWidth);
                  }
                  if (newY + newHeight > canvas.height) {
                    newScale = Math.min(newScale, (canvas.height - newY) / baseHeight);
                  }

                  const finalWidth = baseWidth * newScale;
                  const finalHeight = baseHeight * newScale;
                  const finalWidthDiff = finalWidth - startTransform.width;
                  const finalHeightDiff = finalHeight - startTransform.height;

                  setTemplateTransform({
                    x: startTransform.x - finalWidthDiff,
                    y: startTransform.y - finalHeightDiff,
                    scale: newScale,
                    width: finalWidth,
                    height: finalHeight,
                    rotation: startTransform.rotation
                  });
                };

                const handleMouseUp = (upEvent: MouseEvent) => {
                  upEvent.preventDefault();
                  handleTemplateInteractionEnd();
                };

                documentMouseMoveHandlerRef.current = handleMouseMove;
                documentMouseUpHandlerRef.current = handleMouseUp;
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
              onMouseUp={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleTemplateInteractionEnd();
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                lockScroll();
                const rect = overlayCanvasRef.current?.getBoundingClientRect();
                if (!rect || e.touches.length === 0) return;
                const touch = e.touches[0];
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                const canvasX = (x / rect.width) * (overlayCanvasRef.current?.width || 1);
                const canvasY = (y / rect.height) * (overlayCanvasRef.current?.height || 1);
                setIsResizingTemplate(true);
                setDragStartPos({ x: canvasX, y: canvasY });
                setDragStartTransform({ ...templateTransform });
              }}
              onTouchMove={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isResizingTemplate) return;
                const canvas = overlayCanvasRef.current;
                if (!canvas || !dragStartTransform) return;
                const rect = canvas.getBoundingClientRect();
                if (!rect || e.touches.length === 0) return;
                const touch = e.touches[0];
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                const canvasX = (x / rect.width) * canvas.width;
                const canvasY = (y / rect.height) * canvas.height;

                const deltaX = canvasX - dragStartPos.x;
                const deltaY = canvasY - dragStartPos.y;

                const diagonal = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                const direction = (deltaX + deltaY) < 0 ? 1 : -1;
                const scaleChange = (diagonal * direction) / 200;
                let newScale = Math.max(0.2, dragStartTransform.scale + scaleChange);

                const baseWidth = dragStartTransform.width / dragStartTransform.scale;
                const baseHeight = dragStartTransform.height / dragStartTransform.scale;

                const newWidth = baseWidth * newScale;
                const newHeight = baseHeight * newScale;

                const widthDiff = newWidth - dragStartTransform.width;
                const heightDiff = newHeight - dragStartTransform.height;

                let newX = dragStartTransform.x - widthDiff;
                let newY = dragStartTransform.y - heightDiff;

                if (newX < 0) {
                  newScale = dragStartTransform.x / baseWidth + dragStartTransform.scale;
                  newX = 0;
                }
                if (newY < 0) {
                  newScale = Math.min(newScale, dragStartTransform.y / baseHeight + dragStartTransform.scale);
                  newY = 0;
                }
                if (newX + newWidth > canvas.width) {
                  newScale = Math.min(newScale, (canvas.width - newX) / baseWidth);
                }
                if (newY + newHeight > canvas.height) {
                  newScale = Math.min(newScale, (canvas.height - newY) / baseHeight);
                }

                const finalWidth = baseWidth * newScale;
                const finalHeight = baseHeight * newScale;
                const finalWidthDiff = finalWidth - dragStartTransform.width;
                const finalHeightDiff = finalHeight - dragStartTransform.height;

                setTemplateTransform({
                  x: dragStartTransform.x - finalWidthDiff,
                  y: dragStartTransform.y - finalHeightDiff,
                  scale: newScale,
                  width: finalWidth,
                  height: finalHeight,
                  rotation: dragStartTransform.rotation
                });
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleTemplateInteractionEnd();
              }}
            />

            {/* Rotation handle */}
            <div
              className="absolute cursor-grab active:cursor-grabbing"
              style={{
                left: '50%',
                top: '-40px',
                transform: 'translateX(-50%)',
                width: '20px',
                height: '20px',
                backgroundColor: '#10b981',
                border: '2px solid white',
                borderRadius: '50%',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                pointerEvents: 'auto',
                touchAction: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                lockScroll();
                const rect = overlayCanvasRef.current?.getBoundingClientRect();
                if (!rect) return;
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const canvasX = (x / rect.width) * (overlayCanvasRef.current?.width || 1);
                const canvasY = (y / rect.height) * (overlayCanvasRef.current?.height || 1);
                setIsRotatingTemplate(true);
                setDragStartPos({ x: canvasX, y: canvasY });
                setDragStartTransform({ ...templateTransform });

                const handleMouseMove = (moveEvent: MouseEvent) => {
                  moveEvent.preventDefault();
                  const canvas = overlayCanvasRef.current;
                  if (!canvas) return;
                  const currentRect = canvas.getBoundingClientRect();
                  if (!currentRect) return;

                  const moveX = moveEvent.clientX - currentRect.left;
                  const moveY = moveEvent.clientY - currentRect.top;
                  const moveCanvasX = (moveX / currentRect.width) * canvas.width;
                  const moveCanvasY = (moveY / currentRect.height) * canvas.height;

                  const startTransform = dragStartTransform || templateTransform;
                  const centerX = startTransform.x + startTransform.width / 2;
                  const centerY = startTransform.y + startTransform.height / 2;

                  const startAngle = Math.atan2(canvasY - centerY, canvasX - centerX);
                  const currentAngle = Math.atan2(moveCanvasY - centerY, moveCanvasX - centerX);

                  const angleDiff = (currentAngle - startAngle) * (180 / Math.PI);
                  const newRotation = startTransform.rotation + angleDiff;

                  setTemplateTransform({
                    ...startTransform,
                    rotation: newRotation
                  });
                };

                const handleMouseUp = (upEvent: MouseEvent) => {
                  upEvent.preventDefault();
                  handleTemplateInteractionEnd();
                };

                documentMouseMoveHandlerRef.current = handleMouseMove;
                documentMouseUpHandlerRef.current = handleMouseUp;
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
              onMouseUp={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleTemplateInteractionEnd();
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                lockScroll();
                const rect = overlayCanvasRef.current?.getBoundingClientRect();
                if (!rect || e.touches.length === 0) return;
                const touch = e.touches[0];
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                const canvasX = (x / rect.width) * (overlayCanvasRef.current?.width || 1);
                const canvasY = (y / rect.height) * (overlayCanvasRef.current?.height || 1);
                setIsRotatingTemplate(true);
                setDragStartPos({ x: canvasX, y: canvasY });
                setDragStartTransform({ ...templateTransform });
              }}
              onTouchMove={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isRotatingTemplate) return;
                const rect = overlayCanvasRef.current?.getBoundingClientRect();
                if (!rect || e.touches.length === 0) return;
                const touch = e.touches[0];
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                const canvasX = (x / rect.width) * (overlayCanvasRef.current?.width || 1);
                const canvasY = (y / rect.height) * (overlayCanvasRef.current?.height || 1);

                if (!dragStartTransform) return;

                const centerX = dragStartTransform.x + dragStartTransform.width / 2;
                const centerY = dragStartTransform.y + dragStartTransform.height / 2;

                const startAngle = Math.atan2(dragStartPos.y - centerY, dragStartPos.x - centerX);
                const currentAngle = Math.atan2(canvasY - centerY, canvasX - centerX);

                const angleDiff = (currentAngle - startAngle) * (180 / Math.PI);
                const newRotation = dragStartTransform.rotation + angleDiff;

                setTemplateTransform({
                  ...dragStartTransform,
                  rotation: newRotation
                });
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleTemplateInteractionEnd();
              }}
            />

            {/* Connection line from template to rotation handle */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '-40px',
                width: '2px',
                height: '40px',
                backgroundColor: '#10b981',
                transform: 'translateX(-50%)',
                pointerEvents: 'none',
              }}
            />
          </div>
        )}
    </div>
  );
}
