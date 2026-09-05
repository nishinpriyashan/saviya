import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft } from 'lucide-react';
import { db } from '../../firebase/config';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export default function RequestDetails() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRequest() {
      try {
        const docRef = doc(db, 'assistanceRequests', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRequest({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchRequest();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout roleTitle="Beneficiary">
        <div className="py-12 text-center text-muted-foreground">Loading details...</div>
      </DashboardLayout>
    );
  }

  if (!request) {
    return (
      <DashboardLayout roleTitle="Beneficiary">
        <div className="py-12 text-center text-muted-foreground">Request not found.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout roleTitle="Beneficiary">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to="/beneficiary" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Link>
        </div>
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{request.title}</h1>
            <div className="flex gap-2">
              <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs font-medium uppercase">{request.category}</span>
              <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium uppercase">Status: {request.status}</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-muted-foreground">{request.description}</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <div className="font-medium">Required Amount</div>
                  <div className="text-muted-foreground">Rs. {request.requiredAmount?.toLocaleString()}</div>
                </div>
                <div>
                  <div className="font-medium">Location</div>
                  <div className="text-muted-foreground">{request.locationSummary}</div>
                </div>
                <div>
                  <div className="font-medium">Urgency</div>
                  <div className="text-muted-foreground">{request.urgency}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
