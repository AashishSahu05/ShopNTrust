// ============================================================
// ShopNTrust — Realistic Demo Authentication Modal
// ============================================================
// Provides genuine Sign In & Create Account flows for both
// Customer and Merchant roles with local validation.
// ============================================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Store,
  X,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  Zap,
} from 'lucide-react';
import { useAuth, INITIAL_DEMO_ACCOUNTS } from '@/store/auth-context';
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

  // Common Form Fields
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

  // Error & Status Feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const categories = getAvailableCategories();

  if (!isAuthModalOpen) return null;

  const handleToggleCategory = (catId: ProductCategory) => {
    setSelectedCats((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  const handleQuickFill = (emailVal: string, passVal: string, nameVal?: string, storeVal?: string) => {
    setEmail(emailVal);
    setPassword(passVal);
    setConfirmPassword(passVal);
    if (nameVal) setName(nameVal);
    if (storeVal) setStoreName(storeVal);
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (authMode === 'signin') {
      const res = signIn(activeRole, email, password);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to sign in.');
      } else {
        if (activeRole === 'merchant') {
          router.push('/merchant');
        } else {
          router.push('/');
        }
      }
    } else {
      // Sign Up Validation
      if (password && confirmPassword && password !== confirmPassword) {
        setErrorMsg('Passwords do not match. Please verify.');
        return;
      }

      const res = signUp(activeRole, {
        name: name.trim() || (activeRole === 'customer' ? 'Demo Customer' : 'Demo Merchant'),
        email: email.trim(),
        password: password || 'password123',
        preferredCategories: selectedCats,
        storeName: storeName.trim() || 'Flagship Store',
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to create account.');
      } else {
        if (activeRole === 'merchant') {
          router.push('/merchant');
        } else {
          router.push('/');
        }
      }
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
              <Sparkles className="size-3" />
              <span>Realistic Demo Authentication</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
              {authMode === 'signin' ? 'Welcome Back' : 'Create Demo Account'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {activeRole === 'customer'
                ? 'Sign in as a Customer to build session context and browse with AI shopping.'
                : 'Sign in to the Merchant Console to manage catalog inventory operations.'}
            </p>
          </div>

          {/* Role Choice Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-secondary/80 rounded-2xl mb-4">
            <button
              type="button"
              onClick={() => {
                setActiveRole('customer');
                setErrorMsg(null);
              }}
              className={cn(
                'flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
                activeRole === 'customer'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <User className="size-3.5 text-snt-accent" />
              <span>Customer</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveRole('merchant');
                setErrorMsg(null);
              }}
              className={cn(
                'flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
                activeRole === 'merchant'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Store className="size-3.5 text-emerald-600" />
              <span>Merchant</span>
            </button>
          </div>

          {/* Mode Switcher (Sign In vs Create Account) */}
          <div className="flex border-b border-border mb-4">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setErrorMsg(null);
              }}
              className={cn(
                'flex-1 pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer',
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
                'flex-1 pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer',
                authMode === 'signup'
                  ? 'border-snt-accent text-snt-accent'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              Create Account
            </button>
          </div>

          {/* Quick Demo Pre-Fill Chips */}
          <div className="mb-4 rounded-xl bg-slate-50 border border-slate-200/80 p-2.5">
            <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <Zap className="size-3 text-amber-500" />
              <span>1-Click Test Credentials (Evaluator Shortcut)</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activeRole === 'customer' ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickFill(
                        INITIAL_DEMO_ACCOUNTS[0].email,
                        INITIAL_DEMO_ACCOUNTS[0].password || 'password123',
                        INITIAL_DEMO_ACCOUNTS[0].name
                      )
                    }
                    className="text-[11px] font-medium bg-white border border-slate-200 hover:border-snt-accent px-2 py-0.5 rounded-lg text-slate-700 hover:text-snt-accent transition-colors cursor-pointer"
                  >
                    Aarav ({INITIAL_DEMO_ACCOUNTS[0].email})
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickFill(
                        INITIAL_DEMO_ACCOUNTS[1].email,
                        INITIAL_DEMO_ACCOUNTS[1].password || 'password123',
                        INITIAL_DEMO_ACCOUNTS[1].name
                      )
                    }
                    className="text-[11px] font-medium bg-white border border-slate-200 hover:border-snt-accent px-2 py-0.5 rounded-lg text-slate-700 hover:text-snt-accent transition-colors cursor-pointer"
                  >
                    Priya ({INITIAL_DEMO_ACCOUNTS[1].email})
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    handleQuickFill(
                      INITIAL_DEMO_ACCOUNTS[2].email,
                      INITIAL_DEMO_ACCOUNTS[2].password || 'password123',
                      INITIAL_DEMO_ACCOUNTS[2].name,
                      INITIAL_DEMO_ACCOUNTS[2].storeName
                    )
                  }
                  className="text-[11px] font-medium bg-white border border-slate-200 hover:border-emerald-600 px-2 py-0.5 rounded-lg text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer"
                >
                  Apex Store ({INITIAL_DEMO_ACCOUNTS[2].email})
                </button>
              )}
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="overflow-y-auto pr-1 space-y-3.5 flex-1">
            {/* Create Account Fields */}
            {authMode === 'signup' && (
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rohan Sen"
                    className="h-9 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-xs text-foreground focus:border-snt-accent focus:outline-none"
                  />
                </div>
              </div>
            )}

            {authMode === 'signup' && activeRole === 'merchant' && (
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Store / Brand Name
                </label>
                <div className="relative">
                  <Store className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. Sen Tech Store"
                    className="h-9 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-xs text-foreground focus:border-snt-accent focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="h-9 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-xs text-foreground focus:border-snt-accent focus:outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-9 w-full rounded-xl border border-border bg-background pl-9 pr-9 text-xs text-foreground focus:border-snt-accent focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field for Signup */}
            {authMode === 'signup' && (
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-9 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-xs text-foreground focus:border-snt-accent focus:outline-none font-mono"
                  />
                </div>
              </div>
            )}

            {/* Preferred Categories picker for customer signup */}
            {authMode === 'signup' && activeRole === 'customer' && (
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1.5">
                  Select Preferred Categories (Optional)
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-background rounded-xl border border-border">
                  {categories.map((cat) => {
                    const isSelected = selectedCats.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleToggleCategory(cat.id)}
                        className={cn(
                          'px-2 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer',
                          isSelected
                            ? 'bg-snt-accent text-white shadow-2xs'
                            : 'bg-secondary text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {isSelected && <Check className="size-2.5 inline mr-1" />}
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className={cn(
                'w-full h-11 text-xs font-bold gap-2 shadow-xs cursor-pointer mt-2',
                activeRole === 'merchant'
                  ? 'bg-slate-900 hover:bg-slate-800 text-white'
                  : 'bg-snt-accent hover:bg-snt-accent-hover text-white'
              )}
            >
              <span>
                {authMode === 'signin'
                  ? `Sign In as ${activeRole === 'customer' ? 'Customer' : 'Merchant'}`
                  : `Create ${activeRole === 'customer' ? 'Customer' : 'Merchant'} Account`}
              </span>
              <ArrowRight className="size-3.5" />
            </Button>
          </form>

          {/* Privacy & Demo Notice */}
          <div className="mt-4 border-t border-border pt-3 flex items-center justify-center gap-2 text-[11px] text-muted-foreground text-center">
            <ShieldCheck className="size-3.5 text-emerald-600 shrink-0" />
            <span>Frontend demo only • Accounts persist in browser local storage.</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
