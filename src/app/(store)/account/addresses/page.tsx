import { Metadata } from "next";
import AccountShell from "../AccountShell";
import AddressesClient from "./AddressesClient";

export const metadata: Metadata = {
  title: "My Addresses — KNOOS",
};

export default function AddressesPage() {
  return (
    <AccountShell title="My Addresses" subtitle="Manage your delivery addresses" active="addresses">
      <AddressesClient />
    </AccountShell>
  );
}
