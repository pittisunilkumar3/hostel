import { getAvailableRoomsController } from "@/src/controllers/roomController";

export async function GET() {
  return getAvailableRoomsController();
}
