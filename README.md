# Log Expenses with Google Drive

This [workflow app](https://api.slack.com/automation) features a coded workflow and custom function allowing end users to submit an expense, add a row to a spreadsheet, and upload the receipt/invoice file to Google Drive.

The app manifest includes a coded workflow called **Submit an expense** which presents a built-in form to the user to collect the expense details. The next step in the workflow uploads the file to Google Drive (custom function), following by adding a row to a spreadsheet (connector step), and sending a DM to the end user (built-in).

🗃️ **Upload a file to Google Drive** a custom function that is responsible for uploading a file to Google Drive. It does not assume usage in an expense management workflow, so it can be reused for any other purpose that involves file uploads to Google Drive.

_Note: The custom step is not compatible with WFB directly. If a builder attempts to use the step in a workflow, they will see a warning about lack of support for steps that use file inputs. This is why a coded workflow is used for this app._


**Outline**

- [Setup](#setup)
- [Creating Triggers](#creating-triggers)
- [Deploying Your App](#deploying-your-app)
- [Viewing Activity Logs](#viewing-activity-logs)
- [Project Structure](#project-structure)
- [Resources](#resources)

## Setup

> Before getting started, first make sure you have a development workspace where
> you have permission to install apps. **Please note that the features in this
> project require that the workspace be part of
> [a Slack paid plan](https://slack.com/pricing).**

### Install the Slack CLI

To use this template, you need to install and configure the Slack CLI.
Step-by-step instructions can be found in our
[Quickstart Guide](https://api.slack.com/automation/quickstart).

### Clone the Sample

Start by cloning this repository:

```zsh
# Clone this project onto your machine
$ slack create expenses-app -t Slack-Partner-Engineering/log-expenses-with-google-drive

# Change into the project directory
$ cd expenses-app
```

### Google Cloud project

Create a new [Google Cloud project](https://developers.google.com/workspace/guides/create-project), enable the Google Drive API, and add the following three scopes: `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `.../auth/drive.file`.

Create a new Web Application OAuth client and set the callback URI to: `https://oauth2.slack.com/external/auth/callback`. Copy the Client ID & Client secret for us in [the next step](#environment-variables).

### Environment variables

Create a copy of `.env.sample` and rename it to `.env`. Include the Google OAuth client details and create a new Google Sheet using the sample csv in `./assets/sample.csv` to gather the spreadsheet ID (in the URL) and Sheet name.

### Run the app locally

While building your app, you can see your changes appear in your workspace in real-time with `slack run`. You'll know an app is the development version if the name has the string `(local)` appended.

```zsh
# Run app locally
$ slack run

Connected, awaiting events
```

To stop running locally, press `<CTRL> + C` to end the process.

### Configure external auth

Stop your app so that you can run a few more commands to [store your client secret](https://api.slack.com/automation/external-auth#client-secret) to configure external auth with your Google provider.

```zsh
slack external-auth add-secret --provider google --secret "GOCSPX-abc123..."
```

Since both steps that write to Google use [`DEVELOPER` credential source](https://api.slack.com/automation/external-auth#developer-tokens), you need to initialize the OAuth2 flow and add it to a workflow step.

**Initialize the OAuth2 flow**

```zsh
slack external-auth add

? Select a provider  [Use arrows to move, type to filter]
> Provider Key: google
  Provider Name: Google
  Client ID: <your_id>.apps.googleusercontent.com
  Client Secret Exists? Yes
  Token Exists? Yes

```

**Include OAuth2 input in a workflow step**
```zsh
slack external-auth select-auth
? Select a team <team_name> <team_id>
? Choose an app environment Local <app_id>
? Select a workflow Workflow: #/workflows/submit_expense
  Providers:
        Key: google, Name: Google, Selected Account: None

? Select a provider Key: google, Name: Google, Selected Account: None
? Select an external account Account: <your_id>@gmail.com, Last Updated: 2024-08-06

✨  Workflow #/workflows/submit_expense will use developer account <your_id>@gmail.com when making calls to google APIs

```

## Creating Triggers

[Triggers](https://api.slack.com/automation/triggers) are what cause workflows
to run. These triggers can be invoked by a user, or automatically as a response
to an event within Slack.

When you `run` or `deploy` your project for the first time, the CLI will prompt
you to create a trigger if one is found in the `triggers/` directory. For any
subsequent triggers added to the application, each must be
[manually added using the `trigger create` command](#manual-trigger-creation).

When creating triggers, you must select the workspace and environment that you'd
like to create the trigger in. Each workspace can have a local development
version (denoted by `(local)`), as well as a deployed version. _Triggers created
in a local environment will only be available to use when running the
application locally._

### Link Triggers

A [link trigger](https://api.slack.com/automation/triggers/link) is a type of
trigger that generates a **Shortcut URL** which, when posted in a channel or
added as a bookmark, becomes a link. When clicked, the link trigger will run the
associated workflow.

Link triggers are _unique to each installed version of your app_. This means
that Shortcut URLs will be different across each workspace, as well as between
[locally run](#running-your-project-locally) and
[deployed apps](#deploying-your-app).

With link triggers, after selecting a workspace and environment, the output
provided will include a Shortcut URL. Copy and paste this URL into a channel as
a message, or add it as a bookmark in a channel of the workspace you selected.
Interacting with this link will run the associated workflow.

**Note: triggers won't run the workflow unless the app is either running locally
or deployed!**

### Manual Trigger Creation

To manually create triggers for logging runs and displaying stats for the whole
team, use the following commands:

```zsh
$ slack trigger create --trigger-def triggers/submit_expense.ts
```

## Deploying Your App

Once development is complete, deploy the app to Slack infrastructure using
`slack deploy`:

```zsh
$ slack deploy
```

When deploying for the first time, you'll be prompted to
[create a new link trigger](#creating-triggers) for the deployed version of your
app. When that trigger is invoked, the workflow should run just as it did when
developing locally (but without requiring your server to be running).

For deployed apps, you'll need to explicitly set your [deployed environment variables](https://api.slack.com/automation/environment-variables#deployed-env-vars).

Use the following command for each configured env variable in `.env`.

```zsh
slack env add GOOGLE_CLIENT_ID abc123...
```

You will need to run through the [auth steps](#configure-external-auth) once again for the deployed copy of your app.

## Viewing Activity Logs

Activity logs of your application can be viewed live and as they occur with the
following command:

```zsh
$ slack activity --tail
```

## Project Structure

### `.slack/`

Contains `apps.dev.json` and `apps.json`, which include installation details for
development and deployed apps.

### `datastores/`

[Datastores](https://api.slack.com/automation/datastores) securely store data
for your application on Slack infrastructure. Required scopes to use datastores
include `datastore:write` and `datastore:read`.

### `functions/`

[Functions](https://api.slack.com/automation/functions) are reusable building
blocks of automation that accept inputs, perform calculations, and provide
outputs. Functions can be used independently or as steps in workflows.

### `triggers/`

[Triggers](https://api.slack.com/automation/triggers) determine when workflows
are run. A trigger file describes the scenario in which a workflow should be
run, such as a user pressing a button or when a specific event occurs.

### `workflows/`

A [workflow](https://api.slack.com/automation/workflows) is a set of steps
(functions) that are executed in order.

Workflows can be configured to run without user input or they can collect input
by beginning with a [form](https://api.slack.com/automation/forms) before
continuing to the next step.

### `manifest.ts`

The [app manifest](https://api.slack.com/automation/manifest) contains the app's
configuration. This file defines attributes like app name and description.

### `slack.json`

Used by the CLI to interact with the project's SDK dependencies. It contains
script hooks that are executed by the CLI and implemented by the SDK.

## Resources

To learn more about developing automations on Slack, visit the following:

- [Automation Overview](https://api.slack.com/automation)
- [CLI Quick Reference](https://api.slack.com/automation/cli/quick-reference)
- [Samples and Templates](https://api.slack.com/automation/samples)
