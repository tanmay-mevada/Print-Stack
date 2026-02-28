import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="p-8 font-sans">
      <h1 className="text-2xl font-bold mb-2">PrintStack++</h1>
      <p className="mb-8 text-gray-700">A platform to connect students with nearby print shops.</p>
      
      <nav className="space-y-4">
        <div>
          <Link href="/login" className="text-blue-600 underline">
            Go to Login
          </Link>
        </div>
        <div>
          <Link href="/signup" className="text-blue-600 underline">
            Create an Account
          </Link>
        </div>
      </nav>
    </div>
  )
}