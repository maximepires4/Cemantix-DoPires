import { serve } from "https://deno.land/std@0.119.0/http/server.ts";

async function handler(_req: Request): Promise<Response> {
  const guess = await extractGuess(_req);
  const simil = await similarity(guess, "chien");
  const response = responseBuilder(guess, simil);
  return new Response(JSON.stringify(response));
}

serve(handler);

const extractGuess = async (req: Request) => {
  const slackPayload = await req.formData();
  const guess = await slackPayload.get("text")?.toString();
  if (!guess) {
    throw Error("Guess is empty or null");
  }
  return guess;
};

const similarity = async (word1: string, word2: string) => {
  const body = {
    sim1: word1,
    sim2: word2,
    lang: "fr",
    type: "General Word2Vec",
  };
  const similarityResponse = await fetch(
    "http://nlp.polytechnique.fr/similarityscore",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  const similarityResponseJson = await similarityResponse.json();
  return Number(similarityResponseJson.simscore);
}

const responseBuilder = (guess: string, similarity: number) => {
  if (similarity === 1) {
    const response = {
      response_type: "in_channel",
      text: `You found the word!`,
    };
    return response;
  }

  const response = {
    response_type: "in_channel",
    text: `Similarity: ${similarity*100}% (${guess})`,
  };
  return response;
}