import React from 'react';
import { useParams } from 'react-router-dom';
import CanvasEditorNew from '../components/CanvasEditorNew';

interface User {
  id: string;
  username: string;
  email: string;
}

const CanvasPage: React.FC<{ user: User; token: string }> = ({ token }) => {
  const { canvasId } = useParams<{ canvasId: string }>();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  return (
    <CanvasEditorNew
      canvasId={canvasId}
      token={token}
      API_URL={API_URL}
    />
  );
};

export default CanvasPage;
