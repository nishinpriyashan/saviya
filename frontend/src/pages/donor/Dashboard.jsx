import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Search, CheckCircle2 } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function DonorDashboard() {
  const { userData } = useAuth();
  const [verifiedRequests, setVerifiedRequests] = useState([]);
  const [myDonations, setMyDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!userData?.uid) return;
      try {
        // Fetch Public Verified Requests — no orderBy to avoid composite index requirement
        const reqQuery = query(
          collection(db, 'assistanceRequests'),
          where('status', '==', 'VERIFIED'),
          where('visibility', '==', 'PUBLIC')
        );
        const reqSnapshot = await getDocs(reqQuery);
        const reqs = reqSnapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
        setVerifiedRequests(reqs);

        // Fetch Donor's past donations — no orderBy
        const donQuery = query(
          collection(db, 'donations'),
          where('donorId', '==', userData.uid)
        );
        const donSnapshot = await getDocs(donQuery);
        const dons = donSnapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
        setMyDonations(dons);
      } catch (err) {
        console.error("Error fetching donor data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userData]);

  const totalDonated = myDonations.reduce((sum, donation) => sum + Number(donation.amount), 0);

  return (
    <DashboardLayout roleTitle="Donor">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Welcome, <span className="text-gradient-green">{userData?.displayName?.split(' ')[0]}</span> ❤️
          </h1>
          <p className="text-muted-foreground mt-1">Discover verified cases and make a real difference.</p>
        </div>
      </div>

      {/* Impact Card */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="card-hover stat-card animate-fade-in-up delay-100 bg-gradient-to-br from-primary-700 to-primary-500 text-white rounded-2xl p-6 shadow-lg">
          <p className="text-primary-100 text-sm font-medium mb-2">Your Impact (Total Donated)</p>
          <div className="text-5xl font-extrabold mb-1">Rs. {totalDonated.toLocaleString()}</div>
          <p className="text-primary-200 text-sm mt-2">
            Across <span className="font-bold text-white">{myDonations.length}</span> verified case{myDonations.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="card-hover animate-fade-in-up delay-200 bg-white rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-muted-foreground mb-1">Verified Cases Available</p>
          <div className="text-5xl font-extrabold text-foreground">{verifiedRequests.length}</div>
          <p className="text-xs text-muted-foreground mt-2">GN-approved requests needing your support</p>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Discover Verified Cases</h2>
      </div>

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Loading cases...</div>
      ) : verifiedRequests.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No active cases</h3>
            <p className="text-muted-foreground max-w-sm">
              There are currently no verified requests needing funding. Please check back later.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {verifiedRequests.map((request) => (
            <Card key={request.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">{request.category}</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary-800">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    GN Verified
                  </span>
                </div>
                <CardTitle className="line-clamp-2">{request.title}</CardTitle>
                <CardDescription className="flex items-center gap-1 mt-1">
                  Location: {request.locationSummary}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {request.description}
                </p>
                <div className="bg-muted p-3 rounded-lg flex justify-between items-center">
                  <span className="text-sm font-medium">Goal:</span>
                  <span className="font-bold text-lg">Rs. {parseInt(request.requiredAmount).toLocaleString()}</span>
                </div>
              </CardContent>
              <CardFooter className="pt-0 pb-4 border-t mt-4 px-6 pt-4">
                <Link to={`/donor/request/${request.id}`} className="w-full">
                  <Button className="w-full gap-2">
                    <Heart className="h-4 w-4" /> View & Support
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
