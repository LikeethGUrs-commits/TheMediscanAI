import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import "../server/db"; // ensures mongoose connection (throws if MONGODB_URI missing)
import { db } from "./db";
import {
  Hospitals,
  Doctors,
  Patients,
  HealthRecords,
  Users,
} from "../shared/schema";

function sanitize(s?: string | null) {
  if (s === undefined || s === null) return undefined;
  const t = String(s).trim();
  if (!t) return undefined;
  // strip surrounding quotes (one or more) and whitespace
  return t.replace(/^"+|"+$/g, "");
}

function parseBool(s?: string | null) {
  const v = sanitize(s);
  if (!v) return false;
  return v.toLowerCase() === "true";
}

function parseDate(s?: string | null) {
  const v = sanitize(s);
  if (!v) return undefined;
  const d = new Date(v);
  if (isNaN(d.getTime())) return undefined;
  return d;
}

function readCsv(fileName: string) {
  const p = path.join(process.cwd(), "Data", fileName);
  if (!fs.existsSync(p)) throw new Error(`CSV file not found: ${p}`);
  const raw = fs.readFileSync(p, "utf8");
  const records = parse(raw, { columns: true, skip_empty_lines: true });
  return records as Record<string, string>[];
}

async function importHospitals() {
  const rows = readCsv("hospitals.csv");
  console.log(`Hospitals rows: ${rows.length}`);
  let processed = 0;
  for (const r of rows) {
    const doc = {
      id: sanitize(r["id"]) || undefined,
      hospitalId: sanitize(r["hospital_id"]) || sanitize(r["hospitalId"]) || undefined,
      name: sanitize(r["name"]) || undefined,
      location: sanitize(r["location"]) || undefined,
      contactNumber: sanitize(r["contact_number"]) || sanitize(r["contactNumber"]) || undefined,
      email: sanitize(r["email"]) || undefined,
      logo: sanitize(r["logo"]) || undefined,
      createdAt: parseDate(r["created_at"]) || parseDate(r["createdAt"]) || undefined,
    };

    if (!doc.hospitalId || !doc.name) continue;

    await Hospitals.replaceOne({ hospitalId: doc.hospitalId }, doc, { upsert: true });
    processed++;
  }
  console.log(`Hospitals imported/updated: ${processed}`);
}

async function importDoctors() {
  const rows = readCsv("doctors.csv");
  console.log(`Doctors rows: ${rows.length}`);
  let processed = 0;
  for (const r of rows) {
    const doc = {
      id: sanitize(r["id"]) || undefined,
      doctorId: sanitize(r["doctor_id"]) || sanitize(r["doctorId"]) || undefined,
      name: sanitize(r["name"]) || undefined,
      specialization: sanitize(r["specialization"]) || undefined,
      hospitalId: sanitize(r["hospital_id"]) || sanitize(r["hospitalId"]) || undefined,
      contactNumber: sanitize(r["contact_number"]) || sanitize(r["contactNumber"]) || undefined,
      email: sanitize(r["email"]) || undefined,
      profileImage: sanitize(r["profile_image"]) || sanitize(r["profileImage"]) || undefined,
      createdAt: parseDate(r["created_at"]) || undefined,
    };

    if (!doc.doctorId || !doc.name) continue;
    await Doctors.replaceOne({ doctorId: doc.doctorId }, doc, { upsert: true });
    processed++;
  }
  console.log(`Doctors imported/updated: ${processed}`);
}

