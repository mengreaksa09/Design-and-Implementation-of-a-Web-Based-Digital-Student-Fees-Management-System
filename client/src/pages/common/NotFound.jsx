import { Link } from 'react-router-dom';
import { HomeIcon } from '@heroicons/react/24/outline';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-600">404</h1>
        <h2 className="text-3xl font-bold text-gray-900 mt-4">
          Page Not Found
        </h2>
        <p className="text-gray-600 mt-2 max-w-md mx-auto">
          Sorry, we couldn't find the page you're looking for. The page might
          have been removed, renamed, or is temporarily unavailable.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="btn-primary flex items-center justify-center gap-2"
          >
            <HomeIcon className="h-5 w-5" />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn-secondary"
          >
            Go Back
          </button>
        </div>

        <div className="mt-12">
          <p className="text-sm text-gray-500">
            Need help?{' '}
            <a
              href="mailto:support@feespro.com"
              className="text-primary-600 hover:text-primary-500"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
