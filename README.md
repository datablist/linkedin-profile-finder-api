# LinkedIn Profile Finder from Name API

Find a person's LinkedIn profile URL from their name with the
[Datablist](https://www.datablist.com/) LinkedIn Profile Finder API.

Send a name and an optional keyword, such as a company or school. Get a matching
LinkedIn URL, search page title, summary, and confidence when available. The API
uses Google search to find matching profiles.

Use it to add LinkedIn URLs to CRM contacts, prepare prospect lists, or connect
existing contact records to a profile lookup workflow. A company keyword helps
distinguish people who share the same name.

## Get started

Choose [Python](python/README.md) or [TypeScript](typescript/README.md).
The commands below use Python.

1. [Create a Personal API Key](https://app.datablist.com/account/api).
2. Run these commands from this repository's root:

```sh
cd python
python -m pip install -r requirements.txt
export DATABLIST_API_KEY='your-personal-api-key'
python sync_requests.py
```

Edit the `people` list at the bottom of the script to try your own names.
See the [Python guide](python/README.md) for setup and the async example.

Searches consume account credits, including those that find no profile. See the
current [credit cost and limits](https://platform.datablist.com/docs/enrichments/tools/linkedin-profile-lookup#credits-and-limits)
and [pricing](https://www.datablist.com/pricing). Each result includes its actual
`creditsUsed`.

## Input and output

Send names to `POST https://api.datablist.com/v1/enrichments/tasks` with your key
in the `X-API-Key` header:

```json
{
  "enrichmentId": "linkedin-profile-lookup",
  "uniqueId": "linkedin-finder-example-001",
  "settings": {
    "searchCountry": "US",
    "skipIfNotName": false
  },
  "inputs": [
    {
      "inputId": "row-1",
      "data": {
        "fullName": "Jane Doe",
        "keyword": "Example Company"
      }
    }
  ]
}
```

Send `fullName`, or `firstName` and `lastName`. If both formats are present,
`fullName` takes precedence. The optional `keyword` narrows the search.

Use a new `uniqueId` for each new task. Give each person their own `inputId` so
you can match each result to its input, even when names repeat.

The API returns `202 Accepted` with a task ID in `@id`. Check its status, then
retrieve the results. Example results response (sample data):

```json
{
  "taskId": "00000000000040008000000000000001",
  "results": [
    {
      "inputId": "row-1",
      "status": "success",
      "outputs": {
        "profileUrl": "https://www.linkedin.com/in/example-person",
        "linkedInUrlTitle": "Jane Doe — Example Company",
        "linkedInSnippet": "Jane Doe works at Example Company.",
        "profileConfidence": "High"
      },
      "creditsUsed": "2.5",
      "error": null
    }
  ],
  "nextCursor": null
}
```

Confidence can be `High`, `Medium`, `Low`, or `Very Low`, and can be `null` when
unavailable. Check the title and summary to help choose the right person. A
search with no match may have no profile fields; check each result's `status`.

## Try with cURL

Set your key, then submit a name and company keyword:

```sh
export DATABLIST_API_KEY='your-personal-api-key'

curl --request POST 'https://api.datablist.com/v1/enrichments/tasks' \
  --header "X-API-Key: $DATABLIST_API_KEY" \
  --header 'Content-Type: application/json' \
  --data '{
    "enrichmentId": "linkedin-profile-lookup",
    "uniqueId": "linkedin-finder-curl-001",
    "settings": {"searchCountry": "US", "skipIfNotName": false},
    "inputs": [
      {"inputId": "row-1", "data": {"fullName": "Satya Nadella", "keyword": "Microsoft"}}
    ]
  }'
```

Copy the returned `@id` into `TASK_ID`. Use a new `uniqueId` for a new task.

```sh
TASK_ID='paste-returned-task-id'

curl "https://api.datablist.com/v1/enrichments/tasks/$TASK_ID" \
  --header "X-API-Key: $DATABLIST_API_KEY"
```

Repeat the status command every few seconds until `status` is `completed`,
`failed`, or `stopped`. Then retrieve the results:

```sh
curl "https://api.datablist.com/v1/enrichments/tasks/$TASK_ID/results" \
  --header "X-API-Key: $DATABLIST_API_KEY"
```

If `nextCursor` is not `null`, pass it as `cursor` to fetch the next page.
The Python and TypeScript examples read every page for you.

## Python examples

| Example | What it shows |
| --- | --- |
| [Synchronous Requests](python/sync_requests.py) | Find profiles using blocking HTTP calls. |
| [Asynchronous HTTPX](python/async_httpx.py) | Use `async` and `await` for the same API workflow. |

Each file is self-contained: submit people, wait for the task, and read results.
Both clients use the API's background tasks. The difference is how Python waits
for HTTP calls.

## TypeScript example

Use [the standalone TypeScript example](typescript/example.ts) with Node.js 24.3+;
no packages to install. From the repository root:

```sh
export DATABLIST_API_KEY='your-personal-api-key'
node typescript/example.ts
```

See the [TypeScript guide](typescript/README.md) for editable inputs and settings.

## Documentation

- [LinkedIn Profile Finder from Name API](https://platform.datablist.com/docs/enrichments/tools/linkedin-profile-lookup)
- [Enrichments API quickstart](https://platform.datablist.com/docs/enrichments/quickstart)
- [Task lifecycle](https://platform.datablist.com/docs/enrichments/tasks)

## Other Datablist API examples

- [Company Name to Domain API](https://github.com/datablist/company-name-to-domain-api): find company websites from names.
- [Company Name Cleaner API](https://github.com/datablist/company-name-cleaner-api): clean and standardize company names.
- [Impressum Scraper API](https://github.com/datablist/impressum-scraper-api): extract business details from website Impressum pages.
