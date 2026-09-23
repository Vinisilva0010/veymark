import { listDemoParts } from "@backend/services/demo";

/** Public: the parts the test bench can generate taps for. */
export async function GET() {
  console.log("DATABASE_URL present:", Boolean(process.env.DATABASE_URL));

  const parts = await listDemoParts();
  return Response.json({ parts });
}
