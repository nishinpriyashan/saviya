import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ShieldCheck, AlertCircle, BadgeCheck } from 'lucide-react';
import { auth, db, firebaseConfigured } from '../../firebase/config';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select } from '../../components/ui/Select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';

const SRI_LANKA_DISTRICTS = [
  'Ampara','Anuradhapura','Badulla','Batticaloa','Colombo','Galle','Gampaha',
  'Hambantota','Jaffna','Kalutara','Kandy','Kegalle','Kilinochchi','Kurunegala',
  'Mannar','Matale','Matara','Monaragala','Mullaitivu','Nuwara Eliya','Polonnaruwa',
  'Puttalam','Ratnapura','Trincomalee','Vavuniya',
];

const gnSchema = z.object({
  fullName:    z.string().min(2, 'Full name is required'),
  email:       z.string().email('Invalid email').refine(
    (val) => val.toLowerCase().endsWith('@saviya.lk'),
    { message: 'GN Officer email must end with @saviya.lk' }
  ),
  officialId:  z.string().min(3, 'Official ID / Service Number is required'),
  village:     z.string().min(2, 'Village / Grama Niladhari division name is required'),
  gsDivision:  z.string().min(2, 'GS Division is required'),
  district:    z.string().min(1, 'Please select a district'),
  phone:       z.string().min(9, 'Valid phone number required'),
  password:    z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function RegisterGN() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(gnSchema),
    defaultValues: { district: '' },
  });

  const onSubmit = async (data) => {
    try {
      setError('');
      setLoading(true);
      if (!firebaseConfigured || !auth || !db) throw new Error('Firebase is not configured');

      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await updateProfile(cred.user, { displayName: data.fullName });

      await setDoc(doc(db, 'users', cred.user.uid), {
        uid:         cred.user.uid,
        email:       data.email,
        displayName: data.fullName,
        role:        'gn',
        accountStatus: 'pending_approval', // Admin must approve GN accounts
        gnProfile: {
          officialId:  data.officialId,
          village:     data.village,
          gsDivision:  data.gsDivision,
          district:    data.district,
          phone:       data.phone,
        },
        createdAt:   serverTimestamp(),
        updatedAt:   serverTimestamp(),
      });

      navigate('/gn');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered.');
      } else {
        setError('Failed to create account: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-xl">

        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BadgeCheck className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">GN Officer Registration</h1>
          <p className="text-muted-foreground mt-2">
            For Grama Niladhari Officers only — requires an official <strong>@saviya.lk</strong> email address.
          </p>
        </div>

        <Card className="shadow-sm border-primary/10 animate-fade-in-up delay-100">
          <CardHeader className="pb-4">
            <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-primary mb-0.5">Official Registration</p>
                <p className="text-muted-foreground">Your account will be reviewed before you can access the verification portal. You must have an official <strong>@saviya.lk</strong> email address assigned by your district coordinator.</p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-lg flex items-center gap-2 text-sm font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Personal */}
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Personal Details</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name (as per ID)</Label>
                <Input id="fullName" placeholder="W.K. Nimal Perera" error={errors.fullName} {...register('fullName')} />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Official Email (@saviya.lk)</Label>
                  <Input id="email" type="email" placeholder="nimal.perera@saviya.lk" error={errors.email} {...register('email')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" placeholder="07X XXX XXXX" error={errors.phone} {...register('phone')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="officialId">Official ID / Service Number</Label>
                <Input id="officialId" placeholder="GN-00000" error={errors.officialId} {...register('officialId')} />
              </div>

              {/* GN Details */}
              <div className="space-y-1 pt-2">
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Jurisdiction Details</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="village">Village / GN Division Name</Label>
                <Input id="village" placeholder="Kolonnawa East" error={errors.village} {...register('village')} />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gsDivision">GS Division</Label>
                  <Input id="gsDivision" placeholder="Kolonnawa" error={errors.gsDivision} {...register('gsDivision')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">District</Label>
                  <Select id="district" error={errors.district} {...register('district')}
                    options={SRI_LANKA_DISTRICTS.map(d => ({ value: d, label: d }))} />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1 pt-2">
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Set Password</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password (min 8 chars)</Label>
                  <Input id="password" type="password" error={errors.password} {...register('password')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input id="confirmPassword" type="password" error={errors.confirmPassword} {...register('confirmPassword')} />
                </div>
              </div>

              <Button type="submit" className="w-full btn-glow mt-2" disabled={loading}>
                {loading ? 'Registering...' : 'Register as GN Officer'}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 border-t pt-5">
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">Log in</Link>
            </p>
            <p className="text-sm text-muted-foreground text-center">
              Registering as beneficiary or donor?{' '}
              <Link to="/register" className="text-primary font-medium hover:underline">Regular Registration</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