async function importPatients() {
  const rows = readCsv("patients.csv");
  console.log(`Patients rows: ${rows.length}`);
  let processed = 0;
  for (const r of rows) {
    const doc: any = {
      id: sanitize(r["id"]) || undefined,
      patientId: sanitize(r["patient_id"]) || sanitize(r["patientId"]) || undefined,
      name: sanitize(r["name"]) || undefined,
      age: r["age"] ? Number(sanitize(r["age"])) : undefined,
      gender: sanitize(r["gender"]) || undefined,
      phone: sanitize(r["phone"]) || undefined,
      email: sanitize(r["email"]) || undefined,
      bloodGroup: sanitize(r["blood_group"]) || sanitize(r["bloodGroup"]) || undefined,
      address: sanitize(r["address"]) || undefined,
      emergencyContact: sanitize(r["emergency_contact"]) || sanitize(r["emergencyContact"]) || undefined,
      profileImage: sanitize(r["profile_image"]) || undefined,
      faceEmbedding: sanitize(r["face_embedding"]) || undefined,
      createdAt: parseDate(r["created_at"]) || undefined,
    };

    if (!doc.patientId || !doc.name) continue;
    await Patients.replaceOne({ patientId: doc.patientId }, doc, { upsert: true });
    processed++;
  }
  console.log(`Patients imported/updated: ${processed}`);
}

async function importHealthRecords() {
  const rows = readCsv("health_records.csv");
  console.log(`Health records rows: ${rows.length}`);
  let processed = 0;
  for (const r of rows) {
    const mediaRaw = sanitize(r["media_files"]);
    let mediaFiles: any[] = [];
    if (mediaRaw) {
      try {
        mediaFiles = JSON.parse(mediaRaw);
      } catch (e) {
        // if not JSON, leave empty
        mediaFiles = [];
      }
    }

    const doc: any = {
      id: sanitize(r["id"]) || undefined,
      patientId: sanitize(r["patient_id"]) || undefined,
      hospitalId: sanitize(r["hospital_id"]) || undefined,
      doctorId: sanitize(r["doctor_id"]) || undefined,
      dateTime: parseDate(r["date_time"]) || undefined,
      diseaseName: sanitize(r["disease_name"]) || undefined,
      diseaseDescription: sanitize(r["disease_description"]) || undefined,
      treatment: sanitize(r["treatment"]) || undefined,
      prescription: sanitize(r["prescription"]) || undefined,
      riskLevel: sanitize(r["risk_level"]) || undefined,
      emergencyWarnings: sanitize(r["emergency_warnings"]) || undefined,
      mediaFiles,
      isEditable: parseBool(r["is_editable"]),
      editableUntil: parseDate(r["editable_until"]) || undefined,
      createdAt: parseDate(r["created_at"]) || undefined,
      updatedAt: parseDate(r["updated_at"]) || undefined,
    };

    if (!doc.id) continue;
    await HealthRecords.replaceOne({ id: doc.id }, doc, { upsert: true });
    processed++;
  }
  console.log(`Health records imported/updated: ${processed}`);
}

async function importUsers() {
  const rows = readCsv("users.csv");
  console.log(`Users rows: ${rows.length}`);
  let processed = 0;
  for (const r of rows) {
    const doc: any = {
      id: sanitize(r["id"]) || undefined,
      name: sanitize(r["name"]) || undefined,
      age: r["age"] ? Number(sanitize(r["age"])) : undefined,
      role: sanitize(r["role"]) || undefined,
      email: sanitize(r["email"]) || undefined,
      phone: sanitize(r["phone"]) || undefined,
      password: sanitize(r["password"]) || undefined,
      roleId: sanitize(r["role_id"]) || sanitize(r["roleId"]) || undefined,
      profileImage: sanitize(r["profile_image"]) || undefined,
      createdAt: parseDate(r["created_at"]) || undefined,
    };

    if (!doc.id || !doc.role) continue;
    await Users.replaceOne({ id: doc.id }, doc, { upsert: true });
    processed++;
  }
  console.log(`Users imported/updated: ${processed}`);
}

async function main() {
  try {
    console.log("Starting CSV import (Data/*.csv)");
    await importHospitals();
    await importDoctors();
    await importPatients();
    await importHealthRecords();
    await importUsers();
    console.log("CSV import completed.");
  } catch (err) {
    console.error("Import error:", err);
  } finally {
    try {
      await new Promise((res) => db.once("close", res));
      // if already closed, attempt close
    } catch (e) {
      // ignore
    }
    try {
      // attempt to close connection
      await db.close();
    } catch (e) {
      // ignore
    }
    process.exit(0);
  }
}

main();
