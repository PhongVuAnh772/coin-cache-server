import { spawn } from "child_process";

const jobs = {};
let jobCounter = 0;

export function runSwapToken(network) {
  const jobId = `job-${++jobCounter}`;
  jobs[jobId] = { status: "pending", stdout: "", stderr: "", code: null };

  const child = spawn("npx", ["hardhat", "run", "scripts/swapToken.ts"], {
    cwd: "blockchain/evms",
    env: { ...process.env, NETWORK: network },
  });

  child.stdout.on("data", (data) => {
    jobs[jobId].stdout += data.toString();
  });

  child.stderr.on("data", (data) => {
    jobs[jobId].stderr += data.toString();
  });

  child.on("close", (code) => {
    jobs[jobId].status = "done";
    jobs[jobId].code = code;
  });

  child.on("error", (err) => {
    jobs[jobId].status = "error";
    jobs[jobId].stderr += err.message;
  });

  return jobId;
}

export function getJobStatus(jobId) {
  return jobs[jobId] || null;
}
