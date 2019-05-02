/*
Copyright 2019 Jonah Snider

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const KeenTracking = require("keen-tracking");
const config = require("../config");

const keenClient = new KeenTracking({
  projectId: config.keen.projectID,
  writeKey: config.keen.writeKey
});

module.exports = async (cmd, promise, msg, args) => {
  const { client } = msg;
  const database = require("../util/database");
  const logger = require("../util/logger").scope(`shard ${client.shard.id}`);

  client.stats.increment("bot.commands.run");
  const commandLogger = logger.scope(`shard ${client.shard.id}`, "command");
  const userBalance = await database.balances.get(msg.author.id);
  const houseBalance = await database.balances.get(client.user.id);

  const logOptions = {
    prefix: `${msg.author.tag} (${msg.author.id}) ${cmd.group.id}:${cmd.memberName}`,
    message: args || null
  };

  keenClient.recordEvent("commands", {
    author: {
      id: msg.author.id,
      tag: msg.author.tag
    },
    timestamp: msg.createdAt,
    message: msg.content,
    args,
    command: { group: { name: cmd.group.name }, name: cmd.name },

    userBalance,
    houseBalance
  });

  commandLogger.command(logOptions);
};
