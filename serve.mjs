#!/usr/bin/env node

import path from "path";
import fs from "fs";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import colors from 'colors';
import express from "express";
import http from "http";
import cookieParser from 'cookie-parser';
import proxy from 'express-http-proxy';

const log = console.log;

const moduleURL = new URL(import.meta.url);
const rootPath = path.resolve(path.dirname(moduleURL.pathname) + "/../");
const scriptName = path.basename(moduleURL.pathname);

const argv = yargs(hideBin(process.argv)).argv;
const babelProxy = argv.babel ? argv.babel : 'babel.hathitrust.org';
const catalogProxy = argv.catalog ? argv.catalog : 'catalog.hathitrust.org';

const proxyOptions = {
  https: true,
  proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
    return proxyReqOpts;
  },
  proxyReqPathResolver: function (req) {
    if (argv.vebose) { console.log("-- >> ", req.originalUrl); }
    return req.originalUrl;
  },
  userResHeaderDecorator: function (headers, userReq, userRes, proxyReq, proxyRes) {
    if (headers.location && headers.location.indexOf('https://') > -1) {
      let href = headers.location;
      href = href.replace(`https://${babelProxy}/`, '/').replace(`https://${catalogProxy}/` '/');
      headers.location = href;
    }
    if (headers['set-cookie']) {
      for (var i = 0; i < headers['set-cookie'].length; i++) {
        let cookie = headers['set-cookie'][i];
        headers['set-cookie'][i] = cookie.replace('=.hathitrust.org', '=localhost');
      }
    }
    return headers;
  }
};

function start() {
  let addr = "0.0.0.0";
  let port = 5555;
  listen({ address: addr, port: port });
}

function allowCrossDomain(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
}

function listen(options) {
  const app = express();
  app.use(cookieParser());

  // const unicornStaticServer = serveStatic(path.join(rootPath, 'common/web/unicorn'));
  // const alicornStaticServer = serveStatic(path.join(rootPath, 'common/web/alicorn'));

  const server = http.createServer(app);
  app.use(allowCrossDomain);
  server.listen(options.port, options.address);

  app.use('/common/unicorn', express.static(path.join(rootPath, 'common/web/unicorn')));
  app.use('/common/alicorn', express.static(path.join(rootPath, 'common/web/alicorn')));
  app.use('/common/mdp', express.static(path.join(rootPath, 'common/web/mdp')));

  app.use(/\/Search|\/Record/, proxy(`https://${catalogProxy}/`, proxyOptions));

  app.use('/cgi', proxy(`https://${babelProxy}/`, proxyOptions));

  app.use(['/pt', '/mb', '/ls', '/ping'], proxy(`https://${babelProxy}/`, {
    https: true,
    proxyReqPathResolver: function (req) {
      if ( argv.verbose ) { console.log("-- :: ", req.originalUrl); }
      return req.originalUrl;
    }
  }));

  app.get("/favicon.ico", function (req, res) {
    const favicon = new Buffer.from(
      "AAABAAEAEBAQAAAAAAAoAQAAFgAAACgAAAAQAAAAIAAAAAEABAAAAAAAgAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAA/4QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEREQAAAAAAEAAAEAAAAAEAAAABAAAAEAAAAAAQAAAQAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAEAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAP//AAD8HwAA++8AAPf3AADv+wAA7/sAAP//AAD//wAA+98AAP//AAD//wAA//8AAP//AAD//wAA",
      "base64"
    );
    res.setHeader("Content-Length", favicon.length);
    res.setHeader("Content-Type", "image/x-icon");
    res.end(favicon);
  });

  log(
    "Starting up Server, serving ".yellow +
    scriptName.green +
    " on port: ".yellow +
    `${options.address}:${options.port}`.cyan
  );
  log("Hit CTRL-C to stop the server");
}

app.use(/.*/, proxy(`https://www.hathitrust.org/`, proxyOptions);

process.on("SIGINT", function () {
  log("Server stopped.".red);
  process.exit();
});

start();
