import { NextResponse } from "next/server";
import fs from "fs";

const GITHUB_APK_URL =
    "https://github.com/Mathi4Raja/Acad-Intern/releases/download/mobile-latest/acad-intern.apk";

export async function GET() {
    // Local dev override: set APK_PATH in .env.local to serve the file directly
    const localPath = process.env.APK_PATH;
    if (localPath && fs.existsSync(localPath)) {
        const stat = fs.statSync(localPath);
        const fileStream = fs.createReadStream(localPath);

        const readableStream = new ReadableStream({
            start(controller) {
                fileStream.on("data", (chunk) => controller.enqueue(chunk));
                fileStream.on("end", () => controller.close());
                fileStream.on("error", (err) => controller.error(err));
            },
            cancel() {
                fileStream.destroy();
            },
        });

        return new NextResponse(readableStream, {
            headers: {
                "Content-Type": "application/vnd.android.package-archive",
                "Content-Disposition": 'attachment; filename="acad-intern.apk"',
                "Content-Length": stat.size.toString(),
            },
        });
    }

    // Production: redirect to the GitHub Release asset (served from GitHub's CDN)
    return NextResponse.redirect(GITHUB_APK_URL);
}
