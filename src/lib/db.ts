import { MongoClient, Db } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { Job, Student, StudentApplication } from './types';

// Global singleton cache for Next.js hot-reloading
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI;
let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

if (uri && uri.trim().length > 0) {
  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    client = new MongoClient(uri);
    clientPromise = client.connect();
  }
}

// Fallback Local File Storage Directory (supports local and Netlify /tmp serverless)
const isServerless = Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL);
const DATA_DIR = isServerless ? path.join('/tmp', 'peerapply-data') : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Only 2 students: Marshal and Vaishnavi
export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'marshal',
    name: 'Marshal',
    email: 'marshal@peerapply.local',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Marshal',
    college: 'Engineering Institute',
    branch: 'Computer Science',
    batch: '2025',
    skills: ['React', 'Next.js', 'Node.js', 'TypeScript', 'Tailwind', 'Python', 'MongoDB'],
  },
  {
    id: 'vaishnavi',
    name: 'Vaishnavi',
    email: 'vaishnavi@peerapply.local',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Vaishnavi',
    college: 'Engineering Institute',
    branch: 'Information Technology',
    batch: '2025',
    skills: ['React', 'JavaScript', 'Python', 'SQL', 'UI/UX', 'Java', 'Full Stack'],
  },
];

interface LocalDatabase {
  students: Student[];
  jobs: Job[];
}

function ensureLocalDb(): LocalDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial: LocalDatabase = {
        students: INITIAL_STUDENTS,
        jobs: [],
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(data) as LocalDatabase;
    parsed.students = INITIAL_STUDENTS;
    if (!Array.isArray(parsed.jobs)) {
      parsed.jobs = [];
    } else {
      // Remove any leftover dummy job IDs
      parsed.jobs = parsed.jobs.filter((j) => !['job-1', 'job-2', 'job-3'].includes(j.id));
    }
    return parsed;
  } catch {
    return {
      students: INITIAL_STUDENTS,
      jobs: [],
    };
  }
}

function writeLocalDb(db: LocalDatabase) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write local database file:', err);
  }
}

async function getMongoDb(): Promise<Db | null> {
  if (!clientPromise) return null;
  try {
    const connectedClient = await clientPromise;
    return connectedClient.db('peerapply');
  } catch (err) {
    console.warn('MongoDB connection failed, falling back to local database store:', err);
    return null;
  }
}

// ----------------------------------------------------
// Database Operations (Transparently MongoDB or Local)
// ----------------------------------------------------

