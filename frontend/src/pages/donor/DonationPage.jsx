import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, CheckCircle2, ShieldCheck, Heart, CreditCard, Lock, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../firebase/config';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { useAuth } from '../../contexts/AuthContext';

// Format card number with spaces every 4 digits
function formatCardNum(val) {
  return val.replace(/\D/g, '').substring(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function formatExpiry(val) {
  const cleaned = val.replace(/\D/g, '').substring(0, 4);
  if (cleaned.length >= 3) return cleaned.slice(0, 2) + '/' + cleaned.slice(2);
  return cleaned;
}

export default function DonationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState('amount'); // 'amount' | 'card' | 'processing' | 'success'

  // Card state
  const [savedCard, setSavedCard] = useState(null);
  const [useSaved, setUseSaved] = useState(false);
  const [saveCard, setSaveCard] = useState(false);
  const [card, setCard] = useState({ name: '', number: '', expiry: '', cvv: '' });
  const [cardErrors, setCardErrors] = useState({});

  useEffect(() => {
    async function fetchData() {
      try {
        const docSnap = await getDoc(doc(db, 'assistanceRequests', id));
        if (docSnap.exists() && docSnap.data().visibility === 'PUBLIC') {
          setRequest({ id: docSnap.id, ...docSnap.data() });
          setAmount(docSnap.data().requiredAmount?.toString() || '');
        }
        // Load saved card if exists
        if (userData?.uid) {
          const userSnap = await getDoc(doc(db, 'users', userData.uid));
          if (userSnap.exists() && userSnap.data().savedCard) {
            setSavedCard(userSnap.data().savedCard);
            setUseSaved(true);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, userData]);

  const validateCard = () => {
    const errs = {};
    if (!card.name.trim()) errs.name = 'Name on card is required';
    const rawNum = card.number.replace(/\s/g, '');
    if (rawNum.length !== 16) errs.number = 'Card number must be 16 digits';
    if (!/^\d{2}\/\d{2}$/.test(card.expiry)) errs.expiry = 'Format: MM/YY';
    if (card.cvv.length < 3) errs.cvv = 'CVV must be 3 or 4 digits';
    setCardErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAmountNext = (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      toast.error('Please enter a valid donation amount.');
      return;
    }
    setStep('card');
  };

  const handleDonate = async (e) => {
    e.preventDefault();
    if (!useSaved && !validateCard()) return;

    try {
      setStep('processing');
      setProcessing(true);

      // Simulate payment processing (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Save card if requested
      if (!useSaved && saveCard && card.name) {
        await updateDoc(doc(db, 'users', userData.uid), {
          savedCard: {
            name:     card.name,
            lastFour: card.number.replace(/\s/g, '').slice(-4),
            expiry:   card.expiry,
          },
          updatedAt: serverTimestamp(),
        });
      }

      // Record donation
      await addDoc(collection(db, 'donations'), {
        requestId: id,
        donorId:   userData.uid,
        amount:    Number(amount),
        status:    'COMPLETED',
        paymentMethod: 'CARD_SIMULATED',
        createdAt: serverTimestamp(),
      });

      // Update request status
      await updateDoc(doc(db, 'assistanceRequests', id), {
        status:    'FUNDED',
        updatedAt: serverTimestamp(),
      });

      // Audit log
      await addDoc(collection(db, 'auditEvents'), {
        actorId: userData.uid, actorRole: 'donor', action: 'DONATION_MADE',
        entityType: 'assistanceRequest', entityId: id,
        amount: Number(amount), timestamp: serverTimestamp(),
      });

      setStep('success');
      setSuccess(true);
      setTimeout(() => navigate('/donor'), 4000);
    } catch (err) {
      console.error(err);
      toast.error('Donation failed. Please try again.');
      setStep('card');
      setProcessing(false);
    }
  };

  if (loading) return (
    <DashboardLayout roleTitle="Donor">
      <div className="py-16 text-center text-muted-foreground">Loading details...</div>
    </DashboardLayout>
  );

  if (!request) return (
    <DashboardLayout roleTitle="Donor">
      <div className="py-16 text-center text-muted-foreground">Request not found or no longer available.</div>
    </DashboardLayout>
  );

  // ── Success Screen ──
  if (step === 'success') {
    return (
      <DashboardLayout roleTitle="Donor">
        <div className="max-w-md mx-auto mt-16 text-center animate-fade-in-up">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-green">
            <Heart className="h-12 w-12 text-primary fill-primary" />
          </div>
          <h2 className="text-3xl font-extrabold mb-3">Thank You!</h2>
          <p className="text-muted-foreground mb-2 text-lg">
            Your donation of <strong className="text-primary">Rs. {Number(amount).toLocaleString()}</strong> has been processed.
          </p>
          <p className="text-sm text-muted-foreground mb-8">You have made a real difference in someone's life today.</p>
          <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 flex items-center gap-3 text-sm text-primary text-left mb-6">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            <span>The funds will be transferred to the beneficiary's verified bank account.</span>
          </div>
          <p className="text-xs text-muted-foreground">Redirecting to dashboard in a few seconds...</p>
        </div>
      </DashboardLayout>
    );
  }

  // ── Processing Screen ──
  if (step === 'processing') {
    return (
      <DashboardLayout roleTitle="Donor">
        <div className="max-w-md mx-auto mt-16 text-center animate-fade-in">
          <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-2">Processing Payment</h2>
          <p className="text-muted-foreground">Please wait while your donation is being processed...</p>
          <p className="text-xs text-muted-foreground mt-4">Do not close this window.</p>
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
          {/* Left — Case info */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs font-medium uppercase">{request.category}</span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">
                  <CheckCircle2 className="h-3 w-3" /> GN Verified
                </span>
              </div>
              <h1 className="text-3xl font-bold mb-2">{request.title}</h1>
              <p className="text-muted-foreground flex items-center gap-1 text-sm">Location: {request.locationSummary}</p>
            </div>

            <Card>
              <CardHeader><CardTitle>Case Description</CardTitle></CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">{request.description}</p>
              </CardContent>
            </Card>

            <div className="bg-primary/5 border border-primary/15 rounded-xl p-5 flex items-start gap-4">
              <ShieldCheck className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold mb-1">Privacy & Verification Notice</h4>
                <p className="text-sm text-muted-foreground">
                  This case is GN-verified. The beneficiary's exact name, address, NIC, and bank account are kept completely private. Donated funds are transferred directly to their verified bank account by the Saviya platform.
                </p>
              </div>
            </div>
          </div>

          {/* Right — Payment panel */}
          <div className="space-y-4">

            {/* Step 1 — Amount */}
            <Card className={`border-primary/20 shadow-md transition-all ${step !== 'amount' ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 'amount' ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>1</div>
                  <CardTitle className="text-base">Donation Amount</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {step === 'amount' ? (
                  <form onSubmit={handleAmountNext} className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Goal Amount</p>
                      <p className="text-2xl font-bold text-primary">Rs. {parseInt(request.requiredAmount || 0).toLocaleString()}</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount">Your Donation (LKR)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">Rs.</span>
                        <input
                          id="amount"
                          type="number"
                          value={amount}
                          onChange={e => setAmount(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-transparent pl-10 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-semibold text-lg"
                          min="1"
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full btn-glow">
                      Continue to Payment <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                    </Button>
                  </form>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="font-bold text-primary">Rs. {Number(amount).toLocaleString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 2 — Card details */}
            {step === 'card' && (
              <Card className="border-primary/20 shadow-md animate-fade-in-up">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">2</div>
                    <CardTitle className="text-base">Payment Details</CardTitle>
                    <Lock className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Saved card option */}
                  {savedCard && (
                    <div className="mb-4 p-3 rounded-xl border border-primary/20 bg-primary/5">
                      <div className="flex items-center gap-3">
                        <input type="radio" id="use-saved" checked={useSaved} onChange={() => setUseSaved(true)} className="accent-primary" />
                        <label htmlFor="use-saved" className="text-sm font-medium flex-1 cursor-pointer">
                          <span className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-primary" />
                            Use saved card ending in <strong>{savedCard.lastFour}</strong>
                          </span>
                          <span className="text-xs text-muted-foreground">{savedCard.name} · Exp {savedCard.expiry}</span>
                        </label>
                      </div>
                      <div className="flex items-center gap-3 mt-3">
                        <input type="radio" id="new-card" checked={!useSaved} onChange={() => setUseSaved(false)} className="accent-primary" />
                        <label htmlFor="new-card" className="text-sm text-muted-foreground cursor-pointer">Use a different card</label>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleDonate} className="space-y-3">
                    {(!savedCard || !useSaved) && (
                      <>
                        {/* Visual card preview */}
                        <div className="bg-gradient-to-br from-primary-700 to-primary-500 text-white rounded-2xl p-5 mb-4">
                          <div className="flex justify-between items-start mb-6">
                            <span className="text-xs font-medium opacity-75">SAVIYA DONATION</span>
                            <CreditCard className="h-6 w-6 opacity-75" />
                          </div>
                          <p className="text-xl font-mono tracking-widest mb-4">
                            {card.number || '•••• •••• •••• ••••'}
                          </p>
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-xs opacity-60 mb-0.5">CARD HOLDER</p>
                              <p className="text-sm font-medium uppercase">{card.name || 'YOUR NAME'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs opacity-60 mb-0.5">EXPIRES</p>
                              <p className="text-sm font-medium">{card.expiry || 'MM/YY'}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cardName">Name on Card</Label>
                          <Input id="cardName" placeholder="John Perera"
                            value={card.name} onChange={e => setCard(p => ({ ...p, name: e.target.value }))}
                            error={cardErrors.name} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cardNumber">Card Number</Label>
                          <Input id="cardNumber" placeholder="1234 5678 9012 3456"
                            value={card.number}
                            onChange={e => setCard(p => ({ ...p, number: formatCardNum(e.target.value) }))}
                            error={cardErrors.number} maxLength={19} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="cardExpiry">Expiry (MM/YY)</Label>
                            <Input id="cardExpiry" placeholder="12/28"
                              value={card.expiry}
                              onChange={e => setCard(p => ({ ...p, expiry: formatExpiry(e.target.value) }))}
                              error={cardErrors.expiry} maxLength={5} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cardCvv">CVV</Label>
                            <Input id="cardCvv" placeholder="123" type="password"
                              value={card.cvv} onChange={e => setCard(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                              error={cardErrors.cvv} maxLength={4} />
                          </div>
                        </div>

                        {/* Save card checkbox */}
                        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer mt-1">
                          <input type="checkbox" checked={saveCard} onChange={e => setSaveCard(e.target.checked)} className="accent-primary rounded" />
                          <Save className="h-3.5 w-3.5" />
                          Save card for future donations
                        </label>
                      </>
                    )}

                    {/* Prototype notice */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                      <Lock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800">
                        <strong>Prototype mode:</strong> No real payment is processed. This simulates a successful card transaction for demonstration purposes.
                      </p>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button type="button" variant="outline" onClick={() => setStep('amount')} className="flex-1">
                        ← Back
                      </Button>
                      <Button type="submit" className="flex-1 btn-glow gap-2" disabled={processing}>
                        <Heart className="h-4 w-4" />
                        Donate Rs. {Number(amount || 0).toLocaleString()}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
