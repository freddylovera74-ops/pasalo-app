import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { GoogleGenAI, Type } from "@google/genai";

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

// ─── Helper: obtener cliente Gemini ─────────────────────────────────────────
function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new HttpsError("failed-precondition", "GEMINI_API_KEY no configurada.");
  return new GoogleGenAI({ apiKey });
}

// ─── HTTPS Callable: mejorar descripción de anuncio ─────────────────────────
export const geminiEnhanceDescription = onCall(
  { secrets: ["GEMINI_API_KEY"], cors: true },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
    const { title, description } = request.data as { title: string; description: string };
    if (!title || !description) throw new HttpsError("invalid-argument", "Faltan title y description.");

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Optimiza esta descripción para una plataforma de venta de artículos usados en Venezuela.
Producto: ${title}
Descripción original: ${description}
Hazla atractiva, clara y resalta posibles beneficios. Usa un tono amigable. Máximo 300 palabras.`,
    });
    return { result: response.text?.trim() || description };
  }
);

// ─── HTTPS Callable: sugerir precio ─────────────────────────────────────────
export const geminiSuggestPrice = onCall(
  { secrets: ["GEMINI_API_KEY"], cors: true },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
    const { title, category } = request.data as { title: string; category: string };
    if (!title || !category) throw new HttpsError("invalid-argument", "Faltan title y category.");

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Sugiere un rango de precio en USD para un artículo de segunda mano en Venezuela.
Título: ${title}
Categoría: ${category}
Devuelve solo un objeto JSON con "min", "max" y "average".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            min: { type: Type.NUMBER },
            max: { type: Type.NUMBER },
            average: { type: Type.NUMBER },
          },
          required: ["min", "max", "average"],
        },
      },
    });
    const text = response.text?.trim() || "{}";
    return JSON.parse(text);
  }
);

// ─── HTTPS Callable: feed de actividad en vivo ──────────────────────────────
export const geminiLiveActivity = onCall(
  { secrets: ["GEMINI_API_KEY"], cors: true },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
    const { location } = request.data as { location: string };

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Genera 5 mensajes cortos de actividad para una app de ventas en vivo en ${location || "Venezuela"}.
Ejemplos: "Nuevo iPhone en Chacao", "Oferta aceptada en Las Mercedes", "5 personas viendo Ropa".
Sé creativo y breve. Devuelve un array JSON de strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
    });
    const text = response.text?.trim() || "[]";
    return JSON.parse(text);
  }
);

// ─── HTTPS Callable: insights de vendedor ───────────────────────────────────
export const geminiSellerInsights = onCall(
  { secrets: ["GEMINI_API_KEY"], cors: true },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
    const { views, avgTime, topCategory } = request.data as {
      views: number; avgTime: number; topCategory: string;
    };

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Analiza estas métricas de un vendedor en PASALO.app y dale un consejo estratégico corto:
Vistas: ${views}, Tiempo promedio de venta: ${avgTime} días, Categoría más vendida: ${topCategory}.
El tono debe ser de un mentor de negocios experto y motivador. Máximo 100 caracteres.`,
    });
    return { result: response.text?.trim() || "¡Sigue publicando, tus artículos están destacando!" };
  }
);

// ─── HTTPS Callable: tipo de cambio USD/VES ─────────────────────────────────
export const getExchangeRate = onCall({ cors: true }, async () => {
  const cacheRef = db.collection("system").doc("exchangeRate");
  const snap = await cacheRef.get();

  if (snap.exists) {
    const data = snap.data()!;
    const ageMs = Date.now() - data.fetchedAt;
    if (ageMs < 3_600_000) { // cache de 1 hora
      return { rate: data.rate, source: "cache" };
    }
  }

  try {
    const res = await fetch("https://ve.dolarapi.com/v1/dolares/paralelo");
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const json = await res.json() as { promedio?: number; paralelo?: number };
    const rate = json.promedio ?? json.paralelo ?? 36.5;
    await cacheRef.set({ rate, fetchedAt: Date.now() });
    return { rate, source: "live" };
  } catch (err) {
    console.error("Exchange rate fetch failed:", err);
    const fallback = snap.exists ? snap.data()!.rate : 36.5;
    return { rate: fallback, source: "fallback" };
  }
});

