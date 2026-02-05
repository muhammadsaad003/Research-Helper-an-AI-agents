import pdf from "pdf-parse";

export async function parseFileToText(file: { buffer: Buffer; mimetype: string; originalname: string }) {
  const mime = file.mimetype;

  if (mime === "application/pdf") {
    const data = await pdf(file.buffer);
    return data.text || "";
  }

  // txt / md / others as utf-8
  return file.buffer.toString("utf-8");
}
