import { Collection } from "fireorm";

@Collection("users")
export class User {
  id!: string;
  name!: string;
  email!: string;
  createdAt!: string;
  lastLogin!: string;
}
