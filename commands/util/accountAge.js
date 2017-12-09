const {
    Command
} = require("discord.js-commando");

module.exports = class AccountAge extends Command {
    constructor(client) {
        super(client, {
            name: "account-age",
            group: "util",
            memberName: "account-age",
            description: "Check when your account was created",
            aliases: ["age", "account-created"],
            examples: ["account-age"]
        });
    }

    run(msg) {
        return msg.reply(`\`${msg.author.createdAt}\``);
    }
};