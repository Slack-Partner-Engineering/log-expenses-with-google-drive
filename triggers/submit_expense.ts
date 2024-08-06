import { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import SubmitExpenseWorkflow from "../workflows/submit_expense.ts";

/**
 * Triggers determine when workflows are executed. A trigger
 * file describes a scenario in which a workflow should be run,
 * such as a user pressing a button or when a specific event occurs.
 * https://api.slack.com/automation/triggers
 */
const submitExpenseLinkTrigger: Trigger<
  typeof SubmitExpenseWorkflow.definition
> = {
  type: TriggerTypes.Shortcut,
  name: "Submit an expense",
  description: "Log an expense and upload the receipt",
  workflow: "#/workflows/submit_expense",
  inputs: {
    interactivity: {
      value: TriggerContextData.Shortcut.interactivity,
    },
    timestamp: {
      value: "{{event_timestamp}}",
    },
    user_id: {
      value: TriggerContextData.Shortcut.user_id,
    },
  },
};

export default submitExpenseLinkTrigger;
