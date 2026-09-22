export interface RetrievalTask {
  id: string;
  persona: string;
  prompt: string;
  remembered: string;
  forgotten: string;
  targetPhotoId: string;
  starterClue: string;
  segmentCode?: "S1" | "S2" | "S3" | "S4" | "S5";
  metricNode?: "formulate" | "understand" | "retrieve" | "recognize" | "refine";
  control?: boolean;
}

export const TASKS: RetrievalTask[] = [
  {
    id: "task-goa-cafe",
    persona: "Trip rememberer",
    prompt: "That small café we went to during our Goa trip.",
    remembered: "place vibe, trip",
    forgotten: "date, album, town name",
    targetPhotoId: "p-cafe-1",
    starterClue: "small cafe on that trip",
    segmentCode: "S2",
    metricNode: "understand"
  },
  {
    id: "task-medicine",
    persona: "Object finder",
    prompt: "The picture of the medicine I took when I was sick last year.",
    remembered: "object + episode",
    forgotten: "date, album",
    targetPhotoId: "p-med-1",
    starterClue: "medicine when I was sick last year",
    segmentCode: "S3",
    metricNode: "understand"
  },
  {
    id: "task-screenshot",
    persona: "Screenshot finder",
    prompt: "A screenshot of a receipt — I remember the shop, not the album.",
    remembered: "screenshot content",
    forgotten: "date, filename",
    targetPhotoId: "p-receipt-1",
    starterClue: "screenshot of a receipt",
    segmentCode: "S3",
    metricNode: "retrieve"
  },
  {
    id: "task-goa-trip",
    persona: "Trip rememberer",
    prompt: "Photos from that Goa trip — I remember the trip, not the dates.",
    remembered: "place, trip",
    forgotten: "date, which day, filename",
    targetPhotoId: "p-beach-1",
    starterClue: "Goa",
    segmentCode: "S2",
    metricNode: "understand"
  },
  {
    id: "task-concert-lights",
    persona: "Trip rememberer",
    prompt: "That gig with the purple lights — I never knew the venue name.",
    remembered: "place vibe, lights, episode",
    forgotten: "venue, date, artist to type",
    targetPhotoId: "p-gig-1",
    starterClue: "the gig with the purple lights",
    segmentCode: "S2",
    metricNode: "understand"
  },
  {
    id: "task-houseboat",
    persona: "Trip rememberer",
    prompt: "The houseboat on the backwaters — I remember the boat, not the village.",
    remembered: "place vibe, trip",
    forgotten: "town name, date, album",
    targetPhotoId: "p-ker-1",
    starterClue: "houseboat on the backwaters",
    segmentCode: "S2",
    metricNode: "understand"
  },
  {
    id: "task-fireworks",
    persona: "Trip rememberer",
    prompt: "Fireworks that night — I remember the sky, not New Year as a search word.",
    remembered: "episode, lights",
    forgotten: "date, album",
    targetPhotoId: "p-fw-1",
    starterClue: "fireworks that night",
    segmentCode: "S2",
    metricNode: "understand"
  },
  {
    id: "task-rickshaw",
    persona: "Trip rememberer",
    prompt: "The yellow auto we took looking for that cafe.",
    remembered: "object, trip vibe",
    forgotten: "date, map pin",
    targetPhotoId: "p-auto-1",
    starterClue: "yellow auto on that trip",
    segmentCode: "S2",
    metricNode: "understand"
  },
  {
    id: "task-qr-menu",
    persona: "Screenshot finder",
    prompt: "A QR of the menu — I remember the table, not the filename.",
    remembered: "screenshot content",
    forgotten: "date, filename",
    targetPhotoId: "p-qr-1",
    starterClue: "QR of the menu",
    segmentCode: "S3",
    metricNode: "retrieve"
  },
  {
    id: "task-horse",
    persona: "Object finder",
    prompt: "The horse I saw on the trip — I remember the animal, not the date.",
    remembered: "object",
    forgotten: "date, album",
    targetPhotoId: "p-horse-1",
    starterClue: "horse",
    segmentCode: "S3",
    metricNode: "retrieve"
  },
  {
    id: "task-control-date",
    persona: "Control · date known",
    prompt: "Find the photo from 14 Dec 2024.",
    remembered: "exact date",
    forgotten: "nothing required",
    targetPhotoId: "p-cafe-1",
    starterClue: "2024-12-14",
    control: true
  }
];

