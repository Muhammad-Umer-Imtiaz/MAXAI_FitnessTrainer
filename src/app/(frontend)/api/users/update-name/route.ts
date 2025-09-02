import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

// Define valid languages (adjust based on your schema)
const VALID_LANGUAGES = ['english', 'arabic', 'french', 'spanish', 'urdu'] // Add your supported languages

export async function POST(req: NextRequest) {
  try {
    const { email, firstName, lastName, language } = await req.json()
    console.log('Received data:', { email, firstName, lastName, language })

    // Validation
    if (!email || !firstName || !lastName || !language) {
      return NextResponse.json(
        { error: 'Email, first name, last name, and language are required' },
        { status: 400 },
      )
    }

    // Validate language value
    if (!VALID_LANGUAGES.includes(language)) {
      return NextResponse.json(
        { error: `Invalid language. Supported languages: ${VALID_LANGUAGES.join(', ')}` },
        { status: 400 },
      )
    }

    const payload = await getPayload({ config })

    // Find user by email
    const users = await payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      limit: 1,
    })

    if (users.docs.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = users.docs[0]

    // Update user
    const updatedUser = await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        language: language.trim(), // Also trim language
      },
    })

    console.log('Updated user:', updatedUser)

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        language: updatedUser.language,
      },
      message: 'Profile updated successfully',
    })
  } catch (error) {
    console.error('Error updating profile:', error)

    // More specific error handling
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 },
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
