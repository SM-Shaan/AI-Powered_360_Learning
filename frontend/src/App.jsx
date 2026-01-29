import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Browse from './pages/Browse';
import Upload from './pages/Upload';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import './App.css';

// Layout component that conditionally wraps content
function Layout({ children }) {
  const location = useLocation();

  // Pages that have their own full-width layout
  const fullWidthPages = ['/', '/about'];
  const isFullWidth = fullWidthPages.includes(location.pathname);

  if (isFullWidth) {
    return <>{children}</>;
  }

  // Other pages get the container wrapper
  return (
    <main className="container max-w-7xl mx-auto px-4 py-8">
      {children}
    </main>
  );
}

function AppContent() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <Layout>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes - require authentication */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/browse"
            element={
              <ProtectedRoute>
                <Browse />
              </ProtectedRoute>
            }
          />

          {/* Admin only routes */}
          <Route
            path="/upload"
            element={
              <ProtectedRoute requireAdmin>
                <Upload />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
