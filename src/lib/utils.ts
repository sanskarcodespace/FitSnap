import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getThumbnailUrl(originalUrl: string): string {
  if (!originalUrl) return ""
  if (originalUrl.endsWith("-thumb.jpg") || !originalUrl.endsWith(".jpg")) return originalUrl
  return originalUrl.replace(/\.jpg$/, "-thumb.jpg")
}
