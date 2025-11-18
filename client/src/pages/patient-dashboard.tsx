import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Download, User, Edit, Save, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getAuthUser, clearAuthUser } from "@/lib/auth";
import { generatePatientHistoryPDF } from "@/lib/pdf-generator";
import { RiskBadge } from "@/components/risk-badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { useLocation } from "wouter";
import { Patient, HealthRecord, Hospital, Doctor } from "@shared/schema";

type PatientWithRecords = Patient & {
  healthRecords: Array<HealthRecord & { hospital: Hospital; doctor: Doctor }>;
};

export default function PatientDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const user = getAuthUser();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    age: 0,
    email: "",
    phone: "",
    address: "",
    emergencyContact: "",
  });

  const { data: patientData, isLoading } = useQuery<PatientWithRecords>({
    queryKey: [`/api/patients/me?userId=${user?.id}`],
    enabled: !!user,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<Patient>) => {
      return await apiRequest("PATCH", `/api/patients/me?userId=${user?.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your information has been saved successfully",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key0 = (query as any).queryKey?.[0];
          return typeof key0 === 'string' && key0.startsWith('/api/patients/me');
        }
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditProfile = () => {
    if (patientData) {
      setEditForm({
        name: patientData.name,
        age: patientData.age || 0,
        email: patientData.email || "",
        phone: patientData.phone || "",
        address: patientData.address || "",
        emergencyContact: patientData.emergencyContact || "",
      });
      setIsEditing(true);
    }
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(editForm);
  };

  const handleDownloadPDF = () => {
    if (patientData) {
      generatePatientHistoryPDF(
        patientData,
        patientData.healthRecords,
        `my-health-history.pdf`
      );
      toast({
        title: "PDF Downloaded",
        description: "Your health history has been saved",
      });
    }
  };

  const handleLogout = () => {
    clearAuthUser();
    navigate("/");
  };

  if (!user || user.role !== "patient") {
    navigate("/");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-6 py-4">
            <Skeleton className="h-8 w-48" />
          </div>
        </header>
        <main className="container mx-auto px-6 py-8">
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Patient Portal</h1>
              <p className="text-sm text-muted-foreground">Welcome, {user.name}</p>
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
        {patientData && (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={patientData.profileImage || undefined} />
                      <AvatarFallback className="text-2xl">{patientData.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-2xl">{patientData.name}</CardTitle>
                      <CardDescription className="font-mono">{patientData.patientId}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!isEditing ? (
                      <Button variant="outline" onClick={handleEditProfile} data-testid="button-edit-profile">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          data-testid="button-cancel-edit"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveProfile}
                          disabled={updateProfileMutation.isPending}
                          data-testid="button-save-profile"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {updateProfileMutation.isPending ? "Saving..." : "Save"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!isEditing ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Age</p>
                      <p className="font-medium" data-testid="text-age">{patientData.age || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Gender</p>
                      <p className="font-medium" data-testid="text-gender">{patientData.gender || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Blood Group</p>
                      <p className="font-medium" data-testid="text-blood-group">{patientData.bloodGroup || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium" data-testid="text-email">{patientData.email || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium" data-testid="text-phone">{patientData.phone || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Emergency Contact</p>
                      <p className="font-medium" data-testid="text-emergency-contact">{patientData.emergencyContact || "N/A"}</p>
                    </div>
                    {patientData.address && (
                      <div className="col-span-2 md:col-span-3">
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="font-medium" data-testid="text-address">{patientData.address}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        data-testid="input-edit-name"
                      />
                    </div>
                    <div>
                      <Label>Age</Label>
                      <Input
                        type="number"
                        value={editForm.age}
                        onChange={(e) => setEditForm({ ...editForm, age: parseInt(e.target.value) })}
                        data-testid="input-edit-age"
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        data-testid="input-edit-email"
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        data-testid="input-edit-phone"
                      />
                    </div>
                    <div>
                      <Label>Emergency Contact</Label>
                      <Input
                        value={editForm.emergencyContact}
                        onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })}
                        data-testid="input-edit-emergency-contact"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Address</Label>
                      <Input
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        data-testid="input-edit-address"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>My Health History</CardTitle>
                    <CardDescription>
                      {patientData.healthRecords?.length || 0} medical records
                    </CardDescription>
                  </div>
                  <Button onClick={handleDownloadPDF} data-testid="button-download-history">
                    <Download className="h-4 w-4 mr-2" />
                    Download All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {patientData.healthRecords && patientData.healthRecords.length > 0 ? (
                  <div className="space-y-4">
                    {patientData.healthRecords.map((record) => (
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

                          <Separator />

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
                            {record.prescription && (
                              <div>
                                <span className="font-medium">Prescription: </span>
                                {record.prescription}
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
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No medical records found</p>
                    <p className="text-sm mt-2">Your health records will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
