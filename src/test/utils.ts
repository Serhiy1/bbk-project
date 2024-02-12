import { faker } from "@faker-js/faker";

import { UserTokenInfo } from "../app/models/database/user";

export class Person {
  userName: string;
  email: string;
  password: string;
  token: string;
  token_info?: UserTokenInfo;

  constructor() {
    this.userName = faker.internet.userName();
    this.email = faker.internet.email().toLowerCase();
    this.password = faker.internet.password({ length: 12, prefix: "@1T_" });
    this.token = "";
    this.token_info;
  }
}
