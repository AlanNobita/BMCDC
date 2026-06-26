import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    // Count users from profiles table (auto-created on signup)
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    
    if (error) throw error
    
    return NextResponse.json({ count: count ?? 0 })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}
