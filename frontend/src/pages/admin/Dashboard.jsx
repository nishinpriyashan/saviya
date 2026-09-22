import { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { ShieldAlert, Users, FileCheck2, CheckCircle2, XCircle, ChevronDown, ChevronUp, AlertTriangle, FileText, User, MapPin, Banknote, LayoutDashboard, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../firebase/config';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedNumber({ value, duration = 900 }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);
  return <span>{display}</span>;
}

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-xl ${className}`} />;
}

function StatusBadge({ status }) {
  const map = {
    SUBMITTED:       { label: 'Submitted',       cls: 'bg-blue-100 text-blue-700' },
    GN_VERIFICATION: { label: 'GN Reviewing',    cls: 'bg-amber-100 text-amber-700' },
    GN_APPROVED:     { label: 'GN Approved',     cls: 'bg-emerald-100 text-emerald-700' },
    GN_REJECTED:     { label: 'GN Rejected',     cls: 'bg-red-100 text-red-600' },
    VERIFIED:        { label: 'Published',        cls: 'bg-green-100 text-green-700' },
    ADMIN_REJECTED:  { label: 'Admin Rejected',  cls: 'bg-slate-100 text-slate-600' },
  };
  const s = map[status] || { label: status, cls: 'bg-slate-100 text-slate-600' };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>;
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
        {/* Left */}
        <div className="md:col-span-2 p-6 space-y-6">
          <div>
            <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" /> Request Description
            </h4>
            <p className="text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 border border-border rounded-xl p-4">{request.description}</p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
              <User className="h-4 w-4" /> Beneficiary Details <span className="text-amber-600 normal-case">(Private)</span>
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

          {profile?.bankDetails && (
            <div>
              <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                <Banknote className="h-4 w-4" /> Bank Account <span className="text-blue-600 normal-case">(Private)</span>
              </h4>
              <div className="grid grid-cols-2 gap-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
                <DetailRow label="Bank" value={profile.bankDetails.bankName} />
                <DetailRow label="Branch" value={profile.bankDetails.branch} />
                <DetailRow label="Account Holder" value={profile.bankDetails.accountHolder} />
                <DetailRow label="Account No." value={profile.bankDetails.accountNumber} />
              </div>
            </div>
          )}

          {request.gnRejectionNote && (
            <div>
              <h4 className="text-xs font-bold text-red-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> GN Rejection Note
              </h4>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-800">{request.gnRejectionNote}</p>
                {gnProfile?.displayName && (
                  <p className="text-xs text-red-400 mt-2">— {gnProfile.displayName} ({gnProfile.email})</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="p-6 flex flex-col gap-5">
          <div>
            <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Request Summary</h4>
            <div className="space-y-3 bg-slate-50 rounded-xl p-4 border border-border">
              <DetailRow label="Category" value={request.category} />
              <DetailRow label="Urgency" value={request.urgency} />
              <DetailRow label="Location" value={request.locationSummary} />
              <DetailRow label="Required Amount" value={`Rs. ${parseInt(request.requiredAmount || 0).toLocaleString()}`} />
              <DetailRow label="Submitted" value={request.createdAt?.toDate?.()?.toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' })} />
            </div>
          </div>

          <div className="space-y-3 mt-auto">
            {!confirming ? (
              <>
                <Button
                  className="w-full btn-glow bg-primary text-white rounded-xl"
                  onClick={() => onPublish(request.id)}
                  disabled={processing === request.id}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {processing === request.id ? 'Publishing…' : 'Publish to Donors'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-destructive/40 text-destructive hover:bg-red-50 rounded-xl"
                  onClick={() => setConfirming(true)}
                  disabled={processing === request.id}
                >
                  <XCircle className="mr-2 h-4 w-4" /> Reject Request
                </Button>
              </>
            ) : (
              <div className="space-y-3 animate-fade-in-up">
                <textarea
                  className="w-full rounded-xl border border-destructive/40 bg-red-50 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-destructive/30 min-h-[90px]"
                  placeholder="Reason for admin rejection (optional)"
                  value={rejectNote}
                  onChange={e => setRejectNote(e.target.value)}
                />
                <Button variant="destructive" className="w-full rounded-xl"
                  onClick={() => onReject(request.id, rejectNote)} disabled={processing === request.id}>
                  <XCircle className="mr-2 h-4 w-4" />
                  {processing === request.id ? 'Processing…' : 'Confirm Rejection'}
                </Button>
                <Button variant="outline" className="w-full rounded-xl" onClick={() => setConfirming(false)}>Cancel</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { userData } = useAuth();
  const [submittedRequests, setSubmittedRequests] = useState([]);
  const [gnApprovedRequests, setGnApprovedRequests] = useState([]);
  const [gnRejectedRequests, setGnRejectedRequests] = useState([]);
  const [gns, setGns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(null);
  const [processing, setProcessing] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [activeTab, setActiveTab] = useState('assign');
  const [beneficiaryProfiles, setBeneficiaryProfiles] = useState({});
  const [gnProfiles, setGnProfiles] = useState({});

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const gnSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'gn')));
      const gnList = gnSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setGns(gnList);
      setGnProfiles(Object.fromEntries(gnList.map(g => [g.id, g])));

      const fetchByStatus = async (statuses) => {
        const all = [];
        for (const s of statuses) {
          const snap = await getDocs(query(collection(db, 'assistanceRequests'), where('status', '==', s)));
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

      const ids = [...new Set([...submitted, ...gnApproved, ...gnRejected].map(r => r.beneficiaryId).filter(Boolean))];
      const profileMap = {};
      await Promise.all(ids.map(async uid => {
        try {
          const snap = await getDoc(doc(db, 'users', uid));
          if (snap.exists()) profileMap[uid] = snap.data();
        } catch (_) {}
      }));
      setBeneficiaryProfiles(profileMap);
    } catch (err) {
      toast.error('Failed to load: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleAssignGN = async (requestId, gnId) => {
    if (!gnId) return;
    setAssigning(requestId);
    try {
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
      toast.success('Assigned to GN Officer.');
    } catch (err) {
      toast.error('Failed to assign: ' + err.message);
    } finally {
      setAssigning(null);
    }
  };

  const handlePublish = async (requestId) => {
    setProcessing(requestId);
    try {
      await updateDoc(doc(db, 'assistanceRequests', requestId), {
        status: 'VERIFIED', visibility: 'PUBLIC',
        publishedAt: serverTimestamp(), publishedBy: userData.uid, updatedAt: serverTimestamp(),
      });
      await addDoc(collection(db, 'auditEvents'), {
        actorId: userData.uid, actorRole: 'admin', action: 'PUBLISHED',
        entityType: 'assistanceRequest', entityId: requestId, timestamp: serverTimestamp(),
      });
      setGnApprovedRequests(p => p.filter(r => r.id !== requestId));
      setGnRejectedRequests(p => p.filter(r => r.id !== requestId));
      toast.success('Published — donors can now see it!');
      setExpanded(null);
    } catch (err) {
      toast.error('Failed: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleAdminReject = async (requestId, note) => {
    setProcessing(requestId);
    try {
      await updateDoc(doc(db, 'assistanceRequests', requestId), {
        status: 'ADMIN_REJECTED', adminRejectionNote: note || '',
        rejectedAt: serverTimestamp(), rejectedBy: userData.uid, updatedAt: serverTimestamp(),
      });
      await addDoc(collection(db, 'auditEvents'), {
        actorId: userData.uid, actorRole: 'admin', action: 'ADMIN_REJECTED',
        entityType: 'assistanceRequest', entityId: requestId,
        adminRejectionNote: note, timestamp: serverTimestamp(),
      });
      setGnApprovedRequests(p => p.filter(r => r.id !== requestId));
      setGnRejectedRequests(p => p.filter(r => r.id !== requestId));
      toast.success('Rejected.');
      setExpanded(null);
    } catch (err) {
      toast.error('Failed: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  const tabs = [
    { key: 'assign',   label: 'Pending Assignment', count: submittedRequests.length,   gradient: 'from-amber-500 to-orange-500',   activeCls: 'bg-amber-50 text-amber-700 border-amber-200' },
    { key: 'approved', label: 'GN Approved',         count: gnApprovedRequests.length,  gradient: 'from-emerald-500 to-green-500',  activeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { key: 'rejected', label: 'GN Rejected',         count: gnRejectedRequests.length,  gradient: 'from-red-500 to-rose-500',       activeCls: 'bg-red-50 text-red-700 border-red-200' },
  ];

  const currentList = activeTab === 'assign' ? submittedRequests
    : activeTab === 'approved' ? gnApprovedRequests : gnRejectedRequests;

  const stats = [
    { label: 'Pending Assignment', value: submittedRequests.length,  gradient: 'from-amber-500 to-orange-400',   icon: ShieldAlert },
    { label: 'GN Approved',        value: gnApprovedRequests.length, gradient: 'from-emerald-500 to-green-400',  icon: CheckCircle2 },
    { label: 'GN Rejected',        value: gnRejectedRequests.length, gradient: 'from-red-500 to-rose-400',       icon: XCircle },
    { label: 'GN Officers',        value: gns.length,                gradient: 'from-violet-500 to-purple-500',  icon: Users },
  ];

  return (
    <DashboardLayout roleTitle="Admin">
      {/* ── Header ── */}
      <div className="mb-10 animate-fade-in-up flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-widest text-rose-600">Admin Portal</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <LayoutDashboard className="h-7 w-7 text-primary" /> Command Centre
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage all requests, GN assignments, and publishing decisions.</p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary border border-border px-4 py-2 rounded-xl hover:bg-primary/5 transition-all"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(({ label, value, gradient, icon: Icon }, i) => (
          <div
            key={i}
            className="stat-card card-hover bg-white border border-border rounded-2xl p-5 shadow-sm overflow-hidden relative"
            style={{ animation: `fadeInUp 0.6s ease both ${i * 80}ms` }}
          >
            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-slate-100 blur-xl opacity-60" />
            <div className="relative">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-md`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
              <p className="text-3xl font-extrabold text-foreground">
                {loading ? '—' : <AnimatedNumber value={value} />}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 mb-7 flex-wrap">
        {tabs.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setExpanded(null); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold border transition-all duration-200 ${
                isActive
                  ? `bg-gradient-to-r ${tab.gradient} text-white border-transparent shadow-md scale-[1.02]`
                  : 'bg-white border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : (
        <>
          {/* ── Assign tab ── */}
          {activeTab === 'assign' && (
            <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm animate-fade-in">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="text-base font-bold text-foreground">Requests Needing GN Assignment</h2>
              </div>
              {submittedRequests.length === 0 ? (
                <div className="py-16 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center mb-4 animate-float">
                    <FileCheck2 className="h-8 w-8 text-emerald-500" />
                  </div>
                  <p className="font-semibold text-foreground">All requests assigned ✓</p>
                  <p className="text-sm text-muted-foreground mt-1">No pending submissions right now.</p>
                </div>
              ) : (
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-slate-50">
                        <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Title</th>
                        <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Category</th>
                        <th className="px-5 py-3 text-left font-semibold text-muted-foreground hidden md:table-cell">Location</th>
                        <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Urgency</th>
                        <th className="px-5 py-3 text-right font-semibold text-muted-foreground">Assign GN Officer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submittedRequests.map((req, i) => (
                        <tr
                          key={req.id}
                          className="border-b border-border hover:bg-slate-50 transition-colors"
                          style={{ animation: `fadeInUp 0.4s ease both ${i * 50}ms` }}
                        >
                          <td className="px-5 py-3.5 font-semibold max-w-[180px] truncate">{req.title}</td>
                          <td className="px-5 py-3.5 text-muted-foreground">{req.category}</td>
                          <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">{req.locationSummary}</td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              req.urgency === 'Critical' ? 'bg-red-100 text-red-600 animate-pulse'
                              : req.urgency === 'High' ? 'bg-orange-100 text-orange-600'
                              : 'bg-slate-100 text-slate-500'
                            }`}>{req.urgency}</span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <select
                                className="h-9 w-[200px] rounded-xl border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                                onChange={e => handleAssignGN(req.id, e.target.value)}
                                defaultValue=""
                                disabled={assigning === req.id}
                              >
                                <option value="" disabled>Select GN Officer…</option>
                                {gns.map(gn => (
                                  <option key={gn.id} value={gn.id}>{gn.displayName} — {gn.gnProfile?.district || gn.email}</option>
                                ))}
                              </select>
                              {assigning === req.id && <span className="text-xs text-muted-foreground animate-pulse">Assigning…</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Approved / Rejected tabs ── */}
          {(activeTab === 'approved' || activeTab === 'rejected') && (
            <div className="space-y-4">
              {currentList.length === 0 ? (
                <div className="border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center py-16 text-center animate-fade-in">
                  <FileCheck2 className="h-10 w-10 text-muted-foreground mb-4 animate-float" />
                  <p className="font-semibold">No requests in this queue</p>
                </div>
              ) : (
                currentList.map((request, idx) => {
                  const isExpanded = expanded === request.id;
                  const profile = beneficiaryProfiles[request.beneficiaryId] || {};
                  const gnInfo = gnProfiles[request.verifiedBy] || {};
                  return (
                    <div
                      key={request.id}
                      className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                      style={{ animation: `fadeInUp 0.5s ease both ${idx * 60}ms` }}
                    >
                      {/* Urgency bar */}
                      <div className={`h-1 ${request.urgency === 'Critical' ? 'bg-red-500' : activeTab === 'approved' ? 'bg-emerald-500' : 'bg-orange-400'}`} />

                      <div
                        className="p-5 cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => setExpanded(prev => prev === request.id ? null : request.id)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-2 mb-2">
                              <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-lg text-xs font-bold uppercase">{request.category}</span>
                              <StatusBadge status={request.status} />
                              {request.urgency === 'Critical' && (
                                <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-red-100 text-red-600 animate-pulse">Critical</span>
                              )}
                            </div>
                            <h3 className="text-base font-bold line-clamp-1">{request.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />{request.locationSummary}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-base font-extrabold text-primary">Rs. {parseInt(request.requiredAmount || 0).toLocaleString()}</span>
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isExpanded ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </div>
                          </div>
                        </div>
                        {request.gnRejectionNote && !isExpanded && (
                          <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
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
                    </div>
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
