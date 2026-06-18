import { createFileRoute } from '@tanstack/react-router'

import { MomentCard3D } from '#/components/moment-card-3d'
import { InfoPanel, PageIntro } from '#/components/route-state'
import { demoMomentCards } from '#/lib/moment-card-demo'

export const Route = createFileRoute('/moments/demo')({
  component: MomentsDemoRoute,
})

function MomentsDemoRoute() {
  const featured = demoMomentCards[8]

  return (
    <div className="space-y-5">
      <PageIntro
        eyebrow="Moment card system"
        title="Live slab demo"
        description="A collectible-first card system built in React and CSS with 360-degree rotation, a sealed photo chamber, premium slab depth, and variant styling for different memory types."
      />

      <section className="grid gap-5 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <MomentCard3D moment={featured} size="detail" />
        </div>

        <div className="space-y-5">
          <InfoPanel
            title="What this is proving"
            description="The slab uses a custom label system, sealed-photo treatment, live metadata panels, and a full back story layout so it reads like a collectible instead of a normal social post."
          />

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {demoMomentCards.map((moment) => (
              <MomentCard3D key={moment.id} moment={moment} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
