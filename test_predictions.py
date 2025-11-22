#!/usr/bin/env python3
"""
Test script for prediction engine
"""

import json
import subprocess
import sys

# Sample patient data
sample_patient_data = {
    "age": 55,
    "records": [
        {
            "date": "2024-11-20",
            "disease": "Hypertension",
            "description": "Elevated blood pressure",
            "risk": "high",
            "treatment": "Medication"
        },
        {
            "date": "2024-11-15",
            "disease": "Type 2 Diabetes",
            "description": "High blood sugar levels",
            "risk": "high",
            "treatment": "Insulin therapy"
        },
        {
            "date": "2024-10-10",
            "disease": "Hypertension",
            "description": "Follow-up for blood pressure",
            "risk": "medium",
            "treatment": "Lifestyle modifications"
        },
        {
            "date": "2024-09-05",
            "disease": "Acute Bronchitis",
            "description": "Respiratory infection",
            "risk": "medium",
            "treatment": "Rest and medication"
        }
    ]
}

def test_prediction_engine():
    """Test the prediction engine with sample data."""
    print("Testing Prediction Engine...")
    print("=" * 60)
    
    input_data = {
        "patientData": sample_patient_data
    }
    
    try:
        process = subprocess.Popen(
            ['python', 'server/prediction-engine.py'],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        stdout, stderr = process.communicate(input=json.dumps(input_data))
        
        if process.returncode == 0:
            result = json.loads(stdout)
            if 'prediction' in result:
                pred = result['prediction']
                print(f"\n=== PREDICTION RESULTS ===\n")
                print(f"Overall Health Score: {pred['overallHealthScore']}/100")
                print(f"Trend Direction: {pred['trendDirection'].upper()}\n")
                
                print("=== RISK PREDICTIONS ===")
                for p in pred['predictions']:
                    print(f"\nCondition: {p['condition']}")
                    print(f"  Risk Score: {p['riskScore']}/100")
                    print(f"  Risk Level: {p['riskLevel'].upper()}")
                    print(f"  Confidence: {p['confidence']:.2%}")
                    print(f"  Factors: {', '.join(p['factors'])}")
                    print(f"  Recommendations:")
                    for rec in p['recommendations']:
                        print(f"    - {rec}")
            else:
                print(f"Error: {result.get('error', 'Unknown error')}")
        else:
            print(f"Process failed with code {process.returncode}")
            print(f"Error: {stderr}")
    
    except Exception as e:
        print(f"Test failed: {e}")
    
    print("\n" + "=" * 60)
    print("\n✅ Test completed!")

if __name__ == "__main__":
    test_prediction_engine()
