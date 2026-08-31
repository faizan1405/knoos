/**
 * POST /api/auth/register
 *
 * Admin self-registration endpoint.
 * Allows the first Google-authenticated user with admin email to create an admin record.
 * In production, restrict by email domain or require a secret token.
 */
export async function POST() {
  // Registration is handled entirely by Google OAuth.
  // Admin privileges are assigned by updating the user record in the database.
  // This endpoint exists as a placeholder for any future registration logic.
  return Response.json(
    { message: "Registration is handled via Google Sign-In." },
    { status: 200 }
  );
}
