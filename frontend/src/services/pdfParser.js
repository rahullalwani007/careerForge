// PDF / DOCX / TXT text extraction for resume parsing

export function validateResumeFile(file) {
  const allowed = ['application/pdf', 'text/plain'];
  const ext = file.name.split('.').pop().toLowerCase();
  if (!allowed.includes(file.type) && !['pdf','txt'].includes(ext)) {
    return { valid: false, error: 'Please upload a PDF or TXT file.' };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: 'File too large (max 5 MB).' };
  }
  return { valid: true };
}

export async function extractTextFromFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'txt') return readTextFile(file);
  if (ext === 'pdf') return extractPDFText(file);
  return readTextFile(file);
}

function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result || '');
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

async function extractPDFText(file) {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ') + '\n';
    }
    return text.trim() || '[Could not extract text from PDF]';
  } catch {
    return '[PDF text extraction failed — using filename only]';
  }
}
