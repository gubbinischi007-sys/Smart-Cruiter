# Local HTTPS (development)

This project can optionally serve the frontend over HTTPS in development by using locally-trusted certificates generated with `mkcert`.

## Steps (macOS)

1. Install mkcert (if you don't have it):

   brew install mkcert
   mkcert -install

2. Generate certs (from the `client` directory):

   npm run mkcert

   This will create `client/certs/localhost.pem` and `client/certs/localhost-key.pem`.

3. Start the client dev server:

   npm run dev

   If the certs exist, Vite will serve HTTPS at `https://localhost:3000`.

4. Notes

- If the certs are not present, the dev server will continue to serve plain HTTP on port 3000. No code changes are required to switch between HTTP and HTTPS.
- The mkcert script is a helper only; generating and trusting the cert is done on your machine. This repository does not include the certs.
