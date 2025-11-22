import { useState } from "react";
import { Plus, X, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAddLabResult, useLabResults, useLabTrends, useReferenceRanges } from "@/hooks/usePredictionsAndLabs";
import { Skeleton } from "@/components/ui/skeleton";

interface LabResultsProps {
  patientId: string;
  canUpload?: boolean;
}

export function LabResults({ patientId, canUpload = false }: LabResultsProps) {
  const { toast } = useToast();
  const { data: labResults, isLoading } = useLabResults(patientId);
  const { data: referenceRanges } = useReferenceRanges();
  const [showUploadForm, setShowUploadForm] = useState(canUpload);

  return (
    <div className="space-y-6">
      {canUpload && showUploadForm && (
        <LabResultUploadForm
          patientId={patientId}
          referenceRanges={referenceRanges?.ranges || {}}
          onSuccess={() => {
            setShowUploadForm(false);
            toast({ title: "Lab result added", description: "Lab result has been saved successfully" });
          }}
        />
      )}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : labResults?.labResults && labResults.labResults.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Previous Lab Results</h3>
            {canUpload && !showUploadForm && (
              <Button onClick={() => setShowUploadForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Another Result
              </Button>
            )}
          </div>
          {labResults.labResults.map((result: any) => (
            <LabResultCard key={result.id} result={result} patientId={patientId} />
          ))}
        </div>
      ) : !showUploadForm ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>No lab results found</p>
            {canUpload && (
              <Button className="mt-4" onClick={() => setShowUploadForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Lab Result
              </Button>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function LabResultUploadForm({ patientId, referenceRanges, onSuccess }: any) {
  const { toast } = useToast();
  const addLabResult = useAddLabResult();
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [testType, setTestType] = useState("Blood Test");
  const [labName, setLabName] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [testResults, setTestResults] = useState<any[]>([]);

  const addTestResult = () => {
    setTestResults([...testResults, {
      testName: "",
      value: 0,
      unit: "",
      normalRange: { min: 0, max: 0 },
      isAbnormal: false,
      severity: undefined
    }]);
  };

  const updateTestResult = (index: number, field: string, value: any) => {
    const updated = [...testResults];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'testName' && referenceRanges[value]) {
      updated[index].normalRange = { min: referenceRanges[value].min, max: referenceRanges[value].max };
      updated[index].unit = referenceRanges[value].unit;
    }

    if (field === 'value' || field === 'testName') {
      const val = updated[index].value;
      const range = updated[index].normalRange;
      if (range && val) {
        updated[index].isAbnormal = val < range.min || val > range.max;
        if (updated[index].isAbnormal) {
          updated[index].severity = val < range.min ? 'low' : 'high';
        }
      }
    }

    setTestResults(updated);
  };

  const removeTestResult = (index: number) => {
    setTestResults(testResults.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!labName || !doctorId || testResults.length === 0) {
      toast({ title: "Missing information", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    const overallStatus = testResults.some(t => t.severity === 'critical') ? 'critical' :
      testResults.some(t => t.isAbnormal) ? 'abnormal' : 'normal';

    try {
      await addLabResult.mutateAsync({
        patientId,
        testDate: new Date(testDate),
        testType,
        orderedBy: doctorId,
        labName,
        results: testResults,
        overallStatus
      });
      onSuccess();
    } catch (error: any) {
      toast({ title: "Failed to add lab result", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Lab Result</CardTitle>
        <CardDescription>Enter laboratory test results for the patient</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Test Date</Label>
            <Input type="date" value={testDate} onChange={(e) => setTestDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Test Type</Label>
            <Select value={testType} onValueChange={setTestType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Blood Test">Blood Test</SelectItem>
                <SelectItem value="Urine Test">Urine Test</SelectItem>
                <SelectItem value="Lipid Profile">Lipid Profile</SelectItem>
                <SelectItem value="Liver Function">Liver Function</SelectItem>
                <SelectItem value="Kidney Function">Kidney Function</SelectItem>
                <SelectItem value="Thyroid Function">Thyroid Function</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Lab Name</Label>
            <Input placeholder="Enter lab name" value={labName} onChange={(e) => setLabName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Doctor ID</Label>
            <Input placeholder="Enter doctor ID" value={doctorId} onChange={(e) => setDoctorId(e.target.value)} />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Test Results</Label>
            <Button size="sm" variant="outline" onClick={addTestResult}>
              <Plus className="h-4 w-4 mr-2" />
              Add Test
            </Button>
          </div>

          {testResults.map((test, index) => (
            <Card key={index}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="grid grid-cols-2 gap-3 flex-1">
                    <div className="space-y-2">
                      <Label className="text-xs">Test Name</Label>
                      <Select value={test.testName} onValueChange={(v) => updateTestResult(index, 'testName', v)}>
                        <SelectTrigger><SelectValue placeholder="Select test" /></SelectTrigger>
                        <SelectContent>
                          {Object.keys(referenceRanges || {}).map((testName) => (
                            <SelectItem key={testName} value={testName}>{testName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Value</Label>
                      <Input type="number" placeholder="0" value={test.value || ''} onChange={(e) => updateTestResult(index, 'value', parseFloat(e.target.value))} />
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => removeTestResult(index)} className="ml-2">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {test.testName && (
                  <div className="text-xs text-muted-foreground">
                    Normal Range: {test.normalRange.min} - {test.normalRange.max} {test.unit}
                    {test.isAbnormal && (
                      <Badge variant="destructive" className="ml-2">
                        {test.severity === 'low' ? 'Low' : 'High'}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Button className="w-full" onClick={handleSubmit} disabled={addLabResult.isPending}>
          {addLabResult.isPending ? "Saving..." : "Save Lab Result"}
        </Button>
      </CardContent>
    </Card>
  );
}

function LabResultCard({ result, patientId }: any) {
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const { data: trends } = useLabTrends(patientId, selectedTest || undefined);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{result.testType}</CardTitle>
            <CardDescription>{new Date(result.testDate).toLocaleDateString()} • {result.labName}</CardDescription>
          </div>
          <Badge variant={result.overallStatus === 'critical' ? 'destructive' : result.overallStatus === 'abnormal' ? 'default' : 'secondary'}>
            {result.overallStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {result.results.map((test: any, idx: number) => (
            <div key={idx} className={`p-3 rounded-lg border ${test.isAbnormal ? 'border-destructive bg-destructive/5' : 'border-border'} cursor-pointer hover:bg-accent/50 transition-colors`} onClick={() => setSelectedTest(test.testName)}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{test.testName}</span>
                {test.isAbnormal && <Badge variant="destructive" className="text-xs">{test.severity}</Badge>}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{test.value}</span>
                <span className="text-sm text-muted-foreground">{test.unit}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Normal: {test.normalRange.min} - {test.normalRange.max}
              </div>
            </div>
          ))}
        </div>

        {selectedTest && trends && (
          <Card className="bg-accent/20">
            <CardHeader>
              <CardTitle className="text-base">Trend: {selectedTest}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-3">
                {(trends as any).trend === 'improving' && <TrendingDown className="h-5 w-5 text-green-500" />}
                {(trends as any).trend === 'worsening' && <TrendingUp className="h-5 w-5 text-red-500" />}
                {(trends as any).trend === 'stable' && <Minus className="h-5 w-5 text-yellow-500" />}
                <span className="font-medium capitalize">{(trends as any).trend}</span>
              </div>
              <div className="space-y-1">
                {((trends as any).data || []).slice(-5).map((point: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{new Date(point.date).toLocaleDateString()}</span>
                    <span className="font-medium">{point.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
