const { google } = require("googleapis");
const { upsertTokens } = require("./db");

const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.coursework.me",
];

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

function getAuthUrl(sessionId) {
  return createOAuthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state: sessionId,
  });
}

async function handleOAuthCallback(code, jid) {
  const { tokens } = await createOAuthClient().getToken(code);
  await upsertTokens(jid, tokens.access_token, tokens.refresh_token);
}

async function getCourses(accessToken, refreshToken) {
  const auth = createOAuthClient();
  auth.setCredentials({ access_token: accessToken, refresh_token: refreshToken });

  const { data } = await google
    .classroom({ version: "v1", auth })
    .courses.list({ courseStates: ["ACTIVE"], pageSize: 20 });

  return data.courses || [];
}

function formatCourseList(courses) {
  if (!courses.length) return "No active courses found in Google Classroom.";
  return "Your classes:\n\n" + courses.map((c, i) => `${i + 1}. ${c.name}`).join("\n");
}

module.exports = { getAuthUrl, handleOAuthCallback, getCourses, formatCourseList };
