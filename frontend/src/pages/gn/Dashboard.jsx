import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { FileSearch, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../firebase/config';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';

export default function GnDashboard() {
  const { userData } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    async function fetchAssignedRequests() {
      if (!userData?.uid) return;
      try {
        // No orderBy — avoids needing a composite Firestore index
        const q = query(
          collection(db, 'assistanceRequests'),
          where('assignedGN', '==', userData.uid),
          where('status', '==', 'GN_VERIFICATION')
        );
        const snapshot = await getDocs(q);
        
        const reqList = [];
        for (const reqDoc of snapshot.docs) {
          const docsQuery = query(collection(db, `assistanceRequests/${reqDoc.id}/supportingDocuments`));
          const docsSnap = await getDocs(docsQuery);
          const docs = docsSnap.docs.map(d => d.data());
          reqList.push({ id: reqDoc.id, ...reqDoc.data(), uploadedDocs: docs });
        }

        // Sort client-side by createdAt descending
        reqList.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
        setRequests(reqList);
      } catch (err) {
        console.error("Error fetching GN requests:", err);
        toast.error('Failed to load assigned cases: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAssignedRequests();
  }, [userData]);

  const handleVerification = async (requestId, action, beneficiaryId) => {
    try {
      setProcessing(requestId);
      const requestRef = doc(db, 'assistanceRequests', requestId);
      
      const newStatus = action === 'APPROVE' ? 'VERIFIED' : 'REJECTED';
      const newVisibility = action === 'APPROVE' ? 'PUBLIC' : 'PRIVATE'; // Make visible to donors if approved

      await updateDoc(requestRef, {
        status: newStatus,
        verificationStatus: action === 'APPROVE' ? 'VERIFIED' : 'REJECTED',
        visibility: newVisibility,
        verifiedBy: userData.uid,
        verifiedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Audit Log
      await addDoc(collection(db, 'auditEvents'), {
        actorId: userData.uid,
        actorRole: 'gn',
        action: action === 'APPROVE' ? 'REQUEST_VERIFIED' : 'REQUEST_REJECTED',
        entityType: 'assistanceRequest',
        entityId: requestId,
        beneficiaryId: beneficiaryId,
        timestamp: serverTimestamp()
      });

      // Update UI
      setRequests(prev => prev.filter(req => req.id !== requestId));
      toast.success(`Request ${action === 'APPROVE' ? 'verified' : 'rejected'} successfully.`);
    } catch (err) {
      console.error("Error updating verification:", err);
      toast.error("Failed to process verification.");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <DashboardLayout roleTitle="Grama Niladhari">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Assigned Cases for Verification</h1>
        <p className="text-muted-foreground mt-1">Review beneficiary requests and supporting documents to prevent fraud.</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Loading assigned cases...</div>
      ) : requests.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <FileSearch className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No pending cases</h3>
            <p className="text-muted-foreground max-w-sm">
              You have no assistance requests pending verification at this time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {requests.map(request => (
            <Card key={request.id} className="overflow-hidden">
              <div className="grid md:grid-cols-3">
                <div className="md:col-span-2 p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs font-medium uppercase">{request.category}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${request.urgency === 'Critical' ? 'bg-destructive/15 text-destructive' : 'bg-muted'}`}>
                      {request.urgency} Urgency
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-4">{request.title}</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-1">Beneficiary Situation</h4>
                      <p className="text-sm">{request.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-1">Required Amount</h4>
                        <p className="font-medium">Rs. {request.requiredAmount?.toLocaleString()}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-1">Location</h4>
                        <p className="font-medium">{request.locationSummary}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-muted/50 p-6 border-t md:border-t-0 md:border-l flex flex-col justify-between">
                  <div>
                    <h4 className="font-semibold mb-3">Supporting Documents</h4>
                    {request.uploadedDocs && request.uploadedDocs.length > 0 ? (
                      <ul className="space-y-2 mb-6">
                        {request.uploadedDocs.map((doc, idx) => (
                          <li key={idx}>
                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-2">
                              <FileSearch className="h-4 w-4" />
                              {doc.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground mb-6">No documents provided.</p>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 text-white" 
                      onClick={() => handleVerification(request.id, 'APPROVE', request.beneficiaryId)}
                      disabled={processing === request.id}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve & Publish
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => handleVerification(request.id, 'REJECT', request.beneficiaryId)}
                      disabled={processing === request.id}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject Request
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
