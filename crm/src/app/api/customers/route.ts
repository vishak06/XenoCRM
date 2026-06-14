import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ruleToPrismaWhere, filterByOrderCount } from "@/lib/segments/rule-to-prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { city: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const orderBy: Record<string, string> = {};
    if (["name", "email", "city", "totalSpend", "lastOrderDate", "createdAt"].includes(sortBy)) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy["createdAt"] = "desc";
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        _count: { select: { orders: true } },
      },
    });
    const total = await prisma.customer.count({ where });
    const allSegments = await prisma.segment.findMany();

    const customerIds = customers.map(c => c.id);
    const customerSegments: Record<string, string[]> = {};
    for (const id of customerIds) {
      customerSegments[id] = [];
    }

    for (const segment of allSegments) {
      const rule = segment.ruleDefinition as any;
      const { where: segmentWhere, orderCountConditions } = ruleToPrismaWhere(rule);
      
      const matchingCustomers = await prisma.customer.findMany({
        where: {
          ...segmentWhere,
          id: { in: customerIds }
        },
        include: { _count: { select: { orders: true } } }
      });
      
      const filtered = filterByOrderCount(matchingCustomers, orderCountConditions, rule.combinator);
      
      for (const c of filtered) {
        if (customerSegments[c.id]) {
          customerSegments[c.id].push(segment.name);
        }
      }
    }

    const customersWithSegments = customers.map(c => ({
      ...c,
      segments: customerSegments[c.id] || []
    }));

    return NextResponse.json({
      customers: customersWithSegments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[API] GET /api/customers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const customer = await prisma.customer.create({ data: body });
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/customers error:", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}
