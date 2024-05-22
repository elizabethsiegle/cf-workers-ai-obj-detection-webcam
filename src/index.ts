import { Hono } from "hono";

import { Page } from "./webpage";

import * from "./worker";

const app = new Hono<{
}>();

app.get("/", (c) => {
  return c.html(Page);
});


export default app
