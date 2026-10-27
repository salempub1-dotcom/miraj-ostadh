import { getNeonAuth } from '@/lib/neon/auth';
import type { NextRequest } from 'next/server';
export const runtime = 'nodejs';
type Context = { params: Promise<{ path: string[] }> };
export const GET = (req:NextRequest,context:Context) => getNeonAuth().handler().GET(req,context);
export const POST = (req:NextRequest,context:Context) => getNeonAuth().handler().POST(req,context);
export const PUT = (req:NextRequest,context:Context) => getNeonAuth().handler().PUT(req,context);
export const PATCH = (req:NextRequest,context:Context) => getNeonAuth().handler().PATCH(req,context);
export const DELETE = (req:NextRequest,context:Context) => getNeonAuth().handler().DELETE(req,context);
