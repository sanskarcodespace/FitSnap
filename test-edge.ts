import { NextResponse } from 'next/server';
export function middleware() {
  console.log('Runtime:', process.env.NEXT_RUNTIME);
  return NextResponse.next();
}
