/**
 * Runs the Search agent and Reviewer for every user whose chosen time has arrived.
 * Triggered hourly by .github/workflows/daily-run.yml. Run locally with `npm run daily-run`.
 */
import { runDueProfiles } from "../lib/pipeline";

runDueProfiles()
  .then((results) => {
    if (!results.length) console.log("No profiles due this hour.");
    for (const r of results) console.log(`${r.ok ? "OK  " : "FAIL"} ${r.id}: ${r.detail}`);
    if (results.some((r) => !r.ok)) process.exitCode = 1;
  })
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
