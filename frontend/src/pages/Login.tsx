import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, Loader2 } from 'lucide-react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../components/context/AuthContext';
import { BACKEND_URL } from '../config';
import LoadingOverlay from '../components/LoadingOverlay';
import { GoogleLogo } from '../components/googllogo';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showColdStartMessage, setShowColdStartMessage] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Improved cold start handling with retry mechanism
  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowColdStartMessage(true);

    const makeLoginRequest = async (retryCount = 0): Promise<any> => {
      try {
        const response = await axios.post<{ token: string; user: { id: string; email: string; username: string } }>(
          `${BACKEND_URL}/auth/login`,
          formData,
          { 
            headers: { 'Content-Type': 'application/json' },
            timeout: retryCount === 0 ? 50000 : 30000 // Longer timeout for first attempt
          }
        );
        return response;
      } catch (error: any) {
        if (retryCount < 2 && error.code === 'ECONNABORTED') {
          // If timeout, retry up to 2 times
          return makeLoginRequest(retryCount + 1);
        }
        throw error;
      }
    };

    try {
      const response = await makeLoginRequest();

      if (response.status === 200) {
        const { token, user } = response.data;

        if (!user || !token) {
          console.error("Login response missing user or token!");
          toast.error("Login failed. Missing username.");
          return;
        }

        login(user, token);
        toast.success('Login successful!', { autoClose: 2000 });
        setTimeout(() => navigate('/dashboard'), 2500);
      }
    } catch (error: any) {
      console.error("Login error:", error.response?.data);
      toast.error(
        error.code === 'ECONNABORTED'
          ? 'Server is taking too long to respond. Please try again.'
          : error.response?.data?.message || 'Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
      setShowColdStartMessage(false);
    }
  }, [formData, login, navigate]);

  const handleGoogleLogin = () => {
    window.location.href = `${BACKEND_URL}/auth/google`;
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex justify-center items-center p-4 sm:p-6">
      <ToastContainer position="top-right" />
      {showColdStartMessage && (
        <LoadingOverlay message="Logging you in..." />
      )}
      <div className="flex flex-col md:flex-row w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="w-full md:w-1/2 p-6 sm:p-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
              <p className="mt-2 text-gray-600">Please sign in to continue</p>
            </div>

            <div className="flex flex-col space-y-4">
              <div className="flex justify-center">
                <button 
                  onClick={handleGoogleLogin} 
                  className="flex items-center justify-center w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <GoogleLogo />
                  <span className="ml-2 text-sm font-medium text-gray-700">Sign in with Google</span>
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>Email</span>
                    </div>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <div className="flex items-center space-x-2">
                      <Lock className="w-4 h-4" />
                      <span>Password</span>
                    </div>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 disabled:bg-gray-500"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                <span>{loading ? 'Signing in...' : 'Sign in'}</span>
              </button>
            </form>

            <div className="text-center md:hidden">
              <p className="text-gray-600">Don't have an account?</p>
              <Link
                to="/signup"
                className="mt-2 inline-block text-yellow-500 hover:text-yellow-600 font-semibold"
              >
                Create an account
              </Link>
            </div>
          </div>
        </div>

        <div className="hidden md:block w-1/2 bg-gradient-to-br from-gray-900 to-gray-800 p-12">
          <div className="h-full flex flex-col justify-center">
            <h2 className="text-4xl font-bold text-white mb-6">New here?</h2>
            <p className="text-gray-300 mb-8">
              Join us and start creating amazing websites with AI-powered tools
            </p>
            <Link
              to="https://sitecrafter.vercel.app/signup"
              className="inline-flex items-center justify-center px-8 py-3 border-2 border-white text-white rounded-lg hover:bg-white hover:text-gray-900 transition-colors duration-200"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;