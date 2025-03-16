/**
 * Read OneRNG until it gets the exact amount of bytes
 */
export default async function readUntilLengthReach(fd, length) {
  const finalBuffer = Buffer.alloc(length);
  let offset = 0;
  let bytesToRead = length;

  while (bytesToRead > 0) {
    const { bytesRead } = await fd.read(finalBuffer, offset, bytesToRead, null);
    offset += bytesRead;
    bytesToRead -= bytesRead;
  }

  return finalBuffer;
}