export async function getJobs(): Promise<Job[]> {
  const db = await getMongoDb();
  if (db) {
    try {
      const collection = db.collection<Job>('jobs');
      // Clean any dummy jobs from MongoDB
      await collection.deleteMany({ id: { $in: ['job-1', 'job-2', 'job-3'] } });
      const jobs = await collection.find({}).sort({ createdAt: -1 }).toArray();
      return jobs.map((j) => ({
        ...j,
        id: j.id || (j as unknown as { _id: { toString(): string } })._id.toString(),
        imageUrls: j.imageUrls || (j.imageUrl ? [j.imageUrl] : []),
      }));
    } catch (e) {
      console.warn('Failed reading from MongoDB collection, falling back:', e);
    }
  }

  // Fallback to local JSON DB
  const local = ensureLocalDb();
  const filtered = (local.jobs || []).filter((j) => !['job-1', 'job-2', 'job-3'].includes(j.id));
  if (local.jobs && local.jobs.length !== filtered.length) {
    local.jobs = filtered;
    writeLocalDb(local);
  }
  return filtered
    .map((j) => ({
      ...j,
      imageUrls: j.imageUrls || (j.imageUrl ? [j.imageUrl] : []),
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getJobById(id: string): Promise<Job | null> {
  const jobs = await getJobs();
  return jobs.find((j) => j.id === id) || null;
}

export async function createJob(
  jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'applications'>
): Promise<Job> {
  const now = new Date().toISOString();
  const newJob: Job = {
    ...jobData,
    id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: now,
    updatedAt: now,
    applications: {},
  };

  const db = await getMongoDb();
  if (db) {
    try {
      const collection = db.collection<Job>('jobs');
      await collection.insertOne(newJob as unknown as Job);
      return newJob;
    } catch (e) {
      console.warn('MongoDB insert failed, using local DB:', e);
    }
  }

  const local = ensureLocalDb();
  local.jobs.unshift(newJob);
  writeLocalDb(local);
  return newJob;
}

export async function updateJob(
  id: string,
  updates: Partial<Omit<Job, 'id' | 'createdAt'>>
): Promise<Job | null> {
  const now = new Date().toISOString();
  const db = await getMongoDb();
  if (db) {
    try {
      const collection = db.collection<Job>('jobs');
      const result = await collection.findOneAndUpdate(
        { id },
        { $set: { ...updates, updatedAt: now } },
        { returnDocument: 'after' }
      );
      if (result) {
        const j = result as unknown as Job;
        return {
          ...j,
          imageUrls: j.imageUrls || (j.imageUrl ? [j.imageUrl] : []),
        };
      }
    } catch (e) {
      console.warn('MongoDB updateJob failed, falling back to local DB:', e);
    }
  }

  const local = ensureLocalDb();
  const index = (local.jobs || []).findIndex((j) => j.id === id);
  if (index === -1) return null;
  const updatedJob: Job = {
    ...local.jobs[index],
    ...updates,
    updatedAt: now,
  };
  local.jobs[index] = updatedJob;
  writeLocalDb(local);
  return updatedJob;
}

export async function updateStudentApplication(
  jobId: string,
  application: StudentApplication
): Promise<Job | null> {
  const now = new Date().toISOString();
  const appData: StudentApplication = {
    ...application,
    updatedAt: now,
    appliedAt:
      application.status === 'APPLIED' && !application.appliedAt ? now : application.appliedAt,
  };

  const db = await getMongoDb();
  if (db) {
    try {
      const collection = db.collection<Job>('jobs');
      const key = `applications.${application.studentId}`;
      const result = await collection.findOneAndUpdate(
        { id: jobId },
        {
          $set: {
            [key]: appData,
            updatedAt: now,
          },
        },
        { returnDocument: 'after' }
      );
      if (result) {
        return result as unknown as Job;
      }
    } catch (e) {
      console.warn('MongoDB update application failed, falling back:', e);
    }
  }

  const local = ensureLocalDb();
  const job = local.jobs.find((j) => j.id === jobId);
  if (!job) return null;

  if (!job.applications) job.applications = {};
  job.applications[application.studentId] = appData;
  job.updatedAt = now;

  writeLocalDb(local);
  return job;
}

export async function deleteJob(jobId: string): Promise<boolean> {
  const db = await getMongoDb();
  if (db) {
    try {
      const collection = db.collection<Job>('jobs');
      await collection.deleteOne({ id: jobId });
      return true;
    } catch (e) {
      console.warn('MongoDB delete failed:', e);
    }
  }

  const local = ensureLocalDb();
  const index = local.jobs.findIndex((j) => j.id === jobId);
  if (index === -1) return false;
  local.jobs.splice(index, 1);
  writeLocalDb(local);
  return true;
}

export async function getStudents(): Promise<Student[]> {
  const db = await getMongoDb();
  if (db) {
    try {
      const collection = db.collection<Student>('students');
      await collection.deleteMany({ id: { $nin: ['marshal', 'vaishnavi'] } });
      const students = await collection.find({}).toArray();
      if (students.length === 0) {
        await collection.insertMany(INITIAL_STUDENTS);
        return INITIAL_STUDENTS;
      }
      return students;
    } catch (e) {
      console.warn('MongoDB getStudents failed:', e);
    }
  }

  return INITIAL_STUDENTS;
}

export async function createStudent(studentData: Omit<Student, 'id'>): Promise<Student> {
  const newStudent: Student = {
    ...studentData,
    id: `student-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  };

  const local = ensureLocalDb();
  local.students.push(newStudent);
  writeLocalDb(local);
  return newStudent;
}
