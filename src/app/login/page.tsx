"use client";

import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import api from "@/lib/axios";

const loginSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setApiError("");
      const response = await api.post("/auth/login", {
        userId: data.userId,
        password: data.password,
      });

      if (response.data.status === "success" || response.data.data?.token) {
        setAuth(
          response.data.data.token,
          response.data.data.user || { name: data.userId },
        );
        router.push("/");
      } else {
        setApiError(response.data.message || "Login failed. Please try again.");
      }
    } catch (error: unknown) {
      if (error && typeof error === "object" && "response" in error) {
        const err = error as { response?: { data?: { message?: string } } };
        setApiError(
          err.response?.data?.message || "An error occurred. Please try again.",
        );
      } else {
        setApiError("An error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F5F9FF] p-6 lg:p-10 flex items-center justify-center">
      <div className="w-full max-w-7xl h-full min-h-[calc(100vh-80px)] flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Left 50% - Illustration */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
          <Image
            src="/Group.png"
            alt="PrepRoute Illustration"
            width={480}
            height={380}
            className="w-full max-w-md object-contain"
            style={{ width: "auto", height: "auto" }}
            priority
          />
        </div>

        {/* Right 50% - White Card Container */}
        <div className="w-full lg:w-1/2 flex items-center justify-center">
          <div className="w-full max-w-135 min-h-[calc(100vh-100px)] bg-white rounded-2xl border border-[#D0E2FF] p-8 sm:p-12 lg:p-14 flex flex-col justify-center shadow-sm">
            {/* Logo */}
            <div className="mb-8">
              <Image
                src="/logo.png"
                alt="PrepRoute"
                width={150}
                height={40}
                className="object-contain"
                style={{ width: "auto", height: "auto" }}
                priority
              />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-1">Login</h1>
            <p className="text-xs text-gray-500 mb-8">
              Use your company provided Login credentials
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  User ID
                </label>
                <input
                  {...register("userId")}
                  placeholder="Enter User ID"
                  className="w-full h-11 px-4 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#5B89F6] focus:border-transparent transition-all placeholder-gray-400 text-gray-800"
                />
                {errors.userId && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {errors.userId.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  {...register("password")}
                  type="password"
                  placeholder="Enter Password"
                  className="w-full h-11 px-4 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#5B89F6] focus:border-transparent transition-all placeholder-gray-400 text-gray-800"
                />
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex justify-start">
                <a href="#" className="text-xs text-[#5B89F6] hover:underline">
                  Forgot password?
                </a>
              </div>

              {apiError && (
                <div className="p-3 text-xs text-red-600 bg-red-50 rounded-lg border border-red-100">
                  {apiError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-[#5B89F6] hover:bg-[#4461F2] text-white font-medium text-xs rounded-lg transition-all shadow-sm hover:shadow disabled:opacity-70 cursor-pointer"
              >
                {isSubmitting ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
