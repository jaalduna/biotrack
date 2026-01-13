import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  AlertTriangle,
  Plus,
  Activity,
  TrendingUp,
  Clock,
  Pill,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTeam } from "@/contexts/TeamContext";
import { patientsApi, treatmentsApi } from "@/services/Api";
import type { Patient } from "@/models/Patients";

interface DashboardStats {
  totalPatients: number;
  activePatients: number;
  treatmentsEndingSoon: number;
  activeTreatments: number;
}

interface TreatmentAlert {
  patientName: string;
  patientRut: string;
  antibioticName: string;
  daysRemaining: number;
}

export function DashboardPage() {
  const { user } = useAuth();
  const { team } = useTeam();
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    activePatients: 0,
    treatmentsEndingSoon: 0,
    activeTreatments: 0,
  });
  const [alerts, setAlerts] = useState<TreatmentAlert[]>([]);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const patients = await patientsApi.getAll();

        // Calculate stats
        const activePatients = patients.filter(p => p.status === "active");

        // Get all treatments for all patients to calculate alerts
        const treatmentAlerts: TreatmentAlert[] = [];
        let totalActiveTreatments = 0;
        let treatmentsEndingSoon = 0;

        for (const patient of patients) {
          try {
            const treatments = await treatmentsApi.getByPatientId(patient.id);
            const activeTreatments = treatments.filter(t => t.status === "active");
            totalActiveTreatments += activeTreatments.length;

            for (const treatment of activeTreatments) {
              const daysRemaining = treatment.programmedDays - treatment.daysApplied;
              if (daysRemaining <= 2) {
                treatmentsEndingSoon++;
                treatmentAlerts.push({
                  patientName: patient.name,
                  patientRut: patient.rut,
                  antibioticName: treatment.antibioticName,
                  daysRemaining,
                });
              }
            }
          } catch {
            // Skip patient if treatments can't be loaded
          }
        }

        // Sort alerts by urgency (fewer days remaining first)
        treatmentAlerts.sort((a, b) => a.daysRemaining - b.daysRemaining);

        setStats({
          totalPatients: patients.length,
          activePatients: activePatients.length,
          treatmentsEndingSoon,
          activeTreatments: totalActiveTreatments,
        });
        setAlerts(treatmentAlerts.slice(0, 5)); // Show top 5 alerts
        setRecentPatients(patients.slice(0, 5)); // Show 5 most recent patients
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">
          {greeting()}, {user?.name?.split(" ")[0] || "there"}
        </h1>
        <p className="text-muted-foreground">
          Here's an overview of {team?.name || "your team"}'s patient management.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activePatients} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Treatments</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.activeTreatments}</div>
            <p className="text-xs text-muted-foreground">
              Across all patients
            </p>
          </CardContent>
        </Card>

        <Card className={stats.treatmentsEndingSoon > 0 ? "border-orange-500/50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ending Soon</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${stats.treatmentsEndingSoon > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.treatmentsEndingSoon > 0 ? "text-orange-500" : ""}`}>
              {loading ? "..." : stats.treatmentsEndingSoon}
            </div>
            <p className="text-xs text-muted-foreground">
              Treatments within 2 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Active
            </div>
            <p className="text-xs text-muted-foreground">
              Team is up to date
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Alerts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you can do right now</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link to="/patients">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Users className="h-4 w-4" />
                View All Patients
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
            <Link to="/patients">
              <Button className="w-full justify-start gap-2">
                <Plus className="h-4 w-4" />
                Add New Patient
                <kbd className="ml-auto text-xs bg-primary-foreground/20 px-1.5 py-0.5 rounded">N</kbd>
              </Button>
            </Link>
            <Link to="/settings">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Clock className="h-4 w-4" />
                Manage Bed Settings
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Treatment Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Treatment Alerts
            </CardTitle>
            <CardDescription>Treatments requiring attention soon</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading alerts...</p>
            ) : alerts.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No urgent treatments</p>
                <p className="text-xs text-muted-foreground mt-1">All treatments are on track</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert, index) => (
                  <Link
                    key={index}
                    to={`/patients/${alert.patientRut}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{alert.patientName}</p>
                      <p className="text-xs text-muted-foreground">{alert.antibioticName}</p>
                    </div>
                    <Badge
                      variant={alert.daysRemaining <= 1 ? "destructive" : "secondary"}
                      className="shrink-0"
                    >
                      {alert.daysRemaining === 0
                        ? "Today"
                        : alert.daysRemaining === 1
                        ? "1 day"
                        : `${alert.daysRemaining} days`}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Patients */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Patients</CardTitle>
          <CardDescription>Recently added or updated patients</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading patients...</p>
          ) : recentPatients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">No patients yet</p>
              <Link to="/patients">
                <Button className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Add Your First Patient
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentPatients.map((patient) => (
                <Link
                  key={patient.id}
                  to={`/patients/${patient.rut}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {patient.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{patient.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {patient.rut} • {patient.unit} Bed {patient.bedNumber}
                      </p>
                    </div>
                  </div>
                  <Badge variant={patient.status === "active" ? "default" : "secondary"}>
                    {patient.status}
                  </Badge>
                </Link>
              ))}
              <Link to="/patients">
                <Button variant="ghost" className="w-full mt-2">
                  View all patients
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
