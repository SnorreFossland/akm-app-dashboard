import { NextRequest, NextResponse } from 'next/server';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

// Make exec return a Promise
const execAsync = promisify(exec);

// Disable bodyParser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  try {
    // Create temp directory if it doesn't exist
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir);
    }

    // Parse the incoming form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name;
    const filePath = path.join(tmpDir, fileName);
    
    // Write the file to disk
    fs.writeFileSync(filePath, buffer);
    
    // Extract text based on file extension
    const fileExt = path.extname(fileName).toLowerCase();
    let text = '';

    try {
      if (fileExt === '.pdf') {
        // Use pdftotext (from poppler-utils) to extract text from PDF
        await execAsync(`pdftotext "${filePath}" "${filePath}.txt"`);
        text = fs.readFileSync(`${filePath}.txt`, 'utf8');
        fs.unlinkSync(`${filePath}.txt`);
      } else if (fileExt === '.docx') {
        // Use pandoc to convert docx to text
        await execAsync(`pandoc "${filePath}" -t plain -o "${filePath}.txt"`);
        text = fs.readFileSync(`${filePath}.txt`, 'utf8');
        fs.unlinkSync(`${filePath}.txt`);
      } else if (['.xlsx', '.xls'].includes(fileExt)) {
        // Use ssconvert (from gnumeric) to convert Excel to CSV
        await execAsync(`ssconvert "${filePath}" "${filePath}.csv"`);
        text = fs.readFileSync(`${filePath}.csv`, 'utf8');
        fs.unlinkSync(`${filePath}.csv`);
      } else {
        // For other file types, try to read as text
        text = `Could not extract text from ${fileName} (unsupported file type: ${fileExt})`;
      }
    } catch (error) {
      console.error(`Error extracting text from ${fileName}:`, error);
      text = `Failed to extract text from ${fileName}. Error: ${error instanceof Error ? error.message : String(error)}`;
    }

    // Clean up the temp file
    fs.unlinkSync(filePath);

    return NextResponse.json({ text });
  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
