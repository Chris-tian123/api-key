import app from './server.js';

export default {
  async fetch(request, env, ctx) {
    // This is a simplified adapter. It might not handle all edge cases.
    const url = new URL(request.url);
    const { pathname, search } = url;
    const newRequest = new Request(url, request);

    return new Promise((resolve) => {
      const res = {
        status: (code) => {
          res.statusCode = code;
          return res;
        },
        send: (body) => {
          resolve(new Response(body, { status: res.statusCode }));
        },
        json: (body) => {
          resolve(new Response(JSON.stringify(body), {
            status: res.statusCode,
            headers: { 'Content-Type': 'application/json' },
          }));
        },
      };

      app({
        method: newRequest.method,
        url: pathname + search,
        headers: Object.fromEntries(newRequest.headers.entries()),
        body: newRequest.body,
      }, res);
    });
  },
};
