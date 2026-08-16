import type { RequestHandler } from "express";
import { randomUUID } from "node:crypto";
import { REQUEST_ID_HEADER } from "../../config/constants.js";

export const requestIdMiddleware: RequestHandler = (req, _res, next) => {
  const incoming = req.headers[REQUEST_ID_HEADER.toLowerCase()];
  const incomingValue = Array.isArray(incoming) ? incoming[0] : incoming;

  req.requestId = incomingValue && incomingValue.length <= 128 ? incomingValue : randomUUID();
  _res.setHeader(REQUEST_ID_HEADER, req.requestId);

  next();
};