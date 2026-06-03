const FALLBACK_TOPICS = [
  "Describe your favorite childhood memory and why it matters to you",
  "What skill would you teach to everyone and why?",
  "Explain a complex topic to a 5-year-old",
  "Describe a time you overcame a fear",
  "What would you do with an extra hour every day?",
  "Describe your ideal weekend getaway",
  "What's a lesson you learned the hard way?",
  "Explain your job to a stranger in 60 seconds",
  "What book, movie, or show changed your perspective?",
  "Describe a goal you're working toward this year",
  "What advice would you give your younger self?",
  "Tell a story about a meaningful relationship in your life",
  "What's an opinion you've changed your mind about?",
  "Describe a challenge at work you recently solved",
  "What would you build if you had unlimited resources?",
  "Explain why your favorite hobby is valuable",
  "Tell about a place that holds special meaning for you",
  "What's the most important quality in a leader?",
  "Describe a recent success you're proud of",
  "What would you say to a room full of strangers about your passion?",
];

export function getRandomTopic(): string {
  return FALLBACK_TOPICS[Math.floor(Math.random() * FALLBACK_TOPICS.length)];
}

export { FALLBACK_TOPICS };
