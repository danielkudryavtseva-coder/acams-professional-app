import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { RECRUITING_TIMELINE } from "../data/mockData";

const STAGE_DATA = [
  { name: "Networking", value: 32, fill: "#c63f60" },
  { name: "Applied", value: 15, fill: "#c63f60" },
  { name: "Phone Screen", value: 8, fill: "#c63f60" },
  { name: "Interview", value: 4, fill: "#c63f60" },
  { name: "Offer", value: 1, fill: "#c63f60" },
];

export function AnalyticsSection() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="funnel">Funnel</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recruiting Activity Over Time</CardTitle>
              <CardDescription>Applications and contacts by month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={RECRUITING_TIMELINE} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c63f60" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#c63f60" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorContacts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c63f60" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#c63f60" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 11 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="applications" stroke="#c63f60" fill="url(#colorApps)" name="Applications" />
                  <Area type="monotone" dataKey="contacts" stroke="#c63f60" fill="url(#colorContacts)" name="New Contacts" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Funnel</CardTitle>
              <CardDescription>Contacts at each recruiting stage</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={240}>
                <PieChart>
                  <Pie data={STAGE_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value">
                    {STAGE_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {STAGE_DATA.map((stage) => (
                  <div key={stage.name} className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: stage.fill }} />
                    <span className="text-sm">{stage.name}</span>
                    <span className="ml-auto text-sm font-medium">{stage.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Activity</CardTitle>
              <CardDescription>Contacts made per month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={RECRUITING_TIMELINE} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="contacts" fill="#c63f60" radius={[4, 4, 0, 0]} name="New Contacts" />
                  <Bar dataKey="applications" fill="#c63f60" radius={[4, 4, 0, 0]} name="Applications" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
