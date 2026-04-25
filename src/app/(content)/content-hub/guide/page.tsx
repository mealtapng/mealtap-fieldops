import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ContentGuidePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const role = user.user_metadata?.role as string
  if (role !== 'admin' && role !== 'content_manager') redirect('/dashboard')

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-green-100 sticky top-0 z-20">
        <Link href="/content-hub" className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-gray-300 transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </Link>
        <h1 className="text-lg font-bold" style={{ color: '#2D5A27' }}>Content Strategy Guide</h1>
      </div>

      <div className="px-6 py-6 max-w-3xl space-y-8">

        {/* Mission */}
        <div className="bg-white rounded-2xl border border-green-100 px-6 py-5">
          <h2 className="text-base font-bold text-gray-900 mb-2">Monthly Theme</h2>
          <p className="text-xl font-bold text-green-700 italic">&ldquo;Nigeria&apos;s Restaurants, One Tap Away&rdquo;</p>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
            Every piece of content ties back to this single idea: Mealtap connects Nigeria&apos;s best local restaurants to customers in seconds.
            Always include a clear CTA — follow us, visit your nearest restaurant, or share with a friend.
          </p>
          <div className="mt-3 p-3 bg-green-50 rounded-xl">
            <p className="text-xs font-bold text-green-800">📱 WhatsApp number to include in ≥3 posts/week</p>
            <p className="text-lg font-bold text-green-700 mt-0.5">09111122229</p>
          </div>
        </div>

        {/* Content Pillars */}
        <div className="bg-white rounded-2xl border border-green-100 px-6 py-5">
          <h2 className="text-base font-bold text-gray-900 mb-4">Content Pillars</h2>
          <div className="space-y-3">
            {[
              { pct: '25%', label: 'The Problem',   color: '#EF4444', desc: 'Electricity purchase pain points — NEPA struggles, queue stress, billing issues' },
              { pct: '25%', label: 'The Solution',  color: '#1B5E20', desc: 'How Mealtap solves it via WhatsApp — fast, simple, no-app needed' },
              { pct: '20%', label: 'Social Proof',  color: '#2563EB', desc: 'User testimonials, agent stories, UGC — real people, real results' },
              { pct: '15%', label: 'Education',     color: '#7C3AED', desc: 'How-to guides, DISCO explainers, tips for staying powered up' },
              { pct: '15%', label: 'Brand & Culture', color: '#D97706', desc: 'Team behind Mealtap, Nigerian identity, language (Pidgin/Yoruba)' },
            ].map(p => (
              <div key={p.label} className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-sm" style={{ background: p.color }}>
                  {p.pct}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{p.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4-Week Calendar */}
        <div className="bg-white rounded-2xl border border-green-100 px-6 py-5">
          <h2 className="text-base font-bold text-gray-900 mb-4">4-Week Content Themes</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { week: 'Week 1', theme: 'Awareness', desc: 'Introduce the idea. Hook, demo, problem/solution.' },
              { week: 'Week 2', theme: 'Education', desc: 'Build understanding. How-tos, walkthroughs, FAQs.' },
              { week: 'Week 3', theme: 'Conversion', desc: 'Drive action. CTAs, promos, testimonials.' },
              { week: 'Week 4', theme: 'Retention', desc: 'Build loyalty. Tips, community, referrals, recap.' },
            ].map(w => (
              <div key={w.week} className="bg-green-50 rounded-xl p-3 border border-green-100">
                <p className="text-xs font-bold text-green-700 mb-0.5">{w.week}</p>
                <p className="text-sm font-bold text-gray-900">{w.theme}</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Daily posting schedule */}
        <div className="bg-white rounded-2xl border border-green-100 px-6 py-5">
          <h2 className="text-base font-bold text-gray-900 mb-4">Daily Posting Schedule</h2>
          <div className="space-y-2">
            {[
              { day: 'Monday',    type: 'Motivation + weekly theme intro',   caption: 'Your light bill just became a conversation' },
              { day: 'Tuesday',   type: 'Educational content',              caption: 'Follow these 3 easy steps' },
              { day: 'Wednesday', type: 'Product feature highlight',        caption: 'No queues. No stress.' },
              { day: 'Thursday',  type: 'User testimonial / social proof',  caption: '"This saved me time!"' },
              { day: 'Friday',    type: 'Fun / engagement post',            caption: "We've all been here 😂" },
              { day: 'Saturday',  type: 'Recap / behind the scenes',        caption: 'Built for you' },
              { day: 'Sunday',    type: 'Week ahead teaser',                caption: 'Stay powered always' },
            ].map(d => (
              <div key={d.day} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="w-24 text-xs font-bold text-green-700 flex-shrink-0">{d.day}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">{d.type}</p>
                  <p className="text-xs text-gray-400 italic">{d.caption}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform guidelines */}
        <div className="bg-white rounded-2xl border border-green-100 px-6 py-5">
          <h2 className="text-base font-bold text-gray-900 mb-4">Platform Guidelines</h2>
          <div className="space-y-4">
            {[
              {
                name: '📸 Instagram', priority: 'Primary', color: '#E1306C',
                freq: '6 posts/week', times: '9am and 6pm',
                tips: ['Reels and carousels perform best', 'Use 5–8 hashtags per post', 'Stories for daily touchpoints', 'Caption up to 2,200 chars'],
              },
              {
                name: '🎵 TikTok', priority: 'Primary', color: '#69C9D0',
                freq: '4–5 posts/week', times: '12pm and 7pm',
                tips: ['15–30 second videos', 'Use trending sounds', 'Relatable, fast-paced content', 'Subtitles recommended'],
              },
              {
                name: '🐦 X / Twitter', priority: 'Secondary', color: '#1DA1F2',
                freq: 'Daily', times: '8am and 5pm',
                tips: ['Keep under 280 characters', 'Thread format for education', 'Quick news and product updates', 'Engage replies and mentions'],
              },
              {
                name: '👥 Facebook', priority: 'Secondary', color: '#1877F2',
                freq: '3–4 posts/week', times: '10am',
                tips: ['Share IG content here', 'Longer captions OK', 'Post to community groups', 'Video performs well'],
              },
              {
                name: '💼 LinkedIn', priority: 'Tertiary', color: '#0A66C2',
                freq: '2 posts/week', times: '9am weekdays',
                tips: ['Professional and thought-leadership tone', 'Founder stories, partnerships', 'Investor-facing content', 'Keep visuals clean'],
              },
            ].map(p => (
              <div key={p.name} className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3" style={{ background: p.color + '15' }}>
                  <div>
                    <p className="text-sm font-bold" style={{ color: p.color }}>{p.name}</p>
                    <p className="text-xs text-gray-500">{p.freq} · Post at {p.times}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    p.priority === 'Primary' ? 'bg-green-100 text-green-700' :
                    p.priority === 'Secondary' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{p.priority}</span>
                </div>
                <ul className="px-4 py-3 space-y-1">
                  {p.tips.map(t => (
                    <li key={t} className="text-xs text-gray-600 flex items-start gap-1.5">
                      <span className="text-green-500 mt-0.5">•</span>{t}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Key principles */}
        <div className="bg-white rounded-2xl border border-green-100 px-6 py-5">
          <h2 className="text-base font-bold text-gray-900 mb-4">Key Principles</h2>
          <ul className="space-y-2.5">
            {[
              'Every post should answer: "Why should I use Mealtap?"',
              'Content tone is simple, warm, and Nigerian. Avoid corporate language.',
              'Always include a clear CTA: save the number, start a chat, or share with a friend.',
              'Memes and relatable content build reach. Demos and tutorials build trust. CTAs build users.',
              'Track performance weekly. Double down on what works. Cut what does not.',
              'The WhatsApp number (09111122229) must appear in at least 3 posts per week.',
            ].map(p => (
              <li key={p} className="flex items-start gap-2.5 text-sm text-gray-700">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>
                {p}
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  )
}
