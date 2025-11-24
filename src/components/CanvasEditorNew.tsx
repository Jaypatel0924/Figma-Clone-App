// components/CanvasEditorNew.tsx - Professional Design Editor UI
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Square, Circle, ArrowRight, Type, MousePointer,
  ZoomIn, ZoomOut, Maximize, Grid, Undo, Redo,
  Copy, Trash2, Eye, EyeOff, PenTool,
  Save, FolderOpen, Star, Triangle, Layers,
  Minus, Eraser, ChevronUp, ChevronDown, Image as ImageIcon, Hexagon, Diamond,
  Share2, Check, X, Loader
} from 'lucide-react';

// Types
type ShapeType = 'rectangle' | 'circle' | 'line' | 'arrow' | 'text' | 'star' | 'triangle' | 'hexagon' | 'diamond' | 'polygon' | 'pen' | 'eraser' | 'image';

interface Point {
  x: number;
  y: number;
}

interface Shape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  locked: boolean;
  zIndex: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  endX?: number;
  endY?: number;
  points?: Point[];
  imageData?: string;
}

interface CanvasData {
  _id?: string;
  name: string;
  shapes: Shape[];
  thumbnail?: string;
  updatedAt?: string;
}

interface CanvasEditorProps {
  canvasId?: string;
  token: string;
  API_URL: string;
}

