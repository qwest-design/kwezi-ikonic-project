import { contactDetails } from "@/content/pages";
import { socialLinks } from "@/content/social";

const link =
  "underline decoration-bone/30 underline-offset-[6px] transition-[text-decoration-color] duration-(--duration-ui) hover:decoration-signal-bright " +
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal-bright";

/** Emails, phone and social profiles. Networks without a URL in content/social.ts are left out. */
export function ContactDetails() {
  return (
    <address className="flex flex-col gap-s4 not-italic">
      <div className="flex flex-col gap-s1">
        <h2 className="type-label text-mist">Email</h2>
        {contactDetails.emails.map((e) => (
          <a key={e} href={`mailto:${e}`} className={`text-body ${link}`}>
            {e}
          </a>
        ))}
      </div>
      <div className="flex flex-col gap-s1">
        <h2 className="type-label text-mist">Phone</h2>
        <a href={`tel:${contactDetails.phone.tel}`} className={`text-body ${link}`}>
          {contactDetails.phone.display}
        </a>
      </div>
      {socialLinks.length > 0 && (
        <div className="flex flex-col gap-s1">
          <h2 className="type-label text-mist">Follow</h2>
          <ul className="flex flex-wrap gap-x-s3 gap-y-s1">
            {socialLinks.map((s) => (
              <li key={s.key} className="text-body">
                <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`Ikonic on ${s.label}`} className={link}>
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </address>
  );
}
