export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
export const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
export const MAX_SIZE_MB = 10;
export const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024; 
export const MIN_SIZE_BYTES = 50 * 1024;      

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return `Invalid file type. Only ${ALLOWED_EXTENSIONS.join(", ")} are allowed.`;
  }
  
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `Invalid extension. Only ${ALLOWED_EXTENSIONS.join(", ")} are allowed.`;
  }

  if (file.size > MAX_SIZE_BYTES) {
    return `File too large. Maximum size is ${MAX_SIZE_MB}MB.`;
  }

  if (file.size < MIN_SIZE_BYTES) {
    return "Image file size is too small. Please provide a clear, uncorrupted photo.";
  }

  return null;
}


export function validateBase64Image(base64String: string): string | null {
  const matches = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return "Invalid image layout payload format.";
  }

  const mimeType = matches[1];
  const base64Data = matches[2];

  if (!mimeType || !base64Data) {
    return "Could not read data stream properties.";
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return `Invalid file type. Only ${ALLOWED_EXTENSIONS.join(", ")} are allowed.`;
  }
  const stringLength = base64Data.length;
  const sizeInBytes = Math.ceil((stringLength * 3) / 4) - (base64Data.endsWith("==") ? 2 : base64Data.endsWith("=") ? 1 : 0);

  if (sizeInBytes > MAX_SIZE_BYTES) {
    return `File too large. Maximum size is ${MAX_SIZE_MB}MB.`;
  }

  if (sizeInBytes < MIN_SIZE_BYTES) {
    return "Image too small. Please recapture a clear view.";
  }

  return null;
}