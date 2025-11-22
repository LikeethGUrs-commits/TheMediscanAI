import { connectDb } from "./db";
import { HealthRecords } from "../shared/schema";

interface ExpansionMapping {
  keywords: string[];
  expandedDescription: string;
}

const expansionMappings: ExpansionMapping[] = [
  {
    keywords: ["hypertension", "high blood pressure"],
    expandedDescription: "Patient has been diagnosed with hypertension, a chronic medical condition characterized by persistently elevated blood pressure levels above 140/90 mmHg. This condition can lead to serious complications if not properly managed, including increased risk of heart disease, stroke, kidney damage, and vision problems. Common symptoms may include headaches, dizziness, blurred vision, chest pain, and shortness of breath. Causes can include genetics, poor diet high in salt, lack of physical exercise, obesity, stress, smoking, and certain medications or underlying conditions."
  },
  {
    keywords: ["diabetes", "type 2 diabetes"],
    expandedDescription: "Patient has been diagnosed with type 2 diabetes, a metabolic disorder characterized by high blood sugar levels due to insulin resistance or insufficient insulin production. This chronic condition can lead to complications such as cardiovascular disease, nerve damage, kidney failure, eye problems, and foot ulcers. Symptoms may include frequent urination, excessive thirst, unexplained weight loss, increased hunger, fatigue, slow-healing sores, frequent infections, blurred vision, and tingling or numbness in hands or feet. Causes often include genetics, obesity, sedentary lifestyle, poor diet, and age."
  },
  {
    keywords: ["common cold", "viral infection", "viral upper respiratory infection"],
    expandedDescription: "Patient is experiencing a common cold, a viral infection of the upper respiratory tract caused by various viruses such as rhinovirus. This self-limiting illness typically lasts 7-10 days and is characterized by symptoms including runny nose, sore throat, cough, congestion, mild fever, and general malaise. While usually harmless, it can lead to complications like sinusitis or ear infections in some cases. Treatment focuses on symptom relief with rest, hydration, over-the-counter medications, and avoiding spread to others."
  },
  {
    keywords: ["asthma", "chronic respiratory condition", "respiratory condition"],
    expandedDescription: "Patient suffers from asthma, a chronic inflammatory disease of the airways characterized by recurrent episodes of wheezing, breathlessness, chest tightness, and coughing. This condition causes the airways to become inflamed and narrowed, making breathing difficult. Triggers can include allergens, exercise, cold air, stress, infections, and irritants like smoke. Management involves avoiding triggers, using inhalers for quick relief, and long-term control medications to reduce inflammation and prevent exacerbations."
  },
  {
    keywords: ["allergies", "seasonal allergies"],
    expandedDescription: "Patient experiences seasonal allergies, an immune system response to substances like pollen, dust mites, pet dander, or mold that are typically harmless. Symptoms include sneezing, runny or stuffy nose, itchy eyes, throat, or ears, and sometimes skin rashes. This condition can significantly impact quality of life and may lead to complications like sinus infections or asthma exacerbations. Treatment includes antihistamines, nasal sprays, eye drops, and allergen avoidance strategies."
  },
  {
    keywords: ["migraine", "severe headache", "severe recurring headaches"],
    expandedDescription: "Patient suffers from migraines, a neurological condition characterized by intense, debilitating headaches often accompanied by nausea, vomiting, and sensitivity to light, sound, and smell. These episodes can last from hours to days and may be preceded by aura symptoms like visual disturbances. Triggers include stress, certain foods, hormonal changes, lack of sleep, and environmental factors. Management involves identifying and avoiding triggers, using acute medications for attacks, and preventive treatments for frequent episodes."
  },
  {
    keywords: ["anxiety", "generalized anxiety disorder"],
    expandedDescription: "Patient has been diagnosed with generalized anxiety disorder, a mental health condition characterized by persistent and excessive worry about various aspects of life, often without a specific trigger. Symptoms include restlessness, fatigue, difficulty concentrating, irritability, muscle tension, and sleep disturbances. This chronic condition can significantly impair daily functioning and may co-occur with depression or other anxiety disorders. Treatment typically involves psychotherapy, medications like SSRIs, lifestyle changes, and stress management techniques."
  },
  {
    keywords: ["fracture", "arm fracture", "radius", "broken bone"],
    expandedDescription: "Patient has sustained a bone fracture, a break in one of the bones commonly occurring due to trauma such as falls, sports injuries, or accidents. Symptoms include severe pain, swelling, bruising, deformity, inability to move the affected area, and possible numbness or tingling. Treatment depends on the type and location of the fracture but may involve immobilization with casts or splints, pain management, and in some cases, surgical intervention. Recovery time varies but typically involves physical therapy to restore function."
  },
  {
    keywords: ["depression", "major depressive disorder"],
    expandedDescription: "Patient is experiencing major depressive disorder, a serious mental health condition characterized by persistent feelings of sadness, hopelessness, and loss of interest in activities once enjoyed. Symptoms may include changes in sleep patterns, appetite, energy levels, concentration, self-worth, and may include thoughts of death or suicide. This condition can be triggered by life events, genetics, brain chemistry imbalances, or medical conditions. Treatment often involves psychotherapy, antidepressant medications, lifestyle changes, and support systems."
  },
  {
    keywords: ["arthritis", "joint pain", "joint inflammation"],
    expandedDescription: "Patient suffers from arthritis, a condition involving inflammation of the joints leading to pain, stiffness, and reduced mobility. This can be osteoarthritis (wear-and-tear) or rheumatoid arthritis (autoimmune). Symptoms include joint pain, swelling, redness, warmth, and decreased range of motion. Causes vary but include age, genetics, injury, and autoimmune factors. Management includes pain relief medications, physical therapy, lifestyle modifications, and in some cases, surgical interventions to improve quality of life."
  },
  {
    keywords: ["heart disease", "coronary artery disease"],
    expandedDescription: "Patient has coronary artery disease, a condition where the coronary arteries become narrowed or blocked due to plaque buildup, reducing blood flow to the heart muscle. This can lead to chest pain (angina), shortness of breath, fatigue, and increased risk of heart attack or heart failure. Risk factors include high cholesterol, hypertension, smoking, diabetes, obesity, and family history. Treatment may involve lifestyle changes, medications, angioplasty, or bypass surgery to improve blood flow and prevent complications."
  },
  {
    keywords: ["pneumonia", "lung infection"],
    expandedDescription: "Patient has developed pneumonia, an infection that inflames the air sacs in one or both lungs, which may fill with fluid or pus. Symptoms include cough with phlegm, fever, chills, shortness of breath, chest pain, fatigue, and confusion in severe cases. Causes can be bacterial, viral, or fungal, often following a respiratory infection. Treatment depends on the cause but may include antibiotics, antivirals, rest, hydration, and oxygen therapy. Complications can include pleural effusion or respiratory failure."
  },
  {
    keywords: ["acute bronchitis", "bronchitis", "inflammation of the bronchial tubes"],
    expandedDescription: "Patient has been diagnosed with acute bronchitis, an inflammation of the bronchial tubes (airways) that carry air to and from the lungs. This condition is typically caused by viral infections and results in coughing, mucus production, chest discomfort, fatigue, and mild fever. Symptoms usually last 1-3 weeks and may include wheezing and shortness of breath. While most cases resolve on their own, treatment focuses on symptom relief with rest, fluids, humidifiers, and over-the-counter medications. Bacterial bronchitis may require antibiotics. Complications can include pneumonia if left untreated."
  },
  {
    keywords: ["gastritis", "stomach lining inflammation"],
    expandedDescription: "Patient is experiencing gastritis, an inflammation of the stomach lining that can occur suddenly (acute) or develop gradually over time (chronic). Common causes include bacterial infections (H. pylori), excessive alcohol consumption, prolonged use of NSAIDs, stress, and autoimmune disorders. Symptoms include burning stomach pain, nausea, vomiting, bloating, loss of appetite, and indigestion. If left untreated, gastritis can lead to stomach ulcers and bleeding. Treatment involves medications to reduce stomach acid, antibiotics for H. pylori infection, and dietary modifications including avoiding spicy, acidic, and fried foods."
  },
  {
    keywords: ["dengue", "dengue fever", "mosquito-borne viral infection"],
    expandedDescription: "Patient has been diagnosed with dengue fever, a mosquito-borne viral infection transmitted by Aedes mosquitoes. This tropical disease is characterized by sudden high fever, severe headache, pain behind the eyes, joint and muscle pain, rash, and mild bleeding manifestations. Symptoms typically appear 4-10 days after infection and last 2-7 days. In severe cases, dengue can progress to dengue hemorrhagic fever or dengue shock syndrome, which can be life-threatening. Treatment is supportive, focusing on hydration, rest, and pain management with acetaminophen. Close monitoring of platelet count and fluid balance is essential. Prevention involves mosquito control and avoiding mosquito bites."
  },
  {
    keywords: ["thyroid", "thyroid disorder", "hormone imbalance"],
    expandedDescription: "Patient has been diagnosed with a thyroid disorder, a condition affecting the thyroid gland's ability to produce hormones that regulate metabolism, energy, and growth. This can manifest as hypothyroidism (underactive thyroid) causing fatigue, weight gain, cold sensitivity, and depression, or hyperthyroidism (overactive thyroid) causing weight loss, rapid heartbeat, anxiety, and heat sensitivity. Other symptoms may include changes in hair texture, skin dryness, menstrual irregularities, and mood changes. Causes include autoimmune diseases, iodine deficiency, medications, or thyroid nodules. Treatment involves hormone replacement therapy for hypothyroidism or medications to reduce hormone production for hyperthyroidism. Regular monitoring and medication adjustment are essential for optimal management."
  },
  {
    keywords: ["urinary tract infection", "uti", "bacterial infection of urinary system"],
    expandedDescription: "Patient has developed a urinary tract infection (UTI), a bacterial infection affecting any part of the urinary system including the kidneys, ureters, bladder, or urethra. Most infections involve the lower urinary tract (bladder and urethra). Symptoms include a strong, persistent urge to urinate, burning sensation during urination, cloudy or strong-smelling urine, pelvic pain, and frequent passage of small amounts of urine. If the infection reaches the kidneys, it can cause fever, back pain, nausea, and vomiting. UTIs are more common in women and are typically caused by E. coli bacteria. Treatment involves antibiotics, increased fluid intake, and proper hygiene. Untreated UTIs can lead to kidney infections and complications."
  },
  {
    keywords: ["anemia", "anaemia", "low hemoglobin"],
    expandedDescription: "Patient has been diagnosed with anemia, a condition characterized by a deficiency of red blood cells or hemoglobin in the blood, resulting in reduced oxygen delivery to body tissues. Common symptoms include fatigue, weakness, pale skin, shortness of breath, dizziness, cold hands and feet, irregular heartbeat, and headaches. Causes vary and include iron deficiency, vitamin B12 or folate deficiency, chronic diseases, blood loss, genetic disorders, or bone marrow problems. The most common type is iron-deficiency anemia. Treatment depends on the underlying cause and may include dietary changes, iron or vitamin supplements, medications, or in severe cases, blood transfusions. Left untreated, anemia can lead to serious complications including heart problems and pregnancy complications."
  },
  {
    keywords: ["appendicitis", "inflammation of appendix"],
    expandedDescription: "Patient has been diagnosed with appendicitis, a medical emergency involving inflammation of the appendix, a small pouch attached to the large intestine. This condition typically begins with sudden pain around the navel that shifts to the lower right abdomen, becoming increasingly severe. Other symptoms include nausea, vomiting, loss of appetite, low-grade fever, constipation or diarrhea, abdominal bloating, and inability to pass gas. The exact cause is often unclear but may involve blockage by stool, foreign bodies, or infection. Appendicitis requires immediate medical attention as a ruptured appendix can lead to peritonitis, a life-threatening infection. Treatment almost always involves surgical removal of the appendix (appendectomy), either through traditional open surgery or laparoscopic procedure. Antibiotics are administered to prevent infection."
  }
];

