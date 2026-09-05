import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { ShieldAlert, Users, FileCheck2, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../firebase/config';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminDashboard() {
  const { userData } = useAuth();
  const [requests, setRequests] = useState([]);
  const [gns, setGns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch GN Officers
        const gnQuery = query(collection(db, 'users'), where('role', '==', 'gn'));
        const gnSnapshot = await getDocs(gnQuery);
        const gnList = gnSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setGns(gnList);

        // Fetch SUBMITTED requests — no orderBy to avoid composite index requirement
        const reqQuery = query(
          collection(db, 'assistanceRequests'),
          where('status', '==', 'SUBMITTED')
        );
        const reqSnapshot = await getDocs(reqQuery);
        const reqList = reqSnapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
        setRequests(reqList);
      } catch (err) {
        console.error("Error fetching admin data:", err);
        toast.error('Failed to load dashboard data: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleAssignGN = async (requestId, gnId) => {
    if (!gnId) return;
    try {
      setAssigning(requestId);
      
      const requestRef = doc(db, 'assistanceRequests', requestId);
      await updateDoc(requestRef, {
        status: 'GN_VERIFICATION',
        assignedGN: gnId,
        assignedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Audit Log
      await addDoc(collection(db, 'auditEvents'), {
        actorId: userData.uid,
        actorRole: 'admin',
        action: 'ASSIGNED_TO_GN',
        entityType: 'assistanceRequest',
        entityId: requestId,
        assignedGN: gnId,
        previousStatus: 'SUBMITTED',
        newStatus: 'GN_VERIFICATION',
        timestamp: serverTimestamp()
      });

      // Remove from list
      setRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (err) {
      console.error("Error assigning GN:", err);
      toast.error("Failed to assign GN. Please check console.");
    } finally {
      setAssigning(null);
    }
  };

  return (
    <DashboardLayout roleTitle="Admin">
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Admin Portal</h1>
        <p className="text-muted-foreground mt-1">Manage system operations and assign cases to GN Officers.</p>
      </div>

      {/* Stat cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Pending Assignment', value: requests.length, icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'GN Officers',        value: gns.length,      icon: Users,       color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'System Health',      value: 'Normal',        icon: Activity,    color: 'text-primary',   bg: 'bg-primary/10', text: true },
        ].map(({ label, value, icon: Icon, color, bg, text }, i) => (
          <div key={i} className={`card-hover stat-card bg-white rounded-2xl border border-border p-6 shadow-sm animate-fade-in-up delay-${(i+1)*100}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">{label}</span>
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
            </div>
            <div className={`text-4xl font-extrabold ${text ? color : 'text-foreground'}`}>{value}</div>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requests Needing GN Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading pending requests...</div>
          ) : requests.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center">
              <FileCheck2 className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">All submitted requests have been assigned.</p>
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Title</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Category</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Location</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Urgency</th>
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Assign GN Officer</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {requests.map(request => (
                    <tr key={request.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle font-medium">{request.title}</td>
                      <td className="p-4 align-middle">{request.category}</td>
                      <td className="p-4 align-middle">{request.locationSummary}</td>
                      <td className="p-4 align-middle">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${request.urgency === 'Critical' ? 'bg-destructive/15 text-destructive' : 'bg-muted'}`}>
                          {request.urgency}
                        </span>
                      </td>
                      <td className="p-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select 
                            className="h-9 w-[200px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            onChange={(e) => handleAssignGN(request.id, e.target.value)}
                            defaultValue=""
                            disabled={assigning === request.id}
                          >
                            <option value="" disabled>Select GN Officer...</option>
                            {gns.map(gn => (
                              <option key={gn.id} value={gn.id}>{gn.displayName} ({gn.email})</option>
                            ))}
                          </select>
                          {assigning === request.id && <span className="text-xs text-muted-foreground">Assigning...</span>}
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
    </DashboardLayout>
  );
}
