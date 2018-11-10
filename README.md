# VotaBot

A discord bot to create interactive simple polls easily.

## Use the bot

To use this bot type `!poll help` to see the commands availables. Be aware that **only** administrators or users with
a role named "Poll Creator" can interact with the bot. The "Poll Creator" role has to be created manually and does not
need any permisssion.

## Host the bot

To host it create a file name "botconfig.json" in the bot's folder. Then write this into the file modifying the token
and, if wanted, the prefix and the invite link (wich is currently not public, I cannot afford a hosting).

```json
{
	"token":"your token",
	"prefix":"!poll",
	"link": "not available yet"
}
```

Then in a command line in the bot's folder use `npm install`.

Now every time you want to start the bot use `node index.js`.