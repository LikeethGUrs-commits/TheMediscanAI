#!/usr/bin/env python3
"""
MEDCAT-based patient summary generator.
Uses MEDCAT for medical entity extraction and summarization.
"""

import sys
import json
import os
from typing import Dict, List, Any
import spacy
from medcat.cat import CAT
from medcat.vocab import Vocab
from medcat.cdb import CDB
# from medcat.meta_cat import MetaCAT  # Not available in this version

def load_medcat_model():
    """Load MEDCAT model. In production, use proper model paths."""
    try:
        # For demo purposes, we'll use a basic spaCy model
        # In production, you'd load proper MEDCAT models
        nlp = spacy.load("en_core_web_sm")

        # Mock MEDCAT components for demonstration
        vocab = Vocab()
        cdb = CDB()
        cat = CAT(cdb=cdb, vocab=vocab)

        return cat, nlp
    except Exception as e:
        print(f"Warning: Could not load MEDCAT model: {e}", file=sys.stderr)
        # Fallback to basic spaCy
        nlp = spacy.load("en_core_web_sm")
        return None, nlp

def extract_medical_entities(text: str, cat, nlp) -> Dict[str, Any]:
    """Extract medical entities using MEDCAT or fallback to spaCy."""
    entities = []

    if cat:
        # Use MEDCAT for entity extraction
        try:
            doc = cat(text)
            entities = [{
                'text': ent.text,
                'label': ent.label_,
                'start': ent.start_char,
                'end': ent.end_char,
                'confidence': getattr(ent, 'confidence', 0.8)
            } for ent in doc.ents if hasattr(ent, 'label_')]
        except Exception as e:
            print(f"MEDCAT extraction failed: {e}", file=sys.stderr)

    # Fallback to basic entity extraction
    if not entities:
        doc = nlp(text)
        entities = [{
            'text': ent.text,
            'label': ent.label_,
            'start': ent.start_char,
            'end': ent.end_char,
            'confidence': 0.5
        } for ent in doc.ents]

    return {
        'entities': entities,
        'entity_count': len(entities)
    }

def categorize_by_risk_level(records: List[str]) -> Dict[str, List[str]]:
    """Categorize records by risk level."""
    categories = {
        'critical': [],
        'high': [],
        'medium': [],
        'low': []
    }

    risk_keywords = {
        'critical': ['critical', 'emergency', 'life-threatening', 'severe'],
        'high': ['high risk', 'serious', 'urgent'],
        'medium': ['medium', 'moderate'],
        'low': ['low', 'mild', 'stable']
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

def generate_medcat_summary(patient_history: str) -> str:
    """Generate a medical summary using MEDCAT-style analysis."""

    # Split history into individual records
    records = [r.strip() for r in patient_history.split('---') if r.strip()]

    if not records:
        return "No medical records found to summarize."

    cat, nlp = load_medcat_model()

    # Extract entities from all records
    all_entities = []
    for record in records:
        entities = extract_medical_entities(record, cat, nlp)
        all_entities.extend(entities['entities'])

    # Categorize records by risk
    risk_categories = categorize_by_risk_level(records)

    # Extract key information
    diseases = [ent for ent in all_entities if ent['label'] in ['DISEASE', 'CONDITION', 'PROBLEM']]
    treatments = [ent for ent in all_entities if ent['label'] in ['TREATMENT', 'MEDICATION', 'PROCEDURE']]
    symptoms = [ent for ent in all_entities if ent['label'] in ['SYMPTOM', 'SIGN']]

    # Build summary
    summary_parts = []

    # Chief Complaints/Diagnoses
    if diseases:
        unique_diseases = list(set(d['text'] for d in diseases))
        summary_parts.append(f"**Chief Complaints/Diagnoses:** {', '.join(unique_diseases[:5])}")

    # Risk Assessment
    risk_summary = []
    for level, recs in risk_categories.items():
        if recs:
            risk_summary.append(f"{level.title()}: {len(recs)} records")
    if risk_summary:
        summary_parts.append(f"**Risk Assessment:** {', '.join(risk_summary)}")

    # Treatments
    if treatments:
        unique_treatments = list(set(t['text'] for t in treatments))
        summary_parts.append(f"**Treatments:** {', '.join(unique_treatments[:5])}")

    # Key Findings
    if symptoms:
        unique_symptoms = list(set(s['text'] for s in symptoms))
        summary_parts.append(f"**Key Symptoms/Findings:** {', '.join(unique_symptoms[:5])}")

    # Overall Assessment
    total_records = len(records)
    entity_count = len(all_entities)
    summary_parts.append(f"**Summary:** Patient has {total_records} medical records with {entity_count} identified medical entities. "
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
            summary = generate_medcat_summary(patient_history)
            result = {"summary": summary}

        # Output result as JSON
        print(json.dumps(result))

    except Exception as e:
        error_result = {"error": f"Processing failed: {str(e)}"}
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
