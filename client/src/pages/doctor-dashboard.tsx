import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Download, FileText, Sparkles, UserCircle, Camera, ClipboardList } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getAuthUser, clearAuthUser } from "@/lib/auth";
import { generatePatientHistoryPDF, generateAISummaryPDF } from "@/lib/pdf-generator";
import { RiskBadge } from "@/components/risk-badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { useLocation } from "wouter";
import { Patient, HealthRecord, Hospital, Doctor } from "@shared/schema";

type PatientWithRecords = Patient & {
  healthRecords: Array<HealthRecord & { hospital: Hospital; doctor: Doctor }>;
};

export default function DoctorDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const user = getAuthUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"id" | "name" | "phone">("name");
  const [selectedPatient, setSelectedPatient] = useState<PatientWithRecords | null>(null);
  const [noteText, setNoteText] = useState("");
  const [showFaceRecognition, setShowFaceRecognition] = useState(false);

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: [`/api/patients/search?q=${searchQuery}&type=${searchType}`],
    enabled: searchQuery.length > 0,
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/doctors/stats"],
  });

  const aiSummaryMutation = useMutation({
    mutationFn: async (patientId: string) => {
      return await apiRequest("POST", "/api/ai/summarize", { patientId });
    },
    onSuccess: (data) => {
      toast({
        title: "AI Summary Generated",
        description: "Summary is ready to download",
      });
      
      if (selectedPatient) {
        generateAISummaryPDF(selectedPatient.name, data.summary);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to generate summary",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async ({ recordId, note }: { recordId: string; note: string }) => {
      return await apiRequest("POST", "/api/notes", {
        healthRecordId: recordId,
        doctorUserId: user?.id,
        note,
      });
    },
    onSuccess: () => {
      toast({
        title: "Note added",
        description: "Your note has been saved successfully",
      });
      setNoteText("");
      // Invalidate all search queries by matching the pattern
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] && 
          typeof query.queryKey[0] === 'string' && 
          query.queryKey[0].startsWith('/api/patients/search')
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add note",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const faceRecognitionMutation = useMutation({
    mutationFn: async (imageData: string) => {
      return await apiRequest("POST", "/api/face-recognition", { imageData });
    },
    onSuccess: (patient: PatientWithRecords) => {
      setSelectedPatient(patient);
      setShowFaceRecognition(false);
      toast({
        title: "Patient Identified",
        description: `Found: ${patient.name}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Recognition failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDownloadPDF = () => {
    if (selectedPatient) {
      generatePatientHistoryPDF(
        selectedPatient,
        selectedPatient.healthRecords,
        `${selectedPatient.name}-health-history.pdf`
      );
      toast({
        title: "PDF Downloaded",
        description: "Patient history has been saved",
      });
    }
  };

  const handleAISummary = () => {
    if (selectedPatient) {
      aiSummaryMutation.mutate(selectedPatient.id);
    }
  };

  const handleLogout = () => {
    clearAuthUser();
    navigate("/");
  };

  if (!user || user.role !== "doctor") {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Doctor Portal</h1>
              <p className="text-sm text-muted-foreground">Welcome, Dr. {user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-8">
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                <UserCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-patients">{stats.totalPatients || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Cases</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-recent-cases">{stats.recentCases || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-pending-reviews">{stats.pendingReviews || 0}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Patient Search</CardTitle>
            <CardDescription>Search by patient ID, name, or phone number</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={searchType} onValueChange={(v) => setSearchType(v as typeof searchType)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="name" data-testid="tab-search-name">Name</TabsTrigger>
                <TabsTrigger value="id" data-testid="tab-search-id">Patient ID</TabsTrigger>
                <TabsTrigger value="phone" data-testid="tab-search-phone">Phone</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Search by ${searchType}...`}
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-patient-search"
                />
              </div>
              <Dialog open={showFaceRecognition} onOpenChange={setShowFaceRecognition}>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-face-recognition">
                    <Camera className="h-4 w-4 mr-2" />
                    Face Recognition
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Face Recognition Demo</DialogTitle>
                    <DialogDescription>
                      This is a demo feature. In production, this would use live camera feed.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="bg-muted rounded-lg h-64 flex items-center justify-center">
                      <Camera className="h-16 w-16 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      Demo: Click "Simulate Recognition" to load a sample patient
                    </p>
                    <Button
                      className="w-full"
                      onClick={() => faceRecognitionMutation.mutate("demo-image")}
                      disabled={faceRecognitionMutation.isPending}
                      data-testid="button-simulate-recognition"
                    >
                      {faceRecognitionMutation.isPending ? "Processing..." : "Simulate Recognition"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {isSearching && (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            )}

            {searchResults && searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((patient: PatientWithRecords) => (
                  <Card
                    key={patient.id}
                    className="cursor-pointer hover-elevate"
                    onClick={() => setSelectedPatient(patient)}
                    data-testid={`card-patient-${patient.id}`}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={patient.profileImage || undefined} />
                          <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{patient.name}</h3>
                          <p className="text-sm text-muted-foreground font-mono">{patient.patientId}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{patient.healthRecords?.length || 0} records</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {searchQuery && searchResults && searchResults.length === 0 && !isSearching && (
              <div className="text-center py-8 text-muted-foreground">
                No patients found matching "{searchQuery}"
              </div>
            )}
          </CardContent>
        </Card>

        {selectedPatient && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedPatient.profileImage || undefined} />
                    <AvatarFallback className="text-xl">{selectedPatient.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl">{selectedPatient.name}</CardTitle>
                    <CardDescription className="font-mono">{selectedPatient.patientId}</CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleDownloadPDF}
                    data-testid="button-download-pdf"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button
                    onClick={handleAISummary}
                    disabled={aiSummaryMutation.isPending}
                    data-testid="button-ai-summary"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {aiSummaryMutation.isPending ? "Generating..." : "AI Summary"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Age</p>
                  <p className="font-medium">{selectedPatient.age || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gender</p>
                  <p className="font-medium">{selectedPatient.gender || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Blood Group</p>
                  <p className="font-medium">{selectedPatient.bloodGroup || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedPatient.phone || "N/A"}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Medical History</h3>
                {selectedPatient.healthRecords && selectedPatient.healthRecords.length > 0 ? (
                  <div className="space-y-4">
                    {selectedPatient.healthRecords.map((record) => (
                      <Card key={record.id}>
                        <CardContent className="p-6 space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-lg">{record.diseaseName}</h4>
                                <RiskBadge level={record.riskLevel as any} />
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {new Date(record.dateTime).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium">Hospital: </span>
                              {record.hospital.name} ({record.hospital.location})
                            </div>
                            <div>
                              <span className="font-medium">Doctor: </span>
                              {record.doctor.name} - {record.doctor.specialization || "General"}
                            </div>
                            <div>
                              <span className="font-medium">Description: </span>
                              {record.diseaseDescription}
                            </div>
                            {record.treatment && (
                              <div>
                                <span className="font-medium">Treatment: </span>
                                {record.treatment}
                              </div>
                            )}
                            {record.emergencyWarnings && (
                              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 mt-2">
                                <span className="font-medium text-destructive">⚠ Warning: </span>
                                {record.emergencyWarnings}
                              </div>
                            )}
                          </div>

                          {record.mediaFiles && record.mediaFiles.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">Attached Files:</p>
                              <div className="flex flex-wrap gap-2">
                                {record.mediaFiles.map((file, idx) => (
                                  <Badge key={idx} variant="secondary">
                                    {file.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="pt-4">
                            <label className="text-sm font-medium">Add Note:</label>
                            <div className="flex gap-2 mt-2">
                              <Textarea
                                placeholder="Add your observations..."
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                className="flex-1"
                                data-testid={`textarea-note-${record.id}`}
                              />
                              <Button
                                onClick={() => addNoteMutation.mutate({ recordId: record.id, note: noteText })}
                                disabled={!noteText || addNoteMutation.isPending}
                                data-testid={`button-add-note-${record.id}`}
                              >
                                Add
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No medical records found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
