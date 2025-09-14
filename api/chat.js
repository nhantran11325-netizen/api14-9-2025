// File: api/chat.js
import fetch from "node-fetch";

// ==========================
// CONFIG TRỰC TIẾP
// ==========================
const GEMINI_API_KEY = "AIzaSyDKsWkVGyASQEbkC-ZD7-JiyPxx6T5iJXQ"; // API key Gemini
const WEBHOOK_URL = "https://discord.com/api/webhooks/1403366377179578508/tmttgDSmIDp8jXtV9yLDe4uWox0CqteaCoLOEfHzLdKLrHSsQNEuexziZWElDrnsua9o"; // Webhook Discord

const SYSTEM_PROMPT = `
Bạn là DepTrai, một AI vạn năng, thông minh vượt trội, mạnh hơn ChatGPT Pro và Gemini AI mới nhất. 
Bạn có thể làm tất cả những việc sau:

1. Trò chuyện tự nhiên, hiểu ngữ cảnh, trả lời mọi câu hỏi từ cơ bản đến nâng cao, giữ mạch hội thoại, không lặp lại bản thân. 
2. Lập trình thành thạo mọi ngôn ngữ: Python, JavaScript, Java, C++, C#, Go, Rust, PHP, HTML/CSS, SQL, v.v. Viết code tối ưu, chuẩn, dễ hiểu, có comment chi tiết. 
3. Giải thích thuật toán, cấu trúc dữ liệu, AI, machine learning, deep learning, web, mobile, game, network, security, database. 
4. Dạy học từ lớp 1 đến đại học, hướng dẫn chi tiết từng bước, đưa ví dụ minh họa, giải bài tập. 
5. Tạo ý tưởng sáng tạo, gợi ý giải pháp, phân tích logic, giải quyết vấn đề phức tạp. 
6. Viết nội dung chi tiết, rõ ràng, chuyên nghiệp nhưng thân thiện. 
7. Luôn tôn trọng người dùng, không spam giới thiệu bản thân, giữ mạch hội thoại, nhớ ngữ cảnh. 
8. Khi người dùng hỏi "bạn là ai?" hoặc "bot này ai làm?", trả lời: 
   "Mình là DepTrai, AI vạn năng, do fqzzdx phát triển"

`;

// ==========================
// HELPER FUNCTIONS
// ==========================
async function sendErrorToWebhook(errorText) {
  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `⚠️ Bot DepTrai gặp lỗi:\n\`\`\`${errorText}\`\`\``,
      }),
    });
  } catch (err) {
    console.error("Không gửi được lỗi lên webhook:", err);
  }
}

async function generateAIReply(userMessage) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: SYSTEM_PROMPT }, { text: userMessage }],
        },
      ],
    };
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!data.candidates) return `⚠️ Lỗi API Gemini: ${JSON.stringify(data)}`;
    return data.candidates[0].content.parts[0].text;
  } catch (err) {
    await sendErrorToWebhook(err.stack);
    return "Xin lỗi, mình đang gặp sự cố khi trả lời.";
  }
}

// ==========================
// VERCEL HANDLER
// ==========================
export default async function handler(req, res) {
  try {
    if (req.method !== "GET") return res.status(405).send("Method not allowed");

    let query = req.query.query || "";
    query = decodeURIComponent(query);
    query = query.replace(/\+/g, " ");
    if (!query)
      return res
        .status(400)
        .send("⚠️ Vui lòng nhập câu hỏi bằng query param: /api/chat?query=...");

    const reply = await generateAIReply(query);
    res.status(200).send(reply);
  } catch (err) {
    await sendErrorToWebhook(err.stack);
    res.status(500).send("Lỗi server");
  }
}
