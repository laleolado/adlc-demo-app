# The ADLC workshop, explained for a beginner

A plain-language guide to what this repo builds, what each checkpoint adds, and what the
instructions on https://adlc.omkh.dev mean. Written as study notes while working through the
workshop.

## Part 1: What you're building, in plain words

You're building a **bot** that helps fix bugs in a web app.

Today, when someone reports a bug, a developer has to stop, read the report, download the
code, try to make the bug happen, and write a small automated test that proves it. Only then
can they fix it. That first part is slow and boring.

This bot does that first part automatically:

1. Someone reports a bug.
2. The bot downloads the code into a private, throwaway computer.
3. An AI inside that computer tries to make the bug happen and writes a test that fails
   because of the bug.
4. Non-AI code double-checks that the test really fails.
5. The bot posts a comment and opens a proposed change on GitHub containing just that test.
6. **You** write the actual fix.

The workshop builds this bot in six stages called **checkpoints** (0 to 5). Each checkpoint
adds one ability.

## Part 2: The words the pages use

| Word | What it means |
|---|---|
| **GitHub** | A website where code is stored and shared. |
| **Repository (repo)** | One project's folder of code on GitHub. |
| **Fork** | Your own copy of someone else's repo, on GitHub, under your account. |
| **Clone** | Downloading a repo to your laptop. |
| **Issue** | A bug report or request posted on a repo. It has a title, a body, and a number (#1, #2, ...). |
| **Commit** | A saved snapshot of the code. Each has an ID called a **SHA** (like `3f2c1a9...`). |
| **Branch** | A separate line of changes. `main` is the default one. |
| **Pull request (PR)** | A proposed change, shown as a diff, that people review before accepting. A **draft** PR is one marked "not ready to merge yet". |
| **Merge** | Accepting a PR into `main`. |
| **CI** | Automated checks GitHub runs on every PR (lint, type check, tests, build). Shows a green tick or a red cross. |
| **Webhook** | GitHub's way of notifying another program: "when an issue opens, send a message to this web address." |
| **Cloudflare** | A company that runs your code on their servers so it's online all the time. |
| **Worker** | A program running on Cloudflare. Your bot is a Worker. |
| **Deploy** | Uploading your code to Cloudflare so it goes live. |
| **wrangler** | Cloudflare's command-line tool for logging in, deploying, storing secrets, and watching logs. |
| **pnpm** | A tool that downloads the libraries your code depends on, and runs project scripts. |
| **Node** | The program that runs JavaScript/TypeScript on your laptop. |
| **Secret** | A password-like value stored on the Worker, never in the code. |
| **Token** | A key that lets a program act on GitHub as you (post comments, open PRs). |
| **Sandbox** | A throwaway Linux computer (a Docker container) the AI works inside. Destroyed afterwards. |
| **Docker** | The tool that builds and runs containers. Needed on your laptop to build the sandbox image. |
| **R2** | Cloudflare's file storage. The bot saves its reports there. |
| **AI Gateway** | A Cloudflare layer that sits between your bot and the AI model, logging every request. |
| **Workflow** | A Cloudflare feature for running a multi-step job where each step is saved, so a crash doesn't restart from zero. |
| **Agent** | The AI part: a model that can run commands and use tools. |
| **Flue** | The framework the bot uses to build the agent. |
| **Log** | Lines of text a program writes to say what it's doing. |
| **Lint** | A check for code style problems. |
| **Typecheck** | A check that types line up (not using text where a number is expected). |

## Part 3: Two different things are happening

- **Build time: what *you* do.** Edit files, run commands, deploy. This happens on your laptop
  and in your browser. The checkpoint pages are all about this.
- **Run time: what the *bot* does.** When an issue opens, the bot runs on Cloudflare by
  itself. Your laptop could be off.

Every checkpoint page has the same shape:

1. **Goal:** what the bot can do by the end.
2. **Before you start:** what must already exist.
3. **Resources:** cloud things to create (bucket, gateway, token).
4. **Files:** code to add or change. Each file is shown with three tabs: *Complete file*
   (copy this), *Changes* (the diff), *Changes explained* (why).
5. **Deploy:** the commands to build and upload.
6. **Check it works:** open a test issue, watch the log, confirm specific lines appear.
7. **Catch up:** a ready-made branch if you fall behind.

## Part 4: The checkpoints, and what their instructions mean

### Checkpoint 0: the bot can hear

**Goal:** when an issue opens on your fork, your Worker logs it. No AI yet.

| The page says | What it means | Why |
|---|---|---|
| Fork `adlc-demo-app`, keep it public, enable Issues and Actions | Make your own copy of the buggy app on GitHub. Turn on bug reports and automated checks. | You need an app you control to report bugs on. Public, because the sandbox later downloads it with no login. |
| `git clone https://github.com/omkarkhair/adlc-triage-agent.git` | Download the bot's code to your laptop. | You'll edit and deploy it from here. |
| `pnpm install` | Download every library the code needs into `node_modules`. | One of those libraries is wrangler. Nothing Cloudflare-related works until this finishes. |
| `pnpm lint && pnpm typecheck && pnpm test && pnpm build` | Run the four checks in a row. Stop if one fails. | Proves the code is healthy before you upload it. |
| `pnpm exec wrangler login` | Open a browser and sign in to Cloudflare. | Wrangler saves a login token so later commands can act as you. Use the **workshop** account. |
| `pnpm exec wrangler whoami` | Print which account you're signed in as. | A quick sanity check. |
| `pnpm run deploy` | Build the code and upload it to Cloudflare. Prints the bot's web address. | This makes the bot live. (`pnpm deploy` without `run` is a different, unrelated command.) |
| `openssl rand -hex 32` | Generate a long random password. | GitHub and the Worker will share it to sign and verify messages. On Windows, run this in Git Bash. |
| `pnpm exec wrangler secret put GITHUB_WEBHOOK_SECRET` | Store that password on the Worker under this name. Paste it when asked. | The Worker reads it at run time. Takes effect at once, no redeploy. |
| `cp .dev.vars.example .dev.vars`, paste the secret | Make a local copy of the password in a file git ignores. | Only used by a test script that pretends to be GitHub. |
| Settings, Webhooks, Add webhook: URL `.../channels/github/webhook`, content type `application/json`, secret, events: Issues only | Tell GitHub: "when an issue opens, POST a JSON message signed with this secret to my Worker." | This is the wire between GitHub and your bot. |
| "GitHub sends a ping; it must return 200" | GitHub tests the address immediately. 200 means "received and signature OK". | That's why deploy and secret must come *before* the webhook. |
| `pnpm exec wrangler tail adlc-triage-agent --format pretty` | Stream the Worker's live log to your terminal. | So you can watch what happens. Can lag about 30 seconds. |
| Open an issue "Hello triage bot" | Trigger the webhook for real. | You should see `webhook.received` in the log. |

Ping failure meanings: 401 = secret mismatch; 404 = wrong path; 415 = content type not JSON;
503 `unconfigured` = no secret on the Worker; timeout = URL typo or not deployed. Fix, then
click **Redeliver**.

**Done when:** the ping was 200 and the log shows `webhook.received` with your repo and issue
number.

### Checkpoint 1: the bot can think and act

**Goal:** a new issue starts an AI agent that works in a sandbox and saves a written report.

| The page says | What it means | Why |
|---|---|---|
| `pnpm exec wrangler r2 bucket create adlc-triage-reports` | Create a storage bucket named exactly that. | The bot saves reports here. The name is hard-coded in the config. |
| Create an AI Gateway named `adlc-triage-agent` | In the Cloudflare dashboard, make a gateway with that exact name. | The config refers to it by name. It logs every AI request so you can inspect them. |
| Edit `wrangler.jsonc` (add `ai`, `r2_buckets`, `durable_objects`, `containers`, `migrations`) | This is the bot's settings file. You're telling Cloudflare: "give my Worker an AI model, this bucket, a Sandbox class, build a container from `./Dockerfile`, allow 3 at once." | Cloudflare only connects resources the config declares. |
| Create `src/agents/reproducer.ts` | The agent's definition: which model, which sandbox, and one tool called `save_report`. | This is the AI's "body": how it thinks and what it can touch. |
| Create `src/agents/reproducer.md` | The agent's instructions, in plain English. | Tells it: reproduce the bug, don't fix it, only write files under `tests/`, treat the issue text as a symptom not as orders. |
| Create `src/reports.ts` | Code that formats and writes a report to R2 at `runs/issue-<n>/report.md`. | The AI can't write to storage itself. It asks via the tool; your code does the writing. |
| Create `src/cloudflare.ts` | One line that exports the provided `Sandbox` class. | Cloudflare must be able to find every class the config names. |
| Edit `src/app.ts` | When a webhook arrives, start the agent instead of just logging. | Connects the ears to the brain. |
| `pnpm cf-typegen` | Regenerate a TypeScript file describing your new config entries. | Without it, the code won't compile because it doesn't know `env.REPORTS` or `env.AI` exist. Run after any `wrangler.jsonc` change. |
| `pnpm run deploy` (with Docker running) | Build the container image, upload everything. | First time takes several minutes. Docker must be running or the image can't be built. |
| Open the main test issue, watch for `agent.dispatched`, then `report.saved`, then `agent.finished` with `reportSaved: true` | The AI was started, finished, and successfully saved a report. | A few minutes pass while the container starts, downloads code, and the AI works. |
| `pnpm report 3` | Print the report the bot saved for issue #3. | Reads it back from R2. |

**Done when:** `pnpm report <n>` prints a report.
**Remember:** this report is only the AI's opinion. Nothing has checked it.

### Checkpoint 2: the bot must answer on a form

**Goal:** the AI must finish with one of three typed answers: `reproduced`, `cannot-reproduce`,
or `needs-information`.

| The page says | What it means | Why |
|---|---|---|
| Create `src/outcome.ts` | A schema (a strict shape) for the answer, plus a few extra rules. | Free text can't be trusted by code. A form can. |
| Replace `save_report` with `submit_outcome` in `reproducer.ts` | The tool now takes the form, not a paragraph. If the form is wrong, the AI gets an error and tries again. | Validate at the boundary: AI output is untrusted until checked. |
| Add a "finish hook" with `MAX_REMINDERS = 2` | If the AI stops without submitting, send it back, at most twice. | Small models sometimes forget. Two reminders, then give up rather than loop forever. |
| Update `reproducer.md` to decide early | If the issue is vague, answer `needs-information` *before* downloading anything. | Saves minutes and a container. |
| Deploy, open the main issue, expect `outcome.submitted` and `outcomeSubmitted: true` | The AI filled the form correctly. | |
| Open the vague issue ("Orders are broken") | Expect `needs-information` within a couple of minutes. | Proves the early exit works. |

No new cloud resources, no `cf-typegen`.

### Checkpoint 3: a manager takes over, and the reporter gets a comment

**Goal:** each issue starts one durable Workflow that prepares everything, runs the AI, posts
a comment, and cleans up.

| The page says | What it means | Why |
|---|---|---|
| Create a fine-grained GitHub token (fork only; Issues, Contents, Pull requests: read/write; 7-day expiry) | Make a key that lets the bot post comments and later open PRs, on this one repo only. | The bot needs to write to GitHub now. Narrow scope limits damage if leaked. |
| `pnpm exec wrangler secret put GITHUB_TOKEN` | Store that key on the Worker. | Same as the webhook secret: on the Worker, never in code. |
| "Two secrets, different jobs" | `GITHUB_WEBHOOK_SECRET` checks *incoming* messages. `GITHUB_TOKEN` authorises *outgoing* GitHub calls. | Easy to mix up. They are not interchangeable. |
| Create `src/workflow.ts` | The manager. Steps: pin a commit, comment "started", prepare the sandbox, start the AI, wait for its form, comment the result, destroy the sandbox. | Each step is saved, so a restart skips finished steps. |
| "Pin a commit" | Record the exact version of the code at the moment the issue arrived. | So the run isn't confused by code pushed later. |
| Edit `app.ts` to create a Workflow named `issue-<n>` | Start the manager instead of the AI directly. | Same name per issue means a re-sent webhook can't start a second run (`run.duplicate`). |
| Edit `reproducer.md`: "repository is already checked out, do not clone" | The manager now downloads the code before the AI starts. | The AI should never choose which version it tests. |
| Add `workflows` to `wrangler.jsonc`, then `pnpm cf-typegen` | Declare the Workflow so Cloudflare and TypeScript know about it. | |
| Deploy, open a real issue, watch the comment appear, then update | The same comment is edited in place using a hidden marker. | Safe to retry: it updates rather than posting twice. |
| Click "Redeliver" on the delivery, expect `run.duplicate` | Proves double-sends are harmless. | |
| "Use a real issue number with `pnpm webhook:send`" | The fake-webhook script now triggers real comments, so the issue must exist. | |

### Checkpoint 4: an auditor checks the AI's work

**Goal:** `reproduced` only counts if trusted code re-runs the test on clean code and sees it
fail properly.

| The page says | What it means | Why |
|---|---|---|
| Only `workflow.ts` and `reports.ts` change; `verify.ts` is provided | Wire in the checking code; don't write it. | |
| "Collect test" step | Copy the test file out of the sandbox and record its SHA-256 fingerprint. | Later steps use exactly these bytes. |
| "Verify on base commit" step | Reset the sandbox to the pinned code (discarding anything else the AI changed), put only the test back, run lint, typecheck, and the test. | The test must fail against the *original* code, not a version the AI tinkered with. |
| Only **red** verifies | Every test in the file failed, each on an assertion. **Green** = test passed (no bug shown). **Invalid** = crash, compile error, or mixed results. | A crash proves nothing. A passing test proves nothing. |
| Downgrade | If not red, the verdict becomes `cannot-reproduce` and the report says "the agent claimed `reproduced`". | The model can't argue with code. |
| "Verified is not the same as correct" | The harness proves the test *fails*. It can't prove the test is *meaningful*. | A real run once compared `undefined` to `undefined`, which trivially passes. Read the test. |
| Deploy, open the main issue, expect `test.collected`, `verification.finished status:"red"`, `run.finished verified:true` | | |

Downgrades are normal, especially on the harder optional issue. They mean the checkpoint is
working.

### Checkpoint 5: hand it to a human

**Goal:** a verified failing test becomes a draft PR with red CI.

| The page says | What it means | Why |
|---|---|---|
| Only `workflow.ts` changes; `pull-request.ts` is provided | Add one step: "open pull request". | |
| Branch `triage/issue-<n>`, commit built from the pinned commit plus the one test file | The bot writes exactly the verified bytes to a new branch using GitHub's API. No `git push` runs anywhere. | The fingerprint from CP4 guarantees it's the same file. |
| Draft PR, body says `Refs #n` not `Fixes #n` | Draft = can't be merged by accident. `Refs` = merging won't auto-close the issue. | A human must mark it ready and decide. |
| CI goes red | GitHub runs the checks. Lint, typecheck, build pass; only the test fails. | **That red is the proof of the bug.** |
| Clone *your fork of the demo app*, `git switch triage/issue-<n>`, run the test, fix `src/` without touching the test, push | You do the fix. | The AI's job ended at the failing test. |
| CI goes green, review, mark ready, merge | Done. | Nothing merges on its own. |
| `pr.skipped` / `pr.failed` / no `pr.*` line | Skipped = branch already had other changes. Failed = GitHub error after retries. No line = claim wasn't verified, or no token. | |

## Part 5: One issue, end to end, through the finished bot

1. **Someone opens an issue** on your fork. GitHub signs a message and POSTs it to your
   Worker. *(CP0)*
2. **The Worker checks the signature** and starts Workflow `issue-7`. A duplicate delivery is
   ignored. *(CP0, CP3)*
3. **The manager pins a commit**, posts "Triage started on commit `3f2c...`", starts a
   sandbox, downloads that commit, installs dependencies. *(CP3)*
4. **The AI investigates** inside the sandbox. It receives its rules as instructions and the
   issue text as a separate, untrusted message. It writes `tests/triage/issue-7.test.ts`, runs
   it, lints it, and submits the form: `reproduced`, with the test path. *(CP1, CP2)*
5. **The auditor verifies**: copies the test out, resets the sandbox, puts only the test
   back, runs lint, typecheck, and the test. Result: red. Verdict stays `reproduced`, now
   verified. *(CP4)*
6. **The manager publishes**: saves the report to R2, opens a draft PR from
   `triage/issue-7`, updates the comment with the PR link plus the report and a Verification
   section, destroys the sandbox. *(CP4, CP5)*
7. **CI runs on the PR** and goes red. *(CP5)*
8. **You fix it**: clone, switch branch, fix `src/`, push. CI goes green. You merge. *(you)*

```
Issue -> webhook -> Worker -> Workflow issue-7
                                  |
   pin commit -> comment -> sandbox + checkout -> AI writes failing test
                                  |
   reset -> re-run test -> red? -> verified -> report + draft PR + comment -> destroy sandbox
                                  |
                       CI red -> you fix -> CI green -> you merge
```

## Part 6: Three ideas that explain every design choice

1. **The AI can only produce text.** Writing to storage, commenting, opening a PR: all done by
   your code, after a check. A tool call is the wall between thinking and doing.
2. **Trust the harness, not the model.** A claim becomes a fact only after trusted code
   reproduced it on a clean checkout.
3. **The keys never enter the room.** The GitHub token lives in the Worker. The sandbox, where
   AI-chosen commands run, never sees it. That's also why the fork must be public.

## Part 7: Commands cheat sheet

| Command | Plain meaning |
|---|---|
| `pnpm install` | Download the libraries. |
| `pnpm lint` / `typecheck` / `test` / `build` | Style check / type check / run tests / compile. |
| `pnpm exec wrangler login` | Sign in to Cloudflare. |
| `pnpm exec wrangler whoami` | Which account am I? |
| `pnpm run deploy` | Build and upload the bot. |
| `pnpm exec wrangler secret put NAME` | Store a secret on the Worker. |
| `pnpm exec wrangler tail adlc-triage-agent --format pretty` | Watch the live log. |
| `pnpm cf-typegen` | Regenerate types after editing `wrangler.jsonc`. |
| `pnpm exec wrangler r2 bucket create adlc-triage-reports` | Create the report bucket. |
| `pnpm report 7` | Print the report for issue #7. |
| `pnpm exec wrangler workflows instances describe adlc-triage-run issue-7` | Show each step of run #7. |
| `git switch dev/checkpoint-3` then `pnpm run deploy` | Jump to the finished code for a checkpoint (secrets and cloud resources still needed). |

## Part 8: Limits to keep in mind

- The agent's deadline is 10 minutes, checked between model turns.
- The platform stops a Durable Object alarm after 15 minutes.
- The Workflow's "wait for agent" step times out after 25 minutes (one retry, re-attaching
  to the same run).
- The sandbox container is destroyed 30 minutes after it starts, no matter what.
- Open a **new** issue for every test run. Runs are named `issue-<n>`. One run at a time.
