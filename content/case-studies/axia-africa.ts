import type { CaseStudy } from "./types";
import { MEDIA } from "./media.generated";

/**
 * Praise's draft, used as written. The only edits are the ones the house style
 * test forces: en dashes in the timeline and the two "1-2 months" ranges.
 *
 * No `hook`: the draft carries no quoted line from the work, and a hook is
 * never invented.
 */
export const axiaAfrica: CaseStudy = {
  slug: "axia-africa",
  client: "Axia Africa",
  sector: "Edtech",
  chipLabel: "Axia Africa Design",
  title: "From live teaching to a hybrid learning system.",
  role: "Silent Co-Founder, Product Design Lead",
  scope: "Product Design, AI Content Production, Operations",
  timeline: "December to June",
  icon: "/assets/client-icons/axia-africa.webp",
  cover: {
    src: "/assets/covers/axia-africa.webp",
    alt: "Axia Africa case study cover",
    width: 712,
    height: 400,
  },
  blocks: [
    { type: "heading", id: "background", railLabel: "Background", text: "A growth problem disguised as a teaching model." },
    {
      type: "prose",
      text: "Axia Africa was built around live teaching. Students learned through scheduled classes with mentors, but the model had a ceiling: we could only run as many cohorts as our mentors could support.",
    },
    {
      type: "prose",
      text: "Fewer cohorts meant fewer opportunities to grow revenue. Moving to a hybrid model was the obvious next step, but it meant changing more than how students learned.",
    },
    {
      type: "prose",
      text: "We needed to restructure the company around a new delivery model, produce the course materials within 1-2 months, and redesign the product to support the transition.",
    },
    { type: "prose", text: "I was brought back in as a silent co-founder to lead the project." },

    { type: "heading", id: "the-break", railLabel: "The break", text: "Three things standing in the way of a hybrid model." },
    { type: "subheading", text: "Limited cohort capacity" },
    {
      type: "prose",
      text: "Our live teaching model depended heavily on mentor availability. This limited the number of cohorts we could run in a year, which also limited our revenue potential.",
    },
    { type: "subheading", text: "A new learning experience" },
    {
      type: "prose",
      text: "Students would now learn through a combination of self-paced video and article lessons, live classes, and assignments. The product needed to support this new relationship between learning formats.",
    },
    { type: "subheading", text: "Content production at scale" },
    {
      type: "prose",
      text: "We needed to produce materials for 10 courses. Creating all the videos and articles manually would take too long, so we explored AI-supported production to bring the timeline down to 1-2 months.",
    },

    { type: "heading", id: "decisions", railLabel: "Decisions", text: "Structure first, then production." },
    {
      type: "prose",
      text: "I led a team of 3 designers, including myself, across the product redesign. In parallel, I built a repeatable content production workflow and worked through the scheduling constraints that would make the hybrid model possible.",
    },
    { type: "subheading", text: "Redesigning the learning experience" },
    {
      type: "prose",
      text: "We started with feedback forms and mentor interviews to understand what the new model needed to support.",
    },
    {
      type: "prose",
      text: "From there, we defined product requirements and focused on the core pages and flows that would shape the student experience.",
    },
    { type: "image", media: MEDIA["axia-africa/01-onboarding"] },
    { type: "image", media: MEDIA["axia-africa/02-course-page"] },
    {
      type: "prose",
      text: "I led the wireframing and product design direction, while setting up a new UI system for the team to work from in parallel.",
    },
    {
      type: "prose",
      text: "The visual direction combined a fresh, minimal interface with vibrant, retro-futuristic illustrations built around an academy setting. The illustrations were generated with Midjourney, while the UI was designed to give them room without making the product feel overwhelming.",
    },
    { type: "image", media: MEDIA["axia-africa/03-illustrations"] },
    { type: "subheading", text: "Building a repeatable AI video production workflow" },
    {
      type: "prose",
      text: "The content production challenge was not just about making videos faster. We needed a process that mentors and future contributors could repeat.",
    },
    {
      type: "prose",
      text: "I created a script framework for mentors to produce their lessons across 10 courses. I reviewed the scripts before production and established a workflow that combined AI-generated talking heads, voiceovers, motion design, stock footage, and video editing.",
    },
    { type: "prose", text: "The process looked like this:" },
    {
      type: "prose",
      text: "Mentor scripts → AI talking heads → Voiceovers → Motion design → Video editing → Finished lessons",
    },
    {
      type: "prose",
      text: "For suitable courses, I generated human-like models with varying outfits and backgrounds, then converted them into talking heads using HeyGen's V3 model.",
    },
    { type: "image", media: MEDIA["axia-africa/04-video-lesson"] },
    {
      type: "prose",
      text: "ElevenLabs was used for separate male voiceovers, while Jitter handled motion design, intro animations, and code snippets. CapCut brought everything together with sound effects and music.",
    },
    {
      type: "drive",
      id: "1QAOmo-bDyAs9tHDxu3gbJNyyn0PBhrty",
      title: "Backend Development, Lesson 1",
      width: 1920,
      height: 1080,
    },
    {
      type: "prose",
      text: "I also documented the process so it could be repeated beyond the initial production sprint.",
    },
    { type: "image", media: MEDIA["axia-africa/05-video-page"] },
    { type: "subheading", text: "Designing for mentor capacity" },
    { type: "prose", text: "The last part of the transition was scheduling." },
    {
      type: "prose",
      text: "We explored different models based on student and mentor availability, live class frequency, and the relationship between modules and monthly timelines.",
    },
    { type: "prose", text: "We settled on a framework built around hard constraints:" },
    {
      type: "list",
      items: [
        "Consistent weekly time slots that favored students.",
        "A maximum number of cohorts based on mentor capacity.",
        "Out-of-office windows and emergency contingencies.",
      ],
    },
    {
      type: "prose",
      text: "The goal was to make the hybrid model predictable for students and sustainable for mentors.",
    },
    { type: "image", media: MEDIA["axia-africa/06-schedule-and-quiz"] },

    { type: "heading", id: "outcome", railLabel: "Outcome", text: "A simpler product, with a new way to deliver education." },
    {
      type: "prose",
      text: "The first hybrid cohort launched in June, following a six-month transition from project kickoff in December.",
    },
    {
      type: "prose",
      text: "The redesigned product supported the new learning model, while the content production workflow and scheduling framework gave Axia a repeatable foundation for delivering courses.",
    },
    { type: "prose", text: "The result was a middle ground between student experience and business growth." },

    { type: "heading", id: "reflection", railLabel: "Reflection", text: "Clarity comes before everything else." },
    { type: "subheading", text: "Standardization is what makes speed repeatable." },
    {
      type: "prose",
      text: "The video production workflow became more effective once we established clear standards for color coding, video titles, motion presets, and applications. The lesson was simple: AI tools can accelerate production, but a framework is what makes the output consistent.",
    },
    { type: "subheading", text: "Clarity should come before diversity." },
    {
      type: "prose",
      text: "Early feedback showed that the HeyGen V3 voice library had limited diversity. I initially prioritized diversity, which came at the expense of clarity in the first few videos. That was the wrong tradeoff. If students cannot clearly understand the lesson, the quality of the voice does not matter.",
    },
    { type: "subheading", text: "Transitions need to be designed, not assumed." },
    {
      type: "prose",
      text: "Students wanted an easier transition from the live teaching model into hybrid learning. We had focused on building the new system but overlooked the experience of moving people into it. The next time, I would treat the transition itself as a core product problem.",
    },
    {
      type: "prose",
      text: "The hybrid model was not just a product redesign. It was a shift in how Axia delivered education, and the work required aligning the product, content, and operations around that change.",
    },
  ],
};
