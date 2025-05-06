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
    return NextResponse.json({ files });
  } catch (e) {
    return NextResponse.json({ files: [], error: e?.toString() }, { status: 500 });
  }
} 