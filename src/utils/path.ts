export function basename(path: string): string {
  return path.split("/").pop() ?? path;
}

export function stripExtension(filename: string): string {
  const index = filename.lastIndexOf(".");
  return index === -1 ? filename : filename.slice(0, index);
}

export function dirname(path: string): string {
  const index = path.lastIndexOf("/");
  return index === -1 ? "" : path.slice(0, index);
}

export function joinVaultPath(directory: string, filename: string): string {
  return directory ? `${directory}/${filename}` : filename;
}

