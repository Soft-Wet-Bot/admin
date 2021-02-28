import WebSocketCommand from '../structures/commands/WebSocketCommand.js'

export default class Reload extends WebSocketCommand {
    /**
     * @param {string} category
     * @param {Array<*>} args
     */
    constructor(category, ...args) {
        super(...args);

        this.register(Reload, {
            category: category,
            hidden: true,

            name: 'reload',
            aliases: [],
            description: 'Reload commands.',
            usage: 'reload [target]',
            params: [
                {
                    name: 'target',
                    description: 'The specific part that should be.',
                    type: 'string',
                    default: 'Full reload of all modules and commands.'
                }
            ],
            system_permission: {
                level: 3,
                condition: '>='
            },
            example: ''
        });
    }

    /**
     * @param {string} command string representing what triggered the command
     */
    async run(command) {
        const reloadLevel = this.args[0];

        const response = await this.ws.sendEvent('RELOAD', 'GROUP', 'self', { target: reloadLevel ? reloadLevel : 'full' }, true, 3e3);

        if (!response.timeout && response.length === this._m.shard.count) {
            this.send('The reload has been executed successfully!');

            return true;
        }
        this.send(`**${response.length}** of the **${this._m.shard.count}** Shards responded with the remaining shards timing out. If retrying doesn't solve the issue, please check if all Shards still are alive.`);

        return true;
    }
}
