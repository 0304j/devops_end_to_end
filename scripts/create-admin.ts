/**
 * Creates an admin account, or sets a new password if the e-mail exists.
 *
 *   npm run admin:create -- owner@example.com
 *
 * Prompts for the password (input hidden). For automation, pass it via the
 * ADMIN_PASSWORD environment variable instead.
 */
import { existsSync } from "node:fs";
import { createInterface } from "node:readline";
import pg from "pg";
import { hashPassword, MIN_PASSWORD_LENGTH } from "../src/lib/auth/password.ts";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

function promptHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const output = rl as unknown as {
      _writeToOutput: (text: string) => void;
      output: NodeJS.WriteStream;
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    // Hide typed characters after the prompt has been printed.
    output._writeToOutput = () => {};
  });
}

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("Usage: npm run admin:create -- <email>");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  let password = process.env.ADMIN_PASSWORD;
  if (!password) {
    password = await promptHidden(`Passwort für ${email} (mind. ${MIN_PASSWORD_LENGTH} Zeichen): `);
    const repeat = await promptHidden("Passwort wiederholen: ");
    if (password !== repeat) {
      console.error("Die Passwörter stimmen nicht überein.");
      process.exit(1);
    }
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`Das Passwort muss mindestens ${MIN_PASSWORD_LENGTH} Zeichen lang sein.`);
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const result = await client.query(
      `insert into admin_users (email, password_hash) values ($1, $2)
       on conflict (email) do update set password_hash = excluded.password_hash
       returning (xmax = 0) as created`,
      [email, await hashPassword(password)],
    );
    if (!result.rows[0].created) {
      // A new password should end existing sessions.
      await client.query(
        "delete from admin_sessions where user_id = (select id from admin_users where email = $1)",
        [email],
      );
    }
    console.log(
      result.rows[0].created ? `Admin ${email} angelegt.` : `Passwort für ${email} geändert.`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Fehler:", error instanceof Error ? error.message : error);
  process.exit(1);
});
