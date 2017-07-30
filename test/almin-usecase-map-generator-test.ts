// MIT © 2017 azu
import { generateUseCaseMap } from "../src/almin-usecase-map-generator";
import * as assert from "assert";

describe("almin-usecase-map-generator", () => {
    it("should throw error when no match the files", () => {
        assert.throws(() => {
            generateUseCaseMap({
                defaultActor: "AppUser",
                actors: ["AppUser", "System"],
                includes: [__dirname + "/not-found-files/use-case/**/*.ts"],
                format: "nomnoml"
            })
        });
    });
    it("should output nomnoml", () => {
        const output = generateUseCaseMap({
            defaultActor: "AppUser",
            actors: ["AppUser", "System"],
            includes: [__dirname + "/fixtures/use-case/**/*.ts"],
            format: "nomnoml"
        });
        assert.strictEqual(output, `#direction: right
#spacing: 50
#padding: 20
[group-a|
[<actor> AppUser] -> [<usecase> A]
[<actor> AppUser] -> [<usecase> B]
]

[group-b|
[<actor> AppUser] -> [<usecase> C]
[<usecase> C] -> [<usecase> D]
[<actor> AppUser] -> [<usecase> D]
]
`);
    });
});