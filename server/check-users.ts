import { storage } from "./storage";

async function main() {
    console.log("Checking users in database...");
    try {
        // Check for specific known users
        const knownUsers = [
            { role: "doctor", id: "DOC001" },
            { role: "doctor", id: "DOC005" },
            { role: "patient", id: "PT0050" },
            { role: "hospital", id: "HOSP002" }
        ];

        for (const u of knownUsers) {
            const user = await storage.getUserByRoleId(u.id, u.role);
            if (user) {
                console.log(`Found known user: Role=${u.role}, ID=${u.id}, Name=${user.name}`);
            } else {
                console.log(`Known user NOT found: Role=${u.role}, ID=${u.id}`);
            }
        }

        // List some patients
        console.log("\nListing some patients:");
        const patients = await storage.getAllPatients();
        if (patients.length > 0) {
            for (const p of patients.slice(0, 5)) {
                console.log(`Patient: Name=${p.name}, ID=${p.patientId}`);
                // Check if this patient has a user account
                const user = await storage.getUserByRoleId(p.patientId, "patient");
                if (user) {
                    console.log(`  -> User account exists for this patient.`);
                } else {
                    console.log(`  -> NO user account for this patient.`);
                }
            }
        } else {
            console.log("No patients found.");
        }

    } catch (error) {
        console.error("Error:", error);
    }
    process.exit(0);
}

main();
