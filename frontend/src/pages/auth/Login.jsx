import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ShieldCheck, AlertCircle, UserCog } from 'lucide-react';
import { auth, db } from '../../firebase/config';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select } from '../../components/ui/Select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const roleSchema = z.object({
  role: z.enum(['beneficiary', 'donor'], { required_error: 'Please select a role' }),
});

function redirectByRole(role, navigate) {
  switch (role) {
    case 'beneficiary': navigate('/beneficiary'); break;
    case 'donor':       navigate('/donor');       break;
    case 'gn':          navigate('/gn');           break;
    case 'admin':       navigate('/admin');        break;
    default:            navigate('/');
  }
}

export default function Login() {
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  // Recovery state — when Auth user exists but Firestore doc is missing
  const [orphanUser, setOrphanUser]   = useState(null); // Firebase Auth user object
  const [recovering, setRecovering]   = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const { register: registerRole, handleSubmit: handleRoleSubmit, formState: { errors: roleErrors } } = useForm({
    resolver: zodResolver(roleSchema),
  });

  // ── Main login submit ──────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    try {
      setError('');
      setLoading(true);

      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (!userDoc.exists()) {
        // Auth account exists but Firestore profile is missing.
        // Enter recovery mode — ask the user to pick their role.
        setOrphanUser(user);
        setLoading(false);
        return;
      }

      redirectByRole(userDoc.data().role, navigate);
    } catch (err) {
      console.error(err);
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
      ) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(err.message || 'Failed to log in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Recovery submit — recreate missing Firestore profile ──────────────────
  const onRecoverSubmit = async (data) => {
    try {
      setRecovering(true);
      await setDoc(doc(db, 'users', orphanUser.uid), {
        uid:           orphanUser.uid,
        email:         orphanUser.email,
        displayName:   orphanUser.displayName || orphanUser.email.split('@')[0],
        role:          data.role,
        accountStatus: 'active',
        createdAt:     serverTimestamp(),
        updatedAt:     serverTimestamp(),
      });
      redirectByRole(data.role, navigate);
    } catch (err) {
      console.error(err);
      setError('Failed to recover your profile. Please try again.');
      setOrphanUser(null);
    } finally {
      setRecovering(false);
    }
  };

  // ── Recovery UI ────────────────────────────────────────────────────────────
  if (orphanUser) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2 text-center">
            <div className="flex justify-center mb-2">
              <UserCog className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-xl font-bold">Complete Your Profile</CardTitle>
            <CardDescription>
              Your account was found but your profile is incomplete.
              Please select your role to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-destructive/15 text-destructive p-3 rounded-md flex items-center gap-2 text-sm font-medium mb-4">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            <form onSubmit={handleRoleSubmit(onRecoverSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">I want to...</Label>
                <Select
                  id="role"
                  options={[
                    { value: 'beneficiary', label: 'Request Assistance' },
                    { value: 'donor',       label: 'Become a Donor' },
                  ]}
                  error={roleErrors.role}
                  {...registerRole('role')}
                />
              </div>
              <Button type="submit" className="w-full" disabled={recovering}>
                {recovering ? 'Setting up...' : 'Complete Setup & Continue'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Normal login UI ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-2">
            <ShieldCheck className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-destructive/15 text-destructive p-3 rounded-md flex items-center gap-2 text-sm font-medium">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                error={errors.email}
                {...register('email')}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                error={errors.password}
                {...register('password')}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Log in'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-6">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Register here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
