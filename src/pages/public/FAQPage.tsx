import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'

const faqs = [
  { q: 'How do I sign in?', a: 'Enter your college email (e.g., 23BCA001@gvpcdpgc.edu.in) and click "Send Sign-In Link". Check your email and click the link to sign in.' },
  { q: 'Why was my email rejected?', a: 'Only emails ending with @gvpcdpgc.edu.in are accepted. Personal Gmail, Yahoo, or other domains are not allowed.' },
  { q: 'I signed in but see "Pending Assignment" — what does that mean?', a: 'The admin needs to assign you to a bus. Complete your profile and wait for the admin to process your assignment. You will receive a notification.' },
  { q: 'How does live tracking work?', a: 'Your driver shares their GPS location using the Driver app. The student dashboard updates in real-time showing the bus on a map.' },
  { q: 'Can I install this as an app?', a: 'Yes! On mobile browsers, tap the "Add to Home Screen" option. On desktop, look for the install icon in the browser address bar.' },
  { q: 'Why can\'t I see the bus on the map?', a: 'The driver may not have started the trip yet, or GPS sharing may be turned off. The map shows "Offline" when no location is available.' },
  { q: 'How do I update my phone number?', a: 'Go to Profile page and update your phone number there.' },
  { q: 'What do I do if I have a problem?', a: 'Use the Contact page to reach the admin, or visit the college transport office directly.' },
]

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div className="max-w-2xl mx-auto px-6 py-16 animate-fade-in">
      <div className="text-center mb-10">
        <HelpCircle size={36} className="mx-auto mb-3" style={{ color: 'hsl(var(--brand-primary))' }} />
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'Hanken Grotesk', color: 'hsl(var(--text-primary))' }}>FAQ</h1>
      </div>
      <div className="space-y-2">
        {faqs.map((faq, i) => (
          <div key={i} className="card overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-5 text-left"
              onClick={() => setOpen(open === i ? null : i)}
            >
              <span className="font-medium text-sm pr-4" style={{ color: 'hsl(var(--text-primary))' }}>{faq.q}</span>
              <ChevronDown size={18} style={{ color: 'hsl(var(--text-muted))', transform: open === i ? 'rotate(180deg)' : '', transition: 'transform 0.2s', flexShrink: 0 }} />
            </button>
            {open === i && (
              <div className="px-5 pb-5 text-sm leading-relaxed" style={{ color: 'hsl(var(--text-secondary))' }}>
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
