import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface HealthHistoryEntry {
  conditions: Array<{ name: string; diagnosedDate: string; status: string; startDate: string; endDate: string | null }>;
  allergies: Array<{ name: string; severity: string; reaction: string }>;
  procedures: Array<{ name: string; date: string; category: string; startDate: string; endDate: string }>;
  medications: Array<{ name: string; dosage: string; frequency: string; startDate: string; endDate: string | null }>;
}

export default function ClinicianPatientView() {
  const router = useRouter();
  const { id } = router.query;
  const [healthHistory, setHealthHistory] = useState<HealthHistoryEntry | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (id) {
        try {
          const response = await fetch(`/api/health-history/${id}`);
          const data = await response.json();
          setHealthHistory(data.healthHistory);
        } catch (error) {
          console.error('Error fetching health history:', error);
        }
      }
    }
    fetchData();
  }, [id]);

  if (!healthHistory) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <h1 className="text-3xl font-bold text-gray-900">Patient {id} Health History</h1>
          <Link href="/clinician" passHref>
            <Button variant="outline">← Back to Patient List</Button>
          </Link>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent>
            <Tabs defaultValue="conditions">
              <TabsList>
                {Object.keys(healthHistory).map((category) => (
                  <TabsTrigger key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </TabsTrigger>
                ))}
              </TabsList>
              {Object.entries(healthHistory).map(([category, items]) => (
                <TabsContent key={category} value={category}>
                  <h2 className="text-2xl font-semibold mb-4 capitalize">{category}</h2>
                  <ul className="space-y-4">
                    {items.map((item: any, index: number) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          {Object.entries(item).map(([field, value]) => (
                            <div key={field} className="mb-2">
                              <span className="font-medium capitalize">{field}:</span>{' '}
                              <span className="text-gray-700">{value as string}</span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ))}
                  </ul>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </main>

      <footer className="bg-white shadow mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">© 2023 HealthTrack. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}