import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div className="absolute inset-0 opacity-40" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%238b5cf6' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <div className="relative">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Join <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">OrgChart AI</span>
          </h1>
          <p className="text-slate-400">
            Powered by the divine wisdom of artificial intelligence
          </p>
        </div>
        
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-20"></div>
          <div className="relative">
            <SignUp 
              appearance={{
                elements: {
                  rootBox: 'mx-auto',
                  card: 'bg-gray-900/50 backdrop-blur-sm border border-purple-500/20',
                }
              }}
              routing="path"
              path="/sign-up"
            />
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-400">
            💡 <strong>Pro tip:</strong> You can connect your Google account later in settings for calendar features
          </p>
        </div>
      </div>
    </div>
  )
} 