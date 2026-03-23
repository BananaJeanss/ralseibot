import { exec } from "node:child_process";

exec("git rev-parse --short HEAD", (err, stdout) => {
  if (err) {
    console.error("Error getting git commit:", err);
    return;
  }
  const commitHash = stdout.trim();
  statuses.push({ type: 4, text: `git: ${commitHash}` });
});

// types: 0 = Playing, 1 = Streaming, 2 = Listening, 3 = Watching, 4 = custom

const statuses = [
  { "type": 0, "text": "with Ralsei" },
  { "type": 0, "text": "DELTARUNE" },
  { "type": 0, "text": "Undertale" },
  { "type": 0, "text": "manual reading simulator" },
  { "type": 0, "text": "with Lancer" },
  { "type": 2, "text": "Cool Mixtape" },
  { "type": 2, "text": "Rude Buster" },
  { "type": 2, "text": "Field of Hopes and Dreams" },
  { "type": 3, "text": "the stars" },
  { "type": 3, "text": "Dark Fountains" },
  { "type": 3, "text": "the Prophecy" },
  { "type": 3, "text": "Susie eat chalk" },
  { "type": 3, "text": "Mr. (Ant) Tenna's TV Time" },
  { "type": 3, "text": "the Fun Gang" },
  { "type": 4, "text": "Baking a cake" },
  { "type": 4, "text": "Brewing tea" },
  { "type": 4, "text": "Fighting the titan" },
  { "type": 4, "text": "ralseibot v2. Better than ever."}
]

export default statuses;
