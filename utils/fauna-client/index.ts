
import { Client, fql } from "fauna";

export type Pagination = {
  cursor?: number;
  size?: number;
};

export const severClient = new Client({
  secret: process.env.FAUNA_SECRET,
  endpoint: new URL(process.env.FAUNA_ENDPOINT ?? "http://localhost:8443"),
});

export * from "./agents";
export * from "./collections";
export * from "./tasks";
