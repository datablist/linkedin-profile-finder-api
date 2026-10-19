"""Find LinkedIn profiles from names with the Datablist API using requests.

This standalone example submits a small list of people, waits for the background
task to finish, and reads all pages of results. HTTP calls and three-second
polling pauses block until they finish.

Each person has a fullName (or firstName and lastName) and an optional keyword,
such as a company or school. Results include the profile URL, search page title,
summary, confidence, status, and credits used when available.

Set DATABLIST_API_KEY and run: python sync_requests.py
Edit the people list and the searchCountry setting to try your own searches.
This example submits one task of up to 10,000 people. Calls consume credits,
including searches that do not find a profile.
"""

import os
import time
import uuid

import requests


def find_linkedin_profiles(people: list[dict], api_key: str) -> list[dict]:
    """Submit one task, wait for it to finish, and return its results."""
    tasks_url = "https://api.datablist.com/v1/enrichments/tasks"
    headers = {"X-API-Key": api_key}
    inputs = [
        {"inputId": f"row-{index}", "data": person}
        for index, person in enumerate(people, start=1)
    ]

    # 1. Submit the people to look up.
    payload = {
        "enrichmentId": "linkedin-profile-lookup",
        "uniqueId": str(uuid.uuid4()),
        "settings": {"searchCountry": "US", "skipIfNotName": False},
        "inputs": inputs,
    }
    response = requests.post(tasks_url, headers=headers, json=payload)
    response.raise_for_status()
    task = response.json()
    task_id = task["@id"]
    task_url = f"{tasks_url}/{task_id}"

    # 2. Wait for the background task to finish.
    while task["status"] not in ("completed", "failed", "stopped"):
        time.sleep(3)
        response = requests.get(task_url, headers=headers)
        response.raise_for_status()
        task = response.json()

    if task["status"] != "completed":
        raise RuntimeError(f"Task {task_id} {task['status']}: {task.get('error')}")

    # 3. Read the results, following pagination when needed.
    results = []
    results_url = f"{task_url}/results"
    params = {"limit": 100}
    while True:
        response = requests.get(results_url, headers=headers, params=params)
        response.raise_for_status()
        page = response.json()
        results.extend(page["results"])
        next_cursor = page["nextCursor"]
        if next_cursor is None:
            break
        params["cursor"] = next_cursor

    return results


if __name__ == "__main__":
    api_key = os.environ["DATABLIST_API_KEY"]
    people = [
        {"fullName": "Satya Nadella", "keyword": "Microsoft"},
        {"fullName": "Julie Zhuo", "keyword": "Sundial"},
    ]

    results = find_linkedin_profiles(people, api_key)
    for result in results:
        print(result)
