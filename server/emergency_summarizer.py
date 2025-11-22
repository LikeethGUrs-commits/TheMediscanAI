#!/usr/bin/env python3
"""
Enhanced medical summary generator for emergency situations.
Provides comprehensive, prioritized summaries optimized for quick clinical decision-making.
"""

import sys
import json
import re
from typing import Dict, List, Any, Tuple
from collections import Counter
from datetime import datetime, timedelta

def parse_date(date_str: str) -> datetime:
    """Parse date string to datetime object."""
    try:
        # Try common date formats
        for fmt in ["%m/%d/%Y", "%Y-%m-%d", "%d/%m/%Y", "%B %d, %Y"]:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        # If all formats fail, return a very old date
        return datetime(1900, 1, 1)
    except:
        return datetime(1900, 1, 1)

def extract_medical_terms(text: str) -> Dict[str, List[str]]:
    """Extract medical terms using enhanced regex patterns."""
    
    # Enhanced disease patterns
    disease_patterns = [
        r'\b(?:acute|chronic|severe|mild|primary|secondary)\s+\w+(?:\s+\w+)?\b',
        r'\b(?:hypertension|diabetes|asthma|pneumonia|bronchitis|gastritis|dengue|arthritis|anemia|appendicitis|migraine|thyroid|fracture)\b',
        r'\b(?:infection|inflammation|disorder|syndrome|disease|condition|fever)\b'
    ]
    
    # Treatment patterns
    treatment_patterns = [
        r'\b(?:prescribed|administered|given|recommended)\s+\w+\b',
        r'\b(?:antibiotics|medication|therapy|surgery|procedure|treatment)\b',
        r'\b(?:insulin|aspirin|ibuprofen|acetaminophen|steroids|inhalers)\b'
    ]
    
    # Symptom patterns
    symptom_patterns = [
        r'\b(?:cough|fever|pain|nausea|headache|dizziness|fatigue|weakness)\b',
        r'\b(?:shortness of breath|chest pain|abdominal pain)\b',
        r'\b(?:vomiting|diarrhea|bleeding|swelling|rash)\b'
    ]
    
    # Warning/contraindication patterns
    warning_patterns = [
        r'\b(?:warning|caution|contraindication|avoid|do not|allergic)\b',
        r'\b(?:emergency|urgent|immediate|critical|life-threatening)\b',
        r'\b(?:monitor|watch for|check|observe)\b'
    ]
    
    def find_matches(patterns: List[str], text: str) -> List[str]:
        matches = []
        for pattern in patterns:
            matches.extend(re.findall(pattern, text, re.IGNORECASE))
        return list(set(matches))
    
    return {
        'diseases': find_matches(disease_patterns, text),
        'treatments': find_matches(treatment_patterns, text),
        'symptoms': find_matches(symptom_patterns, text),
        'warnings': find_matches(warning_patterns, text)
    }

def extract_warnings_from_description(description: str) -> List[str]:
    """Extract specific warnings and contraindications from disease descriptions."""
    warnings = []
    
    # Look for warning sentences
    sentences = description.split('.')
    for sentence in sentences:
        lower_sent = sentence.lower()
        if any(keyword in lower_sent for keyword in ['warning', 'caution', 'avoid', 'do not', 'contraindication', 'emergency', 'monitor', 'immediate']):
            warnings.append(sentence.strip())
    
    return warnings

def categorize_by_timeline(records: List[Dict]) -> Dict[str, List[Dict]]:
    """Categorize records by timeline (recent, moderate, older)."""
    now = datetime.now()
    categories = {
        'last_7_days': [],
        'last_30_days': [],
        'last_90_days': [],
        'older': []
    }
    
    for record in records:
        date = record.get('date')
        if not date:
            categories['older'].append(record)
            continue
            
        days_ago = (now - date).days
        
        if days_ago <= 7:
            categories['last_7_days'].append(record)
        elif days_ago <= 30:
            categories['last_30_days'].append(record)
        elif days_ago <= 90:
            categories['last_90_days'].append(record)
        else:
            categories['older'].append(record)
    
    return categories

def categorize_by_risk_level(records: List[Dict]) -> Dict[str, List[Dict]]:
    """Categorize records by risk level."""
    categories = {
        'critical': [],
        'high': [],
        'medium': [],
        'low': []
    }
    
    for record in records:
        risk = record.get('risk', 'low').lower()
        if risk in categories:
            categories[risk].append(record)
        else:
            categories['low'].append(record)
    
    return categories

