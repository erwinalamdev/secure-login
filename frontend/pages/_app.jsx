import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { tokenUtils } from '../lib/api';

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // Check authentication on app load
    const checkAuth = async () => {
      const isAuth = tokenUtils.isAuthenticated();
      const isAuthPage = router.pathname === '/login' || router.pathname === '/register';
      
      if (!isAuth && !isAuthPage && router.pathname !== '/') {
        router.push('/login');
      } else if (isAuth && isAuthPage) {
        router.push('/dashboard');
      }
    };

    checkAuth();
  }, [router.pathname]);

  return (
    <>
      <Component {...pageProps} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}

export default MyApp; 