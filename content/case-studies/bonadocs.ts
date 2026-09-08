import type { CaseStudy } from "./types";
import { LOOPS, MEDIA } from "./media.generated";

/**
 * Condensed from praise.framer.website/case-studies/eliminating-context-
 * switching-with-the-bonadocs-widget.
 *
 * The source opens with a scene-setting narrative about "Alex", an invented
 * developer. Kept, but compressed: it earns its place by making the cost of a
 * tab switch concrete, and it stops earning it at three paragraphs.
 */
export const bonadocs: CaseStudy = {
  slug: "bonadocs",
  client: "Bonadocs",
  sector: "Developer tools",
  chipLabel: "Bonadocs Design",
  title: "A tab switch costs a train of thought. Testing smart contracts inside the docs.",
  hook: "“Switching between my code editor, testing environment, and documentation is a huge hassle. It breaks my concentration every time.” One of eight Web3 developers, JTBD interviews.",
  role: "Product Designer",
  scope: "Research, product design.",
  timeline: "Sep to Oct 2023",
  icon: "/assets/client-icons/bonadocs.webp",
  cover: {
    src: "/assets/covers/bonadocs.webp",
    alt: "Bonadocs case study cover",
    width: 712,
    height: 400,
  },
  blocks: [
    { type: "heading", id: "background", railLabel: "Background", text: "The cost of a tab switch" },
    {
      type: "prose",
      text: "A Web3 developer integrating Lido into their dApp needs to test contract functions as they read. Without somewhere to do that in the page, the work splinters: open a separate testing environment, move between tabs, rebuild your place each time you come back. One Slack message and the thread is gone.",
    },
    { type: "image", media: MEDIA["bonadocs/01-hero"] },
    {
      type: "prose",
      text: "That is a productivity problem for the developer and an adoption problem for whoever wrote the documentation. Every interruption between reading and testing is a chance to give up on the integration. Bonadocs wanted the testing to happen where the reading already was.",
    },
    { type: "loop", media: LOOPS["bonadocs/02-widget-in-docs"] },

    { type: "heading", id: "research", railLabel: "Research", text: "Eight developers, one recurring complaint" },
    {
      type: "prose",
      text: "We ran Jobs-to-be-Done interviews with eight Web3 developers from mid-sized blockchain companies, averaging five years in software and two in Web3, working across Solidity, JavaScript, React, Node, MetaMask, Truffle, Remix and Ganache. The questions were about their day rather than about the widget: what they were trying to get done, and what got in the way.",
    },
    { type: "image", media: MEDIA["bonadocs/03-user-interview"] },
    { type: "subheading", text: "What they told us" },
    {
      type: "prose",
      text: "Testing was not an occasional task, it was continuous. “Testing smart contracts is a constant part of my workflow. I need to ensure each function works as expected before moving on.” And the tooling around it was the friction, not the testing itself: “It feels like I spend more time managing tools than actually coding.”",
    },
    {
      type: "quote",
      text: "If I could test smart contracts directly in the docs, it would streamline my workflow and reduce the cognitive load of switching between tools.",
    },
    { type: "image", media: MEDIA["bonadocs/04-journey-map"] },
    {
      type: "prose",
      text: "Mapping the journey put the breaks in one picture. Every one of them sat at a boundary between two tools, and none of them were about the contract logic. That is what told us the widget was worth building: the problem was entirely in the seams.",
    },

    { type: "heading", id: "decisions", railLabel: "Decisions", text: "An interface that fits inside someone else's page" },
    {
      type: "prose",
      text: "Embedding an interactive testing environment inside Lido's documentation raised four questions we could not answer up front. Would a widget disrupt the reading experience it sat in? Could it be intuitive enough to use without a learning curve? How should it handle complex transaction parameters? And was querying the mainnet directly from a documentation page even feasible, let alone safe?",
    },
    { type: "subheading", text: "Prototype rough, test early" },
    {
      type: "prose",
      text: "We clustered the first round of usability feedback with affinity diagramming to find the themes underneath individual complaints, then moved fast into low fidelity. The Bonadocs design system already existed, which meant prototypes could be assembled rather than drawn, and tested with users while they were still cheap to throw away.",
    },
    { type: "gallery", items: [MEDIA["bonadocs/05-affinity-diagram"], MEDIA["bonadocs/06-sketches"]] },
    { type: "gallery", items: [MEDIA["bonadocs/07-wireframes"], MEDIA["bonadocs/08-moodboard"]] },
    { type: "image", media: MEDIA["bonadocs/09-first-hifi"] },
    { type: "loop", media: LOOPS["bonadocs/10-userflow-first"] },

    { type: "subheading", text: "What the second round changed" },
    {
      type: "prose",
      text: "Round two tested six specific changes: transaction parameters entered inside the widget rather than elsewhere, a mainnet query option for real simulations, a wallet connection flow with a visible connected state, tooltips describing what each method parameter does, a tab view for constant transaction parameters like From, Gas and Gas price, and a clear visual split between read and write methods.",
    },
    { type: "image", media: MEDIA["bonadocs/11-round-two-feedback"] },
    {
      type: "prose",
      text: "Participants singled out the same thing: being able to test a method in the page they were reading, against the live network, without arranging anything first.",
    },
    { type: "loop", media: LOOPS["bonadocs/12-userflow-revised"] },

    { type: "subheading", text: "Querying the mainnet from the documentation" },
    {
      type: "prose",
      text: "Connecting a wallet and running against mainnet is what makes the result trustworthy. A test that only proves the shape of a call is a test you still have to repeat somewhere else before you ship.",
    },
    { type: "loop", media: LOOPS["bonadocs/13-mainnet-query"] },
    { type: "subheading", text: "Array properties, so real contracts fit" },
    {
      type: "prose",
      text: "Methods that take tuples of parameters are ordinary in production contracts and impossible to express in a simple form. Supporting arrays is what moved the widget from demo to usable.",
    },
    { type: "loop", media: LOOPS["bonadocs/14-array-properties"] },
    { type: "subheading", text: "Method and transaction parameters, kept apart" },
    {
      type: "prose",
      text: "The two sets of parameters do different jobs and get confused constantly. Separating them into tabs removed a whole class of error without needing to explain anything.",
    },
    { type: "loop", media: LOOPS["bonadocs/15-parameter-tabs"] },

    { type: "heading", id: "outcome", railLabel: "Outcome", text: "Now shipping in other people's documentation" },
    {
      type: "metrics",
      items: [
        { value: "7+", label: "Protocols using it, including Arbitrum, Optimism, Compound and Base" },
        { value: "Fellowship", label: "Selected for the maiden Consensys program" },
      ],
    },
    { type: "image", media: MEDIA["bonadocs/16-consensys-fellowship"] },
    {
      type: "prose",
      text: "The widget is now used and supported by Arbitrum, Superfluid, Compound Finance, Optimism, Base and Paycrest among others, and the work was selected for the first Consensys fellowship. Adoption by protocol teams is the honest measure here: they only embed it if it makes their own documentation better.",
    },

    { type: "heading", id: "reflection", railLabel: "Reflection", text: "The best place for a tool is where the work already is" },
    {
      type: "prose",
      text: "Nothing about this made testing smarter. It made it local. The widget does what a separate testing environment already did, in the one place the developer was already looking, and that turned out to be the entire value.",
    },
    {
      type: "prose",
      text: "It also had to be a good guest. The widget lives inside documentation somebody else owns and maintains, which set a hard limit on how much room it could take and how much it could assume. Designing to be unobtrusive in someone else's product is a different discipline from designing your own.",
    },
  ],
};
