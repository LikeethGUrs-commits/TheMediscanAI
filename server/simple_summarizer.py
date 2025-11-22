#!/usr/bin/env python3
"""
Simple medical summary generator using Python (no external dependencies).
Provides basic but effective summarization of patient medical histories.
"""

import sys
import json
import re
from typing import Dict, List, Any
from collections import Counter

def extract_medical_terms(text: str) -> Dict[str, List[str]]:
    """Extract basic medical terms using regex patterns."""
    # Common medical keywords and patterns
    disease_patterns = [
        r'\b(?:acute|chronic|severe|mild|primary|secondary)\s+\w+\b',
        r'\b(?:bronchitis|pneumonia|hypertension|diabetes|asthma|cancer|tumor)\b',
        r'\b(?:infection|inflammation|fracture|disorder|syndrome)\b'
    ]

    treatment_patterns = [
        r'\b(?:prescribed|administered|given)\s+\w+\b',
        r'\b(?:antibiotics|medication|therapy|surgery|procedure)\b',
        r'\b(?:treatment|medication|drug|pill|injection)\b'
    ]

    symptom_patterns = [
        r'\b(?:cough|fever|pain|nausea|headache|dizziness)\b',
        r'\b(?:shortness of breath|chest pain|fatigue|weakness)\b',
        r'\b(?:presented with|complaining of|suffering from)\b'
    ]

    def find_matches(patterns: List[str], text: str) -> List[str]:
        matches = []
        for pattern in patterns:
            matches.extend(re.findall(pattern, text, re.IGNORECASE))
        return list(set(matches))  # Remove duplicates

    return {
        'diseases': find_matches(disease_patterns, text),
        'treatments': find_matches(treatment_patterns, text),
        'symptoms': find_matches(symptom_patterns, text)
    }

def categorize_by_risk_level(records: List[str]) -> Dict[str, List[str]]:
    """Categorize records by risk level based on keywords."""
    categories = {
        'critical': [],
        'high': [],
        'medium': [],
        'low': []
    }

    risk_keywords = {
        'critical': ['critical', 'emergency', 'life-threatening', 'severe', 'intensive care'],
        'high': ['high risk', 'serious', 'urgent', 'unstable'],
        'medium': ['medium', 'moderate', 'stable'],
        'low': ['low', 'mild', 'stable', 'routine']
    }

    for record in records:
        record_lower = record.lower()
        risk_found = 'low'  # default

        for risk_level, keywords in risk_keywords.items():
            if any(keyword in record_lower for keyword in keywords):
                risk_found = risk_level
                break

        categories[risk_found].append(record)

    return categories

def generate_simple_summary(patient_history: str) -> str:
    """Generate a medical summary using basic text analysis."""

    # Split history into individual records
    records = [r.strip() for r in patient_history.split('---') if r.strip()]

    if not records:
        return "No medical records found to summarize."

    # Extract medical terms from all records
    all_diseases = []
    all_treatments = []
    all_symptoms = []

    for record in records:
        terms = extract_medical_terms(record)
        all_diseases.extend(terms['diseases'])
        all_treatments.extend(terms['treatments'])
        all_symptoms.extend(terms['symptoms'])

    # Remove duplicates and get most common
    diseases = [d for d, _ in Counter(all_diseases).most_common(3)]
    treatments = [t for t, _ in Counter(all_treatments).most_common(3)]
    symptoms = [s for s, _ in Counter(all_symptoms).most_common(3)]

    # Categorize records by risk
    risk_categories = categorize_by_risk_level(records)

    # Build summary
    summary_parts = []

    # Chief Complaints/Diagnoses
    if diseases:
        summary_parts.append(f"**Chief Complaints/Diagnoses:** {', '.join(diseases)}")

    # Risk Assessment
    risk_summary = []
    for level, recs in risk_categories.items():
        if recs:
            risk_summary.append(f"{level.title()}: {len(recs)} records")
    if risk_summary:
        summary_parts.append(f"**Risk Assessment:** {', '.join(risk_summary)}")

    # Treatments
    if treatments:
        summary_parts.append(f"**Treatments:** {', '.join(treatments)}")

    # Key Findings
    if symptoms:
        summary_parts.append(f"**Key Symptoms/Findings:** {', '.join(symptoms)}")

    # Overall Assessment
    total_records = len(records)
    summary_parts.append(f"**Summary:** Patient has {total_records} medical records. "
                        f"Most recent conditions show {max(risk_categories, key=lambda x: len(risk_categories[x]))} risk level.")

    return "\n\n".join(summary_parts)

def main():
    """Main function to process patient history from stdin."""
    try:
        # Read input from stdin (JSON format)
        input_data = json.load(sys.stdin)
        patient_history = input_data.get('history', '')

        if not patient_history:
            result = {"error": "No patient history provided"}
        else:
            summary = generate_simple_summary(patient_history)
            result = {"summary": summary}

        # Output result as JSON
        print(json.dumps(result))

    except Exception as e:
        error_result = {"error": f"Processing failed: {str(e)}"}
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