def analyze_patterns(records: List[Dict]) -> Dict[str, Any]:
    """Analyze patterns in patient history."""
    diseases = [r.get('disease', '') for r in records if r.get('disease')]
    risks = [r.get('risk', 'low') for r in records if r.get('risk')]
    
    # Find recurring conditions
    disease_counts = Counter(diseases)
    recurring = [disease for disease, count in disease_counts.items() if count > 1]
    
    # Analyze risk progression
    risk_order = {'low': 1, 'medium': 2, 'high': 3, 'critical': 4}
    risk_values = [risk_order.get(r.lower(), 1) for r in risks if r]
    
    risk_trend = "stable"
    if len(risk_values) >= 2:
        recent_avg = sum(risk_values[-3:]) / min(3, len(risk_values[-3:]))
        older_avg = sum(risk_values[:-3]) / max(1, len(risk_values[:-3])) if len(risk_values) > 3 else recent_avg
        
        if recent_avg > older_avg + 0.5:
            risk_trend = "escalating"
        elif recent_avg < older_avg - 0.5:
            risk_trend = "improving"
    
    return {
        'recurring_conditions': recurring,
        'risk_trend': risk_trend,
        'total_visits': len(records),
        'unique_conditions': len(disease_counts)
    }

def generate_emergency_summary(patient_history: str, emergency_mode: bool = True) -> str:
    """Generate an emergency-focused medical summary."""
    
    # Split history into individual records
    record_texts = [r.strip() for r in patient_history.split('---') if r.strip()]
    
    if not record_texts:
        return "No medical records found to summarize."
    
    # Parse records into structured data
    records = []
    for record_text in record_texts:
        record_data = {'text': record_text}
        
        # Extract date
        date_match = re.search(r'Date:\s*(.+?)(?:\n|$)', record_text)
        if date_match:
            record_data['date'] = parse_date(date_match.group(1).strip())
        
        # Extract disease
        disease_match = re.search(r'Disease:\s*(.+?)(?:\n|$)', record_text)
        if disease_match:
            record_data['disease'] = disease_match.group(1).strip()
        
        # Extract description
        desc_match = re.search(r'Description:\s*(.+?)(?:\n|Treatment:|$)', record_text, re.DOTALL)
        if desc_match:
            record_data['description'] = desc_match.group(1).strip()
        
        # Extract treatment
        treatment_match = re.search(r'Treatment:\s*(.+?)(?:\n|$)', record_text)
        if treatment_match:
            record_data['treatment'] = treatment_match.group(1).strip()
        
        # Extract risk level
        risk_match = re.search(r'Risk Level:\s*(.+?)(?:\n|$)', record_text)
        if risk_match:
            record_data['risk'] = risk_match.group(1).strip()
        
        # Extract warnings
        warning_match = re.search(r'Warnings?:\s*(.+?)(?:\n|$)', record_text)
        if warning_match:
            record_data['warnings'] = warning_match.group(1).strip()
        
        records.append(record_data)
    
    # Sort records by date (most recent first)
    records.sort(key=lambda x: x.get('date', datetime(1900, 1, 1)), reverse=True)
    
    # Categorize records
    timeline_categories = categorize_by_timeline(records)
    risk_categories = categorize_by_risk_level(records)
    patterns = analyze_patterns(records)
    
    # Extract all medical terms
    all_terms = {
        'diseases': [],
        'treatments': [],
        'symptoms': [],
        'warnings': []
    }
    
    all_warnings = []
    for record in records:
        text = record.get('text', '')
        terms = extract_medical_terms(text)
        for key in all_terms:
            all_terms[key].extend(terms.get(key, []))
        
        # Extract warnings from descriptions
        desc = record.get('description', '')
        if desc:
            warnings = extract_warnings_from_description(desc)
            all_warnings.extend(warnings)
        
        # Add explicit warnings
        if record.get('warnings'):
            all_warnings.append(record['warnings'])
    
    # Remove duplicates
    for key in all_terms:
        all_terms[key] = list(set(all_terms[key]))
    all_warnings = list(set(all_warnings))
    
    # Build emergency summary
    summary_parts = []
    
    if emergency_mode:
        # CRITICAL ALERTS
        critical_section = []
        
        # Emergency warnings
        if risk_categories['critical'] or risk_categories['high']:
            critical_conditions = []
            for record in risk_categories['critical'] + risk_categories['high']:
                if record.get('disease'):
                    critical_conditions.append(record['disease'])
            if critical_conditions:
                critical_section.append(f"High-Risk Conditions: {', '.join(list(set(critical_conditions))[:5])}")
        
        # Explicit warnings
        if all_warnings:
            critical_section.append(f"Clinical Warnings: {'; '.join(all_warnings[:3])}")
        
        if critical_section:
            summary_parts.append("=== CRITICAL ALERTS ===\n" + "\n".join(critical_section))
        
        # RECENT HISTORY
        recent_section = []
        if timeline_categories['last_7_days']:
            recent_conditions = [r.get('disease', 'Unknown') for r in timeline_categories['last_7_days']]
            recent_section.append(f"Last 7 Days: {', '.join(recent_conditions)} ({len(timeline_categories['last_7_days'])} visit(s))")
        
        if timeline_categories['last_30_days']:
            recent_conditions = [r.get('disease', 'Unknown') for r in timeline_categories['last_30_days'][:3]]
            recent_section.append(f"Last 30 Days: {', '.join(recent_conditions)}")
        
        if recent_section:
            summary_parts.append("=== RECENT HISTORY ===\n" + "\n".join(recent_section))
    
    # MEDICAL PROFILE
    profile_section = []
    
    # Primary diagnoses
    unique_diseases = list(set([r.get('disease', '') for r in records if r.get('disease')]))
    if unique_diseases:
        profile_section.append(f"Diagnosed Conditions: {', '.join(unique_diseases[:5])}")
    
    # Recurring conditions
    if patterns['recurring_conditions']:
        profile_section.append(f"Recurring Conditions: {', '.join(patterns['recurring_conditions'][:3])}")
    
    # Treatment history
    unique_treatments = list(set(all_terms['treatments']))
    if unique_treatments:
        profile_section.append(f"Treatment History: {', '.join(unique_treatments[:5])}")
    
    if profile_section:
        summary_parts.append("=== MEDICAL PROFILE ===\n" + "\n".join(profile_section))
    
    # CLINICAL CONSIDERATIONS (Emergency mode only)
    if emergency_mode:
        clinical_section = []
        
        # Warning keywords from all records
        warning_keywords = list(set(all_terms['warnings']))
        if warning_keywords:
            clinical_section.append(f"Attention Required: {', '.join(warning_keywords[:5])}")
        
        # Symptoms to monitor
        symptoms = list(set(all_terms['symptoms']))
        if symptoms:
            clinical_section.append(f"Reported Symptoms: {', '.join(symptoms[:5])}")
        
        if clinical_section:
            summary_parts.append("=== CLINICAL CONSIDERATIONS ===\n" + "\n".join(clinical_section))
    
    # QUICK INSIGHTS
    insights_section = []
    
    # Risk assessment
    risk_summary = []
    for level in ['critical', 'high', 'medium', 'low']:
        count = len(risk_categories[level])
        if count > 0:
            risk_summary.append(f"{level.title()}: {count}")
    if risk_summary:
        insights_section.append(f"Risk Distribution: {', '.join(risk_summary)}")
    
    # Trend analysis
    insights_section.append(f"Risk Trend: {patterns['risk_trend'].title()}")
    
    # Visit frequency
    insights_section.append(f"Total Records: {patterns['total_visits']} visits, {patterns['unique_conditions']} unique conditions")
    
    if insights_section:
        summary_parts.append("=== QUICK INSIGHTS ===\n" + "\n".join(insights_section))
    
    return "\n\n".join(summary_parts)

def main():
    """Main function to process patient history from stdin."""
    try:
        # Read input from stdin (JSON format)
        input_data = json.load(sys.stdin)
        patient_history = input_data.get('history', '')
        emergency_mode = input_data.get('emergencyMode', True)
        
        if not patient_history:
            result = {"error": "No patient history provided"}
        else:
            summary = generate_emergency_summary(patient_history, emergency_mode)
            result = {"summary": summary}
        
        # Output result as JSON
        print(json.dumps(result))
    
    except Exception as e:
        error_result = {"error": f"Processing failed: {str(e)}"}
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
