
import { runMidnightTally } from "../lib/tally";

async function main() {
    console.log("--- Starting Manual Tally Verification ---");
    await runMidnightTally();
    console.log("--- Verification Complete ---");
}

main().catch(console.error);
