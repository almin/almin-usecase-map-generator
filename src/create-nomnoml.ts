import * as globby from "globby";
import * as path from "path";
import * as fs from "fs";
import groupBy = require("lodash.groupby");

const nomnoml = require("nomnoml");

interface NomnomlUseCase {
    actor: string;
    group: string;
    useCase: string;
    importedUseCases: string[];
}

export interface NomnomlGroup {
    name: string;
    useCases: {
        actor: string;
        useCase: string;
        importedUseCases: string[];
    }[];
}

/**
 * Create nomnoml text from a group
 * @param group a single group
 */
export const createNomnomlText = (group: NomnomlGroup): string => {
    const actorAnduseCase = group.useCases.map(useCase => {
        let base = `[<actor> ${useCase.actor}] -> [<usecase> ${useCase.useCase}]`;
        useCase.importedUseCases.forEach((importedUseCase: string) => {
            base += `\n[<usecase> ${useCase.useCase}] -> [<usecase> ${importedUseCase}]`;
        });
        return base;
    });
    return `[${group.name}|
${actorAnduseCase.join("\n")}
]
`;
};

export interface createNomnomlConfig {
    defaultActor: string;
    actors: string[];
    matchUseCase: (fileName: string) => boolean;
    createGroupName: (fileName: string) => string;
    createUseCaseName: (fileName: string) => string;
    includes: string[];
    nomnomlHeader: string;
    format: "nomnoml" | "svg" | "url";
}

export function createNomnoml(config: createNomnomlConfig) {
    const allUseCases = globby.sync(config.includes);
    const ActorList = config.actors;
    const DefaultActor = config.defaultActor;
    const header = config.nomnomlHeader;
    const matchUseCase = config.matchUseCase;
    const createGroupName = config.createGroupName;
    const createUseCaseName = config.createUseCaseName;
    const getImportedFiles = (content: string, filePath: string): string[] => {
        const lines = content.split("\n");
        const importLines = lines.filter(line => /from\s+['"][^'"]+['"]/.test(line));
        return importLines
            .map(line => {
                const match = line.match(/from\s+['"]([^'"]+)['"]/);
                if (match) {
                    const moduleName = match[1];
                    if (/^\./.test(moduleName)) {
                        // "./HogeUseCase"
                        return path.resolve(filePath, match[1]);
                    } else {
                        // from "almin"
                        return moduleName;
                    }
                }
                return "";
            })
            .filter(path => path.length > 0);
    };
    const createUseCase = (useCaseFile: string): NomnomlUseCase => {
        const group = createGroupName(useCaseFile);
        const useCaseName = createUseCaseName(useCaseFile);
        const actorDefined = ActorList.find(actor => {
            return useCaseName.indexOf(actor) !== -1;
        });
        const actor = actorDefined ? actorDefined : DefaultActor;
        const content = fs.readFileSync(useCaseFile, "utf-8");
        const list = getImportedFiles(content, useCaseFile);
        const importedUseCases = list
            .filter((filePath: string) => {
                return matchUseCase(filePath);
            })
            .map((filePath: string) => {
                return createUseCaseName(filePath);
            })
            .filter((dependencyUseCase: string) => {
                return dependencyUseCase !== useCaseName;
            });
        return {
            actor,
            group,
            useCase: useCaseName,
            importedUseCases
        };
    };

    const createGroup = (useCases: NomnomlUseCase[]): NomnomlGroup[] => {
        const groupByName = groupBy(useCases, (useCase: NomnomlUseCase) => useCase.group);
        const results: NomnomlGroup[] = [];
        Object.keys(groupByName).forEach(groupName => {
            results.push({
                name: groupName,
                useCases: groupByName[groupName]
            });
        });
        return results;
    };

    const useCases = allUseCases.map(useCaseFilePath => {
        return createUseCase(useCaseFilePath);
    });
    const groups = createGroup(useCases);
    const results = groups.map(group => {
        return createNomnomlText(group);
    });
    const result = `${header}
${results.join("\n")}`;
    // svg or nomnoml text
    if (config.format === "svg") {
        return nomnoml.renderSvg(result);
    } else if (config.format === "nomnoml") {
        return result;
    } else {
        return `http://www.nomnoml.com/#view/${encodeURIComponent(result)}`;
    }
}
