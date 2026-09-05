import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Clock, CheckCircle2, XCircle, FileText, AlertCircle } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function Dashboard() {
  const { userData } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (!userData?.uid) return;

    // Real-time listener — no orderBy to avoid needing a composite index
    const q = query(
      collection(db, 'assistanceRequests'),
      where('beneficiaryId', '==', userData.uid)
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const reqs = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          // Sort client-side by createdAt descending
          .sort((a, b) => {
            const ta = a.createdAt?.toMillis?.() ?? 0;
            const tb = b.createdAt?.toMillis?.() ?? 0;
            return tb - ta;
          });
        setRequests(reqs);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching requests:', err);
        setError('Could not load your requests: ' + err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userData]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      'DRAFT': { color: 'bg-secondary text-secondary-foreground', icon: FileText, label: 'Draft' },
      'SUBMITTED': { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Submitted' },
      'UNDER_REVIEW': { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Under Review' },
      'GN_VERIFICATION': { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'GN Verification' },
      'VERIFIED': { color: 'bg-primary/20 text-primary-800', icon: CheckCircle2, label: 'Verified' },
      'REJECTED': { color: 'bg-destructive/15 text-destructive', icon: XCircle, label: 'Rejected' },
      'RETURNED': { color: 'bg-orange-100 text-orange-800', icon: XCircle, label: 'Returned for Correction' },
      'FUNDED': { color: 'bg-primary text-primary-foreground', icon: CheckCircle2, label: 'Funded' },
      'COMPLETED': { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Completed' },
    };

    const config = statusConfig[status] || statusConfig['DRAFT'];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3.5 w-3.5" />
        {config.label}
      </span>
    );
  };

  return (
    <DashboardLayout roleTitle="Beneficiary">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="animate-fade-in-up">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Welcome back, <span className="text-gradient-green">{userData?.displayName?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-muted-foreground mt-1">Track your assistance requests and their progress.</p>
        </div>
        <Link to="/beneficiary/request/new" className="animate-fade-in">
          <button className="btn-glow bg-primary text-white font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm">
            <PlusCircle className="h-4 w-4" />
            New Request
          </button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        {[
          { label: 'Total Requests', value: requests.length, icon: FileText, color: 'text-primary' },
          { label: 'Verified',       value: requests.filter(r => r.status === 'VERIFIED').length, icon: CheckCircle2, color: 'text-blue-600' },
          { label: 'Funded',         value: requests.filter(r => r.status === 'FUNDED' || r.status === 'COMPLETED').length, icon: CheckCircle2, color: 'text-emerald-600' },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <div key={i} className={`card-hover stat-card bg-white rounded-2xl border border-border p-6 shadow-sm animate-fade-in-up delay-${(i+1)*100}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">{label}</span>
              <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
            </div>
            <div className="text-4xl font-extrabold text-foreground animate-count-up">{value}</div>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold mb-4">Your Requests</h2>
      
      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Loading requests...</div>
      ) : error ? (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      ) : requests.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No requests yet</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              You haven't submitted any assistance requests. Create your first request to get started.
            </p>
            <Link to="/beneficiary/request/new">
              <Button>Create Request</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((request) => (
            <Card key={request.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">{request.category}</span>
                  {getStatusBadge(request.status)}
                </div>
                <CardTitle className="line-clamp-1">{request.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {request.description}
                </p>
                <div className="text-sm">
                  <span className="font-semibold">Required: </span>
                  Rs. {parseInt(request.requiredAmount).toLocaleString()}
                </div>
              </CardContent>
              <CardFooter className="pt-0 pb-4 border-t mt-4 px-6 pt-4">
                <Link to={`/beneficiary/request/${request.id}`} className="w-full">
                  <Button variant="outline" className="w-full">View Details</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
