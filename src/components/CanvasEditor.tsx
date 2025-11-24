// components/CanvasEditor.tsx - Full Canvas Editor Component with All Shapes & Day/Night Mode
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Square, Circle, ArrowRight, Type, MousePointer,
  ZoomIn, ZoomOut, Maximize, Grid, Download, Upload, Undo, Redo,
  Copy, Trash2, Lock, Unlock, AlignLeft, AlignCenter, AlignRight,
  Save, FolderOpen, Star, Triangle, Hexagon, Sun, Moon
} from 'lucide-react';

// Types
type ShapeType = 'rectangle' | 'circle' | 'line' | 'arrow' | 'text' | 'star' | 'triangle' | 'hexagon' | 'polygon';

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
  endX?: number;
  endY?: number;
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

// Main Canvas Editor Component
const CanvasEditor: React.FC<CanvasEditorProps> = ({ canvasId, token, API_URL }) => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tool, setTool] = useState<'select' | ShapeType>('select');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [gridEnabled, setGridEnabled] = useState(true);
  const [gridSnap, setGridSnap] = useState(false);
  const [clipboard, setClipboard] = useState<Shape[]>([]);
  const [currentCanvas, setCurrentCanvas] = useState<CanvasData | null>(null);
  const [canvasList, setCanvasList] = useState<any[]>([]);
  const [showCanvasList, setShowCanvasList] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  const canvasRef = useRef<HTMLDivElement>(null);
  const stateManager = useRef(new CanvasStateManager());
  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<Point | null>(null);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const GRID_SIZE = 20;
  
  // Theme colors based on mode
  const bgColor = isDarkMode ? '#000000' : '#ffffff';
  const gridColor = isDarkMode ? '#333333' : '#e5e7eb';
  const uiBg = isDarkMode ? '#1a1a1a' : '#f3f4f6';
  const uiBorder = isDarkMode ? '#333333' : '#d1d5db';
  const uiText = isDarkMode ? '#ffffff' : '#000000';

  // Load canvas on mount
  useEffect(() => {
    if (canvasId) {
      loadCanvas(canvasId);
    } else {
      // No canvas ID - start with blank canvas
      setCurrentCanvas({ name: 'Untitled Canvas', shapes: [] });
      setShapes([]);
    }
  }, [canvasId]);

  const loadCanvas = async (id: string) => {
    try {
      const canvas = await ApiService.loadCanvas(id, token, API_URL);
      setShapes(canvas.shapes || []);
      setCurrentCanvas(canvas);
      setSaveStatus('saved');
    } catch (error: any) {
      // If canvas doesn't exist yet (404), start with blank
      if (error.message === 'Failed to load canvas' || error.status === 404) {
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
    setSaveStatus('saving');
    try {
      const canvasData: CanvasData = {
        _id: currentCanvas?._id,
        name: currentCanvas?.name || 'Untitled Canvas',
        shapes,
        thumbnail: ''
      };

      const result = await ApiService.saveCanvas(canvasData, token, API_URL);
      setCurrentCanvas(result.canvas || result);
      setSaveStatus('saved');
      await loadCanvases();
    } catch (error) {
      console.error('Failed to save canvas:', error);
      setSaveStatus('unsaved');
      alert('Failed to save canvas');
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

  const createShape = (type: ShapeType, x: number, y: number, width: number, height: number): Shape => {
    const shape: Shape = {
      id: generateId(),
      type,
      x: snapToGrid(x, GRID_SIZE, gridSnap),
      y: snapToGrid(y, GRID_SIZE, gridSnap),
      width,
      height,
      rotation: 0,
      fill: type === 'line' || type === 'arrow' ? 'none' : '#3b82f6',
      stroke: '#1e40af',
      strokeWidth: 2,
      opacity: 1,
      locked: false,
      zIndex: shapes.length
    };

    if (type === 'text') {
      shape.text = 'Text';
    }
    if (type === 'arrow') {
      shape.endX = x + width;
      shape.endY = y + height;
    }

    return shape;
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

    if (tool !== 'select') {
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

    if (isDrawing && drawStart && tool !== 'select') {
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
    if (isDrawing && drawStart) {
      setShapes(prev => prev.map(s => ({
        ...s,
        id: s.id.replace('temp_', '')
      })));
      pushState();
    }
    if (isDragging) {
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

  const duplicateSelected = () => {
    if (selectedIds.size > 0) {
      pushState();
      const toDuplicate = shapes.filter(s => selectedIds.has(s.id));
      const duplicated = toDuplicate.map(s => ({
        ...s,
        id: generateId(),
        x: s.x + 20,
        y: s.y + 20,
        zIndex: shapes.length
      }));
      setShapes([...shapes, ...duplicated]);
      setSelectedIds(new Set(duplicated.map(s => s.id)));
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

  const bringForward = () => {
    pushState();
    setShapes(prev => {
      const selected = Array.from(selectedIds);
      return prev.map(s => {
        if (selected.includes(s.id)) return { ...s, zIndex: s.zIndex + 1 };
        return s;
      });
    });
  };

  const sendBackward = () => {
    pushState();
    setShapes(prev => {
      const selected = Array.from(selectedIds);
      return prev.map(s => {
        if (selected.includes(s.id) && s.zIndex > 0) return { ...s, zIndex: s.zIndex - 1 };
        return s;
      });
    });
  };

  const alignShapes = (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (selectedIds.size < 2) return;
    pushState();

    const selected = shapes.filter(s => selectedIds.has(s.id));
    const bounds = {
      left: Math.min(...selected.map(s => s.x)),
      right: Math.max(...selected.map(s => s.x + s.width)),
      top: Math.min(...selected.map(s => s.y)),
      bottom: Math.max(...selected.map(s => s.y + s.height))
    };
    const centerX = (bounds.left + bounds.right) / 2;
    const centerY = (bounds.top + bounds.bottom) / 2;

    setShapes(prev => prev.map(s => {
      if (!selectedIds.has(s.id)) return s;
      switch (alignment) {
        case 'left': return { ...s, x: bounds.left };
        case 'right': return { ...s, x: bounds.right - s.width };
        case 'center': return { ...s, x: centerX - s.width / 2 };
        case 'top': return { ...s, y: bounds.top };
        case 'bottom': return { ...s, y: bounds.bottom - s.height };
        case 'middle': return { ...s, y: centerY - s.height / 2 };
        default: return s;
      }
    }));
  };

  const exportJSON = () => {
    const data = JSON.stringify(shapes, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'canvas-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const imported = JSON.parse(e.target?.result as string);
            pushState();
            setShapes(imported);
          } catch (err) {
            alert('Invalid JSON file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      } else if (ctrl && e.key === 'c') {
        e.preventDefault();
        handleCopy();
      } else if (ctrl && e.key === 'v') {
        e.preventDefault();
        handlePaste();
      } else if (ctrl && e.key === 'd') {
        e.preventDefault();
        duplicateSelected();
      } else if (ctrl && e.key === 'a') {
        e.preventDefault();
        setSelectedIds(new Set(shapes.map(s => s.id)));
      } else if (ctrl && e.key === 's') {
        e.preventDefault();
        handleSaveCanvas();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shapes, selectedIds, clipboard, currentCanvas]);

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
      border: isSelected ? `2px solid ${isDarkMode ? '#60a5fa' : '#3b82f6'}` : undefined,
      boxShadow: isSelected ? `0 0 0 2px ${isDarkMode ? 'rgba(96, 165, 250, 0.3)' : 'rgba(59, 130, 246, 0.3)'}` : undefined
    };

    switch (shape.type) {
      case 'rectangle':
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
      case 'circle':
        return (
          <div
            key={shape.id}
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
        return (
          <div
            key={shape.id}
            style={{
              ...baseStyle,
              width: shape.width,
              height: shape.height,
              color: shape.fill,
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {shape.text}
          </div>
        );
      case 'line':
        const angle = Math.atan2((shape.endY || 0) - shape.y, (shape.endX || 0) - shape.x);
        const length = Math.sqrt(Math.pow((shape.endX || 0) - shape.x, 2) + Math.pow((shape.endY || 0) - shape.y, 2));
        return (
          <div
            key={shape.id}
            style={{
              ...baseStyle,
              width: length,
              height: shape.strokeWidth,
              backgroundColor: shape.stroke,
              transform: `rotate(${angle}rad)`,
              transformOrigin: '0 50%'
            }}
          />
        );
      case 'arrow':
        const arrowAngle = Math.atan2((shape.endY || 0) - shape.y, (shape.endX || 0) - shape.x);
        const arrowLength = Math.sqrt(Math.pow((shape.endX || 0) - shape.x, 2) + Math.pow((shape.endY || 0) - shape.y, 2));
        const svgArrow = `
          <line x1="0" y1="${shape.strokeWidth/2}" x2="${arrowLength-10}" y2="${shape.strokeWidth/2}" 
                stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}"/>
          <polygon points="${arrowLength-10},0 ${arrowLength},${shape.strokeWidth/2} ${arrowLength-10},${shape.strokeWidth}" 
                   fill="${shape.stroke}"/>
        `;
        return (
          <svg
            key={shape.id}
            style={{
              ...baseStyle,
              transform: `rotate(${arrowAngle}rad)`,
              transformOrigin: '0 50%'
            }}
            width={arrowLength}
            height={shape.strokeWidth + 2}
            dangerouslySetInnerHTML={{ __html: svgArrow }}
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
          <svg
            key={shape.id}
            style={baseStyle}
            width={shape.width}
            height={shape.height}
            viewBox={`0 0 ${shape.width} ${shape.height}`}
            dangerouslySetInnerHTML={{ __html: svgStar }}
          />
        );
      case 'triangle':
        const svgTriangle = `
          <polygon points="${shape.width/2},0 ${shape.width},${shape.height} 0,${shape.height}" 
                   fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}"/>
        `;
        return (
          <svg
            key={shape.id}
            style={baseStyle}
            width={shape.width}
            height={shape.height}
            viewBox={`0 0 ${shape.width} ${shape.height}`}
            dangerouslySetInnerHTML={{ __html: svgTriangle }}
          />
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
          <svg
            key={shape.id}
            style={baseStyle}
            width={shape.width}
            height={shape.height}
            viewBox={`0 0 ${shape.width} ${shape.height}`}
            dangerouslySetInnerHTML={{ __html: svgHex }}
          />
        );
      case 'polygon':
        // Pentagon by default for polygon
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
          <svg
            key={shape.id}
            style={baseStyle}
            width={shape.width}
            height={shape.height}
            viewBox={`0 0 ${shape.width} ${shape.height}`}
            dangerouslySetInnerHTML={{ __html: svgPoly }}
          />
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

  return (
    <div className="flex h-full" style={{ backgroundColor: isDarkMode ? '#1a1a1a' : '#f3f4f6', color: uiText }}>
      {/* Left Sidebar */}
      <div className="w-16 flex flex-col items-center py-4 space-y-2" style={{ backgroundColor: isDarkMode ? '#262626' : '#e5e7eb', borderRight: `1px solid ${uiBorder}` }}>
        <button
          onClick={() => setTool('select')}
          className={`p-3 rounded ${tool === 'select' ? 'bg-blue-600' : ''}`}
          style={{
            backgroundColor: tool === 'select' ? '#2563eb' : 'transparent',
            color: uiText
          }}
          title="Select (V)"
        >
          <MousePointer size={20} />
        </button>
        <button
          onClick={() => setTool('rectangle')}
          className={`p-3 rounded ${tool === 'rectangle' ? 'bg-blue-600' : ''}`}
          style={{
            backgroundColor: tool === 'rectangle' ? '#2563eb' : 'transparent',
            color: uiText
          }}
          title="Rectangle (R)"
        >
          <Square size={20} />
        </button>
        <button
          onClick={() => setTool('circle')}
          className={`p-3 rounded ${tool === 'circle' ? 'bg-blue-600' : ''}`}
          style={{
            backgroundColor: tool === 'circle' ? '#2563eb' : 'transparent',
            color: uiText
          }}
          title="Circle (C)"
        >
          <Circle size={20} />
        </button>
        <button
          onClick={() => setTool('arrow')}
          className={`p-3 rounded ${tool === 'arrow' ? 'bg-blue-600' : ''}`}
          style={{
            backgroundColor: tool === 'arrow' ? '#2563eb' : 'transparent',
            color: uiText
          }}
          title="Arrow (A)"
        >
          <ArrowRight size={20} />
        </button>
        <button
          onClick={() => setTool('text')}
          className={`p-3 rounded ${tool === 'text' ? 'bg-blue-600' : ''}`}
          style={{
            backgroundColor: tool === 'text' ? '#2563eb' : 'transparent',
            color: uiText
          }}
          title="Text (T)"
        >
          <Type size={20} />
        </button>
        <button
          onClick={() => setTool('star')}
          className={`p-3 rounded ${tool === 'star' ? 'bg-blue-600' : ''}`}
          style={{
            backgroundColor: tool === 'star' ? '#2563eb' : 'transparent',
            color: uiText
          }}
          title="Star"
        >
          <Star size={20} />
        </button>
        <button
          onClick={() => setTool('triangle')}
          className={`p-3 rounded ${tool === 'triangle' ? 'bg-blue-600' : ''}`}
          style={{
            backgroundColor: tool === 'triangle' ? '#2563eb' : 'transparent',
            color: uiText
          }}
          title="Triangle"
        >
          <Triangle size={20} />
        </button>
        <button
          onClick={() => setTool('hexagon')}
          className={`p-3 rounded ${tool === 'hexagon' ? 'bg-blue-600' : ''}`}
          style={{
            backgroundColor: tool === 'hexagon' ? '#2563eb' : 'transparent',
            color: uiText
          }}
          title="Hexagon"
        >
          <Hexagon size={20} />
        </button>
        <button
          onClick={() => setTool('polygon')}
          className={`p-3 rounded ${tool === 'polygon' ? 'bg-blue-600' : ''}`}
          style={{
            backgroundColor: tool === 'polygon' ? '#2563eb' : 'transparent',
            color: uiText
          }}
          title="Polygon"
        >
          <Circle size={20} />
        </button>
        <button
          onClick={() => setTool('line')}
          className={`p-3 rounded ${tool === 'line' ? 'bg-blue-600' : ''}`}
          style={{
            backgroundColor: tool === 'line' ? '#2563eb' : 'transparent',
            color: uiText
          }}
          title="Line (L)"
        >
          <ArrowRight size={20} style={{ transform: 'rotate(-90deg)' }} />
        </button>
        <div className="flex-1" />
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-3 rounded ${isDarkMode ? 'bg-blue-600' : ''}`}
          style={{
            backgroundColor: isDarkMode ? '#2563eb' : 'transparent',
            color: uiText
          }}
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="h-14 flex items-center justify-between px-4 overflow-x-auto" style={{ backgroundColor: isDarkMode ? '#262626' : '#e5e7eb', borderBottom: `1px solid ${uiBorder}` }}>
          <div className="flex items-center space-x-2">
            <button onClick={handleNewCanvas} className="p-2 rounded whitespace-nowrap text-sm" style={{ backgroundColor: 'transparent', color: uiText }} title="New Canvas">
              New
            </button>
            <button onClick={handleSaveCanvas} className="p-2 rounded flex items-center gap-1 whitespace-nowrap text-sm" style={{ backgroundColor: 'transparent', color: uiText }} title="Save (Ctrl+S)">
              <Save size={16} />
              {saveStatus === 'saving' && <span className="text-xs">Saving...</span>}
              {saveStatus === 'saved' && <span className="text-xs text-green-400">Saved</span>}
              {saveStatus === 'unsaved' && <span className="text-xs text-yellow-400">Unsaved</span>}
            </button>
            <button onClick={() => { loadCanvases(); setShowCanvasList(!showCanvasList); }} className="p-2 rounded text-sm" style={{ backgroundColor: 'transparent', color: uiText }} title="Open Canvas">
              <FolderOpen size={16} />
            </button>
            <div className="w-px h-6" style={{ backgroundColor: uiBorder }} />
            <button onClick={handleUndo} className="p-2 rounded" style={{ backgroundColor: 'transparent', color: uiText }} title="Undo (Ctrl+Z)">
              <Undo size={16} />
            </button>
            <button onClick={handleRedo} className="p-2 rounded" style={{ backgroundColor: 'transparent', color: uiText }} title="Redo (Ctrl+Y)">
              <Redo size={16} />
            </button>
            <div className="w-px h-6" style={{ backgroundColor: uiBorder }} />
            <button onClick={handleCopy} className="p-2 rounded" style={{ backgroundColor: 'transparent', color: uiText }} title="Copy (Ctrl+C)">
              <Copy size={16} />
            </button>
            <button onClick={duplicateSelected} className="p-2 rounded" style={{ backgroundColor: 'transparent', color: uiText }} title="Duplicate (Ctrl+D)">
              <Copy size={16} />
            </button>
            <button onClick={deleteSelected} className="p-2 rounded" style={{ backgroundColor: 'transparent', color: uiText }} title="Delete">
              <Trash2 size={16} />
            </button>
            <div className="w-px h-6" style={{ backgroundColor: uiBorder }} />
            <button onClick={() => alignShapes('left')} className="p-2 rounded" style={{ backgroundColor: 'transparent', color: uiText }} title="Align Left">
              <AlignLeft size={16} />
            </button>
            <button onClick={() => alignShapes('center')} className="p-2 rounded" style={{ backgroundColor: 'transparent', color: uiText }} title="Align Center">
              <AlignCenter size={16} />
            </button>
            <button onClick={() => alignShapes('right')} className="p-2 rounded" style={{ backgroundColor: 'transparent', color: uiText }} title="Align Right">
              <AlignRight size={16} />
            </button>
            <div className="w-px h-6" style={{ backgroundColor: uiBorder }} />
            <button onClick={bringForward} className="p-2 rounded text-sm" style={{ backgroundColor: 'transparent', color: uiText }} title="Bring Forward">
              ↑
            </button>
            <button onClick={sendBackward} className="p-2 rounded text-sm" style={{ backgroundColor: 'transparent', color: uiText }} title="Send Backward">
              ↓
            </button>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="p-2 rounded" style={{ backgroundColor: 'transparent', color: uiText }}>
              <ZoomOut size={16} />
            </button>
            <span className="text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(5, z + 0.1))} className="p-2 rounded" style={{ backgroundColor: 'transparent', color: uiText }}>
              <ZoomIn size={16} />
            </button>
            <button onClick={() => setZoom(1)} className="p-2 rounded" style={{ backgroundColor: 'transparent', color: uiText }}>
              <Maximize size={16} />
            </button>
            <button
              onClick={() => setGridEnabled(!gridEnabled)}
              className={`p-2 rounded ${gridEnabled ? 'bg-blue-600' : ''}`}
              style={{
                backgroundColor: gridEnabled ? '#2563eb' : 'transparent',
                color: uiText
              }}
              title="Toggle Grid"
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setGridSnap(!gridSnap)}
              className={`p-2 rounded text-xs ${gridSnap ? 'bg-blue-600' : ''}`}
              style={{
                backgroundColor: gridSnap ? '#2563eb' : 'transparent',
                color: uiText
              }}
              title="Toggle Snap to Grid"
            >
              SNAP
            </button>
            <div className="w-px h-6" style={{ backgroundColor: uiBorder }} />
            <button onClick={exportJSON} className="p-2 rounded" style={{ backgroundColor: 'transparent', color: uiText }} title="Export JSON">
              <Download size={16} />
            </button>
            <button onClick={importJSON} className="p-2 rounded" style={{ backgroundColor: 'transparent', color: uiText }} title="Import JSON">
              <Upload size={16} />
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-hidden relative" style={{ backgroundColor: bgColor }}>
          <div
            ref={canvasRef}
            className="w-full h-full relative"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{
              cursor: isPanning ? 'grabbing' : tool === 'select' ? 'default' : 'crosshair',
              backgroundImage: gridEnabled
                ? `linear-gradient(${gridColor} 1px, transparent 1px), linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`
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
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div style={{ backgroundColor: uiBg, color: uiText }} className="rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Your Canvases</h2>
                  <button onClick={() => setShowCanvasList(false)} className="opacity-50 hover:opacity-100">
                    ✕
                  </button>
                </div>
                {canvasList.length === 0 ? (
                  <p className="text-gray-400">No canvases yet. Create your first one!</p>
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
                          Updated: {canvas.updatedAt ? new Date(canvas.updatedAt).toLocaleDateString() : '—'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Properties Panel */}
      {selectedShape && (
        <div className="w-64 p-4 overflow-y-auto" style={{ backgroundColor: isDarkMode ? '#262626' : '#e5e7eb', borderLeft: `1px solid ${uiBorder}`, color: uiText }}>
          <h3 className="text-lg font-semibold mb-4">Properties</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1" style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>Type</label>
              <div className="capitalize text-sm">{selectedShape.type}</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm mb-1" style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>X</label>
                <input
                  type="number"
                  value={Math.round(selectedShape.x)}
                  onChange={(e) => updateSelectedShapes({ x: parseFloat(e.target.value) })}
                  style={{
                    backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
                    borderColor: uiBorder,
                    color: uiText
                  }}
                  className="w-full px-2 py-1 border rounded text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>Y</label>
                <input
                  type="number"
                  value={Math.round(selectedShape.y)}
                  onChange={(e) => updateSelectedShapes({ y: parseFloat(e.target.value) })}
                  style={{
                    backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
                    borderColor: uiBorder,
                    color: uiText
                  }}
                  className="w-full px-2 py-1 border rounded text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm mb-1" style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>Width</label>
                <input
                  type="number"
                  value={Math.round(selectedShape.width)}
                  onChange={(e) => updateSelectedShapes({ width: parseFloat(e.target.value) })}
                  style={{
                    backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
                    borderColor: uiBorder,
                    color: uiText
                  }}
                  className="w-full px-2 py-1 border rounded text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>Height</label>
                <input
                  type="number"
                  value={Math.round(selectedShape.height)}
                  onChange={(e) => updateSelectedShapes({ height: parseFloat(e.target.value) })}
                  style={{
                    backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
                    borderColor: uiBorder,
                    color: uiText
                  }}
                  className="w-full px-2 py-1 border rounded text-sm focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1" style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>Rotation</label>
              <input
                type="number"
                value={selectedShape.rotation}
                onChange={(e) => updateSelectedShapes({ rotation: parseFloat(e.target.value) })}
                style={{
                  backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
                  borderColor: uiBorder,
                  color: uiText
                }}
                className="w-full px-2 py-1 border rounded text-sm focus:outline-none"
              />
            </div>

            {selectedShape.type !== 'line' && selectedShape.type !== 'arrow' && (
              <div>
                <label className="block text-sm mb-1" style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>Fill Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={selectedShape.fill}
                    onChange={(e) => updateSelectedShapes({ fill: e.target.value })}
                    className="w-12 h-8 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedShape.fill}
                    onChange={(e) => updateSelectedShapes({ fill: e.target.value })}
                    style={{
                      backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
                      borderColor: uiBorder,
                      color: uiText
                    }}
                    className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm mb-1" style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>Stroke Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={selectedShape.stroke}
                  onChange={(e) => updateSelectedShapes({ stroke: e.target.value })}
                  className="w-12 h-8 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={selectedShape.stroke}
                  onChange={(e) => updateSelectedShapes({ stroke: e.target.value })}
                  style={{
                    backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
                    borderColor: uiBorder,
                    color: uiText
                  }}
                  className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1" style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>Stroke Width</label>
              <input
                type="number"
                value={selectedShape.strokeWidth}
                onChange={(e) => updateSelectedShapes({ strokeWidth: parseFloat(e.target.value) })}
                style={{
                  backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
                  borderColor: uiBorder,
                  color: uiText
                }}
                className="w-full px-2 py-1 border rounded text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm mb-1" style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>Opacity</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={selectedShape.opacity}
                onChange={(e) => updateSelectedShapes({ opacity: parseFloat(e.target.value) })}
                className="w-full"
              />
              <div className="text-sm text-center" style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>{Math.round(selectedShape.opacity * 100)}%</div>
            </div>

            {selectedShape.type === 'text' && (
              <div>
                <label className="block text-sm mb-1" style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>Text Content</label>
                <input
                  type="text"
                  value={selectedShape.text || ''}
                  onChange={(e) => updateSelectedShapes({ text: e.target.value })}
                  style={{
                    backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
                    borderColor: uiBorder,
                    color: uiText
                  }}
                  className="w-full px-2 py-1 border rounded text-sm focus:outline-none"
                />
              </div>
            )}

            <div>
              <button
                onClick={() => updateSelectedShapes({ locked: !selectedShape.locked })}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded text-sm font-semibold"
                style={{
                  backgroundColor: selectedShape.locked ? '#dc2626' : '#2563eb',
                  color: '#ffffff'
                }}
              >
                {selectedShape.locked ? <Lock size={14} /> : <Unlock size={14} />}
                {selectedShape.locked ? 'Locked' : 'Unlocked'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanvasEditor;
