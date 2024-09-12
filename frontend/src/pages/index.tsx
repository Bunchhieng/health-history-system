import React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow">
        <nav className="container mx-auto px-4 py-4">
          <ul className="flex space-x-4">
            <li>
              <Button variant="ghost" asChild>
                <Link href="/">Dashboard</Link>
              </Button>
            </li>
            <li>
              <Button variant="ghost" asChild>
                <Link href="/patient/P001">Patient View</Link>
              </Button>
            </li>
            <li>
              <Button variant="ghost" asChild>
                <Link href="/clinician">Clinician Dashboard</Link>
              </Button>
            </li>
          </ul>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-6">Health History System</h1>
        <p className="text-lg text-muted-foreground mb-8">Welcome to the Health History System. Use the navigation menu above to access different views.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Patient View</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Access and edit your health history.</p>
              <Button asChild>
                <Link href="/patient/P001">View Patient P001</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Clinician View</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Review patient health histories.</p>
              <Button asChild>
                <Link href="/clinician">Clinician Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}