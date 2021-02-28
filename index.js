import BaseModule from "./structures/BaseModule.js";

export default class Admin extends BaseModule {
  /**
   * @param {Main} main
   */
  constructor(main) {
    super(main);

    this.register(Admin, {
      name: "admin",
    });
  }

  init() {
    this.modules.commandRegistrar.registerCommands('admin', import.meta.url);

    return true;
  }
}
