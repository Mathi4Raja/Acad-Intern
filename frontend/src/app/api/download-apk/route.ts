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

    // Production: use GitHub token to resolve the signed CDN URL, then redirect
    // the browser there directly — avoids proxying 60 MB through Vercel.
    const token = process.env.GITHUB_TOKEN;
    const response = await fetch(GITHUB_APK_URL, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        redirect: "manual",
    });

    const signedUrl = response.headers.get("location");
    if (!signedUrl) {
        return new NextResponse("APK not available", { status: 502 });
    }

    return NextResponse.redirect(signedUrl);
}
