#!/usr/bin/env python3
"""
Health Prediction Engine
Analyzes patient medical history to predict disease risks and health trends.
"""

import sys
import json
from typing import Dict, List, Any
from datetime import datetime, timedelta
from collections import Counter

def calculate_age_risk(age: int) -> float:
    """Calculate age-based risk factor (0-1)."""
    if age < 18:
        return 0.1
    elif age < 40:
        return 0.2
    elif age < 60:
        return 0.4
    elif age < 75:
        return 0.6
    else:
        return 0.8

def analyze_medical_history(records: List[Dict]) -> Dict[str, float]:
    """Analyze medical history for risk factors."""
    if not records:
        return {}
    
    # Count conditions by severity
    risk_counts = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0}
    disease_counts = Counter()
    
    for record in records:
        risk = record.get('risk', 'low').lower()
        if risk in risk_counts:
            risk_counts[risk] += 1
        
        disease = record.get('disease', '')
        if disease:
            disease_counts[disease] += 1
    
    # Calculate risk scores for specific conditions
    condition_risks = {}
    
    # Diabetes risk
    diabetes_indicators = ['diabetes', 'blood sugar', 'glucose', 'insulin']
    diabetes_count = sum(1 for d in disease_counts if any(ind in d.lower() for ind in diabetes_indicators))
    condition_risks['Type 2 Diabetes'] = min(diabetes_count * 0.3, 1.0)
    
    # Hypertension risk
    hypertension_indicators = ['hypertension', 'blood pressure', 'bp']
    hypertension_count = sum(1 for d in disease_counts if any(ind in d.lower() for ind in hypertension_indicators))
    condition_risks['Hypertension'] = min(hypertension_count * 0.3, 1.0)
    
    # Heart disease risk
    heart_indicators = ['heart', 'cardiac', 'coronary', 'chest pain']
    heart_count = sum(1 for d in disease_counts if any(ind in d.lower() for ind in heart_indicators))
    condition_risks['Heart Disease'] = min(heart_count * 0.25 + (risk_counts['high'] + risk_counts['critical']) * 0.1, 1.0)
    
    # Stroke risk (based on hypertension and diabetes)
    stroke_risk = (condition_risks.get('Hypertension', 0) * 0.4 + 
                   condition_risks.get('Type 2 Diabetes', 0) * 0.3 +
                   condition_risks.get('Heart Disease', 0) * 0.3)
    condition_risks['Stroke'] = min(stroke_risk, 1.0)
    
    # Kidney disease risk
    kidney_indicators = ['kidney', 'renal', 'creatinine']
    kidney_count = sum(1 for d in disease_counts if any(ind in d.lower() for ind in kidney_indicators))
    kidney_risk = kidney_count * 0.2 + condition_risks.get('Hypertension', 0) * 0.3 + condition_risks.get('Type 2 Diabetes', 0) * 0.3
    condition_risks['Kidney Disease'] = min(kidney_risk, 1.0)
    
    return condition_risks

def analyze_risk_progression(records: List[Dict]) -> float:
    """Analyze if risk levels are increasing over time."""
    if len(records) < 2:
        return 0.0
    
    # Sort by date
    sorted_records = sorted(records, key=lambda x: x.get('date', ''), reverse=True)
    
    risk_order = {'low': 1, 'medium': 2, 'high': 3, 'critical': 4}
    risk_values = [risk_order.get(r.get('risk', 'low').lower(), 1) for r in sorted_records[:10]]
    
    if len(risk_values) < 2:
        return 0.0
    
    # Calculate trend
    recent_avg = sum(risk_values[:3]) / min(3, len(risk_values[:3]))
    older_avg = sum(risk_values[3:]) / max(1, len(risk_values[3:]))
    
    progression = (recent_avg - older_avg) / 4.0  # Normalize to 0-1
    return max(0, min(progression, 1.0))

def identify_recurring_patterns(records: List[Dict]) -> Dict[str, int]:
    """Identify recurring conditions."""
    disease_counts = Counter()
    
    for record in records:
        disease = record.get('disease', '')
        if disease:
            disease_counts[disease] += 1
    
    # Return only conditions that appear more than once
    return {disease: count for disease, count in disease_counts.items() if count > 1}

def check_related_conditions(records: List[Dict]) -> float:
    """Check for comorbidities and related conditions."""
    diseases = [r.get('disease', '').lower() for r in records if r.get('disease')]
    
    # Define related condition groups
    metabolic_conditions = ['diabetes', 'obesity', 'metabolic syndrome', 'cholesterol']
    cardiovascular_conditions = ['hypertension', 'heart disease', 'coronary', 'cardiac']
    respiratory_conditions = ['asthma', 'copd', 'bronchitis', 'pneumonia']
    
    # Count conditions in each group
    metabolic_count = sum(1 for d in diseases if any(cond in d for cond in metabolic_conditions))
    cardiovascular_count = sum(1 for d in diseases if any(cond in d for cond in cardiovascular_conditions))
    respiratory_count = sum(1 for d in diseases if any(cond in d for cond in respiratory_conditions))
    
    # Higher score if multiple related conditions exist
    comorbidity_score = 0
    if metabolic_count >= 2:
        comorbidity_score += 0.3
    if cardiovascular_count >= 2:
        comorbidity_score += 0.3
    if respiratory_count >= 2:
        comorbidity_score += 0.2
    if metabolic_count >= 1 and cardiovascular_count >= 1:
        comorbidity_score += 0.2  # Metabolic + cardiovascular is high risk
    
    return min(comorbidity_score, 1.0)

