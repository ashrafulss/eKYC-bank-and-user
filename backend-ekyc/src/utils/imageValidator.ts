import { BadRequestError } from "./AppError.js";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; 
const MIN_SIZE_BYTES = 50 * 1024;        


export function validateBase64Image(base64String: string, fieldName: string): void {
  const matches = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  
  if (!matches || matches.length !== 3) {
    throw new BadRequestError(`Invalid image format for ${fieldName}. Must be a valid base64 data URI.`);
  }

  const mimeType = matches[1];
  const base64Data = matches[2];

  if (!mimeType || !base64Data) {
    throw new BadRequestError(`Could not parse image data stream content layer components for ${fieldName}.`);
  }
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new BadRequestError(`Invalid file type for ${fieldName}. Only JPG, JPEG, PNG, and WEBP are allowed.`);
  }

  const stringLength = base64Data.length;
  const sizeInBytes = Math.ceil((stringLength * 3) / 4) - (base64Data.endsWith("==") ? 2 : base64Data.endsWith("=") ? 1 : 0);

  if (sizeInBytes > MAX_SIZE_BYTES) {
    throw new BadRequestError(`${fieldName} is too large. Maximum allowed size is 10MB.`);
  }

  if (sizeInBytes < MIN_SIZE_BYTES) {
    throw new BadRequestError(`${fieldName} is too small. Please upload a clear, uncorrupted photo.`);
  }
}