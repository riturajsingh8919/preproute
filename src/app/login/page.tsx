'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/axios';
import { Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setApiError('');
      const response = await api.post('/auth/login', {
        userId: data.userId,
        password: data.password,
      });

      if (response.data.status === 'success' || response.data.data?.token) {
        setAuth(response.data.data.token, response.data.data.user || { name: data.userId });
        router.push('/');
      } else {
        setApiError(response.data.message || 'Login failed. Please try again.');
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const err = error as { response?: { data?: { message?: string } } };
        setApiError(err.response?.data?.message || 'An error occurred. Please try again.');
      } else {
        setApiError('An error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex w-full" style={{ backgroundColor: '#EEF1F9' }}>
      {/* Left side - Illustration */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12">
        <div className="relative w-full max-w-100 flex items-center justify-center">
          {/* Figma illustration – lab beaker at a desk */}
          <svg viewBox="0 0 400 380" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-95">
            {/* desk */}
            <rect x="60" y="280" width="280" height="12" rx="4" fill="#9ca3af"/>
            {/* desk legs */}
            <rect x="80" y="292" width="10" height="50" rx="2" fill="#9ca3af"/>
            <rect x="310" y="292" width="10" height="50" rx="2" fill="#9ca3af"/>
            {/* laptop */}
            <rect x="160" y="200" width="130" height="80" rx="6" fill="#e5e7eb"/>
            <rect x="165" y="204" width="120" height="70" rx="4" fill="#bfdbfe"/>
            <rect x="145" y="278" width="160" height="8" rx="4" fill="#d1d5db"/>
            {/* beaker body */}
            <ellipse cx="120" cy="178" rx="28" ry="6" fill="#bfdbfe"/>
            <path d="M92 178 L80 270 Q80 278 92 278 L148 278 Q160 278 160 270 L148 178 Z" fill="white" stroke="#93c5fd" strokeWidth="2"/>
            <path d="M92 178 L80 270 Q80 278 92 278 L148 278 Q160 278 160 270 L148 178" fill="#bfdbfe" fillOpacity="0.3"/>
            {/* liquid in beaker */}
            <path d="M84 240 Q100 235 120 240 Q140 245 156 240 L156 268 Q156 276 148 276 L92 276 Q84 276 84 268 Z" fill="#60a5fa" fillOpacity="0.6"/>
            {/* beaker face */}
            <circle cx="108" cy="215" r="4" fill="#1e3a5f"/>
            <circle cx="132" cy="215" r="4" fill="#1e3a5f"/>
            <path d="M108 228 Q120 236 132 228" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round"/>
            {/* beaker cap */}
            <rect x="98" y="138" width="44" height="12" rx="3" fill="#93c5fd"/>
            <rect x="112" y="126" width="16" height="14" rx="2" fill="#93c5fd"/>
            {/* beaker arms */}
            <path d="M92 200 Q70 210 62 230" stroke="#93c5fd" strokeWidth="8" strokeLinecap="round"/>
            <path d="M148 200 Q165 220 170 215" stroke="#93c5fd" strokeWidth="8" strokeLinecap="round"/>
            {/* plus signs */}
            <text x="50" y="175" fontSize="20" fill="#9ca3af" fontWeight="bold">+</text>
            <text x="318" y="200" fontSize="16" fill="#9ca3af" fontWeight="bold">+</text>
            {/* circle decoration */}
            <circle cx="310" cy="155" r="8" stroke="#d1d5db" strokeWidth="2" fill="none"/>
          </svg>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-130 flex items-center justify-center bg-white">
        <div className="w-full max-w-100 px-8 py-12">
          {/* Logo */}
          <div className="mb-8">
            <Image src="/logo.png" alt="PrepRoute" width={160} height={42} className="object-contain" style={{ width: "auto", height: "auto" }} />
          </div>

          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Login</h1>
          <p className="text-sm text-gray-500 mb-8">Use your company provided Login credentials</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">User ID</label>
              <input
                {...register('userId')}
                placeholder="Enter User ID"
                className="w-full h-12 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4461F2] focus:border-transparent transition-all"
              />
              {errors.userId && (
                <p className="mt-1 text-xs text-red-500">{errors.userId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter Password"
                  className="w-full h-12 px-4 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4461F2] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="flex justify-end">
              <a href="#" className="text-sm font-medium text-[#4461F2] hover:underline">
                Forgot password?
              </a>
            </div>

            {apiError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
                {apiError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-[#4461F2] hover:bg-[#3451E0] text-white font-medium text-base rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Logging in...
                </span>
              ) : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
