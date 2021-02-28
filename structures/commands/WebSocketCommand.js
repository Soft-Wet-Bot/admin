import BaseCommand from '../../../../structures/commands/BaseCommand.js'

export default class WebSocketCommand extends BaseCommand {
    constructor(...args) {
        super(...args);
    }

    get connected() {
        return this.ws.connected;
    }

    get ws() {
        return this.modules.ws;
    }
}