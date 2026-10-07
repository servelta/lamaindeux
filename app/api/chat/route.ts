import { NextResponse } from "next/server";
import { z } from "zod";
import { getActiveCities, getAllTrades } from "@/lib/queries/search";
import { answerQuestion } from "@/lib/chat/knowledge";
export const dynamic = "force-dynamic";
const schema = z.object({question:z.string().trim().min(1).max(600),topic:z.string().max(40).optional()});
export async function POST(request: Request) {
 try {
  if (Number(request.headers.get("content-length")) > 4096) return NextResponse.json({error:"Question trop longue."},{status:413});
  const parsed=schema.safeParse(await request.json());
  if(!parsed.success) return NextResponse.json({error:"Écrivez une question de 600 caractères maximum."},{status:400});
  const [cities,trades]=await Promise.all([getActiveCities(),getAllTrades()]);
  return NextResponse.json(answerQuestion(parsed.data.question,{cities,trades},parsed.data.topic),{headers:{"Cache-Control":"no-store"}});
 }catch {return NextResponse.json({text:"Je ne peux pas répondre pour le moment. L’équipe Le Plan B peut vous répondre personnellement.",handoff:true,topic:"contact"},{headers:{"Cache-Control":"no-store"}});}
}
