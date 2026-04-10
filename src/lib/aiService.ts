import { GoogleGenAI, Type } from "@google/genai";
import { LPProblem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function parseLPProblem(text: string): Promise<Partial<LPProblem>> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analiza el siguiente problema de programación lineal y extrae la función objetivo y las restricciones.
    
    Texto del problema:
    "${text}"
    
    Responde estrictamente en formato JSON con la siguiente estructura:
    {
      "name": "Nombre corto del problema",
      "objectiveType": "MAX" o "MIN",
      "objectiveCoefficients": [números],
      "variables": ["x1", "x2", ...],
      "constraints": [
        {
          "coefficients": [números],
          "operator": "<=" o ">=" o "=",
          "constant": número
        }
      ]
    }`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          objectiveType: { type: Type.STRING, enum: ["MAX", "MIN"] },
          objectiveCoefficients: { type: Type.ARRAY, items: { type: Type.NUMBER } },
          variables: { type: Type.ARRAY, items: { type: Type.STRING } },
          constraints: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                coefficients: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                operator: { type: Type.STRING, enum: ["<=", ">=", "="] },
                constant: { type: Type.NUMBER }
              },
              required: ["coefficients", "operator", "constant"]
            }
          }
        },
        required: ["name", "objectiveType", "objectiveCoefficients", "variables", "constraints"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Error parsing AI response", e);
    throw new Error("No se pudo interpretar el problema. Intenta ser más específico.");
  }
}
