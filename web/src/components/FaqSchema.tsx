/**
 * The FAQ as structured data.
 *
 * The questions already on the page are what someone actually asks about this
 * product, and marking them up is what lets a search engine or an AI answer
 * engine quote a single answer rather than guessing at the page. Invisible to
 * a reader; it mirrors the visible content exactly, which is the condition for
 * it being allowed at all.
 */

const QA: [string, string][] = [
  [
    "Why not a QR code or a hologram?",
    "Every authenticity label on the market today is visual, and anything you can see you can photograph and print again. The Veymark chip holds a secret that never appears on any screen: it proves it has the key without ever showing it, so there is nothing to copy. The passport on Solana then proves the record was not changed after the part left the line.",
  ],
  [
    "What about a part that can be opened and have its insides swapped?",
    "That is the first thing people from the industry raise: a battery with the original housing and a different cell inside. Two things answer it. The tag is applied across the opening of the part, so opening it breaks the antenna and the tag stops responding. And for parts like that, the manufacturer records which components are inside, each with its own tag, so the verification screen shows what should be in there.",
  ],
  [
    "What happens if someone clones the chip?",
    "A genuine NXP chip carries a factory signature the phone checks before anything else runs, so a cheap clone fails immediately. Cloning the silicon itself means fabricating authentic NXP parts — that is not a counterfeiter with a printer, that is a semiconductor operation. And even then, each tap must produce a code that has never been used; replaying a captured one fails.",
  ],
  [
    "So it's impossible to fake?",
    "No, and we won't say it is. Someone can build a parallel fake ecosystem: their own site, their own tags, their own distribution. No system in any industry removes that. What we remove is the easy attack — photograph the label, reprint it — which is how counterfeit parts are authenticated today. What's left is expensive, traceable and prosecutable.",
  ],
  [
    "Why blockchain? Couldn't this be a normal database?",
    "A database works until the question becomes 'who do I trust to run it'. A manufacturer verifying against our private server is trusting us; a buyer verifying against the manufacturer's server is trusting them. On Solana the record is public: anyone reads it in a block explorer and checks it against the manufacturer's public wallet, without our site being involved at all.",
  ],
  [
    "Why Solana and not another chain?",
    "Because every individual part becomes its own token, and that only works where minting costs close to nothing. Compressed NFTs make a passport per unit economically viable down to a $200 shock absorber. On most other networks the issuance cost alone rules out anything but luxury goods.",
  ],
  [
    "Does the buyer need an app or a wallet?",
    "No. They hold the phone near the part, the browser opens on its own, and the answer appears. No install, no account, no wallet. The chain is underneath, not in front.",
  ],
  [
    "What if the tag is damaged or the part isn't registered?",
    "The screen says we could not verify it — never that it is counterfeit. A damaged tag and a fake tag look identical to software, and accusing a legitimate buyer of holding a fake is a worse failure than saying we don't know. From there we send them to the manufacturer's official channel.",
  ],
  [
    "Where can I see it working?",
    "The demo is at veymark.xyz/demo. It runs the factory writing a tag, a workshop verifying a part, and three attacks — a reprinted label, a replayed tap, an opened part — each one failing in front of you. It runs against the real system, on devnet. What does not exist yet is physical tags: the chips are renders and a simulator produces the same payloads. Nothing has shipped and nobody has tested it in the field.",
  ],
];

const data = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: QA.map(([question, answer]) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
};

export default function FaqSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
