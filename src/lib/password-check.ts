/**
 * Check if a password has been found in known data breaches
 * using the Have I Been Pwned API with k-anonymity.
 * Only the first 5 chars of the SHA-1 hash are sent to the API.
 */
export async function isPasswordPwned(password: string): Promise<{ pwned: boolean; count: number }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();

  const prefix = hashHex.slice(0, 5);
  const suffix = hashHex.slice(5);

  const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    headers: { "Add-Padding": "true" },
  });

  if (!response.ok) {
    // If API is down, allow the password (don't block user)
    return { pwned: false, count: 0 };
  }

  const text = await response.text();
  const lines = text.split("\n");

  for (const line of lines) {
    const [hashSuffix, countStr] = line.split(":");
    if (hashSuffix.trim() === suffix) {
      const count = parseInt(countStr.trim(), 10);
      if (count > 0) return { pwned: true, count };
    }
  }

  return { pwned: false, count: 0 };
}
