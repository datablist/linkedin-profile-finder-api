/**
 * Find LinkedIn profiles from names with the Datablist API using async/await and built-in fetch.
 *
 * Submit a small input list, wait for the background task, and read all result
 * pages. HTTP calls use await; polling pauses for three seconds between checks.
 *
 * Use Node.js 24.3 or newer. Set DATABLIST_API_KEY, then run from the repo root:
 * node typescript/example.ts
 *
 * Edit people at the bottom and the settings in the payload to try your own
 * inputs. This example submits one task, with up to 10,000 inputs. Calls can
 * consume account credits. Full result objects are printed as JSON.
 */

type Person = {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  keyword?: string;
};

/** Submit one task, wait for it to finish, and return its results. */
async function findLinkedInProfiles(people: Person[], apiKey: string): Promise<object[]> {
  const tasksUrl = "https://api.datablist.com/v1/enrichments/tasks";
  const headers = {
    "X-API-Key": apiKey,
    "Content-Type": "application/json",
  };
  const inputs = people.map((person, index) => {
    return {
      inputId: `row-${index + 1}`,
      data: person,
    };
  });

  // 1. Submit the inputs.
  const payload = {
    enrichmentId: "linkedin-profile-lookup",
    uniqueId: crypto.randomUUID(),
    settings: { searchCountry: "US", skipIfNotName: false },
    inputs,
  };
  let response = await fetch(tasksUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  let task = await response.json();
  const taskId = task["@id"];
  const taskUrl = `${tasksUrl}/${taskId}`;

  // 2. Wait for the background task to finish.
  while (!["completed", "failed", "stopped"].includes(task.status)) {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 3000);
    });
    response = await fetch(taskUrl, { headers });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    task = await response.json();
  }

  if (task.status !== "completed") {
    throw new Error(`Task ${taskId} ${task.status}`);
  }

  // 3. Read every result page, until nextCursor is null.
  const results: object[] = [];
  const params = new URLSearchParams({ limit: "100" });
  while (true) {
    response = await fetch(`${taskUrl}/results?${params}`, { headers });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const page = await response.json();
    results.push(...page.results);
    if (page.nextCursor === null) {
      break;
    }
    params.set("cursor", page.nextCursor);
  }

  return results;
}

const apiKey = process.env.DATABLIST_API_KEY ?? "";
const people = [
  {
    fullName: "Satya Nadella",
    keyword: "Microsoft"
  },
  {
    fullName: "Julie Zhuo",
    keyword: "Sundial"
  }
];

const results = await findLinkedInProfiles(people, apiKey);
console.log(JSON.stringify(results, null, 2));
