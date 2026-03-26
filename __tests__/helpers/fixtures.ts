/**
 * Shared test fixtures for unit tests.
 */

/** Sample business data matching the shape used by generation pipelines. */
export const sampleBusinessData = {
  businessName: 'Acme Plumbing',
  industry: 'plumbing',
  location: 'Austin, TX',
  phone: '(512) 555-0199',
  email: 'info@acmeplumbing.com',
  description: 'Professional plumbing services in Austin, TX.',
  services: ['Drain cleaning', 'Water heater installation', 'Pipe repair'],
  hours: 'Mon-Fri 8am-6pm',
  testimonials: [
    { name: 'Jane D.', text: 'Great service!', rating: 5 },
  ],
}

/** Minimal valid React component that passes validation after preprocessing. */
export const sampleGeneratedCode = `
import { Star, Phone, MapPin } from 'lucide-react'

export default function GeneratedPage() {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="text-xl font-bold">Acme Plumbing</span>
          <button className="md:hidden" onClick={() => setOpen(!open)}>Menu</button>
        </div>
      </nav>
      <section className="min-h-[90vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-5xl font-bold">Acme Plumbing</h1>
          <p className="mt-4 text-lg text-gray-600">Professional plumbing services in Austin, TX.</p>
          <button className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-lg">Get a Quote</button>
        </div>
      </section>
      <section className="py-16 px-4">
        <h2 className="text-3xl font-bold text-center mb-8">Our Services</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="p-6 border rounded-lg"><h3>Drain Cleaning</h3></div>
          <div className="p-6 border rounded-lg"><h3>Water Heater Installation</h3></div>
          <div className="p-6 border rounded-lg"><h3>Pipe Repair</h3></div>
        </div>
      </section>
      <section className="py-16 bg-gray-50 px-4">
        <h2 className="text-3xl font-bold text-center mb-8">About Us</h2>
        <p className="max-w-2xl mx-auto text-center text-gray-600">We have been serving Austin for over 20 years.</p>
      </section>
      <section className="py-16 px-4">
        <h2 className="text-3xl font-bold text-center mb-8">What Our Customers Say</h2>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-current text-amber-400" />
          </div>
          <p className="mt-2 text-gray-600">Great service!</p>
          <p className="mt-1 font-semibold">Jane D.</p>
        </div>
      </section>
      <section className="py-16 bg-blue-600 text-white text-center px-4">
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <button className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold">Contact Us</button>
      </section>
      <footer className="py-8 bg-gray-900 text-gray-400 text-center">
        <p>&copy; 2024 Acme Plumbing. All rights reserved.</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <MapPin className="h-4 w-4" /> Austin, TX
          <Phone className="h-4 w-4" /> (512) 555-0199
        </div>
      </footer>
    </div>
  )
}
`

/** Sample project record matching the Supabase projects table shape. */
export const sampleProject = {
  id: 'test-project-001',
  user_id: 'user-abc-123',
  business_name: 'Acme Plumbing',
  slug: 'acme-plumbing',
  status: 'completed' as const,
  generated_code: sampleGeneratedCode,
  business_data: sampleBusinessData,
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-01-15T10:05:00Z',
}
