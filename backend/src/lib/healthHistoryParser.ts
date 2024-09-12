import { z } from 'zod';
import { logger } from './logger';

interface Condition {
  name: string;
  diagnosedDate: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
}

interface Allergy {
  name: string;
  severity: string | null;
  reaction: string | null;
}

interface Procedure {
  name: string;
  date: string | null;
  category: string | null;
  startDate: string | null;
  endDate: string | null;
}

interface Medication {
  name: string;
  dosage: string | null;
  frequency: string | null;
  startDate: string | null;
  endDate: string | null;
}

interface HealthHistory {
  conditions: Condition[];
  allergies: Allergy[];
  procedures: Procedure[];
  medications: Medication[];
}

export interface ParsedHealthHistory {
  patientId: string;
  healthHistory: HealthHistory;
}

interface GenericHealthRecord {
  [key: string]: any;
}

const fieldMappings = {
  conditions: {
    name: ['name', 'conditionName', 'diagnosis'],
    diagnosedDate: ['diagnosedDate', 'dateOfDiagnosis'],
    status: ['status', 'conditionStatus'],
    startDate: ['startDate', 'onsetDate'],
    endDate: ['endDate', 'resolutionDate']
  },
  allergies: {
    name: ['name', 'allergyName'],
    severity: ['severity', 'allergySeverity'],
    reaction: ['reaction', 'allergyReaction']
  },
  procedures: {
    name: ['name', 'procedureName'],
    date: ['date', 'procedureDate'],
    category: ['category', 'procedureCategory'],
    startDate: ['startDate'],
    endDate: ['endDate']
  },
  medications: {
    name: ['name', 'medicationName'],
    dosage: ['dosage', 'medicationDosage'],
    frequency: ['frequency', 'medicationFrequency'],
    startDate: ['startDate'],
    endDate: ['endDate']
  }
};

const HealthHistorySchema = z.object({
  patientId: z.string(),
  healthHistory: z.object({
    conditions: z.array(z.record(z.unknown())),
    allergies: z.array(z.record(z.unknown())),
    procedures: z.array(z.record(z.unknown())),
    medications: z.array(z.record(z.unknown()))
  }).and(z.record(z.unknown())) // Allow additional fields
});

function normalizeDate(date: string | null): string | null {
  if (!date) return null;
  const parsedDate = new Date(date);
  return isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString().split('T')[0];
}

function normalizeString(str: string | null): string | null {
  return str ? str.trim().toLowerCase() : null;
}

function normalizeDosage(dosage: string | null): string | null {
  if (!dosage) return null;
  // Convert all to mg for consistency
  if (dosage.includes('g')) {
    const value = parseFloat(dosage) * 1000;
    return `${value}mg`;
  }
  return dosage;
}

function mapField(item: any, mappings: string[]): any {
  for (const mapping of mappings) {
    if (item[mapping] !== undefined) return item[mapping];
  }
  return null;
}

function parseHealthHistoryItem(item: any, categoryMappings: Record<string, string[]>): any {
  const parsedItem: Record<string, any> = {};
  
  for (const [key, mappings] of Object.entries(categoryMappings)) {
    parsedItem[key] = mapField(item, mappings);
  }

  // Normalize fields
  if ('diagnosedDate' in parsedItem) parsedItem.diagnosedDate = normalizeDate(parsedItem.diagnosedDate);
  if ('startDate' in parsedItem) parsedItem.startDate = normalizeDate(parsedItem.startDate);
  if ('endDate' in parsedItem) parsedItem.endDate = normalizeDate(parsedItem.endDate);
  if ('name' in parsedItem) parsedItem.name = normalizeString(parsedItem.name);
  if ('status' in parsedItem) parsedItem.status = normalizeString(parsedItem.status);
  if ('dosage' in parsedItem) parsedItem.dosage = normalizeDosage(parsedItem.dosage);

  // Include any additional fields not in our mapping
  for (const [key, value] of Object.entries(item)) {
    if (!(key in parsedItem)) {
      parsedItem[key] = value;
      logger.info(`New field encountered: ${key} in category ${categoryMappings.name[0]}`);
    }
  }

  return parsedItem;
}

function removeDuplicates<T>(array: T[], key: keyof T): T[] {
  return Array.from(new Map(array.map(item => [item[key], item])).values());
}

export function parseHealthHistory(data: unknown, version: string = 'v1'): ParsedHealthHistory {
  try {
    const validatedData = HealthHistorySchema.parse(data);
    
    const parsedData: ParsedHealthHistory = {
      patientId: validatedData.patientId,
      healthHistory: {
        conditions: [],
        allergies: [],
        procedures: [],
        medications: []
      }
    };

    // Parse known categories
    for (const category of ['conditions', 'allergies', 'procedures', 'medications'] as const) {
      parsedData.healthHistory[category] = validatedData.healthHistory[category]
        .map(item => parseHealthHistoryItem(item, fieldMappings[category]))
        .filter(item => item.name && item.name !== "JUNK DATA");
    }

    // Handle any additional categories
    for (const [key, value] of Object.entries(validatedData.healthHistory)) {
      if (!['conditions', 'allergies', 'procedures', 'medications'].includes(key)) {
        if (Array.isArray(value)) {
          (parsedData.healthHistory as any)[key] = value.map(item => parseHealthHistoryItem(item, {}));
          logger.info(`New category encountered: ${key}`);
        }
      }
    }

    // Remove duplicates
    for (const category of Object.keys(parsedData.healthHistory) as Array<keyof HealthHistory>) {
      parsedData.healthHistory[category] = removeDuplicates(parsedData.healthHistory[category] as any[], 'name') as any;
    }

    // Data quality check
    const qualityIssues = checkDataQuality(parsedData);
    if (qualityIssues.length > 0) {
      logger.warn('Data quality issues detected', { issues: qualityIssues });
    }

    return parsedData;
  } catch (error) {
    logger.error('Error parsing health history', { error });
    throw new Error('Failed to parse health history data');
  }
}

function checkDataQuality(data: ParsedHealthHistory): string[] {
  const issues: string[] = [];

  // Check for missing required fields
  for (const category of Object.keys(data.healthHistory) as Array<keyof HealthHistory>) {
    for (const item of data.healthHistory[category]) {
      if (!item.name) {
        issues.push(`Missing name in ${category}`);
      }
    }
  }

  // Check for future dates
  const now = new Date();
  for (const condition of data.healthHistory.conditions) {
    if (condition.diagnosedDate && new Date(condition.diagnosedDate) > now) {
      issues.push(`Future diagnosed date for condition: ${condition.name}`);
    }
  }

  // Add more quality checks as needed

  return issues;
}

// Version-specific parsing logic could be added here
function parseHealthHistoryV2(data: unknown): ParsedHealthHistory {
  // Implement v2 parsing logic
  throw new Error('V2 parsing not implemented');
}

export function parseHealthHistoryVersioned(data: unknown, version: string): ParsedHealthHistory {
  switch (version) {
    case 'v1':
      return parseHealthHistory(data);
    case 'v2':
      return parseHealthHistoryV2(data);
    default:
      throw new Error(`Unsupported version: ${version}`);
  }
}