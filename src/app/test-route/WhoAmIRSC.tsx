import { headers } from "next/headers";

export default async function WhoAmIRSC() {
  const headersList = await headers();
  const { user } = await fetch("http://localhost:3000/api/whoami", {
    method: "GET",
    headers: Object.fromEntries(headersList.entries()),
  }).then((res) => res.json());

  return <div className="mt-5">Who Am I (RSC): {user}</div>;
}
