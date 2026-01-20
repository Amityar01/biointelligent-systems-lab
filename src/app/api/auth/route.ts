import { NextRequest, NextResponse } from 'next/server';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  // If no code, redirect to GitHub OAuth
  if (!code) {
    if (!GITHUB_CLIENT_ID) {
      return new NextResponse('Missing GITHUB_CLIENT_ID environment variable', { status: 500 });
    }

    const redirectUri = new URL('/api/auth', request.url).toString();
    const scope = 'repo,user';

    const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
    githubAuthUrl.searchParams.set('client_id', GITHUB_CLIENT_ID);
    githubAuthUrl.searchParams.set('redirect_uri', redirectUri);
    githubAuthUrl.searchParams.set('scope', scope);

    return NextResponse.redirect(githubAuthUrl.toString());
  }

  // Exchange code for access token
  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    return new NextResponse('Missing GitHub OAuth credentials', { status: 500 });
  }

  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return new NextResponse(`GitHub OAuth error: ${tokenData.error_description}`, { status: 400 });
    }

    const { access_token, token_type } = tokenData;

    // Return HTML that sends the token back to the CMS
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Authorization Complete</title>
</head>
<body>
  <script>
    (function() {
      function receiveMessage(e) {
        console.log("receiveMessage %o", e);
        window.opener.postMessage(
          'authorization:github:success:${JSON.stringify({ token: access_token, provider: 'github' })}',
          e.origin
        );
        window.close();
      }
      window.addEventListener("message", receiveMessage, false);
      window.opener.postMessage("authorizing:github", "*");
    })();
  </script>
  <p>Authorizing with GitHub...</p>
</body>
</html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('OAuth error:', error);
    return new NextResponse('OAuth authentication failed', { status: 500 });
  }
}
