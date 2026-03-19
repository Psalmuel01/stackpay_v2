export async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const body = Buffer.concat(chunks).toString("utf8");
  return JSON.parse(body);
}

export function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload, null, 2));
}

export function sendError(response, statusCode, error, message, details) {
  sendJson(response, statusCode, {
    error,
    message,
    ...(details ? { details } : {}),
  });
}

export function sendMethodNotAllowed(response, method, path) {
  sendError(
    response,
    405,
    "method_not_allowed",
    `${method} is not allowed for ${path}`
  );
}

export function sendNotFound(response, path) {
  sendError(response, 404, "not_found", `No route is registered for ${path}`);
}
