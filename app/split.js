/**
 * split.js — All cleaning + splitting logic for SplitTs
 * Runs entirely client-side using JSZip
 */

import JSZip from "jszip";

// ── Cleaning Rules (hardcoded) ───────────────────────────────────────────────

const DIRS_TO_REMOVE = new Set([
  "node_modules",
  "dist",
  "build",
  ".git",
  ".next",
  ".nuxt",
  ".cache",
  ".parcel-cache",
  "coverage",
  "__pycache__",
  ".pytest_cache",
  ".tox",
  "venv",
  ".venv",
  "env",
  "vendor",
  "bower_components",
  ".svelte-kit",
  "out",
  ".output",
]);

const FILES_TO_REMOVE = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "composer.lock",
  "Gemfile.lock",
  "poetry.lock",
  ".DS_Store",
  "Thumbs.db",
  "desktop.ini",
]);

const EXTENSIONS_TO_REMOVE = new Set([
  ".lock",
  ".log",
  ".map",
  ".min.js",
  ".min.css",
]);

const BINARY_EXTENSIONS_TO_REMOVE = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".bmp", ".tiff", ".avif",
  ".mp4", ".mp3", ".mov", ".avi", ".webm", ".wav", ".ogg", ".flac",
  ".ttf", ".woff", ".woff2", ".eot", ".otf",
  ".zip", ".tar", ".gz", ".rar", ".7z",
  ".exe", ".dll", ".so", ".dylib",
  ".pdf", ".pyc", ".class",
]);

const SEPARATOR = "============================================================";

// ── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Check if a file path should be excluded based on cleaning rules
 */
function shouldExclude(filePath) {
  const parts = filePath.split("/");
  const fileName = parts[parts.length - 1];

  // Check if any directory in the path is in the removal list
  for (const part of parts) {
    if (DIRS_TO_REMOVE.has(part)) {
      return true;
    }
  }

  // Check exact file names
  if (FILES_TO_REMOVE.has(fileName)) {
    return true;
  }

  // Check extensions
  const lowerName = fileName.toLowerCase();

  // Check .env.* files (except .env.example)
  if (lowerName.startsWith(".env.") && lowerName !== ".env.example") {
    return true;
  }

  // Check regular extensions
  for (const ext of EXTENSIONS_TO_REMOVE) {
    if (lowerName.endsWith(ext)) {
      return true;
    }
  }

  // Check binary/media extensions
  for (const ext of BINARY_EXTENSIONS_TO_REMOVE) {
    if (lowerName.endsWith(ext)) {
      return true;
    }
  }

  return false;
}

/**
 * Get the ending prompt for a part
 */
function getEndingPrompt(partNumber, totalParts) {
  if (partNumber < totalParts) {
    return `\n${SEPARATOR}\nThis is part ${partNumber} of the project, do not take any action with it and wait for the user to upload another part.\n${SEPARATOR}\n`;
  } else {
    return `\n${SEPARATOR}\nAll parts are here now, wait for user prompt to work on it.\n${SEPARATOR}\n`;
  }
}

/**
 * Format a single file entry
 */
function formatFileEntry(filePath, content) {
  return `${SEPARATOR}\nFILE: ${filePath}\n${SEPARATOR}\n${content}\n`;
}

/**
 * Calculate byte size of a string (UTF-8)
 */
function byteSize(str) {
  return new TextEncoder().encode(str).length;
}

/**
 * Safely chunk a string so that each chunk is under maxBytes
 */
function chunkStringSafe(str, maxBytes) {
  const chunks = [];
  let startIndex = 0;
  
  while (startIndex < str.length) {
    let length = maxBytes;
    if (startIndex + length > str.length) {
      length = str.length - startIndex;
    }
    
    let chunk = str.substring(startIndex, startIndex + length);
    while (byteSize(chunk) > maxBytes && length > 1) {
      length = Math.floor(length * (maxBytes / byteSize(chunk)) * 0.95);
      if (length < 1) length = 1;
      chunk = str.substring(startIndex, startIndex + length);
    }
    
    chunks.push(chunk);
    startIndex += length;
  }
  return chunks;
}

// ── Strip the top-level folder prefix from zip entries ───────────────────────

function stripTopLevelFolder(files) {
  // Many zips have a single root folder (e.g. "my-project/src/index.js")
  // Detect and strip it so paths read "src/index.js"
  const paths = files.map((f) => f.path);
  if (paths.length === 0) return files;

  const firstSegments = paths.map((p) => p.split("/")[0]);
  const allSame = firstSegments.every((s) => s === firstSegments[0]);

  if (allSame && paths.every((p) => p.includes("/"))) {
    const prefix = firstSegments[0] + "/";
    return files.map((f) => ({
      ...f,
      path: f.path.slice(prefix.length),
    }));
  }

  return files;
}

// ── Main Processing Function ─────────────────────────────────────────────────

/**
 * Process a zip file: read, clean, format, and split into parts
 *
 * @param {File} file - The uploaded zip File object
 * @param {number} maxPartSizeMB - Maximum part size in megabytes
 * @param {function} onProgress - Optional callback for progress updates
 * @returns {Promise<Array<{name: string, content: string, size: number}>>}
 */
