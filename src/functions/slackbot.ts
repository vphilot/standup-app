import { App, ExpressReceiver, Option, ReceiverEvent } from "@slack/bolt";
import { APIGatewayEvent, Context } from "aws-lambda";
import * as dotenv from "dotenv";
import { IHandlerResponse, ISlackPrivateReply, ISlackReactionReply, ISlackReply, SlashCommands } from "../constants";
import {
  generateReceiverEvent,
  isUrlVerificationRequest,
  parseRequestBody,
  replyMessage,
  replyPrivateMessage,
  replyReaction } from "../utils";

dotenv.config();

const expressReceiver: ExpressReceiver = new ExpressReceiver({
  signingSecret: `${process.env.SLACK_SIGNING_SECRET}`,
  processBeforeResponse: true
});

const app: App = new App({
  signingSecret: `${process.env.SLACK_SIGNING_SECRET}`,
  token: `${process.env.SLACK_BOT_TOKEN}`,
  receiver: expressReceiver
});

// Listen for a slash command invocation
app.command('/standup', async ({ ack, payload, context }) => {
  try {
    await ack();

    const users = ['Filippo', 'Vini', 'Paul', 'Chris', 'Reinier', 'Zak']
    const random = users.sort((a, b) => 0.5 - Math.random());

    const blocks = random.map((user, index) => ({
						"text": {
							"type": "mrkdwn",
							"text": `${user}`
						},
						"value": `value-${index}`
    }))

      const result = await app.client.chat.postMessage({
      token: context.botToken,
      // Channel to send message to
      channel: payload.channel_id,
      // Include a button in the message (or whatever blocks you want!)
      blocks: [
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "⚡ Today's standup"
			},
			"accessory": {
				"type": "checkboxes",
				"options": blocks as Option[],
				"action_id": "checkboxes-action"
			}
		}
	],
      // Text in the notification
      text: 'Message from Standup App by the amazing Vini'
    });
    console.log(result);
  }
  catch (error) {
    console.error(error);
  }
});



export async function handler(event: APIGatewayEvent, context: Context): Promise<IHandlerResponse> {
  const payload: any = parseRequestBody(event.body, event.headers["content-type"]);

  if(isUrlVerificationRequest(payload)) {
    return {
      statusCode: 200,
      body: payload?.challenge
    };
  }

  const slackEvent: ReceiverEvent = generateReceiverEvent(payload);
  await app.processEvent(slackEvent);

  return {
    statusCode: 200,
    body: ""
  };
}
