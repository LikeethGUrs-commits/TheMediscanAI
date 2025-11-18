// shared/schema.ts
import mongoose, { Schema, Document } from "mongoose";
import { z } from "zod";

// Mongoose document interfaces
export interface IUser extends Document {
  id: string;
  name: string;
  age?: number;
  role: string;
  email?: string;
  phone?: string;
  password: string;
  roleId: string;
  profileImage?: string;
  createdAt: Date;
}

export interface IHospital extends Document {
  id: string;
  hospitalId: string;
  name: string;
  location: string;
  contactNumber?: string;
  email?: string;
  logo?: string;
  createdAt: Date;
}

export interface IDoctor extends Document {
  id: string;
  doctorId: string;
  name: string;
  specialization?: string;
  hospitalId: string;
  contactNumber?: string;
  email?: string;
  profileImage?: string;
  createdAt: Date;
}

export interface IPatient extends Document {
  id: string;
  patientId: string;
  name: string;
  age?: number;
  gender?: string;
  phone?: string;
  email?: string;
  bloodGroup?: string;
  address?: string;
  emergencyContact?: string;
  profileImage?: string;
  faceEmbedding?: string;
  createdAt: Date;
}

export interface IHealthRecord extends Document {
  id: string;
  patientId: string;
  hospitalId: string;
  doctorId: string;
  dateTime: Date;
  diseaseName: string;
  diseaseDescription: string;
  treatment?: string | null;
  prescription?: string | null;
  riskLevel: string;
  emergencyWarnings?: string | null;
  mediaFiles?: Array<{ type: string; url: string; name: string }>;
  isEditable: boolean;
  editableUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDoctorNote extends Document {
  id: string;
  healthRecordId: string;
  doctorUserId: string;
  note: string;
  createdAt: Date;
}

// Define Mongoose schemas
const baseOptions = { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } };

const UserSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  age: Number,
  role: { type: String, required: true },
  email: String,
  phone: String,
  password: { type: String, required: true },
  roleId: { type: String, required: true },
  profileImage: String,
}, baseOptions);

const HospitalSchema = new Schema({
  id: { type: String, required: true },
  hospitalId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  location: { type: String, required: true },
  contactNumber: String,
  email: String,
  logo: String,
}, baseOptions);

const DoctorSchema = new Schema({
  id: { type: String, required: true },
  doctorId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  specialization: String,
  hospitalId: { type: String, required: true },
  contactNumber: String,
  email: String,
  profileImage: String,
}, baseOptions);

const PatientSchema = new Schema({
  id: { type: String, required: true },
  patientId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  age: Number,
  gender: String,
  phone: String,
  email: String,
  bloodGroup: String,
  address: String,
  emergencyContact: String,
  profileImage: String,
  faceEmbedding: String,
}, baseOptions);

const HealthRecordSchema = new Schema({
  id: { type: String, required: true },
  patientId: { type: String, required: true },
  hospitalId: { type: String, required: true },
  doctorId: { type: String, required: true },
  dateTime: { type: Date, required: true },
  diseaseName: { type: String, required: true },
  diseaseDescription: { type: String, required: true },
  treatment: { type: String, default: null },
  prescription: { type: String, default: null },
  riskLevel: { type: String, required: true },
  emergencyWarnings: { type: String, default: null },
  mediaFiles: { type: Array, default: [] },
  isEditable: { type: Boolean, default: true },
  editableUntil: Date,
}, baseOptions);

const DoctorNoteSchema = new Schema({
  id: { type: String, required: true },
  healthRecordId: { type: String, required: true },
  doctorUserId: { type: String, required: true },
  note: { type: String, required: true },
}, { timestamps: { createdAt: "createdAt" } });

// Register models
export const Users = mongoose.models.Users || mongoose.model<IUser>("Users", UserSchema);
export const Hospitals = mongoose.models.Hospitals || mongoose.model<IHospital>("Hospitals", HospitalSchema);
export const Doctors = mongoose.models.Doctors || mongoose.model<IDoctor>("Doctors", DoctorSchema);
export const Patients = mongoose.models.Patients || mongoose.model<IPatient>("Patients", PatientSchema);
export const HealthRecords = mongoose.models.HealthRecords || mongoose.model<IHealthRecord>("HealthRecords", HealthRecordSchema);
export const DoctorNotes = mongoose.models.DoctorNotes || mongoose.model<IDoctorNote>("DoctorNotes", DoctorNoteSchema);

// Zod schemas used by routes for input validation
export const insertUserSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  age: z.number().optional(),
  role: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string(),
  roleId: z.string(),
  profileImage: z.string().optional(),
});

export const insertHospitalSchema = z.object({
  id: z.string().optional(),
  hospitalId: z.string(),
  name: z.string(),
  location: z.string(),
  contactNumber: z.string().optional(),
  email: z.string().optional(),
  logo: z.string().optional(),
});

export const insertDoctorSchema = z.object({
  id: z.string().optional(),
  doctorId: z.string(),
  name: z.string(),
  specialization: z.string().optional(),
  hospitalId: z.string(),
  contactNumber: z.string().optional(),
  email: z.string().optional(),
  profileImage: z.string().optional(),
});

export const insertPatientSchema = z.object({
  id: z.string().optional(),
  patientId: z.string(),
  name: z.string(),
  age: z.number().optional(),
  gender: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  bloodGroup: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  profileImage: z.string().optional(),
  faceEmbedding: z.string().optional(),
});

export const insertHealthRecordSchema = z.object({
  id: z.string().optional(),
  patientId: z.string(),
  hospitalId: z.string(),
  doctorId: z.string(),
  dateTime: z.preprocess((arg) => new Date(arg as any), z.date()),
  diseaseName: z.string(),
  diseaseDescription: z.string(),
  treatment: z.string().nullable().optional(),
  prescription: z.string().nullable().optional(),
  riskLevel: z.string(),
  emergencyWarnings: z.string().nullable().optional(),
  mediaFiles: z.array(z.object({ type: z.string(), url: z.string(), name: z.string() })).optional(),
});

export const insertDoctorNoteSchema = z.object({
  id: z.string().optional(),
  healthRecordId: z.string(),
  doctorUserId: z.string(),
  note: z.string(),
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertHospital = z.infer<typeof insertHospitalSchema>;
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type InsertHealthRecord = z.infer<typeof insertHealthRecordSchema>;
export type InsertDoctorNote = z.infer<typeof insertDoctorNoteSchema>;

export type User = IUser;
export type Hospital = IHospital;
export type Doctor = IDoctor;
export type Patient = IPatient;
export type HealthRecord = IHealthRecord;
export type DoctorNote = IDoctorNote;
