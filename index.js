const express = require("express");
const { google } = require("googleapis");
const { OAuth2Client } = require("google-auth-library");
const base64url = require("base64url");
const app = express();
const port = 3000;

// configuration
const clientID =
	"105791003120-djtvp4v8qpt551gtv07733peu0l0oqs2.apps.googleusercontent.com"; // secret and client id from the cloud console.
const clientSecret = "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";
const redirectURL = "http://localhost:3000/oauthcallback";
const oAuth2Client = new OAuth2Client(clientID, clientSecret, redirectURL);
const authURL = oAuth2Client.generateAuthUrl({
	access_type: "offline",
	scope: [
		"https://www.googleapis.com/auth/gmail.readonly",
		"https://www.googleapis.com/auth/gmail.send",
	],
});

app.get("/login", (req, res) => {
	res.redirect(authURL);
});

app.get("/oauthcallback", async (req, res) => {
	const code = req.query.code;
	const { tokens } = await oAuth2Client.getToken(code);
	oAuth2Client.setCredentials(tokens);


	const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

	const listResponse = await gmail.users.messages.list({ userId: "me" });
	const messages = listResponse.data.messages;

	res.send("Latest emails");
	console.log(messages);

	const threadIdsWithNoReplies = new Set(); // chose set to distinguish between unique values for no replications.

	for (const message of messages) {
		const threadId = message.threadId;
		const threadResponse = await gmail.users.threads.get({
			userId: "me",
			id: threadId,
		});
		const thread = threadResponse.data;

		// here we are checking if existing threads has no previous replies
		const hasNoReplies = thread.messages.every(
			(msg) => !msg.labelIds.includes("SENT")
		);

		if (hasNoReplies) {
			threadIdsWithNoReplies.add(threadId);
			console.log(threadIdsWithNoReplies);
		}
	}
});

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
