#!/usr/bin/env node
import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  generate,
  generatorDefinitions,
  type GeneratorKind,
  type GeneratorOptions,
} from "./generators.js";

export type CliIO = {
  cwd?: string;
  stderr?: (message: string) => void;
  stdout?: (message: string) => void;
};

type ParsedGenerateArgs = GeneratorOptions & {
  kind?: string;
  list?: boolean;
  name?: string;
};

const generatorKinds = new Set(generatorDefinitions.map((item) => item.kind));

export async function runCli(args: string[], io: CliIO = {}): Promise<number> {
  const stdout = io.stdout ?? ((message) => process.stdout.write(message));
  const stderr = io.stderr ?? ((message) => process.stderr.write(message));

  try {
    const [command, ...rest] = args;

    if (
      !command ||
      command === "help" ||
      command === "--help" ||
      command === "-h"
    ) {
      stdout(await rootHelp());
      return 0;
    }

    if (command === "--version" || command === "-v" || command === "version") {
      stdout(`${await readVersion()}\n`);
      return 0;
    }

    if (command === "generators" || command === "generator") {
      stdout(generatorsHelp());
      return 0;
    }

    if (command === "generate" || command === "g") {
      const parsed = parseGenerateArgs(rest);

      if (parsed.list) {
        stdout(generatorsHelp());
        return 0;
      }

      if (!parsed.kind || parsed.kind === "--help" || parsed.kind === "-h") {
        stdout(generateHelp());
        return 0;
      }

      if (!isGeneratorKind(parsed.kind)) {
        stderr(`Unknown generator: ${parsed.kind}\n\n${generatorsHelp()}`);
        return 1;
      }

      if (!parsed.name) {
        stderr(
          `Missing name for ${parsed.kind} generator.\n\n${generateHelp()}`,
        );
        return 1;
      }

      const result = await generate(parsed.kind, parsed.name, {
        cwd: io.cwd,
        dir: parsed.dir,
        dryRun: parsed.dryRun,
        force: parsed.force,
      });

      for (const file of result) {
        stdout(`${file.action.padEnd(9)} ${file.path}\n`);
      }

      return 0;
    }

    stderr(`Unknown command: ${command}\n\n${await rootHelp()}`);
    return 1;
  } catch (error) {
    stderr(`${(error as Error).message}\n`);
    return 1;
  }
}

function parseGenerateArgs(args: string[]): ParsedGenerateArgs {
  const parsed: ParsedGenerateArgs = {};
  const positionals: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--force" || arg === "-f") {
      parsed.force = true;
      continue;
    }

    if (arg === "--dry-run") {
      parsed.dryRun = true;
      continue;
    }

    if (arg === "--list" || arg === "-l") {
      parsed.list = true;
      continue;
    }

    if (arg === "--dir") {
      parsed.dir = args[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith("--dir=")) {
      parsed.dir = arg.slice("--dir=".length);
      continue;
    }

    positionals.push(arg);
  }

  const [kind, name] = positionals;
  parsed.kind = kind;
  parsed.name = name;

  return parsed;
}

function isGeneratorKind(value: string): value is GeneratorKind {
  return generatorKinds.has(value as GeneratorKind);
}

async function rootHelp(): Promise<string> {
  return `ak ${await readVersion()} - AstryxKit CLI

Usage:
  ak generators
  ak generate <generator> <name> [--dir <path>] [--force] [--dry-run]
  ak g <generator> <name>

Commands:
  generators         List Rails-like generators for AstryxKit projects
  generate, g        Generate shell, app, command, preference, Worker, or D1 files
  version            Print the package version

Run \`ak generate --list\` to see available generators.
`;
}

function generateHelp(): string {
  return `Usage:
  ak generate <generator> <name> [options]
  ak g <generator> <name> [options]

Options:
  --dir <path>       Override the generator output directory
  --force, -f        Overwrite existing files
  --dry-run          Print files that would be written without writing them
  --list, -l         List available generators

Examples:
${generatorDefinitions.map((generator) => `  ${generator.example}`).join("\n")}
`;
}

function generatorsHelp(): string {
  const rows = generatorDefinitions.map((generator) => {
    const command = `ak g ${generator.kind} ${generator.nameFormat}`;
    return [
      command.padEnd(46),
      generator.defaultDir.padEnd(28),
      generator.description,
    ].join("  ");
  });

  return `AstryxKit generators

${rows.join("\n")}

These generators map to AstryxKit extension points: host shells, micro-app
manifests, command contributions, preference schemas, Worker routes, and D1
data access helpers.
`;
}

async function readVersion(): Promise<string> {
  const packageJsonPath = fileURLToPath(
    new URL("../../package.json", import.meta.url),
  );
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as {
    version?: string;
  };

  return packageJson.version ?? "0.0.0";
}

const entryPoint = process.argv[1]
  ? pathToFileURL(await realpath(path.resolve(process.argv[1]))).href
  : undefined;

if (entryPoint === import.meta.url) {
  const exitCode = await runCli(process.argv.slice(2));
  process.exitCode = exitCode;
}
