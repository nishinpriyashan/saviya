import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, CheckCircle2, ShieldCheck, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../firebase/config';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { useAuth } from '../../contexts/AuthContext';

export default function DonationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchRequest() {
      try {
        const docRef = doc(db, 'assistanceRequests', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().visibility === 'PUBLIC') {
          setRequest({ id: docSnap.id, ...docSnap.data() });
          setAmount(docSnap.data().requiredAmount?.toString() || '');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchRequest();
  }, [id]);

  const handleDonate = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    try {
      setProcessing(true);

      // 1. Record Donation
      await addDoc(collection(db, 'donations'), {
        requestId: id,
        donorId: userData.uid,
        amount: Number(amount),
        status: 'COMPLETED',
        createdAt: serverTimestamp()
      });

      // 2. Update Request Status to FUNDED
      const requestRef = doc(db, 'assistanceRequests', id);
      await updateDoc(requestRef, {
        status: 'FUNDED',
        updatedAt: serverTimestamp()
      });

      // 3. Audit Log
      await addDoc(collection(db, 'auditEvents'), {
        actorId: userData.uid,
        actorRole: 'donor',
        action: 'DONATION_MADE',
        entityType: 'assistanceRequest',
        entityId: id,
        amount: Number(amount),
        timestamp: serverTimestamp()
      });

      toast.success("Donation successful!");
      setSuccess(true);
      setTimeout(() => navigate('/donor'), 3000);
    } catch (err) {
      console.error(err);
      toast.error("Donation failed to process.");
      setProcessing(false);
    }
  };

  if (loading) return <DashboardLayout roleTitle="Donor"><div className="py-12 text-center text-muted-foreground">Loading details...</div></DashboardLayout>;
  
  if (!request) return <DashboardLayout roleTitle="Donor"><div className="py-12 text-center text-muted-foreground">Request not found or no longer available.</div></DashboardLayout>;

  if (success) {
    return (
      <DashboardLayout roleTitle="Donor">
        <div className="max-w-md mx-auto mt-12 text-center">
          <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="h-10 w-10 text-primary fill-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Thank You!</h2>
          <p className="text-muted-foreground mb-8">
            Your donation of Rs. {Number(amount).toLocaleString()} has been successfully processed. You have made a real difference today.
          </p>
          <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout roleTitle="Donor">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link to="/donor" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Link>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs font-medium uppercase">{request.category}</span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-primary/20 text-primary-800">
                  <CheckCircle2 className="h-3 w-3" /> GN Verified
                </span>
              </div>
              <h1 className="text-3xl font-bold mb-4">{request.title}</h1>
              <p className="text-muted-foreground mb-4">Location: {request.locationSummary}</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Case Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                  {request.description}
                </p>
              </CardContent>
            </Card>

            <div className="bg-muted p-6 rounded-xl border flex items-start gap-4">
              <ShieldCheck className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold mb-1">Privacy & Verification Notice</h4>
                <p className="text-sm text-muted-foreground">
                  This case has been verified by a local government Grama Niladhari officer. The beneficiary's exact name, address, and supporting documents are kept completely private to maintain their dignity, as per Saviya's privacy policy.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="pb-4">
                <CardTitle>Fund this Request</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6 pb-6 border-b">
                  <p className="text-sm text-muted-foreground mb-1">Goal Amount</p>
                  <p className="text-3xl font-bold">Rs. {parseInt(request.requiredAmount).toLocaleString()}</p>
                </div>
                
                <form onSubmit={handleDonate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Donation Amount (LKR)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">Rs.</span>
                      <Input 
                        id="amount"
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pl-10 text-lg font-semibold"
                        required
                        min="1"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full text-lg h-12 gap-2" 
                    disabled={processing}
                  >
                    <Heart className={`h-5 w-5 ${processing ? 'animate-pulse' : ''}`} />
                    {processing ? 'Processing...' : 'Donate Now'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