// ─── Firestore trigger: nuevo mensaje → notificación push ───────────────────
export const onCreateMessage = onDocumentCreated("chats/{chatId}/messages/{messageId}", async (event) => {
  const message = event.data?.data();
  if (!message) return;

  const { chatId } = event.params;
  const chatDoc = await db.collection("chats").doc(chatId).get();
  if (!chatDoc.exists) return;

  const chatData = chatDoc.data()!;
  const recipientId = chatData.participants.find((id: string) => id !== message.senderId);
  if (!recipientId) return;

  const recipientDoc = await db.collection("users").doc(recipientId).get();
  const recipientData = recipientDoc.data();
  const senderName = chatData.participantDetails[message.senderId]?.displayName || "Alguien";

  await db.collection("users").doc(recipientId).collection("notifications").add({
    type: "new_message",
    title: `Nuevo mensaje de ${senderName}`,
    body: message.text,
    chatId,
    listingId: chatData.listingId,
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  if (recipientData?.fcmToken) {
    try {
      await messaging.send({
        notification: { title: `Nuevo mensaje de ${senderName}`, body: message.text },
        data: { chatId, type: "new_message" },
        token: recipientData.fcmToken,
      });
    } catch (error) {
      console.error("Error sending push notification:", error);
    }
  }
});

// ─── Firestore trigger: nuevo chat → notificar al vendedor ──────────────────
export const onCreateChat = onDocumentCreated("chats/{chatId}", async (event) => {
  const chatData = event.data?.data();
  if (!chatData?.listingId) return;

  const listingDoc = await db.collection("listings").doc(chatData.listingId).get();
  if (!listingDoc.exists) return;

  const sellerId = listingDoc.data()?.userId;
  const buyerId = chatData.participants.find((id: string) => id !== sellerId);
  if (!sellerId || !buyerId) return;

  const buyerName = chatData.participantDetails[buyerId]?.displayName || "Un usuario";

  await db.collection("users").doc(sellerId).collection("notifications").add({
    type: "new_interest",
    title: "Nuevo interés en tu artículo",
    body: `${buyerName} ha iniciado un chat sobre "${chatData.listingTitle}"`,
    chatId: event.params.chatId,
    listingId: chatData.listingId,
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
});

// ─── Firestore trigger: nueva calificación → actualizar promedio ─────────────
export const onCreateRating = onDocumentCreated("ratings/{ratingId}", async (event) => {
  const rating = event.data?.data();
  if (!rating) return;

  const { ratedUserId, score } = rating;
  const userRef = db.collection("users").doc(ratedUserId);

  await db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists) return;

    const userData = userSnap.data()!;
    const currentTotal = userData.totalRatings || 0;
    const currentAverage = userData.averageRating || 0;
    const newTotal = currentTotal + 1;
    const newAverage = ((currentAverage * currentTotal) + score) / newTotal;

    transaction.update(userRef, {
      totalRatings: newTotal,
      averageRating: newAverage,
      reputation: Math.round(newAverage),
    });
  });
});

// ─── Firestore trigger: usuario actualizado → sincronizar chats ──────────────
export const onUserUpdate = onDocumentUpdated("users/{userId}", async (event) => {
  const newValue = event.data?.after.data();
  const previousValue = event.data?.before.data();
  if (!newValue || !previousValue) return;

  const { displayName, photoURL } = newValue;
  if (displayName === previousValue.displayName && photoURL === previousValue.photoURL) return;

  const userId = event.params.userId;
  const chatsSnapshot = await db.collection("chats").where("participants", "array-contains", userId).get();
  if (chatsSnapshot.empty) return;

  const batch = db.batch();
  chatsSnapshot.docs.forEach((chatDoc) => {
    const participantDetails = { ...chatDoc.data().participantDetails };
    participantDetails[userId] = { displayName: displayName || null, photoURL: photoURL || null };
    batch.update(chatDoc.ref, { participantDetails });
  });
  await batch.commit();
});

// ─── Scheduler: agregar contadores de vistas cada 5 minutos ─────────────────
export const aggregateViewCounters = onSchedule("every 5 minutes", async () => {
  const listingsSnapshot = await db.collection("listings").get();

  for (const listingDoc of listingsSnapshot.docs) {
    const listingId = listingDoc.id;
    const shardsRef = db.collection("listings").doc(listingId).collection("viewCounters");
    const shardsSnapshot = await shardsRef.get();
    if (shardsSnapshot.empty) continue;

    let totalNewViews = 0;
    const shardRefs: admin.firestore.DocumentReference[] = [];

    shardsSnapshot.docs.forEach((shardDoc) => {
      totalNewViews += shardDoc.data().count || 0;
      shardRefs.push(shardDoc.ref);
    });

    if (totalNewViews > 0) {
      await db.runTransaction(async (transaction) => {
        const listingRef = db.collection("listings").doc(listingId);
        const listingSnap = await transaction.get(listingRef);
        if (listingSnap.exists) {
          transaction.update(listingRef, {
            views: (listingSnap.data()?.views || 0) + totalNewViews,
          });
          shardRefs.forEach((ref) => transaction.delete(ref));
        }
      });
    }
  }
});
