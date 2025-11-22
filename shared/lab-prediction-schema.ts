// shared/lab-prediction-schema.ts
import mongoose, { Schema, Document } from "mongoose";
import { z } from "zod";

// ============================================
// HEALTH PREDICTIONS
// ============================================

export interface IHealthPrediction extends Document {
    id: string;
    patientId: string;
    predictionDate: Date;
    predictions: Array<{
        condition: string;
        riskScore: number;
        riskLevel: 'low' | 'medium' | 'high' | 'critical';
        confidence: number;
        factors: string[];
        recommendations: string[];
    }>;
    overallHealthScore: number;
    trendDirection: 'improving' | 'stable' | 'declining';
    createdAt: Date;
}

const PredictionItemSchema = new Schema({
    condition: { type: String, required: true },
    riskScore: { type: Number, required: true, min: 0, max: 100 },
    riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    factors: [{ type: String }],
    recommendations: [{ type: String }]
}, { _id: false });

const HealthPredictionSchema = new Schema({
    id: { type: String, required: true, unique: true },
    patientId: { type: String, required: true, index: true },
    predictionDate: { type: Date, required: true },
    predictions: [PredictionItemSchema],
    overallHealthScore: { type: Number, required: true, min: 0, max: 100 },
    trendDirection: { type: String, enum: ['improving', 'stable', 'declining'], required: true },
}, { timestamps: { createdAt: 'createdAt' } });

export const HealthPredictions = mongoose.models.HealthPredictions ||
    mongoose.model<IHealthPrediction>("HealthPredictions", HealthPredictionSchema);

// Zod schema for validation
export const insertHealthPredictionSchema = z.object({
    id: z.string().optional(),
    patientId: z.string(),
    predictionDate: z.preprocess((arg) => new Date(arg as any), z.date()),
    predictions: z.array(z.object({
        condition: z.string(),
        riskScore: z.number().min(0).max(100),
        riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
        confidence: z.number().min(0).max(1),
        factors: z.array(z.string()),
        recommendations: z.array(z.string())
    })),
    overallHealthScore: z.number().min(0).max(100),
    trendDirection: z.enum(['improving', 'stable', 'declining'])
});

export type InsertHealthPrediction = z.infer<typeof insertHealthPredictionSchema>;

// ============================================
// LAB RESULTS
// ============================================

export interface ILabResult extends Document {
    id: string;
    patientId: string;
    healthRecordId?: string;
    testDate: Date;
    testType: string;
    orderedBy: string;
    labName: string;
    reportFile?: string;
    results: Array<{
        testName: string;
        value: number;
        unit: string;
        normalRange: {
            min: number;
            max: number;
        };
        isAbnormal: boolean;
        severity?: 'low' | 'high' | 'critical';
        notes?: string;
    }>;
    overallStatus: 'normal' | 'abnormal' | 'critical';
    doctorNotes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const LabResultItemSchema = new Schema({
    testName: { type: String, required: true },
    value: { type: Number, required: true },
    unit: { type: String, required: true },
    normalRange: {
        min: { type: Number, required: true },
        max: { type: Number, required: true }
    },
    isAbnormal: { type: Boolean, required: true },
    severity: { type: String, enum: ['low', 'high', 'critical'] },
    notes: String
}, { _id: false });

const LabResultSchema = new Schema({
    id: { type: String, required: true, unique: true },
    patientId: { type: String, required: true, index: true },
    healthRecordId: { type: String, index: true },
    testDate: { type: Date, required: true },
    testType: { type: String, required: true },
    orderedBy: { type: String, required: true },
    labName: { type: String, required: true },
    reportFile: String,
    results: [LabResultItemSchema],
    overallStatus: { type: String, enum: ['normal', 'abnormal', 'critical'], required: true },
    doctorNotes: String,
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

export const LabResults = mongoose.models.LabResults ||
    mongoose.model<ILabResult>("LabResults", LabResultSchema);

// Zod schema for validation
export const insertLabResultSchema = z.object({
    id: z.string().optional(),
    patientId: z.string(),
    healthRecordId: z.string().optional(),
    testDate: z.preprocess((arg) => new Date(arg as any), z.date()),
    testType: z.string(),
    orderedBy: z.string(),
    labName: z.string(),
    reportFile: z.string().optional(),
    results: z.array(z.object({
        testName: z.string(),
        value: z.number(),
        unit: z.string(),
        normalRange: z.object({
            min: z.number(),
            max: z.number()
        }),
        isAbnormal: z.boolean(),
        severity: z.enum(['low', 'high', 'critical']).optional(),
        notes: z.string().optional()
    })),
    overallStatus: z.enum(['normal', 'abnormal', 'critical']),
    doctorNotes: z.string().optional()
});

export type InsertLabResult = z.infer<typeof insertLabResultSchema>;

// ============================================
// LAB TEST REFERENCE RANGES
// ============================================

export const LAB_TEST_RANGES: Record<string, { min: number; max: number; unit: string }> = {
    'Hemoglobin': { min: 12, max: 16, unit: 'g/dL' },
    'Blood Sugar (Fasting)': { min: 70, max: 100, unit: 'mg/dL' },
    'Blood Sugar (Random)': { min: 70, max: 140, unit: 'mg/dL' },
    'HbA1c': { min: 4, max: 5.6, unit: '%' },
    'Total Cholesterol': { min: 0, max: 200, unit: 'mg/dL' },
    'LDL Cholesterol': { min: 0, max: 100, unit: 'mg/dL' },
    'HDL Cholesterol': { min: 40, max: 200, unit: 'mg/dL' },
    'Triglycerides': { min: 0, max: 150, unit: 'mg/dL' },
    'Creatinine': { min: 0.6, max: 1.2, unit: 'mg/dL' },
    'Blood Urea Nitrogen': { min: 7, max: 20, unit: 'mg/dL' },
    'ALT': { min: 7, max: 56, unit: 'U/L' },
    'AST': { min: 10, max: 40, unit: 'U/L' },
    'Platelet Count': { min: 150000, max: 450000, unit: 'cells/μL' },
    'White Blood Cell Count': { min: 4000, max: 11000, unit: 'cells/μL' },
    'Red Blood Cell Count': { min: 4.5, max: 5.5, unit: 'million cells/μL' },
    'TSH': { min: 0.4, max: 4.0, unit: 'mIU/L' },
    'Vitamin D': { min: 30, max: 100, unit: 'ng/mL' },
    'Vitamin B12': { min: 200, max: 900, unit: 'pg/mL' },
};

// Export types
export type HealthPrediction = IHealthPrediction;
export type LabResult = ILabResult;
