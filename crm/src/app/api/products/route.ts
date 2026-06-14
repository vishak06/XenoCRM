import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "100");

    const products = await prisma.product.findMany({
      where: category ? { category } : undefined,
      take: limit,
      orderBy: { category: "asc" },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("[API] GET /api/products error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const product = await prisma.product.create({
      data: {
        name: body.name,
        category: body.category,
        price: parseFloat(body.price),
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/products error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
