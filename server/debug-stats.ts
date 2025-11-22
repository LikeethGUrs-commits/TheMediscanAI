import { connectDb } from "./db";
import { Doctors, HealthRecords } from "@shared/schema";

async function debug() {
    try {
        await connectDb();
        console.log("🔍 Debugging Doctor Stats...");

        const roleId = "DOC001";
        console.log(`\n1. Looking for doctor with roleId: ${roleId}`);

        const doctor = await Doctors.findOne({
            doctorId: { $regex: new RegExp(`^${roleId}$`, 'i') }
        });

        if (!doctor) {
            console.log("❌ Doctor NOT found!");
            process.exit(1);
        }

        console.log(`✅ Found Doctor: ${doctor.name}`);
        console.log(`   Internal ID: ${doctor.id}`);
        console.log(`   Role ID: ${doctor.doctorId}`);

        console.log("\n2. Checking Health Records...");
        const count = await HealthRecords.countDocuments({ doctorId: doctor.id });
        console.log(`   Found ${count} records for doctorId: ${doctor.id}`);

        if (count === 0) {
            console.log("\n3. checking ANY health records...");
            const anyRecord = await HealthRecords.findOne();
            if (anyRecord) {
                console.log("   Sample record doctorId:", anyRecord.doctorId);
                console.log("   Does it match?", anyRecord.doctorId === doctor.id);
            } else {
                console.log("   ❌ No health records in DB at all!");
            }
        }

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

debug();
