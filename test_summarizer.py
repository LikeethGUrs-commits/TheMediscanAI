#!/usr/bin/env python3
"""
Test script for emergency summarizer
"""

import json
import subprocess
import sys

# Sample patient history
sample_history = """Date: 11/20/2024
Hospital: Chikkamagalur District Hospital
Doctor: Dr. Rajesh Kumar
Disease: Hypertension
Description: Patient has been diagnosed with hypertension, a chronic medical condition characterized by persistently elevated blood pressure levels above 140/90 mmHg. This condition can lead to serious complications if not properly managed, including increased risk of heart disease, stroke, kidney damage, and vision problems. Common symptoms may include headaches, dizziness, blurred vision, chest pain, and shortness of breath. Causes can include genetics, poor diet high in salt, lack of physical exercise, obesity, stress, smoking, and certain medications or underlying conditions.
Treatment: Lifestyle modifications and medication
Risk Level: high
Warnings: Regular BP monitoring required
---
Date: 11/15/2024
Hospital: Chikkamagalur District Hospital
Doctor: Dr. Priya Sharma
Disease: Type 2 Diabetes
Description: Patient has been diagnosed with type 2 diabetes, a metabolic disorder characterized by high blood sugar levels due to insulin resistance or insufficient insulin production. This chronic condition can lead to complications such as cardiovascular disease, nerve damage, kidney failure, eye problems, and foot ulcers. Symptoms may include frequent urination, excessive thirst, unexplained weight loss, increased hunger, fatigue, slow-healing sores, frequent infections, blurred vision, and tingling or numbness in hands or feet. Causes often include genetics, obesity, sedentary lifestyle, poor diet, and age.
Treatment: Insulin therapy and diet control
Risk Level: high
Warnings: Maintain blood sugar levels
---
Date: 10/10/2024
Hospital: Sri Siddhartha Medical College
Doctor: Dr. Arjun Reddy
Disease: Acute Bronchitis
Description: Patient has been diagnosed with acute bronchitis, an inflammation of the bronchial tubes (airways) that carry air to and from the lungs. This condition is typically caused by viral infections and results in coughing, mucus production, chest discomfort, fatigue, and mild fever. Symptoms usually last 1-3 weeks and may include wheezing and shortness of breath. While most cases resolve on their own, treatment focuses on symptom relief with rest, fluids, humidifiers, and over-the-counter medications. Bacterial bronchitis may require antibiotics. Complications can include pneumonia if left untreated.
Treatment: Rest and symptomatic treatment
Risk Level: medium
Warnings: Monitor breathing difficulty
---"""

def test_emergency_summarizer():
    """Test the emergency summarizer with sample data."""
    print("Testing Emergency Summarizer...")
    print("=" * 60)
    
    # Test with emergency mode ON
    print("\n🚨 EMERGENCY MODE: ON\n")
    input_data = {
        "history": sample_history,
        "emergencyMode": True
    }
    
    try:
        process = subprocess.Popen(
            ['python', 'server/emergency_summarizer.py'],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        stdout, stderr = process.communicate(input=json.dumps(input_data))
        
        if process.returncode == 0:
            result = json.loads(stdout)
            if 'summary' in result:
                print(result['summary'])
            else:
                print(f"Error: {result.get('error', 'Unknown error')}")
        else:
            print(f"Process failed with code {process.returncode}")
            print(f"Error: {stderr}")
    
    except Exception as e:
        print(f"Test failed: {e}")
    
    print("\n" + "=" * 60)
    
    # Test with emergency mode OFF
    print("\n📋 EMERGENCY MODE: OFF\n")
    input_data['emergencyMode'] = False
    
    try:
        process = subprocess.Popen(
            ['python', 'server/emergency_summarizer.py'],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        stdout, stderr = process.communicate(input=json.dumps(input_data))
        
        if process.returncode == 0:
            result = json.loads(stdout)
            if 'summary' in result:
                print(result['summary'])
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
    test_emergency_summarizer()
