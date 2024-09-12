import express from 'express';
import { parseHealthHistory, ParsedHealthHistory } from '../../lib/healthHistoryParser';
import { fetchHealthHistoryFromThirdParty, generateMockData } from '../../lib/generateMockData';

const router = express.Router();

// Helper function for data reconciliation
function reconcileData(original: any, patientReviewed: any): any {
  const reconciled = { ...original };

  // Reconcile conditions
  reconciled.conditions = original.conditions.map((condition: any) => {
    const reviewedCondition = patientReviewed.conditions.find((c: any) => c.name === condition.name);
    if (reviewedCondition) {
      return {
        ...condition,
        status: reviewedCondition.status, // Subjective field, prioritize patient input
        details: reviewedCondition.details || condition.details, // Allow patient to add details
        // Keep original dates and diagnosis as they are objective
      };
    }
    return condition;
  });

  // Reconcile allergies
  reconciled.allergies = original.allergies.map((allergy: any) => {
    const reviewedAllergy = patientReviewed.allergies.find((a: any) => a.name === allergy.name);
    if (reviewedAllergy) {
      return {
        ...allergy,
        severity: reviewedAllergy.severity, // Subjective field, prioritize patient input
        reaction: reviewedAllergy.reaction || allergy.reaction, // Allow patient to update reaction
      };
    }
    return allergy;
  });

  // Reconcile procedures (mostly objective, but allow patient to add details)
  reconciled.procedures = original.procedures.map((procedure: any) => {
    const reviewedProcedure = patientReviewed.procedures.find((p: any) => p.name === procedure.name);
    if (reviewedProcedure) {
      return {
        ...procedure,
        details: reviewedProcedure.details || procedure.details,
      };
    }
    return procedure;
  });

  // Reconcile medications
  reconciled.medications = original.medications.map((medication: any) => {
    const reviewedMedication = patientReviewed.medications.find((m: any) => m.name === medication.name);
    if (reviewedMedication) {
      return {
        ...medication,
        dosage: medication.dosage, // Keep original dosage as it's objective
        frequency: reviewedMedication.frequency || medication.frequency, // Allow patient to update frequency
        sideEffects: reviewedMedication.sideEffects || medication.sideEffects, // Allow patient to report side effects
      };
    }
    return medication;
  });

  // Add any new entries from patient review
  ['conditions', 'allergies', 'procedures', 'medications'].forEach((category) => {
    const newEntries = patientReviewed[category].filter((item: any) => 
      !original[category].some((originalItem: any) => originalItem.name === item.name)
    );
    reconciled[category] = [...reconciled[category], ...newEntries];
  });

  return reconciled;
}

// GET parsed health history for a patient
router.get('/:patientId', async (req, res) => {
  const { patientId } = req.params;
  const db = (req as any).db;
  const collection = db.collection('healthHistory');

  try {
    // Check if we have reconciled data in the database
    const storedData = await collection.findOne({ patientId });

    if (storedData) {
      res.json(storedData);
    } else {
      // If not, fetch from third-party API and parse
      const rawData = await fetchHealthHistoryFromThirdParty(patientId);
      const parsedData = parseHealthHistory(rawData);

      // Store the parsed data
      await collection.insertOne(parsedData);

      res.json(parsedData);
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching health history', error });
  }
});

// New route to get all patients (for demonstration purposes)
router.get('/', async (req, res) => {
  const db = (req as any).db;
  const collection = db.collection('healthHistory');

  try {
    const allPatients = await collection.find({}).toArray();
    if (allPatients.length === 0) {
      // If the database is empty, generate and store mock data
      const mockData = generateMockData();
      const parsedData = mockData.map(data => parseHealthHistory(data));
      await collection.insertMany(parsedData);
      res.json(parsedData);
    } else {
      res.json(allPatients);
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all patients', error });
  }
});

// POST updated health history (patient review)
router.post('/:patientId', async (req, res) => {
  const { patientId } = req.params;
  const patientReviewedData = req.body;
  const db = (req as any).db;
  const collection = db.collection('healthHistory');

  try {
    const originalData = await collection.findOne({ patientId });

    if (!originalData) {
      return res.status(404).json({ message: 'Health history not found' });
    }

    const reconciledData = reconcileData(originalData.healthHistory, patientReviewedData);

    const result = await collection.findOneAndUpdate(
      { patientId },
      { $set: { healthHistory: reconciledData } },
      { returnOriginal: false }
    );

    if (result.value) {
      res.json(result.value);
    } else {
      res.status(404).json({ message: 'Health history not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating health history', error });
  }
});

export default router;