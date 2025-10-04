/**
 * Focus Quotes Database
 * 
 * A comprehensive collection of motivational and inspirational quotes
 * categorized by focus mode type. Used throughout the app during
 * focus sessions to provide encouragement and wisdom.
 */

export interface FocusQuote {
  text: string;
  author: string;
  category: 'flow' | 'pomodoro' | 'clock' | 'body' | 'meditation' | 'general';
}

export const FOCUS_QUOTES: FocusQuote[] = [
  // ======================
  // FLOW FOCUS QUOTES (25)
  // ======================
  {
    text: "The secret to getting ahead is getting started.",
    author: "Mark Twain",
    category: 'flow'
  },
  {
    text: "Concentrate all your thoughts upon the work at hand. The sun's rays do not burn until brought to a focus.",
    author: "Alexander Graham Bell",
    category: 'flow'
  },
  {
    text: "Focus is a matter of deciding what things you're not going to do.",
    author: "John Carmack",
    category: 'flow'
  },
  {
    text: "The successful warrior is the average person, with laser-like focus.",
    author: "Bruce Lee",
    category: 'flow'
  },
  {
    text: "Concentration is the secret of strength.",
    author: "Ralph Waldo Emerson",
    category: 'flow'
  },
  {
    text: "Where focus goes, energy flows.",
    author: "Tony Robbins",
    category: 'flow'
  },
  {
    text: "The key to success is to focus our conscious mind on things we desire, not things we fear.",
    author: "Brian Tracy",
    category: 'flow'
  },
  {
    text: "Your future is created by what you do today, not tomorrow.",
    author: "Robert Kiyosaki",
    category: 'flow'
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    category: 'flow'
  },
  {
    text: "Success is the sum of small efforts repeated day in and day out.",
    author: "Robert Collier",
    category: 'flow'
  },
  {
    text: "It's not about having time. It's about making time.",
    author: "Unknown",
    category: 'flow'
  },
  {
    text: "The difference between ordinary and extraordinary is that little extra.",
    author: "Jimmy Johnson",
    category: 'flow'
  },
  {
    text: "Don't watch the clock; do what it does. Keep going.",
    author: "Sam Levenson",
    category: 'flow'
  },
  {
    text: "Quality is not an act, it is a habit.",
    author: "Aristotle",
    category: 'flow'
  },
  {
    text: "The expert in anything was once a beginner.",
    author: "Helen Hayes",
    category: 'flow'
  },
  {
    text: "Action is the foundational key to all success.",
    author: "Pablo Picasso",
    category: 'flow'
  },
  {
    text: "The way to get started is to quit talking and begin doing.",
    author: "Walt Disney",
    category: 'flow'
  },
  {
    text: "Don't count the days, make the days count.",
    author: "Muhammad Ali",
    category: 'flow'
  },
  {
    text: "You miss 100% of the shots you don't take.",
    author: "Wayne Gretzky",
    category: 'flow'
  },
  {
    text: "The harder you work for something, the greater you'll feel when you achieve it.",
    author: "Unknown",
    category: 'flow'
  },
  {
    text: "Success doesn't just find you. You have to go out and get it.",
    author: "Unknown",
    category: 'flow'
  },
  {
    text: "Dream it. Wish it. Do it.",
    author: "Unknown",
    category: 'flow'
  },
  {
    text: "Great things never come from comfort zones.",
    author: "Unknown",
    category: 'flow'
  },
  {
    text: "Dream bigger. Do bigger.",
    author: "Unknown",
    category: 'flow'
  },
  {
    text: "Don't stop when you're tired. Stop when you're done.",
    author: "Unknown",
    category: 'flow'
  },

  // ======================
  // POMODORO QUOTES (25)
  // ======================
  {
    text: "Work expands to fill the time available for its completion.",
    author: "Parkinson's Law",
    category: 'pomodoro'
  },
  {
    text: "Time is the scarcest resource and unless it is managed, nothing else can be managed.",
    author: "Peter Drucker",
    category: 'pomodoro'
  },
  {
    text: "The bad news is time flies. The good news is you're the pilot.",
    author: "Michael Altshuler",
    category: 'pomodoro'
  },
  {
    text: "Time management is life management.",
    author: "Robin Sharma",
    category: 'pomodoro'
  },
  {
    text: "A man who dares to waste one hour of time has not discovered the value of life.",
    author: "Charles Darwin",
    category: 'pomodoro'
  },
  {
    text: "The key is not to prioritize what's on your schedule, but to schedule your priorities.",
    author: "Stephen Covey",
    category: 'pomodoro'
  },
  {
    text: "Take rest; a field that has rested gives a bountiful crop.",
    author: "Ovid",
    category: 'pomodoro'
  },
  {
    text: "Almost everything will work again if you unplug it for a few minutes, including you.",
    author: "Anne Lamott",
    category: 'pomodoro'
  },
  {
    text: "Rest when you're weary. Refresh and renew yourself, your body, your mind, your spirit.",
    author: "Ralph Marston",
    category: 'pomodoro'
  },
  {
    text: "Lost time is never found again.",
    author: "Benjamin Franklin",
    category: 'pomodoro'
  },
  {
    text: "You will never find time for anything. If you want time you must make it.",
    author: "Charles Buxton",
    category: 'pomodoro'
  },
  {
    text: "Time is what we want most, but what we use worst.",
    author: "William Penn",
    category: 'pomodoro'
  },
  {
    text: "Productivity is never an accident. It is always the result of a commitment to excellence.",
    author: "Paul J. Meyer",
    category: 'pomodoro'
  },
  {
    text: "The shorter way to do many things is to do only one thing at a time.",
    author: "Mozart",
    category: 'pomodoro'
  },
  {
    text: "Focus on being productive instead of busy.",
    author: "Tim Ferriss",
    category: 'pomodoro'
  },
  {
    text: "Either you run the day or the day runs you.",
    author: "Jim Rohn",
    category: 'pomodoro'
  },
  {
    text: "The most effective way to do it, is to do it.",
    author: "Amelia Earhart",
    category: 'pomodoro'
  },
  {
    text: "Until we can manage time, we can manage nothing else.",
    author: "Peter Drucker",
    category: 'pomodoro'
  },
  {
    text: "Give me six hours to chop down a tree and I will spend the first four sharpening the axe.",
    author: "Abraham Lincoln",
    category: 'pomodoro'
  },
  {
    text: "It is not enough to be busy. The question is: what are we busy about?",
    author: "Henry David Thoreau",
    category: 'pomodoro'
  },
  {
    text: "Work smarter, not harder.",
    author: "Allan F. Mogensen",
    category: 'pomodoro'
  },
  {
    text: "Efficiency is doing things right; effectiveness is doing the right things.",
    author: "Peter Drucker",
    category: 'pomodoro'
  },
  {
    text: "The more you sweat in practice, the less you bleed in battle.",
    author: "Norman Schwarzkopf",
    category: 'pomodoro'
  },
  {
    text: "Start where you are. Use what you have. Do what you can.",
    author: "Arthur Ashe",
    category: 'pomodoro'
  },
  {
    text: "Action is the antidote to despair.",
    author: "Joan Baez",
    category: 'pomodoro'
  },

  // ======================
  // CLOCK MODE QUOTES (20)
  // ======================
  {
    text: "Time is what we want most, but what we use worst.",
    author: "William Penn",
    category: 'clock'
  },
  {
    text: "The future depends on what you do today.",
    author: "Mahatma Gandhi",
    category: 'clock'
  },
  {
    text: "Time you enjoy wasting is not wasted time.",
    author: "Marthe Troly-Curtin",
    category: 'clock'
  },
  {
    text: "Yesterday is gone. Tomorrow has not yet come. We have only today.",
    author: "Mother Teresa",
    category: 'clock'
  },
  {
    text: "The two most powerful warriors are patience and time.",
    author: "Leo Tolstoy",
    category: 'clock'
  },
  {
    text: "Time is free, but it's priceless. You can't own it, but you can use it.",
    author: "Harvey MacKay",
    category: 'clock'
  },
  {
    text: "Time flies over us, but leaves its shadow behind.",
    author: "Nathaniel Hawthorne",
    category: 'clock'
  },
  {
    text: "Your time is limited, don't waste it living someone else's life.",
    author: "Steve Jobs",
    category: 'clock'
  },
  {
    text: "Time is the most valuable thing a man can spend.",
    author: "Theophrastus",
    category: 'clock'
  },
  {
    text: "The present moment is the only time over which we have dominion.",
    author: "Thich Nhat Hanh",
    category: 'clock'
  },
  {
    text: "Don't waste your time in anger, regrets, worries, and grudges. Life is too short.",
    author: "Roy T. Bennett",
    category: 'clock'
  },
  {
    text: "Time stays long enough for anyone who will use it.",
    author: "Leonardo da Vinci",
    category: 'clock'
  },
  {
    text: "Better three hours too soon than a minute too late.",
    author: "William Shakespeare",
    category: 'clock'
  },
  {
    text: "Time is a created thing. To say 'I don't have time' is to say 'I don't want to'.",
    author: "Lao Tzu",
    category: 'clock'
  },
  {
    text: "The trouble is, you think you have time.",
    author: "Buddha",
    category: 'clock'
  },
  {
    text: "How we spend our days is how we spend our lives.",
    author: "Annie Dillard",
    category: 'clock'
  },
  {
    text: "Time moves slowly, but passes quickly.",
    author: "Alice Walker",
    category: 'clock'
  },
  {
    text: "The only reason for time is so that everything doesn't happen at once.",
    author: "Albert Einstein",
    category: 'clock'
  },
  {
    text: "Time and tide wait for no man.",
    author: "Geoffrey Chaucer",
    category: 'clock'
  },
  {
    text: "An inch of time is an inch of gold, but you can't buy that inch of time with an inch of gold.",
    author: "Chinese Proverb",
    category: 'clock'
  },

  // ======================
  // BODY FOCUS QUOTES (25)
  // ======================
  {
    text: "The body achieves what the mind believes.",
    author: "Jim Kwik",
    category: 'body'
  },
  {
    text: "Take care of your body. It's the only place you have to live.",
    author: "Jim Rohn",
    category: 'body'
  },
  {
    text: "Physical fitness is not only one of the most important keys to a healthy body, it is the basis of dynamic and creative intellectual activity.",
    author: "John F. Kennedy",
    category: 'body'
  },
  {
    text: "A healthy outside starts from the inside.",
    author: "Robert Urich",
    category: 'body'
  },
  {
    text: "Movement is a medicine for creating change in a person's physical, emotional, and mental states.",
    author: "Carol Welch",
    category: 'body'
  },
  {
    text: "Your body can stand almost anything. It's your mind that you have to convince.",
    author: "Andrew Murphy",
    category: 'body'
  },
  {
    text: "Strength does not come from physical capacity. It comes from an indomitable will.",
    author: "Mahatma Gandhi",
    category: 'body'
  },
  {
    text: "The only bad workout is the one that didn't happen.",
    author: "Unknown",
    category: 'body'
  },
  {
    text: "To keep the body in good health is a duty, otherwise we shall not be able to keep the mind strong and clear.",
    author: "Buddha",
    category: 'body'
  },
  {
    text: "Exercise is a celebration of what your body can do, not a punishment for what you ate.",
    author: "Unknown",
    category: 'body'
  },
  {
    text: "The human body is the best picture of the human soul.",
    author: "Ludwig Wittgenstein",
    category: 'body'
  },
  {
    text: "Reading is to the mind what exercise is to the body.",
    author: "Joseph Addison",
    category: 'body'
  },
  {
    text: "A strong body makes the mind strong.",
    author: "Thomas Jefferson",
    category: 'body'
  },
  {
    text: "The groundwork of all happiness is health.",
    author: "Leigh Hunt",
    category: 'body'
  },
  {
    text: "He who has health, has hope; and he who has hope, has everything.",
    author: "Thomas Carlyle",
    category: 'body'
  },
  {
    text: "Fitness is not about being better than someone else. It's about being better than you used to be.",
    author: "Khloe Kardashian",
    category: 'body'
  },
  {
    text: "Your health is an investment, not an expense.",
    author: "Unknown",
    category: 'body'
  },
  {
    text: "The pain you feel today will be the strength you feel tomorrow.",
    author: "Unknown",
    category: 'body'
  },
  {
    text: "Do something today that your future self will thank you for.",
    author: "Sean Patrick Flanery",
    category: 'body'
  },
  {
    text: "A one hour workout is only 4% of your day. No excuses.",
    author: "Unknown",
    category: 'body'
  },
  {
    text: "Strive for progress, not perfection.",
    author: "Unknown",
    category: 'body'
  },
  {
    text: "You don't have to be extreme, just consistent.",
    author: "Unknown",
    category: 'body'
  },
  {
    text: "The last three or four reps is what makes the muscle grow.",
    author: "Arnold Schwarzenegger",
    category: 'body'
  },
  {
    text: "Dead last finish is greater than did not finish, which trumps did not start.",
    author: "Unknown",
    category: 'body'
  },
  {
    text: "Sweat is magic. Cover yourself in it daily to grant your wishes.",
    author: "Unknown",
    category: 'body'
  },

  // ======================
  // MEDITATION QUOTES (25)
  // ======================
  {
    text: "Meditation is not evasion; it is a serene encounter with reality.",
    author: "Thich Nhat Hanh",
    category: 'meditation'
  },
  {
    text: "The thing about meditation is you become more and more you.",
    author: "David Lynch",
    category: 'meditation'
  },
  {
    text: "Meditation brings wisdom; lack of meditation leaves ignorance.",
    author: "Buddha",
    category: 'meditation'
  },
  {
    text: "Within you, there is a stillness and a sanctuary to which you can retreat at any time.",
    author: "Hermann Hesse",
    category: 'meditation'
  },
  {
    text: "Meditation is the tongue of the soul and the language of our spirit.",
    author: "Jeremy Taylor",
    category: 'meditation'
  },
  {
    text: "The mind is everything. What you think, you become.",
    author: "Buddha",
    category: 'meditation'
  },
  {
    text: "Quiet the mind and the soul will speak.",
    author: "Ma Jaya Sati Bhagavati",
    category: 'meditation'
  },
  {
    text: "Peace comes from within. Do not seek it without.",
    author: "Buddha",
    category: 'meditation'
  },
  {
    text: "In the midst of movement and chaos, keep stillness inside of you.",
    author: "Deepak Chopra",
    category: 'meditation'
  },
  {
    text: "Meditation is the discovery that the point of life is always arrived at in the immediate moment.",
    author: "Alan Watts",
    category: 'meditation'
  },
  {
    text: "The best meditation is effortless. The best meditation is a gentle awareness.",
    author: "Maxime Lagacé",
    category: 'meditation'
  },
  {
    text: "Meditation is the ultimate mobile device; you can use it anywhere, anytime, unobtrusively.",
    author: "Sharon Salzberg",
    category: 'meditation'
  },
  {
    text: "Your calm mind is the ultimate weapon against your challenges.",
    author: "Bryant McGill",
    category: 'meditation'
  },
  {
    text: "Meditation is a way for nourishing and blossoming the divinity within you.",
    author: "Amit Ray",
    category: 'meditation'
  },
  {
    text: "The goal of meditation isn't to control your thoughts, it's to stop letting them control you.",
    author: "Unknown",
    category: 'meditation'
  },
  {
    text: "Meditation is the art of doing nothing.",
    author: "Naval Ravikant",
    category: 'meditation'
  },
  {
    text: "Learn to be calm and you will always be happy.",
    author: "Paramahansa Yogananda",
    category: 'meditation'
  },
  {
    text: "Meditation is not a way of making your mind quiet. It is a way of entering into the quiet that is already there.",
    author: "Deepak Chopra",
    category: 'meditation'
  },
  {
    text: "Meditation is the secret of all growth in spiritual life and knowledge.",
    author: "James Allen",
    category: 'meditation'
  },
  {
    text: "Half an hour's meditation each day is essential, except when you are busy. Then a full hour is needed.",
    author: "Saint Francis de Sales",
    category: 'meditation'
  },
  {
    text: "The more regularly and the more deeply you meditate, the sooner you will find yourself acting always from a center of peace.",
    author: "J. Donald Walters",
    category: 'meditation'
  },
  {
    text: "Through meditation and by giving full attention to one thing at a time, we can learn to direct attention where we choose.",
    author: "Eknath Easwaran",
    category: 'meditation'
  },
  {
    text: "Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.",
    author: "Thich Nhat Hanh",
    category: 'meditation'
  },
  {
    text: "Do not let the behavior of others destroy your inner peace.",
    author: "Dalai Lama",
    category: 'meditation'
  },
  {
    text: "Breath is the bridge which connects life to consciousness.",
    author: "Thich Nhat Hanh",
    category: 'meditation'
  },

  // ======================
  // GENERAL QUOTES (30)
  // ======================
  {
    text: "Do not wait; the time will never be 'just right.' Start where you stand.",
    author: "Napoleon Hill",
    category: 'general'
  },
  {
    text: "The journey of a thousand miles begins with one step.",
    author: "Lao Tzu",
    category: 'general'
  },
  {
    text: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt",
    category: 'general'
  },
  {
    text: "The only impossible journey is the one you never begin.",
    author: "Tony Robbins",
    category: 'general'
  },
  {
    text: "Don't limit your challenges. Challenge your limits.",
    author: "Unknown",
    category: 'general'
  },
  {
    text: "Progress, not perfection.",
    author: "Unknown",
    category: 'general'
  },
  {
    text: "Small steps every day.",
    author: "Unknown",
    category: 'general'
  },
  {
    text: "You are capable of more than you know.",
    author: "Glinda, The Wizard of Oz",
    category: 'general'
  },
  {
    text: "Be stronger than your excuses.",
    author: "Unknown",
    category: 'general'
  },
  {
    text: "One day or day one. You decide.",
    author: "Unknown",
    category: 'general'
  },
  {
    text: "The best time to plant a tree was 20 years ago. The second best time is now.",
    author: "Chinese Proverb",
    category: 'general'
  },
  {
    text: "What you get by achieving your goals is not as important as what you become by achieving your goals.",
    author: "Zig Ziglar",
    category: 'general'
  },
  {
    text: "If you can dream it, you can do it.",
    author: "Walt Disney",
    category: 'general'
  },
  {
    text: "Everything you've ever wanted is on the other side of fear.",
    author: "George Addair",
    category: 'general'
  },
  {
    text: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt",
    category: 'general'
  },
  {
    text: "It always seems impossible until it's done.",
    author: "Nelson Mandela",
    category: 'general'
  },
  {
    text: "Don't be pushed around by the fears in your mind. Be led by the dreams in your heart.",
    author: "Roy T. Bennett",
    category: 'general'
  },
  {
    text: "Hard work beats talent when talent doesn't work hard.",
    author: "Tim Notke",
    category: 'general'
  },
  {
    text: "I never dreamed about success. I worked for it.",
    author: "Estée Lauder",
    category: 'general'
  },
  {
    text: "Opportunities don't happen. You create them.",
    author: "Chris Grosser",
    category: 'general'
  },
  {
    text: "Try not to become a person of success, but rather try to become a person of value.",
    author: "Albert Einstein",
    category: 'general'
  },
  {
    text: "The only limit to our realization of tomorrow will be our doubts of today.",
    author: "Franklin D. Roosevelt",
    category: 'general'
  },
  {
    text: "Don't let yesterday take up too much of today.",
    author: "Will Rogers",
    category: 'general'
  },
  {
    text: "You learn more from failure than from success. Don't let it stop you.",
    author: "Unknown",
    category: 'general'
  },
  {
    text: "It's not whether you get knocked down, it's whether you get up.",
    author: "Vince Lombardi",
    category: 'general'
  },
  {
    text: "If you are working on something that you really care about, you don't have to be pushed.",
    author: "Steve Jobs",
    category: 'general'
  },
  {
    text: "People who are crazy enough to think they can change the world, are the ones who do.",
    author: "Rob Siltanen",
    category: 'general'
  },
  {
    text: "Failure will never overtake me if my determination to succeed is strong enough.",
    author: "Og Mandino",
    category: 'general'
  },
  {
    text: "We may encounter many defeats but we must not be defeated.",
    author: "Maya Angelou",
    category: 'general'
  },
  {
    text: "Knowing is not enough; we must apply. Wishing is not enough; we must do.",
    author: "Johann Wolfgang von Goethe",
    category: 'general'
  },
];

/**
 * Get quotes filtered by category
 * Includes general quotes with category-specific quotes
 */
export const getQuotesByCategory = (category: FocusQuote['category']): FocusQuote[] => {
  const categoryQuotes = FOCUS_QUOTES.filter(q => q.category === category);
  const generalQuotes = FOCUS_QUOTES.filter(q => q.category === 'general');
  return [...categoryQuotes, ...generalQuotes];
};

/**
 * Get a random quote from a specific category
 */
export const getRandomQuote = (category: FocusQuote['category']): FocusQuote => {
  const quotes = getQuotesByCategory(category);
  if (quotes.length === 0) {
    throw new Error(`No quotes available for category: ${category}`);
  }
  return quotes[Math.floor(Math.random() * quotes.length)]!;
};

/**
 * Get all quotes (useful for testing)
 */
export const getAllQuotes = (): FocusQuote[] => {
  return FOCUS_QUOTES;
};

/**
 * Get quote count by category
 */
export const getQuoteCount = (category?: FocusQuote['category']): number => {
  if (!category) return FOCUS_QUOTES.length;
  return FOCUS_QUOTES.filter(q => q.category === category).length;
};
