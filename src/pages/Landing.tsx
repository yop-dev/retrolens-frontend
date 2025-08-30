import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { ArrowRight, Camera, ChevronLeft, ChevronRight, MessageCircle, Star, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CustomSignIn } from '../components/CustomSignIn'
import { ClerkSignInModal } from '../components/ClerkSignInModal'
import type { PageComponent } from '@/types'

// Import local images
import leicaImage from '../assets/images/leica.png'
import hasselbladImage from '../assets/images/hasselblad.png'
import nikonImage from '../assets/images/nikon.png'
import leicaCollectionImage from '../assets/images/leica-collection.png'
import filmCamerasImage from '../assets/images/film-cameras.png'
import japaneseImage from '../assets/images/japanese.png'

// Import video background
import bgVideo from '../assets/videos/bg.mp4'
import bgVideo1 from '../assets/videos/landingbg.mp4'


// Featured cameras with local images
const featuredCameras = [
  { 
    id: 1, 
    name: 'Leica M3', 
    year: '1954', 
    image: leicaImage 
  },
  { 
    id: 2, 
    name: 'Hasselblad 500C', 
    year: '1957', 
    image: hasselbladImage 
  },
  { 
    id: 3, 
    name: 'Nikon F', 
    year: '1959', 
    image: nikonImage 
  },
];

const recentCollections = [
  { 
    id: 1, 
    name: 'Leica Collection', 
    count: 12,
    image: leicaCollectionImage
  },
  { 
    id: 2, 
    name: 'Film Cameras', 
    count: 8,
    image: filmCamerasImage
  },
  { 
    id: 3, 
    name: 'Japanese Classics', 
    count: 15,
    image: japaneseImage
  },
];

export const Landing: PageComponent = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [_isPlaying, _setIsPlaying] = useState(true);
  const [_bgVideo, _setBgVideo] = useState<HTMLVideoElement | null>(null);
  const [_bgVideo1, _setBgVideo1] = useState<HTMLVideoElement | null>(null);
  const [showSignIn, setShowSignIn] = useState(false)
  const [isAutoScrolling, setIsAutoScrolling] = useState(true)
  // Toggle this to test different sign-in components
  const useCustomSignIn = true // Set to false to use Clerk's component

  // Auto-scroll functionality
  useEffect(() => {
    if (!isAutoScrolling) {return}

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredCameras.length)
    }, 4000) // Change slide every 4 seconds

    return () => clearInterval(interval)
  }, [isAutoScrolling])

  const nextSlide = () => {
    setIsAutoScrolling(false) // Stop auto-scroll when user interacts
    setCurrentSlide((prev) => (prev + 1) % featuredCameras.length)
    
    // Resume auto-scroll after 10 seconds of inactivity
    setTimeout(() => setIsAutoScrolling(true), 10000)
  }

  const prevSlide = () => {
    setIsAutoScrolling(false) // Stop auto-scroll when user interacts
    setCurrentSlide((prev) => (prev - 1 + featuredCameras.length) % featuredCameras.length)
    
    // Resume auto-scroll after 10 seconds of inactivity
    setTimeout(() => setIsAutoScrolling(true), 10000)
  }

  const goToSlide = (index: number) => {
    setIsAutoScrolling(false) // Stop auto-scroll when user interacts
    setCurrentSlide(index)
    
    // Resume auto-scroll after 10 seconds of inactivity
    setTimeout(() => setIsAutoScrolling(true), 10000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Background Pattern Overlay */}
      <div 
        className="fixed inset-0 opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fbbf24' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      <SignedOut>
        <div className="relative z-10 container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            {/* Featured Camera Card */}
            <div className="bg-white/80 backdrop-blur-sm border border-amber-200 rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="relative overflow-hidden rounded-t-lg">
                  <div className="aspect-[4/3] relative group">
                    <img
                      src={featuredCameras[currentSlide].image}
                      alt={featuredCameras[currentSlide].name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent group-hover:from-black/10 transition-colors duration-300" />
                    
                    {/* Carousel Navigation */}
                    <button
                      onClick={prevSlide}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-amber-600 rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextSlide}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-amber-600 rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {featuredCameras[currentSlide].name}
                      </h3>
                      <p className="text-amber-600 font-medium">
                        {featuredCameras[currentSlide].year}
                      </p>
                    </div>
                    <span className="bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                      Featured
                    </span>
                  </div>
                  
                  {/* Dots Indicator */}
                  <div className="flex justify-center gap-2 pt-2">
                    {featuredCameras.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`h-2 w-2 rounded-full transition-all duration-200 ${
                          index === currentSlide
                            ? 'bg-amber-600 w-8'
                            : 'bg-amber-200 hover:bg-amber-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
            </div>

            {/* Welcome Section */}
            <div className="space-y-8">
              <div className="space-y-4 text-center lg:text-left">
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 text-balance">
                  Welcome to <span className="text-amber-600">RetroLens</span>
                </h1>
                <p className="text-xl text-gray-600 text-pretty">
                  The Premier Community for Vintage Camera Enthusiasts
                </p>
              </div>

              <div className="space-y-4">
                <button
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center"
                  onClick={() => setShowSignIn(true)}
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                      <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                      <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                      <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                      <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                    </g>
                  </svg>
                  Get Started with Google
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 px-2 text-gray-500">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Link
                  to="/discover"
                  className="w-full border-2 border-amber-200 hover:bg-amber-50 px-4 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center text-amber-700"
                >
                  <Camera className="mr-2 h-5 w-5" />
                  Browse as Guest
                </Link>
              </div>

              {/* Feature List */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-amber-100">
                <div className="text-center space-y-2">
                  <Users className="h-8 w-8 text-amber-600 mx-auto" />
                  <p className="text-sm font-medium text-gray-700">5000+</p>
                  <p className="text-xs text-gray-500">Collectors</p>
                </div>
                <div className="text-center space-y-2">
                  <Star className="h-8 w-8 text-amber-600 mx-auto" />
                  <p className="text-sm font-medium text-gray-700">Expert</p>
                  <p className="text-xs text-gray-500">Reviews</p>
                </div>
                <div className="text-center space-y-2">
                  <MessageCircle className="h-8 w-8 text-amber-600 mx-auto" />
                  <p className="text-sm font-medium text-gray-700">Active</p>
                  <p className="text-xs text-gray-500">Discussions</p>
                </div>
              </div>
            </div>
          </div>

          {/* Collections Grid */}
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-gray-900">Popular Collections</h2>
              <p className="text-gray-600">Explore curated collections from our community</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {recentCollections.map((collection) => (
                <div
                  key={collection.id}
                  className="bg-white/80 backdrop-blur-sm border border-amber-200 rounded-lg hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden"
                >
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={collection.image}
                      alt={collection.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900">{collection.name}</h3>
                    <p className="text-sm text-amber-600">{collection.count} cameras</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-white/90 backdrop-blur-sm border border-amber-200 rounded-lg shadow-xl p-8 text-center space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Welcome Back!</h2>
            <p className="text-gray-600">Redirecting to your dashboard...</p>
            <Link
              to="/feed"
              className="inline-flex items-center bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              Go to Feed
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </SignedIn>

      {showSignIn && (
        useCustomSignIn ? (
          <CustomSignIn onClose={() => setShowSignIn(false)} />
        ) : (
          <ClerkSignInModal onClose={() => setShowSignIn(false)} />
        )
      )}
    </div>
  )
}