// API Service
class ApiService {
  private static getHeaders(token?: string) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  static async saveCanvas(canvas: CanvasData, token?: string, API_URL?: string): Promise<any> {
    const url = canvas._id
      ? `${API_URL}/canvas/${canvas._id}`
      : `${API_URL}/canvas`;

    const response = await fetch(url, {
      method: canvas._id ? 'PUT' : 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(canvas)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Save failed' }));
      throw new Error(error.error || 'Save failed');
    }

    return await response.json();
  }

  static async loadCanvases(token?: string, API_URL?: string): Promise<any[]> {
    const response = await fetch(`${API_URL}/canvas`, {
      headers: this.getHeaders(token)
    });

    if (!response.ok) {
      throw new Error('Failed to load canvases');
    }

    const data = await response.json();
    return data.canvases || [];
  }

  static async loadCanvas(id: string, token?: string, API_URL?: string): Promise<CanvasData> {
    const response = await fetch(`${API_URL}/canvas/${id}`, {
      headers: this.getHeaders(token)
    });

    if (!response.ok) {
      throw new Error('Failed to load canvas');
    }

    const data = await response.json();
    return data.canvas;
  }

  static async deleteCanvas(id: string, token?: string, API_URL?: string): Promise<void> {
    const response = await fetch(`${API_URL}/canvas/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(token)
    });

    if (!response.ok) {
      throw new Error('Failed to delete canvas');
    }
  }
}

// Canvas State Manager
class CanvasStateManager {
  private undoStack: Shape[][] = [];
  private redoStack: Shape[][] = [];

  pushState(shapes: Shape[]) {
    this.undoStack.push(JSON.parse(JSON.stringify(shapes)));
    this.redoStack = [];
    if (this.undoStack.length > 50) this.undoStack.shift();
  }

  undo(currentShapes: Shape[]): Shape[] | null {
    if (this.undoStack.length === 0) return null;
    this.redoStack.push(JSON.parse(JSON.stringify(currentShapes)));
    return this.undoStack.pop()!;
  }

  redo(currentShapes: Shape[]): Shape[] | null {
    if (this.redoStack.length === 0) return null;
    this.undoStack.push(JSON.parse(JSON.stringify(currentShapes)));
    return this.redoStack.pop()!;
  }
}

// Utility Functions
const generateId = () => `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const snapToGrid = (value: number, gridSize: number, enabled: boolean) =>
  enabled ? Math.round(value / gridSize) * gridSize : value;

// Color Palette
const COLOR_PALETTE = [
  '#000000', '#1f2937', '#374151', '#6b7280',
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#f3f4f6', '#ffffff', '#fca5a5', '#fdba74'
];

// Main Component
const CanvasEditorNew: React.FC<CanvasEditorProps> = ({ canvasId, token, API_URL }) => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tool, setTool] = useState<'select' | ShapeType>('select');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [gridEnabled, setGridEnabled] = useState(true);
  const [gridSnap] = useState(false);
  const [clipboard, setClipboard] = useState<Shape[]>([]);
  const [currentCanvas, setCurrentCanvas] = useState<CanvasData | null>(null);
  const [canvasList, setCanvasList] = useState<any[]>([]);
  const [showCanvasList, setShowCanvasList] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [fillColor, setFillColor] = useState('#3b82f6');
  const [strokeColor, setStrokeColor] = useState('#1f2937');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [penSize, setPenSize] = useState(3);
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(true);

  const canvasRef = useRef<HTMLDivElement>(null);
  const stateManager = useRef(new CanvasStateManager());
  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [drawStart, setDrawStart] = useState<Point | null>(null);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const GRID_SIZE = 20;

  // Load canvas on mount
  useEffect(() => {
    if (canvasId) {
      loadCanvas(canvasId);
    } else {
      // Create a new canvas with a default name
      const newCanvas: CanvasData = {
        name: `Canvas ${new Date().toLocaleString()}`,
        shapes: []
      };
      setCurrentCanvas(newCanvas);
      setShapes([]);
    }
  }, [canvasId]);

  // Auto-save canvas when shapes change
  useEffect(() => {
    if (saveStatus !== 'unsaved' || shapes.length === 0 || !currentCanvas) return;

    const autoSaveTimer = setTimeout(() => {
      handleSaveCanvas();
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [shapes, saveStatus, currentCanvas]);

  const loadCanvas = async (id: string) => {
    try {
      const canvas = await ApiService.loadCanvas(id, token, API_URL);
      setShapes(canvas.shapes || []);
      setCurrentCanvas(canvas);
      setSaveStatus('saved');
    } catch (error: any) {
      if (error.message === 'Failed to load canvas') {
        setCurrentCanvas({ _id: id, name: 'Untitled Canvas', shapes: [] });
        setShapes([]);
      } else {
        console.error('Failed to load canvas:', error);
      }
    }
  };

  const loadCanvases = async () => {
    try {
      const canvases = await ApiService.loadCanvases(token, API_URL);
      setCanvasList(canvases);
    } catch (error) {
      console.error('Failed to load canvases:', error);
    }
  };

  const handleSaveCanvas = async () => {
    if (!currentCanvas) {
      console.warn('No canvas to save');
      return;
    }

    setSaveStatus('saving');
    try {
      const canvasData: CanvasData = {
        _id: currentCanvas._id,
        name: currentCanvas.name || 'Untitled Canvas',
        shapes,
        thumbnail: ''
      };

      const result = await ApiService.saveCanvas(canvasData, token, API_URL);
      const savedCanvas = result.canvas || result;
      setCurrentCanvas(savedCanvas);
      setSaveStatus('saved');
      await loadCanvases();
    } catch (error) {
      console.error('Failed to save canvas:', error);
      setSaveStatus('unsaved');
    }
  };

  const handleShareCanvas = async (userEmails: string[]) => {
    if (!currentCanvas?._id) {
      setShareMessage({ type: 'error', text: 'Please save canvas first' });
      return;
    }

    // Validate email format on frontend
    const emailRegex = /^\S+@\S+\.\S+$/;
    const invalidEmails = userEmails.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      setShareMessage({ type: 'error', text: `Invalid email: ${invalidEmails.join(', ')}` });
      return;
    }

    setIsSharing(true);
    try {
      const response = await fetch(`${API_URL}/canvas/${currentCanvas._id}/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userEmails })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to share canvas');
      }

      setShareMessage({ type: 'success', text: 'Canvas shared successfully!' });
      setShareEmail('');
      setTimeout(() => setShareEmail(''), 2000);
      setTimeout(() => setShowShareModal(false), 2000);
    } catch (error) {
      console.error('Share error:', error);
      setShareMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to share canvas' });
    } finally {
      setIsSharing(false);
    }
  };

  const handleLoadCanvas = async (canvasId: string) => {
    try {
      const canvas = await ApiService.loadCanvas(canvasId, token, API_URL);
      setShapes(canvas.shapes || []);
      setCurrentCanvas(canvas);
      setShowCanvasList(false);
      setSaveStatus('saved');
    } catch (error) {
      console.error('Failed to load canvas:', error);
      alert('Failed to load canvas');
    }
  };

  const handleNewCanvas = () => {
    setShapes([]);
    setCurrentCanvas(null);
    setSelectedIds(new Set());
    setSaveStatus('unsaved');
  };

  const getShapeStats = () => {
    const stats: { [key: string]: number } = {
      rectangle: 0,
      circle: 0,
      text: 0,
      line: 0,
      arrow: 0,
      pen: 0,
      star: 0,
      triangle: 0,
    };
    shapes.forEach(shape => {
      if (shape.type in stats) {
        stats[shape.type]++;
      }
    });
    return stats;
  };

  const handleDeleteAllShapes = () => {
    if (confirm('Are you sure you want to delete all shapes on this canvas?')) {
      setShapes([]);
      setSelectedIds(new Set());
      setSaveStatus('unsaved');
    }
  };

  const handleSelectAll = () => {
    const allIds = new Set(shapes.map(s => s.id));
    setSelectedIds(allIds);
  };

  const handleIncreaseSize = () => {
    if (selectedIds.size === 0) return;
    pushState();
    const scaleFactor = 1.2; // 20% increase
    setShapes(prev => prev.map(shape => {
      if (!selectedIds.has(shape.id)) return shape;
      
      if (shape.type === 'text') {
        return { ...shape, fontSize: Math.min((shape.fontSize || 16) * scaleFactor, 96) };
      } else {
        return {
          ...shape,
          width: Math.max(shape.width * scaleFactor, 10),
          height: Math.max(shape.height * scaleFactor, 10)
        };
      }
    }));
  };

  const handleDecreaseSize = () => {
    if (selectedIds.size === 0) return;
    pushState();
    const scaleFactor = 0.8; // 20% decrease
    setShapes(prev => prev.map(shape => {
      if (!selectedIds.has(shape.id)) return shape;
      
      if (shape.type === 'text') {
        return { ...shape, fontSize: Math.max((shape.fontSize || 16) * scaleFactor, 8) };
      } else {
        return {
          ...shape,
          width: Math.max(shape.width * scaleFactor, 10),
          height: Math.max(shape.height * scaleFactor, 10)
        };
      }
    }));
  };

  const ERASER_RADIUS = 20;

  const handleEraserCollision = (x: number, y: number) => {
    setShapes(prev => prev.filter(shape => {
      const dx = (shape.x + shape.width / 2) - x;
      const dy = (shape.y + shape.height / 2) - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const shapeRadius = Math.sqrt(shape.width * shape.width + shape.height * shape.height) / 2;
      return distance > (ERASER_RADIUS + shapeRadius);
    }));
  };

  const pushState = useCallback(() => {
    stateManager.current.pushState(shapes);
    setSaveStatus('unsaved');
  }, [shapes]);

  const handleUndo = () => {
    const prev = stateManager.current.undo(shapes);
    if (prev) {
      setShapes(prev);
      setSaveStatus('unsaved');
    }
  };

  const handleRedo = () => {
    const next = stateManager.current.redo(shapes);
    if (next) {
      setShapes(next);
      setSaveStatus('unsaved');
    }
  };

  const createShape = (type: ShapeType, x: number, y: number, width: number, height: number, points?: Point[]): Shape => {
    const shape: Shape = {
      id: generateId(),
      type,
      x: snapToGrid(x, GRID_SIZE, gridSnap),
      y: snapToGrid(y, GRID_SIZE, gridSnap),
      width,
      height,
      rotation: 0,
      fill: type === 'line' || type === 'arrow' || type === 'pen' ? 'none' : fillColor,
      stroke: strokeColor,
      strokeWidth: type === 'pen' ? penSize : strokeWidth,
      opacity: 1,
      locked: false,
      zIndex: shapes.length,
      points
    };

    if (type === 'text') {
      shape.text = '';
      shape.fontSize = fontSize;
      shape.fontFamily = fontFamily;
    }
    if (type === 'arrow' || type === 'line') {
      shape.endX = x + width;
      shape.endY = y + height;
    }

    return shape;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const shape: Shape = {
          id: generateId(),
          type: 'image',
          x: 100,
          y: 100,
          width: Math.min(img.width, 300),
          height: Math.min(img.height, 300),
          rotation: 0,
          fill: 'none',
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          opacity: 1,
          locked: false,
          zIndex: shapes.length,
          imageData
        };
        setShapes(prev => [...prev, shape]);
        stateManager.current.pushState([...shapes, shape]);
      };
      img.src = imageData;
    };
    reader.readAsDataURL(file);
    
    // Reset input
    e.target.value = '';
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    if (tool === 'eraser') {
      setIsDrawing(true);
      setDrawStart({ x, y });
      handleEraserCollision(x, y);
    } else if (tool !== 'select') {
      setIsDrawing(true);
      setDrawStart({ x, y });
    } else {
      const clicked = [...shapes]
        .sort((a, b) => b.zIndex - a.zIndex)
        .find(s => {
          if (s.locked) return false;
          return x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height;
        });

      if (clicked) {
        if (e.shiftKey) {
          setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(clicked.id)) next.delete(clicked.id);
            else next.add(clicked.id);
            return next;
          });
        } else if (!selectedIds.has(clicked.id)) {
          setSelectedIds(new Set([clicked.id]));
        }
        setIsDragging(true);
        setDragStart({ x, y });
      } else if (!e.shiftKey) {
        setSelectedIds(new Set());
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning && dragStart) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      return;
    }

    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    // Handle text box resizing
    if (isResizing && dragStart && resizeHandle) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;

      setShapes(prev => prev.map(s => {
        if (!selectedIds.has(s.id) || s.type !== 'text') return s;
        
        let newWidth = s.width;
        let newHeight = s.height;

        if (resizeHandle === 'right' || resizeHandle === 'corner') {
          newWidth = Math.max(Math.round(s.width + dx), 50);
        }
        if (resizeHandle === 'bottom' || resizeHandle === 'corner') {
          newHeight = Math.max(Math.round(s.height + dy), 30);
        }

        return {
          ...s,
          width: newWidth,
          height: newHeight
        };
      }));

      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (isDrawing && drawStart && tool !== 'select') {
      if (tool === 'eraser') {
        handleEraserCollision(x, y);
      } else if (tool === 'pen') {
        // For pen tool, accumulate points
        setShapes(prev => {
          const temp = prev.find(s => s.id.startsWith('temp_'));
          if (temp && temp.points) {
            // Update existing temp pen shape
            const pts = [...temp.points, { x, y }];
            const xCoords = pts.map(p => p.x);
            const yCoords = pts.map(p => p.y);
            const updated = prev.map(s => 
              s.id === temp.id 
                ? {
                    ...s,
                    points: pts,
                    width: Math.max(...xCoords) - Math.min(...xCoords),
                    height: Math.max(...yCoords) - Math.min(...yCoords),
                    strokeWidth: penSize
                  }
                : s
            );
            return updated;
          } else {
            // Create new temp pen shape
            const tempShapes = prev.filter(s => !s.id.startsWith('temp_'));
            const newShape = createShape(tool as ShapeType, drawStart.x, drawStart.y, 0, 0, [drawStart, { x, y }]);
            newShape.id = 'temp_' + newShape.id;
            newShape.strokeWidth = penSize;
            return [...tempShapes, newShape];
          }
        });
      } else {
        // For other shapes (rectangle, circle, line, arrow, etc.)
        const width = Math.abs(x - drawStart.x);
        const height = Math.abs(y - drawStart.y);
        const finalX = Math.min(x, drawStart.x);
        const finalY = Math.min(y, drawStart.y);

        setShapes(prev => {
          const temp = prev.filter(s => !s.id.startsWith('temp_'));
          const newShape = createShape(tool as ShapeType, finalX, finalY, width || 50, height || 50);
          newShape.id = 'temp_' + newShape.id;
          return [...temp, newShape];
        });
      }
    }

    if (isDragging && dragStart && selectedIds.size > 0) {
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;

      setShapes(prev => prev.map(s => {
        if (!selectedIds.has(s.id) || s.locked) return s;
        return {
          ...s,
          x: snapToGrid(s.x + dx, GRID_SIZE, gridSnap),
          y: snapToGrid(s.y + dy, GRID_SIZE, gridSnap)
        };
      }));
      setDragStart({ x, y });
    }
  };

  const handleMouseUp = () => {
    if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
      pushState();
    }
    if (isDrawing && drawStart) {
      setShapes(prev => {
        // For pen tool, preserve points array
        return prev.map(s => {
          if (s.id.startsWith('temp_')) {
            const newId = s.id.replace('temp_', '');
            if (s.type === 'pen' && s.points && s.points.length > 1) {
              // Keep points for pen shapes
              return { ...s, id: newId };
            } else if (s.type === 'pen' && (!s.points || s.points.length <= 1)) {
              // Don't save pen shapes with no/insufficient points
              return null as any;
            }
            return { ...s, id: newId };
          }
          return s;
        }).filter(s => s !== null);
      });
      pushState();
    }
    setIsDrawing(false);
    setIsDragging(false);
    setIsPanning(false);
    setDrawStart(null);
    setDragStart(null);
  };

  const deleteSelected = () => {
    if (selectedIds.size > 0) {
      pushState();
      setShapes(prev => prev.filter(s => !selectedIds.has(s.id)));
      setSelectedIds(new Set());
    }
  };

  const updateSelectedShapes = (updates: Partial<Shape>) => {
    pushState();
    setShapes(prev => prev.map(s =>
      selectedIds.has(s.id) ? { ...s, ...updates } : s
    ));
  };

  const handleCopy = () => {
    const selected = shapes.filter(s => selectedIds.has(s.id));
    setClipboard(selected);
  };

  const handlePaste = () => {
    if (clipboard.length > 0) {
      pushState();
      const pasted = clipboard.map(s => ({
        ...s,
        id: generateId(),
        x: s.x + 30,
        y: s.y + 30,
        zIndex: shapes.length
      }));
      setShapes([...shapes, ...pasted]);
      setSelectedIds(new Set(pasted.map(s => s.id)));
    }
  };

  const renderResizeHandles = (shape: Shape, isSelected: boolean) => {
    if (!isSelected) return null;

    return (
      <>
        {/* Right handle */}
        <div
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsResizing(true);
            setResizeHandle('right');
            setDragStart({ x: e.clientX, y: e.clientY });
          }}
          style={{
            position: 'absolute',
            left: shape.x + shape.width + pan.x - 6,
            top: shape.y + shape.height / 2 + pan.y - 6,
            width: '12px',
            height: '12px',
            backgroundColor: '#3b82f6',
            border: '2px solid white',
            borderRadius: '50%',
            cursor: 'ew-resize',
            zIndex: 1000
          }}
        />
        {/* Bottom handle */}
        <div
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsResizing(true);
            setResizeHandle('bottom');
            setDragStart({ x: e.clientX, y: e.clientY });
          }}
          style={{
            position: 'absolute',
            left: shape.x + shape.width / 2 + pan.x - 6,
            top: shape.y + shape.height + pan.y - 6,
            width: '12px',
            height: '12px',
            backgroundColor: '#3b82f6',
            border: '2px solid white',
            borderRadius: '50%',
            cursor: 'ns-resize',
            zIndex: 1000
          }}
        />
        {/* Corner handle */}
        <div
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsResizing(true);
            setResizeHandle('corner');
            setDragStart({ x: e.clientX, y: e.clientY });
          }}
          style={{
            position: 'absolute',
            left: shape.x + shape.width + pan.x - 6,
            top: shape.y + shape.height + pan.y - 6,
            width: '12px',
            height: '12px',
            backgroundColor: '#3b82f6',
            border: '2px solid white',
            borderRadius: '50%',
            cursor: 'nwse-resize',
            zIndex: 1000
          }}
        />
      </>
    );
  };

  const renderShape = (shape: Shape) => {
    const isSelected = selectedIds.has(shape.id);
    const transform = `rotate(${shape.rotation}deg)`;
    const baseStyle = {
      position: 'absolute' as const,
      left: shape.x,
      top: shape.y,
      opacity: shape.opacity,
      cursor: tool === 'select' ? 'move' : 'crosshair',
      transform,
      border: isSelected ? '2px solid #3b82f6' : undefined,
      boxShadow: isSelected ? '0 0 0 2px rgba(59, 130, 246, 0.3)' : undefined
    };

    switch (shape.type) {
      case 'rectangle':
        return (
          <div key={shape.id}>
            <div
              onClick={() => setSelectedIds(new Set([shape.id]))}
              style={{
                ...baseStyle,
                width: shape.width,
                height: shape.height,
                backgroundColor: shape.fill,
                border: `${shape.strokeWidth}px solid ${shape.stroke}`
              }}
            />
            {renderResizeHandles(shape, isSelected)}
          </div>
        );
      case 'circle':
        return (
          <div
            key={shape.id}
            onClick={() => setSelectedIds(new Set([shape.id]))}
            style={{
              ...baseStyle,
              width: shape.width,
              height: shape.height,
              backgroundColor: shape.fill,
              border: `${shape.strokeWidth}px solid ${shape.stroke}`,
              borderRadius: '50%'
            }}
          />
        );
      case 'text':
        // Calculate required height based on text content and width
        const lineHeight = (shape.fontSize || fontSize) * 1.5;
        const charPerLine = Math.max(Math.floor(Math.max(shape.width, 100) / ((shape.fontSize || fontSize) * 0.6)), 1);
        const estimatedLines = Math.ceil((shape.text || '').length / charPerLine) || 1;
        const calculatedHeight = Math.max(estimatedLines * lineHeight, 30);

        return (
          <div key={shape.id}>
            <div
              onClick={() => setSelectedIds(new Set([shape.id]))}
              style={{
                ...baseStyle,
                width: Math.max(shape.width, 100),
                height: calculatedHeight,
                color: shape.fill,
                fontSize: `${shape.fontSize || fontSize}px`,
                fontFamily: shape.fontFamily || 'Arial',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                overflowWrap: 'break-word',
                border: isSelected ? '2px solid #3b82f6' : 'none',
                padding: '4px',
                lineHeight: '1.5'
              }}
            >
              {isSelected && editingTextId === shape.id ? (
                <input
                  type="text"
                  value={shape.text || ''}
                  onChange={(e) => {
                    const newText = e.target.value;
                    updateSelectedShapes({ text: newText });
                    // Auto-increase width if text is getting much longer
                    const estimatedWidth = newText.length * ((shape.fontSize || fontSize) * 0.6) + 20;
                    if (estimatedWidth > shape.width * 1.5) {
                      updateSelectedShapes({ width: estimatedWidth });
                    }
                  }}
                  onBlur={() => setEditingTextId(null)}
                  onDoubleClick={(e) => e.stopPropagation()}
                  autoFocus
                  className="w-full h-full text-center bg-transparent border-none text-inherit focus:outline-none"
                  style={{ 
                    color: shape.fill, 
                    fontFamily: shape.fontFamily || 'Arial',
                    fontSize: `${shape.fontSize || fontSize}px`,
                    wordWrap: 'break-word',
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'break-word',
                    lineHeight: '1.5'
                  }}
                />
              ) : (
                <span 
                  onDoubleClick={() => setEditingTextId(shape.id)} 
                  style={{ 
                    wordWrap: 'break-word', 
                    whiteSpace: 'pre-wrap', 
                    overflowWrap: 'break-word',
                    lineHeight: '1.5'
                  }}
                >
                  {shape.text || 'Double click to type'}
                </span>
              )}
            </div>
            
            {/* Resize Handles - Only show when selected and not editing */}
            {isSelected && editingTextId !== shape.id && (
              <>
                {/* Right handle for width */}
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setIsResizing(true);
                    setResizeHandle('right');
                    setDragStart({ x: e.clientX, y: e.clientY });
                  }}
                  style={{
                    position: 'absolute',
                    left: shape.x + Math.max(shape.width, 100) + pan.x,
                    top: shape.y + calculatedHeight / 2 + pan.y - 6,
                    width: '12px',
                    height: '12px',
                    backgroundColor: '#3b82f6',
                    border: '2px solid white',
                    borderRadius: '50%',
                    cursor: 'ew-resize',
                    zIndex: 1000
                  }}
                />
                {/* Bottom handle for height */}
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setIsResizing(true);
                    setResizeHandle('bottom');
                    setDragStart({ x: e.clientX, y: e.clientY });
                  }}
                  style={{
                    position: 'absolute',
                    left: shape.x + Math.max(shape.width, 100) / 2 + pan.x - 6,
                    top: shape.y + calculatedHeight + pan.y,
                    width: '12px',
                    height: '12px',
                    backgroundColor: '#3b82f6',
                    border: '2px solid white',
                    borderRadius: '50%',
                    cursor: 'ns-resize',
                    zIndex: 1000
                  }}
                />
                {/* Corner handle for both */}
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setIsResizing(true);
                    setResizeHandle('corner');
                    setDragStart({ x: e.clientX, y: e.clientY });
                  }}
                  style={{
                    position: 'absolute',
                    left: shape.x + Math.max(shape.width, 100) + pan.x - 6,
                    top: shape.y + calculatedHeight + pan.y - 6,
                    width: '12px',
                    height: '12px',
                    backgroundColor: '#3b82f6',
                    border: '2px solid white',
                    borderRadius: '50%',
                    cursor: 'nwse-resize',
                    zIndex: 1000
                  }}
                />
              </>
            )}
          </div>
        );
      case 'line':
        const lineAngle = Math.atan2((shape.endY || 0) - shape.y, (shape.endX || 0) - shape.x);
        const lineLength = Math.sqrt(Math.pow((shape.endX || 0) - shape.x, 2) + Math.pow((shape.endY || 0) - shape.y, 2));
        return (
          <div
            key={shape.id}
            onClick={() => setSelectedIds(new Set([shape.id]))}
            style={{
              ...baseStyle,
              width: Math.max(lineLength, 2),
              height: shape.strokeWidth,
              backgroundColor: shape.stroke,
              transform: `rotate(${lineAngle}rad)`,
              transformOrigin: '0 50%'
            }}
          />
        );
      case 'arrow':
        const arrowAngle = Math.atan2((shape.endY || 0) - shape.y, (shape.endX || 0) - shape.x);
        const arrowLength = Math.sqrt(Math.pow((shape.endX || 0) - shape.x, 2) + Math.pow((shape.endY || 0) - shape.y, 2));
        const arrowHeadSize = Math.max(shape.strokeWidth * 3, 10);
        return (
          <svg
            key={shape.id}
            onClick={() => setSelectedIds(new Set([shape.id]))}
            width={Math.max(arrowLength + arrowHeadSize, 20)}
            height={Math.max(shape.strokeWidth * 3, 20)}
            style={{
              position: 'absolute',
              left: shape.x,
              top: shape.y,
              opacity: shape.opacity,
              cursor: 'move',
              border: isSelected ? '2px solid #3b82f6' : undefined,
              boxShadow: isSelected ? '0 0 0 2px rgba(59, 130, 246, 0.3)' : undefined,
              transform: `rotate(${arrowAngle}rad)`,
              transformOrigin: '0 50%',
              overflow: 'visible'
            }}
            viewBox={`0 0 ${Math.max(arrowLength + arrowHeadSize, 20)} ${Math.max(shape.strokeWidth * 3, 20)}`}
          >
            <defs>
              <marker
                id={`arrowhead-${shape.id}`}
                markerWidth={arrowHeadSize}
                markerHeight={arrowHeadSize}
                refX={arrowHeadSize - 2}
                refY={shape.strokeWidth * 1.5}
                orient="auto"
              >
                <polygon points={`0,0 ${arrowHeadSize},${shape.strokeWidth * 1.5} 0,${shape.strokeWidth * 3}`} fill={shape.stroke} />
              </marker>
            </defs>
            <line
              x1="0"
              y1={shape.strokeWidth * 1.5}
              x2={Math.max(arrowLength, 2)}
              y2={shape.strokeWidth * 1.5}
              stroke={shape.stroke}
              strokeWidth={shape.strokeWidth}
              markerEnd={`url(#arrowhead-${shape.id})`}
            />
          </svg>
        );
      case 'pen':
        if (!shape.points || shape.points.length < 2) {
          return null;
        }
        const minX = Math.min(...shape.points.map(p => p.x));
        const minY = Math.min(...shape.points.map(p => p.y));
        const maxX = Math.max(...shape.points.map(p => p.x));
        const maxY = Math.max(...shape.points.map(p => p.y));
        const pathData = shape.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x - minX},${p.y - minY}`).join('');
        const svgPen = `<path d="${pathData}" stroke="${shape.stroke}" stroke-width="${penSize}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
        return (
          <svg
            key={shape.id}
            onClick={() => setSelectedIds(new Set([shape.id]))}
            style={{
              position: 'absolute',
              left: minX,
              top: minY,
              opacity: shape.opacity,
              cursor: 'move',
              border: isSelected ? '2px solid #3b82f6' : undefined,
              boxShadow: isSelected ? '0 0 0 2px rgba(59, 130, 246, 0.3)' : undefined,
              overflow: 'visible'
            }}
            width={Math.max(maxX - minX + 10, 10)}
            height={Math.max(maxY - minY + 10, 10)}
            viewBox={`0 0 ${Math.max(maxX - minX + 10, 10)} ${Math.max(maxY - minY + 10, 10)}`}
            dangerouslySetInnerHTML={{ __html: svgPen }}
          />
        );
      case 'star':
        const starPoints = 5;
        const outerRadius = Math.min(shape.width, shape.height) / 2;
        const innerRadius = outerRadius / 2;
        let starPath = '';
        for (let i = 0; i < starPoints * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (i * Math.PI) / starPoints - Math.PI / 2;
          const x = shape.width / 2 + radius * Math.cos(angle);
          const y = shape.height / 2 + radius * Math.sin(angle);
          starPath += (i === 0 ? 'M' : 'L') + x + ',' + y;
        }
        starPath += 'Z';
        const svgStar = `<path d="${starPath}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}"/>`;
        return (
          <div key={shape.id}>
            <svg
              onClick={() => setSelectedIds(new Set([shape.id]))}
              style={baseStyle}
              width={shape.width}
              height={shape.height}
              viewBox={`0 0 ${shape.width} ${shape.height}`}
              dangerouslySetInnerHTML={{ __html: svgStar }}
            />
            {renderResizeHandles(shape, isSelected)}
          </div>
        );
      case 'triangle':
        const svgTriangle = `
          <polygon points="${shape.width/2},0 ${shape.width},${shape.height} 0,${shape.height}" 
                   fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}"/>
        `;
        return (
          <div key={shape.id}>
            <svg
              onClick={() => setSelectedIds(new Set([shape.id]))}
              style={baseStyle}
              width={shape.width}
              height={shape.height}
              viewBox={`0 0 ${shape.width} ${shape.height}`}
              dangerouslySetInnerHTML={{ __html: svgTriangle }}
            />
            {renderResizeHandles(shape, isSelected)}
          </div>
        );
      case 'hexagon':
        const hexRadius = Math.min(shape.width, shape.height) / 2;
        let hexPath = '';
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          const x = shape.width / 2 + hexRadius * Math.cos(angle);
          const y = shape.height / 2 + hexRadius * Math.sin(angle);
          hexPath += (i === 0 ? 'M' : 'L') + x + ',' + y;
        }
        hexPath += 'Z';
        const svgHex = `<path d="${hexPath}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}"/>`;
        return (
          <div key={shape.id}>
            <svg
              onClick={() => setSelectedIds(new Set([shape.id]))}
              style={baseStyle}
              width={shape.width}
              height={shape.height}
              viewBox={`0 0 ${shape.width} ${shape.height}`}
              dangerouslySetInnerHTML={{ __html: svgHex }}
            />
            {renderResizeHandles(shape, isSelected)}
          </div>
        );
      case 'polygon':
        const polyRadius = Math.min(shape.width, shape.height) / 2;
        let polyPath = '';
        for (let i = 0; i < 5; i++) {
          const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
          const x = shape.width / 2 + polyRadius * Math.cos(angle);
          const y = shape.height / 2 + polyRadius * Math.sin(angle);
          polyPath += (i === 0 ? 'M' : 'L') + x + ',' + y;
        }
        polyPath += 'Z';
        const svgPoly = `<path d="${polyPath}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}"/>`;
        return (
          <div key={shape.id}>
            <svg
              onClick={() => setSelectedIds(new Set([shape.id]))}
              style={baseStyle}
              width={shape.width}
              height={shape.height}
              viewBox={`0 0 ${shape.width} ${shape.height}`}
              dangerouslySetInnerHTML={{ __html: svgPoly }}
            />
            {renderResizeHandles(shape, isSelected)}
          </div>
        );
      case 'diamond':
        const diamondSvg = `
          <polygon points="${shape.width/2},0 ${shape.width},${shape.height/2} ${shape.width/2},${shape.height} 0,${shape.height/2}" 
                   fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}"/>
        `;
        return (
          <div key={shape.id}>
            <svg
              onClick={() => setSelectedIds(new Set([shape.id]))}
              style={baseStyle}
              width={shape.width}
              height={shape.height}
              viewBox={`0 0 ${shape.width} ${shape.height}`}
              dangerouslySetInnerHTML={{ __html: diamondSvg }}
            />
            {renderResizeHandles(shape, isSelected)}
          </div>
        );
      case 'image':
        return (
          <div key={shape.id}>
            <div
              onClick={() => setSelectedIds(new Set([shape.id]))}
              style={{
                ...baseStyle,
                width: shape.width,
                height: shape.height,
                backgroundImage: `url(${shape.imageData})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: `${shape.strokeWidth}px solid ${shape.stroke}`
              }}
            />
            {renderResizeHandles(shape, isSelected)}
          </div>
        );
      default:
        return (
          <div
            key={shape.id}
            style={{
              ...baseStyle,
              width: shape.width,
              height: shape.height,
              backgroundColor: shape.fill,
              border: `${shape.strokeWidth}px solid ${shape.stroke}`
            }}
          />
        );
    }
  };

  const selectedShape = selectedIds.size === 1 ? shapes.find(s => selectedIds.has(s.id)) : null;

  // Setup keyboard shortcuts after all handlers are defined
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input field
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') {
        return;
      }

      const isMeta = e.ctrlKey || e.metaKey;
      
      if (isMeta && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleSelectAll();
      } else if (isMeta && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopy();
      } else if (isMeta && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        handlePaste();
      } else if (isMeta && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        handleCopy();
        deleteSelected();
      } else if (isMeta && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((isMeta && e.key.toLowerCase() === 'z' && e.shiftKey) || (isMeta && e.key.toLowerCase() === 'y')) {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (target?.tagName !== 'INPUT') {
          e.preventDefault();
          deleteSelected();
        }
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleIncreaseSize();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleDecreaseSize();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, shapes, clipboard]);

  return (
    <div className={`flex h-screen w-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} overflow-hidden`}>
      {/* LEFT SIDEBAR - Layers/Pages */}
      <div className={`w-64 ${darkMode ? 'bg-gray-950 border-gray-800' : 'bg-gray-100 border-gray-200'} border-r flex flex-col`}>
        {/* Header */}
        <div className={`p-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-4">
            <Layers size={18} />
            <span className="font-semibold">Pages</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleNewCanvas}
              className={`flex-1 px-3 py-2 rounded text-sm font-medium ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}
              title="New Canvas"
            >
              New
            </button>
            <button
              onClick={() => { loadCanvases(); setShowCanvasList(!showCanvasList); }}
              className={`flex-1 px-3 py-2 rounded text-sm ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
              title="Open"
            >
              <FolderOpen size={16} className="inline" />
            </button>
          </div>
        </div>

        {/* Canvas Name */}
        <div className={`p-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <input
            type="text"
            value={currentCanvas?.name || 'Untitled'}
            onChange={(e) => setCurrentCanvas(c => c ? { ...c, name: e.target.value } : null)}
            className={`w-full px-3 py-2 rounded text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'} border`}
            placeholder="Canvas name"
          />
        </div>

        {/* Layers */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-xs text-gray-400 font-semibold mb-3">LAYERS ({shapes.length})</div>
          <div className="space-y-1">
            {[...shapes].reverse().map((shape, idx) => (
              <div
                key={shape.id}
                onClick={() => setSelectedIds(new Set([shape.id]))}
                className={`p-2 rounded text-sm flex items-center justify-between cursor-pointer ${
                  selectedIds.has(shape.id) ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                <span>{shape.type} #{shapes.length - idx}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateSelectedShapes({ locked: !shape.locked });
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  {shape.locked ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Save Status */}
        <div className={`p-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <button
            onClick={handleSaveCanvas}
            className={`w-full px-4 py-2 rounded font-medium text-sm flex items-center justify-center gap-2 ${
              saveStatus === 'saved'
                ? darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
                : saveStatus === 'saving'
                ? darkMode ? 'bg-yellow-600' : 'bg-yellow-500'
                : darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            <Save size={16} />
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>

      {/* CENTER - Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className={`h-12 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'} border-b flex items-center px-4 gap-2 overflow-x-auto`}>
          <button onClick={handleUndo} className={`p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} title="Undo (Ctrl+Z)">
            <Undo size={18} />
          </button>
          <button onClick={handleRedo} className={`p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} title="Redo (Ctrl+Shift+Z)">
            <Redo size={18} />
          </button>
          <div className={`w-px h-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
          <button onClick={handleSelectAll} className={`p-2 rounded flex items-center gap-1 text-xs ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} title="Select All (Ctrl+A)">
            <MousePointer size={16} />
            All
          </button>
          <button onClick={handleCopy} className={`p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} title="Copy (Ctrl+C)">
            <Copy size={18} />
          </button>
          <button onClick={handlePaste} className={`p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} title="Paste (Ctrl+V)">
            <Copy size={18} />
          </button>
          <button onClick={deleteSelected} className={`p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} title="Delete (Del)">
            <Trash2 size={18} />
          </button>
          <div className={`w-px h-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
          <button onClick={handleDecreaseSize} className={`p-2 rounded flex items-center gap-1 text-xs ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} title="Decrease Size (Minus)" disabled={selectedIds.size === 0}>
            <ChevronDown size={16} />
          </button>
          <button onClick={handleIncreaseSize} className={`p-2 rounded flex items-center gap-1 text-xs ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} title="Increase Size (Plus)" disabled={selectedIds.size === 0}>
            <ChevronUp size={16} />
          </button>
          <div className={`w-px h-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
          <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className={`p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
            <ZoomOut size={18} />
          </button>
          <span className="text-sm w-14 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(5, z + 0.1))} className={`p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
            <ZoomIn size={18} />
          </button>
          <button onClick={() => setZoom(1)} className={`p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
            <Maximize size={18} />
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setGridEnabled(!gridEnabled)}
            className={`p-2 rounded ${gridEnabled ? 'bg-blue-600' : (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200')}`}
            title="Toggle Grid"
          >
            <Grid size={18} />
          </button>
          <div className={`w-px h-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
          <button
            onClick={() => setShowShareModal(true)}
            className={`p-2 rounded flex items-center gap-1 text-xs ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
            title="Share Canvas"
          >
            <Share2 size={18} />
            Share
          </button>
        </div>

        {/* Canvas Area */}
        <div className={`flex-1 overflow-hidden relative ${darkMode ? 'bg-gray-950' : 'bg-white'}`}>
          <div
            ref={canvasRef}
            className="w-full h-full relative"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{
              cursor: isPanning ? 'grabbing' : tool === 'select' ? 'default' : 'crosshair',
              backgroundImage: gridEnabled
                ? `linear-gradient(#333333 1px, transparent 1px), linear-gradient(90deg, #333333 1px, transparent 1px)`
                : 'none',
              backgroundSize: gridEnabled ? `${GRID_SIZE * zoom}px ${GRID_SIZE * zoom}px` : 'auto',
              backgroundPosition: `${pan.x}px ${pan.y}px`
            }}
          >
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: '0 0',
                position: 'relative',
                width: '100%',
                height: '100%'
              }}
            >
              {shapes.sort((a, b) => a.zIndex - b.zIndex).map(shape => renderShape(shape))}
            </div>
          </div>

          {/* Canvas List Modal */}
          {showCanvasList && (
            <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Your Canvases</h2>
                {canvasList.length === 0 ? (
                  <p className="text-gray-400">No canvases yet</p>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {canvasList.map(canvas => (
                      <div
                        key={canvas._id}
                        onClick={() => handleLoadCanvas(canvas._id)}
                        className="bg-gray-700 p-4 rounded cursor-pointer hover:bg-gray-600 transition"
                      >
                        <h3 className="font-semibold">{canvas.name}</h3>
                        <p className="text-sm text-gray-400">
                          {canvas.updatedAt ? new Date(canvas.updatedAt).toLocaleDateString() : '—'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setShowCanvasList(false)}
                  className="mt-4 w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR - Organized */}
      <div className={`w-72 ${darkMode ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'} border-l flex flex-col overflow-hidden`}>
        
        {/* TOOLS SECTION */}
        <div className={`p-3 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className={`text-xs font-semibold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>TOOLS</div>
          <div className="space-y-2">
            {/* Row 1 */}
            <div className="grid grid-cols-5 gap-1.5">
              {[
                ['select', <MousePointer size={16} />, 'Select'],
                ['rectangle', <Square size={16} />, 'Rectangle'],
                ['circle', <Circle size={16} />, 'Circle'],
                ['text', <Type size={16} />, 'Text'],
                ['line', <Minus size={16} />, 'Line'],
              ].map(([toolName, icon, label]) => (
                <button
                  key={toolName as string}
                  onClick={() => setTool(toolName as any)}
                  className={`p-1.5 rounded transition ${
                    tool === toolName ? 'bg-blue-600' : (darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300')
                  }`}
                  title={label as string}
                >
                  {icon}
                </button>
              ))}
            </div>
            {/* Row 2 */}
            <div className="grid grid-cols-5 gap-1.5">
              {[
                ['arrow', <ArrowRight size={16} />, 'Arrow'],
                ['pen', <PenTool size={16} />, 'Pen'],
                ['eraser', <Eraser size={16} />, 'Eraser'],
                ['star', <Star size={16} />, 'Star'],
                ['triangle', <Triangle size={16} />, 'Triangle'],
              ].map(([toolName, icon, label]) => (
                <button
                  key={toolName as string}
                  onClick={() => setTool(toolName as any)}
                  className={`p-1.5 rounded transition ${
                    tool === toolName ? 'bg-blue-600' : (darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300')
                  }`}
                  title={label as string}
                >
                  {icon}
                </button>
              ))}
            </div>
            {/* Row 3 */}
            <div className="grid grid-cols-5 gap-1.5">
              {[
                ['hexagon', <Hexagon size={16} />, 'Hexagon'],
                ['diamond', <Diamond size={16} />, 'Diamond'],
              ].map(([toolName, icon, label]) => (
                <button
                  key={toolName as string}
                  onClick={() => setTool(toolName as any)}
                  className={`p-1.5 rounded transition ${
                    tool === toolName ? 'bg-blue-600' : (darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300')
                  }`}
                  title={label as string}
                >
                  {icon}
                </button>
              ))}
              {/* Image Upload */}
              <label
                title="Upload Image"
                className={`p-1.5 rounded transition cursor-pointer ${
                  darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                <ImageIcon size={16} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* COLORS SECTION - Quick & Simple */}
        <div className={`p-3 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className={`text-xs font-semibold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>FILL COLOR</div>
          <div className="flex gap-2 mb-2">
            <input
              type="color"
              value={fillColor}
              onChange={(e) => setFillColor(e.target.value)}
              className={`w-14 h-8 rounded cursor-pointer border ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}
            />
            <input
              type="text"
              value={fillColor}
              onChange={(e) => setFillColor(e.target.value)}
              placeholder="#3b82f6"
              className={`flex-1 px-2 py-1 rounded text-xs border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />
          </div>
          <div className={`text-xs font-semibold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Quick Colors</div>
          <div className="grid grid-cols-8 gap-1">
            {COLOR_PALETTE.map((color) => (
              <button
                key={`fill-${color}`}
                onClick={() => setFillColor(color)}
                className={`w-full aspect-square rounded cursor-pointer border transition ${
                  fillColor === color 
                    ? `border-2 border-blue-400 scale-110` 
                    : `border ${darkMode ? 'border-gray-700' : 'border-gray-300'}`
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* STROKE SECTION */}
        <div className={`p-3 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className={`text-xs font-semibold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>STROKE</div>
          <div className="flex gap-2 mb-2">
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              className={`w-14 h-8 rounded cursor-pointer border ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}
            />
            <input
              type="text"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              placeholder="#1f2937"
              className={`flex-1 px-2 py-1 rounded text-xs border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />
          </div>
          <div className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Width: {strokeWidth}px</div>
          <input
            type="range"
            min="1"
            max="20"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* PEN COLORS - Quick Palette */}
        <div className={`p-3 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className={`text-xs font-semibold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>PEN COLORS</div>
          <div className="grid grid-cols-8 gap-1">
            {COLOR_PALETTE.map((color) => (
              <button
                key={`pen-${color}`}
                onClick={() => setStrokeColor(color)}
                className={`w-full aspect-square rounded cursor-pointer border transition ${
                  strokeColor === color 
                    ? `border-2 border-yellow-400 scale-110` 
                    : `border ${darkMode ? 'border-gray-700' : 'border-gray-300'}`
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* SIZES SECTION */}
        <div className={`p-3 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className={`text-xs font-semibold mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>SIZES & FONT</div>
          <div className="space-y-2">
            <div>
              <div className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pen: {penSize}px</div>
              <input
                type="range"
                min="1"
                max="30"
                value={penSize}
                onChange={(e) => setPenSize(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <div className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Font: {fontSize}px</div>
              <input
                type="range"
                min="8"
                max="72"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className={`text-xs mb-1 block ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Font Style</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className={`w-full px-2 py-1 rounded text-xs border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              >
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
                <option value="Comic Sans MS">Comic Sans</option>
                <option value="Trebuchet MS">Trebuchet MS</option>
                <option value="Impact">Impact</option>
              </select>
            </div>
          </div>
        </div>

        {/* SCROLLABLE SECTION - Stats & More */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Stats */}
          {shapes.length > 0 && (
            <div className={`p-2 rounded text-xs ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
              <div className={`font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Shapes: {shapes.length}</div>
              <div className={`text-xs space-y-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {Object.entries(getShapeStats()).map(([type, count]) => 
                  count > 0 && <div key={type} className="capitalize">{type}: {count}</div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <button
            onClick={handleDeleteAllShapes}
            className={`w-full px-2 py-1.5 rounded text-xs font-medium transition ${
              darkMode ? 'bg-red-900 hover:bg-red-800 text-red-200' : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            Delete All
          </button>

          {/* Theme */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-full px-2 py-1.5 rounded text-xs font-medium transition ${
              darkMode ? 'bg-blue-900 hover:bg-blue-800 text-blue-200' : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>

        {/* PROPERTIES PANEL - Bottom */}
        {selectedShape && (
          <div className={`p-3 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} max-h-48 overflow-y-auto`}>
            <div className={`text-xs font-semibold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>PROPERTIES</div>
            <div className="space-y-2 text-xs">
              {/* Fill Color */}
              {selectedShape.type !== 'line' && selectedShape.type !== 'arrow' && selectedShape.type !== 'pen' && (
                <div>
                  <label className={`block mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Fill</label>
                  <div className="flex gap-1">
                    <input
                      type="color"
                      value={selectedShape.fill}
                      onChange={(e) => updateSelectedShapes({ fill: e.target.value })}
                      className={`w-8 h-6 rounded cursor-pointer border ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}
                    />
                    <input
                      type="text"
                      value={selectedShape.fill}
                      onChange={(e) => updateSelectedShapes({ fill: e.target.value })}
                      className={`flex-1 px-1 py-0.5 rounded border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    />
                  </div>
                </div>
              )}

              {/* Stroke */}
              <div>
                <label className={`block mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Stroke</label>
                <div className="flex gap-1">
                  <input
                    type="color"
                    value={selectedShape.stroke}
                    onChange={(e) => updateSelectedShapes({ stroke: e.target.value })}
                    className={`w-8 h-6 rounded cursor-pointer border ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}
                  />
                  <input
                    type="text"
                    value={selectedShape.stroke}
                    onChange={(e) => updateSelectedShapes({ stroke: e.target.value })}
                    className={`flex-1 px-1 py-0.5 rounded border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>
              </div>

              {/* Font Family - Only for text */}
              {selectedShape.type === 'text' && (
                <div>
                  <label className={`block mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Font</label>
                  <select
                    value={selectedShape.fontFamily || 'Arial'}
                    onChange={(e) => updateSelectedShapes({ fontFamily: e.target.value })}
                    className={`w-full px-1 py-0.5 rounded border text-xs ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  >
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Comic Sans MS">Comic Sans</option>
                    <option value="Trebuchet MS">Trebuchet MS</option>
                    <option value="Impact">Impact</option>
                  </select>
                </div>
              )}

              {/* Position & Size - Compact */}
              <div className="grid grid-cols-4 gap-1">
                <div>
                  <label className={`block text-xs mb-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>X</label>
                  <input
                    type="number"
                    value={Math.round(selectedShape.x)}
                    onChange={(e) => updateSelectedShapes({ x: parseFloat(e.target.value) })}
                    className={`w-full px-1 py-0.5 rounded border text-xs ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs mb-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Y</label>
                  <input
                    type="number"
                    value={Math.round(selectedShape.y)}
                    onChange={(e) => updateSelectedShapes({ y: parseFloat(e.target.value) })}
                    className={`w-full px-1 py-0.5 rounded border text-xs ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs mb-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>W</label>
                  <input
                    type="number"
                    value={Math.round(selectedShape.width)}
                    onChange={(e) => updateSelectedShapes({ width: parseFloat(e.target.value) })}
                    className={`w-full px-1 py-0.5 rounded border text-xs ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs mb-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>H</label>
                  <input
                    type="number"
                    value={Math.round(selectedShape.height)}
                    onChange={(e) => updateSelectedShapes({ height: parseFloat(e.target.value) })}
                    className={`w-full px-1 py-0.5 rounded border text-xs ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-lg w-96 p-6`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Share Canvas</h2>
              <button
                onClick={() => setShowShareModal(false)}
                className={`p-1 rounded ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                User Email or ID
              </label>
              <input
                type="text"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder="Enter email or user ID"
                className={`w-full px-3 py-2 rounded border ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                disabled={isSharing}
              />
            </div>

            {shareMessage && (
              <div className={`mb-4 p-3 rounded flex items-center gap-2 ${
                shareMessage.type === 'success'
                  ? darkMode ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-800'
                  : darkMode ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-800'
              }`}>
                {shareMessage.type === 'success' ? <Check size={16} /> : <X size={16} />}
                <span className="text-sm">{shareMessage.text}</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleShareCanvas([shareEmail])}
                disabled={!shareEmail.trim() || isSharing}
                className={`flex-1 px-4 py-2 rounded font-medium text-sm flex items-center justify-center gap-2 ${
                  isSharing || !shareEmail.trim()
                    ? darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-500'
                    : darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isSharing ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <Share2 size={16} />
                    Share Canvas
                  </>
                )}
              </button>
              <button
                onClick={() => setShowShareModal(false)}
                disabled={isSharing}
                className={`px-4 py-2 rounded font-medium text-sm ${
                  darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanvasEditorNew;
