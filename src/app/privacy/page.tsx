import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy · UniSwap",
};

const sections = [
  {
    title: "1. Who we are",
    body: "UniSwap is a student marketplace for the LAUTECH campus community. This policy explains what information we collect, why we collect it, and how it is handled.",
  },
  {
    title: "2. Information we collect",
    body: "To create an account you provide an email address, a phone number, and a password (or sign in with Google). You may optionally add a display name, a profile photo, a bio, and a default pickup location. If you list items, we store your listing details and photos. If you message another user or send a purchase request, we store those messages and requests.",
  },
  {
    title: "3. Why we collect it",
    body: "We use this information to run the service: to let you sign in, to show your profile and listings to other students, to let people message you and arrange purchases, to moderate content and prevent abuse, and to keep the platform safe.",
  },
  {
    title: "4. Where it's stored",
    body: "Your data is stored with our hosting providers (a hosted PostgreSQL database and cloud object storage) and served from our app hosting. Access is limited to what's needed to run the service.",
  },
  {
    title: "5. Google sign-in",
    body: "If you choose to sign in with Google, you authorise Google to share your name and verified email address with us. We use them to create and identify your account.",
  },
  {
    title: "6. Cookies and similar technologies",
    body: "UniSwap does not use advertising or analytics tracking cookies. To keep you signed in, we store a small sign-in token in your browser's local storage on your device (not in a cookie). This token is only used to authenticate you and is deleted when you log out or delete your account. Your browser's local storage stays on your device.",
  },
  {
    title: "7. How long we keep data",
    body: "We keep your account and its activity for as long as your account is active. When you delete your account from the Account page, we hide your profile and listings and anonymise your email and username so you can no longer be identified. Some records may be retained where needed for security, legal, or dispute purposes.",
  },
  {
    title: "8. Your rights",
    body: "You can update your profile from the Account page, delete your account there, and contact us to ask about or correct the data we hold. We respect your privacy rights under applicable law, including Nigeria's Data Protection Regulation (NDPR).",
  },
  {
    title: "9. Sharing with others",
    body: "Other students can see your public profile, display name, photo, bio, location, and the listings you post — that's how a marketplace works. We do not sell your personal information. We may share data with service providers who help us run the service, and only to the extent needed.",
  },
  {
    title: "10. Contact",
    body: "For any privacy question or request, please contact the UniSwap team. We're a student project, so we'll do our best to respond promptly and help.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/"
        className="text-sm font-medium text-brand-600 hover:underline"
      >
        ← Back to UniSwap
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        Privacy Policy
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
        This Privacy Policy is a plain-English summary maintained by the
        UniSwap team and is not formal legal advice.
      </p>
    </div>
  );
}
