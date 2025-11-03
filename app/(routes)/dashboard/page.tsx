'use client'

import { useCalendarEvents } from '@/hooks/use-calendar-events'
import { useUser } from '@/hooks/use-user'
import { format, addDays } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser()
  const {
    events,
    loading: eventsLoading,
  } = useCalendarEvents(user?.uid || null)
  const router = useRouter();

  // Filter events
  const now = new Date();
  const upcomingEvents = events.filter(event => {
    const start = new Date(event.start);
    return start > now && !event.allDay;
  });

  const liveEvents = events.filter(event => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    return start <= now && now < end && !event.allDay;
  });

  // Prepare data for the bar chart (next 7 days)
  const chartData = [];
  for (let i = 0; i < 7; i++) {
    const day = addDays(now, i);
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    
    const count = upcomingEvents.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= dayStart && eventDate <= dayEnd;
    }).length;

    chartData.push({
      name: format(day, 'EEE'),
      date: format(day, 'MMM d'),
      count
    });
  }

  // Show loading state
  if (userLoading || eventsLoading) {
    return (
      <div className="w-full h-full p-6 flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Chart Section */}
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Upcoming Calls Distribution (Next 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, 'Number of Calls']} labelFormatter={(label) => `Day: ${label}`} />
                  <Line type="monotone" dataKey="count" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        {/* Live Calls Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Live Calls 
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {liveEvents.length === 0 ? (
              <p className="text-muted-foreground">No live calls at the moment</p>
            ) : (
              <div className="space-y-4">
                {liveEvents.map(event => (
                  <div key={event.id} className="border rounded-lg p-4">
                    <h3 className="font-semibold">{event.title}</h3>
                    <div className="text-sm text-muted-foreground mt-1">
                      {format(new Date(event.start), 'h:mm a')} - {format(new Date(event.end), 'h:mm a')}
                    </div>
                    <div className="mt-2 text-sm text-red-500">
                      Live now
                    </div>
                    <Button 
                      className="mt-2" 
                      onClick={() => router.push(`/meetings/${event.id}?name=${encodeURIComponent(event.title)}`)}
                    >
                      Join
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Calls Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Calls</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-muted-foreground">No upcoming calls scheduled</p>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.map(event => (
                  <div key={event.id} className="border rounded-lg p-4">
                    <h3 className="font-semibold">{event.title}</h3>
                    <div className="text-sm text-muted-foreground mt-1">
                      {format(new Date(event.start), 'EEE, MMM d, h:mm a')}
                    </div>
                    <div className="mt-2 text-sm text-blue-500">
                      Upcoming
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}