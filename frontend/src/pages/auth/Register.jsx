import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { auth, db, firebaseConfigured } from '../../firebase/config';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select } from '../../components/ui/Select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';

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
  path: ["confirmPassword"],
});

export default function Register() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: '',
    }
  });

  const onSubmit = async (data) => {
    try {
      setError('');
      setLoading(true);
      if (!firebaseConfigured || !auth || !db) {
        throw new Error('Firebase is not configured');
      }
      
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // 2. Update Auth profile
      await updateProfile(user, {
        displayName: data.fullName
      });

      // 3. Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: data.fullName,
        role: data.role,
        accountStatus: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Redirect to correct dashboard based on role
      switch (data.role) {
        case 'beneficiary': navigate('/beneficiary'); break;
        case 'donor':       navigate('/donor');       break;
        default:            navigate('/');
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered.');
      } else {
        setError('Failed to create an account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-2">
            <ShieldCheck className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>
            Join Saviya to request assistance or help those in need
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
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                error={errors.fullName}
                {...register('fullName')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                error={errors.email}
                {...register('email')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">I want to...</Label>
              <Select
                id="role"
                options={[
                  { value: 'beneficiary', label: 'Request Assistance' },
                  { value: 'donor', label: 'Become a Donor' }
                ]}
                error={errors.role}
                {...register('role')}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Note: GN Officials and Administrators are registered internally.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  error={errors.password}
                  {...register('password')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  error={errors.confirmPassword}
                  {...register('confirmPassword')}
                />
              </div>
            </div>

            <Button type="submit" className="w-full mt-6" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-6">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Log in instead
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
