import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use · UniSwap",
};

const sections = [
  {
    title: "1. Who can use UniSwap",
    body: "UniSwap is a student-to-student marketplace for the LAUTECH campus community. You must be old enough to enter into a binding agreement and be part of the local student community to sign up. By creating an account or using the service, you agree to these terms.",
  },
  {
    title: "2. The marketplace is between users",
    body: "UniSwap is a platform that helps students list, find, and arrange purchases with each other. UniSwap is not a buyer, seller, or provider of the items listed, and it is not a party to any transaction. All sales are made directly between the buyer and the seller, at their own risk.",
  },
  {
    title: "3. What you can list",
    body: "You may only list items that you own or are allowed to sell, that are legal to sell, and that you can physically hand over at a pickup on or near campus. You must describe items honestly, including their condition, and use only your own photos.",
  },
  {
    title: "4. Prohibited items and conduct",
    body: "Do not list items that are illegal, dangerous, counterfeit, stolen, or that promote violence, discrimination, or fraud. Do not mislead buyers, spam, attempt scams or phishing, share other people's private information, or use UniSwap to harass anyone. We may remove any listing or report we consider to violate these rules.",
  },
  {
    title: "5. Listings are sold \"as is\"",
    body: "Except where local law requires otherwise, items are offered \"as is\" — in the condition described by the seller. UniSwap does not guarantee the quality, safety, or fitness of any item. You should inspect items before paying and agree on pickups and condition directly with the seller.",
  },
  {
    title: "6. Your account",
    body: "You are responsible for keeping your account secure and for everything done through it. Do not share your sign-in code or password. If you believe your account has been compromised, contact us. You may close your account at any time from the Account page.",
  },
  {
    title: "7. Our moderation rights",
    body: "We may investigate reports of misuse, hide or remove listings, suspend accounts, or decline transactions that we reasonably believe break these terms or harm the community. We generally act on reports of spam, scams, and inappropriate content.",
  },
  {
    title: "8. Disclaimers and liability",
    body: "UniSwap is provided \"as is\" and \"as available\". To the extent permitted by law, UniSwap is not liable for losses arising from transactions between users, including failed sales, disputes, damaged or misrepresented items, or the actions of other users. Nothing in these terms limits liability that cannot be limited by law.",
  },
  {
    title: "9. Changes to these terms",
    body: "We may update these terms from time to time. Continued use of UniSwap after changes take effect means you accept the updated terms. We will try to give reasonable notice of significant changes on the site.",
  },
  {
    title: "10. Contact",
    body: "If you have questions about these terms, reach out to the UniSwap team through the contact details in our Privacy Policy.",
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/"
        className="text-sm font-medium text-brand-600 hover:underline"
      >
        ← Back to UniSwap
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        Terms of Use
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Last updated: August 2026
      </p>
      <div className="mt-8 space-y-8">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="text-lg font-semibold text-neutral-900">
              {s.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              {s.body}
            </p>
          </section>
        ))}
      </div>
      <p className="mt-10 text-xs text-neutral-400">
        These Terms are a plain-English summary maintained by the UniSwap team
        and are not formal legal advice.
      </p>
    </div>
  );
}
