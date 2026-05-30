"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SubmitHandler } from "react-hook-form";
import { register as registerUser } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const registerSchema = z.object({
  orgName: z.string().min(2, "Organization name must be at least 2 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit: SubmitHandler<RegisterFormValues> = async (data) => {
    setServerError(null);
    try {
      const tokens = await registerUser(data);
      setToken(tokens.accessToken);
      router.push("/dashboard");
    } catch {
      setServerError("Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500 mb-4">
            <span className="text-white font-bold text-xl">R</span>
          </div>
          <h1 className="text-3xl font-bold text-white">RetailOS</h1>
          <p className="mt-2 text-slate-400">AI-powered intelligence for your store</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Create your account</h2>

          {serverError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Organization name"
              id="orgName"
              type="text"
              placeholder="Acme Gas & Go"
              error={errors.orgName?.message}
              {...register("orgName")}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First name"
                id="firstName"
                type="text"
                placeholder="John"
                error={errors.firstName?.message}
                {...register("firstName")}
              />
              <Input
                label="Last name"
                id="lastName"
                type="text"
                placeholder="Doe"
                error={errors.lastName?.message}
                {...register("lastName")}
              />
            </div>

            <Input
              label="Email address"
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register("email")}
            />

            <Input
              label="Password"
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password")}
            />

            <Button
              type="submit"
              className="w-full"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Create Account
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
