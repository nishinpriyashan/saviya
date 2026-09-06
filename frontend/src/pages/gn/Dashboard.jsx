import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { FileSearch, CheckCircle, XCircle, ChevronDown, ChevronUp, User, MapPin, Banknote, FileText, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../firebase/config';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';

function StatusBadge({ status }) {
  const map = {
    GN_VERIFICATION: { label: 'Pending Review', cls: 'bg-amber-100 text-amber-800' },
    GN_APPROVED:     { label: 'Approved by You', cls: 'bg-green-100 text-green-800' },
    GN_REJECTED:     { label: 'Rejected by You', cls: 'bg-red-100 text-red-800' },
  };
  const s = map[status] || { label: status, cls: 'bg-gray-100 text-gray-700' };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>;
}

function UrgencyBadge({ urgency }) {
  const cls = urgency === 'Critical'
    ? 'bg-red-100 text-red-700'
    : urgency === 'High'
    ? 'bg-orange-100 text-orange-700'
    : 'bg-gray-100 text-gray-700';
  return <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${cls}`}>{urgency}</span>;
}

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export default function GnDashboard() {
  const { userData } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [rejectionNotes, setRejectionNotes] = useState({});
  const [rejectMode, setRejectMode] = useState(null);
  const [beneficiaryProfiles, setBeneficiaryProfiles] = useState({});

  useEffect(() => {
    async function fetchAssignedRequests() {
      if (!userData?.uid) return;
      try {
        const q = query(
          collection(db, 'assistanceRequests'),
          where('assignedGN', '==', userData.uid),
          where('status', '==', 'GN_VERIFICATION')
        );
        const snapshot = await getDocs(q);

        const reqList = [];
        const profileMap = {};

        for (const reqDoc of snapshot.docs) {
          const docsQuery = query(collection(db, `assistanceRequests/${reqDoc.id}/supportingDocuments`));
          const docsSnap = await getDocs(docsQuery);
          const docs = docsSnap.docs.map(d => d.data());
          const data = reqDoc.data();
          reqList.push({ id: reqDoc.id, ...data, uploadedDocs: docs });

          // Fetch beneficiary private profile
          if (data.beneficiaryId && !profileMap[data.beneficiaryId]) {
            try {
              const userSnap = await getDoc(doc(db, 'users', data.beneficiaryId));
              if (userSnap.exists()) profileMap[data.beneficiaryId] = userSnap.data();
            } catch (_) {}
          }
        }

        reqList.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
        setRequests(reqList);
        setBeneficiaryProfiles(profileMap);
      } catch (err) {
        console.error('Error fetching GN requests:', err);
        toast.error('Failed to load assigned cases: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAssignedRequests();
  }, [userData]);

  const handleApprove = async (requestId, beneficiaryId) => {
    try {
      setProcessing(requestId);
      await updateDoc(doc(db, 'assistanceRequests', requestId), {
        status: 'GN_APPROVED',          // Moves to Admin review queue
        gnApprovedAt: serverTimestamp(),
        verifiedBy: userData.uid,
        updatedAt: serverTimestamp(),
      });
      await addDoc(collection(db, 'auditEvents'), {
        actorId: userData.uid, actorRole: 'gn', action: 'GN_APPROVED',
        entityType: 'assistanceRequest', entityId: requestId,
        beneficiaryId, timestamp: serverTimestamp(),
      });
      setRequests(prev => prev.filter(r => r.id !== requestId));
      toast.success('Request approved — sent to Admin for final review.');
    } catch (err) {
      toast.error('Failed to approve: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId, beneficiaryId) => {
    const note = rejectionNotes[requestId]?.trim();
    if (!note) {
      toast.error('Please provide a reason for rejection.');
      return;
    }
    try {
      setProcessing(requestId);
      await updateDoc(doc(db, 'assistanceRequests', requestId), {
        status: 'GN_REJECTED',           // Still goes to Admin — Admin can override
        gnRejectionNote: note,
        gnRejectedAt: serverTimestamp(),
        verifiedBy: userData.uid,
        updatedAt: serverTimestamp(),
      });
      await addDoc(collection(db, 'auditEvents'), {
        actorId: userData.uid, actorRole: 'gn', action: 'GN_REJECTED',
        entityType: 'assistanceRequest', entityId: requestId,
        beneficiaryId, gnRejectionNote: note, timestamp: serverTimestamp(),
      });
      setRequests(prev => prev.filter(r => r.id !== requestId));
      toast.success('Request rejected — sent to Admin with your note.');
    } catch (err) {
      toast.error('Failed to reject: ' + err.message);
    } finally {
      setProcessing(null);
      setRejectMode(null);
    }
  };

  const toggleExpand = (id) => setExpanded(prev => prev === id ? null : id);

  return (
    <DashboardLayout roleTitle="Grama Niladhari">
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-extrabold tracking-tight">Assigned Cases</h1>
        <p className="text-muted-foreground mt-1">
          Review each request in detail. Your decision (Approve or Reject) will be sent to the Admin panel.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Pending Review', value: requests.length, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Your Division', value: userData?.gnProfile?.village || 'All Areas', color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'District', value: userData?.gnProfile?.district || '—', color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map(({ label, value, color, bg }, i) => (
          <div key={i} className={`stat-card card-hover bg-white rounded-2xl border border-border p-5 shadow-sm animate-fade-in-up delay-${(i+1)*100}`}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
            <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-muted-foreground">Loading assigned cases...</div>
      ) : requests.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <FileSearch className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No pending cases</h3>
            <p className="text-muted-foreground max-w-sm">
              You have no assistance requests pending verification. Check back later.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {requests.map(request => {
            const profile = beneficiaryProfiles[request.beneficiaryId] || {};
            const isExpanded = expanded === request.id;
            const isRejecting = rejectMode === request.id;

            return (
              <Card key={request.id} className="overflow-hidden shadow-sm border-border">
                {/* Card header — always visible */}
                <div
                  className="p-5 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => toggleExpand(request.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-xs font-medium uppercase">{request.category}</span>
                        <UrgencyBadge urgency={request.urgency} />
                        <StatusBadge status={request.status} />
                      </div>
                      <h3 className="text-lg font-bold text-foreground line-clamp-1">{request.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />{request.locationSummary}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-lg font-bold text-primary">Rs. {parseInt(request.requiredAmount || 0).toLocaleString()}</span>
                      {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                    </div>
                  </div>
                </div>

                {/* Expanded detail panel */}
                {isExpanded && (
                  <div className="border-t border-border animate-fade-in">
                    <div className="grid md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-border">

                      {/* Left — Request details */}
                      <div className="md:col-span-2 p-6 space-y-6">
                        <div>
                          <h4 className="text-sm font-bold text-primary uppercase tracking-wide mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4" /> Request Details
                          </h4>
                          <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap bg-slate-50 rounded-xl p-4 border">
                            {request.description}
                          </p>
                        </div>

                        {/* Beneficiary private info — only GN can see */}
                        <div>
                          <h4 className="text-sm font-bold text-primary uppercase tracking-wide mb-3 flex items-center gap-2">
                            <User className="h-4 w-4" /> Beneficiary Details (Private)
                          </h4>
                          <div className="grid grid-cols-2 gap-4 bg-amber-50 border border-amber-100 rounded-xl p-4">
                            <DetailRow label="Full Name" value={profile.displayName} />
                            <DetailRow label="NIC Number" value={profile.nic} />
                            <DetailRow label="Phone" value={profile.phone} />
                            <DetailRow label="Email" value={profile.email} />
                            {profile.address && (
                              <div className="col-span-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Address</p>
                                <p className="text-sm font-medium">
                                  {[profile.address.houseNo, profile.address.street, profile.address.city, profile.address.district].filter(Boolean).join(', ')}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bank details */}
                        {profile.bankDetails && (
                          <div>
                            <h4 className="text-sm font-bold text-primary uppercase tracking-wide mb-3 flex items-center gap-2">
                              <Banknote className="h-4 w-4" /> Bank Account (Private)
                            </h4>
                            <div className="grid grid-cols-2 gap-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
                              <DetailRow label="Bank" value={profile.bankDetails.bankName} />
                              <DetailRow label="Branch" value={profile.bankDetails.branch} />
                              <DetailRow label="Account Holder" value={profile.bankDetails.accountHolder} />
                              <DetailRow label="Account Number" value={profile.bankDetails.accountNumber} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right — Documents + Actions */}
                      <div className="p-6 flex flex-col gap-5">
                        <div>
                          <h4 className="text-sm font-bold text-primary uppercase tracking-wide mb-3 flex items-center gap-2">
                            <FileSearch className="h-4 w-4" /> Supporting Documents
                          </h4>
                          {request.uploadedDocs?.length > 0 ? (
                            <ul className="space-y-2">
                              {request.uploadedDocs.map((d, idx) => (
                                <li key={idx}>
                                  <a href={d.url} target="_blank" rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline flex items-center gap-2 bg-primary/5 px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors">
                                    <FileSearch className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">{d.name || `Document ${idx + 1}`}</span>
                                  </a>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3">No documents uploaded.</p>
                          )}
                        </div>

                        {/* Rejection note input */}
                        {isRejecting && (
                          <div className="animate-fade-in-up">
                            <label className="text-sm font-semibold text-destructive mb-2 flex items-center gap-1.5">
                              <AlertTriangle className="h-4 w-4" /> Rejection Reason (required)
                            </label>
                            <textarea
                              className="w-full rounded-lg border border-destructive/50 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-destructive/30 min-h-[100px]"
                              placeholder="Explain why this request is being rejected. This note will be visible to the Admin."
                              value={rejectionNotes[request.id] || ''}
                              onChange={e => setRejectionNotes(p => ({ ...p, [request.id]: e.target.value }))}
                            />
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="space-y-3 mt-auto">
                          {!isRejecting ? (
                            <>
                              <Button
                                className="w-full bg-primary hover:bg-primary-700 text-white btn-glow"
                                onClick={() => handleApprove(request.id, request.beneficiaryId)}
                                disabled={processing === request.id}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {processing === request.id ? 'Processing...' : 'Approve — Send to Admin'}
                              </Button>
                              <Button
                                variant="outline"
                                className="w-full border-destructive/40 text-destructive hover:bg-destructive/5"
                                onClick={() => setRejectMode(request.id)}
                                disabled={processing === request.id}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject Request
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="destructive"
                                className="w-full"
                                onClick={() => handleReject(request.id, request.beneficiaryId)}
                                disabled={processing === request.id}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                {processing === request.id ? 'Processing...' : 'Confirm Rejection'}
                              </Button>
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setRejectMode(null)}
                                disabled={processing === request.id}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
