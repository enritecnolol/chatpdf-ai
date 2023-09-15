import { eq } from "drizzle-orm";
import { db } from "../../../lib/db";
import { messages } from "../../../lib/db/schema";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  const {chatId} = await req.json()
  const _messages = await db.select().from(messages).where(eq(messages.chatId, chatId))
  return NextResponse.json(_messages)
};
