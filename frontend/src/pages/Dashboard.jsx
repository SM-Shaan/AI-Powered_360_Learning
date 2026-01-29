import { useAuth } from '../contexts/AuthContext';
import StudentDashboard from './StudentDashboard';
import AdminDashboard from './AdminDashboard';

function Dashboard() {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Render admin or student dashboard based on user role
  return isAdmin ? <AdminDashboard /> : <StudentDashboard />;
}

export default Dashboard;