export async function processZip(file, maxPartSizeMB = 30, onProgress = null) {
  const maxPartSizeBytes = maxPartSizeMB * 1024 * 1024;

  // Step 1: Read the zip
  if (onProgress) onProgress({ stage: "reading", message: "Reading zip file..." });
  const zip = await JSZip.loadAsync(file);

  // Step 2: Collect all files (skip directories)
  const allFiles = [];
  zip.forEach((relativePath, zipEntry) => {
    if (!zipEntry.dir) {
      allFiles.push({ path: relativePath, entry: zipEntry });
    }
  });

  // Step 3: Filter out excluded files
  if (onProgress) onProgress({ stage: "cleaning", message: "Cleaning project files..." });
  const cleanedFiles = allFiles.filter((f) => !shouldExclude(f.path));

  // Step 4: Read file contents
  if (onProgress) onProgress({ stage: "reading_contents", message: "Reading file contents..." });
  const fileEntries = [];
  let processed = 0;

  for (const f of cleanedFiles) {
    try {
      const content = await f.entry.async("string");
      fileEntries.push({ path: f.path, content });
    } catch {
      // Skip files that can't be read as text (likely binary)
    }
    processed++;
    if (onProgress && processed % 50 === 0) {
      onProgress({
        stage: "reading_contents",
        message: `Reading files... (${processed}/${cleanedFiles.length})`,
      });
    }
  }

  // Step 4.5: Strip common top-level folder
  const strippedFiles = stripTopLevelFolder(fileEntries);

  // Step 5: Format and split into parts
  if (onProgress) onProgress({ stage: "splitting", message: "Splitting into parts..." });
  const parts = [];
  let currentPartEntries = [];
  let currentPartSize = 0;

  for (const fileEntry of strippedFiles) {
    const rawFormattedSize = byteSize(formatFileEntry(fileEntry.path, fileEntry.content));

    // If this single file is larger than the max part size, we need to split it
    if (rawFormattedSize > maxPartSizeBytes) {
      const overhead = byteSize(formatFileEntry(`${fileEntry.path} (Part 999/999)`, ""));
      const availableBytes = maxPartSizeBytes - overhead - 1000; // 1000 bytes safety margin
      
      if (availableBytes > 0) {
        const fileChunks = chunkStringSafe(fileEntry.content, availableBytes);
        
        for (let i = 0; i < fileChunks.length; i++) {
          const chunkContent = fileChunks[i];
          const formattedChunk = formatFileEntry(`${fileEntry.path} (Part ${i + 1}/${fileChunks.length})`, chunkContent);
          const formattedChunkSize = byteSize(formattedChunk);
          
          if (currentPartSize + formattedChunkSize > maxPartSizeBytes && currentPartEntries.length > 0) {
            parts.push(currentPartEntries.join("\n"));
            currentPartEntries = [];
            currentPartSize = 0;
          }
          currentPartEntries.push(formattedChunk);
          currentPartSize += formattedChunkSize;
        }
        continue;
      }
    }

    const formatted = formatFileEntry(fileEntry.path, fileEntry.content);
    const formattedSize = byteSize(formatted);

    // Check if adding this file would exceed the limit
    if (currentPartSize + formattedSize > maxPartSizeBytes && currentPartEntries.length > 0) {
      // Close current part, start new one
      parts.push(currentPartEntries.join("\n"));
      currentPartEntries = [];
      currentPartSize = 0;
    }

    currentPartEntries.push(formatted);
    currentPartSize += formattedSize;
  }

  // Don't forget the last part
  if (currentPartEntries.length > 0) {
    parts.push(currentPartEntries.join("\n"));
  }

  // Step 6: Add ending prompts and build result
  const totalParts = parts.length;
  const result = parts.map((partContent, index) => {
    const partNumber = index + 1;
    const contentWithPrompt = partContent + getEndingPrompt(partNumber, totalParts);
    const size = byteSize(contentWithPrompt);

    return {
      name: `project_part_${partNumber}.txt`,
      content: contentWithPrompt,
      size,
    };
  });

  if (onProgress) onProgress({ stage: "done", message: "Done!" });

  return result;
}

/**
 * Get stats about what was cleaned from a zip
 */
export async function getCleaningStats(file) {
  const zip = await JSZip.loadAsync(file);

  let totalFiles = 0;
  let removedFiles = 0;
  const removedCategories = {
    directories: new Set(),
    files: 0,
    binary: 0,
  };

  zip.forEach((relativePath, zipEntry) => {
    if (!zipEntry.dir) {
      totalFiles++;
      if (shouldExclude(relativePath)) {
        removedFiles++;
        const parts = relativePath.split("/");
        for (const part of parts) {
          if (DIRS_TO_REMOVE.has(part)) {
            removedCategories.directories.add(part);
            break;
          }
        }
      }
    }
  });

  return {
    totalFiles,
    removedFiles,
    keptFiles: totalFiles - removedFiles,
    removedCategories: {
      ...removedCategories,
      directories: Array.from(removedCategories.directories),
    },
  };
}
