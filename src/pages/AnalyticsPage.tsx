import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { patientsApi, treatmentsApi } from "@/services/Api";

interface TreatmentStats {
  totalTreatments: number;
  activeTreatments: number;
  completedTreatments: number;
  suspendedTreatments: number;
  averageDuration: number;
  byType: { name: string; value: number }[];
  byStatus: { name: string; value: number }[];
  byUnit: { unit: string; antibiotics: number; corticoides: number }[];
  durationComparison: { name: string; programmed: number; actual: number }[];
}

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
const STATUS_COLORS: Record<string, string> = {
  active: "#3b82f6",
  finished: "#22c55e",
  suspended: "#f59e0b",
  extended: "#8b5cf6",
};

export function AnalyticsPage() {
  const [stats, setStats] = useState<TreatmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("all");

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        const patients = await patientsApi.getAll();

        // Aggregate treatment data
        let allTreatments: Array<{
          antibioticName: string;
          antibioticType: string;
          status: string;
          daysApplied: number;
          programmedDays: number;
          patientUnit: string;
          startDate: string;
        }> = [];

        for (const patient of patients) {
          try {
            const treatments = await treatmentsApi.getByPatientId(patient.id);
            allTreatments = allTreatments.concat(
              treatments.map((t) => ({
                antibioticName: t.antibioticName,
                antibioticType: t.antibioticType,
                status: t.status,
                daysApplied: t.daysApplied,
                programmedDays: t.programmedDays,
                patientUnit: patient.unit,
                startDate: t.startDate,
              }))
            );
          } catch {
            // Skip patient if treatments can't be loaded
          }
        }

        // Filter by time range
        if (timeRange !== "all") {
          const now = new Date();
          const daysAgo = timeRange === "7d" ? 7 : 30;
          const cutoff = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
          allTreatments = allTreatments.filter(
            (t) => new Date(t.startDate) >= cutoff
          );
        }

        // Calculate statistics
        const activeTreatments = allTreatments.filter((t) => t.status === "active").length;
        const completedTreatments = allTreatments.filter((t) => t.status === "finished").length;
        const suspendedTreatments = allTreatments.filter((t) => t.status === "suspended").length;

        // Average duration of completed treatments
        const completedWithDays = allTreatments.filter((t) => t.status === "finished" && t.daysApplied > 0);
        const averageDuration =
          completedWithDays.length > 0
            ? Math.round(
                completedWithDays.reduce((acc, t) => acc + t.daysApplied, 0) /
                  completedWithDays.length
              )
            : 0;

        // By type
        const antibioticCount = allTreatments.filter((t) => t.antibioticType === "antibiotic").length;
        const corticoideCount = allTreatments.filter((t) => t.antibioticType === "corticoide").length;

        // By status
        const statusCounts: Record<string, number> = {};
        allTreatments.forEach((t) => {
          statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
        });

        // By unit
        const unitData: Record<string, { antibiotics: number; corticoides: number }> = {};
        allTreatments.forEach((t) => {
          if (!unitData[t.patientUnit]) {
            unitData[t.patientUnit] = { antibiotics: 0, corticoides: 0 };
          }
          if (t.antibioticType === "antibiotic") {
            unitData[t.patientUnit].antibiotics++;
          } else {
            unitData[t.patientUnit].corticoides++;
          }
        });

        // Duration comparison (top 5 most used antibiotics)
        const antibioticUsage: Record<string, { programmed: number; actual: number; count: number }> = {};
        allTreatments.forEach((t) => {
          if (!antibioticUsage[t.antibioticName]) {
            antibioticUsage[t.antibioticName] = { programmed: 0, actual: 0, count: 0 };
          }
          antibioticUsage[t.antibioticName].programmed += t.programmedDays;
          antibioticUsage[t.antibioticName].actual += t.daysApplied;
          antibioticUsage[t.antibioticName].count++;
        });

        const durationComparison = Object.entries(antibioticUsage)
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 5)
          .map(([name, data]) => ({
            name: name.length > 12 ? name.substring(0, 12) + "..." : name,
            programmed: Math.round(data.programmed / data.count),
            actual: Math.round(data.actual / data.count),
          }));

        setStats({
          totalTreatments: allTreatments.length,
          activeTreatments,
          completedTreatments,
          suspendedTreatments,
          averageDuration,
          byType: [
            { name: "Antibiotics", value: antibioticCount },
            { name: "Corticoides", value: corticoideCount },
          ],
          byStatus: Object.entries(statusCounts).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value,
          })),
          byUnit: Object.entries(unitData).map(([unit, data]) => ({
            unit,
            ...data,
          })),
          durationComparison,
        });
      } catch (error) {
        console.error("Error loading analytics:", error);
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Treatment Analytics</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Treatment Analytics</h1>
          <p className="text-muted-foreground">
            Overview of treatment patterns and outcomes
          </p>
        </div>
        <Select value={timeRange} onValueChange={(v: "7d" | "30d" | "all") => setTimeRange(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Treatments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTreatments || 0}</div>
            <p className="text-xs text-muted-foreground">
              All treatment programs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {stats?.activeTreatments || 0}
            </div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {stats?.completedTreatments || 0}
            </div>
            <p className="text-xs text-muted-foreground">Successfully finished</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averageDuration || 0}</div>
            <p className="text-xs text-muted-foreground">Days per treatment</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Treatment by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Treatments by Type</CardTitle>
            <CardDescription>Distribution of antibiotics vs corticoides</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.byType && stats.byType.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.byType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props) =>
                      `${props.name ?? ''} (${((props.percent ?? 0) * 100).toFixed(0)}%)`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.byType.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No treatment data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Treatment by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Treatments by Status</CardTitle>
            <CardDescription>Current status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.byStatus && stats.byStatus.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.byStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props) =>
                      `${props.name ?? ''} (${((props.percent ?? 0) * 100).toFixed(0)}%)`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.byStatus.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.name.toLowerCase()] || COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No treatment data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Treatments by Unit */}
        <Card>
          <CardHeader>
            <CardTitle>Treatments by Unit</CardTitle>
            <CardDescription>Treatment distribution across hospital units</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.byUnit && stats.byUnit.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.byUnit}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="unit" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="antibiotics" name="Antibiotics" fill="#3b82f6" />
                  <Bar dataKey="corticoides" name="Corticoides" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No unit data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Duration Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Duration: Programmed vs Actual</CardTitle>
            <CardDescription>Average days by treatment (top 5)</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.durationComparison && stats.durationComparison.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.durationComparison} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="programmed" name="Programmed" fill="#3b82f6" />
                  <Bar dataKey="actual" name="Actual" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No duration data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
