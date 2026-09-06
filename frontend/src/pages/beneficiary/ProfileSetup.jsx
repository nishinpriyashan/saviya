import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ShieldCheck, Home, CreditCard, ArrowRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select } from '../../components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';

const SRI_LANKA_DISTRICTS = [
  'Ampara','Anuradhapura','Badulla','Batticaloa','Colombo','Galle','Gampaha',
  'Hambantota','Jaffna','Kalutara','Kandy','Kegalle','Kilinochchi','Kurunegala',
  'Mannar','Matale','Matara','Monaragala','Mullaitivu','Nuwara Eliya','Polonnaruwa',
  'Puttalam','Ratnapura','Trincomalee','Vavuniya',
];

const SRI_LANKA_BANKS = [
  'Bank of Ceylon', 'Commercial Bank of Ceylon', 'Hatton National Bank',
  'National Savings Bank', 'Peoples Bank', 'Sampath Bank', 'Seylan Bank',
  'NDB Bank', 'Pan Asia Banking Corp', 'DFCC Bank', 'Other',
];

export default function BeneficiaryProfileSetup() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = address, 2 = bank
  const [saving, setSaving] = useState(false);

  // Address fields
  const [address, setAddress] = useState({
    houseNo: '', street: '', city: '', district: '', province: '', postalCode: '',
    phone: '', nic: '',
  });

  // Bank fields
  const [bank, setBank] = useState({
    bankName: '', branch: '', accountNumber: '', accountHolder: '',
  });

  const addressErrors = {};
  const bankErrors = {};

  const handleAddressNext = (e) => {
    e.preventDefault();
    if (!address.street || !address.city || !address.district) {
      toast.error('Please fill in at least street, city and district.');
      return;
    }
    setStep(2);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!userData?.uid) return;
    try {
      setSaving(true);
      await updateDoc(doc(db, 'users', userData.uid), {
        address: {
          houseNo: address.houseNo,
          street: address.street,
          city: address.city,
          district: address.district,
          province: address.province,
          postalCode: address.postalCode,
        },
        phone: address.phone,
        nic: address.nic,
        bankDetails: {
          bankName: bank.bankName,
          branch: bank.branch,
          accountNumber: bank.accountNumber,
          accountHolder: bank.accountHolder,
        },
        profileComplete: true,
        updatedAt: serverTimestamp(),
      });
      toast.success('Profile saved! You can now submit requests.');
      navigate('/beneficiary');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    navigate('/beneficiary');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Complete Your Profile</h1>
          <p className="text-muted-foreground mt-2">
            This information is <strong>strictly private</strong> — visible only to authorized officials, never to donors.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[{ n: 1, label: 'Address', icon: Home }, { n: 2, label: 'Bank Account', icon: CreditCard }].map(({ n, label, icon: Icon }) => (
            <div key={n} className="flex items-center gap-2">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                step >= n ? 'bg-primary text-white' : 'bg-border text-muted-foreground'
              }`}>
                {step > n ? <CheckCircle2 className="h-5 w-5" /> : n}
              </div>
              <span className={`text-sm font-medium ${step >= n ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
              {n < 2 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {/* Step 1 — Address */}
        {step === 1 && (
          <Card className="animate-fade-in-up shadow-sm border-primary/10">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Home className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle>Personal & Address Details</CardTitle>
                  <CardDescription>Your residential address for GN verification</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddressNext} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" placeholder="07X XXX XXXX" value={address.phone}
                      onChange={e => setAddress(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nic">NIC Number</Label>
                    <Input id="nic" placeholder="000000000V or 000000000000" value={address.nic}
                      onChange={e => setAddress(p => ({ ...p, nic: e.target.value }))} />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="houseNo">House / Door No.</Label>
                    <Input id="houseNo" placeholder="123/A" value={address.houseNo}
                      onChange={e => setAddress(p => ({ ...p, houseNo: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="street">Street / Lane <span className="text-destructive">*</span></Label>
                    <Input id="street" placeholder="Flower Road" value={address.street}
                      onChange={e => setAddress(p => ({ ...p, street: e.target.value }))} required />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City / Town <span className="text-destructive">*</span></Label>
                    <Input id="city" placeholder="Colombo" value={address.city}
                      onChange={e => setAddress(p => ({ ...p, city: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input id="postalCode" placeholder="00100" value={address.postalCode}
                      onChange={e => setAddress(p => ({ ...p, postalCode: e.target.value }))} />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="district">District <span className="text-destructive">*</span></Label>
                    <Select id="district" value={address.district}
                      onChange={e => setAddress(p => ({ ...p, district: e.target.value }))}
                      options={SRI_LANKA_DISTRICTS.map(d => ({ value: d, label: d }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="province">Province</Label>
                    <Select id="province" value={address.province}
                      onChange={e => setAddress(p => ({ ...p, province: e.target.value }))}
                      options={[
                        { value: 'Western', label: 'Western' },
                        { value: 'Central', label: 'Central' },
                        { value: 'Southern', label: 'Southern' },
                        { value: 'Northern', label: 'Northern' },
                        { value: 'Eastern', label: 'Eastern' },
                        { value: 'North Western', label: 'North Western' },
                        { value: 'North Central', label: 'North Central' },
                        { value: 'Uva', label: 'Uva' },
                        { value: 'Sabaragamuwa', label: 'Sabaragamuwa' },
                      ]}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="btn-glow flex-1">
                    Next: Bank Details <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button type="button" variant="outline" onClick={handleSkip} className="text-muted-foreground">
                    Skip for now
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2 — Bank */}
        {step === 2 && (
          <Card className="animate-fade-in-up shadow-sm border-primary/10">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle>Bank Account Details</CardTitle>
                  <CardDescription>Required to receive donated funds directly to your account</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Your bank details are <strong>encrypted and private</strong>. They will only be used to transfer verified donations to your account, and are never visible to donors.
                </p>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name <span className="text-destructive">*</span></Label>
                    <Select id="bankName" value={bank.bankName}
                      onChange={e => setBank(p => ({ ...p, bankName: e.target.value }))}
                      options={SRI_LANKA_BANKS.map(b => ({ value: b, label: b }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch Name <span className="text-destructive">*</span></Label>
                    <Input id="branch" placeholder="Colombo Fort" value={bank.branch}
                      onChange={e => setBank(p => ({ ...p, branch: e.target.value }))} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountHolder">Account Holder Name <span className="text-destructive">*</span></Label>
                  <Input id="accountHolder" placeholder="Exactly as on your passbook" value={bank.accountHolder}
                    onChange={e => setBank(p => ({ ...p, accountHolder: e.target.value }))} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number <span className="text-destructive">*</span></Label>
                  <Input id="accountNumber" placeholder="000000000" value={bank.accountNumber}
                    onChange={e => setBank(p => ({ ...p, accountNumber: e.target.value }))} required />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    ← Back
                  </Button>
                  <Button type="submit" className="btn-glow flex-1" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Profile & Continue'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleSkip} className="text-muted-foreground">
                    Skip for now
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          You can update these details anytime from your profile settings.
        </p>
      </div>
    </div>
  );
}
