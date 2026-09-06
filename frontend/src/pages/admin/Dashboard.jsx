import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { ShieldAlert, Users, Activity, FileCheck2, CheckCircle2, XCircle, ChevronDown, ChevronUp, AlertTriangle, FileText, User, MapPin, Banknote } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../firebase/config';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';

// ── Helpers ───────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    SUBMITTED:       { label: 'Submitted',        cls: 'bg-blue-100 text-blue-800' },
    GN_VERIFICATION: { label: 'GN Reviewing',     cls: 'bg-yellow-100 text-yellow-800' },
    GN_APPROVED:     { label: 'GN Approved',      cls: 'bg-emerald-100 text-emerald-800' },
    GN_REJECTED:     { label: 'GN Rejected',      cls: 'bg-red-100 text-red-800' },
    VERIFIED:        { label: 'Published',         cls: 'bg-green-100 text-green-800' },
    ADMIN_REJECTED:  { label: 'Admin Rejected',   cls: 'bg-gray-100 text-gray-700' },
  };
  const s = map[status] || { label: status, cls: 'bg-gray-100 text-gray-700' };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>;
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

function RequestDetailPanel({ request, profile, gnProfile, onPublish, onReject, processing }) {
  const [rejectNote, setRejectNote] = useState('');
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="border-t border-border animate-fade-in">
      <div className="grid md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-border">

        {/* Left — Full request info */}
        <div className="md:col-span-2 p-6 space-y-6">
          <div>
            <h4 className="text-sm font-bold text-primary uppercase tracking-wide mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" /> Request Description
            </h4>
            <p className="text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 border rounded-xl p-4">{request.description}</p>
          </div>

          {/* Beneficiary private info */}
          <div>
            <h4 className="text-sm font-bold text-primary uppercase tracking-wide mb-3 flex items-center gap-2">
              <User className="h-4 w-4" /> Beneficiary Details (Private)
            </h4>
            <div className="grid grid-cols-2 gap-4 bg-amber-50 border border-amber-100 rounded-xl p-4">
              <DetailRow label="Full Name" value={profile?.displayName} />
              <DetailRow label="NIC" value={profile?.nic} />
              <DetailRow label="Phone" value={profile?.phone} />
              <DetailRow label="Email" value={profile?.email} />
              {profile?.address && (
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
          {profile?.bankDetails && (
            <div>
              <h4 className="text-sm font-bold text-primary uppercase tracking-wide mb-3 flex items-center gap-2">
                <Banknote className="h-4 w-4" /> Bank Account (Private)
              </h4>
              <div className="grid grid-cols-2 gap-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
                <DetailRow label="Bank" value={profile.bankDetails.bankName} />
                <DetailRow label="Branch" value={profile.bankDetails.branch} />
                <DetailRow label="Account Holder" value={profile.bankDetails.accountHolder} />
                <DetailRow label="Account No." value={profile.bankDetails.accountNumber} />
              </div>
            </div>
          )}

          {/* GN rejection note if present */}
          {request.gnRejectionNote && (
            <div>
              <h4 className="text-sm font-bold text-red-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> GN Officer Rejection Note
              </h4>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-800">{request.gnRejectionNote}</p>
                {gnProfile && (
                  <p className="text-xs text-red-500 mt-2">— {gnProfile.displayName} ({gnProfile.email})</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right — Actions */}
        <div className="p-6 flex flex-col gap-5">
          <div>
            <h4 className="text-sm font-bold text-primary uppercase tracking-wide mb-3">Request Summary</h4>
            <div className="space-y-3">
              <DetailRow label="Category" value={request.category} />
              <DetailRow label="Urgency" value={request.urgency} />
              <DetailRow label="Location" value={request.locationSummary} />
              <DetailRow label="Required Amount" value={`Rs. ${parseInt(request.requiredAmount || 0).toLocaleString()}`} />
              <DetailRow label="Submitted" value={request.createdAt?.toDate?.()?.toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' })} />
            </div>
          </div>

          {/* Admin actions */}
          <div className="space-y-3 mt-auto">
            {!confirming ? (
              <>
                <Button
                  className="w-full btn-glow bg-primary text-white"
                  onClick={() => onPublish(request.id)}
                  disabled={processing === request.id}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {processing === request.id ? 'Processing...' : 'Publish to Donors'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-destructive/40 text-destructive hover:bg-destructive/5"
                  onClick={() => setConfirming(true)}
                  disabled={processing === request.id}
                >
                  <XCircle className="mr-2 h-4 w-4" /> Reject Request
                </Button>
              </>
            ) : (
              <div className="space-y-3 animate-fade-in-up">
                <textarea
                  className="w-full rounded-lg border border-destructive/40 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-destructive/30 min-h-[90px]"
                  placeholder="Reason for admin rejection (optional note)"
                  value={rejectNote}
                  onChange={e => setRejectNote(e.target.value)}
                />
                <Button variant="destructive" className="w-full"
                  onClick={() => onReject(request.id, rejectNote)} disabled={processing === request.id}>
                  <XCircle className="mr-2 h-4 w-4" />
                  {processing === request.id ? 'Processing...' : 'Confirm Rejection'}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setConfirming(false)}>Cancel</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { userData } = useAuth();
  const [submittedRequests, setSubmittedRequests] = useState([]);  // Needs GN assignment
  const [gnApprovedRequests, setGnApprovedRequests] = useState([]); // Admin to Publish/Reject
  const [gnRejectedRequests, setGnRejectedRequests] = useState([]); // GN rejected — Admin can still act
  const [gns, setGns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(null);
  const [processing, setProcessing] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [activeTab, setActiveTab] = useState('assign');
  const [beneficiaryProfiles, setBeneficiaryProfiles] = useState({});
  const [gnProfiles, setGnProfiles] = useState({});

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      // GN officers
      const gnSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'gn')));
      const gnList = gnSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setGns(gnList);
      const gnMap = Object.fromEntries(gnList.map(g => [g.id, g]));
      setGnProfiles(gnMap);

      // Fetch requests by status
      const fetchByStatus = async (statuses) => {
        const all = [];
        for (const status of statuses) {
          const snap = await getDocs(query(collection(db, 'assistanceRequests'), where('status', '==', status)));
          snap.docs.forEach(d => all.push({ id: d.id, ...d.data() }));
        }
        return all.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      };

      const [submitted, gnApproved, gnRejected] = await Promise.all([
        fetchByStatus(['SUBMITTED']),
        fetchByStatus(['GN_APPROVED']),
        fetchByStatus(['GN_REJECTED']),
      ]);

      setSubmittedRequests(submitted);
      setGnApprovedRequests(gnApproved);
      setGnRejectedRequests(gnRejected);

      // Fetch beneficiary profiles
      const allBeneficiaryIds = [...new Set([...submitted, ...gnApproved, ...gnRejected].map(r => r.beneficiaryId).filter(Boolean))];
      const profileMap = {};
      await Promise.all(allBeneficiaryIds.map(async uid => {
        try {
          const snap = await getDoc(doc(db, 'users', uid));
          if (snap.exists()) profileMap[uid] = snap.data();
        } catch (_) {}
      }));
      setBeneficiaryProfiles(profileMap);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      toast.error('Failed to load dashboard: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleAssignGN = async (requestId, gnId) => {
    if (!gnId) return;
    try {
      setAssigning(requestId);
      await updateDoc(doc(db, 'assistanceRequests', requestId), {
        status: 'GN_VERIFICATION', assignedGN: gnId,
        assignedAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      await addDoc(collection(db, 'auditEvents'), {
        actorId: userData.uid, actorRole: 'admin', action: 'ASSIGNED_TO_GN',
        entityType: 'assistanceRequest', entityId: requestId, assignedGN: gnId,
        previousStatus: 'SUBMITTED', newStatus: 'GN_VERIFICATION', timestamp: serverTimestamp(),
      });
      setSubmittedRequests(prev => prev.filter(r => r.id !== requestId));
      toast.success('Assigned to GN Officer successfully.');
    } catch (err) {
      toast.error('Failed to assign: ' + err.message);
    } finally {
      setAssigning(null);
    }
  };

  const handlePublish = async (requestId) => {
    try {
      setProcessing(requestId);
      await updateDoc(doc(db, 'assistanceRequests', requestId), {
        status: 'VERIFIED', visibility: 'PUBLIC',
        publishedAt: serverTimestamp(), publishedBy: userData.uid, updatedAt: serverTimestamp(),
      });
      await addDoc(collection(db, 'auditEvents'), {
        actorId: userData.uid, actorRole: 'admin', action: 'PUBLISHED',
        entityType: 'assistanceRequest', entityId: requestId, timestamp: serverTimestamp(),
      });
      setGnApprovedRequests(prev => prev.filter(r => r.id !== requestId));
      setGnRejectedRequests(prev => prev.filter(r => r.id !== requestId));
      toast.success('Request published — donors can now see it!');
      setExpanded(null);
    } catch (err) {
      toast.error('Failed to publish: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleAdminReject = async (requestId, note) => {
    try {
      setProcessing(requestId);
      await updateDoc(doc(db, 'assistanceRequests', requestId), {
        status: 'ADMIN_REJECTED', adminRejectionNote: note || '',
        rejectedAt: serverTimestamp(), rejectedBy: userData.uid, updatedAt: serverTimestamp(),
      });
      await addDoc(collection(db, 'auditEvents'), {
        actorId: userData.uid, actorRole: 'admin', action: 'ADMIN_REJECTED',
        entityType: 'assistanceRequest', entityId: requestId,
        adminRejectionNote: note, timestamp: serverTimestamp(),
      });
      setGnApprovedRequests(prev => prev.filter(r => r.id !== requestId));
      setGnRejectedRequests(prev => prev.filter(r => r.id !== requestId));
      toast.success('Request rejected.');
      setExpanded(null);
    } catch (err) {
      toast.error('Failed to reject: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  const tabs = [
    { key: 'assign',    label: 'Pending Assignment',  count: submittedRequests.length,  color: 'text-amber-600' },
    { key: 'approved',  label: 'GN Approved',          count: gnApprovedRequests.length,  color: 'text-emerald-600' },
    { key: 'rejected',  label: 'GN Rejected',          count: gnRejectedRequests.length,  color: 'text-red-600' },
  ];

  const currentList = activeTab === 'assign' ? submittedRequests
    : activeTab === 'approved' ? gnApprovedRequests : gnRejectedRequests;

  return (
    <DashboardLayout roleTitle="Admin">
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-extrabold tracking-tight">Admin Portal</h1>
        <p className="text-muted-foreground mt-1">Manage all assistance requests, GN assignments, and publishing decisions.</p>
      </div>

      {/* Stat cards */}
      <div className="grid md:grid-cols-4 gap-5 mb-8">
        {[
          { label: 'Pending Assignment', value: submittedRequests.length,  color: 'text-amber-600',   bg: 'bg-amber-50',   icon: ShieldAlert },
          { label: 'GN Approved',        value: gnApprovedRequests.length,  color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
          { label: 'GN Rejected',        value: gnRejectedRequests.length,  color: 'text-red-600',     bg: 'bg-red-50',     icon: XCircle },
          { label: 'GN Officers',        value: gns.length,                 color: 'text-violet-600',  bg: 'bg-violet-50',  icon: Users },
        ].map(({ label, value, color, bg, icon: Icon }, i) => (
          <div key={i} className={`card-hover stat-card bg-white rounded-2xl border border-border p-5 shadow-sm animate-fade-in-up delay-${(i+1)*100}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
              <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
            </div>
            <div className={`text-4xl font-extrabold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
        {tabs.map(tab => (
          <button key={tab.key}
            onClick={() => { setActiveTab(tab.key); setExpanded(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === tab.key ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full bg-white border ${tab.color}`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-muted-foreground">Loading requests...</div>
      ) : (
        <>
          {/* ── Tab: Assign to GN ── */}
          {activeTab === 'assign' && (
            <Card>
              <CardHeader>
                <CardTitle>Requests Needing GN Officer Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                {submittedRequests.length === 0 ? (
                  <div className="py-12 text-center flex flex-col items-center">
                    <FileCheck2 className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">All submitted requests have been assigned.</p>
                  </div>
                ) : (
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Title</th>
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Category</th>
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Location</th>
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Urgency</th>
                          <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Assign GN Officer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submittedRequests.map(req => (
                          <tr key={req.id} className="border-b hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-medium max-w-[200px] truncate">{req.title}</td>
                            <td className="px-4 py-3 text-muted-foreground">{req.category}</td>
                            <td className="px-4 py-3 text-muted-foreground">{req.locationSummary}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${req.urgency === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground'}`}>
                                {req.urgency}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <select
                                  className="h-9 w-[200px] rounded-lg border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                  onChange={e => handleAssignGN(req.id, e.target.value)}
                                  defaultValue=""
                                  disabled={assigning === req.id}
                                >
                                  <option value="" disabled>Select GN Officer...</option>
                                  {gns.map(gn => (
                                    <option key={gn.id} value={gn.id}>{gn.displayName} — {gn.gnProfile?.district || gn.email}</option>
                                  ))}
                                </select>
                                {assigning === req.id && <span className="text-xs text-muted-foreground">Assigning...</span>}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Tabs: GN Approved / GN Rejected — Full detail cards ── */}
          {(activeTab === 'approved' || activeTab === 'rejected') && (
            <div className="space-y-5">
              {currentList.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <FileCheck2 className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No requests in this queue.</p>
                  </CardContent>
                </Card>
              ) : (
                currentList.map(request => {
                  const isExpanded = expanded === request.id;
                  const profile = beneficiaryProfiles[request.beneficiaryId] || {};
                  const gnInfo = gnProfiles[request.verifiedBy] || {};
                  return (
                    <Card key={request.id} className="overflow-hidden shadow-sm">
                      {/* Header row */}
                      <div
                        className="p-5 cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => setExpanded(prev => prev === request.id ? null : request.id)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-2 mb-2">
                              <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-xs font-medium uppercase">{request.category}</span>
                              <StatusBadge status={request.status} />
                              {request.urgency === 'Critical' && (
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Critical</span>
                              )}
                            </div>
                            <h3 className="text-lg font-bold line-clamp-1">{request.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />{request.locationSummary}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-lg font-bold text-primary">Rs. {parseInt(request.requiredAmount || 0).toLocaleString()}</span>
                            {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                          </div>
                        </div>
                        {request.gnRejectionNote && !isExpanded && (
                          <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg p-3">
                            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-red-700 line-clamp-2"><strong>GN Note:</strong> {request.gnRejectionNote}</p>
                          </div>
                        )}
                      </div>

                      {isExpanded && (
                        <RequestDetailPanel
                          request={request}
                          profile={profile}
                          gnProfile={gnInfo}
                          onPublish={handlePublish}
                          onReject={handleAdminReject}
                          processing={processing}
                        />
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
