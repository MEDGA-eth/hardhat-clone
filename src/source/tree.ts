import path from 'node:path';
import fs from 'node:fs';

/**
 * A source tree entry represents a file in the source tree.
 */
export class SourceTreeEntry {
  /**
   * The original source name
   */
  sourceName: string;

  /**
   * The sanitized path of the entry.
   */
  path: string;

  /**
   * The content of the entry.
   */
  content: string;

  /**
   * We may do some sanitization on the path, such as removing leading slashes.
   * This remappings record the original path to the sanitized path.
   */
  remappings: Record<string, string>;

  constructor(sourceName: string, content: string) {
    this.sourceName = sourceName;
    this.content = content;
    this.remappings = {};
    let path: string = sourceName;
    // sanitize path
    // 1. remove leading slash, making it relative
    if (path.startsWith('/')) {
      const rel_path = path.slice(1);
      this.remappings[path] = rel_path;
      path = rel_path;
    }
    // 2. if there is not .sol extension, add it
    if (!path.endsWith('.sol')) {
      const sol_path = path + '.sol';
      this.remappings[path] = sol_path;
      path = sol_path;
    }
    // 3. remap the prefix until "node_modules" to "node-modules"
    let idx = path.lastIndexOf('node_modules/');
    if (idx >= 0) {
      idx += 13;
      const from_prefix = path.substring(0, idx);
      const to_prefix = from_prefix.replace('node_modules/', 'node-modules/');
      this.remappings[from_prefix] = to_prefix;
      path = path.replace(from_prefix, to_prefix);
    }

    this.path = path;
  }

  /**
   * Dump the content of the entry inside a given directory.
   * The directory should have already been created.
   */
  dump(dir: string) {
    // 1. create directories if not exist
    const file = path.join(dir, this.path);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    // 2. write content to file
    fs.writeFileSync(file, this.content);
  }
}

/**
 * A source tree represents a collection of source tree entries.
 */
export class SourceTree {
  entries: SourceTreeEntry[];

  constructor(...entries: SourceTreeEntry[]) {
    this.entries = entries;
  }

  /**
   * All files (original source name => actual path)
   */
  get allFiles(): Record<string, string> {
    const relocations: Record<string, string> = {};
    for (const entry of this.entries) {
      relocations[entry.sourceName] = entry.path;
    }
    return relocations;
  }

  get remappings(): Record<string, string> {
    const remappings = {};
    for (const entry of this.entries) {
      Object.assign(remappings, entry.remappings);
    }
    return remappings;
  }

  /**
   * Dump the source tree to a given directory.
   * If the directory does not exist, it will be created.
   * If the file already exists, it will be overridden.
   */
  dump(dir: string) {
    // create dir if not exist
    fs.existsSync(dir) || fs.mkdirSync(dir, { recursive: true });
    // dump each entry
    for (const entry of this.entries) {
      console.debug(`Dumping ${entry.path} to ${dir}`);
      entry.dump(dir);
    }
  }

  /**
   * Check if the dump operation will override existing files.
   * @param dir The directory to dump the source tree.
   * @returns A list of paths that will be overridden.
   */
  check_dump_override(dir: string): string[] {
    const overrides: string[] = [];
    if (fs.existsSync(dir)) {
      for (const entry of this.entries) {
        if (fs.existsSync(path.join(dir, entry.path))) {
          overrides.push(path.join(dir, entry.path));
        }
      }
    }
    return overrides;
  }
}
