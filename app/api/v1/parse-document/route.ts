import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const name = file.name;
    const type = file.type || 'text/plain';
    let content = '';

    if (name.endsWith('.txt') || name.endsWith('.md') || type === 'text/plain' || type === 'text/markdown') {
      content = buffer.toString('utf-8');
    } else if (name.endsWith('.pdf') || type === 'application/pdf') {
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const data = await pdfParse(buffer);
        content = data.text.slice(0, 50000);
      } catch (e) {
        return NextResponse.json({ error: 'Failed to parse PDF' }, { status: 422 });
      }
    } else {
      return NextResponse.json({ error: 'Unsupported file type. Supported: .md, .txt, .pdf' }, { status: 415 });
    }

    return NextResponse.json({ name, content: content.slice(0, 50000), type });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
