import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const FORBIDDEN_LEGACY_BLUE = ['#1E', '3A', '8A'].join('');

const collectSourceFiles = (directory: string): string[] => {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory).flatMap((entry) => {
    const fullPath = join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      return collectSourceFiles(fullPath);
    }

    return /\.(ts|tsx|js|jsx)$/.test(entry) ? [fullPath] : [];
  });
};

describe('transit visual identity guard', () => {
  it('no reintroduce el azul antiguo en codigo fuente', () => {
    const offenders = collectSourceFiles(join(process.cwd(), 'src')).filter((filePath) =>
      readFileSync(filePath, 'utf8').includes(FORBIDDEN_LEGACY_BLUE)
    );

    expect(offenders).toEqual([]);
  });
});
