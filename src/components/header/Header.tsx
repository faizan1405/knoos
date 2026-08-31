import { auth, signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HeaderClient } from "./HeaderClient";

export async function Header() {
  const session = await auth();
  
  let cartCount = 0;
  if (session?.user?.id) {
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: { items: true },
    });
    if (cart) {
      cartCount = cart.items.reduce((acc, item) => acc + item.quantity, 0);
    }
  }

  const signInAction = async () => {
    "use server";
    await signIn("google");
  };

  const signOutAction = async () => {
    "use server";
    await signOut();
  };

  return (
    <HeaderClient 
      cartCount={cartCount}
      userName={session?.user?.name}
      signInAction={signInAction}
      signOutAction={signOutAction}
    />
  );
}

