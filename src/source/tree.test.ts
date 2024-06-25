import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { SourceTree, SourceTreeEntry } from './tree';

describe('source tree', () => {
  function getTempDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'source-tree-test-'));
  }

  it('should dump one source tree entry to a given directory', () => {
    const dir = getTempDir();
    const entry = new SourceTreeEntry('foo', 'contract Foo {}');
    entry.dump(dir);
    expect(fs.readFileSync(path.join(dir, 'foo.sol'), 'utf8')).toBe(
      'contract Foo {}',
    );
  });

  it('should dump one source tree entry with leading slash to a given directory', () => {
    const dir = getTempDir();
    const entry = new SourceTreeEntry('/foo', 'contract Foo {}');
    entry.dump(dir);
    expect(fs.readFileSync(path.join(dir, 'foo.sol'), 'utf8')).toBe(
      'contract Foo {}',
    );
  });

  it('should dump one source tree entry without .sol extension to a given directory', () => {
    const dir = getTempDir();
    const entry = new SourceTreeEntry('foo', 'contract Foo {}');
    entry.dump(dir);
    expect(fs.readFileSync(path.join(dir, 'foo.sol'), 'utf8')).toBe(
      'contract Foo {}',
    );
  });

  it('should dump a source tree to a given directory', () => {
    const dir = getTempDir();
    const tree = new SourceTree(
      new SourceTreeEntry('foo', 'contract Foo {}'),
      new SourceTreeEntry('/Bar/bar', 'contract Bar {}'),
    );
    tree.dump(dir);
    expect(fs.readFileSync(path.join(dir, 'foo.sol'), 'utf8')).toBe(
      'contract Foo {}',
    );
    expect(fs.readFileSync(path.join(dir, 'Bar', 'bar.sol'), 'utf8')).toBe(
      'contract Bar {}',
    );
  });
});
