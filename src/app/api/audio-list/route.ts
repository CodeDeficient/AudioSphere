import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const AUDIO_DIR = path.join(process.cwd(), 'public', 'audio');
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.flac'];

function walkDir(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(filePath));
    } else if (AUDIO_EXTENSIONS.includes(path.extname(file).toLowerCase())) {
      // Return path relative to public
      results.push(path.relative(path.join(process.cwd(), 'public'), filePath).replace(/\\/g, '/'));
    }
  });
  return results;
}

export async function GET() {
  try {
    const files = walkDir(AUDIO_DIR);

    // Define the desired order of filenames (without subdirectories or extensions initially)
    const desiredOrder = [
      "Live",
      "Collide",
      "Because Of You",
      "If They Hate You"
    ];

    const sortedFiles = files.sort((a, b) => {
      // Extract the filename without extension and path for comparison
      const aFilename = path.basename(a, path.extname(a));
      const bFilename = path.basename(b, path.extname(b));

      const aIndex = desiredOrder.indexOf(aFilename);
      const bIndex = desiredOrder.indexOf(bFilename);

      // If both are in desiredOrder, sort by their index in desiredOrder
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      // If only a is in desiredOrder, it comes first
      if (aIndex !== -1) {
        return -1;
      }
      // If only b is in desiredOrder, it comes first
      if (bIndex !== -1) {
        return 1;
      }
      // If neither is in desiredOrder, sort alphabetically (or maintain original relative order for non-specified files)
      return a.localeCompare(b);
    });

    return NextResponse.json({ files: sortedFiles });
  } catch (e) {
    return NextResponse.json({ files: [], error: e?.toString() }, { status: 500 });
  }
} 