#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const meow = require("meow");
const generateUseCaseMap = require("../lib/almin-usecase-map-generator").generateUseCaseMap;
const cli = meow(`
	Usage
	  $ almin-usecase-map-generator "[glob*]"

    Options
      --output  output path
	  --format  "nomnoml" | "svg" (default: "svg")

	Examples
	  $ almin-usecase-map-generator "src/use-case/**/*.js"
`);
try {
    const result = generateUseCaseMap({
        includes: cli.input,
        defaultActor: "AppUser",
        actors: ["AppUser", "System"],
        format: cli.flags.format || "svg"
    });
    if (cli.flags.output && result) {
        fs.writeFileSync(path.resolve(process.cwd(), cli.flags.output), result, "utf-8");
    } else {
        console.log(result);
    }
} catch (error) {
    console.error(error.message, error.stack);
}
