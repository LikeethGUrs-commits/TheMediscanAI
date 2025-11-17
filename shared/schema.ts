import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - supports doctors, patients, and hospital authorities
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  age: integer("age"),
  role: text("role").notNull(), // 'doctor' | 'patient' | 'hospital'
  email: text("email"),
  phone: text("phone"),
  password: text("password").notNull(),
  roleId: text("role_id").notNull(), // doctor_id, patient_id, or hospital_id
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  notesAsDoctor: many(doctorNotes),
}));

// Hospitals table
export const hospitals = pgTable("hospitals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hospitalId: text("hospital_id").notNull().unique(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  contactNumber: text("contact_number"),
  email: text("email"),
  logo: text("logo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const hospitalsRelations = relations(hospitals, ({ many }) => ({
  doctors: many(doctors),
  healthRecords: many(healthRecords),
}));

// Doctors table
export const doctors = pgTable("doctors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  doctorId: text("doctor_id").notNull().unique(),
  name: text("name").notNull(),
  specialization: text("specialization"),
  hospitalId: varchar("hospital_id").references(() => hospitals.id).notNull(),
  contactNumber: text("contact_number"),
  email: text("email"),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const doctorsRelations = relations(doctors, ({ one, many }) => ({
  hospital: one(hospitals, {
    fields: [doctors.hospitalId],
    references: [hospitals.id],
  }),
  healthRecords: many(healthRecords),
  notes: many(doctorNotes),
}));

// Patients table
export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: text("patient_id").notNull().unique(),
  name: text("name").notNull(),
  age: integer("age"),
  gender: text("gender"),
  phone: text("phone"),
  email: text("email"),
  bloodGroup: text("blood_group"),
  address: text("address"),
  emergencyContact: text("emergency_contact"),
  profileImage: text("profile_image"),
  faceEmbedding: text("face_embedding"), // For face recognition demo
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const patientsRelations = relations(patients, ({ many }) => ({
  healthRecords: many(healthRecords),
}));

// Health Records table
export const healthRecords = pgTable("health_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id).notNull(),
  hospitalId: varchar("hospital_id").references(() => hospitals.id).notNull(),
  doctorId: varchar("doctor_id").references(() => doctors.id).notNull(),
  dateTime: timestamp("date_time").notNull(),
  diseaseName: text("disease_name").notNull(),
  diseaseDescription: text("disease_description").notNull(),
  treatment: text("treatment"),
  prescription: text("prescription"),
  riskLevel: text("risk_level").notNull(), // 'low' | 'medium' | 'high' | 'critical'
  emergencyWarnings: text("emergency_warnings"),
  mediaFiles: jsonb("media_files").$type<Array<{
    type: string;
    url: string;
    name: string;
  }>>(),
  isEditable: boolean("is_editable").default(true).notNull(),
  editableUntil: timestamp("editable_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const healthRecordsRelations = relations(healthRecords, ({ one, many }) => ({
  patient: one(patients, {
    fields: [healthRecords.patientId],
    references: [patients.id],
  }),
  hospital: one(hospitals, {
    fields: [healthRecords.hospitalId],
    references: [hospitals.id],
  }),
  doctor: one(doctors, {
    fields: [healthRecords.doctorId],
    references: [doctors.id],
  }),
  notes: many(doctorNotes),
}));

// Doctor Notes table - for doctors to add notes to patient records
export const doctorNotes = pgTable("doctor_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  healthRecordId: varchar("health_record_id").references(() => healthRecords.id).notNull(),
  doctorUserId: varchar("doctor_user_id").references(() => users.id).notNull(),
  note: text("note").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const doctorNotesRelations = relations(doctorNotes, ({ one }) => ({
  healthRecord: one(healthRecords, {
    fields: [doctorNotes.healthRecordId],
    references: [healthRecords.id],
  }),
  doctor: one(users, {
    fields: [doctorNotes.doctorUserId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertHospitalSchema = createInsertSchema(hospitals).omit({
  id: true,
  createdAt: true,
});

export const insertDoctorSchema = createInsertSchema(doctors).omit({
  id: true,
  createdAt: true,
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
});

export const insertHealthRecordSchema = createInsertSchema(healthRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDoctorNoteSchema = createInsertSchema(doctorNotes).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Hospital = typeof hospitals.$inferSelect;
export type InsertHospital = z.infer<typeof insertHospitalSchema>;

export type Doctor = typeof doctors.$inferSelect;
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;

export type HealthRecord = typeof healthRecords.$inferSelect;
export type InsertHealthRecord = z.infer<typeof insertHealthRecordSchema>;

export type DoctorNote = typeof doctorNotes.$inferSelect;
export type InsertDoctorNote = z.infer<typeof insertDoctorNoteSchema>;
