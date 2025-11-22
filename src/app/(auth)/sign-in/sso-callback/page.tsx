import { SignIn } from '@clerk/nextjs'

export default function SSOCallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-bg via-black/20 to-brand-bg">
      <div className="absolute inset-0 opacity-40" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C4F82A' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>

      <div className="relative">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Signing you in...
          </h1>
          <p className="text-gray-400">
            Please wait while we complete your authentication
          </p>
        </div>

        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-accent to-[#A8D622] rounded-lg blur opacity-20"></div>
          <div className="relative">
            <SignIn 
              appearance={{
                elements: {
                  rootBox: 'mx-auto',
                  card: 'bg-gray-900/50 backdrop-blur-sm border border-white/12',
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 