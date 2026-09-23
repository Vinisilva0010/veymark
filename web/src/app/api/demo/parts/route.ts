import { listDemoParts } from "@backend/services/demo";

/** Public: the parts the test bench can generate taps for. */
export async function GET() {
  const parts = await listDemoParts();
  return Response.json({ parts });
}
