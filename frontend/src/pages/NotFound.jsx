import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search, BookOpen } from 'lucide-react';
import { Button } from '../components/ui/button';

function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-9xl font-bold text-emerald-600/20">404</div>
          <div className="relative -mt-16">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <BookOpen className="h-12 w-12 text-emerald-600" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h1>
        <p className="text-gray-600 mb-8">
          Oops! The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/browse">
              <Search className="mr-2 h-4 w-4" />
              Browse Materials
            </Link>
          </Button>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Here are some helpful links:</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link to="/dashboard" className="text-emerald-600 hover:text-emerald-700 hover:underline">
              Dashboard
            </Link>
            <span className="text-gray-300">|</span>
            <Link to="/browse" className="text-emerald-600 hover:text-emerald-700 hover:underline">
              Browse Content
            </Link>
            <span className="text-gray-300">|</span>
            <Link to="/upload" className="text-emerald-600 hover:text-emerald-700 hover:underline">
              Upload
            </Link>
            <span className="text-gray-300">|</span>
            <Link to="/about" className="text-emerald-600 hover:text-emerald-700 hover:underline">
              About
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