/**
 * Finds a matching expansion mapping for a given disease name or description
 */
function findMatchingMapping(diseaseName: string, diseaseDescription: string): ExpansionMapping | null {
  const searchText = `${diseaseName} ${diseaseDescription}`.toLowerCase();

  for (const mapping of expansionMappings) {
    for (const keyword of mapping.keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return mapping;
      }
    }
  }

  return null;
}

/**
 * Main function to update disease descriptions in the database
 */
async function updateDescriptions() {
  try {
    console.log("🔄 Starting disease description update...\n");

    // Connect to database
    await connectDb();
    console.log("✅ Connected to database\n");

    // Fetch all health records
    const records = await HealthRecords.find({});
    console.log(`📊 Found ${records.length} health records to process\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    const updateLog: { disease: string; matched: string }[] = [];

    // Process each record
    for (const record of records) {
      const mapping = findMatchingMapping(record.diseaseName, record.diseaseDescription);

      if (mapping) {
        // Update the record with expanded description
        await HealthRecords.updateOne(
          { _id: record._id },
          { $set: { diseaseDescription: mapping.expandedDescription } }
        );

        updatedCount++;
        updateLog.push({
          disease: record.diseaseName,
          matched: mapping.keywords[0]
        });

        console.log(`✓ Updated: ${record.diseaseName}`);
      } else {
        skippedCount++;
        console.log(`⊘ Skipped: ${record.diseaseName} (no mapping found)`);
      }
    }

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("📈 UPDATE SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total records processed: ${records.length}`);
    console.log(`✅ Successfully updated: ${updatedCount}`);
    console.log(`⊘ Skipped (no mapping): ${skippedCount}`);
    console.log("=".repeat(60));

    if (updateLog.length > 0) {
      console.log("\n📋 Updated Diseases:");
      const diseaseGroups = updateLog.reduce((acc, item) => {
        if (!acc[item.matched]) {
          acc[item.matched] = 0;
        }
        acc[item.matched]++;
        return acc;
      }, {} as Record<string, number>);

      Object.entries(diseaseGroups).forEach(([disease, count]) => {
        console.log(`   • ${disease}: ${count} record(s)`);
      });
    }

    console.log("\n🎉 Disease description update completed successfully!");
    process.exit(0);

  } catch (error) {
    console.error("\n❌ Error updating descriptions:", error);
    process.exit(1);
  }
}

// Run the update
updateDescriptions();