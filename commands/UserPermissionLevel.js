import WebSocketCommand from '../structures/commands/WebSocketCommand.js'
import Util from '../../../util/Util.js'

export default class UserPermissionLevel extends WebSocketCommand {
    /**
     * @param {string} category
     * @param {Array<*>} args
     */
    constructor(category, ...args) {
        super(...args);

        this.register(UserPermissionLevel, {
            category: category,
            hidden: true,

            name: 'user permission level',
            aliases: [],
            description: 'Change the system permission level of a user.',
            usage: 'ban user <@ user> [permission_level]',
            params: [
                {
                    name: 'user',
                    description: 'The user to be modified.',
                    type: 'user',
                    required: true
                },
                {
                    name: 'permission_level',
                    description: 'The new permission level for the user.',
                    type: 'int',
                    required: true
                }
            ],
            system_permission: {
                level: 2,
                condition: '>='
            },
            example: ''
        });
    }

    /**
     * @param {string} command string representing what triggered the command
     */
    async run(command) {
        const level = this.args[1];
        let userId = this.args[0];

        if (isNaN(this.args[0])) {
            const mention = this.msgObj.mentions.users.last();
            if (!mention) {
                this.send('Invalid mention.');

                return true;
            }

            userId = mention.id;
        }

        if (!level || isNaN(level)) {
            this.send('Invalid level given, please give a number.');

            return true;
        }

        const curUser = this.users.get(this.user);
        if (!await curUser.hasPermission(level, '>')) {
            this.send('A higher level of permission was passed as an argument, you can only give a level lower than yours.');

            return true;
        }

        if (!this._m.users.cache.has(userId) && !await this._m.users.fetch(userId)) {
            this.send('Unknown user id, I may not share a server with this user.');

            return true;
        }

        const user = this.users.get(userId);
        let result = { timeout: true };

        for (let i = 0; result.timeout && i < 5; i++) {
            result = await this.ws.sendEvent('USER_UPDATE', 'GROUP', 'self', {
                id: userId,
                props: {
                    permissionLevel: level
                }
            }, true, 2e3);

            if (result.timeout) {
                const msg = this.send('The request timed out, retrying in 5 seconds.');
                await Util.delay(5e3);
                msg.then(msg => msg.delete());
            }
        }

        if (result.timeout) {
            this.send(`Some Shards timed out while modifying the user permission level. Only ${result.length} of ${this._m.shard.count} answered.`);
        }

        if (await user.options.setPermissionLevel(level)) {
            this.send(`The user's permission level has been modified.`);
        }

        return true;
    }
}
