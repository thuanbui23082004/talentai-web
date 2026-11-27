const PDF_HEADER = /^[\t\n\f\r ]*%PDF-/;

export function hasPdfHeader(bytes: Uint8Array): boolean {
    // Some valid PDFs begin with a line break before the header.
    return PDF_HEADER.test(new TextDecoder().decode(bytes.slice(0, 32)));
}

export async function blobHasPdfHeader(blob: Blob): Promise<boolean> {
    return hasPdfHeader(new Uint8Array(await blob.slice(0, 32).arrayBuffer()));
}
