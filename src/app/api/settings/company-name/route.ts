import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const setting = await db.systemSettings.findUnique({
      where: { key: 'company_name' }
    })
    
    return NextResponse.json({ 
      companyName: setting?.value || 'OrgChart AI' 
    })
  } catch (error) {
    console.error('Error fetching company name:', error)
    // Return default on error to not break UI
    return NextResponse.json({ companyName: 'OrgChart AI' })
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { companyName } = await req.json()
    
    if (!companyName || typeof companyName !== 'string') {
      return NextResponse.json({ error: 'Invalid company name' }, { status: 400 })
    }

    const setting = await db.systemSettings.upsert({
      where: { key: 'company_name' },
      update: { value: companyName },
      create: { 
        key: 'company_name', 
        value: companyName,
        description: 'The display name of the organization'
      }
    })
    
    return NextResponse.json({ companyName: setting.value })
  } catch (error) {
    console.error('Error saving company name:', error)
    return NextResponse.json({ error: 'Failed to save company name' }, { status: 500 })
  }
}
