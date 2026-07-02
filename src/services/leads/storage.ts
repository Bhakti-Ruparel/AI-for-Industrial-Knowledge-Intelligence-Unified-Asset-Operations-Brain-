// ═══════════════════════════════════════════════════════════════════════════════
// Lead Storage — JSON file persistence (migrated from Flask)
// Will be replaced with Supabase/Prisma when configured
// ═══════════════════════════════════════════════════════════════════════════════

import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const DATA_DIR = path.join(process.cwd(), "data");
const LEADS_DIR = path.join(DATA_DIR, "leads");
const SERVICE_DIR = path.join(DATA_DIR, "service_requests");
const FEEDBACK_DIR = path.join(DATA_DIR, "feedback");

async function ensureDir(dir: string) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {
    // Already exists
  }
}

export interface LeadData {
  reference_number?: string;
  timestamp?: string;
  lead_priority?: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  state: string;
  city: string;
  village?: string;
  industry?: string;
  machine_category: string;
  series: string;
  model: string;
  model_label?: string;
  purchase_timeline: string;
  remarks?: string;
  language?: string;
  sizing_params?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ServiceRequestData {
  reference_number?: string;
  timestamp?: string;
  machine_model: string;
  serial_number: string;
  name: string;
  phone: string;
  company: string;
  city: string;
  state: string;
  problem: string;
  [key: string]: unknown;
}

export interface FeedbackData {
  reference_number?: string;
  timestamp?: string;
  name: string;
  company: string;
  phone: string;
  machine_model: string;
  rating: number;
  [key: string]: unknown;
}

export async function saveLead(data: LeadData): Promise<{ reference: string; data: LeadData }> {
  await ensureDir(LEADS_DIR);

  const ref = `COSMOS-${uuidv4().replace(/-/g, "").substring(0, 6).toUpperCase()}`;
  const ts = new Date();

  data.reference_number = ref;
  data.timestamp = ts.toISOString();

  const fname = `cosmos_${formatTimestamp(ts)}_${ref.split("-")[1]}.json`;
  const fpath = path.join(LEADS_DIR, fname);

  await fs.writeFile(fpath, JSON.stringify(data, null, 2), "utf-8");
  return { reference: ref, data };
}

export async function saveServiceRequest(data: ServiceRequestData): Promise<string> {
  await ensureDir(SERVICE_DIR);
  return saveJson(SERVICE_DIR, "SR", data);
}

export async function saveFeedback(data: FeedbackData): Promise<string> {
  await ensureDir(FEEDBACK_DIR);
  return saveJson(FEEDBACK_DIR, "FB", data);
}

async function saveJson(directory: string, prefix: string, data: Record<string, unknown>): Promise<string> {
  const ref = `${prefix}-${uuidv4().replace(/-/g, "").substring(0, 6).toUpperCase()}`;
  const ts = new Date();
  data.reference_number = ref;
  data.timestamp = ts.toISOString();

  const fname = `${prefix.toLowerCase()}_${formatTimestamp(ts)}_${ref.split("-")[1]}.json`;
  await fs.writeFile(path.join(directory, fname), JSON.stringify(data, null, 2), "utf-8");
  return ref;
}

export async function loadAllLeads(): Promise<LeadData[]> {
  return loadAllJson<LeadData>(LEADS_DIR);
}

export async function loadAllServiceRequests(): Promise<ServiceRequestData[]> {
  return loadAllJson<ServiceRequestData>(SERVICE_DIR);
}

export async function loadAllFeedback(): Promise<FeedbackData[]> {
  return loadAllJson<FeedbackData>(FEEDBACK_DIR);
}

async function loadAllJson<T>(directory: string): Promise<T[]> {
  await ensureDir(directory);
  const records: T[] = [];

  try {
    const files = await fs.readdir(directory);
    const jsonFiles = files.filter((f) => f.endsWith(".json")).sort().reverse();

    for (const fname of jsonFiles) {
      try {
        const content = await fs.readFile(path.join(directory, fname), "utf-8");
        records.push(JSON.parse(content));
      } catch {
        // Skip invalid files
      }
    }
  } catch {
    // Directory doesn't exist yet
  }

  return records;
}

function formatTimestamp(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${y}${m}${d}_${h}${min}${s}`;
}
