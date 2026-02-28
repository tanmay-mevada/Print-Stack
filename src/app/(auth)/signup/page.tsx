"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithGoogleAction, signupAction } from "../actions";
import {
  Printer,
  Mail,
  Lock,
  ArrowRight,
  User,
  Store,
  MapPin,
  Phone,
  GraduationCap,
} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"student" | "shopkeeper">("student");

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signInWithGoogleAction, signupAction } from '../actions'

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleState, googleFormAction] = useActionState(signInWithGoogleAction, null);
  
  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await signupAction(formData);

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else if (res?.success) {
      // Assuming your backend sends the email back for verification
      router.push(
        `/verify-otp?email=${encodeURIComponent(res.email || (formData.get("email") as string))}`,
      );
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 font-sans flex">
      {/* ================= LEFT COLUMN: SIGNUP FORM ================= */}
      <div className="w-full lg:w-1/2 flex flex-col p-8 sm:p-12 md:p-16 lg:p-24 justify-center relative">
        {/* Back to Home / Logo */}
        <div className="absolute top-8 left-8 sm:top-12 sm:left-12">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-stone-900 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-orange-600 transition-colors">
              <Printer className="text-[#faf9f6] w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-stone-900">
              PrintStack++
            </span>
          </Link>
    <div className="p-8 font-sans">
      <h2 className="text-2xl font-bold mb-6">Create an account</h2>

      {(error || googleState?.error) && (
        <div className="text-red-600 mb-4 font-semibold">
          Error: {error || googleState?.error}
        </div>

        <div className="max-w-md w-full mx-auto mt-16 lg:mt-0">
          <div className="mb-8">
            <h2 className="text-4xl font-black tracking-tight text-stone-900 mb-3">
              Create an account
            </h2>
            <p className="text-stone-500 font-medium">
              Join the paperless revolution. Select your account type below.
            </p>
          </div>

          {/* Role Selector Toggle */}
          <div className="flex bg-stone-200/50 p-1.5 rounded-2xl mb-8 border border-stone-200">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                role === "student"
                  ? "bg-white text-stone-900 shadow-sm border border-stone-200/60"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              <GraduationCap className="w-4 h-4" /> Student
            </button>
            <button
              type="button"
              onClick={() => setRole("shopkeeper")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                role === "shopkeeper"
                  ? "bg-stone-900 text-white shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              <Store className="w-4 h-4" /> Shopkeeper
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-semibold flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                !
              </div>
              {error}
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSignup} className="space-y-5">
            {/* Hidden field to easily pass the selected role to your server action */}
            <input type="hidden" name="role" value={role} />

            {/* COMMON FIELDS */}
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2 uppercase tracking-wide">
                {role === "student" ? "Full Name" : "Owner Name"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-stone-400" />
                </div>
                <input
                  name="name"
                  type="text"
                  placeholder={
                    role === "student" ? "Aum Ghodasara" : "John Doe"
                  }
                  required
                  className="block w-full pl-11 pr-4 py-3.5 bg-white border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* SHOPKEEPER SPECIFIC FIELDS */}
            {role === "shopkeeper" && (
              <>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2 uppercase tracking-wide">
                    Shop Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Store className="h-5 w-5 text-stone-400" />
                    </div>
                    <input
                      name="shopName"
                      type="text"
                      placeholder="BVM Campus Prints"
                      required
                      className="block w-full pl-11 pr-4 py-3.5 bg-white border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2 uppercase tracking-wide">
                    Contact Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-stone-400" />
                    </div>
                    <input
                      name="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      required
                      className="block w-full pl-11 pr-4 py-3.5 bg-white border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2 uppercase tracking-wide">
                    Shop Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-stone-400" />
                    </div>
                    <input
                      name="address"
                      type="text"
                      placeholder="Shop 4, University Road..."
                      required
                      className="block w-full pl-11 pr-4 py-3.5 bg-white border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2 uppercase tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-stone-400" />
                </div>
                <input
                  name="email"
                  type="email"
                  placeholder={
                    role === "student"
                      ? "student@cvmu.edu.in"
                      : "shop@printstack.com"
                  }
                  required
                  className="block w-full pl-11 pr-4 py-3.5 bg-white border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-stone-400" />
                </div>
                <input
                  name="password"
                  type="password"
                  placeholder="Create a strong password"
                  required
                  minLength={6}
                  className="block w-full pl-11 pr-4 py-3.5 bg-white border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm"
                />
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full py-4 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 focus:ring-4 focus:ring-orange-500/20 transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 mt-6"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                <>
                  Sign Up <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {role === "student" && (
            <>
              <div className="my-8 flex items-center">
                <div className="flex-1 border-t border-stone-200"></div>
                <span className="px-4 text-xs font-bold text-stone-400 uppercase tracking-widest">
                  Or
                </span>
                <div className="flex-1 border-t border-stone-200"></div>
              </div>

              {/* Google OAuth Form (Only shown for students typically) */}
              {/* Google OAuth Form */}
              <form
                action={async (formData) => {
                  await signInWithGoogleAction();
                }}
              >
                <button
                  type="submit"
                  className="w-full py-3.5 bg-white border border-stone-200 text-stone-800 font-bold rounded-xl hover:bg-stone-50 transition-all flex items-center justify-center gap-3 shadow-sm"
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </button>
              </form>
            </>
          )}

          <div className="mt-10 text-center">
            <p className="text-stone-500 font-medium">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-orange-600 font-bold hover:underline hover:text-orange-700 transition-all"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* ================= RIGHT COLUMN: VISUAL / IMAGE ================= */}
      <div className="hidden lg:flex w-1/2 bg-stone-900 relative overflow-hidden items-center justify-center">
        {/* Sleek Abstract Layers Image via Unsplash */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2064&auto=format&fit=crop')",
          }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/60 to-transparent" />

        {/* Floating Feature Highlight based on Role */}
        <div className="relative z-10 p-12 max-w-lg mt-auto mb-12 w-full transition-all duration-500">
          {/* <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-[2rem] shadow-2xl">
            {role === 'student' ? (
              <>
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-6">
                  <Printer className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-black tracking-tight text-white mb-3">
                  Print Smarter.
                </h3>
                <p className="text-stone-300 font-medium leading-relaxed">
                  Join thousands of students saving time. Upload your assignments, pay online, and skip the massive print shop queues forever.
                </p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center mb-6">
                  <Store className="w-6 h-6 text-stone-900" />
                </div>
                <h3 className="text-2xl font-black tracking-tight text-white mb-3">
                  Digitize Your Shop.
                </h3>
                <p className="text-stone-300 font-medium leading-relaxed">
                  Get a live dashboard, manage incoming orders digitally, eliminate loose change, and handle peak traffic with ease.
                </p>
              </>
            )}
          </div> */}
        </div>
        <button 
          disabled={loading} 
          className="border border-gray-400 p-2 w-full mt-2 disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <form action={googleFormAction} className="mb-6 mt-4">
        <button 
          type="submit" 
          className="text-blue-600 underline bg-transparent border-none p-0 cursor-pointer text-base"
        >
          Continue with Google
        </button>
      </form>

      <div className="mt-8">
        <Link href="/login" className="text-blue-600 underline">
          Already have an account? Sign in
        </Link>
      </div>
    </div>
  );
}
