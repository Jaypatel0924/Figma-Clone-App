import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LogOut, Settings, Search, Trash2, Copy } from 'lucide-react';
import axios from 'axios';

interface Canvas {
  _id: string;
  name: string;
  updatedAt: string;
  thumbnail?: string;
  isPublic: boolean;
  version: number;
}

interface User {
  id: string;
  username: string;
  email: string;
}

const Dashboard: React.FC<{ user: User; token: string; onLogout: () => void }> = ({ user, token, onLogout }) => {
  const navigate = useNavigate();
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewCanvasModal, setShowNewCanvasModal] = useState(false);
  const [newCanvasName, setNewCanvasName] = useState('');
  const [creatingCanvas, setCreatingCanvas] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  // Fetch canvases
  useEffect(() => {
    fetchCanvases();
  }, []);

  const fetchCanvases = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/canvas`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCanvases(response.data.canvases || []);
      setError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to load canvases';
      setError(errorMessage);
      console.error('Fetch canvases error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewCanvas = async () => {
    if (!newCanvasName.trim()) {
      setError('Canvas name cannot be empty');
      return;
    }

    setCreatingCanvas(true);
    try {
      const response = await axios.post(
        `${API_URL}/canvas`,
        {
          name: newCanvasName,
          shapes: [],
          thumbnail: ''
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const newCanvas = response.data.canvas;
      setCanvases([newCanvas, ...canvases]);
      setNewCanvasName('');
      setShowNewCanvasModal(false);

      // Navigate to the new canvas
      navigate(`/canvas/${newCanvas._id}`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to create canvas';
      setError(errorMessage);
      console.error('Create canvas error:', err);
    } finally {
      setCreatingCanvas(false);
    }
  };

  const handleDeleteCanvas = async (canvasId: string) => {
    if (!window.confirm('Are you sure you want to delete this canvas?')) return;

    try {
      await axios.delete(`${API_URL}/canvas/${canvasId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setCanvases(canvases.filter(c => c._id !== canvasId));
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to delete canvas';
      setError(errorMessage);
      console.error('Delete canvas error:', err);
    }
  };

  const handleDuplicateCanvas = async (canvasId: string) => {
    try {
      const response = await axios.post(
        `${API_URL}/canvas/${canvasId}/duplicate`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const duplicatedCanvas = response.data.canvas;
      setCanvases([duplicatedCanvas, ...canvases]);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to duplicate canvas';
      setError(errorMessage);
      console.error('Duplicate canvas error:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
    navigate('/');
  };

  const filteredCanvases = canvases.filter(canvas =>
    canvas.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Top Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center sticky top-0 z-40">
        <div>
          <h1 className="text-2xl font-bold text-blue-400">Canvas Editor</h1>
          <p className="text-sm text-gray-400">Manage your designs</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-300">Welcome, <span className="font-semibold">{user.username}</span></p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          
          <div className="w-px h-8 bg-gray-600" />
          
          <button
            onClick={() => navigate('/settings')}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings size={20} />
          </button>
          
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-red-900 rounded-lg transition-colors text-red-400"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold">Your Canvases</h2>
            <p className="text-gray-400 mt-1">{filteredCanvases.length} canvas{filteredCanvases.length !== 1 ? 'es' : ''}</p>
          </div>

          <button
            onClick={() => setShowNewCanvasModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            New Canvas
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-3 text-gray-500" />
            <input
              type="text"
              placeholder="Search canvases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
            />
          </div>
        </div>

        {/* Canvas Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading canvases...</p>
            </div>
          </div>
        ) : filteredCanvases.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-6xl mb-4">📐</div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No canvases yet</h3>
            <p className="text-gray-400 mb-4">Create your first design to get started</p>
            <button
              onClick={() => setShowNewCanvasModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus size={20} />
              Create Canvas
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCanvases.map(canvas => (
              <div
                key={canvas._id}
                className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-blue-500 transition-colors group"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center relative group-hover:from-gray-600 group-hover:to-gray-700 transition-colors cursor-pointer"
                  onClick={() => navigate(`/canvas/${canvas._id}`)}>
                  <div className="text-5xl opacity-30">📐</div>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/canvas/${canvas._id}`);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Open
                    </button>
                  </div>
                </div>

                {/* Canvas Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-white truncate">{canvas.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {new Date(canvas.updatedAt).toLocaleDateString()} at {new Date(canvas.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    {canvas.isPublic && (
                      <span className="text-xs bg-green-900 text-green-200 px-2 py-1 rounded">Public</span>
                    )}
                    <span className="text-xs text-gray-500">v{canvas.version}</span>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => navigate(`/canvas/${canvas._id}`)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded text-sm transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        handleDuplicateCanvas(canvas._id);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded text-sm transition-colors flex items-center gap-1"
                      title="Duplicate Canvas"
                    >
                      <Copy size={16} />
                      Copy
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this canvas?')) {
                          handleDeleteCanvas(canvas._id);
                        }
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded text-sm transition-colors flex items-center gap-1"
                      title="Delete Canvas"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Canvas Modal */}
      {showNewCanvasModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Create New Canvas</h2>
            
            <input
              type="text"
              value={newCanvasName}
              onChange={(e) => setNewCanvasName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateNewCanvas()}
              placeholder="Enter canvas name..."
              autoFocus
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowNewCanvasModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewCanvas}
                disabled={creatingCanvas || !newCanvasName.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                {creatingCanvas ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
