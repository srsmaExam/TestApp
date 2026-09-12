import type { NextRequest } from 'next/server';
import { dispatchApiRequest } from '@/server/api/router';

/**
 * Single Unified API Route Handler
 *
 * Consolidates all 39 API routes into a single Serverless Function to comply
 * with Vercel's Hobby plan limit (<= 12 Serverless Functions).
 *
 * This keeps the platform 100% free forever ($0.00/month) while preserving
 * all existing API contracts and reducing cold starts by keeping the
 * serverless execution environment warm.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type RouteContext = {
  params: Promise<{
    slug?: string[];
  }>;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { slug = [] } = await params;
  return dispatchApiRequest(request, slug);
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { slug = [] } = await params;
  return dispatchApiRequest(request, slug);
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { slug = [] } = await params;
  return dispatchApiRequest(request, slug);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { slug = [] } = await params;
  return dispatchApiRequest(request, slug);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { slug = [] } = await params;
  return dispatchApiRequest(request, slug);
}
