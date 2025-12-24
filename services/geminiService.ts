import { GoogleGenAI, Type } from "@google/genai";
import { Flight, SearchCriteria } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ChatResponse {
  text: string;
  suggestedFlights?: Flight[];
}

export const getAIFlightSearch = async (criteria: SearchCriteria): Promise<Flight[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 5 realistic flight options from ${criteria.origin} to ${criteria.destination} departing on ${criteria.departureDate}. 
      The user wants a ${criteria.tripType} trip for ${criteria.travelers} travelers. 
      Make them high-end and premium airlines. 
      For 'origin' and 'destination', provide only the City Name. 
      Additionally, provide the corresponding 3-letter airport codes in 'iataDepartureCode' and 'iataArrivalCode' (e.g., "BOM", "LHR").
      Include a 'stops' field: 0 for direct flights, 1 or 2 for layovers. 
      Provide all prices in Indian Rupees (INR).
      Include baggage details: 'baggageCabin' (e.g., "7 kg") and 'baggageChecked' (e.g., "25 kg").`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              airline: { type: Type.STRING },
              flightNumber: { type: Type.STRING },
              origin: { type: Type.STRING, description: "City Name only" },
              destination: { type: Type.STRING, description: "City Name only" },
              iataDepartureCode: { type: Type.STRING, description: "3-letter airport code" },
              iataArrivalCode: { type: Type.STRING, description: "3-letter airport code" },
              departureTime: { type: Type.STRING, description: "Format: HH:MM AM/PM" },
              arrivalTime: { type: Type.STRING, description: "Format: HH:MM AM/PM" },
              price: { type: Type.NUMBER, description: "Price in Indian Rupees (INR)" },
              class: { type: Type.STRING },
              duration: { type: Type.STRING },
              stops: { type: Type.INTEGER, description: "0 for Direct, 1 or 2 for stops" },
              baggageCabin: { type: Type.STRING },
              baggageChecked: { type: Type.STRING },
            },
            required: [
              "id", "airline", "flightNumber", "origin", "destination", 
              "iataDepartureCode", "iataArrivalCode", "departureTime", 
              "arrivalTime", "price", "class", "duration", "stops",
              "baggageCabin", "baggageChecked"
            ],
          },
        },
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Search Error:", error);
    return [
      {
        id: "1",
        airline: "Air India",
        flightNumber: "AI-101",
        origin: "Mumbai",
        destination: "London",
        iataDepartureCode: "BOM",
        iataArrivalCode: "LHR",
        departureTime: "10:00 AM",
        arrivalTime: "08:00 AM (+1)",
        price: 85000,
        class: "Business",
        duration: "10h 00m",
        stops: 0,
        baggageCabin: "7 kg",
        baggageChecked: "30 kg"
      }
    ];
  }
};

export const getAIChatResponse = async (history: { role: 'user' | 'model', parts: { text: string }[] }[]): Promise<ChatResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: history,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: "The conversational response from the concierge." },
            suggestedFlights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  airline: { type: Type.STRING },
                  flightNumber: { type: Type.STRING },
                  origin: { type: Type.STRING },
                  destination: { type: Type.STRING },
                  iataDepartureCode: { type: Type.STRING },
                  iataArrivalCode: { type: Type.STRING },
                  departureTime: { type: Type.STRING },
                  arrivalTime: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  class: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  stops: { type: Type.INTEGER },
                  baggageCabin: { type: Type.STRING },
                  baggageChecked: { type: Type.STRING },
                },
                required: ["id", "airline", "flightNumber", "origin", "destination", "iataDepartureCode", "iataArrivalCode", "departureTime", "arrivalTime", "price", "class", "duration", "stops", "baggageCabin", "baggageChecked"],
              },
              description: "Optional list of flight recommendations if the user is looking for trips."
            }
          },
          required: ["text"]
        },
        systemInstruction: `You are the Lead Concierge for Fast Flight, a world-class luxury reservation system. 
        Your tone is sophisticated, welcoming, and exceptionally helpful.
        
        Guidelines:
        - If the user asks about destinations or flights, suggest 1-2 realistic options in the 'suggestedFlights' field.
        - Suggest exclusive, high-end destinations like Tokyo, Paris, Dubai, or the Swiss Alps.
        - Quote all prices in Indian Rupees (₹).
        - If suggesting flights, make the 'text' field warm and inviting, explaining WHY you picked these specific options.
        - Ensure all flight data is realistic and consistent with the user's inquiry.
        - Encourage users to use the 'Book Now' button attached to your suggestions.`,
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return { text: "I apologize, but I'm momentarily disconnected from our flight database. How else may I assist your travel plans?" };
  }
};