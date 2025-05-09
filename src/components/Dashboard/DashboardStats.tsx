
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardStat } from "@/types";

interface DashboardStatsProps {
  stats: DashboardStat[];
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            {stat.change !== undefined && (
              <p className={`text-xs ${stat.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stat.change >= 0 ? "+" : ""}{stat.change}% from last month
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default DashboardStats;
