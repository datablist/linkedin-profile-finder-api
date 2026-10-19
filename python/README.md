# LinkedIn Profile Finder API — Python examples

Find LinkedIn profiles from a small list of names and company keywords.
Each file shows all the HTTP calls in one place.

## Setup

Use Python 3.12 or newer. From this `python` folder:

```sh
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
export DATABLIST_API_KEY='your-personal-api-key'
```

Create your key on the [Datablist API page](https://app.datablist.com/account/api).
Searches consume credits even when no profile is found. See the current
[credit cost and limits](https://platform.datablist.com/docs/enrichments/tools/linkedin-profile-lookup#credits-and-limits)
and [pricing](https://www.datablist.com/pricing).

## Run an example

**Synchronous, using Requests:**

```sh
python sync_requests.py
```

**Asynchronous, using HTTPX:**

```sh
python async_httpx.py
```

Edit the `people` list at the bottom of either file:

```python
people = [
    {"fullName": "Satya Nadella", "keyword": "Microsoft"},
    {"firstName": "Julie", "lastName": "Zhuo", "keyword": "Sundial"},
]
```

Use `fullName`, or both `firstName` and `lastName`. If both formats are present,
`fullName` takes precedence. `keyword` is optional; a company or school name
helps narrow the search.

Both examples submit a background task, poll every three seconds, and read all
result pages. Requests uses blocking calls. HTTPX uses `await` and
`asyncio.sleep`. Each prints full result objects.

## Settings and results

Edit `settings` in the payload to customize the search:

- `searchCountry`: search engine country setting, such as `US`, `GB`, or `FR`.
  It applies to the whole task and does not indicate the person's nationality.
- `skipIfNotName`: set to `True` to discard candidates with very low name
  confidence. `False` keeps them in the results for review.

Each result has an `inputId`, `status`, `outputs`, `creditsUsed`, and `error`.
The `inputId` matches the person you sent. Available output fields include:

- `profileUrl`: matching LinkedIn profile URL.
- `linkedInUrlTitle`: search page title.
- `linkedInSnippet`: search summary.
- `profileConfidence`: `High`, `Medium`, `Low`, or `Very Low`; it may be `None`.

Each script submits one task with up to 10,000 people, within the API's request
size limits. These examples do not batch larger lists.

## When something fails

HTTP errors raise the library's normal exception. A failed or stopped task raises
an exception with its task ID. A completed task can still have individual errors
or no matches; check each result's `status`.

If you stop a script, the submitted task continues on the server. List your
[tasks](https://platform.datablist.com/docs/enrichments/tasks) to check its status
before creating another task.
