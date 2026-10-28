export declare function matchesPath(pattern: string, filePath: string): boolean;
export declare function foreignPaths(
  proto: 'concept' | 'current',
  files: string[],
  config?: Record<'concept' | 'current', string[]>
): string[];
