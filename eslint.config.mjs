// @ts-check

import { includeIgnoreFile } from "@eslint/compat";
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const gitignorePath = path.resolve(__dirname, ".gitignore");

export default
  tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    includeIgnoreFile(gitignorePath),
    {
      ignores: ["dist/**/*"],
    }
  );
