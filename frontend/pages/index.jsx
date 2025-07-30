import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { tokenUtils } from '../lib/api';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (tokenUtils.isAuthenticated()) {
      router.push('/dashboard');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-primary-900 mb-6">
            Secure Login System
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            A comprehensive and secure authentication system built with Express.js backend 
            and Next.js frontend, featuring advanced security measures and modern UI.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/login">
              <button className="btn-primary text-lg px-8 py-3">
                Login
              </button>
            </Link>
            <Link href="/register">
              <button className="btn-secondary text-lg px-8 py-3">
                Create Account
              </button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="card text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Secure Authentication</h3>
            <p className="text-gray-600">
              JWT tokens, password hashing, and rate limiting ensure your data stays protected.
            </p>
          </div>

          <div className="card text-center">
            <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Modern UI/UX</h3>
            <p className="text-gray-600">
              Beautiful, responsive design built with Tailwind CSS and React.
            </p>
          </div>

          <div className="card text-center">
            <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">High Performance</h3>
            <p className="text-gray-600">
              Optimized for speed with efficient database queries and caching.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t border-gray-200">
          <p className="text-gray-600">
            Built with ❤️ by Erwin Alam Syah Putra
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Full Stack Web Developer • erwinalam.dev
          </p>
        </div>
      </div>
    </div>
  );
} 