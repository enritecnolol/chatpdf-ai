import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { db } from "../../../lib/db";
import { chats } from "../../../lib/db/schema";
import { eq } from "drizzle-orm";
import ChatSideBar from "../../../components/ChatSiderBar";
import PDFViewer from "../../../components/PDFViewer";
import ChatComponent from "../../../components/ChatComponent";

type Props = {
  params: {
    chatId: string;
  };
};

const ChatPage = async ({ params: { chatId } }: Props) => {
  const { userId } = await auth();
  
  if (!userId) {
    return redirect("/sign-in");
  }

  const _chats = await db.select().from(chats).where(eq(chats.userId, userId));

  if (!_chats || !_chats.find((chat) => chat.id === Number(chatId))) {
    return redirect("/");
  }

  const currentChat = _chats.find(chat => chat.id === Number(chatId))

  return (
    <div className="flex max-h-screen">
      <div className="flex w-full max-h-screen">
        <div className="flex-[2] max-w-xs">
          <ChatSideBar chats={_chats} chatId={Number(chatId)}/>
        </div>
        <div className="max-h-screen overflow-y-scroll flex-[5]">
          <PDFViewer pdf_url={currentChat?.pdfUrl || ''} />
        </div>
        <div className="flex-[3]">
          <ChatComponent chatId={Number(chatId)}/>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
