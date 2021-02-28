import WebSocketCommand from '../structures/commands/WebSocketCommand.js'
import Util from '../../../util/Util.js'

export default class BanUser extends WebSocketCommand {
    /**
     * @param {string} category
     * @param {Array<*>} args
     */
    constructor(category, ...args) {
        super(...args);

        this.register(BanUser, {
            category: category,
            hidden: true,

            name: 'ban user',
            aliases: [
                'banuser'
            ],
            description: 'Ban a user from using the bot',
            usage: 'ban user <@ user> [reason]',
            params: [
                {
                    name: 'user',
                    description: 'The user to be banned.',
                    type: 'user',
                    required: true
                },
                {
                    name: 'reason',
                    description: 'The reason why a user was banned.',
                    type: 'string',
                    default: null,
                    is_sentence: true
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
        const reason = !this.args[1] ? null : this.args[1].join(' ');
        let userId = this.args[0];

        if (isNaN(this.args[0])) {
            const mention = this.msgObj.mentions.users.last();
            if (!mention) {
                this.send('Invalid mention.');

                return true;
            }

            userId = mention.id;
        }

        if (!this._m.users.cache.has(userId) && !await this._m.users.fetch(userId)) {
            this.send('Unknown user id, I may not share a server with this user.');

            return true;
        }

        const user = this.users.get(userId);
        if (await user.isBanned()) {
            this.send('The user is already banned!');

            return true;
        }

        let result = { timeout: true };

        for (let i = 0; result.timeout && i < 5; i++) {
            result = await this.ws.sendEvent('USER_UPDATE', 'GROUP', 'self', {
                id: userId,
                props: {
                    banned: true
                }
            }, true, 2e3);

            if (result.timeout) {
                const msg = this.send('The request timed out, retrying in 5 seconds.');
                await Util.delay(5e3);
                msg.then(msg => msg.delete());
            }
        }

        if (result.timeout) {
            this.send(`Some Shards timed out while banning the user, the user might not have been banned on some Shards. Only ${result.length} of ${this._m.shard.count} answered.`);
        }

        const [success, banIdOrReason, internalId] = await user.options.ban(this.user.id, reason);

        if (success) {
            const embed = new this.Discord.MessageEmbed()
                .setTitle('Ban has been issued')
                .setDescription('Don\'t ban without a valid reason.')
                .addField('Discord ID', userId)
                .addField('Ban ID', banIdOrReason)
                .addField('User Internal ID', internalId);

            this.send(embed);

            return true;
        }

        this.send(banIdOrReason);

        return true;
    }
}
