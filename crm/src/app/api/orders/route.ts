import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get("sortBy") || "orderDate";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const orderBy: Record<string, string> = {};
    if (["amount", "orderDate", "createdAt"].includes(sortBy)) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy["orderDate"] = "desc";
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        orderBy,
        skip,
        take: limit,
        include: {
          customer: {
            select: { name: true, email: true },
          },
        },
      }),
      prisma.order.count(),
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[API] GET /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const order = await prisma.order.create({ data: body });
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
