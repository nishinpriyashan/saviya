import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  ShieldCheck, AlertCircle, Heart, HandHeart, CheckCircle2, Eye, EyeOff
} from 'lucide-react';
import { auth, db, firebaseConfigured } from '../../firebase/config';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['beneficiary', 'donor'], {
    required_error: 'Please select a role',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// ── Role option card ──────────────────────────────────────────────────────────
function RoleCard({ value, selected, onSelect, icon: Icon, title, description, accentColor, bgColor, borderColor }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`relative w-full rounded-2xl border-2 p-5 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
        selected
          ? `${borderColor} ${bgColor} shadow-md scale-[1.01]`
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      {selected && (
        <div className={`absolute top-3 right-3 ${accentColor}`}>
          <CheckCircle2 className="h-5 w-5" />
        </div>
      )}
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${bgColor} ${borderColor} border`}>
        <Icon className={`h-6 w-6 ${accentColor}`} />
      </div>
      <p className={`text-sm font-bold mb-1 ${selected ? accentColor : 'text-slate-800'}`}>{title}</p>
      <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
    </button>
  );
}

export default function Register() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [roleError, setRoleError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: '' },
  });

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setValue('role', role, { shouldValidate: true });
    setRoleError('');
  };

  const onSubmit = async (data) => {
    if (!data.role) { setRoleError('Please select your role to continue.'); return; }
    try {
      setError('');
      setLoading(true);
      if (!firebaseConfigured || !auth || !db) throw new Error('Firebase is not configured');

      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: data.fullName });

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: data.fullName,
        role: data.role,
        accountStatus: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      switch (data.role) {
        case 'beneficiary': navigate('/beneficiary/profile/setup'); break;
        case 'donor': navigate('/donor'); break;
        default: navigate('/');
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already registered. Try logging in instead.');
      } else {
        setError('Failed to create an account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-emerald-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg animate-fade-in-up">

        {/* ── Brand header ── */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/25 animate-pulse-green">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create your account</h1>
          <p className="text-slate-500 mt-2 text-sm">Join Saviya to request assistance or help those in need</p>
        </div>

        {/* ── Card ── */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 overflow-hidden">

          {/* Green top bar */}
          <div className="h-1 bg-gradient-to-r from-primary-700 via-primary-400 to-primary-700" />

          <div className="p-8 space-y-6">

            {/* Global error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-start gap-3 text-sm font-medium animate-fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* ── Step 1: Role selection ── */}
            <div>
              <p className="text-sm font-bold text-slate-700 mb-3">
                I want to… <span className="text-red-500">*</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <RoleCard
                  value="beneficiary"
                  selected={selectedRole === 'beneficiary'}
                  onSelect={handleRoleSelect}
                  icon={HandHeart}
                  title="Request Assistance"
                  description="I need help and want to submit an assistance request."
                  accentColor="text-blue-600"
                  bgColor="bg-blue-50"
                  borderColor="border-blue-400"
                />
                <RoleCard
                  value="donor"
                  selected={selectedRole === 'donor'}
                  onSelect={handleRoleSelect}
                  icon={Heart}
                  title="Become a Donor"
                  description="I want to support verified cases and help others."
                  accentColor="text-primary"
                  bgColor="bg-primary/5"
                  borderColor="border-primary"
                />
              </div>
              {(roleError || errors.role) && (
                <p className="text-xs font-semibold text-red-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {roleError || errors.role?.message}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-2">
                GN Officials register at{' '}
                <a href="/register/gn" className="text-primary font-semibold hover:underline">/register/gn</a>.
                Admins are registered internally.
              </p>
            </div>

            {/* ── Divider ── */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Your Details</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            {/* ── Full Name ── */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-sm font-semibold text-slate-700">Full Name</Label>
              <Input
                id="fullName"
                placeholder="e.g. Nimal Perera"
                error={errors.fullName}
                className="rounded-xl border-slate-200 focus:border-primary"
                {...register('fullName')}
              />
              {errors.fullName && (
                <p className="text-xs text-red-600 font-medium">{errors.fullName.message}</p>
              )}
            </div>

            {/* ── Email ── */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                error={errors.email}
                className="rounded-xl border-slate-200 focus:border-primary"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-600 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* ── Passwords ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    error={errors.password}
                    className="rounded-xl border-slate-200 pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-600 font-medium">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repeat password"
                    error={errors.confirmPassword}
                    className="rounded-xl border-slate-200 pr-10"
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-600 font-medium">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* ── Submit ── */}
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={loading}
              className="w-full btn-glow bg-primary text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-primary/30 hover:bg-primary-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Create Account
                </>
              )}
            </button>
          </div>

          {/* ── Footer ── */}
          <div className="border-t border-slate-100 px-8 py-5 bg-slate-50 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">
                Log in instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