def calculate_disease_risk(patient_data: Dict) -> Dict[str, Any]:
    """Calculate comprehensive disease risk scores."""
    age = patient_data.get('age', 30)
    records = patient_data.get('records', [])
    
    # Calculate individual risk factors
    age_risk = calculate_age_risk(age)
    history_risks = analyze_medical_history(records)
    progression_risk = analyze_risk_progression(records)
    recurring = identify_recurring_patterns(records)
    comorbidity_risk = check_related_conditions(records)
    
    # Generate predictions for each condition
    predictions = []
    
    for condition, history_score in history_risks.items():
        # Weighted risk calculation
        risk_score = (
            age_risk * 0.15 +
            history_score * 0.35 +
            progression_risk * 0.25 +
            (0.15 if condition in recurring else 0) +
            comorbidity_risk * 0.10
        ) * 100  # Convert to 0-100 scale
        
        # Determine risk level
        if risk_score >= 75:
            risk_level = 'critical'
        elif risk_score >= 50:
            risk_level = 'high'
        elif risk_score >= 25:
            risk_level = 'medium'
        else:
            risk_level = 'low'
        
        # Generate factors
        factors = []
        if age >= 60:
            factors.append(f"Age factor: {age} years")
        if history_score > 0.3:
            factors.append("Existing medical history")
        if progression_risk > 0.3:
            factors.append("Increasing risk trend")
        if condition in recurring:
            factors.append("Recurring condition")
        if comorbidity_risk > 0.2:
            factors.append("Related health conditions present")
        
        # Generate recommendations
        recommendations = generate_recommendations(condition, risk_level, factors)
        
        predictions.append({
            'condition': condition,
            'riskScore': round(risk_score, 1),
            'riskLevel': risk_level,
            'confidence': min(0.7 + (len(records) * 0.03), 0.95),  # More records = higher confidence
            'factors': factors,
            'recommendations': recommendations
        })
    
    # Calculate overall health score (inverse of average risk)
    if predictions:
        avg_risk = sum(p['riskScore'] for p in predictions) / len(predictions)
        overall_health_score = max(0, 100 - avg_risk)
    else:
        overall_health_score = 85  # Default for no significant risks
    
    # Determine trend direction
    if progression_risk > 0.3:
        trend = 'declining'
    elif progression_risk < -0.1:
        trend = 'improving'
    else:
        trend = 'stable'
    
    return {
        'predictions': sorted(predictions, key=lambda x: x['riskScore'], reverse=True),
        'overallHealthScore': round(overall_health_score, 1),
        'trendDirection': trend
    }

def generate_recommendations(condition: str, risk_level: str, factors: List[str]) -> List[str]:
    """Generate personalized recommendations based on condition and risk."""
    recommendations = []
    
    if condition == 'Type 2 Diabetes':
        recommendations.append("Regular blood sugar monitoring")
        recommendations.append("Maintain healthy diet with controlled carbohydrate intake")
        if risk_level in ['high', 'critical']:
            recommendations.append("Consult endocrinologist for medication review")
            recommendations.append("Consider continuous glucose monitoring")
    
    elif condition == 'Hypertension':
        recommendations.append("Monitor blood pressure regularly")
        recommendations.append("Reduce sodium intake")
        recommendations.append("Regular cardiovascular exercise")
        if risk_level in ['high', 'critical']:
            recommendations.append("Immediate consultation with cardiologist recommended")
    
    elif condition == 'Heart Disease':
        recommendations.append("Regular cardiac checkups")
        recommendations.append("Stress management and adequate rest")
        recommendations.append("Heart-healthy diet (low saturated fat)")
        if risk_level == 'critical':
            recommendations.append("Emergency cardiac evaluation recommended")
    
    elif condition == 'Stroke':
        recommendations.append("Control blood pressure and blood sugar")
        recommendations.append("Regular neurological assessments")
        recommendations.append("Antiplatelet therapy as prescribed")
        if risk_level in ['high', 'critical']:
            recommendations.append("Immediate stroke risk assessment needed")
    
    elif condition == 'Kidney Disease':
        recommendations.append("Regular kidney function tests")
        recommendations.append("Stay well hydrated")
        recommendations.append("Limit protein and sodium intake")
        if risk_level in ['high', 'critical']:
            recommendations.append("Nephrology consultation recommended")
    
    # General recommendations based on risk level
    if risk_level in ['high', 'critical']:
        recommendations.append("Schedule follow-up appointment within 2 weeks")
    
    return recommendations[:5]  # Limit to top 5 recommendations

def main():
    """Main function to process patient data and generate predictions."""
    try:
        # Read input from stdin
        input_data = json.load(sys.stdin)
        patient_data = input_data.get('patientData', {})
        
        if not patient_data:
            result = {"error": "No patient data provided"}
        else:
            prediction_result = calculate_disease_risk(patient_data)
            result = {
                "success": True,
                "prediction": prediction_result
            }
        
        # Output result as JSON
        print(json.dumps(result))
    
    except Exception as e:
        error_result = {"error": f"Prediction failed: {str(e)}"}
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
