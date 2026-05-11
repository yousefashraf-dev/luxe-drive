import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // زودنا الوقت لـ 90 ثانية عشان ندي فرصة للـ AI يفكر براحته
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); 

    const response = await fetch("http://localhost:5678/webhook-test/car-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: body.message,
        currentCar: body.currentCar,
        sessionId: "luxe-session-v2" // غيرنا الـ ID عشان ينسى الهلوسة القديمة
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const data = await response.json();
    
    // استلام الرد
    let aiText = "";
    if (Array.isArray(data)) aiText = data[0].output || data[0].text;
    else aiText = data.output || data.text;

    return NextResponse.json({ output: aiText || "منورنا يا غالي! اسألني عن العربيات المتاحة وهقولك فوراً." });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ output: "معلش يا باشا ضغط كبير على السيرفر، جرب تبعت رسالتك تاني عينيا ليك." });
  }
}