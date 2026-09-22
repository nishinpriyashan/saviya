import { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { FileSearch, CheckCircle, XCircle, ChevronDown, ChevronUp, User, MapPin, Banknote, FileText, AlertTriangle, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../firebase/config';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedNumber({ value, duration = 800 }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setDisplay(Math.round(value * p));
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
    GN_VERIFICATION: { label: 'Pending Review',   cls: 'bg-amber-100 text-amber-700' },
    GN_APPROVED:     { label: 'Approved by You',  cls: 'bg-emerald-100 text-emerald-700' },
    GN_REJECTED:     { label: 'Rejected by You',  cls: 'bg-red-100 text-red-600' },
  };
  const s = map[status] || { label: status, cls: 'bg-slate-100 text-slate-600' };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>;
}

function UrgencyBadge({ urgency }) {
  const cls = urgency === 'Critical' ? 'bg-red-100 text-red-600 animate-pulse'
    : urgency === 'High' ? 'bg-orange-100 text-orange-600'
    : 'bg-slate-100 text-slate-600';
  return <span className={`px-2 py-0.5 rounded-lg text-xs font-bold uppercase ${cls}`}>{urgency}</span>;
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

// ── Main ──────────────────────────────────────────────────────────────────────
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
    async function fetchAssigned() {
      if (!userData?.uid) return;
      try {
        const q = query(
          collection(db, 'assistanceRequests'),
          where('assignedGN', '==', userData.uid),
          where('status', '==', 'GN_VERIFICATION')
        );
        const snap = await getDocs(q);
        const profileMap = {};
        const reqList = [];

        for (const reqDoc of snap.docs) {
          const docsSnap = await getDocs(collection(db, `assistanceRequests/${reqDoc.id}/supportingDocuments`));
          const data = reqDoc.data();
          reqList.push({ id: reqDoc.id, ...data, uploadedDocs: docsSnap.docs.map(d => d.data()) });
          if (data.beneficiaryId && !profileMap[data.beneficiaryId]) {
            try {
              const u = await getDoc(doc(db, 'users', data.beneficiaryId));
              if (u.exists()) profileMap[data.beneficiaryId] = u.data();
            } catch (_) {}
          }
        }

        reqList.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
        setRequests(reqList);
        setBeneficiaryProfiles(profileMap);
      } catch (err) {
        toast.error('Failed to load: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAssigned();
  }, [userData]);

  const handleApprove = async (requestId, beneficiaryId) => {
    setProcessing(requestId);
    try {
      await updateDoc(doc(db, 'assistanceRequests', requestId), {
        status: 'GN_APPROVED', gnApprovedAt: serverTimestamp(),
        verifiedBy: userData.uid, updatedAt: serverTimestamp(),
      });
      await addDoc(collection(db, 'auditEvents'), {
        actorId: userData.uid, actorRole: 'gn', action: 'GN_APPROVED',
        entityType: 'assistanceRequest', entityId: requestId,
        beneficiaryId, timestamp: serverTimestamp(),
      });
      setRequests(prev => prev.filter(r => r.id !== requestId));
      toast.success('Approved — sent to Admin for final review.');
    } catch (err) {
      toast.error('Failed to approve: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId, beneficiaryId) => {
    const note = rejectionNotes[requestId]?.trim();
    if (!note) { toast.error('Please provide a rejection reason.'); return; }
    setProcessing(requestId);
    try {
      await updateDoc(doc(db, 'assistanceRequests', requestId), {
        status: 'GN_REJECTED', gnRejectionNote: note,
        gnRejectedAt: serverTimestamp(), verifiedBy: userData.uid, updatedAt: serverTimestamp(),
      });
      await addDoc(collection(db, 'auditEvents'), {
        actorId: userData.uid, actorRole: 'gn', action: 'GN_REJECTED',
        entityType: 'assistanceRequest', entityId: requestId,
        beneficiaryId, gnRejectionNote: note, timestamp: serverTimestamp(),
      });
      setRequests(prev => prev.filter(r => r.id !== requestId));
      toast.success('Rejected — sent to Admin with your note.');
    } catch (err) {
      toast.error('Failed to reject: ' + err.message);
    } finally {
      setProcessing(null);
      setRejectMode(null);
    }
  };

  return (
    <DashboardLayout roleTitle="Grama Niladhari">
      {/* ── Header ── */}
      <div className="mb-10 animate-fade-in-up">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-widest text-violet-600">GN Officer Portal</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Assigned Cases
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Review each request carefully. Your decision is sent to the Admin panel.
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid md:grid-cols-3 gap-4 mb-10">
        {[
          {
            label: 'Pending Review',
            value: loading ? null : requests.length,
            icon: ClipboardList,
            gradient: 'from-amber-500 to-orange-500',
            bg: 'bg-amber-50',
            delay: 0,
          },
          {
            label: 'Your Division',
            value: null,
            text: userData?.gnProfile?.village || 'All Areas',
            icon: MapPin,
            gradient: 'from-primary-500 to-primary-600',
            bg: 'bg-primary/10',
            delay: 80,
          },
          {
            label: 'District',
            value: null,
            text: userData?.gnProfile?.district || '—',
            icon: User,
            gradient: 'from-violet-500 to-violet-600',
            bg: 'bg-violet-50',
            delay: 160,
          },
        ].map(({ label, value, text, icon: Icon, gradient, bg, delay }, i) => (
          <div
            key={i}
            className="stat-card card-hover bg-white border border-border rounded-2xl p-5 shadow-sm overflow-hidden relative"
            style={{ animation: `fadeInUp 0.6s ease both ${delay}ms` }}
          >
            <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full ${bg} blur-xl opacity-60`} />
            <div className="relative">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-md`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
              {value !== null ? (
                <p className="text-3xl font-extrabold text-foreground">
                  {loading ? '—' : <AnimatedNumber value={value} />}
                </p>
              ) : (
                <p className="text-xl font-bold text-foreground">{text}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Cases ── */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center py-20 text-center animate-fade-in">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-5 animate-float">
            <FileSearch className="h-9 w-9 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">All clear! ✅</h3>
          <p className="text-muted-foreground max-w-sm text-sm">No cases are pending your verification right now. Check back later.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request, idx) => {
            const profile = beneficiaryProfiles[request.beneficiaryId] || {};
            const isExpanded = expanded === request.id;
            const isRejecting = rejectMode === request.id;
            return (
              <div
                key={request.id}
                className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                style={{ animation: `fadeInUp 0.5s ease both ${idx * 60}ms` }}
              >
                {/* Urgency bar */}
                <div className={`h-1 ${request.urgency === 'Critical' ? 'bg-red-500' : request.urgency === 'High' ? 'bg-orange-400' : 'bg-slate-200'}`} />

                {/* Collapsed header */}
                <div
                  className="p-5 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(prev => prev === request.id ? null : request.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-lg text-xs font-bold uppercase">{request.category}</span>
                        <UrgencyBadge urgency={request.urgency} />
                        <StatusBadge status={request.status} />
                      </div>
                      <h3 className="text-base font-bold text-foreground line-clamp-1">{request.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />{request.locationSummary}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-lg font-extrabold text-primary">Rs. {parseInt(request.requiredAmount || 0).toLocaleString()}</span>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isExpanded ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded panel */}
                {isExpanded && (
                  <div className="border-t border-border animate-fade-in">
                    <div className="grid md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-border">

                      {/* Left */}
                      <div className="md:col-span-2 p-6 space-y-6">
                        <div>
                          <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4" /> Request Details
                          </h4>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 rounded-xl p-4 border border-border">{request.description}</p>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                            <User className="h-4 w-4" /> Beneficiary Details <span className="text-amber-600">(Private)</span>
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

                        {profile.bankDetails && (
                          <div>
                            <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Banknote className="h-4 w-4" /> Bank Account <span className="text-blue-600">(Private)</span>
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

                      {/* Right */}
                      <div className="p-6 flex flex-col gap-5">
                        <div>
                          <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                            <FileSearch className="h-4 w-4" /> Supporting Documents
                          </h4>
                          {request.uploadedDocs?.length > 0 ? (
                            <ul className="space-y-2">
                              {request.uploadedDocs.map((d, i) => (
                                <li key={i}>
                                  <a href={d.url} target="_blank" rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline flex items-center gap-2 bg-primary/5 px-3 py-2 rounded-xl hover:bg-primary/10 transition-colors">
                                    <FileSearch className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">{d.name || `Document ${i + 1}`}</span>
                                  </a>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground bg-muted rounded-xl p-3">No documents uploaded.</p>
                          )}
                        </div>

                        {isRejecting && (
                          <div className="animate-fade-in-up">
                            <label className="text-sm font-semibold text-destructive mb-2 flex items-center gap-1.5">
                              <AlertTriangle className="h-4 w-4" /> Rejection reason (required)
                            </label>
                            <textarea
                              className="w-full rounded-xl border border-destructive/40 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-destructive/30 min-h-[100px] bg-red-50"
                              placeholder="Explain clearly. This note will be sent to Admin."
                              value={rejectionNotes[request.id] || ''}
                              onChange={e => setRejectionNotes(p => ({ ...p, [request.id]: e.target.value }))}
                            />
                          </div>
                        )}

                        <div className="space-y-3 mt-auto">
                          {!isRejecting ? (
                            <>
                              <Button
                                className="w-full bg-primary hover:bg-primary-700 text-white btn-glow rounded-xl"
                                onClick={() => handleApprove(request.id, request.beneficiaryId)}
                                disabled={processing === request.id}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {processing === request.id ? 'Processing…' : 'Approve → Send to Admin'}
                              </Button>
                              <Button
                                variant="outline"
                                className="w-full border-destructive/40 text-destructive hover:bg-red-50 rounded-xl"
                                onClick={() => setRejectMode(request.id)}
                                disabled={processing === request.id}
                              >
                                <XCircle className="mr-2 h-4 w-4" /> Reject Request
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="destructive" className="w-full rounded-xl"
                                onClick={() => handleReject(request.id, request.beneficiaryId)}
                                disabled={processing === request.id}>
                                <XCircle className="mr-2 h-4 w-4" />
                                {processing === request.id ? 'Processing…' : 'Confirm Rejection'}
                              </Button>
                              <Button variant="outline" className="w-full rounded-xl"
                                onClick={() => setRejectMode(null)}
                                disabled={processing === request.id}>
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
