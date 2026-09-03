// ============================================================
// ShopNTrust — Real Supabase Customer Authentication Modal
// ============================================================
// Customer-facing signup and login interface powered by Supabase Auth.
// ============================================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Store,
  X,
  ShieldCheck,
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/store/auth-context';
import { getAvailableCategories } from '@/lib/catalog';
import type { ProductCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function DemoAuthModal() {
  const router = useRouter();
  const { isAuthModalOpen, closeAuthModal, signIn, signUp } = useAuth();

  // Role: 'customer' | 'merchant'
  const [activeRole, setActiveRole] = useState<'customer' | 'merchant'>('customer');

  // Mode: 'signin' | 'signup'
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Customer specific
  const [name, setName] = useState('');
  const [selectedCats, setSelectedCats] = useState<ProductCategory[]>([
    'phones',
    'wearables',
    'headphones',
  ]);

  // Merchant specific
  const [storeName, setStoreName] = useState('');

  // Status Feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = getAvailableCategories();

  if (!isAuthModalOpen) return null;

  const handleToggleCategory = (catId: ProductCategory) => {
    setSelectedCats((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      if (authMode === 'signin') {
        const res = await signIn(activeRole, email, password);
        if (!res.success) {
          setErrorMsg(res.error || 'Invalid email or password.');
        } else {
          setSuccessMsg('Successfully signed in!');
          setTimeout(() => {
            closeAuthModal();
            if (activeRole === 'merchant') {
              router.push('/merchant');
            } else {
              router.push('/');
            }
          }, 400);
        }
      } else {
        // Sign Up Validation
        if (!name.trim()) {
          setErrorMsg('Please enter your full name.');
          setIsSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg('Password must be at least 6 characters.');
          setIsSubmitting(false);
          return;
        }
        if (password !== confirmPassword) {
          setErrorMsg('Passwords do not match. Please verify.');
          setIsSubmitting(false);
          return;
        }

        const res = await signUp(activeRole, {
          name: name.trim(),
          email: email.trim(),
          password,
          preferredCategories: selectedCats,
          storeName: storeName.trim() || 'Merchant Flagship Store',
        });

        if (!res.success) {
          setErrorMsg(res.error || 'Failed to create account.');
        } else {
          setSuccessMsg('Account created successfully!');
          setTimeout(() => {
            closeAuthModal();
            if (activeRole === 'merchant') {
              router.push('/merchant');
            } else {
              router.push('/');
            }
          }, 500);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        >
          {/* Close button */}
          <button
            onClick={closeAuthModal}
            className="absolute top-5 right-5 flex size-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close authentication modal"
          >
            <X className="size-4" />
          </button>

          {/* Modal Header */}
          <div className="mb-5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-bold text-snt-accent border border-indigo-200/60 mb-2">
              <ShieldCheck className="size-3.5 text-indigo-600" />
              <span>Real Supabase Authentication</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
              {authMode === 'signin' ? 'Welcome Back' : 'Create Customer Account'}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {authMode === 'signin'
                ? 'Sign in to access your persistent cart, AI shopping history, and profile.'
                : 'Join ShopNTrust for personalized AI commerce, verified direct catalog pricing, and private carts.'}
            </p>
          </div>

          {/* Role Switcher Tab */}
          <div className="mb-4 grid grid-cols-2 rounded-xl bg-secondary/70 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveRole('customer');
                setErrorMsg(null);
              }}
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg py-2 transition-all cursor-pointer',
                activeRole === 'customer'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <User className="size-3.5" />
              <span>Customer</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveRole('merchant');
                setErrorMsg(null);
              }}
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg py-2 transition-all cursor-pointer',
                activeRole === 'merchant'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Store className="size-3.5" />
              <span>Merchant Console</span>
            </button>
          </div>

          {/* Auth Mode Tabs (Sign In / Sign Up) */}
          <div className="flex border-b border-border/70 mb-5">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setErrorMsg(null);
              }}
              className={cn(
                'flex-1 pb-2.5 text-xs font-bold transition-colors text-center border-b-2 cursor-pointer',
                authMode === 'signin'
                  ? 'border-snt-accent text-snt-accent'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setErrorMsg(null);
              }}
              className={cn(
                'flex-1 pb-2.5 text-xs font-bold transition-colors text-center border-b-2 cursor-pointer',
                authMode === 'signup'
                  ? 'border-snt-accent text-snt-accent'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              Create Account
            </button>
          </div>

          {/* Error & Success Feedback Alerts */}
          {errorMsg && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
              <Check className="size-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="space-y-3.5 overflow-y-auto pr-1 flex-1">
            {/* Sign Up: Name Field */}
            {authMode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Aarav Sharma"
                    className="h-10 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:border-snt-accent focus:outline-none focus:ring-1 focus:ring-snt-accent"
                  />
                </div>
              </div>
            )}

            {/* Merchant Sign Up: Store Name */}
            {authMode === 'signup' && activeRole === 'merchant' && (
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Store / Brand Name
                </label>
                <div className="relative">
                  <Store className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Apex Electronics Flagship"
                    className="h-10 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:border-snt-accent focus:outline-none focus:ring-1 focus:ring-snt-accent"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-10 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:border-snt-accent focus:outline-none focus:ring-1 focus:ring-snt-accent"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Password {authMode === 'signup' && <span className="text-muted-foreground font-normal">(min. 6 characters)</span>}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10 w-full rounded-xl border border-border bg-background pl-10 pr-10 text-xs text-foreground placeholder:text-muted-foreground focus:border-snt-accent focus:outline-none focus:ring-1 focus:ring-snt-accent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Sign Up: Confirm Password */}
            {authMode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-10 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:border-snt-accent focus:outline-none focus:ring-1 focus:ring-snt-accent"
                  />
                </div>
              </div>
            )}

            {/* Sign Up: Customer Category Preferences */}
            {authMode === 'signup' && activeRole === 'customer' && (
              <div className="pt-2">
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Preferred Shopping Categories
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {categories.map((cat) => {
                    const isSelected = selectedCats.includes(cat.id as ProductCategory);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleToggleCategory(cat.id as ProductCategory)}
                        className={cn(
                          'rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer',
                          isSelected
                            ? 'bg-snt-accent text-white font-semibold shadow-2xs'
                            : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                        )}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-3">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-snt-accent hover:bg-snt-accent-hover text-white font-bold text-xs rounded-xl shadow-md shadow-snt-accent/20 cursor-pointer gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Processing with Supabase Auth...</span>
                  </>
                ) : (
                  <>
                    <span>{authMode === 'signin' ? 'Sign In to Account' : 'Create Account'}</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
