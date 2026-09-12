import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  let str = String(value);
  
  // Prevent CSV Formula Injection
  if (/^[=\+\-@]/.test(str)) {
    str = "'" + str;
  }
  
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function POST(req: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck instanceof Response) {
      return adminCheck; // Returns 401/403
    }

    const body = await req.json();
    const { type, searchQuery, customerIds } = body;

    const where: Prisma.UserWhereInput = { role: "CUSTOMER" };

    if (type === "selected" && Array.isArray(customerIds) && customerIds.length > 0) {
      where.id = { in: customerIds };
    } else if (type === "filtered" && searchQuery) {
      const q = searchQuery.toLowerCase();
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            total: true,
            paymentStatus: true,
            orderStatus: true,
            createdAt: true,
          }
        },
        addresses: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            phone: true,
            city: true,
            state: true,
            pincode: true,
          }
        }
      }
    });

    const headers = [
      "Customer ID",
      "Name",
      "Email",
      "Phone",
      "Joined Date",
      "Total Orders",
      "Paid Orders",
      "Total Spent",
      "Last Order Date",
      "Last Order ID",
      "Last Order Status",
      "Average Order Value",
      "City",
      "State",
      "Pincode"
    ];

    let csvContent = "\uFEFF" + headers.map(escapeCSV).join(",") + "\n";

    for (const user of users) {
      const allOrders = user.orders;
      const paidOrders = allOrders.filter(o => o.paymentStatus === "PAID");
      const totalOrders = allOrders.length;
      const totalPaidOrders = paidOrders.length;
      const totalSpent = paidOrders.reduce((sum, o) => sum + o.total, 0);
      const aov = totalPaidOrders > 0 ? Math.round(totalSpent / totalPaidOrders) : 0;
      
      const lastOrder = allOrders[0]; // ordered by desc
      const address = user.addresses[0];

      const row = [
        user.id,
        user.name || "",
        user.email,
        address?.phone || "",
        user.createdAt.toISOString().split("T")[0],
        totalOrders,
        totalPaidOrders,
        totalSpent, // integer (Rupees)
        lastOrder ? lastOrder.createdAt.toISOString().split("T")[0] : "",
        lastOrder?.id || "",
        lastOrder?.orderStatus || "",
        aov,
        address?.city || "",
        address?.state || "",
        address?.pincode || ""
      ];

      csvContent += row.map(escapeCSV).join(",") + "\n";
    }

    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `knoos-customers-${dateStr}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error("Error exporting customers:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
