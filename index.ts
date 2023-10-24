import { serve } from "https://deno.land/std@0.119.0/http/server.ts";
import { readTextFile } from "https://deno.land/std@0.204.0/assert/mod.ts";

async function handler(_req: Request): Promise<Response> {
  Math.random();

  // take a word from file wordlist
  const wordlist = await readTextFile("./wordlist.txt");
  console.log(wordlist);
  const words = wordlist.split("\n");
  console.log(words);
  const word = words[Math.floor(0.35 * words.length)];
  console.log(word);

  try {
    const guess = await extractGuess(_req);
    const simil = await similarity(guess, "chien");
    const response = responseBuilder(guess, simil);
    return new Response(response);

  } catch (error) {
    return new Response("An error occured ", error);
  }
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
  const percentage = (similarity * 100).toFixed(2);

  if (similarity === 1) {
    return 'You found the word!';
  } else if (similarity >= 0.9) {
    return `${percentage}% : You are very close!`;
  } else if (similarity >= 0.8) {
    return `${percentage}% : You are close!`;
  } else if (similarity >= 0.7) {
    return `${percentage}% : You are almost there!`;
  } else if (similarity >= 0.6) {
    return `${percentage}% : You are getting there!`;
  } else if (similarity >= 0.5) {
    return `${percentage}% : You are on the right track!`;
  } else if (similarity >= 0.4) {
    return `${percentage}% : You are getting closer!`;
  } else if (similarity >= 0.3) {
    return `${percentage}% : You are far`;
  } else if (similarity >= 0.2) {
    return `${percentage}% : You are very far`;
  } else if (similarity >= 0.1) {
    return `${percentage}% : You are so bad`;
  } else if (similarity >= 0) {
    return `${percentage}% : You are so bad I want to kill myself`;
  }
}