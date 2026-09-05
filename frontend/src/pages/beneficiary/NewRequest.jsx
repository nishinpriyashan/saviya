import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, UploadCloud, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select } from '../../components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';

// Convert a File to a Base64 data URL (free, no cloud storage needed)
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const requestSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  title: z.string().min(10, 'Title must be at least 10 characters'),
  description: z.string().min(50, 'Please provide more details (min 50 characters)'),
  requiredAmount: z.coerce.number().min(500, 'Minimum amount is Rs. 500'),
  locationSummary: z.string().min(3, 'Location is required'),
  urgency: z.enum(['Low', 'Medium', 'High', 'Critical']),
});

export default function NewRequest() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      category: '',
      urgency: 'Medium',
    }
  });

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');

      // 1. Create the Request document in Firestore
      const requestData = {
        beneficiaryId: userData.uid,
        ...data,
        status: 'SUBMITTED',
        verificationStatus: 'PENDING',
        visibility: 'PRIVATE',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        submittedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'assistanceRequests'), requestData);
      const requestId = docRef.id;

      // 2. Convert each file to Base64 and store in Firestore subcollection
      //    (Free alternative to Firebase Storage — no billing plan required)
      for (const file of files) {
        try {
          // Warn and skip files that are too large (Firestore doc limit is 1MB)
          if (file.size > 900_000) {
            console.warn(`Skipping ${file.name} — file too large for free storage (max ~900KB).`);
            continue;
          }
          const base64 = await fileToBase64(file);
          await addDoc(collection(db, `assistanceRequests/${requestId}/supportingDocuments`), {
            name:       file.name,
            type:       file.type,
            sizeBytes:  file.size,
            base64Data: base64,           // Stored directly in Firestore — free!
            uploadedAt: new Date().toISOString(),
          });
        } catch (fileErr) {
          console.error('Could not encode file:', file.name, fileErr);
        }
      }

      // 3. Audit log
      await addDoc(collection(db, 'auditEvents'), {
        actorId:        userData.uid,
        actorRole:      'beneficiary',
        action:         'REQUEST_SUBMITTED',
        entityType:     'assistanceRequest',
        entityId:       requestId,
        previousStatus: 'DRAFT',
        newStatus:      'SUBMITTED',
        timestamp:      serverTimestamp(),
      });

      navigate('/beneficiary');
    } catch (err) {
      console.error('Submit error:', err);
      setError('Failed to submit request: ' + (err.message || 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout roleTitle="Beneficiary">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Create Assistance Request</h1>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
              <CardDescription>Provide information about the assistance you need.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && <div className="text-destructive text-sm font-medium">{error}</div>}
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select 
                    options={[
                      { value: 'Medical', label: 'Medical Assistance' },
                      { value: 'Education', label: 'Education Support' },
                      { value: 'Housing', label: 'Housing/Shelter' },
                      { value: 'Food', label: 'Food & Nutrition' },
                      { value: 'Livelihood', label: 'Livelihood Support' },
                      { value: 'Other', label: 'Other' }
                    ]}
                    error={errors.category}
                    {...register('category')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Urgency</Label>
                  <Select 
                    options={[
                      { value: 'Low', label: 'Low' },
                      { value: 'Medium', label: 'Medium' },
                      { value: 'High', label: 'High' },
                      { value: 'Critical', label: 'Critical' }
                    ]}
                    error={errors.urgency}
                    {...register('urgency')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input placeholder="Short summary of the request" error={errors.title} {...register('title')} />
              </div>

              <div className="space-y-2">
                <Label>Detailed Description</Label>
                <textarea 
                  className={`flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[120px] ${errors.description ? 'border-destructive' : ''}`}
                  placeholder="Explain your situation in detail. This will be reviewed by the GN Officer."
                  {...register('description')}
                />
                {errors.description && <span className="text-sm font-medium text-destructive">{errors.description.message}</span>}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Required Amount (LKR)</Label>
                  <Input type="number" placeholder="5000" error={errors.requiredAmount} {...register('requiredAmount')} />
                </div>
                <div className="space-y-2">
                  <Label>Location Summary</Label>
                  <Input placeholder="e.g. Colombo 03, Western Province" error={errors.locationSummary} {...register('locationSummary')} />
                  <p className="text-xs text-muted-foreground">Keep it general to protect your privacy.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Supporting Documents</CardTitle>
              <CardDescription>Upload evidence (Medical reports, GN certificates, bills). These are kept secure and only visible to authorized officials.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-input rounded-xl p-8 text-center flex flex-col items-center justify-center bg-muted/30">
                <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
                <Label htmlFor="file-upload" className="cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 inline-block mb-2">
                  Select Files
                </Label>
                <input 
                  id="file-upload" 
                  type="file" 
                  multiple 
                  className="hidden" 
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
                <p className="text-sm text-muted-foreground">PDF, JPG, PNG · Max <strong>900KB per file</strong></p>
                
                {files.length > 0 && (
                  <div className="mt-6 w-full text-left space-y-2">
                    <p className="font-semibold text-sm">Selected Files:</p>
                    <ul className="text-sm space-y-1">
                      {files.map((file, i) => {
                        const tooLarge = file.size > 900_000;
                        return (
                          <li key={i} className={`flex items-center gap-2 p-2 rounded border ${tooLarge ? 'bg-destructive/10 text-destructive border-destructive/30' : 'bg-background text-muted-foreground'}`}>
                            {tooLarge
                              ? <XCircle className="h-4 w-4 shrink-0" />
                              : <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                            }
                            <span className="truncate">{file.name}</span>
                            {tooLarge && <span className="text-xs ml-auto shrink-0">Too large</span>}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" onClick={() => navigate('/beneficiary')}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit for Verification
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
