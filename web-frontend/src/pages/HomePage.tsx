// src/pages/HomePage.tsx
import { Link } from 'react-router-dom'
import { ArrowRightIcon, CubeIcon, PhotoIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { useGalleries } from '@/hooks/useGallery'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/utils/constants'
import Button from '@/components/common/Button'
import { SkeletonCard } from '@/components/common/Spinner'
import FeaturedArtists from '@/components/featured/FeaturedArtists'
import RecentlyViewed from '@/components/recently/RecentlyViewed'
import ArtworkOfTheDay from '@/components/artwork/ArtworkOfTheDay';

// ──────────────────────────────────────────────────────────────────────────────
// Feature cards data
// ──────────────────────────────────────────────────────────────────────────────
const features = [
  {
    icon: <CubeIcon className="h-6 w-6" />,
    title: '3D Virtual Galleries',
    description:
      'Walk through beautifully lit 3D gallery spaces. Every artist gets their own customisable room.',
  },
  {
    icon: <PhotoIcon className="h-6 w-6" />,
    title: 'Showcase Your Work',
    description:
      'Upload paintings, sculptures, photography, and digital art. Arrange them exactly where you want.',
  },
  {
    icon: <SparklesIcon className="h-6 w-6" />,
    title: 'AI-Powered Descriptions',
    description:
      'Struggling to write about your art? Let AI suggest evocative descriptions based on your work.',
  },
]

export default function HomePage() {
  const { isAuthenticated, isArtist } = useAuthStore()
  const { data: galleriesData, isLoading } = useGalleries(1, 3)

  return (
    <div className="min-h-screen">
      {/* ──────────────────────────────────────────────────────────────────────────
      1. HERO SECTION
      ────────────────────────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-[90vh] flex items-center justify-center overflow-hidden px-4"
        aria-label="Hero"
      >
        <div className="absolute inset-0 bg-gallery-gradient" aria-hidden="true" />
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gallery-200/40 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 text-center max-w-3xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-gallery-200 text-gallery-700 text-xs font-semibold mb-6 shadow-sm backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-gallery-500 animate-pulse" />
            Now in open beta — free for art students
          </div>

          <h1 className="heading-display text-5xl sm:text-6xl lg:text-7xl text-stone-900 mb-6 leading-tight">
            Your art deserves a <span className="text-gradient">real gallery</span>
          </h1>

          <p className="text-lg text-stone-600 mb-10 max-w-xl mx-auto leading-relaxed">
            Build your personal 3D virtual gallery in minutes. Share it with the world. No coding.
            No rent.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!isAuthenticated ? (
              <>
                <Link to={ROUTES.REGISTER}>
                  <Button size="lg" rightIcon={<ArrowRightIcon className="h-4 w-4" />}>
                    Create your gallery
                  </Button>
                </Link>
                <Link to={ROUTES.BROWSE_GALLERIES}>
                  <Button size="lg" variant="secondary">
                    Browse galleries
                  </Button>
                </Link>
              </>
            ) : isArtist ? (
              <Link to={ROUTES.DASHBOARD}>
                <Button size="lg" rightIcon={<ArrowRightIcon className="h-4 w-4" />}>
                  Go to dashboard
                </Button>
              </Link>
            ) : (
              <Link to={ROUTES.BROWSE_GALLERIES}>
                <Button size="lg" rightIcon={<ArrowRightIcon className="h-4 w-4" />}>
                  Browse galleries
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 max-w-7xl mx-auto">
        <ArtworkOfTheDay />
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
      2. FEATURES SECTION
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white" aria-labelledby="features-heading">
        <div className="max-w-7xl mx-auto">
          <h2
            id="features-heading"
            className="heading-display text-3xl text-stone-900 text-center mb-4"
          >
            Everything you need to exhibit
          </h2>
          <p className="text-stone-500 text-center mb-12 max-w-lg mx-auto">
            All the tools a modern artist needs, built into one beautiful platform.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="glass-card p-6 flex flex-col gap-4 hover:shadow-card-hover transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gallery-100 to-purple-100 border border-gallery-200 flex items-center justify-center text-gallery-600">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-stone-800">{feature.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
      3. RECENTLY VIEWED SECTION
      ────────────────────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RecentlyViewed />
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
      4. FEATURED GALLERIES SECTION
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-stone-50" aria-labelledby="featured-heading">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 id="featured-heading" className="heading-display text-3xl text-stone-900">
                Featured galleries
              </h2>
              <p className="text-stone-500 mt-1 text-sm">Discover artists from around the world</p>
            </div>
            <Link
              to={ROUTES.BROWSE_GALLERIES}
              className="text-sm text-gallery-600 hover:text-gallery-700 font-medium flex items-center gap-1 transition-colors"
            >
              View all <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[0, 1, 2].map((index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleriesData?.galleries.map((gallery) => (
                <Link
                  key={gallery.artistId}
                  to={ROUTES.GALLERY(gallery.artistId)}
                  className="artwork-card group"
                >
                  <div className="aspect-[4/3] overflow-hidden relative bg-surface">
                    {gallery.featuredArtworks.length > 0 ? (
                      <div className="grid grid-cols-3 gap-0.5 h-full">
                        {gallery.featuredArtworks.slice(0, 3).map((artwork) => (
                          <img
                            key={artwork.id}
                            src={artwork.imageUrl}
                            alt={artwork.title}
                            className="object-cover w-full h-full"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700">
                        <PhotoIcon className="h-12 w-12" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-card-gradient opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-stone-800 group-hover:text-gallery-600 transition-colors">
                      {gallery.galleryName ?? 'Untitled Gallery'}
                    </h3>
                    <p className="text-sm text-stone-500 mt-0.5">
                      {gallery.displayName} · {gallery.artworkCount} work
                      {gallery.artworkCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
      5. FEATURED ARTISTS SECTION
      ────────────────────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <FeaturedArtists />
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
      6. CTA SECTION
      ────────────────────────────────────────────────────────────────────────── */}
      {!isAuthenticated && (
        <section className="py-24 px-4 text-center bg-gradient-to-br from-gallery-50 to-purple-50">
          <div className="max-w-xl mx-auto">
            <h2 className="heading-display text-3xl text-stone-900 mb-4">
              Ready to open your gallery?
            </h2>
            <p className="text-stone-500 mb-8 text-lg">
              Free for art students. No credit card required.
            </p>
            <Link to={ROUTES.REGISTER}>
              <Button size="lg">Start for free</Button>
            </Link>
          </div>
        </section>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
      7. FOOTER
      ────────────────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-stone-200 py-8 px-4 text-center text-sm text-stone-400 bg-white">
        <p>© {new Date().getFullYear()} Virtual Art Gallery. Built for art students everywhere.</p>
      </footer>
    </div>
  )
}