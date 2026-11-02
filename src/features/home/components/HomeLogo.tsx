import '@/features/home/components/HomeLogo.css'

// The full logo (symbol and wordmark) as the large title on the photo hero. It is the version for dark
// backgrounds (light artwork) in light mode too, because the photo and its dark gradient sit behind it.
export default function HomeLogo() {
  return <img className="home-logo" src="/logo/slomic-full-dark.svg" alt="Slomic Smarthytte" />
}
