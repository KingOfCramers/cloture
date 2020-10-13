import { Queue } from "bull";
import { SenateFinancialDisclosureJob } from "../jobs";

export const cron = async (
  queue: Queue,
  job: SenateFinancialDisclosureJob
): Promise<void> => {
  const options = {
    repeat: { cron: "*/30 * * * *" },
    removeOnComplete: true, // Remove the job once it's completed.
    removeOnFail: true, // Remove the job if it fails
  };

  try {
    await queue.add(job.name, job, options);
    console.log(`Created job: '${job.name}' recurring every thirty minutes.`);
  } catch (err) {
    console.log(`Could not schedule ${job.collection} cron job`);
    throw err;
  }
};

export const producers = async (
  queue: Queue,
  jobs: SenateFinancialDisclosureJob[]
): Promise<void> => {
  // This adds our jobs to the queue.
  // Each job is added by "name" and then the full data from the job is passed into Redis.
  // This data is then picked up by our consumer
  const producers = jobs.map(async (job) => {
    if (process.env.NODE_ENV === "production") {
      await cron(queue, job);
    } else {
      queue.add(job.name, job, {
        removeOnComplete: true,
        removeOnFail: true,
      });
      console.log(`Created job: '${job.name}'`);
    }
  });
  await Promise.all(producers);
  console.log("All job producers created.");
};
