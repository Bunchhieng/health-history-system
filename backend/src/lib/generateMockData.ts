import { Db } from 'mongodb';

interface HealthHistoryData {
  patientId: string;
  healthHistory: {
    conditions: any[];
    allergies: any[];
    procedures: any[];
    medications: any[];
  };
}

function getRandomDate(start: Date, end: Date): string {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
}

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomPatientData(patientId: string): HealthHistoryData {
  const conditions = [
    "Type 2 Diabetes", "Hypertension", "Asthma", "Arthritis", "Depression",
    "Anxiety", "Obesity", "Chronic Pain", "GERD", "Migraine"
  ];

  const allergies = [
    "Penicillin", "Peanuts", "Latex", "Dust Mites", "Shellfish",
    "Eggs", "Soy", "Wheat", "Tree Nuts", "Milk"
  ];

  const procedures = [
    "Appendectomy", "Wisdom Teeth Extraction", "Colonoscopy", "Knee Replacement",
    "Cataract Surgery", "Tonsillectomy", "Gallbladder Removal", "Hernia Repair",
    "Skin Biopsy", "Cardiac Catheterization"
  ];

  const medications = [
    "Metformin", "Lisinopril", "Levothyroxine", "Amlodipine", "Metoprolol",
    "Omeprazole", "Gabapentin", "Sertraline", "Atorvastatin", "Albuterol"
  ];

  const statuses = ["Active", "Resolved", "Unknown"];
  const severities = ["Mild", "Moderate", "Severe"];

  return {
    patientId,
    healthHistory: {
      conditions: Array(Math.floor(Math.random() * 5) + 1).fill(null).map(() => ({
        name: getRandomItem(conditions),
        diagnosedDate: getRandomDate(new Date(2010, 0, 1), new Date()),
        status: getRandomItem(statuses),
        startDate: getRandomDate(new Date(2010, 0, 1), new Date()),
        endDate: Math.random() > 0.7 ? getRandomDate(new Date(2015, 0, 1), new Date()) : null
      })),
      allergies: Array(Math.floor(Math.random() * 3) + 1).fill(null).map(() => ({
        name: getRandomItem(allergies),
        severity: getRandomItem(severities),
        reaction: "Various symptoms"
      })),
      procedures: Array(Math.floor(Math.random() * 3) + 1).fill(null).map(() => ({
        name: getRandomItem(procedures),
        date: getRandomDate(new Date(2010, 0, 1), new Date()),
        category: "General",
        startDate: getRandomDate(new Date(2010, 0, 1), new Date()),
        endDate: getRandomDate(new Date(2015, 0, 1), new Date())
      })),
      medications: Array(Math.floor(Math.random() * 4) + 1).fill(null).map(() => ({
        name: getRandomItem(medications),
        dosage: `${Math.floor(Math.random() * 500) + 100} mg`,
        frequency: getRandomItem(["Once daily", "Twice daily", "As needed"]),
        startDate: getRandomDate(new Date(2010, 0, 1), new Date()),
        endDate: Math.random() > 0.6 ? getRandomDate(new Date(2015, 0, 1), new Date()) : null
      }))
    }
  };
}

export function generateMockData(): HealthHistoryData[] {
  return Array(100).fill(null).map((_, index) => 
    generateRandomPatientData(`P${(index + 1).toString().padStart(3, '0')}`)
  );
}

export async function fetchHealthHistoryFromThirdParty(patientId: string): Promise<HealthHistoryData> {
  // In a real scenario, this would make an HTTP request to the third-party service
  // For now, we'll return a random patient from our mock data
  const allPatients = generateMockData();
  const patient = allPatients.find(p => p.patientId === patientId) || allPatients[0];
  return patient;
}

export async function ensureMockDataInDatabase(db: Db): Promise<void> {
  const collection = db.collection('healthHistory');
  
  try {
    // Check if there's any data in the collection
    const count = await collection.countDocuments();
    console.log(`Current document count in healthHistory collection: ${count}`);
    
    if (count === 0) {
      console.log('No data found in the database. Generating and inserting mock data...');
      const mockData = generateMockData();
      
      try {
        const result = await collection.insertMany(mockData);
        console.log(`Successfully inserted ${result.insertedCount} mock patient records.`);
      } catch (error) {
        console.error('Error inserting mock data:', error);
        throw error;
      }
    } else {
      console.log(`Database already contains ${count} patient records. Skipping mock data insertion.`);
    }
  } catch (error) {
    console.error('Error in ensureMockDataInDatabase:', error);
    throw error;
  }
}