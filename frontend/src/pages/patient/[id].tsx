import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Edit2, Save, Activity, PlayCircle, AlertTriangle, Stethoscope, CalendarIcon, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface HealthHistoryEntry {
  conditions: Array<{ name: string; diagnosedDate: string | Date; status: string; startDate: string | Date; endDate: string | Date | null }>;
  allergies: Array<{ name: string; severity: string; reaction: string }>;
  procedures: Array<{ name: string; date: string | Date; category: string; startDate: string | Date; endDate: string | Date }>;
  medications: Array<{ name: string; dosage: string; frequency: string; startDate: string | Date; endDate: string | Date | null }>;
}

type HealthHistoryCategory = keyof HealthHistoryEntry;

interface AlertState {
  type: 'success' | 'error';
  message: string;
}

export default function PatientView() {
  const router = useRouter();
  const { id } = router.query;
  const [healthHistory, setHealthHistory] = useState<HealthHistoryEntry | null>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);

  useEffect(() => {
    if (id) {
      fetchHealthHistory(id as string);
    }
  }, [id]);

  const fetchHealthHistory = async (patientId: string) => {
    try {
      const response = await fetch(`/api/health-history/${patientId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch health history');
      }
      const data = await response.json();
      setHealthHistory(data.healthHistory);
    } catch (error) {
      console.error('Error fetching health history:', error);
      setAlert({ type: 'error', message: 'Failed to load patient data. Please try again later.' });
    }
  };

  const handleEdit = (category: keyof HealthHistoryEntry, index: number) => {
    const item = healthHistory![category][index];
    const editableItem = { ...item, category, index };
    
    // Convert date strings to Date objects for the Calendar component
    if ('diagnosedDate' in editableItem) editableItem.diagnosedDate = new Date(editableItem.diagnosedDate);
    if ('startDate' in editableItem) editableItem.startDate = new Date(editableItem.startDate);
    if ('endDate' in editableItem && editableItem.endDate) editableItem.endDate = new Date(editableItem.endDate);
    if ('date' in editableItem) editableItem.date = new Date(editableItem.date);

    setEditItem(editableItem);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!healthHistory || !editItem) return;

    const category = editItem.category as HealthHistoryCategory;
    const updatedHistory = { ...healthHistory };
    const updatedItem = { ...editItem };

    // Convert Date objects back to string format
    if ('diagnosedDate' in updatedItem) updatedItem.diagnosedDate = format(updatedItem.diagnosedDate, 'yyyy-MM-dd');
    if ('startDate' in updatedItem) updatedItem.startDate = format(updatedItem.startDate, 'yyyy-MM-dd');
    if ('endDate' in updatedItem && updatedItem.endDate) updatedItem.endDate = format(updatedItem.endDate, 'yyyy-MM-dd');
    if ('date' in updatedItem) updatedItem.date = format(updatedItem.date, 'yyyy-MM-dd');

    delete updatedItem.category;
    delete updatedItem.index;

    updatedHistory[category][editItem.index] = updatedItem;

    try {
      const response = await fetch(`/api/health-history/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedHistory),
      });
      if (!response.ok) {
        throw new Error('Failed to save health history');
      }
      setHealthHistory(updatedHistory);
      setIsDialogOpen(false);
      setEditItem(null);
      setAlert({ type: 'success', message: 'Changes saved successfully!' });
    } catch (error) {
      console.error('Error saving health history:', error);
      setAlert({ type: 'error', message: 'Failed to save changes. Please try again.' });
    }
  };

  const getSummary = () => {
    if (!healthHistory) return null;
    return {
      activeConditions: healthHistory.conditions.filter(c => c.status === 'Active').length,
      allergies: healthHistory.allergies.length,
      currentMedications: healthHistory.medications.filter(m => !m.endDate).length,
      recentProcedures: healthHistory.procedures.filter(p => {
        const procedureDate = new Date(p.date);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return procedureDate >= sixMonthsAgo;
      }).length,
    };
  };

  if (!healthHistory) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="w-[250px] h-[20px] rounded-full mb-4" />
        <Skeleton className="w-full h-[300px] rounded-md" />
      </div>
    );
  }

  const summary = getSummary();

  return (
    <div className="container mx-auto px-4 py-8">
      {alert && (
        <Alert variant={alert.type === 'error' ? "destructive" : "default"} className="mb-4">
          {alert.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          <AlertTitle>{alert.type === 'error' ? 'Error' : 'Success'}</AlertTitle>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}
      <h1 className="text-3xl font-bold mb-6">Your Health Summary</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Quick Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <span>{summary?.activeConditions ?? 0} Active Conditions</span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span>{summary?.allergies ?? 0} Allergies</span>
            </div>
            <div className="flex items-center space-x-2">
              <PlayCircle className="h-5 w-5 text-green-500" />
              <span>{summary?.currentMedications ?? 0} Current Medications</span>
            </div>
            <div className="flex items-center space-x-2">
              <Stethoscope className="h-5 w-5 text-purple-500" />
              <span>{summary?.recentProcedures ?? 0} Recent Procedures</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="conditions" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          {Object.keys(healthHistory).map((category) => (
            <TabsTrigger key={category} value={category} className="text-sm">
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>
        {Object.entries(healthHistory).map(([category, items]) => (
          <TabsContent key={category} value={category}>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{category.charAt(0).toUpperCase() + category.slice(1)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((item: any, index: number) => (
                    <Card key={index} className="overflow-hidden">
                      <CardHeader className="bg-muted p-4">
                        <CardTitle className="text-lg">{item.name || `Item ${index + 1}`}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        {Object.entries(item).map(([field, value]) => (
                          field !== 'name' && (
                            <div key={field} className="mb-2">
                              <span className="font-medium capitalize">{field}:</span>{' '}
                              <span className="text-muted-foreground">{value as string || 'N/A'}</span>
                            </div>
                          )
                        ))}
                        <Button
                          onClick={() => handleEdit(category as keyof HealthHistoryEntry, index)}
                          className="mt-4 w-full"
                          variant="outline"
                        >
                          <Edit2 className="mr-2 h-4 w-4" /> Edit
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit {editItem?.category}</DialogTitle>
          </DialogHeader>
          {editItem && (
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
              {Object.entries(editItem).map(([field, value]) => {
                if (field !== 'category' && field !== 'index') {
                  if (['diagnosedDate', 'startDate', 'endDate', 'date'].includes(field)) {
                    return (
                      <div key={field}>
                        <Label htmlFor={field} className="text-sm font-medium">
                          {field.charAt(0).toUpperCase() + field.slice(1)}
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {value ? format(value as Date, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={value as Date}
                              onSelect={(date) => setEditItem({ ...editItem, [field]: date })}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    );
                  } else {
                    return (
                      <div key={field}>
                        <Label htmlFor={field} className="text-sm font-medium">
                          {field.charAt(0).toUpperCase() + field.slice(1)}
                        </Label>
                        <Input
                          id={field}
                          type="text"
                          value={value as string}
                          onChange={(e) => setEditItem({ ...editItem, [field]: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    );
                  }
                }
                return null;
              })}
              <div className="flex justify-end">
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" /> Save Changes
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}