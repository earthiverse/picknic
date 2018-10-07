import Express = require("express");

export abstract class Module {
  constructor(protected app: Express.Application) {
    this.addRoutes(app);
  }

  public abstract addRoutes(app: Express.Application): void;
}
